import type { EventRow, RatingRow } from './types';

/**
 * Sample ratings for VIBES launch listings (is_demo events) so a brand-new
 * city doesn't look empty. They are generated in the browser, never stored,
 * always labeled "Sample", and drop away once an event has MIN_REAL real ratings.
 */
export const SAMPLE_KEY = 'vibes.samples';
export const MIN_REAL = 5;
const M = 60_000;

function hash(s: string) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
function rng(seed: number) {
  let s = (seed % 2147483646) + 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function needsSample(e: EventRow, realCount: number, now: number) {
  return e.is_demo && realCount < MIN_REAL && now >= Date.parse(e.starts_at) && now <= Date.parse(e.ends_at);
}

/** Stable within each 10-minute window, then drifts so the sample feels alive. */
export function sampleRows(e: EventRow, now: number): RatingRow[] {
  const base = hash(e.id);
  const r = rng(base + Math.floor(now / (10 * M)));
  const prof = rng(base); // the event's character stays the same all night
  const n = 18 + Math.floor(prof() * 110);
  const pop = 0.15 + prof() * 0.7;
  const worth = 0.35 + prof() * 0.55;
  const elapsed = Math.min(now - Date.parse(e.starts_at), 2 * 60 * M);
  const out: RatingRow[] = [];
  for (let i = 0; i < n; i++) {
    const x = r();
    const vibe = x < pop ? 'popping' : x < pop + (1 - pop) * 0.65 ? 'mid' : 'dead';
    out.push({ event_id: e.id, vibe, worth: r() < worth, at: new Date(now - elapsed * Math.pow(r(), 1.5)).toISOString() });
  }
  return out;
}
