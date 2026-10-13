import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="empty" style={{ marginTop: 40 }}>
      <h3>Nothing here.</h3>
      <p>That page doesn’t exist.</p>
      <Link className="btn pri" href="/">Back to Discover</Link>
    </div>
  );
}
