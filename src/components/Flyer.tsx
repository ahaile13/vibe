import type { CSSProperties } from 'react';
import type { EventRow } from '@/lib/types';

/**
 * A designed event flyer, used as the cover until attendees post real photos.
 * Six poster styles, chosen per event and leaning on its category. Text sizes
 * use container units so the same flyer works as a card, a thumbnail or a hero.
 */

type Style = 'sunset' | 'marquee' | 'halftone' | 'waves' | 'arch' | 'split';

interface Palette { bg: string; a: string; b: string; ink: string }
const PALETTES: Palette[] = [
  { bg: '#1d1310', a: '#ee8b5a', b: '#f2d58a', ink: '#fbefe2' }, // ember
  { bg: '#1a1222', a: '#c48bd8', b: '#ee8b5a', ink: '#f6eefb' }, // plum
  { bg: '#0f1d20', a: '#5fb3a8', b: '#e6cfa4', ink: '#eef7f5' }, // teal
  { bg: '#efe4d0', a: '#c0573a', b: '#1d2a30', ink: '#1d2a30' }, // sand
  { bg: '#101828', a: '#8fb3e9', b: '#f2d58a', ink: '#eef3fb' }, // navy
  { bg: '#1b1d12', a: '#c9c07a', b: '#e08a82', ink: '#f3f1e2' }, // olive
  { bg: '#f3dcd6', a: '#9c3d4e', b: '#22303a', ink: '#22303a' }, // rose
];

const BY_CATEGORY: Record<string, Style[]> = {
  Clubs: ['marquee', 'halftone', 'waves'],
  Concerts: ['sunset', 'waves', 'halftone'],
  Parties: ['halftone', 'waves', 'marquee'],
  Bars: ['arch', 'split', 'sunset'],
  Restaurants: ['arch', 'split'],
  Events: ['split', 'sunset', 'arch'],
  Sports: ['split', 'halftone'],
};

const TAGLINE: Record<string, string> = {
  Clubs: 'Late night sessions',
  Concerts: 'Live on stage',
  Parties: 'Block party',
  Bars: 'Patio nights',
  Restaurants: 'Dinner & drinks',
  Events: 'Night market',
  Sports: 'Watch party',
};

function hash(s: string) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function whenLine(startIso: string) {
  const d = new Date(startIso);
  const now = new Date();
  const day = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: d.getMinutes() ? '2-digit' : undefined }).replace(' ', '');
  const label = day === 0 ? (d.getHours() >= 17 ? 'Tonight' : 'Today') : day === 1 ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'long' });
  return { label, time, dayNum: d.getDate(), month: d.toLocaleDateString([], { month: 'short' }) };
}

export function Flyer({ event }: { event: EventRow }) {
  const styles = BY_CATEGORY[event.category] ?? ['split', 'sunset'];
  const style = styles[hash(`${event.id}:style`) % styles.length];
  const p = PALETTES[hash(`${event.category}:${event.id}:palette`) % PALETTES.length];
  const w = whenLine(event.starts_at);
  const vars = { '--fb': p.bg, '--fa': p.a, '--fbb': p.b, '--fi': p.ink } as CSSProperties;
  const kicker = `${w.label} ${w.time}`;
  const tag = TAGLINE[event.category] ?? 'Tonight';
  const words = event.name.split(' ');
  const title = (
    <div className="fl-title">
      {words.map((wd, i) => <span key={i}>{wd} </span>)}
    </div>
  );

  return (
    <div className={`art flyer fs-${style}`} style={vars} aria-hidden="true">
      {style === 'sunset' && (
        <>
          <div className="fl-sun" />
          <div className="fl-stripes" />
        </>
      )}
      {style === 'marquee' && <div className="fl-bulbs" />}
      {style === 'halftone' && <div className="fl-dots" />}
      {style === 'waves' && <div className="fl-waves" />}
      {style === 'arch' && <div className="fl-archwin" />}
      {style === 'split' && (
        <>
          <div className="fl-diag" />
          <div className="fl-date">
            <b>{w.dayNum}</b>
            <span>{w.month}</span>
          </div>
        </>
      )}
      <div className="fl-copy">
        <div className="fl-kicker">{kicker}</div>
        {title}
        <div className="fl-tag">
          {tag}
          {event.area ? ` / ${event.area}` : ''}
        </div>
      </div>
      <div className="fl-grain" />
    </div>
  );
}
