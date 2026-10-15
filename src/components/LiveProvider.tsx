'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { getSupabase, supabaseConfigured } from '@/lib/supabase/client';
import { computeStats, isActive, rankAll, type Stats } from '@/lib/scoring';
import { distanceMi, getFix, type Fix } from '@/lib/geo';
import { CITIES, CITY_LIST, DEFAULT_CITY, type City } from '@/lib/city';
import { THEME_KEY, resolveTheme, type Theme, type ThemeMode } from '@/lib/theme';

const CITY_KEY = 'vibes.city';
/** Events farther than this from the selected city's center belong to another city. */
const CITY_RADIUS_MI = 60;
import { errorText, parseVibeError } from '@/lib/errors';
import {
  COMMENT_COLS, EVENT_COLS, POST_COLS,
  type CommentRow, type EventRow, type LatLng, type MyRating, type PostRow, type Profile, type RatingRow,
} from '@/lib/types';

const H = 3_600_000;
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

export type Sheet =
  | { kind: 'rate'; event: EventRow; token: string }
  | { kind: 'capture'; eventId?: string }
  | { kind: 'create' }
  | { kind: 'report'; target: 'comment' | 'post'; id: string; userId: string; username: string }
  | { kind: 'lightbox'; post: PostRow }
  | { kind: 'city' }
  | null;

export type Modal =
  | { kind: 'checking' }
  | { kind: 'gate'; code: string; detail?: string; event: EventRow; retry: () => void }
  | null;

type LoadStatus = 'loading' | 'ready' | 'error' | 'unconfigured';

interface LiveValue {
  status: LoadStatus;
  loadError: string | null;
  authReady: boolean;
  user: User | null;
  profile: Profile | null;
  setProfile: (p: Profile) => void;
  events: EventRow[];
  city: City;
  chooseCity: (id: string) => void;
  themeMode: ThemeMode;
  theme: Theme;
  setThemeMode: (m: ThemeMode) => void;
  eventById: (id: string) => EventRow | undefined;
  stats: Record<string, Stats>;
  rows: Record<string, RatingRow[]>;
  comments: Record<string, CommentRow[]>;
  posts: Record<string, PostRow[]>;
  now: number;
  userLoc: LatLng | null;
  dist: (e: EventRow) => number | null;
  saved: Set<string>;
  myRatings: Record<string, MyRating>;
  helped: Set<string>;
  reload: () => Promise<void>;
  refreshEvent: (id: string) => Promise<void>;
  fetchEvent: (id: string) => Promise<EventRow | null>;
  addEvent: (e: EventRow) => void;
  // actions
  requireLogin: () => boolean;
  verify: (ev: EventRow, retry: () => void) => Promise<string | null>;
  startRate: (ev: EventRow) => Promise<void>;
  openCapture: (eventId?: string) => void;
  openCreate: () => void;
  openReport: (target: 'comment' | 'post', id: string, userId: string, username: string) => void;
  openLightbox: (post: PostRow) => void;
  toggleSave: (id: string) => Promise<void>;
  toggleHelpful: (c: CommentRow) => Promise<void>;
  block: (userId: string) => Promise<void>;
  locate: (quiet?: boolean) => Promise<void>;
  share: (ev: EventRow) => Promise<void>;
  noteMyRating: (eventId: string, r: MyRating) => void;
  // layers
  sheet: Sheet;
  setSheet: (s: Sheet) => void;
  modal: Modal;
  setModal: (m: Modal) => void;
  toastMsg: string | null;
  toast: (msg: string) => void;
}

const LiveCtx = createContext<LiveValue | null>(null);

export function useLive() {
  const v = useContext(LiveCtx);
  if (!v) throw new Error('useLive must be used inside <LiveProvider>');
  return v;
}

function group<T extends { event_id: string }>(list: T[]): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const x of list) (out[x.event_id] ??= []).push(x);
  return out;
}

function mergeById<T extends { id: string; created_at: string }>(a: T[] = [], b: T[] = []): T[] {
  const m = new Map<string, T>();
  for (const x of a) m.set(x.id, x);
  for (const x of b) m.set(x.id, x);
  return [...m.values()].sort((x, y) => Date.parse(y.created_at) - Date.parse(x.created_at));
}

export function LiveProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<LoadStatus>(supabaseConfigured ? 'loading' : 'unconfigured');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [rows, setRows] = useState<Record<string, RatingRow[]>>({});
  const [rawComments, setComments] = useState<Record<string, CommentRow[]>>({});
  const [rawPosts, setPosts] = useState<Record<string, PostRow[]>>({});
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [myRatings, setMyRatings] = useState<Record<string, MyRating>>({});
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [helped, setHelped] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [city, setCity] = useState<City>(DEFAULT_CITY);
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [theme, setTheme] = useState<Theme>(() => resolveTheme('auto'));

  useEffect(() => {
    try {
      const m = localStorage.getItem(THEME_KEY) as ThemeMode | null;
      if (m === 'day' || m === 'night' || m === 'auto') setThemeMode(m);
    } catch {
      /* storage unavailable: follow the clock */
    }
  }, []);

  const chooseTheme = useCallback((m: ThemeMode) => {
    setThemeMode(m);
    try {
      localStorage.setItem(THEME_KEY, m);
    } catch {
      /* not saved; still applies now */
    }
  }, []);
  const cityChosen = useRef(false);

  useEffect(() => {
    try {
      const id = localStorage.getItem(CITY_KEY);
      if (id && CITIES[id]) {
        setCity(CITIES[id]);
        cityChosen.current = true;
      }
    } catch {
      /* storage unavailable: stay on the default city */
    }
  }, []);

  const chooseCity = useCallback((id: string) => {
    const c = CITIES[id];
    if (!c) return;
    setCity(c);
    cityChosen.current = true;
    try {
      localStorage.setItem(CITY_KEY, id);
    } catch {
      /* not saved; still switches for this visit */
    }
  }, []);

  /** First location fix picks the nearest supported city, unless the person already chose one. */
  const adoptNearestCity = useCallback((p: LatLng) => {
    if (cityChosen.current) return;
    let best: City | null = null, bestMi = 80;
    for (const c of CITY_LIST) {
      const d = distanceMi(p, c.center);
      if (d < bestMi) { best = c; bestMi = d; }
    }
    if (best) setCity(best);
  }, []);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef<User | null>(null);
  const eventIds = useRef<Set<string>>(new Set());
  const lastLoad = useRef(0);
  userRef.current = user;

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3400);
  }, []);

  // ------------------------------------------------------------ loading
  const loadPersonal = useCallback(async (u: User | null) => {
    const sb = getSupabase();
    if (!sb) return;
    if (!u) {
      setProfile(null); setSaved(new Set()); setMyRatings({}); setBlocked(new Set()); setHelped(new Set());
      return;
    }
    const [p, s, r, b, h] = await Promise.all([
      sb.from('profiles').select('id,username,bio,home_city,avatar_url').eq('id', u.id).maybeSingle(),
      sb.from('saves').select('event_id').eq('user_id', u.id),
      sb.from('ratings').select('event_id,vibe,worth,updated_at').eq('user_id', u.id).order('updated_at', { ascending: false }).limit(300),
      sb.from('blocks').select('blocked_id').eq('blocker_id', u.id),
      sb.from('helpful_votes').select('comment_id').eq('user_id', u.id).order('created_at', { ascending: false }).limit(500),
    ]);
    let prof = (p.data as Profile | null) ?? null;
    if (!prof && !p.error) {
      // Account predates its profile (e.g. signed up before setup): create it, then load it.
      await sb.rpc('ensure_my_profile');
      const again = await sb.from('profiles').select('id,username,bio,home_city,avatar_url').eq('id', u.id).maybeSingle();
      prof = (again.data as Profile | null) ?? null;
    }
    setProfile(prof);
    setSaved(new Set(((s.data ?? []) as { event_id: string }[]).map((x) => x.event_id)));
    const mr: Record<string, MyRating> = {};
    for (const x of (r.data ?? []) as { event_id: string; vibe: MyRating['vibe']; worth: boolean; updated_at: string }[]) {
      mr[x.event_id] = { vibe: x.vibe, worth: x.worth, at: x.updated_at };
    }
    setMyRatings(mr);
    setBlocked(new Set(((b.data ?? []) as { blocked_id: string }[]).map((x) => x.blocked_id)));
    setHelped(new Set(((h.data ?? []) as { comment_id: string }[]).map((x) => x.comment_id)));
  }, []);

  const reload = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    lastLoad.current = Date.now();
    const { data, error } = await sb
      .from('events').select(EVENT_COLS)
      .gt('ends_at', iso(-12 * H)).lt('starts_at', iso(8 * 24 * H))
      .order('starts_at').limit(400);
    if (error) {
      setLoadError(error.message);
      setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
      return;
    }
    const evs = (data ?? []) as EventRow[];
    const ids = evs.filter((e) => Date.parse(e.starts_at) <= Date.now()).map((e) => e.id).slice(0, 300);
    const empty = Promise.resolve({ data: [] as unknown[], error: null });
    const [r, c, p] = await Promise.all([
      ids.length ? sb.rpc('event_rating_rows', { p_events: ids }) : empty,
      ids.length
        ? sb.from('comments').select(COMMENT_COLS).in('event_id', ids).gt('created_at', iso(-8 * H)).order('created_at', { ascending: false }).limit(600)
        : empty,
      ids.length
        ? sb.from('posts').select(POST_COLS).in('event_id', ids).gt('created_at', iso(-12 * H)).order('created_at', { ascending: false }).limit(300)
        : empty,
    ]);
    setEvents((prev) => {
      const m = new Map(evs.map((e) => [e.id, e] as const));
      for (const e of prev) if (!m.has(e.id) && (e.visibility === 'unlisted' || Date.parse(e.ends_at) > Date.now() - 48 * H)) m.set(e.id, e);
      return [...m.values()];
    });
    if (!r.error) setRows((prev) => ({ ...prev, ...group((r.data ?? []) as RatingRow[]) }));
    if (!c.error) {
      const g = group((c.data ?? []) as CommentRow[]);
      setComments((prev) => {
        const out = { ...prev };
        for (const k in g) out[k] = mergeById(prev[k], g[k]);
        return out;
      });
    }
    if (!p.error) {
      const g = group((p.data ?? []) as PostRow[]);
      setPosts((prev) => {
        const out = { ...prev };
        for (const k in g) out[k] = mergeById(prev[k], g[k]);
        return out;
      });
    }
    setLoadError(null);
    setStatus('ready');
  }, []);

  const refreshEvent = useCallback(async (id: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const [r, c, p] = await Promise.all([
      sb.rpc('event_rating_rows', { p_events: [id] }),
      sb.from('comments').select(COMMENT_COLS).eq('event_id', id).order('created_at', { ascending: false }).limit(100),
      sb.from('posts').select(POST_COLS).eq('event_id', id).order('created_at', { ascending: false }).limit(60),
    ]);
    if (!r.error) setRows((prev) => ({ ...prev, [id]: (r.data ?? []) as RatingRow[] }));
    if (!c.error) setComments((prev) => ({ ...prev, [id]: (c.data ?? []) as CommentRow[] }));
    if (!p.error) setPosts((prev) => ({ ...prev, [id]: (p.data ?? []) as PostRow[] }));
  }, []);

  const addEvent = useCallback((e: EventRow) => {
    setEvents((prev) => [...prev.filter((x) => x.id !== e.id), e]);
  }, []);

  const fetchEvent = useCallback(async (id: string) => {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.rpc('get_event', { p_id: id });
    if (error || !data) return null;
    const e = data as EventRow;
    addEvent(e);
    return e;
  }, [addEvent]);

  useEffect(() => {
    eventIds.current = new Set(events.map((e) => e.id));
  }, [events]);

  // auth
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthReady(true);
      loadPersonal(data.user);
    });
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser((prev) => (prev?.id === u?.id ? prev : u));
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        // Defer: calling Supabase inside this callback can deadlock the auth lock.
        setTimeout(() => loadPersonal(u), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadPersonal]);

  // data + refresh cadence
  useEffect(() => {
    if (!supabaseConfigured) return;
    reload();
    const every = setInterval(() => {
      if (document.visibilityState === 'visible') reload();
    }, 120_000);
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        setNow(Date.now());
        if (Date.now() - lastLoad.current > 30_000) reload();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(every);
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reload]);

  // realtime: event_activity carries no user data, just "this event changed"
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const pending = new Map<string, ReturnType<typeof setTimeout>>();
    const ch = sb
      .channel('vibe-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_activity' }, (payload) => {
        const id = (payload.new as { event_id?: string } | null)?.event_id;
        if (!id || pending.has(id)) return;
        pending.set(
          id,
          setTimeout(() => {
            pending.delete(id);
            if (eventIds.current.has(id)) refreshEvent(id);
            else reload();
          }, 1200),
        );
      })
      .subscribe();
    return () => {
      pending.forEach(clearTimeout);
      sb.removeChannel(ch);
    };
  }, [refreshEvent, reload]);

  useEffect(() => {
    const t = resolveTheme(themeMode, new Date(now));
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  }, [themeMode, now]);

  // ------------------------------------------------------------ derived
  const dist = useCallback(
    (e: EventRow) => (e.lat == null || e.lng == null ? null : distanceMi(userLoc ?? city.center, { lat: e.lat, lng: e.lng })),
    [userLoc, city],
  );

  const stats = useMemo(() => {
    const o: Record<string, Stats> = {};
    for (const e of events) o[e.id] = computeStats(e, rows[e.id] ?? [], now);
    rankAll(events, o, dist, now);
    return o;
  }, [events, rows, now, dist]);

  const comments = useMemo(() => {
    if (!blocked.size) return rawComments;
    const o: Record<string, CommentRow[]> = {};
    for (const k in rawComments) o[k] = rawComments[k].filter((c) => !blocked.has(c.user_id));
    return o;
  }, [rawComments, blocked]);

  const posts = useMemo(() => {
    if (!blocked.size) return rawPosts;
    const o: Record<string, PostRow[]> = {};
    for (const k in rawPosts) o[k] = rawPosts[k].filter((p) => !blocked.has(p.user_id));
    return o;
  }, [rawPosts, blocked]);

  const eventById = useCallback((id: string) => events.find((e) => e.id === id), [events]);

  // Events in the selected city. Detail pages still open any event by id.
  const cityEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          e.lat == null || e.lng == null || e.created_by === user?.id ||
          distanceMi(city.center, { lat: e.lat, lng: e.lng }) <= CITY_RADIUS_MI,
      ),
    [events, city, user],
  );

  // ------------------------------------------------------------ actions
  function requireLogin() {
    if (userRef.current) return true;
    if (!supabaseConfigured) {
      toast('Connect Supabase first. See the setup notice.');
      return false;
    }
    toast('Sign in to do that');
    router.push(`/login?next=${encodeURIComponent(pathname || '/')}`);
    return false;
  }

  async function verify(ev: EventRow, retry: () => void): Promise<string | null> {
    const sb = getSupabase();
    if (!sb || !requireLogin()) return null;
    setModal({ kind: 'checking' });
    let fix: Fix;
    try {
      fix = await getFix();
    } catch (err) {
      const code = err === 'denied' ? 'DENIED' : err === 'unsupported' ? 'UNSUPPORTED' : 'NOFIX';
      setModal({ kind: 'gate', code, event: ev, retry });
      return null;
    }
    setUserLoc({ lat: fix.lat, lng: fix.lng });
    adoptNearestCity({ lat: fix.lat, lng: fix.lng });
    const { data, error } = await sb.rpc('verify_presence', {
      p_event: ev.id, p_lat: fix.lat, p_lng: fix.lng, p_accuracy: fix.accuracy,
    });
    if (error) {
      const { code, detail } = parseVibeError(error);
      setModal({ kind: 'gate', code, detail, event: ev, retry });
      return null;
    }
    setModal(null);
    return (data as { token: string }).token;
  }

  async function startRate(ev: EventRow) {
    if (!isActive(ev)) {
      toast(Date.now() < Date.parse(ev.starts_at) ? 'Ratings open when it starts' : 'This event has ended');
      return;
    }
    const token = await verify(ev, () => startRate(ev));
    if (token) setSheet({ kind: 'rate', event: ev, token });
  }

  function openCapture(eventId?: string) {
    if (!requireLogin()) return;
    setSheet({ kind: 'capture', eventId });
  }

  function openCreate() {
    if (!requireLogin()) return;
    setSheet({ kind: 'create' });
  }

  async function toggleSave(id: string) {
    const sb = getSupabase();
    if (!sb || !requireLogin()) return;
    const uid = userRef.current!.id;
    const was = saved.has(id);
    setSaved((prev) => {
      const n = new Set(prev);
      if (was) n.delete(id); else n.add(id);
      return n;
    });
    navigator.vibrate?.(10);
    const { error } = was
      ? await sb.from('saves').delete().eq('user_id', uid).eq('event_id', id)
      : await sb.from('saves').insert({ user_id: uid, event_id: id });
    if (error) {
      setSaved((prev) => {
        const n = new Set(prev);
        if (was) n.add(id); else n.delete(id);
        return n;
      });
      toast(errorText(error));
    } else toast(was ? 'Removed from saved' : 'Saved');
  }

  async function toggleHelpful(c: CommentRow) {
    const sb = getSupabase();
    if (!sb || !requireLogin()) return;
    const uid = userRef.current!.id;
    if (c.user_id === uid) return;
    const was = helped.has(c.id);
    const bump = (d: number) =>
      setComments((prev) => ({
        ...prev,
        [c.event_id]: (prev[c.event_id] ?? []).map((x) => (x.id === c.id ? { ...x, helpful_count: Math.max(0, x.helpful_count + d) } : x)),
      }));
    setHelped((prev) => {
      const n = new Set(prev);
      if (was) n.delete(c.id); else n.add(c.id);
      return n;
    });
    bump(was ? -1 : 1);
    const { error } = was
      ? await sb.from('helpful_votes').delete().eq('user_id', uid).eq('comment_id', c.id)
      : await sb.from('helpful_votes').insert({ user_id: uid, comment_id: c.id });
    if (error) {
      bump(was ? 1 : -1);
      setHelped((prev) => {
        const n = new Set(prev);
        if (was) n.add(c.id); else n.delete(c.id);
        return n;
      });
      toast(errorText(error));
    }
  }

  async function block(userId: string) {
    const sb = getSupabase();
    if (!sb || !requireLogin()) return;
    const { error } = await sb.from('blocks').insert({ blocker_id: userRef.current!.id, blocked_id: userId });
    if (error && !/duplicate/i.test(error.message)) return toast(errorText(error));
    setBlocked((prev) => new Set(prev).add(userId));
    toast('Blocked. You won’t see their posts or comments.');
  }

  async function locate(quiet = false) {
    try {
      const f = await getFix();
      setUserLoc({ lat: f.lat, lng: f.lng });
      adoptNearestCity({ lat: f.lat, lng: f.lng });
      if (!quiet) toast('Distances now use your location');
    } catch (err) {
      if (!quiet) toast(err === 'denied' ? `Location is off for this site. Distances use downtown ${city.name}.` : 'Couldn’t get a location fix.');
    }
  }

  async function share(ev: EventRow) {
    const s = stats[ev.id];
    const label = s && ['pop', 'mid', 'dead'].includes(s.status) ? ` (${s.score})` : '';
    const url = `${window.location.origin}/e/${ev.id}`;
    const text = `${ev.name} on VIBES${label}`;
    try {
      if (navigator.share) await navigator.share({ title: ev.name, text, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Link copied');
      }
    } catch {
      /* user cancelled */
    }
  }

  function noteMyRating(eventId: string, r: MyRating) {
    setMyRatings((prev) => ({ ...prev, [eventId]: r }));
  }

  const value: LiveValue = {
    status, loadError, authReady, user, profile, setProfile,
    events: cityEvents, city, chooseCity, themeMode, theme, setThemeMode: chooseTheme, eventById, stats, rows, comments, posts, now, userLoc, dist,
    saved, myRatings, helped,
    reload, refreshEvent, fetchEvent, addEvent,
    requireLogin, verify, startRate, openCapture, openCreate,
    openReport: (target, id, userId, username) => {
      if (requireLogin()) setSheet({ kind: 'report', target, id, userId, username });
    },
    openLightbox: (post) => setSheet({ kind: 'lightbox', post }),
    toggleSave, toggleHelpful, block, locate, share, noteMyRating,
    sheet, setSheet, modal, setModal, toastMsg, toast,
  };

  return <LiveCtx.Provider value={value}>{children}</LiveCtx.Provider>;
}
