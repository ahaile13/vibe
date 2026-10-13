'use client';
import Link from 'next/link';
import { useLive } from './LiveProvider';
import { Cover } from './Media';
import { Icon } from './Icon';
import { MomText, StatusPill, WorthText, liveText, metaText, topComment } from './bits';
import { isActive } from '@/lib/scoring';
import { fmtMi } from '@/lib/geo';
import type { EventRow } from '@/lib/types';

export function EventCard({ e, variant }: { e: EventRow; variant?: 'feat' | 'mini' }) {
  const { stats, posts, comments, now, dist, saved, toggleSave } = useLive();
  const s = stats[e.id];
  if (!s) return null;
  const tc = variant === 'mini' ? undefined : topComment(comments[e.id], now);
  const d = dist(e);
  const sv = saved.has(e.id);
  return (
    <Link href={`/e/${e.id}`} className={`card ${variant === 'feat' ? 'feat' : ''}`} aria-label={e.name}>
      <Cover event={e} posts={posts[e.id]} />
      <div className="shade" />
      <div className="tl chip-g">
        {isActive(e, now) && <span className="dot" />}
        {liveText(e, s, now)}
      </div>
      {variant !== 'mini' && d != null && <div className="tr chip-g mono">{fmtMi(d)}</div>}
      <button
        className="save chip-g"
        aria-pressed={sv}
        aria-label={sv ? 'Remove from saved' : 'Save'}
        onClick={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          toggleSave(e.id);
        }}
      >
        <Icon name="bookmark" fill />
      </button>
      <div className="cb">
        <div className="area">{[e.area, e.category].filter(Boolean).join(' · ')}</div>
        <h3>{e.name}</h3>
        <div className="row">
          <StatusPill s={s} />
          <WorthText s={s} />
          <MomText s={s} />
        </div>
        <div className="meta">{metaText(e, s, now)}</div>
        {tc && <p className="quote chip-g">“{tc.body}”</p>}
      </div>
    </Link>
  );
}
