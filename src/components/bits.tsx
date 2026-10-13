'use client';
import type { Stats, Status } from '@/lib/scoring';
import { isActive } from '@/lib/scoring';
import { ago, clock, dayLabel, plural } from '@/lib/format';
import type { EventRow, CommentRow } from '@/lib/types';

export const STATUS: Record<Status, { e: string; l: string; c: string }> = {
  pop: { e: '🔥', l: 'Popping', c: 'var(--pop)' },
  mid: { e: '😐', l: 'Mid', c: 'var(--mid)' },
  dead: { e: '💀', l: 'Dead', c: 'var(--dead)' },
  quiet: { e: '◌', l: 'Not enough ratings', c: 'var(--quiet)' },
  soon: { e: '⏱', l: 'Starts soon', c: '#7cc4ff' },
  ended: { e: '◼', l: 'Ended', c: 'var(--quiet)' },
};

export const scored = (s: Stats) => s.status === 'pop' || s.status === 'mid' || s.status === 'dead';

export function StatusPill({ s }: { s: Stats }) {
  const t = STATUS[s.status];
  return (
    <span className="pill" style={{ ['--c' as string]: t.c }}>
      {t.e} {t.l}
      {scored(s) && <b>{s.score}</b>}
    </span>
  );
}

export function WorthText({ s }: { s: Stats }) {
  if (s.conf === 'none' || s.status === 'soon') return null;
  const y = Math.round(s.py * 100);
  return <span className={`wt ${y >= 50 ? 'y' : 'n'}`}>{y}% worth it</span>;
}

export function MomText({ s }: { s: Stats }) {
  if (s.mom === 'up') return <span className="mom up">↗ Heating up</span>;
  if (s.mom === 'down') return <span className="mom down">↘ Cooling down</span>;
  return null;
}

export function liveText(e: EventRow, s: Stats, now: number) {
  if (!isActive(e, now)) return now > Date.parse(e.ends_at) ? 'Ended' : `${dayLabel(e.starts_at)} ${clock(e.starts_at)}`;
  if (s.r15) return `${plural(s.r15, 'rating')} in 15 min`;
  if (s.lastAt) return `Last rating ${ago(now - s.lastAt)}`;
  return 'Live now';
}

export function metaText(e: EventRow, s: Stats, now: number) {
  if (now < Date.parse(e.starts_at)) return `${dayLabel(e.starts_at)} ${clock(e.starts_at)} – ${clock(e.ends_at)}`;
  if (!s.n) return isActive(e, now) ? 'No ratings yet. Be the first.' : 'No ratings';
  return `${plural(s.n, 'verified rating')}${s.lastAt ? `, updated ${ago(now - s.lastAt)}` : ''}`;
}

export function topComment(list: CommentRow[] | undefined, now: number) {
  if (!list?.length) return undefined;
  const score = (c: CommentRow) => c.helpful_count + (now - Date.parse(c.created_at) < 20 * 60_000 ? 20 : 0);
  return list.filter((c) => now - Date.parse(c.created_at) < 2 * 3_600_000).sort((a, b) => score(b) - score(a))[0];
}

export function Avatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  let h = 7;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <div className="av" style={{ width: size, height: size, background: `hsl(${h % 360} 55% 32%)` }}>
      {url ? <img src={url} alt="" /> : (name[0] ?? '?').toUpperCase()}
    </div>
  );
}
