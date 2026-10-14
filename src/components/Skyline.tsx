'use client';

import { useMemo, type ReactNode } from 'react';
import { DEFAULT_CITY, type City, type Landmark, type Terrain } from '@/lib/city';

const W = 1440;
/** Buildings are authored in a 480-tall space and drawn VS times taller. */
const VS = 1.6;
const H = 640;
const BASE = H;
/** Map an authored y (0..480, street at 480) into the taller drawing. */
const Y = (v: number) => BASE - (480 - v) * VS;

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
        const o = 0.18 + r() * 0.55;
        // a soft halo behind the brighter windows
        if (o > 0.55 && r() < 0.6) out.push(<circle key={`${key}-${wx}-${y}h`} cx={wx + 1.2} cy={y + 1.7} r={6} fill="url(#sky-bokeh)" opacity={0.5} />);
        // about one in five windows twinkles, each on its own rhythm
        const tw = r() < 0.2;
        out.push(
          <rect
            key={`${key}-${wx}-${y}`} x={wx} y={y} width={2.4} height={3.4} fill="var(--sky-win)" opacity={o.toFixed(2)}
            className={tw ? 'tw' : undefined}
            style={tw ? { animationDelay: `${(r() * 8).toFixed(2)}s`, animationDuration: `${(2.4 + r() * 4.5).toFixed(2)}s` } : undefined}
          />,
        );
      }
    }
  }
  return out;
}

const FILL = 'var(--sky-mid)';
const pts = (p: [number, number][]) => p.map(([a, b]) => `${a},${b}`).join(' ');
const mast = (x: number, top: number, len: number, k: string) => <rect key={k} x={x - 1} y={top - len} width={2} height={len} fill={FILL} />;

function landmark(src: Landmark, r: () => number, i: number): ReactNode {
  const l: Landmark = { ...src, h: src.h * VS, s: src.s == null ? undefined : src.s * VS * 0.8 };
  const k = `lm${i}`;
  const w = l.w ?? 60;
  const t = BASE - l.h;
  const x = l.x;
  switch (l.kind) {
    case 'sphere': {
      const cy = t;
      const dots: ReactNode[] = [];
      for (let a = 0; a < 46; a++) {
        const th = r() * Math.PI * 2, rr = Math.sqrt(r()) * 22;
        dots.push(<circle key={`${k}d${a}`} cx={x + Math.cos(th) * rr} cy={cy + Math.sin(th) * rr * 0.9} r={1.3} fill="var(--sky-win)" opacity={(0.35 + r() * 0.6).toFixed(2)} className="tw" style={{ animationDelay: `${(r() * 3).toFixed(2)}s`, animationDuration: `${(1.6 + r() * 2).toFixed(2)}s` }} />);
      }
      return (
        <g key={k}>
          {[-9, -2, 5].map((dx) => <rect key={dx} x={x + dx} y={cy + 20} width={4} height={l.h - 20} fill={FILL} />)}
          <circle cx={x} cy={cy} r={27} fill={FILL} />
          <circle cx={x} cy={cy} r={34} fill="var(--sky-win)" opacity={0.06} />
          {dots}
          {mast(x, cy - 26, 20, `${k}m`)}
        </g>
      );
    }
    case 'needle': {
      const disc = w;
      return (
        <g key={k}>
          <polygon points={pts([[x - 14, BASE], [x - 4, t + 30], [x + 4, t + 30], [x + 14, BASE]])} fill={FILL} />
          <polygon points={pts([[x - disc / 2, t + 6], [x + disc / 2, t + 6], [x + disc / 2 - 12, t + 26], [x - disc / 2 + 12, t + 26]])} fill={FILL} />
          <ellipse cx={x} cy={t + 6} rx={disc / 2} ry={5} fill="var(--sky-win)" opacity={0.28} />
          <rect x={x - 10} y={t - 8} width={20} height={14} fill={FILL} />
          {mast(x, t - 8, 36, `${k}m`)}
        </g>
      );
    }
    case 'outline':
      return (
        <g key={k}>
          <rect x={x} y={t} width={w} height={l.h} fill={FILL} />
          {windows(r, x, w, t, 0.1, k)}
          <path d={`M${x} ${BASE} V${t} H${x + w} V${BASE}`} fill="none" stroke={l.color ?? 'var(--sky-win)'} strokeWidth={1.6} opacity={0.6} />
          <path d={`M${x + 3} ${BASE} V${t + 3} H${x + w - 3} V${BASE}`} fill="none" stroke={l.color ?? 'var(--sky-win)'} strokeWidth={0.8} opacity={0.3} />
        </g>
      );
    case 'prism':
      return (
        <g key={k}>
          <polygon points={pts([[x, BASE], [x, t + 50], [x + w * 0.42, t], [x + w, t + 90], [x + w, BASE]])} fill={FILL} />
          <polygon points={pts([[x + w * 0.42, t], [x + w, t + 90], [x + w, BASE], [x + w * 0.42, BASE]])} fill="var(--sky-face)" opacity={0.55} />
          {windows(r, x, w, t + 90, 0.07, k)}
        </g>
      );
    case 'xtower': {
      const xs: ReactNode[] = [];
      for (let y = t + 14; y < BASE - 40; y += 54) {
        xs.push(<path key={`${k}x${y}`} d={`M${x} ${y} L${x + w} ${y + 54} M${x + w} ${y} L${x} ${y + 54}`} stroke="var(--sky-line)" strokeWidth={1} opacity={0.7} />);
      }
      return (
        <g key={k}>
          <rect x={x} y={t} width={w} height={l.h} fill={FILL} />
          {xs}
          {mast(x + 9, t, 30, `${k}a`)}
          {mast(x + w - 9, t, 30, `${k}b`)}
        </g>
      );
    }
    case 'arch':
      return (
        <g key={k}>
          <path d={`M${x} ${BASE} V${t + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${t + w / 2} V${BASE} Z`} fill={FILL} />
          <path d={`M${x + 8} ${t + w / 2 + 4} A${w / 2 - 8} ${w / 2 - 8} 0 0 1 ${x + w - 8} ${t + w / 2 + 4}`} fill="none" stroke="var(--sky-win)" strokeWidth={1} opacity={0.35} />
          {windows(r, x, w, t + w / 2 + 10, 0.12, k)}
        </g>
      );
    case 'keyhole':
      return (
        <g key={k}>
          <rect x={x} y={t} width={w} height={l.h} fill={FILL} />
          <rect x={x + w * 0.28} y={t + 16} width={w * 0.44} height={34} rx={4} fill="var(--sky-gap)" />
          {windows(r, x, w, t + 60, 0.11, k)}
        </g>
      );
    case 'spire': {
      const s = l.s ?? 50;
      const step = Math.max(10, w * 0.16);
      return (
        <g key={k}>
          <rect x={x} y={t + 70} width={w} height={l.h - 70} fill={FILL} />
          <rect x={x + step} y={t + 30} width={w - step * 2} height={44} fill={FILL} />
          <rect x={x + step * 2} y={t} width={w - step * 4} height={34} fill={FILL} />
          <polygon points={pts([[x + w / 2 - 4, t], [x + w / 2, t - s], [x + w / 2 + 4, t]])} fill={FILL} />
          {windows(r, x, w, t + 70, 0.11, k)}
          <rect x={x + step * 2} y={t + 8} width={w - step * 4} height={2} fill="var(--sky-win)" opacity={0.35} />
        </g>
      );
    }
    case 'wtc': {
      const s = l.s ?? 70;
      return (
        <g key={k}>
          <polygon points={pts([[x, BASE], [x, t + 60], [x + w * 0.18, t], [x + w * 0.82, t], [x + w, t + 60], [x + w, BASE]])} fill={FILL} />
          <polygon points={pts([[x + w / 2, t], [x + w * 0.82, t], [x + w, t + 60], [x + w, BASE], [x + w / 2, BASE]])} fill="var(--sky-face)" opacity={0.5} />
          {s > 0 && mast(x + w / 2, t, s, `${k}m`)}
          {windows(r, x, w, t + 60, 0.07, k)}
        </g>
      );
    }
    case 'antenna2': {
      const s = l.s ?? 60;
      const q = w / 4;
      return (
        <g key={k}>
          <rect x={x} y={t + 110} width={w} height={l.h - 110} fill={FILL} />
          <rect x={x} y={t + 50} width={q * 3} height={70} fill={FILL} />
          <rect x={x + q} y={t} width={q * 2} height={60} fill={FILL} />
          {mast(x + q * 1.4, t, s, `${k}a`)}
          {mast(x + q * 2.6, t, s * 0.85, `${k}b`)}
          {windows(r, x, w, t + 110, 0.1, k)}
        </g>
      );
    }
    case 'taper': {
      const s = l.s ?? 60;
      const top = w * 0.62, off = (w - top) / 2;
      const xs: ReactNode[] = [];
      const xl = (y: number) => x + off * ((BASE - y) / l.h);
      const xr = (y: number) => x + w - off * ((BASE - y) / l.h);
      for (let y = t + 10; y < BASE - 50; y += 60) {
        xs.push(<path key={`${k}x${y}`} d={`M${xl(y)} ${y} L${xr(y + 60)} ${y + 60} M${xr(y)} ${y} L${xl(y + 60)} ${y + 60}`} stroke="var(--sky-line)" strokeWidth={1} opacity={0.6} />);
      }
      return (
        <g key={k}>
          <polygon points={pts([[x, BASE], [x + off, t], [x + w - off, t], [x + w, BASE]])} fill={FILL} />
          {xs}
          {mast(x + w / 2 - 8, t, s, `${k}a`)}
          {mast(x + w / 2 + 8, t, s, `${k}b`)}
        </g>
      );
    }
    case 'pyramid':
      return (
        <g key={k}>
          <polygon points={pts([[x, BASE], [x + w / 2, t], [x + w, BASE]])} fill={FILL} />
          <polygon points={pts([[x + w / 2, t], [x + w, BASE], [x + w / 2, BASE]])} fill="var(--sky-face)" opacity={0.45} />
          <polygon points={pts([[x - 8, BASE - l.h * 0.45], [x + 4, BASE - l.h * 0.55], [x + 4, BASE - l.h * 0.4]])} fill={FILL} />
          <polygon points={pts([[x + w + 8, BASE - l.h * 0.45], [x + w - 4, BASE - l.h * 0.55], [x + w - 4, BASE - l.h * 0.4]])} fill={FILL} />
          <circle cx={x + w / 2} cy={t + 3} r={2.5} fill="var(--sky-win)" opacity={0.8} />
        </g>
      );
    case 'crown': {
      const spikes: [number, number][] = [];
      const n = 9;
      for (let j = 0; j <= n; j++) spikes.push([x + (w * j) / n, t + (j % 2 ? 26 : 0) + Math.abs(j - n / 2) * 3]);
      return (
        <g key={k}>
          <polygon points={pts([[x, BASE], ...spikes, [x + w, BASE]])} fill={FILL} />
          <rect x={x + 4} y={t + 34} width={w - 8} height={2} fill="var(--sky-win)" opacity={0.3} />
          {windows(r, x, w, t + 40, 0.11, k)}
        </g>
      );
    }
    case 'twinspire': {
      const s = l.s ?? 60;
      return (
        <g key={k}>
          <polygon points={pts([[x, BASE], [x, t], [x + 8, t], [x + w / 2, t + 34], [x + w - 8, t], [x + w, t], [x + w, BASE]])} fill={FILL} />
          <polygon points={pts([[x + 1, t], [x + 4, t - s], [x + 7, t]])} fill={FILL} />
          <polygon points={pts([[x + w - 7, t], [x + w - 4, t - s], [x + w - 1, t]])} fill={FILL} />
          {windows(r, x, w, t + 40, 0.11, k)}
        </g>
      );
    }
    case 'dome': {
      const s = l.s ?? 30;
      const dw = w * 0.42;
      return (
        <g key={k}>
          <rect x={x} y={BASE - l.h * 0.45} width={w} height={l.h * 0.45} fill={FILL} />
          <rect x={x + w / 2 - dw / 2 - 6} y={BASE - l.h * 0.62} width={dw + 12} height={l.h * 0.2} fill={FILL} />
          <path d={`M${x + w / 2 - dw / 2} ${BASE - l.h * 0.6} A${dw / 2} ${dw * 0.62} 0 0 1 ${x + w / 2 + dw / 2} ${BASE - l.h * 0.6} Z`} fill={FILL} />
          {mast(x + w / 2, BASE - l.h * 0.6 - dw * 0.6, s, `${k}m`)}
          {windows(r, x, w, BASE - l.h * 0.45, 0.1, k)}
        </g>
      );
    }
    case 'stack': {
      const blocks: ReactNode[] = [];
      const n = 6, bh = l.h / n;
      for (let j = 0; j < n; j++) {
        const dx = (j % 3 === 1 ? 8 : j % 3 === 2 ? -6 : 0);
        blocks.push(<rect key={`${k}s${j}`} x={x + dx} y={BASE - bh * (j + 1)} width={w} height={bh + 1} fill={FILL} />);
      }
      return <g key={k}>{blocks}{windows(r, x, w, t, 0.1, k)}</g>;
    }
    case 'gable': {
      const g1 = t + 40, g2 = t + 75;
      return (
        <g key={k}>
          <polygon points={pts([[x, BASE], [x, g2 + 20], [x + w * 0.2, g2], [x + w * 0.2, g1 + 15], [x + w * 0.35, g1], [x + w * 0.35, t + 15], [x + w / 2, t], [x + w * 0.65, t + 15], [x + w * 0.65, g1], [x + w * 0.8, g1 + 15], [x + w * 0.8, g2], [x + w, g2 + 20], [x + w, BASE]])} fill={FILL} />
          {windows(r, x, w, g2 + 20, 0.11, k)}
        </g>
      );
    }
    default:
      return (
        <g key={k}>
          <rect x={x} y={t} width={w} height={l.h} fill={FILL} />
          {windows(r, x, w, t, 0.12, k)}
        </g>
      );
  }
}

function terrain(kind: Terrain, r: () => number): ReactNode {
  if (kind === 'none') return null;
  const ridge = (base: number, amp: number, step: number, rough: number) => {
    const p: [number, number][] = [[0, BASE]];
    let y = base;
    for (let x = 0; x <= W; x += step) {
      y = Math.min(BASE - 40, Math.max(base - amp, y + (r() - 0.5) * rough));
      p.push([x, y]);
    }
    p.push([W, BASE]);
    return pts(p);
  };
  if (kind === 'peak') {
    // one great snowcapped volcano
    const cx = 990, top = Y(130);
    return (
      <g>
        <polygon points={pts([[cx - 420, BASE - 110 * VS], [cx - 40, top + 18 * VS], [cx, top], [cx + 50, top + 22 * VS], [cx + 460, BASE - 100 * VS], [cx + 460, BASE], [cx - 420, BASE]])} fill="var(--sky-mtn)" />
        <polygon points={pts([[cx - 70, top + 48 * VS], [cx - 40, top + 18 * VS], [cx, top], [cx + 50, top + 22 * VS], [cx + 92, top + 56 * VS], [cx + 40, top + 44 * VS], [cx + 6, top + 58 * VS], [cx - 30, top + 44 * VS]])} fill="var(--sky-snow)" opacity={0.5} />
      </g>
    );
  }
  if (kind === 'range') {
    return (
      <g>
        <polygon points={ridge(Y(230), 90 * VS, 36, 90 * VS)} fill="var(--sky-mtn)" opacity={0.7} />
        <polygon points={ridge(Y(300), 50 * VS, 30, 50 * VS)} fill="var(--sky-mtn)" />
      </g>
    );
  }
  if (kind === 'mesa') {
    // desert peaks with a double hump on the left
    return (
      <g>
        <polygon points={pts([[0, BASE], [0, Y(330)], [120, Y(290)], [190, Y(250)], [240, Y(285)], [300, Y(240)], [380, Y(300)], [520, Y(320)], [1440, Y(330)], [1440, BASE]])} fill="var(--sky-mtn)" />
        <polygon points={ridge(Y(330), 40 * VS, 50, 40 * VS)} fill="var(--sky-mtn)" opacity={0.6} />
      </g>
    );
  }
  return <polygon points={ridge(Y(340), 30 * VS, 60, 30 * VS)} fill="var(--sky-mtn)" opacity={0.85} />;
}

/** A misty night skyline of a city. Decorative. */
export function Skyline({ city = DEFAULT_CITY, className = '' }: { city?: City; className?: string }) {
  const art = useMemo(() => {
    const r = rng(hash(city.id));
    const land = terrain(city.terrain, r);
    const back: ReactNode[] = [];
    for (let x = -20; x < W; ) {
      const w = 30 + r() * 60, h = (70 + r() * 150) * VS;
      back.push(<rect key={`b${x}`} x={x} y={BASE - h} width={w} height={h} fill="var(--sky-back)" />);
      x += w + 2;
    }
    const occupied = (a: number, b: number) =>
      city.landmarks.some((l) => {
        const lw = l.kind === 'sphere' ? 40 : l.kind === 'needle' ? (l.w ?? 70) : (l.w ?? 60);
        const lx = l.kind === 'sphere' || l.kind === 'needle' ? l.x - lw / 2 : l.x;
        return b > lx - 12 && a < lx + lw + 12;
      });
    const fillers: ReactNode[] = [];
    for (let x = -10; x < W; ) {
      const w = 34 + r() * 52, h = (60 + r() * 140) * VS;
      if (!occupied(x, x + w)) {
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
      const w = 40 + r() * 90, h = (18 + r() * 60) * 1.2;
      front.push(<rect key={`n${x}`} x={x} y={BASE - h} width={w} height={h} fill="var(--sky-front)" />);
      x += w;
    }
    const lights: ReactNode[] = [];
    for (let i = 0; i < 9; i++) {
      lights.push(<circle key={`l${i}`} cx={r() * W} cy={BASE - 20 - r() * 60} r={18 + r() * 34} fill="url(#sky-bokeh)" opacity={(0.25 + r() * 0.35).toFixed(2)} className="glow" style={{ animationDelay: `${(r() * 6).toFixed(2)}s` }} />);
    }
    return { land, back, fillers, front, lights, landmarks: city.landmarks.map((l, i) => landmark(l, r, i)) };
  }, [city]);

  return (
    <svg className={`skyline ${className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sky-air" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky-top)" stopOpacity="0" />
          <stop offset="0.35" stopColor="var(--sky-top)" stopOpacity="0.85" />
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
      {art.land}
      <g opacity={0.55}>{art.back}</g>
      {art.fillers}
      {art.landmarks}
      <rect y={H * 0.45} width={W} height={H * 0.55} fill="url(#sky-fog)" />
      {art.front}
      {art.lights}
    </svg>
  );
}
