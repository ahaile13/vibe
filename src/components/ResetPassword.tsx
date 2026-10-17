'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';
import { useLive } from './LiveProvider';
import { Dotted, Logo } from './Logo';

/** Where the reset-password email lands (signed in by the link). Also reachable from Profile. */
export function ResetPassword() {
  const router = useRouter();
  const { user, authReady } = useLive();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return setErr('Use at least 6 characters.');
    if (pw !== pw2) return setErr('Those passwords don’t match.');
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setErr(null);
    const { error } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(/same/i.test(error.message) ? 'That’s already your password. Pick a new one.' : error.message);
    router.push('/profile?pw=1');
  }

  return (
    <div className="auth">
      <Logo size={52} />
      <h1><Dotted text="New password" /></h1>
      {!authReady ? (
        <span className="spin" />
      ) : !user ? (
        <>
          <p>This reset link expired or was opened in a different browser. Request a new one from the sign-in page and open it on this device.</p>
          <Link className="btn hot wide" href="/login">Back to sign in</Link>
        </>
      ) : (
        <form onSubmit={submit}>
          <p>Choose a new password for {user.email}.</p>
          <label className="sr" htmlFor="npw">New password</label>
          <input id="npw" className="in" type="password" required minLength={6} autoComplete="new-password" placeholder="New password (6+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} />
          <label className="sr" htmlFor="npw2">Confirm new password</label>
          <input id="npw2" className="in" type="password" required minLength={6} autoComplete="new-password" placeholder="Type it again" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          <button className="btn hot wide" disabled={busy}>{busy ? <span className="spin sm" /> : 'Save new password'}</button>
          {err && <p role="alert" style={{ color: 'var(--no)', marginTop: 14 }}>{err}</p>}
        </form>
      )}
    </div>
  );
}
