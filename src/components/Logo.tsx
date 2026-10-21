import Link from 'next/link';
import { Fragment } from 'react';

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
        {text === 'vibes' && <sup className="wm-c">© <span className="amh">AMH</span></sup>}
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

/**
 * Title text in the logo style: every lowercase i loses its dot and gets a
 * breathing champagne light. The dots breathe slightly out of step.
 */
export function Dotted({ text }: { text: string }) {
  if (!text.includes('i')) return <>{text}</>;
  const parts = text.split('i');
  return (
    <>
      <span className="dotted" aria-hidden="true">
        {parts.map((p, k) => (
          <Fragment key={k}>
            {p}
            {k < parts.length - 1 && <span className="wm-i">ı<b style={{ animationDelay: `${(k * 0.45) % 3.2}s` }} /></span>}
          </Fragment>
        ))}
      </span>
      <span className="sr">{text}</span>
    </>
  );
}
