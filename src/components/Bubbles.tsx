'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLive } from './LiveProvider';
import { Cover } from './Media';
import { STATUS } from './bits';
import type { EventRow } from '@/lib/types';

interface Placed { x: number; y: number; r: number }

/**
 * Packs circles (largest first) as tightly around the middle as they fit. Each new circle is tried
 * against the edge of every placed one at 4-degree steps; the spot closest to the center that
 * overlaps nothing and stays inside the width wins. Height is whatever the cluster needs.
 */
function pack(radii: number[], width: number, gap: number): { pts: Placed[]; height: number } {
  const half = width / 2;
  const placed: Placed[] = [];
  for (const r of radii) {
    if (!placed.length) {
      placed.push({ x: 0, y: 0, r });
      continue;
    }
    let best: Placed | null = null, bestCost = Infinity;
    for (const p of placed) {
      for (let a = 0; a < 360; a += 4) {
        const t = (a * Math.PI) / 180, d = p.r + r + gap;
        const x = p.x + Math.cos(t) * d, y = p.y + Math.sin(t) * d;
        if (Math.abs(x) + r > half) continue;
        if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < q.r + r + gap - 0.5)) continue;
        const cost = x * x * 0.55 + y * y; // a little wider than tall
        if (cost < bestCost) { bestCost = cost; best = { x, y, r }; }
      }
    }
    if (best) placed.push(best);
  }
  const top = Math.min(...placed.map((p) => p.y - p.r)), bottom = Math.max(...placed.map((p) => p.y + p.r));
  return { pts: placed.map((p) => ({ x: p.x + half, y: p.y - top, r: p.r })), height: bottom - top };
}

/** Live spots as bubbles: the better the vibe score, the bigger the bubble. */
export function Bubbles({ list }: { list: EventRow[] }) {
  const { stats, posts } = useLive();
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.min(el.clientWidth, 560)));
    ro.observe(el);
    setW(Math.min(el.clientWidth, 560));
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (!w || !list.length) return null;
    const rMax = Math.min(w * 0.26, 150), rMin = Math.max(w * 0.1, 34);
    const items = list.map((e) => {
      const t = Math.max(0, Math.min(1, stats[e.id].score / 100));
      return { e, r: rMin + (rMax - rMin) * Math.pow(t, 1.6) };
    }).sort((a, b) => b.r - a.r);
    const { pts, height } = pack(items.map((i) => i.r), w, 4);
    return { items: items.slice(0, pts.length).map((it, k) => ({ ...it, ...pts[k] })), height };
  }, [w, list, stats]);

  return (
    <div ref={box} className="bubbles" style={{ height: layout?.height ?? 0 }}>
      {layout?.items.map(({ e, x, y, r }, k) => {
        const s = stats[e.id];
        return (
          <Link
            key={e.id}
            href={`/e/${e.id}`}
            className="bub"
            aria-label={`${e.name}, vibe score ${s.score}, ${STATUS[s.status].l}`}
            style={{
              left: x - r, top: y - r, width: r * 2, height: r * 2,
              ['--c' as string]: STATUS[s.status].c, ['--r' as string]: `${r}px`,
              animationDelay: `${k * 60}ms, ${(k * 0.7) % 5}s`,
            }}
          >
            <Cover event={e} posts={posts[e.id]} />
            <span className="shade" />
            <span className="bt">
              <b>{e.name}</b>
              <small>{s.score} · {STATUS[s.status].l}</small>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
