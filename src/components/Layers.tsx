'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLive } from './LiveProvider';
import { Icon } from './Icon';
import { PostMedia } from './Media';
import { getSupabase } from '@/lib/supabase/client';
import { errorText, parseVibeError } from '@/lib/errors';
import { directionsUrl, fmtMi, getFix } from '@/lib/geo';
import { isActive } from '@/lib/scoring';
import { ago, clock } from '@/lib/format';
import { MediaError, preparePhoto, prepareVideo, videoExt, type Prepared } from '@/lib/media';
import { CATEGORIES, EVENT_COLS, type Category, type EventRow, type VibeLevel } from '@/lib/types';

export function Layers() {
  const { sheet, modal, toastMsg, setSheet, setModal } = useLive();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (modal && modal.kind !== 'checking') setModal(null);
      else if (sheet) setSheet(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet, modal, setSheet, setModal]);

  return (
    <>
      {sheet && sheet.kind !== 'lightbox' && <div className="scrim" onClick={() => setSheet(null)} />}
      {sheet?.kind === 'rate' && <RateSheet event={sheet.event} token={sheet.token} />}
      {sheet?.kind === 'capture' && <CaptureSheet eventId={sheet.eventId} />}
      {sheet?.kind === 'create' && <CreateSheet />}
      {sheet?.kind === 'report' && <ReportSheet {...sheet} />}
      {sheet?.kind === 'lightbox' && <Lightbox />}
      {modal && <GateModal />}
      {toastMsg && (
        <div className="toast glass" role="status">
          {toastMsg}
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ gate
const GATE: Record<string, { icon: string; title: string; body: (d?: string) => string; retry?: boolean }> = {
  OUTSIDE: {
    icon: '📍',
    title: 'You have to be there to vibe.',
    body: (d) => `Only people at this location can rate or post what’s happening.${d ? ` You’re about ${fmtMi(Number(d) / 1609.34)} away.` : ''}`,
  },
  DENIED: { icon: '🔒', title: 'Location is turned off', body: () => 'VIBES checks your location once to confirm you’re here. Allow location for this site in your browser settings, then try again.', retry: true },
  NOFIX: { icon: '🛰', title: 'No location fix yet', body: () => 'Your phone couldn’t get a location. Step near a door or window and try again.', retry: true },
  UNSUPPORTED: { icon: '🛰', title: 'This browser can’t share location', body: () => 'Open VIBES in Safari or Chrome on your phone to check in.' },
  LOW_ACCURACY: { icon: '🛰', title: 'Location isn’t precise enough', body: (d) => `Your fix is only accurate to about ${d ?? '?'} m. Turn on precise location or step outside for a moment, then try again.`, retry: true },
  IMPOSSIBLE_TRAVEL: { icon: '⏳', title: 'Your location jumped too fast', body: () => 'You moved farther than anyone could travel since your last check-in. Wait a few minutes and try again.' },
  RATE_LIMIT: { icon: '⏳', title: 'Too many check-ins', body: () => 'Wait a minute, then try again.', retry: true },
  NOT_STARTED: { icon: '⏱', title: 'This hasn’t started yet', body: () => 'Ratings and posts open when the event starts.' },
  ENDED: { icon: '◼', title: 'This event has ended', body: () => 'Ratings and posts are closed. You can still browse what people shared.' },
  NOT_FOUND: { icon: '❔', title: 'Event not found', body: () => 'It may have been removed.' },
  AUTH_REQUIRED: { icon: '🔑', title: 'Sign in first', body: () => 'You need an account to rate or post.' },
  NETWORK: { icon: '📶', title: 'Connection dropped', body: () => 'Check your signal and try again.', retry: true },
};

function GateModal() {
  const { modal, setModal } = useLive();
  if (!modal) return null;
  if (modal.kind === 'checking')
    return (
      <div className="modal glass" role="alertdialog" aria-live="assertive" aria-label="Checking your location">
        <div className="spin" />
        <h2>Checking you’re there</h2>
        <p>Getting a fresh location fix.</p>
      </div>
    );
  const g = GATE[modal.code] ?? { icon: '⚠️', title: 'Couldn’t check you in', body: () => modal.detail ?? 'Try again in a moment.', retry: true };
  const ev = modal.event;
  return (
    <>
      <div className="scrim" style={{ zIndex: 75 }} onClick={() => setModal(null)} />
      <div className="modal glass" role="alertdialog" aria-labelledby="gate-h">
        <div className="big">{g.icon}</div>
        <h2 id="gate-h">{g.title}</h2>
        <p>{g.body(modal.detail)}</p>
        <div className="stack">
          {modal.code === 'OUTSIDE' && ev.lat != null && ev.lng != null && (
            <a className="btn pri" href={directionsUrl({ lat: ev.lat, lng: ev.lng })} target="_blank" rel="noopener noreferrer">
              Get directions
            </a>
          )}
          {g.retry && (
            <button className="btn pri" onClick={() => modal.retry()}>
              Try again
            </button>
          )}
          <button className="btn gl" onClick={() => setModal(null)}>
            Maybe later
          </button>
        </div>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ rate
const VIBES: [VibeLevel, string, string, string, string][] = [
  ['popping', '🔥', 'POPPING', 'High energy, active crowd', 'var(--pop)'],
  ['mid', '😐', 'MID', 'Average, nothing special', 'var(--mid)'],
  ['dead', '💀', 'DEAD', 'Empty or disappointing', 'var(--dead)'],
];

function RateSheet({ event, token }: { event: EventRow; token: string }) {
  const { setSheet, toast, refreshEvent, noteMyRating, myRatings, verify } = useLive();
  const prior = myRatings[event.id];
  const hasPrior = prior && Date.parse(prior.at) >= Date.parse(event.starts_at);
  const [vibe, setVibe] = useState<VibeLevel | null>(hasPrior ? prior.vibe : null);
  const [worth, setWorth] = useState<boolean | null>(hasPrior ? prior.worth : null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const tok = useRef(token);

  async function submit() {
    const sb = getSupabase();
    if (!sb || !vibe || worth === null) return;
    setBusy(true);
    const call = (t: string) =>
      sb.rpc('submit_rating', { p_token: t, p_vibe: vibe, p_worth: worth, p_comment: comment.trim() || null });
    let res = await call(tok.current);
    if (res.error && parseVibeError(res.error).code === 'TOKEN_INVALID') {
      const fresh = await verify(event, submit);
      if (!fresh) return setBusy(false);
      tok.current = fresh;
      res = await call(fresh);
    }
    setBusy(false);
    if (res.error) return toast(errorText(res.error));
    const out = res.data as { replaced: boolean; comment_saved: boolean };
    noteMyRating(event.id, { vibe, worth, at: new Date().toISOString() });
    navigator.vibrate?.(15);
    setSheet(null);
    toast(!out.comment_saved ? 'Rating posted. Comment skipped: you just commented here.' : out.replaced ? 'Rating updated' : comment.trim() ? 'Rating and comment posted' : 'Rating posted');
    refreshEvent(event.id);
  }

  return (
    <div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="rate-h">
      <div className="grab" />
      <h2 id="rate-h">What’s the vibe?</h2>
      <p className="sub">{event.name} · you’re checked in ✓</p>
      <div className="vibes" role="group" aria-label="Vibe">
        {VIBES.map(([k, e, l, d, c]) => (
          <button key={k} className="vb" style={{ ['--c' as string]: c }} aria-pressed={vibe === k} onClick={() => { setVibe(k); navigator.vibrate?.(8); }}>
            <span className="e">{e}</span>
            <b>{l}</b>
            <small>{d}</small>
          </button>
        ))}
      </div>
      <span className="q">Is it worth it?</span>
      <div className="worths" role="group" aria-label="Worth it">
        <button className="vb" style={{ ['--c' as string]: 'var(--yes)' }} aria-pressed={worth === true} onClick={() => { setWorth(true); navigator.vibrate?.(8); }}>
          <span className="e">✅</span><b>WORTH IT</b>
        </button>
        <button className="vb" style={{ ['--c' as string]: 'var(--no)' }} aria-pressed={worth === false} onClick={() => { setWorth(false); navigator.vibrate?.(8); }}>
          <span className="e">❌</span><b>NOT WORTH IT</b>
        </button>
      </div>
      <label className="q" htmlFor="rate-c">
        Add one sentence <span style={{ fontWeight: 400 }}>(optional)</span>
      </label>
      <textarea id="rate-c" className="in" rows={2} maxLength={140} placeholder="Line is short, DJ is going crazy…" value={comment} onChange={(e) => setComment(e.target.value)} />
      <div className="count">{comment.length}/140</div>
      <button className="btn hot wide" style={{ marginTop: 12 }} disabled={!vibe || worth === null || busy} onClick={submit}>
        {busy ? <span className="spin sm" /> : hasPrior ? 'Update rating' : 'Post rating'}
      </button>
      {hasPrior && <p className="foot-note" style={{ textAlign: 'center' }}>Posting replaces your earlier rating here.</p>}
    </div>
  );
}

// ------------------------------------------------------------------ capture
function CaptureSheet({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const { events, now, dist, setSheet, toast, verify, user, refreshEvent } = useLive();
  const [prep, setPrep] = useState<Prepared | null>(null);
  const [reading, setReading] = useState(false);
  const live = useMemo(
    () => events.filter((e) => isActive(e, now)).sort((a, b) => (dist(a) ?? 99) - (dist(b) ?? 99)),
    [events, now, dist],
  );
  const [evId, setEvId] = useState<string>(() => (eventId && live.some((e) => e.id === eventId) ? eventId : live[0]?.id ?? ''));
  const [caption, setCaption] = useState('');
  const [vibe, setVibe] = useState<VibeLevel | null>(null);
  const [worth, setWorth] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const photoIn = useRef<HTMLInputElement>(null);
  const videoIn = useRef<HTMLInputElement>(null);
  const galleryIn = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (prep) URL.revokeObjectURL(prep.previewUrl); }, [prep]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setReading(true);
    try {
      if (f.type.startsWith('image/')) setPrep(await preparePhoto(f));
      else if (f.type.startsWith('video/')) setPrep(await prepareVideo(f));
      else toast('Unsupported file. Use a photo or a video clip.');
    } catch (e) {
      toast(e instanceof MediaError ? e.message : 'That file couldn’t be read.');
    } finally {
      setReading(false);
    }
  }

  async function publish() {
    const sb = getSupabase();
    const ev = live.find((e) => e.id === evId);
    if (!sb || !prep || !ev || !user) return;
    let token = await verify(ev, publish);
    if (!token) return;
    setPhase('uploading');
    const base = `${user.id}/${ev.id}/${crypto.randomUUID()}`;
    const bucket = sb.storage.from('media');
    let path: string;
    let thumb: string | null = null;
    if (prep.kind === 'photo') {
      path = `${base}.jpg`;
      const up = await bucket.upload(path, prep.blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
      if (up.error) { setPhase('idle'); return toast(`Upload failed: ${up.error.message}`); }
    } else {
      path = `${base}.${videoExt(prep.file.type)}`;
      const up = await bucket.upload(path, prep.file, { contentType: prep.file.type, cacheControl: '31536000' });
      if (up.error) { setPhase('idle'); return toast(`Upload failed: ${up.error.message}`); }
      if (prep.thumb) {
        const t = await bucket.upload(`${base}-thumb.jpg`, prep.thumb, { contentType: 'image/jpeg', cacheControl: '31536000' });
        if (!t.error) thumb = `${base}-thumb.jpg`;
      }
    }
    setPhase('saving');
    const args = (t: string) => ({
      p_token: t, p_kind: prep.kind, p_path: path, p_thumb: thumb, p_caption: caption.trim() || null,
      p_width: prep.width || null, p_height: prep.height || null, p_duration: prep.kind === 'video' ? prep.duration : null,
    });
    let res = await sb.rpc('create_post', args(token));
    if (res.error && parseVibeError(res.error).code === 'TOKEN_INVALID') {
      // Slow upload outlived the 3-minute check-in. Check in again and finish.
      const fresh = await verify(ev, publish);
      if (!fresh) { setPhase('idle'); return; }
      token = fresh;
      res = await sb.rpc('create_post', args(token));
    }
    if (res.error) { setPhase('idle'); return toast(errorText(res.error)); }
    if (vibe && worth !== null) await sb.rpc('submit_rating', { p_token: token, p_vibe: vibe, p_worth: worth, p_comment: null });
    navigator.vibrate?.(15);
    setSheet(null);
    toast('Posted');
    refreshEvent(ev.id);
    router.push(`/e/${ev.id}`);
  }

  const busy = phase !== 'idle';

  if (!prep)
    return (
      <div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="cap-h">
        <div className="grab" />
        <h2 id="cap-h">Capture the vibe</h2>
        <p className="sub">Posts go live only while you’re at the spot.</p>
        {reading ? (
          <div style={{ padding: '30px 0', textAlign: 'center' }}><div className="spin" /></div>
        ) : (
          <div className="opts">
            <button className="opt" onClick={() => photoIn.current?.click()}><Icon name="camera" /><span>Take photo<small>Opens your camera</small></span></button>
            <button className="opt" onClick={() => videoIn.current?.click()}><Icon name="video" /><span>Record 10-second clip<small>Up to 10 seconds</small></span></button>
            <button className="opt" onClick={() => galleryIn.current?.click()}><Icon name="image" /><span>Upload from gallery<small>Labeled by when you post it, not when it was shot</small></span></button>
          </div>
        )}
        <input ref={photoIn} className="sr" type="file" accept="image/*" capture="environment" onChange={(e) => onFile(e.target.files?.[0])} />
        <input ref={videoIn} className="sr" type="file" accept="video/*" capture="environment" onChange={(e) => onFile(e.target.files?.[0])} />
        <input ref={galleryIn} className="sr" type="file" accept="image/*,video/*" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
    );

  return (
    <div className="sheet glass" role="dialog" aria-modal="true" aria-label="New post">
      <div className="grab" />
      <div className="prev">
        {prep.kind === 'photo' ? <img src={prep.previewUrl} alt="Your photo" /> : <video src={prep.previewUrl} autoPlay muted loop playsInline />}
      </div>
      <label className="q" htmlFor="cap-ev">Where are you?</label>
      {live.length ? (
        <select id="cap-ev" className="in" value={evId} onChange={(e) => setEvId(e.target.value)}>
          {live.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}{dist(e) != null ? ` · ${fmtMi(dist(e))}` : ''}
            </option>
          ))}
        </select>
      ) : (
        <p className="sub" style={{ margin: 0 }}>Nothing is live right now. Create an event where you are to post.</p>
      )}
      <label className="q" htmlFor="cap-c">One sentence <span style={{ fontWeight: 400 }}>(optional)</span></label>
      <textarea id="cap-c" className="in" rows={2} maxLength={140} placeholder="What’s it like right now?" value={caption} onChange={(e) => setCaption(e.target.value)} />
      <span className="q">Vibe and worth it <span style={{ fontWeight: 400 }}>(optional)</span></span>
      <div className="minivibes">
        {VIBES.map(([k, e, l, , c]) => (
          <button key={k} className="mv" style={{ ['--c' as string]: c }} aria-pressed={vibe === k} onClick={() => setVibe(vibe === k ? null : k)}>
            {e} {l[0] + l.slice(1).toLowerCase()}
          </button>
        ))}
        <button className="mv" style={{ ['--c' as string]: 'var(--yes)' }} aria-pressed={worth === true} onClick={() => setWorth(worth === true ? null : true)}>✅ Worth it</button>
        <button className="mv" style={{ ['--c' as string]: 'var(--no)' }} aria-pressed={worth === false} onClick={() => setWorth(worth === false ? null : false)}>❌ Not worth it</button>
      </div>
      <button className="btn hot wide" style={{ marginTop: 16 }} disabled={!live.length || busy} onClick={publish}>
        {busy ? (<><span className="spin sm" /> {phase === 'uploading' ? 'Uploading…' : 'Publishing…'}</>) : 'Publish'}
      </button>
      <button className="linkb" style={{ display: 'block', margin: '6px auto 0' }} disabled={busy} onClick={() => setPrep(null)}>
        Choose a different file
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ create event
function CreateSheet() {
  const router = useRouter();
  const { setSheet, toast, user, addEvent, setModal } = useLive();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Parties');
  const [startIn, setStartIn] = useState('0');
  const [hours, setHours] = useState('4');
  const [unlisted, setUnlisted] = useState(false);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  async function create() {
    const sb = getSupabase();
    if (!sb || !user) return;
    if (name.trim().length < 2) return toast('Give the event a name');
    setBusy(true);
    setModal({ kind: 'checking' });
    let fix;
    try {
      fix = await getFix();
    } catch {
      setModal(null);
      setBusy(false);
      return toast('Creating an event pins it where you are, so VIBES needs your location once.');
    }
    setModal(null);
    const start = Date.now() + Number(startIn) * 3_600_000;
    const { data, error } = await sb
      .from('events')
      .insert({
        name: name.trim(), category,
        lat: fix.lat, lng: fix.lng, radius_m: 120,
        starts_at: new Date(start).toISOString(),
        ends_at: new Date(start + Number(hours) * 3_600_000).toISOString(),
        visibility: unlisted ? 'unlisted' : 'public',
        address: address.trim() || null,
        description: description.trim() || null,
        created_by: user.id,
      })
      .select(EVENT_COLS)
      .single();
    setBusy(false);
    if (error) return toast(errorText(error));
    const ev = data as EventRow;
    addEvent(ev);
    setSheet(null);
    toast(unlisted ? 'Private event created. Share the link with guests.' : 'Event created');
    router.push(`/e/${ev.id}`);
  }

  return (
    <div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="ce-h">
      <div className="grab" />
      <h2 id="ce-h">Create an event</h2>
      <p className="sub">It’s pinned where you’re standing. Ratings open when it starts.</p>
      <label className="q" htmlFor="ce-n">Name</label>
      <input id="ce-n" className="in" maxLength={60} placeholder="Saturday rooftop session" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <label className="q" htmlFor="ce-c">Category</label>
      <select id="ce-c" className="in" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label className="q" htmlFor="ce-s">Starts</label>
          <select id="ce-s" className="in" value={startIn} onChange={(e) => setStartIn(e.target.value)}>
            <option value="0">Now</option>
            <option value="1">In 1 hour</option>
            <option value="2">In 2 hours</option>
            <option value="4">In 4 hours</option>
          </select>
        </div>
        <div>
          <label className="q" htmlFor="ce-d">Runs for</label>
          <select id="ce-d" className="in" value={hours} onChange={(e) => setHours(e.target.value)}>
            {['2', '3', '4', '6', '8', '12'].map((h) => <option key={h} value={h}>{h} hours</option>)}
          </select>
        </div>
      </div>
      <label className="q" htmlFor="ce-a">Address <span style={{ fontWeight: 400 }}>(optional)</span></label>
      <input id="ce-a" className="in" maxLength={120} placeholder="Shown to guests" value={address} onChange={(e) => setAddress(e.target.value)} />
      <label className="q" htmlFor="ce-x">Description <span style={{ fontWeight: 400 }}>(optional)</span></label>
      <textarea id="ce-x" className="in" rows={2} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="tog" style={{ marginTop: 14 }}>
        <div>
          <b style={{ fontWeight: 600 }}>Private event</b>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Only people with the link can find it. The address and pin stay hidden.</div>
        </div>
        <button className="sw" role="switch" aria-checked={unlisted} aria-label="Private event" onClick={() => setUnlisted(!unlisted)} />
      </div>
      <button className="btn hot wide" style={{ marginTop: 16 }} disabled={busy} onClick={create}>
        {busy ? <span className="spin sm" /> : 'Create event'}
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ report
const REASONS: [string, string][] = [
  ['inaccurate', 'Not accurate'],
  ['spam', 'Spam'],
  ['harassment', 'Harassment or bullying'],
  ['threat', 'Threat or violence'],
  ['nudity', 'Nudity or sexual content'],
  ['other', 'Something else'],
];

function ReportSheet({ target, id, userId, username }: { target: 'comment' | 'post'; id: string; userId: string; username: string }) {
  const { setSheet, toast, user, block } = useLive();
  async function send(reason: string) {
    const sb = getSupabase();
    if (!sb || !user) return;
    const { error } = await sb.from('reports').insert({ reporter_id: user.id, target_type: target, target_id: id, reason });
    setSheet(null);
    if (error && !/duplicate/i.test(error.message)) return toast(errorText(error));
    toast(error ? 'You already reported this' : 'Reported. Three reports hide it until a moderator reviews it.');
  }
  return (
    <div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="rp-h">
      <div className="grab" />
      <h2 id="rp-h">Report this {target}</h2>
      <p className="sub">What’s wrong with it?</p>
      <div className="opts">
        {REASONS.map(([k, l]) => (
          <button key={k} className="opt" onClick={() => send(k)}>{l}</button>
        ))}
        {user && userId !== user.id && (
          <button className="opt" style={{ color: 'var(--no)' }} onClick={() => { setSheet(null); block(userId); }}>
            Block @{username}
          </button>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ lightbox
function Lightbox() {
  const { sheet, setSheet, openReport, now } = useLive();
  if (sheet?.kind !== 'lightbox') return null;
  const p = sheet.post;
  const name = p.profiles?.username ?? 'someone';
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Post by ${name}`}>
      <PostMedia post={p} controls />
      <div className="shade" />
      <button className="x chip-g" aria-label="Close" onClick={() => setSheet(null)}><Icon name="x" /></button>
      <div className="cb">
        <b>@{name}</b> <span className="time">· posted {ago(now - Date.parse(p.created_at))} ({clock(p.created_at)})</span>
        {p.caption && <p style={{ margin: '6px 0 0' }}>{p.caption}</p>}
        <button className="linkb" style={{ paddingLeft: 0 }} onClick={() => openReport('post', p.id, p.user_id, name)}>Report</button>
      </div>
    </div>
  );
}
