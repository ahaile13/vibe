'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import { EventCard } from './EventCard';
import { Icon } from './Icon';
import type { EventRow } from '@/lib/types';

/**
 * Event cards as a fanned deck: the current card sits in front, its neighbours tilt out behind it.
 * Swipe or drag sideways (vertical scrolling still works), tap a side card to bring it forward,
 * or use the arrows and arrow keys.
 */
export function Deck({ list }: { list: EventRow[] }) {
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number; axis: 'x' | 'y' | null } | null>(null);
  const swallowClick = useRef(false);

  // Stay in range when the list changes (filters, search).
  useEffect(() => {
    setI((v) => Math.min(v, Math.max(0, list.length - 1)));
  }, [list.length]);

  const go = (n: number) => setI(Math.max(0, Math.min(list.length - 1, n)));
  const width = () => box.current?.querySelector<HTMLElement>('.deck-slot')?.offsetWidth ?? 320;

  function down(e: RPointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, axis: null };
    swallowClick.current = false;
  }
  function move(e: RPointerEvent) {
    const s = start.current;
    if (!s) return;
    const mx = e.clientX - s.x, my = e.clientY - s.y;
    if (!s.axis && Math.hypot(mx, my) > 8) s.axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
    if (s.axis !== 'x') return;
    swallowClick.current = true;
    setDragging(true);
    // Resist at the ends of the deck.
    const edge = (i === 0 && mx > 0) || (i === list.length - 1 && mx < 0);
    setDx(edge ? mx * 0.3 : mx);
  }
  function up() {
    const s = start.current;
    start.current = null;
    if (s?.axis === 'x') {
      const w = width();
      const steps = Math.abs(dx) > w * 0.22 ? Math.max(1, Math.round(Math.abs(dx) / w)) : 0;
      if (steps) go(i + (dx < 0 ? steps : -steps));
    }
    setDx(0);
    setDragging(false);
  }
  function key(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
  }

  const frac = dragging ? dx / width() : 0;

  return (
    <div className="deckwrap">
      <div
        ref={box}
        className={`deck${dragging ? ' dragging' : ''}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
        role="region"
        aria-roledescription="carousel"
        aria-label="Events"
      >
        {list.map((e, k) => {
          const off = k - i + frac;
          if (Math.abs(off) > 3) return null;
          const a = Math.abs(off);
          return (
            <div
              key={e.id}
              className={`deck-slot${k === i ? ' front' : ''}`}
              aria-hidden={k !== i}
              style={{
                transform: `translateX(${off * 46}%) translateY(${Math.min(a, 2) * 14}px) rotate(${off * 6}deg) scale(${1 - Math.min(a, 2) * 0.09})`,
                zIndex: 50 - Math.round(a * 10),
                opacity: a > 2.4 ? 0 : 1,
              }}
              onClickCapture={(ev) => {
                if (swallowClick.current) { ev.preventDefault(); ev.stopPropagation(); swallowClick.current = false; return; }
                if (k !== i) { ev.preventDefault(); ev.stopPropagation(); go(k); }
              }}
            >
              <EventCard e={e} />
            </div>
          );
        })}
      </div>
      <div className="deck-nav">
        <button className="iconbtn glass" aria-label="Previous event" disabled={i === 0} onClick={() => go(i - 1)}><Icon name="back" /></button>
        {list.length <= 12 ? (
          <div className="deck-dots" aria-hidden="true">
            {list.map((e, k) => <i key={e.id} className={k === i ? 'on' : ''} />)}
          </div>
        ) : (
          <span className="deck-count">{i + 1} / {list.length}</span>
        )}
        <button className="iconbtn glass" aria-label="Next event" disabled={i >= list.length - 1} onClick={() => go(i + 1)}><span style={{ display: 'inline-flex', transform: 'scaleX(-1)' }}><Icon name="back" /></span></button>
      </div>
      <p className="sr" aria-live="polite">{list[i] ? `${i + 1} of ${list.length}: ${list[i].name}` : ''}</p>
    </div>
  );
}
