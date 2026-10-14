'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLive } from './LiveProvider';
import { Cover } from './Media';
import { Icon } from './Icon';
import { STATUS } from './bits';
import { SetupNotice } from './AppShell';
import { getSupabase } from '@/lib/supabase/client';
import { SCORING } from '@/lib/scoring';
import { ago } from '@/lib/format';
import { EVENT_COLS, type EventRow } from '@/lib/types';

const VIBE_LABEL = { popping: '🔥 Popping', mid: '😐 Mid', dead: '💀 Dead' } as const;

export function ProfileView() {
  const router = useRouter();
  const { user, authReady, profile, setProfile, saved, myRatings, stats, events, now, userLoc, locate, openCreate, toast, status, city, setSheet } = useLive();
  const [counts, setCounts] = useState({ comments: 0, posts: 0 });
  const [extra, setExtra] = useState<EventRow[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  const known = new Map(events.map((e) => [e.id, e] as const));
  for (const e of extra) if (!known.has(e.id)) known.set(e.id, e);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !user) return;
    Promise.all([
      sb.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      sb.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]).then(([c, p]) => setCounts({ comments: c.count ?? 0, posts: p.count ?? 0 }));
  }, [user]);

  // Saved or rated events that aren't in the live window (older or far future).
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const missing = [...new Set([...saved, ...Object.keys(myRatings)])].filter((id) => !events.some((e) => e.id === id)).slice(0, 100);
    if (!missing.length) return;
    sb.from('events').select(EVENT_COLS).in('id', missing).then(({ data }) => setExtra((data ?? []) as EventRow[]));
  }, [saved, myRatings, events]);

  useEffect(() => {
    if (location.hash === '#saved') document.getElementById('saved')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (status === 'unconfigured') return <SetupNotice />;
  if (!authReady) return <div className="skel" style={{ aspectRatio: 'auto', height: 200 }} />;

  if (!user)
    return (
      <div className="empty" style={{ marginTop: 30 }}>
        <h3>Your vibe, saved.</h3>
        <p>Sign in to rate spots, post clips, and keep a list of places to hit.</p>
        <Link className="btn hot" href="/login?next=/profile">Sign in</Link>
      </div>
    );

  async function saveName() {
    const sb = getSupabase();
    if (!sb || !user || !profile) return;
    const u = name.trim().toLowerCase();
    if (!/^[a-z0-9._]{3,20}$/.test(u)) return toast('Use 3–20 letters, numbers, dots or underscores');
    const { error } = await sb.from('profiles').update({ username: u }).eq('id', user.id);
    if (error) return toast(/duplicate|unique/i.test(error.message) ? 'That username is taken' : 'Couldn’t save. Try again.');
    setProfile({ ...profile, username: u });
    setEditing(false);
    toast('Username saved');
  }

  async function signOut() {
    await getSupabase()?.auth.signOut();
    router.push('/');
  }

  const handle = profile?.username ?? '…';
  const ratedIds = Object.entries(myRatings).sort((a, b) => Date.parse(b[1].at) - Date.parse(a[1].at));
  const savedEvents = [...saved].map((id) => known.get(id)).filter((e): e is EventRow => Boolean(e));
  const row = (e: EventRow, sub: string) => (
    <Link className="li" href={`/e/${e.id}`} key={e.id}>
      <div className="th"><Cover event={e} /></div>
      <div style={{ flex: 1, minWidth: 0 }}><b>{e.name}</b><small>{sub}</small></div>
    </Link>
  );

  return (
    <>
      <div className="prof">
        <div className="pav"><span>{handle[0]?.toUpperCase()}</span></div>
        <div style={{ minWidth: 0 }}>
          {editing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="in" style={{ height: 42, padding: '8px 12px' }} value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoFocus aria-label="Username" />
              <button className="btn pri" style={{ height: 42 }} onClick={saveName}>Save</button>
            </div>
          ) : (
            <div className="fh" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em' }}>@{handle}</div>
          )}
          <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>{`${city.name}, ${city.state}`}</div>
          {!editing && <button className="linkb" style={{ padding: '4px 0' }} onClick={() => { setName(handle); setEditing(true); }}>Change username</button>}
        </div>
      </div>

      <div className="stats3">
        <div><b>{ratedIds.length + counts.comments + counts.posts}</b><span>Verified contributions</span></div>
        <div><b>{ratedIds.length}</b><span>Events rated</span></div>
        <div><b>{saved.size}</b><span>Saved</span></div>
      </div>

      <div className="cols">
        <section className="panel" id="saved">
          <h2>Saved <small>Only you can see this</small></h2>
          {savedEvents.length ? savedEvents.map((e) => row(e, `${e.area ?? e.category}, ${STATUS[stats[e.id]?.status ?? 'ended'].l.toLowerCase()}`)) : <p style={{ color: 'var(--muted)', margin: 0 }}>Tap the bookmark on any event to keep it here.</p>}
        </section>
        <section className="panel">
          <h2>Your ratings <small>Private</small></h2>
          {ratedIds.length ? (
            ratedIds.slice(0, 30).map(([id, r]) => {
              const e = known.get(id);
              return e ? row(e, `${VIBE_LABEL[r.vibe].slice(3)}, ${r.worth ? 'worth it' : 'not worth it'}, ${ago(now - Date.parse(r.at))}`) : null;
            })
          ) : (
            <p style={{ color: 'var(--muted)', margin: 0 }}>Rate a spot you’re at and it shows up here. Nobody else can see who rated what.</p>
          )}
        </section>
        <section className="panel">
          <h2>Location</h2>
          <p style={{ margin: '0 0 12px', fontSize: 14 }}>{userLoc ? 'Distances use your location.' : `Distances are measured from downtown ${city.name}.`}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn gl" onClick={() => locate(false)}><Icon name="locate" />Use my location</button>
            <button className="btn gl" onClick={() => setSheet({ kind: 'city' })}><Icon name="map" />City: {city.name}</button>
            <button className="btn gl" onClick={openCreate}><Icon name="plus" />Create an event</button>
          </div>
          <p className="foot-note">Location is checked once each time you rate or post, never tracked in the background, and never shown to anyone.</p>
        </section>
        <section className="panel">
          <h2>How ranking works</h2>
          <table className="w">
            <tbody>
              <tr><td>Verified ratings, last hour</td><td>{SCORING.weights.recent * 100}%</td></tr>
              <tr><td>Current vibe score</td><td>{SCORING.weights.score * 100}%</td></tr>
              <tr><td>Ratings in last 15 min</td><td>{SCORING.weights.velocity * 100}%</td></tr>
              <tr><td>Worth-it share</td><td>{SCORING.weights.worth * 100}%</td></tr>
              <tr><td>Freshness of last rating</td><td>{SCORING.weights.freshness * 100}%</td></tr>
              <tr><td>Distance</td><td>{SCORING.weights.distance * 100}%</td></tr>
            </tbody>
          </table>
          <p className="foot-note">Ratings fade over about an hour. Scores lean toward neutral until enough people rate, so two 🔥 votes can’t beat two hundred. One active rating per person per event.</p>
        </section>
      </div>
      <button className="btn gl" style={{ marginTop: 18 }} onClick={signOut}><Icon name="out" />Sign out</button>
    </>
  );
}
