'use client';

import { useMemo, type ReactNode } from 'react';
import { DEFAULT_CITY, type City, type Landmark, type Prop, type Terrain } from '@/lib/city';

const W = 1440;
/** Landmarks are authored in a 480-tall space; drawn VS taller and WS wider. */
const VS = 1.6;
const WS = 1.25;
const H = 640;
const BASE = H;
/** Map an authored y (0..480, street at 480) into the taller drawing. */
const Y = (v: number) => BASE - (480 - v) * VS;

const FILL = 'var(--sky-mid)';
const pts = (p: [number, number][]) => p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');

function rng(seed: number) {
  let s = (seed % 2147483646) + 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function hash(str: string) {
  let h = 7;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Lit windows over a rectangle. About a third twinkle, each on its own rhythm. */
function windows(r: () => number, x: number, w: number, top: number, density: number, key: string) {
  const out: ReactNode[] = [];
  for (let y = top + 12; y < BASE - 10; y += 12) {
    for (let wx = x + 6; wx < x + w - 6; wx += 9) {
      if (r() >= density) continue;
      const o = 0.25 + r() * 0.6;
      if (o > 0.6 && r() < 0.6) out.push(<circle key={`${key}-${wx}-${y}h`} cx={wx + 1.6} cy={y + 2.3} r={7} fill="url(#sky-bokeh)" opacity={0.55} />);
      const tw = r() < 0.34;
      out.push(
        <rect
          key={`${key}-${wx}-${y}`} x={wx} y={y} width={3.2} height={4.6} fill="var(--sky-win)" opacity={o.toFixed(2)}
          className={tw ? 'tw' : undefined}
          style={tw ? { animationDelay: `${(r() * 9).toFixed(2)}s`, animationDuration: `${(2.2 + r() * 4).toFixed(2)}s` } : undefined}
        />,
      );
    }
  }
  return out;
}

const mast = (x: number, top: number, len: number, k: string) => <rect key={k} x={x - 1.2} y={top - len} width={2.4} height={len} fill={FILL} />;
const beaconAt = (x: number, y: number, k: string, delay: number) => (
  <g key={k}>
    <circle cx={x} cy={y} r={9} fill="url(#sky-red)" className="blink" style={{ animationDelay: `${delay}s` }} />
    <circle cx={x} cy={y} r={2.6} fill="#ff6a5a" className="blink" style={{ animationDelay: `${delay}s` }} />
  </g>
);
/** A soft band of signature light. */
const glowBand = (x: number, y: number, w: number, h: number, color: string, k: string) => (
  <g key={k}>
    <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={8} fill={color} opacity={0.12} filter="url(#sky-soft)" />
    <rect x={x} y={y} width={w} height={h} fill={color} opacity={0.75} />
  </g>
);

/** Returns the drawing and the top point (for a beacon). */
function landmark(src: Landmark, r: () => number, i: number): { el: ReactNode; top: [number, number] } {
  const k = `lm${i}`;
  const centered = src.kind === 'sphere' || src.kind === 'needle' || src.kind === 'obelisk';
  const w0 = src.w ?? 60;
  const w = w0 * WS;
  const x = centered ? src.x : src.x - (w - w0) / 2;
  const h = src.h * VS;
  const s = src.s == null ? undefined : src.s * VS * 0.85;
  const t = BASE - h;
  const c = src.color ?? 'var(--sky-win)';
  const cx = x + w / 2;
  switch (src.kind) {
    case 'sphere': {
      const dots: ReactNode[] = [];
      for (let a = 0; a < 70; a++) {
        const th = r() * Math.PI * 2, rr = Math.sqrt(r()) * 30;
        dots.push(<circle key={`${k}d${a}`} cx={x + Math.cos(th) * rr} cy={t + Math.sin(th) * rr * 0.9} r={1.6} fill={c} opacity={(0.4 + r() * 0.6).toFixed(2)} className="tw" style={{ animationDelay: `${(r() * 3).toFixed(2)}s`, animationDuration: `${(1.4 + r() * 2).toFixed(2)}s` }} />);
      }
      return {
        top: [x, t - 56],
        el: (
          <g key={k}>
            {[-11, -2.5, 6].map((dx) => <rect key={dx} x={x + dx} y={t + 22} width={5} height={h - 22} fill={FILL} />)}
            <circle cx={x} cy={t} r={46} fill={c} opacity={0.1} filter="url(#sky-soft)" />
            <circle cx={x} cy={t} r={33} fill={FILL} />
            {dots}
            {mast(x, t - 32, 24, `${k}m`)}
          </g>
        ),
      };
    }
    case 'needle': {
      const disc = w0 * 1.15;
      return {
        top: [x, t - 52],
        el: (
          <g key={k}>
            <polygon points={pts([[x - 18, BASE], [x - 5, t + 40], [x + 5, t + 40], [x + 18, BASE]])} fill={FILL} />
            <polygon points={pts([[x - disc / 2, t + 8], [x + disc / 2, t + 8], [x + disc / 2 - 16, t + 34], [x - disc / 2 + 16, t + 34]])} fill={FILL} />
            <ellipse cx={x} cy={t + 9} rx={disc / 2 + 10} ry={14} fill={c} opacity={0.14} filter="url(#sky-soft)" />
            <ellipse cx={x} cy={t + 9} rx={disc / 2} ry={4} fill={c} opacity={0.8} />
            <rect x={x - 13} y={t - 10} width={26} height={18} fill={FILL} />
            {mast(x, t - 10, 42, `${k}m`)}
          </g>
        ),
      };
    }
    case 'obelisk':
      return {
        top: [x, t - (s ?? 40) - 14],
        el: (
          <g key={k}>
            <rect x={x - w * 1.4} y={BASE - 40} width={w * 2.8} height={40} fill={FILL} />
            <polygon points={pts([[x - w / 2, BASE - 40], [x - w / 3, t], [x + w / 3, t], [x + w / 2, BASE - 40]])} fill={FILL} />
            <rect x={x - w / 3 - 4} y={t - 10} width={(w * 2) / 3 + 8} height={12} fill={FILL} />
            <polygon points={pts([[x - 5, t - 10], [x, t - (s ?? 40) - 10], [x + 5, t - 10]])} fill={FILL} />
            <circle cx={x} cy={t - 40} r={42} fill={c} opacity={0.12} filter="url(#sky-soft)" />
          </g>
        ),
      };
    case 'outline':
      return {
        top: [cx, t],
        el: (
          <g key={k}>
            <rect x={x} y={t} width={w} height={h} fill={FILL} />
            {windows(r, x, w, t, 0.1, k)}
            <path d={`M${x - 3} ${BASE} V${t - 3} H${x + w + 3} V${BASE}`} fill="none" stroke={c} strokeWidth={10} opacity={0.12} filter="url(#sky-soft)" />
            <path d={`M${x} ${BASE} V${t} H${x + w} V${BASE}`} fill="none" stroke={c} strokeWidth={2.4} opacity={0.9} />
            <path d={`M${x + 4} ${BASE} V${t + 4} H${x + w - 4} V${BASE}`} fill="none" stroke={c} strokeWidth={1} opacity={0.45} />
          </g>
        ),
      };
    case 'prism':
      return {
        top: [x + w * 0.42, t],
        el: (
          <g key={k}>
            <polygon points={pts([[x, BASE], [x, t + 70], [x + w * 0.42, t], [x + w, t + 130], [x + w, BASE]])} fill={FILL} />
            <polygon points={pts([[x + w * 0.42, t], [x + w, t + 130], [x + w, BASE], [x + w * 0.42, BASE]])} fill="var(--sky-face)" opacity={0.55} />
            {windows(r, x, w, t + 130, 0.08, k)}
          </g>
        ),
      };
    case 'xtower': {
      const xs: ReactNode[] = [];
      for (let y = t + 16; y < BASE - 60; y += 70) {
        xs.push(<path key={`${k}x${y}`} d={`M${x} ${y} L${x + w} ${y + 70} M${x + w} ${y} L${x} ${y + 70}`} stroke={src.color ?? 'var(--sky-line)'} strokeWidth={src.color ? 1.6 : 1.2} opacity={src.color ? 0.7 : 0.7} />);
      }
      return {
        top: [x + 10, t - 44],
        el: (
          <g key={k}>
            <rect x={x} y={t} width={w} height={h} fill={FILL} />
            {xs}
            {mast(x + 10, t, 44, `${k}a`)}
            {mast(x + w - 10, t, 44, `${k}b`)}
          </g>
        ),
      };
    }
    case 'arch':
      return {
        top: [cx, t],
        el: (
          <g key={k}>
            <path d={`M${x} ${BASE} V${t + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${t + w / 2} V${BASE} Z`} fill={FILL} />
            {src.color && <path d={`M${x} ${t + w / 2 + 50} V${t + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${t + w / 2} V${t + w / 2 + 50} Z`} fill={c} opacity={0.18} />}
            <path d={`M${x + 9} ${t + w / 2 + 5} A${w / 2 - 9} ${w / 2 - 9} 0 0 1 ${x + w - 9} ${t + w / 2 + 5}`} fill="none" stroke={c} strokeWidth={2} opacity={0.8} />
            {src.color && <circle cx={cx} cy={t + w / 2} r={w * 0.8} fill={c} opacity={0.1} filter="url(#sky-soft)" />}
            {windows(r, x, w, t + w / 2 + 56, 0.12, k)}
          </g>
        ),
      };
    case 'keyhole':
      return {
        top: [cx, t],
        el: (
          <g key={k}>
            <rect x={x} y={t} width={w} height={h} fill={FILL} />
            <rect x={x + w * 0.26} y={t + 20} width={w * 0.48} height={46} rx={5} fill="var(--sky-gap)" />
            {windows(r, x, w, t + 80, 0.11, k)}
          </g>
        ),
      };
    case 'spire': {
      const sp = s ?? 60;
      const step = Math.max(10, w * 0.15);
      return {
        top: [cx, t - sp],
        el: (
          <g key={k}>
            <rect x={x} y={t + 96} width={w} height={h - 96} fill={FILL} />
            <rect x={x + step} y={t + 42} width={w - step * 2} height={58} fill={FILL} />
            <rect x={x + step * 2} y={t} width={w - step * 4} height={46} fill={FILL} />
            <polygon points={pts([[cx - 5, t], [cx, t - sp], [cx + 5, t]])} fill={FILL} />
            {src.color && glowBand(x + step * 2, t + 6, w - step * 4, 10, c, `${k}g`)}
            {src.color && glowBand(x + step, t + 48, w - step * 2, 4, c, `${k}g2`)}
            {windows(r, x, w, t + 96, 0.11, k)}
          </g>
        ),
      };
    }
    case 'sunburst': {
      const sp = s ?? 80;
      const arcs: ReactNode[] = [];
      for (let j = 0; j < 5; j++) {
        const aw = w * (0.86 - j * 0.15), ay = t + 120 - j * 24;
        arcs.push(<path key={`${k}a${j}`} d={`M${cx - aw / 2} ${ay} A${aw / 2} ${aw / 2.2} 0 0 1 ${cx + aw / 2} ${ay}`} fill={FILL} stroke={c} strokeWidth={1.6} opacity={1} />);
        for (let tri = 0; tri < 4; tri++) {
          const tx = cx - aw / 2 + 8 + (tri * (aw - 16)) / 3;
          arcs.push(<polygon key={`${k}t${j}${tri}`} points={pts([[tx - 3, ay - aw / 4.4 + 6], [tx, ay - aw / 4.4 - 4], [tx + 3, ay - aw / 4.4 + 6]])} fill={c} opacity={0.7} />);
        }
      }
      return {
        top: [cx, t + 24 - sp],
        el: (
          <g key={k}>
            <rect x={x} y={t + 120} width={w} height={h - 120} fill={FILL} />
            <circle cx={cx} cy={t + 70} r={w * 0.9} fill={c} opacity={0.08} filter="url(#sky-soft)" />
            {arcs}
            <polygon points={pts([[cx - 4, t + 30], [cx, t + 24 - sp], [cx + 4, t + 30]])} fill={FILL} />
            {windows(r, x, w, t + 124, 0.1, k)}
          </g>
        ),
      };
    }
    case 'sail': {
      const sp = s ?? 60;
      return {
        top: [x + w * 0.7, t - sp],
        el: (
          <g key={k}>
            <path d={`M${x} ${BASE} V${t + 90} Q${x + w * 0.35} ${t + 10} ${x + w * 0.7} ${t} L${x + w} ${t + 30} V${BASE} Z`} fill={FILL} />
            <path d={`M${x} ${t + 90} Q${x + w * 0.35} ${t + 10} ${x + w * 0.7} ${t}`} fill="none" stroke={c} strokeWidth={2.4} opacity={0.85} />
            <path d={`M${x} ${t + 90} Q${x + w * 0.35} ${t + 10} ${x + w * 0.7} ${t}`} fill="none" stroke={c} strokeWidth={12} opacity={0.12} filter="url(#sky-soft)" />
            <polygon points={pts([[x + w * 0.7 - 3, t], [x + w * 0.7, t - sp], [x + w * 0.7 + 3, t]])} fill={FILL} />
            {windows(r, x, w, t + 100, 0.11, k)}
          </g>
        ),
      };
    }
    case 'cap': {
      const ch = w * 0.75;
      return {
        top: [cx, t - 18],
        el: (
          <g key={k}>
            <rect x={x} y={t + ch} width={w} height={h - ch} fill={FILL} />
            <polygon points={pts([[x - 4, t + ch], [cx, t], [x + w + 4, t + ch]])} fill={FILL} />
            {src.color && <polygon points={pts([[x - 4, t + ch], [cx, t], [x + w + 4, t + ch]])} fill="none" stroke={c} strokeWidth={2} opacity={0.8} />}
            {src.color && <polygon points={pts([[x - 4, t + ch], [cx, t], [x + w + 4, t + ch]])} fill={c} opacity={0.08} filter="url(#sky-soft)" />}
            {mast(cx, t, 18, `${k}m`)}
            {windows(r, x, w, t + ch + 6, 0.11, k)}
          </g>
        ),
      };
    }
    case 'wtc': {
      const sp = s ?? 80;
      return {
        top: [cx, t - sp],
        el: (
          <g key={k}>
            <polygon points={pts([[x, BASE], [x, t + 90], [x + w * 0.18, t], [x + w * 0.82, t], [x + w, t + 90], [x + w, BASE]])} fill={FILL} />
            <polygon points={pts([[cx, t], [x + w * 0.82, t], [x + w, t + 90], [x + w, BASE], [cx, BASE]])} fill="var(--sky-face)" opacity={0.5} />
            {sp > 0 && mast(cx, t, sp, `${k}m`)}
            {windows(r, x, w, t + 90, 0.08, k)}
          </g>
        ),
      };
    }
    case 'antenna2': {
      const sp = s ?? 70;
      const q = w / 4;
      return {
        top: [x + q * 1.4, t - sp],
        el: (
          <g key={k}>
            <rect x={x} y={t + 150} width={w} height={h - 150} fill={FILL} />
            <rect x={x} y={t + 70} width={q * 3} height={90} fill={FILL} />
            <rect x={x + q} y={t} width={q * 2} height={80} fill={FILL} />
            {mast(x + q * 1.4, t, sp, `${k}a`)}
            {mast(x + q * 2.6, t, sp * 0.85, `${k}b`)}
            {beaconAt(x + q * 2.6, t - sp * 0.85, `${k}bb`, 0.6)}
            {windows(r, x, w, t + 150, 0.1, k)}
          </g>
        ),
      };
    }
    case 'taper': {
      const sp = s ?? 70;
      const off = (w - w * 0.62) / 2;
      const xl = (y: number) => x + off * ((BASE - y) / h);
      const xr = (y: number) => x + w - off * ((BASE - y) / h);
      const xs: ReactNode[] = [];
      for (let y = t + 12; y < BASE - 70; y += 80) {
        xs.push(<path key={`${k}x${y}`} d={`M${xl(y)} ${y} L${xr(y + 80)} ${y + 80} M${xr(y)} ${y} L${xl(y + 80)} ${y + 80}`} stroke="var(--sky-line)" strokeWidth={1.4} opacity={0.7} />);
      }
      return {
        top: [cx - 10, t - sp],
        el: (
          <g key={k}>
            <polygon points={pts([[x, BASE], [x + off, t], [x + w - off, t], [x + w, BASE]])} fill={FILL} />
            {xs}
            {mast(cx - 10, t, sp, `${k}a`)}
            {mast(cx + 10, t, sp, `${k}b`)}
            {beaconAt(cx + 10, t - sp, `${k}bb`, 1.1)}
          </g>
        ),
      };
    }
    case 'pyramid':
      return {
        top: [cx, t - 6],
        el: (
          <g key={k}>
            <polygon points={pts([[x, BASE], [cx, t], [x + w, BASE]])} fill={FILL} />
            <polygon points={pts([[cx, t], [x + w, BASE], [cx, BASE]])} fill="var(--sky-face)" opacity={0.45} />
            <polygon points={pts([[x - 12, BASE - h * 0.45], [x + 8, BASE - h * 0.56], [x + 8, BASE - h * 0.4]])} fill={FILL} />
            <polygon points={pts([[x + w + 12, BASE - h * 0.45], [x + w - 8, BASE - h * 0.56], [x + w - 8, BASE - h * 0.4]])} fill={FILL} />
            <circle cx={cx} cy={t + 6} r={22} fill={c} opacity={0.22} filter="url(#sky-soft)" />
            <circle cx={cx} cy={t + 6} r={3.5} fill={c} />
            {windows(r, cx - w * 0.18, w * 0.36, t + h * 0.45, 0.12, k)}
          </g>
        ),
      };
    case 'crown': {
      const spikes: [number, number][] = [];
      const n = 11;
      for (let j = 0; j <= n; j++) spikes.push([x + (w * j) / n, t + (j % 2 ? 40 : 0) + Math.abs(j - n / 2) * 4]);
      return {
        top: [cx, t + Math.abs(Math.round(n / 2) - n / 2) * 4],
        el: (
          <g key={k}>
            <polygon points={pts([[x, BASE], ...spikes, [x + w, BASE]])} fill={FILL} />
            <polyline points={pts(spikes)} fill="none" stroke={c} strokeWidth={2} opacity={0.85} />
            <polyline points={pts(spikes)} fill="none" stroke={c} strokeWidth={14} opacity={0.12} filter="url(#sky-soft)" />
            {windows(r, x, w, t + 60, 0.11, k)}
          </g>
        ),
      };
    }
    case 'twinspire': {
      const sp = s ?? 80;
      return {
        top: [x + w - 5, t - sp],
        el: (
          <g key={k}>
            <polygon points={pts([[x, BASE], [x, t], [x + 10, t], [cx, t + 48], [x + w - 10, t], [x + w, t], [x + w, BASE]])} fill={FILL} />
            <polygon points={pts([[x + 1, t], [x + 5, t - sp], [x + 9, t]])} fill={FILL} />
            <polygon points={pts([[x + w - 9, t], [x + w - 5, t - sp], [x + w - 1, t]])} fill={FILL} />
            {beaconAt(x + 5, t - sp, `${k}b1`, 0.3)}
            <path d={`M${x + 10} ${t + 4} L${cx} ${t + 52} L${x + w - 10} ${t + 4}`} fill="none" stroke="var(--sky-win)" strokeWidth={1.6} opacity={0.55} />
            {windows(r, x, w, t + 58, 0.11, k)}
          </g>
        ),
      };
    }
    case 'dome': {
      const sp = s ?? 30;
      const dw = w * 0.4;
      const domeTop = BASE - h * 0.6 - dw * 0.62;
      return {
        top: [cx, domeTop - sp],
        el: (
          <g key={k}>
            <rect x={x} y={BASE - h * 0.42} width={w} height={h * 0.42} fill={FILL} />
            <rect x={cx - dw / 2 - 8} y={BASE - h * 0.62} width={dw + 16} height={h * 0.22} fill={FILL} />
            <circle cx={cx} cy={BASE - h * 0.62} r={dw * 0.95} fill={c} opacity={0.12} filter="url(#sky-soft)" />
            <path d={`M${cx - dw / 2} ${BASE - h * 0.6} A${dw / 2} ${dw * 0.62} 0 0 1 ${cx + dw / 2} ${BASE - h * 0.6} Z`} fill={FILL} stroke={c} strokeWidth={1.6} />
            {mast(cx, domeTop, sp, `${k}m`)}
            {windows(r, x, w, BASE - h * 0.42, 0.1, k)}
          </g>
        ),
      };
    }
    case 'stack': {
      const blocks: ReactNode[] = [];
      const n = 6, bh = h / n;
      for (let j = 0; j < n; j++) {
        const dx = j % 3 === 1 ? 12 : j % 3 === 2 ? -9 : 0;
        blocks.push(<rect key={`${k}s${j}`} x={x + dx} y={BASE - bh * (j + 1)} width={w} height={bh + 1} fill={FILL} />);
      }
      return { top: [cx, t], el: <g key={k}>{blocks}{windows(r, x, w, t, 0.1, k)}</g> };
    }
    case 'gable': {
      const g1 = t + 56, g2 = t + 104;
      const outline: [number, number][] = [[x, g2 + 28], [x + w * 0.2, g2], [x + w * 0.2, g1 + 20], [x + w * 0.35, g1], [x + w * 0.35, t + 20], [cx, t], [x + w * 0.65, t + 20], [x + w * 0.65, g1], [x + w * 0.8, g1 + 20], [x + w * 0.8, g2], [x + w, g2 + 28]];
      return {
        top: [cx, t],
        el: (
          <g key={k}>
            <polygon points={pts([[x, BASE], ...outline, [x + w, BASE]])} fill={FILL} />
            {src.color && <polyline points={pts(outline)} fill="none" stroke={c} strokeWidth={1.8} opacity={0.8} />}
            {src.color && <polyline points={pts(outline)} fill="none" stroke={c} strokeWidth={12} opacity={0.1} filter="url(#sky-soft)" />}
            {windows(r, x, w, g2 + 28, 0.11, k)}
          </g>
        ),
      };
    }
    default:
      return {
        top: [cx, t],
        el: (
          <g key={k}>
            <rect x={x} y={t} width={w} height={h} fill={FILL} />
            {windows(r, x, w, t, 0.12, k)}
          </g>
        ),
      };
  }
}

function terrain(kind: Terrain, r: () => number): ReactNode {
  if (kind === 'none') return null;
  const ridge = (base: number, amp: number, step: number, rough: number) => {
    const p: [number, number][] = [[0, BASE]];
    let y = base;
    for (let x = 0; x <= W; x += step) {
      y = Math.min(BASE - 60, Math.max(base - amp, y + (r() - 0.5) * rough));
      p.push([x, y]);
    }
    p.push([W, BASE]);
    return pts(p);
  };
  if (kind === 'peak') {
    const cx = 990, top = Y(95);
    const snow: [number, number][] = [[cx - 110, top + 95], [cx - 55, top + 30], [cx, top], [cx + 70, top + 36], [cx + 140, top + 100], [cx + 70, top + 78], [cx + 15, top + 104], [cx - 45, top + 74]];
    return (
      <g>
        <polygon points={pts([[cx - 520, BASE - 180], [cx - 55, top + 30], [cx, top], [cx + 70, top + 36], [cx + 560, BASE - 160], [cx + 560, BASE], [cx - 520, BASE]])} fill="var(--sky-mtn)" />
        <polygon points={pts(snow)} fill="var(--sky-snow)" opacity={0.6} />
      </g>
    );
  }
  if (kind === 'range') {
    return (
      <g>
        <polygon points={ridge(Y(255), 70 * VS, 30, 70 * VS)} fill="var(--sky-mtn)" opacity={0.65} />
        <polygon points={ridge(Y(310), 40 * VS, 26, 45 * VS)} fill="var(--sky-mtn)" />
      </g>
    );
  }
  if (kind === 'mesa') {
    // Camelback Mountain: the hump and the head, exaggerated
    return (
      <g>
        <polygon points={pts([[0, BASE], [0, Y(330)], [80, Y(300)], [170, Y(215)], [250, Y(200)], [320, Y(255)], [370, Y(240)], [420, Y(185)], [470, Y(205)], [560, Y(300)], [700, Y(330)], [1440, Y(340)], [1440, BASE]])} fill="var(--sky-mtn)" />
        <polygon points={ridge(Y(330), 50 * VS, 50, 50 * VS)} fill="var(--sky-mtn)" opacity={0.55} />
      </g>
    );
  }
  return <polygon points={ridge(Y(330), 40 * VS, 50, 40 * VS)} fill="var(--sky-mtn)" opacity={0.85} />;
}

function props(list: Prop[] | undefined, r: () => number, layer: 'mid' | 'front'): ReactNode[] {
  const out: ReactNode[] = [];
  for (const p of list ?? []) {
    if (layer === 'mid' && p === 'goldengate') {
      const tx = 1040, top = Y(150), deck = BASE - 120;
      out.push(
        <g key="gg" opacity={0.95}>
          <path d={`M${tx - 380} ${deck} Q${tx - 190} ${deck - 30} ${tx - 10} ${top + 10}`} fill="none" stroke="var(--sky-gg)" strokeWidth={3} />
          <path d={`M${tx + 30} ${top + 10} Q${tx + 220} ${deck - 30} ${tx + 420} ${deck}`} fill="none" stroke="var(--sky-gg)" strokeWidth={3} />
          <rect x={tx - 400} y={deck} width={840} height={7} fill="var(--sky-gg)" />
          {[0, 26].map((dx) => <rect key={dx} x={tx - 10 + dx} y={top} width={11} height={BASE - top} fill="var(--sky-gg)" />)}
          {[0.12, 0.35, 0.58, 0.8].map((f) => <rect key={f} x={tx - 10} y={top + (deck - top) * f} width={37} height={6} fill="var(--sky-gg)" />)}
          {[0, 26].map((dx) => <g key={`b${dx}`}>{beaconAt(tx - 4.5 + dx, top - 4, `ggb${dx}`, dx ? 0.9 : 0.2)}</g>)}
        </g>,
      );
    }
    if (layer === 'mid' && p === 'liftbridge') {
      const a = 860, b = 1080, top = Y(200), deck = BASE - 110, span = top + 70;
      out.push(
        <g key="lb">
          {[a, b].map((tx) => <rect key={tx} x={tx} y={top} width={24} height={BASE - top} fill="var(--sky-bridge)" />)}
          <rect x={a} y={span} width={b - a + 24} height={16} fill="var(--sky-bridge)" />
          <rect x={a - 300} y={deck} width={b - a + 600} height={8} fill="var(--sky-bridge)" />
          {[a, b].map((tx, j) => <g key={`l${tx}`}>{beaconAt(tx + 12, top - 4, `lbb${j}`, j * 0.7)}</g>)}
          <rect x={a} y={span + 16} width={b - a + 24} height={2} fill="var(--sky-win)" opacity={0.5} />
        </g>,
      );
    }
    if (layer === 'front' && p === 'palms') {
      for (let j = 0; j < 7; j++) {
        const px = 60 + j * 205 + r() * 70, ph = 170 + r() * 110, lean = (r() - 0.5) * 40;
        const topX = px + lean, topY = BASE - ph;
        const fronds: ReactNode[] = [];
        for (let f = 0; f < 8; f++) {
          const ang = -Math.PI + (f / 7) * Math.PI + (r() - 0.5) * 0.3;
          const len = 46 + r() * 22;
          const ex = topX + Math.cos(ang) * len, ey = topY + Math.sin(ang) * len * 0.55 + 22;
          fronds.push(<path key={f} d={`M${topX} ${topY} Q${topX + Math.cos(ang) * len * 0.5} ${topY - 16} ${ex} ${ey}`} fill="none" stroke="var(--sky-front)" strokeWidth={5} strokeLinecap="round" />);
        }
        out.push(
          <g key={`palm${j}`}>
            <path d={`M${px} ${BASE} Q${px + lean * 0.2} ${BASE - ph * 0.6} ${topX} ${topY}`} fill="none" stroke="var(--sky-front)" strokeWidth={7} />
            {fronds}
          </g>,
        );
      }
    }
    if (layer === 'front' && p === 'saguaro') {
      for (let j = 0; j < 6; j++) {
        const px = 80 + j * 240 + r() * 90, ph = 130 + r() * 90, armY = BASE - ph * 0.55;
        out.push(
          <g key={`sg${j}`} stroke="var(--sky-front)" strokeWidth={16} strokeLinecap="round" fill="none">
            <path d={`M${px} ${BASE} V${BASE - ph}`} />
            <path d={`M${px} ${armY} H${px - 26} V${armY - ph * 0.3}`} strokeWidth={11} />
            {r() > 0.3 && <path d={`M${px} ${armY + 20} H${px + 24} V${armY - ph * 0.22}`} strokeWidth={11} />}
          </g>,
        );
      }
    }
  }
  return out;
}

/** A misty night skyline of a city. Decorative. */
export function Skyline({ city = DEFAULT_CITY, className = '' }: { city?: City; className?: string }) {
  const art = useMemo(() => {
    const r = rng(hash(city.id));
    const land = terrain(city.terrain, r);
    // Low background blocks so the landmarks dominate
    const back: ReactNode[] = [];
    for (let x = -20; x < W; ) {
      const w = 30 + r() * 60, h = (50 + r() * 110) * VS;
      back.push(<rect key={`b${x}`} x={x} y={BASE - h} width={w} height={h} fill="var(--sky-back)" />);
      x += w + 2;
    }
    const spans = city.landmarks.map((l) => {
      const w = (l.w ?? 60) * WS;
      const centered = l.kind === 'sphere' || l.kind === 'needle' || l.kind === 'obelisk';
      const half = l.kind === 'sphere' ? 40 : l.kind === 'needle' ? (l.w ?? 80) * 0.65 : l.kind === 'obelisk' ? (l.w ?? 40) * 1.5 : 0;
      return centered ? [l.x - half, l.x + half] : [l.x - (w - (l.w ?? 60)) / 2, l.x - (w - (l.w ?? 60)) / 2 + w];
    });
    const fillers: ReactNode[] = [];
    for (let x = -10; x < W; ) {
      const w = 34 + r() * 52, h = (40 + r() * 95) * VS;
      if (!spans.some(([a, b]) => x + w > a - 14 && x < b + 14)) {
        fillers.push(
          <g key={`f${x}`}>
            <rect x={x} y={BASE - h} width={w} height={h} fill="var(--sky-mid)" />
            {windows(r, x, w, BASE - h, 0.08, `f${x}`)}
          </g>,
        );
      }
      x += w + 3;
    }
    const lm = city.landmarks.map((l, i) => landmark(l, r, i));
    const beacons = city.landmarks
      .map((l, i) => (l.beacon && l.kind !== 'antenna2' && l.kind !== 'taper' && l.kind !== 'twinspire' ? beaconAt(lm[i].top[0], lm[i].top[1] - 3, `bc${i}`, (i * 0.37) % 2) : null))
      .filter(Boolean);
    const front: ReactNode[] = [];
    for (let x = -10; x < W; ) {
      const w = 40 + r() * 90, h = (18 + r() * 60) * 1.2;
      front.push(<rect key={`n${x}`} x={x} y={BASE - h} width={w} height={h} fill="var(--sky-front)" />);
      x += w;
    }
    const lights: ReactNode[] = [];
    for (let i = 0; i < 10; i++) {
      lights.push(<circle key={`l${i}`} cx={r() * W} cy={BASE - 20 - r() * 70} r={20 + r() * 38} fill="url(#sky-bokeh)" opacity={(0.3 + r() * 0.35).toFixed(2)} className="glow" style={{ animationDelay: `${(r() * 6).toFixed(2)}s` }} />);
    }
    return { land, back, fillers, landmarks: lm.map((x) => x.el), beacons, mid: props(city.props, r, 'mid'), frontProps: props(city.props, r, 'front'), front, lights };
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
          <stop offset="0" stopColor="var(--sky-win)" stopOpacity="0.6" />
          <stop offset="1" stopColor="var(--sky-win)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sky-red">
          <stop offset="0" stopColor="#ff6a5a" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ff6a5a" stopOpacity="0" />
        </radialGradient>
        <filter id="sky-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <linearGradient id="sky-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky-mist)" stopOpacity="0" />
          <stop offset="0.55" stopColor="var(--sky-mist)" stopOpacity="0.14" />
          <stop offset="1" stopColor="var(--bg)" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#sky-air)" />
      <rect width={W} height={H} fill="url(#sky-glow)" />
      {art.land}
      <g opacity={0.5}>{art.back}</g>
      {art.mid}
      {art.fillers}
      {art.landmarks}
      {art.beacons}
      <rect y={H * 0.55} width={W} height={H * 0.45} fill="url(#sky-fog)" />
      {art.front}
      {art.frontProps}
      {art.lights}
    </svg>
  );
}
