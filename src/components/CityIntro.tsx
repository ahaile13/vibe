'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { CITY_LIST } from '@/lib/city';
import { useLive } from './LiveProvider';
import { Skyline } from './Skyline';
import { Icon } from './Icon';
import { INTRO_KEY, INTRO_OPEN } from '@/lib/intro';

const ALPHA = [...CITY_LIST].sort((a, b) => a.name.localeCompare(b.name));
const indexOf = (id: string) => Math.max(0, ALPHA.findIndex((c) => c.id === id));

/**
 * Opening screen: the v mark, the centered city's skyline, and an A to Z
 * carousel of cities. The skyline crossfades as the carousel scrolls; tapping
 * the centered city enters the app there. The city button in the app reopens it.
 */
export function CityIntro() {
  const { city, chooseCity, theme, setThemeMode } = useLive();
  const [open, setOpen] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [idx, setIdx] = useState(() => indexOf(city.id));
  const [layers, setLayers] = useState(() => [{ id: ALPHA[indexOf(city.id)].id, k: 0 }]);
  const track = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const idxRef = useRef(idx);
  const layerKey = useRef(0);
  const frame = useRef(0);

  const scrollToIndex = useCallback((i: number, smooth: boolean) => {
    const el = track.current?.children[i] as HTMLElement | undefined;
    const t = track.current;
    if (!el || !t) return;
    t.scrollTo({ left: el.offsetLeft + el.offsetWidth / 2 - t.clientWidth / 2, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Scale and fade each city by its distance from the center; the nearest one drives the backdrop.
  const paint = useCallback(() => {
    frame.current = 0;
    const t = track.current;
    if (!t) return;
    const mid = t.scrollLeft + t.clientWidth / 2;
    let best = 0, bestD = Infinity;
    Array.from(t.children).forEach((node, i) => {
      const el = node as HTMLElement;
      const d = (el.offsetLeft + el.offsetWidth / 2 - mid) / Math.min(220, t.clientWidth * 0.5);
      const a = Math.min(Math.abs(d), 2.2);
      el.style.setProperty('--s', (1 - Math.min(a, 1.4) * 0.3).toFixed(3));
      el.style.setProperty('--o', Math.max(0, 1 - a * 0.45).toFixed(3));
      el.style.setProperty('--c', Math.max(0, 1 - a * 2.2).toFixed(3));
      if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
    });
    if (best !== idxRef.current) {
      idxRef.current = best;
      setIdx(best);
    }
  }, []);

  const onScroll = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(paint);
  }, [paint]);

  const cityRef = useRef(city.id);
  cityRef.current = city.id;

  // Hidden unless the boot script asked for it (fresh session on the home page);
  // the city button in the app reopens it on the current city.
  useEffect(() => {
    if (!document.documentElement.hasAttribute('data-intro')) setOpen(false);
    const reopen = () => {
      const i = indexOf(cityRef.current);
      touched.current = false;
      idxRef.current = i;
      setIdx(i);
      setLayers([{ id: ALPHA[i].id, k: ++layerKey.current }]);
      setLeaving(false);
      setOpen(true);
    };
    window.addEventListener(INTRO_OPEN, reopen);
    return () => window.removeEventListener(INTRO_OPEN, reopen);
  }, []);

  useEffect(() => {
    if (!open) return;
    scrollToIndex(idxRef.current, false);
    paint();
    const t = track.current;
    // A mouse wheel scrolls the carousel sideways on desktop.
    const wheel = (e: WheelEvent) => {
      if (!t || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      touched.current = true;
      t.scrollBy({ left: e.deltaY, behavior: 'auto' });
    };
    t?.addEventListener('wheel', wheel, { passive: false });
    const resize = () => { scrollToIndex(idxRef.current, false); paint(); };
    window.addEventListener('resize', resize);
    return () => {
      t?.removeEventListener('wheel', wheel);
      window.removeEventListener('resize', resize);
    };
  }, [open, paint, scrollToIndex]);

  // Saved or nearest city arrives after mount: start there unless they already scrolled.
  useEffect(() => {
    if (!open || touched.current) return;
    const i = indexOf(city.id);
    idxRef.current = i;
    setIdx(i);
    scrollToIndex(i, false);
    paint();
  }, [city.id, open, paint, scrollToIndex]);

  // Crossfade the skyline: keep the outgoing city for its fade, then drop it.
  useEffect(() => {
    const id = ALPHA[idx].id;
    setLayers((L) => (L[L.length - 1].id === id ? L : [...L.slice(-1), { id, k: ++layerKey.current }]));
    const done = setTimeout(() => setLayers((L) => L.slice(-1)), 700);
    return () => clearTimeout(done);
  }, [idx]);

  const enter = useCallback(
    (i: number) => {
      chooseCity(ALPHA[i].id);
      try {
        sessionStorage.setItem(INTRO_KEY, '1');
      } catch {
        /* shows again next visit */
      }
      window.scrollTo(0, 0);
      setLeaving(true);
      setTimeout(() => {
        document.documentElement.removeAttribute('data-intro');
        setOpen(false);
      }, 520);
    },
    [chooseCity],
  );

  const pick = (i: number) => {
    touched.current = true;
    if (i === idxRef.current) enter(i);
    else scrollToIndex(i, true);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    touched.current = true;
    const i = Math.min(ALPHA.length - 1, Math.max(0, idxRef.current + (e.key === 'ArrowRight' ? 1 : -1)));
    scrollToIndex(i, true);
    (track.current?.children[i] as HTMLElement | undefined)?.focus({ preventScroll: true });
  };

  if (!open) return null;
  const current = ALPHA[idx];

  return (
    <div className={`intro${leaving ? ' leaving' : ''}`} role="dialog" aria-modal="true" aria-label="Choose your city">
      <div className="intro-sky" aria-hidden="true">
        {layers.map((l, i) => (
          <div key={l.k} className={`intro-layer${i < layers.length - 1 ? ' out' : ''}`}>
            <Skyline city={ALPHA[indexOf(l.id)]} />
          </div>
        ))}
      </div>

      <div className="intro-mark" aria-hidden="true">v<b /><sup className="mark-c">© <span className="amh">AMH</span></sup></div>

      <button
        className="intro-theme"
        onClick={() => setThemeMode(theme === 'day' ? 'night' : 'day')}
        aria-label={theme === 'day' ? 'Switch to night theme' : 'Switch to day theme'}
        title={theme === 'day' ? 'Night theme' : 'Day theme'}
      >
        <Icon name={theme === 'day' ? 'moon' : 'sun'} />
      </button>

      <div className="intro-mid">
        <div className="intro-track" ref={track} onScroll={onScroll} onKeyDown={onKey} role="listbox" aria-label="Cities, A to Z" aria-activedescendant={`ci-${current.id}`}>
          {ALPHA.map((c, i) => (
            <button
              key={c.id}
              id={`ci-${c.id}`}
              role="option"
              aria-selected={i === idx}
              className="intro-city"
              onClick={() => pick(i)}
              tabIndex={i === idx ? 0 : -1}
            >
              <span className="nm">{c.name}</span>
              <span className="st">{c.state}</span>
            </button>
          ))}
        </div>
        <button className="intro-go" onClick={() => enter(idx)} aria-label={`Enter ${current.name}`}>
          Tap to enter
        </button>
      </div>
    </div>
  );
}
