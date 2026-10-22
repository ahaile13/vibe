import type { CSSProperties, ReactNode } from 'react';
import type { EventRow } from '@/lib/types';
import { CITY_LIST, type City } from '@/lib/city';
import { Skyline } from './Skyline';

/**
 * A designed event flyer, used as the cover until attendees post real photos.
 *
 * Eight poster styles modeled on real flyers (neon party, black-tie noir, retro sunburst, garden
 * brunch, spring bloom, theater marquee, punk zine, Swiss minimal), four palettes each, an
 * illustration picked from the spot's theme and city (jazz gets a sax, Austin gets tacos, Phoenix
 * a cactus, game nights a ball...), and the city's own skyline. Everything is seeded by the spot,
 * so a spot keeps its flyer night after night while every spot looks different.
 *
 * The art sits on a 4:5 "sheet" sized in container units, centered over a full-bleed background,
 * so it reads the same as a card, a hero or a thumbnail.
 */

type Style = 'neon' | 'noir' | 'retro' | 'garden' | 'bloom' | 'marquee' | 'zine' | 'swiss';
type Motif =
  | 'pumpkin' | 'disco' | 'flute' | 'pancakes' | 'martini' | 'beer' | 'wine' | 'coffee' | 'sax' | 'guitar' | 'mic' | 'vinyl'
  | 'basketball' | 'football' | 'baseball' | 'taco' | 'pizza' | 'cactus' | 'hat' | 'mountain' | 'sun' | 'palm' | 'art' | 'lantern';

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}
const pick = <T,>(list: readonly T[], seed: string) => list[hash(seed) % list.length];

// ---------------------------------------------------------------- palettes: [bg1, bg2, accent, second, ink]
const PAL: Record<Style, [string, string, string, string, string][]> = {
  neon: [['#0c2c7e', '#040a24', '#ffc531', '#5cc4ff', '#f2f9ff'], ['#4a0e6b', '#12021f', '#ff4fd8', '#b47cff', '#fff0fb'], ['#06505a', '#021619', '#d9ff3d', '#2ef2e0', '#effffd'], ['#6b0f1a', '#1a0306', '#ffb347', '#ff4d4d', '#fff3ee']],
  noir: [['#2d2d31', '#070708', '#ffd35a', '#e9e9ec', '#ffffff'], ['#2a2217', '#0b0805', '#e8c27a', '#f3e6cc', '#fff8ea'], ['#1c2430', '#06090d', '#9fd0ff', '#dfe8f2', '#ffffff'], ['#32161c', '#0c0405', '#ff8fa3', '#f4dfe3', '#fff5f7']],
  retro: [['#e8513a', '#a42e1d', '#ffcf3f', '#2aa7a1', '#f6ead0'], ['#1f6f8b', '#103d4d', '#ffcf3f', '#f08a3e', '#f6ead0'], ['#f2a33a', '#c46a12', '#7a1f12', '#2aa7a1', '#fff4dc'], ['#3d7a4a', '#1f4a2c', '#ffd25e', '#e8513a', '#f6ead0']],
  garden: [['#24665d', '#0a2523', '#ffece0', '#f6c9a8', '#ffffff'], ['#3b2a4f', '#120a1c', '#ffe3f1', '#e6b8ff', '#ffffff'], ['#5a3b2a', '#1c110a', '#fff0d6', '#f2c58a', '#ffffff'], ['#1e4a6b', '#08182a', '#e8f4ff', '#a9d6ff', '#ffffff']],
  bloom: [['#f7d4d8', '#f7d4d8', '#ad2f5a', '#1f7a55', '#3b3236'], ['#fff1c9', '#fff1c9', '#c0492b', '#2c5a8a', '#3a2e22'], ['#dff0e6', '#dff0e6', '#2a6b55', '#d9542f', '#22322b'], ['#e6e1ff', '#e6e1ff', '#5a3fb0', '#e0567a', '#2c2840']],
  marquee: [['#4a0d14', '#1a0306', '#ffe7a3', '#ffb11b', '#fff6dd'], ['#0f2240', '#050b16', '#fff1c4', '#ffcc33', '#f6f3ea'], ['#123b2a', '#04140d', '#fff2c9', '#ffbf3c', '#f3fbf5'], ['#2b1240', '#0d0414', '#ffe9b5', '#ff9f43', '#fbf2ff']],
  zine: [['#f3efe6', '#f3efe6', '#ff2e88', '#ffe600', '#111111'], ['#efeee9', '#efeee9', '#00d084', '#ff5a1f', '#111111'], ['#f1ece2', '#f1ece2', '#3b5bff', '#ff2e2e', '#111111'], ['#f4f0e8', '#f4f0e8', '#ff7a00', '#7c4dff', '#111111']],
  swiss: [['#ff4f1f', '#ff4f1f', '#111111', '#ffffff', '#111111'], ['#1546ff', '#1546ff', '#ffffff', '#ffd400', '#ffffff'], ['#f5e9d6', '#f5e9d6', '#e3262e', '#111111', '#111111'], ['#0f0f0f', '#0f0f0f', '#c8ff00', '#ffffff', '#ffffff']],
};

const DJS = ['DJ Nova', 'DJ Kairo', 'DJ Lux', 'DJ Solace', 'DJ Marz', 'DJ Vela', 'DJ Rome', 'DJ Tempo', 'DJ Saint', 'DJ Blaze', 'DJ Onyx', 'DJ Sable', 'DJ Juno', 'DJ Remy', 'DJ Atlas', 'DJ Coco', 'DJ Ivory', 'DJ Echo', 'DJ Kenji', 'DJ Reign', 'DJ Halo', 'DJ Mako', 'DJ Rio', 'DJ Zara'];

const SUB: Record<string, [string, string]> = {
  Clubs: ['Day Party', 'Nights'], Parties: ['Day Party', 'Party'], Bars: ['Social', 'Happy Hour'], Restaurants: ['Brunch', 'Dinner & Drinks'],
  Concerts: ['Live', 'Live'], Events: ['Festival', 'Night Market'], Sports: ['Watch Party', 'Game Night'],
};
const PERKS: Record<string, string[]> = {
  Clubs: ['Ladies free before 11', 'Bottle specials all night', 'Dress to impress', 'Two rooms of music'],
  Parties: ['Dance · Drinks · Games', 'Photo booth', 'Late night bites', 'Glow sticks at the door'],
  Bars: ['$5 drafts till 8', 'Half-off cocktails', 'Patio open', 'Trivia at 8'],
  Restaurants: ['Bottomless mimosas', 'Chef’s tasting menu', 'Live music on the patio', 'Dessert on the house'],
  Concerts: ['Doors open early', 'All-local lineup', 'Full bar inside', 'Merch table'],
  Events: ['Food trucks & vendors', 'Live art & music', 'Free for all ages', 'Pop-up shops'],
  Sports: ['Every game on the big screen', 'Wing & pitcher specials', 'Halftime giveaways', 'Wear your colors'],
};

function nearestCity(e: EventRow): City | null {
  if (e.lat == null || e.lng == null) return null;
  let best = CITY_LIST[0], bd = Infinity;
  for (const c of CITY_LIST) {
    const d = (c.center.lat - e.lat) ** 2 + (c.center.lng - e.lng) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

const hourText = (d: Date) => {
  const h = d.getHours(), m = d.getMinutes();
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'AM' : 'PM'}`;
};

/** What the flyer draws: themed by the spot's name, category and city. */
function motifFor(e: EventRow, city: City | null, day: boolean, month: number, date: number, seed: string): Motif {
  const n = `${e.name} ${e.area ?? ''}`.toLowerCase();
  const c = city?.id ?? '';
  const any = (...m: Motif[]) => pick(m, `${seed}:motif`);
  // Late October: about a third of night parties go full Halloween.
  if (month === 9 && date >= 17 && !day && (e.category === 'Parties' || e.category === 'Clubs') && hash(`${seed}:spooky`) % 3 === 0) return 'pumpkin';
  if (/jazz|sax/.test(n)) return 'sax';
  if (/music row|live|concert|red river|fillmore|tobin/.test(n) || e.category === 'Concerts') return any('guitar', 'mic', 'vinyl');
  if (e.category === 'Sports') return /wrigley|ballpark|china basin|east village|south philly/.test(n) ? 'baseball' : any('basketball', 'football', 'basketball');
  if (/beach|pier|cove|ocean|waterfront|boardwalk|santa monica/.test(n)) return any('sun', 'palm');
  if (/art|mural|roosevelt row|rino|design/.test(n)) return 'art';
  if (/park|trail|lake|bayou|garden|green|zilker|plaza/.test(n)) return c === 'denver' || c === 'seattle' ? 'mountain' : c === 'phoenix' ? 'cactus' : any('sun', 'lantern');
  if (/market|food|eats|hall/.test(n)) return c === 'austin' || c === 'san-antonio' || c === 'los-angeles' ? 'taco' : c === 'chicago' || c === 'new-york' ? 'pizza' : any('taco', 'pizza', 'coffee');
  if (c === 'nashville' || c === 'fort-worth' || (c === 'austin' && e.category === 'Bars') || /stockyards|honky/.test(n)) return any('hat', 'guitar');
  if (c === 'phoenix' && day) return 'cactus';
  if (c === 'seattle' && day) return 'coffee';
  switch (e.category) {
    case 'Restaurants': return day ? any('pancakes', 'coffee', 'flute') : any('wine', 'martini');
    case 'Bars': return day ? any('beer', 'flute', 'sun') : any('martini', 'beer', 'wine');
    case 'Clubs': return any('disco', 'vinyl', 'martini');
    case 'Parties': return any('disco', 'vinyl', 'lantern');
    case 'Events': return day ? any('lantern', 'sun', 'art') : any('lantern', 'disco');
    default: return any('disco', 'sun');
  }
}

function styleFor(e: EventRow, day: boolean, seed: string): Style {
  const opts: Record<string, [Style[], Style[]]> = {
    Clubs: [['retro', 'zine', 'swiss'], ['neon', 'noir', 'marquee', 'zine', 'swiss']],
    Parties: [['retro', 'bloom', 'zine', 'swiss'], ['neon', 'marquee', 'zine', 'noir']],
    Bars: [['retro', 'garden', 'swiss', 'zine'], ['noir', 'neon', 'retro', 'marquee', 'swiss']],
    Restaurants: [['garden', 'noir', 'bloom', 'swiss'], ['garden', 'noir', 'marquee']],
    Concerts: [['retro', 'zine', 'swiss'], ['neon', 'marquee', 'zine', 'noir']],
    Events: [['bloom', 'retro', 'garden', 'swiss', 'zine'], ['retro', 'neon', 'marquee']],
    Sports: [['retro', 'swiss', 'zine'], ['neon', 'retro', 'swiss', 'marquee']],
  };
  const [d, n] = opts[e.category] ?? [['bloom', 'retro', 'swiss'], ['neon', 'noir', 'marquee']];
  return pick(day ? d : n, `${seed}:style`);
}

function details(e: EventRow) {
  const s = new Date(e.starts_at), end = new Date(e.ends_at);
  const seed = e.venue_id ?? e.name;
  const day = s.getHours() < 15;
  const date = s.getDate();
  const nth = date % 10 === 1 && date !== 11 ? 'st' : date % 10 === 2 && date !== 12 ? 'nd' : date % 10 === 3 && date !== 13 ? 'rd' : 'th';
  const d1 = hash(`${seed}:dj`) % DJS.length;
  const city = nearestCity(e);
  const perks = PERKS[e.category] ?? PERKS.Events;
  const p0 = hash(`${seed}:perk`) % perks.length;
  return {
    seed, day, date, nth, city,
    weekday: s.toLocaleDateString('en-US', { weekday: 'long' }),
    mon: s.toLocaleDateString('en-US', { month: 'short' }),
    djs: [DJS[d1], DJS[(d1 + 7) % DJS.length], DJS[(d1 + 13) % DJS.length]],
    sub: (SUB[e.category] ?? ['Social', 'Night Out'])[day ? 0 : 1],
    perks: [perks[p0], perks[(p0 + 1) % perks.length], perks[(p0 + 2) % perks.length]],
    time: `${hourText(s)} – ${hourText(end)}`,
    start: hourText(s),
    month: s.getMonth(),
    cityName: city ? `${city.name}, ${city.state}` : '',
    where: [e.address, e.area].filter(Boolean).join(' · '),
    age: e.age_rule ?? '',
    cover: e.cover_charge ?? '',
  };
}

/** Which poster style an event gets (stable per spot). */
export const flyerStyle = (e: EventRow): Style => styleFor(e, new Date(e.starts_at).getHours() < 15, e.venue_id ?? e.name);

export function Flyer({ event }: { event: EventRow }) {
  const x = details(event);
  const style = styleFor(event, x.day, x.seed);
  const pal = pick(PAL[style], `${x.seed}:pal`);
  const motif = motifFor(event, x.city, x.day, x.month, x.date, x.seed);
  const variant = hash(`${x.seed}:var`) % 2;
  const vars = { '--x1': pal[0], '--x2': pal[1], '--xa': pal[2], '--xb': pal[3], '--xi': pal[4] } as CSSProperties;
  const Art = { neon: Neon, noir: Noir, retro: Retro, garden: Garden, bloom: Bloom, marquee: Marquee, zine: Zine, swiss: Swiss }[style];
  return (
    <div className={`art flyer fx fx-${style} fv${variant}`} style={vars} aria-hidden="true">
      <div className="fx-bg" />
      <div className="fx-sheet">
        <Art e={event} x={{ ...x, spooky: motif === 'pumpkin' }} m={<Motif m={motif} />} />
      </div>
    </div>
  );
}

type Props = { e: EventRow; x: ReturnType<typeof details> & { spooky: boolean }; m: ReactNode };
const T = ({ c, children, style }: { c: string; children: ReactNode; style?: CSSProperties }) => <div className={`t ${c}`} style={style}>{children}</div>;

/** Title size that keeps the longest word on one line and the title on about two lines. */
function fit(text: string, base: number, ratio: number, avail = 84): CSSProperties {
  const longest = Math.max(4, ...text.split(/\s+/).map((w) => w.length));
  const twoLines = (avail * 1.8) / (ratio * Math.max(8, text.length));
  return { ['--fs' as string]: `${Math.min(base, avail / (ratio * longest), twoLines).toFixed(2)}cqw` };
}

/** The spot's city skyline as a flat silhouette in the flyer's colors. */
const CitySky = ({ x, className }: { x: Props['x']; className: string }) => (x.city ? <div className={`fx-sky ${className}`}><Skyline city={x.city} /></div> : null);

// ---------------------------------------------------------------- neon: glowing night party
function Neon({ e, x, m }: Props) {
  return (
    <>
      <div className="fx-rays" />
      <CitySky x={x} className="nx-sky" />
      <T c="nx-pre">vibes presents</T>
      <T c="nx-title" style={fit(e.name, 19, 0.42)}>{e.name}</T>
      <T c="nx-sub">{x.spooky ? 'Halloween ' : ''}{x.sub}</T>
      <div className="nx-art">{m}</div>
      <T c="nx-date">{x.weekday}, {x.mon} {x.date}</T>
      <T c="nx-line">{/dance/i.test(x.perks[0]) ? x.perks[0] : `Dance · Drinks · ${x.perks[0]}`}</T>
      <T c="nx-djs">{x.djs[0]} | {x.djs[1]}</T>
      <T c="nx-foot">{x.where}{x.cityName ? ` · ${x.cityName}` : ''}<br />{x.time}{x.age ? ` · ${x.age}` : ''} · RSVP on vibes</T>
    </>
  );
}

// ---------------------------------------------------------------- noir: black-tie brunch / lounge
function Noir({ e, x, m }: Props) {
  const words = e.name.split(' ');
  const mid = Math.ceil(words.length / 2);
  const kicker = (e.area ?? x.city?.name ?? e.category);
  return (
    <>
      <div className="fx-marble" />
      <T c="no-date">{x.weekday} {x.mon} {x.date}{x.nth}</T>
      <T c="no-kicker" style={fit(kicker.replace(/\s/g, ''), 7.4, 1.3, 80)}>{kicker.split('').join(' ')}</T>
      <div className="no-spark" />
      <T c="no-title" style={fit(e.name, 13, 0.62, 80)}>{words.slice(0, mid).join(' ')}<br />{words.slice(mid).join(' ') || x.sub}</T>
      <div className="no-spark" />
      <T c="no-tags">#{x.sub.replace(/[^a-z]/gi, '')} #vibe #{x.city ? x.city.name.replace(/\s/g, '') : 'nightout'}</T>
      <div className="no-cols">
        <T c="no-info">
          <b>{x.perks[0]}</b>
          {x.cover && <span>{x.cover} cover</span>}
          <em>Music by</em>
          {x.djs.map((d) => <span key={d}>{d}</span>)}
          <b className="no-time">{x.time}</b>
        </T>
        <div className="no-art">{m}</div>
      </div>
      <T c="no-foot"><b>Venue</b>{x.where}{x.cityName ? `, ${x.cityName}` : ''}</T>
    </>
  );
}

// ---------------------------------------------------------------- retro: sunburst party
function Retro({ e, x, m }: Props) {
  return (
    <>
      <div className="re-frame" />
      <T c="re-pre"><span>vibes</span><span>presents</span><span>{x.city?.name ?? ''}</span></T>
      <T c="re-title" style={fit(e.name, 15, 0.68)}>{e.name}</T>
      <T c="re-sub"><span>{x.sub}</span><span>{x.start}</span></T>
      <div className="re-mid">
        <div className="re-scene">
          <div className="re-burst" />
          <CitySky x={x} className="re-sky" />
          <div className="re-art">{m}</div>
        </div>
        <T c="re-tab l"><b>{String(x.date).padStart(2, '0')}</b>{x.mon}</T>
        <T c="re-tab r"><b>{x.start.replace(/(AM|PM)$/, '').split(':')[0]}</b>{x.start.slice(-2)}</T>
      </div>
      <T c="re-djs">{x.djs.join(' · ')}</T>
      <T c="re-box">At {e.area ?? e.name}</T>
      <T c="re-foot"><span>{x.perks[1]}</span><span>RSVP on vibes</span><span>{x.cityName}</span></T>
    </>
  );
}

// ---------------------------------------------------------------- garden: blossom brunch
function Garden({ e, x, m }: Props) {
  return (
    <>
      <div className="fx-bokeh" />
      <Branch className="ga-branch r" />
      <Branch className="ga-branch l" />
      <T c="ga-date">{x.weekday.slice(0, 3)}<br />{x.mon}<br />{x.date}{x.nth}</T>
      <T c="ga-title" style={fit(`${x.weekday} ${x.sub}`, 13, 0.62)}><span>{x.weekday}</span><span>{x.sub}</span></T>
      <T c="ga-at">at {e.name}</T>
      <div className="ga-art">{m}</div>
      <T c="ga-left"><em>Music by</em><b>{x.djs[0]}</b><em>Hosted by</em><b>The vibes crew</b></T>
      <T c="ga-right">{x.perks.slice(0, 2).map((p) => <span key={p}>{p}</span>)}<span>{x.time}</span></T>
      <T c="ga-foot"><b>Venue</b><span>{x.where}{x.cityName ? ` · ${x.cityName}` : ''}</span></T>
    </>
  );
}

// ---------------------------------------------------------------- bloom: spring festival
function Bloom({ e, x, m }: Props) {
  return (
    <>
      <div className="bl-strip"><Tulips /></div>
      <T c="bl-logo">★ vibes events</T>
      <T c="bl-pre">Celebrate with us at</T>
      <T c="bl-title" style={fit(e.name, 13, 0.55, 60)}>{e.name}</T>
      <T c="bl-copy">Enjoy a vibrant {x.day ? 'day' : 'night'} of {x.perks[0].toLowerCase()}, {x.perks[1].toLowerCase()} and good company{e.area ? ` in ${e.area}` : ''}.</T>
      <div className="bl-art">{m}</div>
      <T c="bl-band">{x.weekday}, {x.mon} {x.date}<br />{x.time}</T>
      <T c="bl-copy small">Bring your friends and come see what the vibe is.</T>
      <T c="bl-where">{e.area ?? e.name}{x.cityName ? <><br />{x.cityName}</> : null}</T>
      <T c="bl-rsvp">♥ RSVP on vibes{x.cover ? ` · ${x.cover}` : ''}</T>
    </>
  );
}

// ---------------------------------------------------------------- marquee: vintage theater sign
function Marquee({ e, x, m }: Props) {
  return (
    <>
      <div className="mq-glow" />
      <T c="mq-pre">{x.day ? 'Today only' : 'Tonight only'} · {x.city?.name ?? 'vibes'}</T>
      <div className="mq-sign">
        <T c="mq-now">Now showing</T>
        <T c="mq-title" style={fit(e.name, 13, 0.42, 66)}>{e.name}</T>
        <T c="mq-sub">{x.sub} · {x.start}</T>
      </div>
      <div className="mq-art">{m}</div>
      <T c="mq-date">{x.weekday} · {x.mon} {x.date}</T>
      <T c="mq-djs">Starring {x.djs[0]} & {x.djs[1]}</T>
      <T c="mq-perk">{x.perks[0]}</T>
      <CitySky x={x} className="mq-sky" />
      <T c="mq-foot">{x.where}{x.cityName ? ` · ${x.cityName}` : ''}</T>
    </>
  );
}

// ---------------------------------------------------------------- zine: punk collage
function Zine({ e, x, m }: Props) {
  const words = e.name.split(' ');
  return (
    <>
      <div className="zn-dots" />
      <div className="zn-tape a" /><div className="zn-tape b" />
      <T c="zn-pre">{x.city?.name ?? 'vibes'} // issue no.{(hash(x.seed) % 90) + 10}</T>
      <T c="zn-title" style={fit(e.name, 17, 0.42, 82)}>{words.map((w, i) => <span key={i}>{w} </span>)}</T>
      <div className="zn-cut"><div className="zn-cut-in">{m}</div></div>
      <T c="zn-stamp"><b>{x.mon} {x.date}</b>{x.start}</T>
      <T c="zn-djs">w/ {x.djs[0]}<br />+ {x.djs[1]}</T>
      <T c="zn-note">{x.perks[0]}! {x.perks[1].toLowerCase()}. {x.age || 'all welcome'}.</T>
      <T c="zn-foot">{x.where}{x.cityName ? ` · ${x.cityName}` : ''} · RSVP on vibes</T>
    </>
  );
}

// ---------------------------------------------------------------- swiss: modern minimal
function Swiss({ e, x, m }: Props) {
  return (
    <>
      <div className="sw-grid" />
      {(() => {
        const big = [String(x.date).padStart(2, '0'), x.start.replace(/:\d\d/, ''), e.name.replace(/^the\s+/i, '').charAt(0)][hash(`${x.seed}:big`) % 3];
        return <T c="sw-num" style={{ ['--n' as string]: Math.max(2, big.length) }}>{big}</T>;
      })()}
      <T c="sw-mon">{x.mon}<br />{x.weekday}</T>
      <div className="sw-art">{m}</div>
      <T c="sw-title" style={fit(e.name, 11, 0.56, 80)}>{e.name}</T>
      <div className="sw-cols">
        <T c="sw-col"><em>When</em>{x.time}</T>
        <T c="sw-col"><em>Who</em>{x.djs[0]}<br />{x.djs[1]}</T>
        <T c="sw-col"><em>Where</em>{e.area ?? ''}<br />{x.city?.name ?? ''}</T>
      </div>
      <T c="sw-foot"><span>{x.sub}</span><span>{x.perks[0]}</span><span>vibes</span></T>
    </>
  );
}

// ---------------------------------------------------------------- illustrations
function Motif({ m }: { m: Motif }) {
  switch (m) {
    case 'pumpkin': return <Pumpkin />;
    case 'disco': return <DiscoBall />;
    case 'flute': return <svg viewBox="0 0 120 220"><g transform="translate(20 0)"><Flute /></g></svg>;
    case 'pancakes': return <Pancakes />;
    case 'palm': return <svg viewBox="0 0 100 160"><Palm /></svg>;
    default: return <Simple m={m} />;
  }
}

/** Compact illustrations; some colors come from the flyer palette so they belong to it. */
function Simple({ m }: { m: Motif }) {
  const A = 'var(--xa)', B = 'var(--xb)', I = 'var(--xi)';
  const svg = (vb: string, body: ReactNode) => <svg viewBox={vb}>{body}</svg>;
  switch (m) {
    case 'martini': return svg('0 0 120 160', <><path d="M10 14 L 110 14 L 60 74 Z" fill={B} opacity="0.85" /><path d="M10 14 L 110 14 L 60 74 Z" fill="none" stroke={I} strokeWidth="3" /><path d="M60 74 L 60 138 M34 146 L 86 146" stroke={I} strokeWidth="4" strokeLinecap="round" /><circle cx="74" cy="34" r="8" fill="#7cb342" stroke={I} strokeWidth="2" /><path d="M74 34 L 96 2" stroke={I} strokeWidth="2.5" /></>);
    case 'beer': return svg('0 0 140 160', <><rect x="22" y="34" width="72" height="112" rx="8" fill="#f5b52e" stroke={I} strokeWidth="4" /><path d="M94 58 C 128 58 128 120 94 120" fill="none" stroke={I} strokeWidth="9" /><path d="M16 38 C 10 18 30 10 40 18 C 46 4 70 6 74 18 C 84 8 104 14 100 34 C 104 44 90 48 84 42 C 76 50 62 48 58 42 C 50 50 30 50 16 38 Z" fill="#fffaf0" stroke={I} strokeWidth="3" /><path d="M42 64 L 42 128 M58 64 L 58 128 M74 64 L 74 128" stroke="#fff3c4" strokeWidth="3" opacity="0.6" /></>);
    case 'wine': return svg('0 0 120 180', <><path d="M28 10 L 92 10 C 96 60 84 88 60 92 C 36 88 24 60 28 10 Z" fill="none" stroke={I} strokeWidth="3.5" /><path d="M30 44 L 90 44 C 90 70 80 86 60 88 C 40 86 30 70 30 44 Z" fill="#8e1b3c" /><path d="M60 92 L 60 160 M32 168 L 88 168" stroke={I} strokeWidth="4" strokeLinecap="round" /></>);
    case 'coffee': return svg('0 0 150 160', <><path d="M24 60 L 112 60 L 102 140 C 100 150 36 150 34 140 Z" fill={B} stroke={I} strokeWidth="4" /><path d="M110 76 C 140 76 140 118 106 118" fill="none" stroke={I} strokeWidth="8" /><path d="M50 46 C 40 32 60 24 50 8 M70 46 C 60 32 80 24 70 8 M90 46 C 80 32 100 24 90 8" fill="none" stroke={I} strokeWidth="3.5" strokeLinecap="round" opacity="0.8" /><path d="M10 146 L 126 146" stroke={I} strokeWidth="5" strokeLinecap="round" /></>);
    case 'sax': return svg('0 0 140 180', <><path d="M92 6 L 100 14 L 76 40 C 70 46 68 56 68 66 L 68 126 C 68 156 48 170 30 160 C 12 150 14 128 30 120 L 46 128 C 40 134 40 144 48 146 C 56 148 60 140 60 126 L 60 60 C 60 46 64 36 72 28 Z" fill="#e7b43d" stroke={I} strokeWidth="3" />{[70, 84, 98, 112].map((y) => <circle key={y} cx="56" cy={y} r="5" fill={I} />)}<path d="M18 112 C 8 110 6 126 18 128" fill="none" stroke={I} strokeWidth="3" /><path d="M110 40 l6 -10 M120 56 l12 -4 M114 70 l10 6" stroke={A} strokeWidth="4" strokeLinecap="round" /></>);
    case 'guitar': return svg('0 0 120 200', <><path d="M60 196 C 22 196 12 166 26 146 C 34 134 30 122 34 112 C 40 98 56 98 60 104 C 64 98 80 98 86 112 C 90 122 86 134 94 146 C 108 166 98 196 60 196 Z" fill="#c8662b" stroke={I} strokeWidth="3" /><circle cx="60" cy="150" r="12" fill={I} /><rect x="55" y="16" width="10" height="100" fill="#5b3a1e" /><rect x="50" y="2" width="20" height="22" rx="4" fill="#3a2412" />{[0, 1, 2].map((i) => <circle key={i} cx={i % 2 ? 74 : 46} cy={6 + i * 7} r="3" fill={A} />)}<path d="M58 20 L 58 180 M62 20 L 62 180" stroke="#f3e2b8" strokeWidth="0.8" /><rect x="48" y="176" width="24" height="5" fill={I} /></>);
    case 'mic': return svg('0 0 120 200', <><rect x="34" y="8" width="52" height="84" rx="26" fill="#cfd6dd" stroke={I} strokeWidth="3" />{[24, 36, 48, 60, 72].map((y) => <path key={y} d={`M38 ${y} L 82 ${y}`} stroke="#7a8590" strokeWidth="2" />)}<path d="M20 70 C 20 120 100 120 100 70" fill="none" stroke={I} strokeWidth="5" /><path d="M60 112 L 60 168 M32 176 L 88 176" stroke={I} strokeWidth="6" strokeLinecap="round" /><path d="M8 30 l-6 -6 M8 54 l-8 0 M112 30 l6 -6 M112 54 l8 0" stroke={A} strokeWidth="4" strokeLinecap="round" /></>);
    case 'vinyl': return svg('0 0 160 160', <><circle cx="80" cy="80" r="74" fill="#141414" stroke={I} strokeWidth="2" />{[62, 50, 38].map((r) => <circle key={r} cx="80" cy="80" r={r} fill="none" stroke="#333" strokeWidth="1.5" />)}<circle cx="80" cy="80" r="22" fill={A} /><circle cx="80" cy="80" r="4" fill="#141414" /><path d="M40 40 A 56 56 0 0 1 80 24" stroke="#fff" strokeWidth="3" opacity="0.35" fill="none" /></>);
    case 'basketball': return svg('0 0 160 160', <><circle cx="80" cy="80" r="70" fill="#e8762b" stroke={I} strokeWidth="4" /><path d="M10 80 L 150 80 M80 10 L 80 150 M30 30 C 60 60 60 100 30 130 M130 30 C 100 60 100 100 130 130" stroke="#3a1a08" strokeWidth="4" fill="none" /></>);
    case 'football': return svg('0 0 180 120', <><path d="M10 60 C 40 4 140 4 170 60 C 140 116 40 116 10 60 Z" fill="#8a4a1c" stroke={I} strokeWidth="4" /><path d="M60 60 L 120 60" stroke="#fff" strokeWidth="4" />{[70, 82, 94, 106].map((x) => <path key={x} d={`M${x} 52 L ${x} 68`} stroke="#fff" strokeWidth="3.5" />)}<path d="M28 40 C 34 50 34 70 28 80 M152 40 C 146 50 146 70 152 80" stroke="#fff" strokeWidth="3" fill="none" /></>);
    case 'baseball': return svg('0 0 160 160', <><circle cx="80" cy="80" r="70" fill="#fbf7ee" stroke={I} strokeWidth="4" /><path d="M36 26 C 60 56 60 104 36 134 M124 26 C 100 56 100 104 124 134" stroke="#d62d2d" strokeWidth="3" fill="none" strokeDasharray="5 5" /></>);
    case 'taco': return svg('0 0 180 120', <><path d="M10 104 C 10 30 170 30 170 104 Z" fill="#f2c14e" stroke={I} strokeWidth="4" /><path d="M24 92 C 28 50 60 40 80 46 C 100 34 140 44 156 92" fill="none" stroke="#5fb34a" strokeWidth="10" strokeLinecap="round" /><path d="M36 86 C 50 60 70 58 90 66 C 110 56 130 64 146 86" fill="none" stroke="#c0392b" strokeWidth="9" strokeLinecap="round" /><path d="M48 80 L 60 70 M90 70 L 100 62 M120 72 L 130 80" stroke="#fff3c4" strokeWidth="6" strokeLinecap="round" /></>);
    case 'pizza': return svg('0 0 160 170', <><path d="M80 166 L 6 22 C 50 2 110 2 154 22 Z" fill="#f6c453" stroke={I} strokeWidth="4" /><path d="M6 22 C 50 2 110 2 154 22 L 148 36 C 104 18 56 18 12 36 Z" fill="#c9782e" />{[[60, 52], [96, 50], [80, 86], [66, 118], [104, 82]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="10" fill="#c0392b" />)}</>);
    case 'cactus': return svg('0 0 140 180', <><path d="M58 176 L 58 30 C 58 10 86 10 86 30 L 86 176 Z" fill="#3c9a5f" stroke={I} strokeWidth="3" /><path d="M58 100 L 36 100 C 24 100 22 90 22 82 L 22 52 C 22 40 38 40 38 52 L 38 84 L 58 84" fill="#3c9a5f" stroke={I} strokeWidth="3" /><path d="M86 80 L 104 80 C 116 80 118 70 118 62 L 118 40 C 118 28 102 28 102 40 L 102 64 L 86 64" fill="#3c9a5f" stroke={I} strokeWidth="3" /><circle cx="72" cy="18" r="8" fill={A} /><path d="M10 176 L 130 176" stroke={I} strokeWidth="5" strokeLinecap="round" /></>);
    case 'hat': return svg('0 0 200 120', <><path d="M10 80 C 20 60 50 96 100 96 C 150 96 180 60 190 80 C 196 100 150 116 100 116 C 50 116 4 100 10 80 Z" fill="#8a5a2b" stroke={I} strokeWidth="3" /><path d="M54 84 C 52 40 62 14 80 20 C 90 24 94 30 100 30 C 106 30 110 24 120 20 C 138 14 148 40 146 84 C 120 92 80 92 54 84 Z" fill="#a8703a" stroke={I} strokeWidth="3" /><path d="M56 70 C 80 78 120 78 144 70 L 145 80 C 120 88 80 88 55 80 Z" fill={A} /></>);
    case 'mountain': return svg('0 0 200 130', <><path d="M0 128 L 70 20 L 110 80 L 140 44 L 200 128 Z" fill={B} stroke={I} strokeWidth="3" /><path d="M70 20 L 86 46 L 76 42 L 66 50 L 58 40 Z M140 44 L 152 62 L 142 58 L 134 64 Z" fill="#fff" /><circle cx="160" cy="22" r="12" fill={A} /></>);
    case 'sun': return svg('0 0 200 140', <><circle cx="100" cy="110" r="62" fill={A} />{Array.from({ length: 11 }, (_, i) => { const t = Math.PI + (i * Math.PI) / 10; return <path key={i} d={`M${100 + Math.cos(t) * 74} ${110 + Math.sin(t) * 74} L ${100 + Math.cos(t) * 96} ${110 + Math.sin(t) * 96}`} stroke={A} strokeWidth="6" strokeLinecap="round" />; })}<path d="M0 116 C 30 104 60 128 100 116 C 140 104 170 128 200 116 L 200 140 L 0 140 Z" fill={B} /></>);
    case 'art': return svg('0 0 180 150', <><path d="M90 10 C 150 10 176 50 170 84 C 164 112 130 104 120 118 C 110 134 124 146 100 146 C 40 146 8 112 10 74 C 12 36 44 10 90 10 Z" fill="#f3e2c0" stroke={I} strokeWidth="4" />{([['#e74c3c', 52, 50], ['#f1c40f', 88, 34], ['#2ecc71', 126, 48], ['#3498db', 140, 78], ['#9b59b6', 44, 92]] as const).map(([c, x, y]) => <circle key={c} cx={x} cy={y} r="13" fill={c} />)}<circle cx="96" cy="110" r="12" fill="#fff" stroke={I} strokeWidth="3" /></>);
    case 'lantern': return svg('0 0 180 150', <>{([[40, 40, '#ff6b4a'], [100, 30, '#ffc531'], [150, 56, '#ff4fa0'], [70, 92, '#ffc531'], [130, 106, '#ff6b4a']] as const).map(([x, y, c], i) => <g key={i}><path d={`M${x} 0 L ${x} ${y - 22}`} stroke={I} strokeWidth="1.5" opacity="0.6" /><ellipse cx={x} cy={y} rx="18" ry="22" fill={c} /><path d={`M${x - 18} ${y} L ${x + 18} ${y}`} stroke="#000" strokeOpacity="0.25" strokeWidth="2" /><rect x={x - 7} y={y - 26} width="14" height="6" fill={I} /></g>)}</>);
    default: return null;
  }
}

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
function Flute() {
  return (
    <g>
      <defs><linearGradient id="fl-j" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f7a81b" /><stop offset="0.5" stopColor="#ffd35a" /><stop offset="1" stopColor="#f29a12" /></linearGradient></defs>
      <path d="M22 10 L 58 10 C 58 70 52 100 40 112 C 28 100 22 70 22 10 Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <path d="M24 34 L 56 34 C 55 76 50 98 40 108 C 30 98 25 76 24 34 Z" fill="url(#fl-j)" />
      <path d="M40 112 L 40 196 M18 200 C 26 194 54 194 62 200 C 54 204 26 204 18 200 Z" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" fill="rgba(255,255,255,0.25)" />
      <circle cx="58" cy="16" r="12" fill="#ffe24a" stroke="#fff7c2" strokeWidth="2" />
      <path d="M58 6 L 58 26 M48 16 L 68 16 M51 9 L 65 23 M65 9 L 51 23" stroke="#fff7c2" strokeWidth="1" />
    </g>
  );
}
function Palm() {
  return (
    <g>
      <path d="M52 158 C 50 120 46 80 52 44" stroke="#7a4a1c" strokeWidth="7" fill="none" strokeLinecap="round" />
      <g fill="#1f8a5b">
        <path d="M52 44 C 30 30 12 36 2 52 C 20 44 36 44 52 48 Z" />
        <path d="M52 44 C 74 28 92 34 100 50 C 82 42 66 44 52 48 Z" />
        <path d="M52 44 C 40 20 24 14 10 18 C 28 24 42 34 50 46 Z" />
        <path d="M52 44 C 62 18 80 10 94 14 C 76 22 62 32 54 46 Z" />
        <path d="M52 44 C 50 22 54 8 62 0 C 60 16 58 30 54 46 Z" />
      </g>
    </g>
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
