'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Map as MLMap, Marker } from 'maplibre-gl';
import { useLive } from './LiveProvider';
import { Cover } from './Media';
import { StatusPill, WorthText, topComment } from './bits';
import { SetupNotice } from './AppShell';
import { isActive } from '@/lib/scoring';
import { fmtMi } from '@/lib/geo';
import type { EventRow } from '@/lib/types';

// Free CARTO basemaps, no API key: dark streets at night, light streets by day.
// NEXT_PUBLIC_MAP_STYLE (e.g. a MapTiler style URL) overrides both.
const STYLES = {
  night: process.env.NEXT_PUBLIC_MAP_STYLE || 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  day: process.env.NEXT_PUBLIC_MAP_STYLE || 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};
type MapLib = typeof import('maplibre-gl');

/**
 * maplibre is loaded as a plain script from the CDN rather than bundled. Its package is a UMD
 * bundle marked "type": "module", and once the bundler wraps it the map comes up but its tile
 * worker never draws the streets (a black map). The script tag is the setup maplibre documents.
 */
const ML_CDN = 'https://cdn.jsdelivr.net/npm/maplibre-gl@5.6.0/dist';
let mlLoading: Promise<MapLib> | null = null;
function loadMapLib(): Promise<MapLib> {
  const w = window as unknown as { maplibregl?: MapLib };
  if (w.maplibregl) return Promise.resolve(w.maplibregl);
  if (!document.getElementById('maplibre-css')) {
    const link = document.createElement('link');
    link.id = 'maplibre-css';
    link.rel = 'stylesheet';
    link.href = `${ML_CDN}/maplibre-gl.css`;
    document.head.appendChild(link);
  }
  mlLoading ??= new Promise<MapLib>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `${ML_CDN}/maplibre-gl.js`;
    s.async = true;
    s.onload = () => (w.maplibregl ? resolve(w.maplibregl) : reject(new Error('maplibre loaded without its API')));
    s.onerror = () => {
      mlLoading = null;
      s.remove();
      reject(new Error('maplibre failed to download'));
    };
    document.head.appendChild(s);
  });
  return mlLoading;
}
const COLOR: Record<string, string> = { pop: '#EE8B5A', mid: '#D9B866', dead: '#7E8B96' };
const FILTERS: [string, string][] = [
  ['active', 'Active now'], ['pop', 'Popping only'], ['worth', '80%+ worth it'], ['heat', 'Heating up'], ['free', 'Free entry'], ['near', 'Within 2 mi'],
];

export function MapView() {
  const router = useRouter();
  const { events, stats, now, dist, posts, comments, userLoc, locate, city, theme } = useLive();
  const styleTheme = useRef(theme);
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const markers = useRef<Map<string, Marker>>(new Map());
  const meMarker = useRef<Marker | null>(null);
  const lib = useRef<MapLib | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [f, setF] = useState<Set<string>>(new Set(['active']));

  const list = useMemo(() => {
    let L = events.filter((e) => e.visibility === 'public' && e.lat != null && e.lng != null && Date.parse(e.ends_at) > now);
    if (f.has('active')) L = L.filter((e) => isActive(e, now));
    if (f.has('pop')) L = L.filter((e) => stats[e.id]?.status === 'pop');
    if (f.has('worth')) L = L.filter((e) => stats[e.id]?.conf !== 'none' && stats[e.id].py >= 0.8);
    if (f.has('heat')) L = L.filter((e) => stats[e.id]?.mom === 'up');
    if (f.has('free')) L = L.filter((e) => /free|no cover/i.test(e.cover_charge ?? ''));
    if (f.has('near')) L = L.filter((e) => (dist(e) ?? 99) <= 2);
    return L;
  }, [events, stats, now, f, dist]);

  // init map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ml = await loadMapLib();
        if (cancelled || !box.current) return;
        lib.current = ml;
        const m = new ml.Map({
          container: box.current,
          style: STYLES[styleTheme.current],
          center: [city.center.lng, city.center.lat + 0.012],
          zoom: 12.2,
          attributionControl: { compact: true },
        });
        m.addControl(new ml.NavigationControl({ showCompass: false }), 'bottom-right');
        m.on('load', () => setReady(true));
        m.on('error', (e) => console.warn('map:', e.error?.message ?? e));
        m.on('click', () => setSel(null));
        map.current = m;
      } catch (err) {
        console.error('map failed to start', err);
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      markers.current.clear();
    };
  }, []);

  // sync markers
  useEffect(() => {
    const m = map.current, ml = lib.current;
    if (!m || !ml || !ready) return;
    const keep = new Set(list.map((e) => e.id));
    for (const [id, mk] of markers.current) if (!keep.has(id)) { mk.remove(); markers.current.delete(id); }
    for (const e of list) {
      const s = stats[e.id];
      const live = isActive(e, now);
      const color = (live && COLOR[s.status]) || '#6b7080';
      const size = 26 + Math.min(18, s.r60 / 3);
      let mk = markers.current.get(e.id);
      if (!mk) {
        const el = document.createElement('button');
        el.className = 'pin';
        el.type = 'button';
        el.addEventListener('click', (ev) => { ev.stopPropagation(); setSel(e.id); });
        mk = new ml.Marker({ element: el }).setLngLat([e.lng!, e.lat!]).addTo(m);
        markers.current.set(e.id, mk);
      }
      const el = mk.getElement();
      el.style.setProperty('--c', color);
      el.style.setProperty('--s', `${size}px`);
      el.classList.toggle('sel', sel === e.id);
      el.textContent = live && s.conf !== 'none' ? String(s.score) : '';
      el.setAttribute('aria-label', `${e.name}`);
    }
  }, [list, stats, now, ready, sel]);

  // swap the basemap with the day/night theme (markers are DOM elements and stay put)
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || styleTheme.current === theme) return;
    styleTheme.current = theme;
    if (STYLES.day !== STYLES.night) m.setStyle(STYLES[theme]);
  }, [theme, ready]);

  // follow the selected city
  useEffect(() => {
    const m = map.current;
    if (m && ready && !userLoc) m.easeTo({ center: [city.center.lng, city.center.lat + 0.012], zoom: 12.2 });
    setSel(null);
  }, [city, ready, userLoc]);

  // you-are-here dot
  useEffect(() => {
    const m = map.current, ml = lib.current;
    if (!m || !ml || !ready || !userLoc) return;
    if (!meMarker.current) {
      const el = document.createElement('div');
      el.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 8px rgba(59,130,246,.25)';
      meMarker.current = new ml.Marker({ element: el }).setLngLat([userLoc.lng, userLoc.lat]).addTo(m);
      m.easeTo({ center: [userLoc.lng, userLoc.lat], zoom: 13 });
    } else meMarker.current.setLngLat([userLoc.lng, userLoc.lat]);
  }, [userLoc, ready]);

  const selected: EventRow | undefined = sel ? list.find((e) => e.id === sel) : undefined;
  const tc = selected ? topComment(comments[selected.id], now) : undefined;

  return (
    <>
      <SetupNotice />
      <div className="top" style={{ marginBottom: 12 }}>
        <h1 className="ttl" style={{ margin: 0 }}>Live map</h1>
        <div className="seg glass">
          <Link href="/" aria-pressed="false">Feed</Link>
          <button aria-pressed="true">Map</button>
        </div>
      </div>
      <div className="mapwrap">
        <div ref={box} className="mapc" role="region" aria-label="Map of live events" />
        {failed && <div className="empty" style={{ position: 'absolute', inset: 40 }}><h3>Map didn’t load.</h3><p>Check your connection and refresh.</p></div>}
        <div className="mapfloat">
          {FILTERS.map(([k, l]) => (
            <button
              key={k}
              className="chip"
              aria-pressed={f.has(k)}
              onClick={() => {
                const n = new Set(f);
                if (n.has(k)) n.delete(k); else n.add(k);
                setF(n);
                if (k === 'near' && !userLoc) locate(true);
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="legend glass" aria-hidden="true">
          <div><i style={{ background: 'var(--pop)' }} />Popping</div>
          <div><i style={{ background: 'var(--mid)' }} />Mid</div>
          <div><i style={{ background: 'var(--dead)' }} />Dead</div>
          <div><i style={{ background: 'var(--quiet)' }} />Not enough ratings</div>
        </div>
        {selected && (
          <button className="mapcard glass" style={{ textAlign: 'left' }} onClick={() => router.push(`/e/${selected.id}`)}>
            <div className="thumb"><Cover event={selected} posts={posts[selected.id]} /></div>
            <div>
              <div className="area"><span>{selected.area}</span><span>{fmtMi(dist(selected))}</span></div>
              <h3>{selected.name}</h3>
              <div className="row"><StatusPill s={stats[selected.id]} /><WorthText s={stats[selected.id]} /></div>
              {tc && <div className="meta" style={{ color: 'var(--muted)' }}>“{tc.body}”</div>}
            </div>
          </button>
        )}
      </div>
    </>
  );
}
