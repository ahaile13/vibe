import Link from 'next/link';

/**
 * Text in the vibes logo style: the first i loses its dot and gets the
 * champagne live light instead. Omit size to inherit the surrounding text.
 */
export function Wordmark({ size, text = 'vibes' }: { size?: number; text?: string }) {
  const i = text.indexOf('i');
  return (
    <>
      <span className="wm" style={size ? { fontSize: size } : undefined} aria-hidden="true">
        {i < 0 ? text : (
          <>
            {text.slice(0, i)}
            <span className="wm-i">ı<b /></span>
            {text.slice(i + 1)}
          </>
        )}
      </span>
      <span className="sr">{text}</span>
    </>
  );
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <Link href="/" className="logo" aria-label="vibes home">
      <Wordmark size={size} />
    </Link>
  );
}

/** The app icon mark (v plus live light), sized by its container. */
export function Mark() {
  return (
    <span className="mark" aria-hidden="true">
      v<b />
    </span>
  );
}
