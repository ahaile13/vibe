import Link from 'next/link';

/** The chrome VIBES wordmark. Black background blends away via mix-blend-mode: screen. */
export function Logo({ height = 80 }: { height?: number }) {
  return (
    <Link href="/" className="logo" aria-label="VIBES home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/wordmark.webp" alt="VIBES" width={Math.round(height * 3.04)} height={height} />
    </Link>
  );
}
