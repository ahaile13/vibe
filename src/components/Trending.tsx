'use client';

import { useLive } from './LiveProvider';
import { EventCard } from './EventCard';
import { SetupNotice } from './AppShell';
import { isActive } from '@/lib/scoring';
import type { EventRow } from '@/lib/types';

export function Trending() {
  const { events, stats, now, dist, saved, userLoc, status, city } = useLive();
  const pub = events.filter((e) => e.visibility === 'public');
  const live = pub.filter((e) => isActive(e, now));
  const sure = live.filter((e) => stats[e.id].conf !== 'none');
  const byScore = (a: EventRow, b: EventRow) => stats[b.id].score - stats[a.id].score;

  const sections: [string, string, EventRow[]][] = [
    ['Popping right now', 'Strong atmosphere from recent verified ratings.', sure.filter((e) => stats[e.id].status === 'pop').sort(byScore)],
    ['Heating up', 'Ratings getting better over the last 30 minutes.', live.filter((e) => stats[e.id].mom === 'up')],
    ['Hidden gems', 'Smaller crowds, strong ratings, enough data to trust.', sure.filter((e) => stats[e.id].n < 80 && stats[e.id].score >= 60).sort(byScore)],
    ['Most watched', 'Saved the most by people deciding where to go.',
      pub.filter((e) => Date.parse(e.ends_at) > now && e.save_count + (saved.has(e.id) ? 1 : 0) > 0)
        .sort((a, b) => b.save_count - a.save_count).slice(0, 8)],
    ['Cooling down', 'Recent ratings point to fading energy.', live.filter((e) => stats[e.id].mom === 'down')],
    ['Near you', userLoc ? 'Closest live spots to you.' : `Closest to downtown ${city.name}. Turn on location in Profile for real distances.`,
      [...live].sort((a, b) => (dist(a) ?? 99) - (dist(b) ?? 99)).slice(0, 8)],
  ];
  const shown = sections.filter(([, , l]) => l.length);

  return (
    <>
      <SetupNotice />
      <h1 className="ttl">Trending</h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 6px' }}>Ranked by what’s happening in the last hour, not all-time popularity.</p>
      {status === 'ready' && !shown.length && (
        <div className="empty" style={{ marginTop: 20 }}>
          <h3>Nothing’s trending yet.</h3>
          <p>Trends show up once people start rating spots tonight.</p>
        </div>
      )}
      {shown.map(([t, d, l]) => (
        <section className="sec" key={t}>
          <h2>{t}</h2>
          <p>{d}</p>
          <div className="hrow">
            {l.map((e) => <EventCard key={e.id} e={e} variant="mini" />)}
          </div>
        </section>
      ))}
    </>
  );
}
