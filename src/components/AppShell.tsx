'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { useLive } from './LiveProvider';
import { Layers } from './Layers';
import { Logo } from './Logo';

const SIDE: [string, string, IconName][] = [
  ['/', 'Discover', 'compass'],
  ['/?near=1', 'Near Me', 'near'],
  ['/trending', 'Trending', 'trend'],
  ['/map', 'Map', 'map'],
  ['/profile#saved', 'Saved', 'bookmark'],
  ['/profile', 'Profile', 'user'],
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { openCapture } = useLive();
  const current = (href: string) => {
    const base = href.split(/[?#]/)[0];
    if (href.includes('?') || href.includes('#')) return false;
    return base === '/' ? path === '/' : path.startsWith(base);
  };
  const isAuth = path.startsWith('/login');
  return (
    <>
      {!isAuth && (
        <nav className="side" aria-label="Main">
          <Logo />
          {SIDE.map(([href, label, icon]) => (
            <Link key={href} href={href} aria-current={current(href) ? 'page' : undefined}>
              <Icon name={icon} />
              {label}
            </Link>
          ))}
          <button className="cap" onClick={() => openCapture()}>
            <Icon name="plus" />
            Capture the vibe
          </button>
          <div className="foot">Only people who are there can rate or post. Your exact location is never shown.</div>
        </nav>
      )}
      <main className="page">{children}</main>
      {!isAuth && (
        <nav className="bnav glass" aria-label="Main">
          <Link href="/" aria-current={current('/') ? 'page' : undefined}><Icon name="compass" /><span>Discover</span></Link>
          <Link href="/map" aria-current={current('/map') ? 'page' : undefined}><Icon name="map" /><span>Map</span></Link>
          <button className="plus" onClick={() => openCapture()} aria-label="Capture the vibe"><Icon name="plus" /></button>
          <Link href="/trending" aria-current={current('/trending') ? 'page' : undefined}><Icon name="trend" /><span>Trending</span></Link>
          <Link href="/profile" aria-current={current('/profile') ? 'page' : undefined}><Icon name="user" /><span>Profile</span></Link>
        </nav>
      )}
      <Layers />
    </>
  );
}

export function SetupNotice() {
  const { status, loadError } = useLive();
  if (status === 'unconfigured')
    return (
      <div className="notice" role="status">
        <Icon name="flag" />
        <span>
          Supabase isn’t connected yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in
          Vercel → Settings → Environment Variables, then redeploy. The README has the full steps.
        </span>
      </div>
    );
  if (status === 'error')
    return (
      <div className="notice" role="alert">
        <Icon name="flag" />
        <span>
          {loadError && /does not exist|schema cache|relation/i.test(loadError)
            ? 'The database is connected but empty. Run supabase/migrations/20261012000000_init.sql, then supabase/seed.sql, in the Supabase SQL Editor.'
            : 'Couldn’t load events. Check your connection.'}
          {loadError && <><br /><code>{loadError}</code></>}
        </span>
      </div>
    );
  return null;
}
