'use client';

import { useMemo, type ReactNode } from 'react';
import { CITY, type City, type Landmark } from '@/lib/city';

const W = 1440;
const H = 480;
const BASE = H;

function rng(seed: number) {
  let s = (seed % 2147483646) + 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function hash(str: string) {
  let h = 7;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Lit windows scattered over a rectangle. */
function windows(r: () => number, x: number, w: number, top: number, density: number, key: string) {
  const out: ReactNode[] = [];
  for (let y = top + 10; y < BASE - 8; y += 9) {
    for (let wx = x + 5; wx < x + w - 5; wx += 7) {
      if (r() < density) {
        const o = (0.18 + r() * 0.55).toFixed(2);
        out.push(<rect key={`${key}-${wx}-${y}`} x={wx} y={y} width={2.4} height={3.4} fill="var(--sky-win)" opacity={o} />);
      }
    }
  }
  return out;
}

function landmark(l: Landmark, r: () => number, i: number): ReactNode {
  const fill = 'var(--sky-mid)';
  const k = `lm${i}`;
  switch (l.kind) {
    case 'sphere': {
      const cy = BASE - l.h;
      const dots: ReactNode[] = [];
      for (let a = 0; a < 46; a++) {
        const t = r() * Math.PI * 2, rr = Math.sqrt(r()) * 22;
        dots.push(<circle key={`${k}d${a}`} cx={l.x + Math.cos(t) * rr} cy={cy + Math.sin(t) * rr * 0.9} r={1.3} fill="var(--sky-win)" opacity={(0.35 + r() * 0.6).toFixed(2)} />);
      }
      return (
        <g key={k}>
          <rect x={l.x - 9} y={cy + 20} width={4} height={l.h - 20} fill={fill} />
          <rect x={l.x - 2} y={cy + 20} width={4} height={l.h - 20} fill={fill} />
          <rect x={l.x + 5} y={cy + 20} width={4} height={l.h - 20} fill={fill} />
          <circle cx={l.x} cy={cy} r={27} fill={fill} />
          <circle cx={l.x} cy={cy} r={34} fill="var(--sky-win)" opacity={0.06} />
          {dots}
          <rect x={l.x - 1} y={cy - 46} width={2} height={20} fill={fill} />
        </g>
      );
    }
    case 'outline':
      return (
        <g key={k}>
          <rect x={l.x} y={BASE - l.h} width={l.w} height={l.h} fill={fill} />
          {windows(r, l.x, l.w, BASE - l.h, 0.1, k)}
          <path d={`M${l.x} ${BASE} V${BASE - l.h} H${l.x + l.w} V${BASE}`} fill="none" stroke={l.color} strokeWidth={1.6} opacity={0.6} />
          <path d={`M${l.x + 3} ${BASE} V${BASE - l.h + 3} H${l.x + l.w - 3} V${BASE}`} fill="none" stroke={l.color} strokeWidth={0.8} opacity={0.3} />
        </g>
      );
    case 'prism': {
      const t = BASE - l.h;
      return (
        <g key={k}>
          <polygon points={`${l.x},${BASE} ${l.x},${t + 50} ${l.x + l.w * 0.42},${t} ${l.x + l.w},${t + 90} ${l.x + l.w},${BASE}`} fill={fill} />
          <polygon points={`${l.x + l.w * 0.42},${t} ${l.x + l.w},${t + 90} ${l.x + l.w},${BASE} ${l.x + l.w * 0.42},${BASE}`} fill="var(--sky-face)" opacity={0.55} />
          {windows(r, l.x, l.w, t + 90, 0.07, k)}
        </g>
      );
    }
    case 'xtower': {
      const t = BASE - l.h;
      const xs: ReactNode[] = [];
      for (let y = t + 14; y < BASE - 40; y += 54) {
        xs.push(<path key={`${k}x${y}`} d={`M${l.x} ${y} L${l.x + l.w} ${y + 54} M${l.x + l.w} ${y} L${l.x} ${y + 54}`} stroke="var(--sky-line)" strokeWidth={1} opacity={0.7} />);
      }
      return (
        <g key={k}>
          <rect x={l.x} y={t} width={l.w} height={l.h} fill={fill} />
          {xs}
          <rect x={l.x + 8} y={t - 30} width={2} height={30} fill={fill} />
          <rect x={l.x + l.w - 10} y={t - 30} width={2} height={30} fill={fill} />
        </g>
      );
    }
    case 'arch': {
      const t = BASE - l.h;
      return (
        <g key={k}>
          <path d={`M${l.x} ${BASE} V${t + l.w / 2} A${l.w / 2} ${l.w / 2} 0 0 1 ${l.x + l.w} ${t + l.w / 2} V${BASE} Z`} fill={fill} />
          <path d={`M${l.x + 8} ${t + l.w / 2 + 4} A${l.w / 2 - 8} ${l.w / 2 - 8} 0 0 1 ${l.x + l.w - 8} ${t + l.w / 2 + 4}`} fill="none" stroke="var(--sky-win)" strokeWidth={1} opacity={0.35} />
          {windows(r, l.x, l.w, t + l.w / 2 + 10, 0.12, k)}
        </g>
      );
    }
    case 'keyhole': {
      const t = BASE - l.h;
      return (
        <g key={k}>
          <rect x={l.x} y={t} width={l.w} height={l.h} fill={fill} />
          <rect x={l.x + l.w * 0.28} y={t + 16} width={l.w * 0.44} height={34} rx={4} fill="var(--sky-gap)" />
          {windows(r, l.x, l.w, t + 60, 0.11, k)}
        </g>
      );
    }
    default:
      return (
        <g key={k}>
          <rect x={l.x} y={BASE - l.h} width={l.w} height={l.h} fill={fill} />
          {windows(r, l.x, l.w, BASE - l.h, 0.12, k)}
        </g>
      );
  }
}

/** A misty night skyline of the selected city. Decorative. */
export function Skyline({ city = CITY, className = '' }: { city?: City; className?: string }) {
  const art = useMemo(() => {
    const r = rng(hash(city.id));
    const back: ReactNode[] = [];
    for (let x = -20; x < W; ) {
      const w = 30 + r() * 60, h = 70 + r() * 150;
      back.push(<rect key={`b${x}`} x={x} y={BASE - h} width={w} height={h} fill="var(--sky-back)" />);
      x += w + 2;
    }
    const fillers: ReactNode[] = [];
    for (let x = -10; x < W; ) {
      const w = 34 + r() * 52, h = 60 + r() * 140;
      const busy = city.landmarks.some((l) => 'x' in l && x + w > l.x - 12 && x < l.x + ('w' in l ? l.w : 30) + 12);
      if (!busy) {
        fillers.push(
          <g key={`f${x}`}>
            <rect x={x} y={BASE - h} width={w} height={h} fill="var(--sky-mid)" />
            {windows(r, x, w, BASE - h, 0.08, `f${x}`)}
          </g>,
        );
      }
      x += w + 3;
    }
    const front: ReactNode[] = [];
    for (let x = -10; x < W; ) {
      const w = 40 + r() * 90, h = 18 + r() * 60;
      front.push(<rect key={`n${x}`} x={x} y={BASE - h} width={w} height={h} fill="var(--sky-front)" />);
      x += w;
    }
    const lights: ReactNode[] = [];
    for (let i = 0; i < 9; i++) {
      lights.push(<circle key={`l${i}`} cx={r() * W} cy={BASE - 20 - r() * 60} r={18 + r() * 34} fill="url(#sky-bokeh)" opacity={(0.25 + r() * 0.35).toFixed(2)} />);
    }
    return { back, fillers, front, lights, landmarks: city.landmarks.map((l, i) => landmark(l, r, i)) };
  }, [city]);

  return (
    <svg className={`skyline ${className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sky-air" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky-top)" />
          <stop offset="0.72" stopColor="var(--sky-haze)" />
          <stop offset="1" stopColor="var(--sky-haze)" />
        </linearGradient>
        <radialGradient id="sky-glow" cx="0.55" cy="0.95" r="0.6">
          <stop offset="0" stopColor="var(--sky-win)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--sky-win)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sky-bokeh">
          <stop offset="0" stopColor="var(--sky-win)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--sky-win)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sky-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky-mist)" stopOpacity="0" />
          <stop offset="0.55" stopColor="var(--sky-mist)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--bg)" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#sky-air)" />
      <rect width={W} height={H} fill="url(#sky-glow)" />
      <g opacity={0.55}>{art.back}</g>
      {art.fillers}
      {art.landmarks}
      <rect y={H * 0.45} width={W} height={H * 0.55} fill="url(#sky-fog)" />
      {art.front}
      {art.lights}
    </svg>
  );
}
