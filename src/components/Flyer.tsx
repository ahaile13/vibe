import type { CSSProperties, ReactNode } from 'react';
import type { EventRow } from '@/lib/types';
import { CITY_LIST } from '@/lib/city';

/**
 * A designed event flyer, used as the cover until attendees post real photos. Five poster styles
 * modeled on real club, brunch and festival flyers: neon (glowing night party), noir (black-tie
 * brunch), retro (sunburst summer party), garden (blossom brunch) and bloom (spring festival).
 * The style follows the category and time of day; the lineup, specials, date, address and city
 * are filled in per event. Everything sits on a 4:5 "sheet" sized in container units, centered
 * over a full-bleed background, so it reads the same as a card, a hero or a thumbnail.
 */

type Style = 'neon' | 'noir' | 'retro' | 'garden' | 'bloom';

function hash(s: string) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
const pick = <T,>(list: T[], seed: string) => list[hash(seed) % list.length];

const DJS = ['DJ Nova', 'DJ Kairo', 'DJ Lux', 'DJ Solace', 'DJ Marz', 'DJ Vela', 'DJ Rome', 'DJ Tempo', 'DJ Saint', 'DJ Blaze', 'DJ Onyx', 'DJ Sable', 'DJ Juno', 'DJ Remy', 'DJ Atlas', 'DJ Coco'];

const SUB: Record<string, [string, string]> = {
  // [daytime, night]
  Clubs: ['Day Party', 'Nights'],
  Parties: ['Day Party', 'Party'],
  Bars: ['Social', 'Happy Hour'],
  Restaurants: ['Brunch', 'Dinner & Drinks'],
  Concerts: ['Live', 'Live'],
  Events: ['Festival', 'Night Market'],
  Sports: ['Watch Party', 'Game Night'],
};

const PERKS: Record<string, string[]> = {
  Clubs: ['Ladies free before 11', 'Bottle specials all night', 'Dress to impress'],
  Parties: ['Dance · Drinks · Games', 'Photo booth', 'Late night bites'],
  Bars: ['$5 drafts till 8', 'Half-off cocktails', 'Patio open'],
  Restaurants: ['Bottomless mimosas', 'Chef’s tasting menu', 'Live music on the patio'],
  Concerts: ['Doors open early', 'All-local lineup', 'Full bar inside'],
  Events: ['Food trucks & vendors', 'Live art & music', 'Free for all ages'],
  Sports: ['Every game on the big screen', 'Wing & pitcher specials', 'Halftime giveaways'],
};

function cityOf(e: EventRow) {
  if (e.lat == null || e.lng == null) return '';
  let best = CITY_LIST[0], bd = Infinity;
  for (const c of CITY_LIST) {
    const d = (c.center.lat - e.lat) ** 2 + (c.center.lng - e.lng) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  return `${best.name}, ${best.state}`;
}

const hourText = (d: Date) => {
  const h = d.getHours(), m = d.getMinutes();
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'AM' : 'PM'}`;
};

function details(e: EventRow) {
  const s = new Date(e.starts_at), end = new Date(e.ends_at);
  const day = s.getHours() < 15;
  const weekday = s.toLocaleDateString('en-US', { weekday: 'long' });
  const mon = s.toLocaleDateString('en-US', { month: 'short' });
  const date = s.getDate();
  const nth = date % 10 === 1 && date !== 11 ? 'st' : date % 10 === 2 && date !== 12 ? 'nd' : date % 10 === 3 && date !== 13 ? 'rd' : 'th';
  const d1 = hash(`${e.id}:dj`) % DJS.length;
  const djs = [DJS[d1], DJS[(d1 + 5) % DJS.length], DJS[(d1 + 11) % DJS.length]];
  const sub = (SUB[e.category] ?? ['Social', 'Night Out'])[day ? 0 : 1];
  return {
    day, weekday, mon, date, nth, djs, sub,
    perks: PERKS[e.category] ?? PERKS.Events,
    time: `${hourText(s)} – ${hourText(end)}`,
    start: hourText(s),
    month: s.getMonth(),
    city: cityOf(e),
    where: [e.address, e.area].filter(Boolean).join(' · '),
    age: e.age_rule ?? '',
    cover: e.cover_charge ?? '',
  };
}

function styleFor(e: EventRow, day: boolean): Style {
  const opts: Record<string, [Style[], Style[]]> = {
    Clubs: [['retro', 'noir'], ['neon', 'noir']],
    Parties: [['retro', 'bloom'], ['neon', 'neon', 'noir']],
    Bars: [['retro', 'garden'], ['noir', 'neon', 'retro']],
    Restaurants: [['garden', 'noir', 'bloom'], ['garden', 'noir']],
    Concerts: [['retro', 'neon'], ['neon', 'noir']],
    Events: [['bloom', 'retro', 'garden'], ['retro', 'neon']],
    Sports: [['retro', 'neon'], ['neon', 'retro']],
  };
  const [d, n] = opts[e.category] ?? [['bloom', 'retro'], ['neon', 'noir']];
  return pick(day ? d : n, `${e.id}:style`);
}

/** Which poster style an event gets (stable per event). */
export const flyerStyle = (e: EventRow): Style => styleFor(e, new Date(e.starts_at).getHours() < 15);

export function Flyer({ event }: { event: EventRow }) {
  const x = details(event);
  const style = styleFor(event, x.day);
  const Art = { neon: Neon, noir: Noir, retro: Retro, garden: Garden, bloom: Bloom }[style];
  return (
    <div className={`art flyer fx fx-${style}`} aria-hidden="true">
      <div className="fx-bg" />
      <div className="fx-sheet">
        <Art e={event} x={x} />
      </div>
    </div>
  );
}

type Props = { e: EventRow; x: ReturnType<typeof details> };

/** Title size that keeps the longest word on one line: base size, capped by the sheet width. */
function fit(text: string, base: number, ratio: number, avail = 84): CSSProperties {
  const longest = Math.max(4, ...text.split(/\s+/).map((w) => w.length));
  // ...and short enough that the whole title fits on about two lines.
  const twoLines = (avail * 1.8) / (ratio * Math.max(8, text.length));
  return { ['--fs' as string]: `${Math.min(base, avail / (ratio * longest), twoLines).toFixed(2)}cqw` };
}
const T = ({ c, children, style }: { c: string; children: ReactNode; style?: CSSProperties }) => <div className={`t ${c}`} style={style}>{children}</div>;

// ---------------------------------------------------------------- neon: glowing night party
function Neon({ e, x }: Props) {
  const spooky = x.month === 9;
  return (
    <>
      <div className="fx-rays" />
      <T c="nx-pre">vibes presents</T>
      <T c="nx-title" style={fit(e.name, 19, 0.42)}>{e.name}</T>
      <T c="nx-sub">{spooky ? 'Halloween ' : ''}{x.sub}</T>
      <div className="nx-art">{spooky ? <Pumpkin /> : <DiscoBall />}</div>
      <Bats />
      <T c="nx-date">{x.weekday}, {x.mon} {x.date}</T>
      <T c="nx-line">{/dance/i.test(x.perks[0]) ? x.perks[0] : `Dance · Drinks · ${x.perks[0]}`}</T>
      <T c="nx-djs">{x.djs[0]} | {x.djs[1]}</T>
      <T c="nx-foot">{x.where}{x.city ? ` · ${x.city}` : ''}<br />{x.time}{x.age ? ` · ${x.age}` : ''} · RSVP on vibes</T>
    </>
  );
}

// ---------------------------------------------------------------- noir: black-tie brunch / lounge
function Noir({ e, x }: Props) {
  const words = e.name.split(' ');
  const mid = Math.ceil(words.length / 2);
  return (
    <>
      <div className="fx-marble" />
      <T c="no-date">{x.weekday} {x.mon} {x.date}{x.nth}</T>
      <T c="no-kicker" style={fit((e.area ?? e.category).replace(/\s/g, ''), 7.4, 1.3, 80)}>{(e.area ?? e.category).split('').join(' ')}</T>
      <div className="no-spark" />
      <T c="no-title" style={fit(e.name, 13, 0.62, 80)}>{words.slice(0, mid).join(' ')}<br />{words.slice(mid).join(' ') || x.sub}</T>
      <div className="no-spark" />
      <T c="no-tags">#{x.sub.replace(/[^a-z]/gi, '')} #vibe #{x.day ? 'dayparty' : 'nightout'}</T>
      <div className="no-cols">
        <T c="no-info">
          <b>{x.perks[0]}</b>
          {x.cover && <span>{x.cover} cover</span>}
          <em>Music by</em>
          {x.djs.map((d) => <span key={d}>{d}</span>)}
          <b className="no-time">{x.time}</b>
        </T>
        <div className="no-glass"><Flute /></div>
      </div>
      <T c="no-foot"><b>Venue</b>{x.where}{x.city ? `, ${x.city}` : ''}</T>
    </>
  );
}

// ---------------------------------------------------------------- retro: sunburst summer party
function Retro({ e, x }: Props) {
  return (
    <>
      <div className="re-frame" />
      <T c="re-pre"><span>vibes</span><span>presents</span><span>{e.area ?? ''}</span></T>
      <T c="re-title" style={fit(e.name, 15, 0.68)}>{e.name}</T>
      <T c="re-sub"><span>{x.sub}</span><span>{x.start}</span></T>
      <div className="re-mid">
        <div className="re-scene">
          <div className="re-burst" />
          <Palm className="re-palm l" />
          <Palm className="re-palm r" />
          <Waves />
        </div>
        <T c="re-tab l"><b>{String(x.date).padStart(2, '0')}</b>{x.mon}</T>
        <T c="re-tab r"><b>{x.start.replace(/(AM|PM)$/, '').split(':')[0]}</b>{x.start.slice(-2)}</T>
      </div>
      <T c="re-djs">{x.djs.join(' · ')}</T>
      <T c="re-box">At {e.area ?? e.name}</T>
      <T c="re-foot"><span>{x.perks[1]}</span><span>RSVP on vibes</span><span>{x.city}</span></T>
    </>
  );
}

// ---------------------------------------------------------------- garden: blossom brunch
function Garden({ e, x }: Props) {
  return (
    <>
      <div className="fx-bokeh" />
      <Branch className="ga-branch r" />
      <Branch className="ga-branch l" />
      <T c="ga-date">{x.weekday.slice(0, 3)}<br />{x.mon}<br />{x.date}{x.nth}</T>
      <T c="ga-title" style={fit(`${x.weekday} ${x.sub}`, 13, 0.62)}><span>{x.weekday}</span><span>{x.sub}</span></T>
      <T c="ga-at">at {e.name}</T>
      <div className="ga-stack"><Pancakes /></div>
      <T c="ga-left"><em>Music by</em><b>{x.djs[0]}</b><em>Hosted by</em><b>The vibes crew</b></T>
      <T c="ga-right">{x.perks.slice(0, 2).map((p) => <span key={p}>{p}</span>)}<span>{x.time}</span></T>
      <T c="ga-foot"><b>Venue</b><span>{x.where}{x.city ? ` · ${x.city}` : ''}</span></T>
    </>
  );
}

// ---------------------------------------------------------------- bloom: spring festival
function Bloom({ e, x }: Props) {
  return (
    <>
      <div className="bl-strip"><Tulips /></div>
      <T c="bl-logo">★ vibes events</T>
      <T c="bl-pre">Celebrate with us at</T>
      <T c="bl-title" style={fit(e.name, 13, 0.55, 60)}>{e.name}</T>
      <T c="bl-copy">Enjoy a vibrant {x.day ? 'day' : 'night'} of {x.perks[0].toLowerCase()}, {x.perks[1].toLowerCase()} and good company{e.area ? ` in ${e.area}` : ''}.</T>
      <T c="bl-band">{x.weekday}, {x.mon} {x.date}<br />{x.time}</T>
      <T c="bl-copy small">Bring your friends and come see what the vibe is.</T>
      <T c="bl-where">{e.area ?? e.name}{x.city ? <><br />{x.city}</> : null}</T>
      <T c="bl-rsvp">♥ RSVP on vibes{x.cover ? ` · ${x.cover}` : ''}</T>
    </>
  );
}

// ---------------------------------------------------------------- illustrations
function Pumpkin() {
  return (
    <svg viewBox="0 0 200 170">
      <defs>
        <radialGradient id="pk-b" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stopColor="#ffb347" /><stop offset="0.6" stopColor="#f07a12" /><stop offset="1" stopColor="#9c3d05" /></radialGradient>
        <radialGradient id="pk-l" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stopColor="#fff6a8" /><stop offset="1" stopColor="#ffb200" /></radialGradient>
      </defs>
      <path d="M100 22 C 98 10 104 4 114 2 L 116 8 C 108 10 106 16 107 24 Z" fill="#6b7a2a" />
      <ellipse cx="62" cy="98" rx="48" ry="62" fill="url(#pk-b)" />
      <ellipse cx="138" cy="98" rx="48" ry="62" fill="url(#pk-b)" />
      <ellipse cx="100" cy="96" rx="52" ry="66" fill="url(#pk-b)" />
      <path d="M100 32 C 84 60 84 132 100 160 M100 32 C 116 60 116 132 100 160 M60 40 C 40 70 42 130 64 156 M140 40 C 160 70 158 130 136 156" stroke="#b5520a" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M62 78 L 82 78 L 72 60 Z M118 78 L 138 78 L 128 60 Z" fill="url(#pk-l)" />
      <path d="M92 96 L 108 96 L 100 84 Z" fill="url(#pk-l)" />
      <path d="M52 108 Q 100 150 148 108 L 136 112 L 130 122 L 120 116 L 110 128 L 100 118 L 90 128 L 80 116 L 70 122 L 64 112 Z" fill="url(#pk-l)" />
    </svg>
  );
}
function DiscoBall() {
  const tiles: ReactNode[] = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const cx = 20 + c * 20, cy = 20 + r * 20;
    if ((cx - 100) ** 2 + (cy - 100) ** 2 > 82 ** 2) continue;
    tiles.push(<rect key={`${r}-${c}`} x={cx - 9} y={cy - 9} width="18" height="18" rx="2" fill={`hsl(${210 + ((r * 7 + c * 3) % 5) * 6} 70% ${45 + ((r + c) % 4) * 12}%)`} />);
  }
  return (
    <svg viewBox="0 0 200 200">
      <defs><clipPath id="db-c"><circle cx="100" cy="100" r="86" /></clipPath><radialGradient id="db-s" cx="0.35" cy="0.3" r="0.7"><stop offset="0" stopColor="#fff" stopOpacity="0.9" /><stop offset="0.4" stopColor="#fff" stopOpacity="0" /></radialGradient></defs>
      <line x1="100" y1="0" x2="100" y2="16" stroke="#c9d6ff" strokeWidth="2" />
      <g clipPath="url(#db-c)">{tiles}</g>
      <circle cx="100" cy="100" r="86" fill="url(#db-s)" />
      <path d="M150 40 l4 -12 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4 z" fill="#fff" />
    </svg>
  );
}
function Bats() {
  const bat = 'M0 6 C 4 0 8 0 10 4 C 12 1 14 1 15 3 C 16 1 18 1 20 4 C 22 0 26 0 30 6 C 26 4 22 6 20 9 C 18 7 16 8 15 10 C 14 8 12 7 10 9 C 8 6 4 4 0 6 Z';
  return (
    <svg className="nx-bats" viewBox="0 0 200 60">
      <path d={bat} transform="translate(22 10) scale(0.9)" />
      <path d={bat} transform="translate(150 4) scale(0.7)" />
      <path d={bat} transform="translate(168 30) scale(0.5)" />
      <path d={bat} transform="translate(40 36) scale(0.45)" />
    </svg>
  );
}
function Flute() {
  return (
    <svg viewBox="0 0 80 220">
      <defs><linearGradient id="fl-j" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f7a81b" /><stop offset="0.5" stopColor="#ffd35a" /><stop offset="1" stopColor="#f29a12" /></linearGradient></defs>
      <path d="M22 10 L 58 10 C 58 70 52 100 40 112 C 28 100 22 70 22 10 Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
      <path d="M24 34 L 56 34 C 55 76 50 98 40 108 C 30 98 25 76 24 34 Z" fill="url(#fl-j)" />
      <path d="M40 112 L 40 196 M18 200 C 26 194 54 194 62 200 C 54 204 26 204 18 200 Z" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" fill="rgba(255,255,255,0.25)" />
      <circle cx="58" cy="16" r="12" fill="#ffe24a" stroke="#fff7c2" strokeWidth="2" />
      <path d="M58 6 L 58 26 M48 16 L 68 16 M51 9 L 65 23 M65 9 L 51 23" stroke="#fff7c2" strokeWidth="1" />
      <circle cx="34" cy="60" r="1.6" fill="#fff" opacity="0.8" /><circle cx="44" cy="80" r="1.2" fill="#fff" opacity="0.8" /><circle cx="38" cy="48" r="1" fill="#fff" opacity="0.8" />
    </svg>
  );
}
function Palm({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 100 160">
      <path d="M52 158 C 50 120 46 80 52 44" stroke="#7a4a1c" strokeWidth="7" fill="none" strokeLinecap="round" />
      <g fill="#1f8a5b">
        <path d="M52 44 C 30 30 12 36 2 52 C 20 44 36 44 52 48 Z" />
        <path d="M52 44 C 74 28 92 34 100 50 C 82 42 66 44 52 48 Z" />
        <path d="M52 44 C 40 20 24 14 10 18 C 28 24 42 34 50 46 Z" />
        <path d="M52 44 C 62 18 80 10 94 14 C 76 22 62 32 54 46 Z" />
        <path d="M52 44 C 50 22 54 8 62 0 C 60 16 58 30 54 46 Z" />
      </g>
    </svg>
  );
}
function Waves() {
  return (
    <svg className="re-waves" viewBox="0 0 300 70" preserveAspectRatio="none">
      <path d="M0 40 C 30 10 60 10 80 30 C 70 18 52 22 56 36 C 62 50 90 44 100 30 C 120 6 160 8 180 30 C 172 18 152 22 158 36 C 166 50 192 42 202 28 C 222 6 262 10 300 36 L 300 70 L 0 70 Z" fill="#2aa7a1" />
      <path d="M0 52 C 40 36 80 36 120 50 C 160 64 200 64 240 50 C 260 44 280 44 300 50 L 300 70 L 0 70 Z" fill="#1a7c7a" />
      <path d="M20 34 C 40 22 60 24 70 34 M120 26 C 140 14 160 16 170 26 M220 30 C 240 18 260 20 270 30" stroke="#f6ead0" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function Branch({ className }: { className: string }) {
  const flower = (x: number, y: number, s: number, k: string) => (
    <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-7" rx="5.5" ry="8" fill="#f6c3c3" stroke="#e79a9f" strokeWidth="0.6" transform={`rotate(${a})`} />)}
      <circle r="2.6" fill="#b5475a" />
    </g>
  );
  return (
    <svg className={className} viewBox="0 0 160 120">
      <path d="M160 6 C 120 14 90 30 60 56 C 40 74 20 86 0 92 M100 26 C 96 40 98 52 106 62 M64 52 C 58 66 60 80 70 90" stroke="#6b4a3a" strokeWidth="3" fill="none" strokeLinecap="round" />
      {flower(118, 20, 1.1, 'a')}{flower(84, 38, 0.9, 'b')}{flower(106, 62, 1, 'c')}{flower(56, 62, 1.2, 'd')}{flower(70, 92, 0.8, 'e')}{flower(26, 84, 0.9, 'f')}
    </svg>
  );
}
function Pancakes() {
  return (
    <svg viewBox="0 0 160 170">
      <defs><linearGradient id="pc-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f2b35c" /><stop offset="1" stopColor="#b56a1f" /></linearGradient></defs>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(0 ${56 - i * 16})`}>
          <ellipse cx="80" cy="40" rx="62" ry="15" fill="#8a4a14" />
          <ellipse cx="80" cy="34" rx="62" ry="15" fill="url(#pc-g)" />
        </g>
      ))}
      <path d="M40 10 C 60 2 104 2 122 10 C 120 18 112 20 110 30 C 108 22 100 22 98 28 C 96 20 88 22 86 34 C 82 22 72 24 70 30 C 66 22 54 22 50 26 C 48 20 42 18 40 10 Z" fill="#ffb12b" opacity="0.9" />
      <path d="M86 34 L 86 70 M110 30 L 110 52" stroke="#ffb12b" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      <path d="M78 96 L 78 168" stroke="#c9ced3" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
function Tulips() {
  const tulip = (x: number, y: number, s: number, c1: string, c2: string, rot: number, k: string) => (
    <g key={k} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 0 C 2 30 0 60 -2 90" stroke="#2f7d4e" strokeWidth="4" fill="none" />
      <path d="M-2 60 C -24 40 -30 20 -26 6 C -14 22 -6 40 -2 60 Z" fill="#3c9a5f" />
      <path d="M-18 -4 C -20 -26 -10 -40 0 -44 C 10 -40 20 -26 18 -4 C 10 4 -10 4 -18 -4 Z" fill={c1} />
      <path d="M-6 -2 C -12 -20 -6 -36 0 -44 C 6 -36 12 -20 6 -2 Z" fill={c2} />
    </g>
  );
  return (
    <svg viewBox="0 0 100 300" preserveAspectRatio="xMidYMid slice">
      {tulip(30, 40, 0.9, '#f08a5d', '#f9c74f', 12, 'a')}
      {tulip(78, 96, 1.1, '#e85d75', '#f7a1b5', -10, 'b')}
      {tulip(22, 150, 1, '#f9c74f', '#f08a5d', 8, 'c')}
      {tulip(80, 200, 0.9, '#c0392b', '#f08a5d', -14, 'd')}
      {tulip(36, 260, 1.15, '#e85d75', '#ffd6e0', 6, 'e')}
      <circle cx="60" cy="20" r="6" fill="#f7a1b5" /><circle cx="12" cy="104" r="5" fill="#f9c74f" /><circle cx="60" cy="150" r="7" fill="#f08a5d" /><circle cx="14" cy="214" r="5" fill="#f7a1b5" />
    </svg>
  );
}
