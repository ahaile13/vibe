import type { EventRow, RatingRow } from './types';

const M = 60_000;

export type Status = 'pop' | 'mid' | 'dead' | 'quiet' | 'soon' | 'ended';
export type Confidence = 'high' | 'build' | 'none';
export type Momentum = 'up' | 'down' | 'flat';

export interface Stats {
  /** all verified ratings for the event */
  n: number;
  /** effective (time-decayed) rating weight */
  ne: number;
  /** 0–100 VIBES Score */
  score: number;
  /** smoothed worth-it share, 0–1 */
  worthS: number;
  pp: number;
  pm: number;
  pd: number;
  /** raw (decayed) worth-it share, 0–1 */
  py: number;
  r15: number;
  r60: number;
  /** ms since the most recent rating, Infinity if none */
  lastMs: number;
  lastAt: number | null;
  conf: Confidence;
  status: Status;
  mom: Momentum;
  rank: number;
}

/** Tunable product knobs. Weights are starting points, not gospel. */
export const SCORING = {
  decayMinutes: 60, // a rating's weight falls to ~37% after an hour
  priorWeight: 6, // pseudo-ratings pulling small samples toward neutral
  priorVibe: 0.5,
  priorWorth: 0.6,
  popAt: 68,
  midAt: 48,
  momentumMin: 5, // ratings needed in each 30-min window
  momentumDelta: 4,
  weights: { recent: 0.25, score: 0.2, velocity: 0.2, worth: 0.15, freshness: 0.1, distance: 0.1 },
};

export const isActive = (e: Pick<EventRow, 'starts_at' | 'ends_at'>, now = Date.now()) =>
  now >= Date.parse(e.starts_at) && now <= Date.parse(e.ends_at);

/**
 * Scores one event from anonymous rating rows. For ended events pass the end
 * time as `at` so the final result is frozen instead of decaying to nothing.
 */
export function computeStats(e: EventRow, rows: RatingRow[], now: number): Stats {
  const start = Date.parse(e.starts_at);
  const end = Date.parse(e.ends_at);
  const at = Math.min(now, end);
  let wp = 0, wm = 0, wd = 0, wy = 0, n = 0, r15 = 0, r60 = 0, last = Infinity;
  const recent = { s: 0, c: 0 };
  const prior = { s: 0, c: 0 };

  for (const r of rows) {
    const age = at - Date.parse(r.at);
    if (age < 0) continue;
    n++;
    const w = Math.exp(-age / (SCORING.decayMinutes * M));
    if (r.vibe === 'popping') wp += w;
    else if (r.vibe === 'mid') wm += w;
    else wd += w;
    if (r.worth) wy += w;
    if (age < 15 * M) r15++;
    if (age < 60 * M) r60++;
    if (age < last) last = age;
    const v = (r.vibe === 'popping' ? 1 : r.vibe === 'mid' ? 0.5 : 0) * 0.6 + (r.worth ? 0.4 : 0);
    if (age < 30 * M) { recent.s += v; recent.c++; }
    else if (age < 60 * M) { prior.s += v; prior.c++; }
  }

  const ne = wp + wm + wd;
  const k = SCORING.priorWeight;
  // Bayesian smoothing: two 🔥 votes can't outrank two hundred.
  const vibeS = (wp + 0.5 * wm + SCORING.priorVibe * k) / (ne + k);
  const worthS = (wy + SCORING.priorWorth * k) / (ne + k);
  const score = Math.round(100 * (0.6 * vibeS + 0.4 * worthS));
  const conf: Confidence = ne >= 18 && r60 >= 8 ? 'high' : n >= 5 && ne >= 3 ? 'build' : 'none';

  let status: Status;
  if (now < start) status = 'soon';
  else if (now > end) status = 'ended';
  else if (conf === 'none') status = 'quiet';
  else status = score >= SCORING.popAt ? 'pop' : score >= SCORING.midAt ? 'mid' : 'dead';

  let mom: Momentum = 'flat';
  if (now <= end && recent.c >= SCORING.momentumMin && prior.c >= SCORING.momentumMin) {
    const d = (recent.s / recent.c - prior.s / prior.c) * 100;
    if (d >= SCORING.momentumDelta) mom = 'up';
    else if (d <= -SCORING.momentumDelta) mom = 'down';
  }

  return {
    n, ne, score, worthS,
    pp: ne ? wp / ne : 0, pm: ne ? wm / ne : 0, pd: ne ? wd / ne : 0, py: ne ? wy / ne : 0,
    r15, r60, lastMs: last, lastAt: Number.isFinite(last) ? at - last : null,
    conf, status, mom, rank: 0,
  };
}

/** Fills in `rank` for every event. Live events always outrank upcoming ones. */
export function rankAll(
  events: EventRow[],
  stats: Record<string, Stats>,
  distMi: (e: EventRow) => number | null,
  now: number,
) {
  const live = events.filter((e) => isActive(e, now));
  const maxRecent = Math.max(1, ...live.map((e) => stats[e.id].r60));
  const maxVel = Math.max(1, ...live.map((e) => stats[e.id].r15));
  const W = SCORING.weights;
  for (const e of events) {
    const s = stats[e.id];
    if (isActive(e, now)) {
      const d = distMi(e);
      const conf = s.conf === 'none' ? 0.35 : 1; // unproven scores count for less
      s.rank =
        W.recent * (s.r60 / maxRecent) +
        W.score * (s.score / 100) * conf +
        W.velocity * (s.r15 / maxVel) +
        W.worth * s.worthS * conf +
        W.freshness * (Number.isFinite(s.lastMs) ? Math.exp(-s.lastMs / (20 * M)) : 0) +
        W.distance * (d == null ? 0.5 : 1 / (1 + d / 2));
    } else if (now < Date.parse(e.starts_at)) {
      s.rank = -1 + 1 / (1 + (Date.parse(e.starts_at) - now) / 3_600_000);
    } else {
      s.rank = -2;
    }
  }
}

/** Busiest 30-minute window, for recaps. */
export function peakWindow(rows: RatingRow[]): { start: number; count: number } | null {
  if (!rows.length) return null;
  const buckets = new Map<number, number>();
  for (const r of rows) {
    const b = Math.floor(Date.parse(r.at) / (30 * M)) * 30 * M;
    buckets.set(b, (buckets.get(b) ?? 0) + 1);
  }
  let best: { start: number; count: number } | null = null;
  for (const [start, count] of buckets) if (!best || count > best.count) best = { start, count };
  return best;
}
