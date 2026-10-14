import Link from 'next/link';

/** The vibes wordmark. The dot on the i is the live light. */
export function Wordmark({ size = 34 }: { size?: number }) {
  return (
    <span className="wm" style={{ fontSize: size }} aria-hidden="true">
      v<span className="wm-i">ı<b /></span>bes
    </span>
  );
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <Link href="/" className="logo" aria-label="vibes home">
      <Wordmark size={size} />
    </Link>
  );
}
