'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLive } from './LiveProvider';
import { EventCard } from './EventCard';
import { Cover } from './Media';
import { Icon } from './Icon';
import { STATUS, StatusPill, WorthText, liveText, metaText } from './bits';
import { SetupNotice } from './AppShell';
import { isActive } from '@/lib/scoring';
import { fmtMi } from '@/lib/geo';
import { CITY } from '@/lib/city';
import { Skyline } from './Skyline';
import { Wordmark } from './Logo';
import type { EventRow } from '@/lib/types';

type When = 'now' | 'tonight' | 'weekend';
const CHIPS = ['For You', 'Popping', 'Near Me', 'Clubs', 'Bars', 'Restaurants', 'Parties', 'Concerts', 'Events', 'Sports'];

function endOfNight(now: number) {
  const d = new Date(now);
  d.setHours(d.getHours() < 5 ? 5 : 29, 0, 0, 0); // until 5 AM
  return d.getTime();
}

export function Discover() {
  const params = useSearchParams();
  const { events, stats, now, dist, status, userLoc, posts, openCreate, locate } = useLive();
  const [when, setWhen] = useState<When>('now');
  const [cat, setCat] = useState('For You');
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'grid' | 'reel'>('grid');

  useEffect(() => {
    if (params.get('near') === '1') {
      setCat('Near Me');
      if (!userLoc) locate(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    let L = events.filter((e) => Date.parse(e.ends_at) > now && e.visibility === 'public');
    if (when === 'now') L = L.filter((e) => isActive(e, now));
    else if (when === 'tonight') L = L.filter((e) => Date.parse(e.starts_at) < endOfNight(now));
    else L = L.filter((e) => Date.parse(e.starts_at) < now + 7 * 86_400_000);
    if (cat === 'Popping') L = L.filter((e) => stats[e.id]?.status === 'pop');
    else if (cat === 'Near Me') L = L.filter((e) => (dist(e) ?? 99) <= 3);
    else if (cat !== 'For You') L = L.filter((e) => e.category === cat);
    if (term) L = L.filter((e) => `${e.name} ${e.area ?? ''} ${e.category}`.toLowerCase().includes(term));
    return L.sort((a, b) => (cat === 'Near Me' ? (dist(a) ?? 99) - (dist(b) ?? 99) : (stats[b.id]?.rank ?? 0) - (stats[a.id]?.rank ?? 0)));
  }, [events, stats, now, when, cat, q, dist]);

  const active = events.filter((e) => isActive(e, now) && e.visibility === 'public');
  const popping = active.filter((e) => stats[e.id]?.status === 'pop').length;
  const heating = active.filter((e) => stats[e.id]?.mom === 'up').length;
  const headline = popping >= 3 ? `${CITY.name} is popping tonight` : popping ? `${CITY.name} is warming up` : active.length ? `${CITY.name} is just getting started` : `${CITY.name} is quiet right now`;
  const stories = [...active].sort((a, b) => (stats[b.id]?.rank ?? 0) - (stats[a.id]?.rank ?? 0));

  return (
    <>
      <SetupNotice />
      <header className="hero">
        <Skyline />
        <div className="hero-in">
        <div className="top">
          <div>
            <h1 className="where">Where’s the <Wordmark text="vibe" />?</h1>
            <div className="live-line">
              <span className="livedot" />
              Live in {CITY.name}{userLoc ? '' : ', distances from Downtown'}
            </div>
          </div>
          <div className="seg glass" role="group" aria-label="When">
            {([['now', 'Right now'], ['tonight', 'Tonight'], ['weekend', 'This weekend']] as [When, string][]).map(([k, l]) => (
              <button key={k} aria-pressed={when === k} onClick={() => setWhen(k)}>{l}</button>
            ))}
          </div>
        </div>

        <p className="pulse">
          {active.length === 0
            ? 'Nothing is live yet tonight. Check back after sunset.'
            : <>
                <b>{headline}.</b>{' '}
                {active.length} {active.length === 1 ? 'place is' : 'places are'} live
                {popping ? <>, <span style={{ color: 'var(--pop)' }}>{popping} popping</span></> : null}
                {heating ? <>, {heating} heating up</> : null}.
              </>}
        </p>
        </div>
      </header>

      <div className="searchrow">
        <label className="search glass">
          <Icon name="search" />
          <span className="sr">Search</span>
          <input type="search" placeholder="Where’s the vibe tonight?" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </label>
        <Link href="/map" className="iconbtn glass" aria-label="Map view"><Icon name="map" /></Link>
      </div>

      <div className="chips" role="group" aria-label="Category">
        {CHIPS.map((c) => (
          <button
            key={c}
            className="chip"
            aria-pressed={cat === c}
            onClick={() => {
              setCat(c);
              if (c === 'Near Me' && !userLoc) locate(true);
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {stories.length > 0 && (
        <div className="stories">
          {stories.map((e) => (
            <Link key={e.id} href={`/e/${e.id}`} className="story">
              <div className="ring" style={{ ['--c' as string]: STATUS[stats[e.id].status].c }}>
                <div><Cover event={e} posts={posts[e.id]} /></div>
              </div>
              <span>{e.name}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="subbar">
        <h3>{list.length} {when === 'now' ? 'live now' : when === 'tonight' ? 'tonight' : 'this week'}</h3>
        <div className="vt glass" role="group" aria-label="Layout">
          <button aria-pressed={mode === 'grid'} aria-label="Grid" onClick={() => setMode('grid')}><Icon name="grid" /></button>
          <button aria-pressed={mode === 'reel'} aria-label="Full screen" onClick={() => setMode('reel')}><Icon name="reel" /></button>
        </div>
      </div>

      {status === 'loading' ? (
        <div className="grid">{Array.from({ length: 4 }, (_, i) => <div key={i} className="skel" />)}</div>
      ) : !list.length ? (
        <div className="empty">
          <h3>It’s quiet out here.</h3>
          <p>Be the first to find the vibe.</p>
          <div className="btns">
            <button className="btn pri" onClick={() => { setCat('For You'); setWhen('weekend'); setQ(''); }}>Explore farther</button>
            <button className="btn gl" onClick={openCreate}>Create an event</button>
          </div>
        </div>
      ) : mode === 'reel' ? (
        <div className="reel">
          {list.map((e) => <ReelItem key={e.id} e={e} />)}
        </div>
      ) : (
        <div className="grid">
          {list.map((e, i) => <EventCard key={e.id} e={e} variant={i === 0 && list.length > 2 ? 'feat' : undefined} />)}
        </div>
      )}
    </>
  );

}

function ReelItem({ e }: { e: EventRow }) {
  const { stats, now, dist, posts, saved, toggleSave, startRate, openCapture, share } = useLive();
    const s = stats[e.id];
    const sv = saved.has(e.id);
    const d = dist(e);
    return (
      <Link href={`/e/${e.id}`} className="ri">
        <Cover event={e} posts={posts[e.id]} />
        <div className="shade" />
        <div className="tl chip-g">{isActive(e, now) && <span className="live">Live</span>}{liveText(e, s, now)}</div>
        <div className="cb">
          <div className="area"><span>{e.area ?? e.category}</span>{d != null && <span>{fmtMi(d)}</span>}</div>
          <h3>{e.name}</h3>
          <div className="row"><StatusPill s={s} /><WorthText s={s} /></div>
          <div className="meta">{metaText(e, s, now)}</div>
        </div>
        <div className="rside" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); }}>
          <button className="chip-g" aria-label="Rate the vibe" onClick={() => startRate(e)}><Icon name="flame" /></button>
          <button className="chip-g" aria-label="Post a photo or clip" onClick={() => openCapture(e.id)}><Icon name="camera" /></button>
          <button className="chip-g" aria-label="Save" aria-pressed={sv} onClick={() => toggleSave(e.id)}><Icon name="bookmark" fill /></button>
          <button className="chip-g" aria-label="Share" onClick={() => share(e)}><Icon name="share" /></button>
        </div>
      </Link>
    );
  }
