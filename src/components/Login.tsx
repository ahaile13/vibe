'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';
import { SetupNotice } from './AppShell';
import { Logo } from './Logo';

type Mode = 'signin' | 'signup';

function friendly(msg: string) {
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password. New here? Switch to Create account.';
  if (/already registered|already exists/i.test(msg)) return 'That email already has an account. Switch to Sign in.';
  if (/email not confirmed/i.test(msg)) return 'This account is waiting on email confirmation. In Supabase, turn off “Confirm email” (see README), or confirm the user under Authentication → Users.';
  if (/password should be at least|weak password/i.test(msg)) return 'Use a password with at least 6 characters.';
  if (/email rate limit/i.test(msg)) return 'Supabase’s free email limit (2 an hour) was hit. In Supabase, turn off Authentication → Sign In / Providers → Email → “Confirm email”, then try again. No email needed after that.';
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts. Wait a few minutes and try again.';
  if (/not authorized/i.test(msg)) return 'Supabase’s free email only sends to your Supabase team. Use a password instead.';
  return msg;
}

export function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get('next') ?? '/';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(
    params.get('error') ? 'That sign-in link expired or was opened in a different browser. Sign in with your password instead.' : null,
  );

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setErr(null);
    setInfo(null);
    setBusy(true);
    const creds = { email: email.trim(), password };
    if (mode === 'signin') {
      const { error } = await sb.auth.signInWithPassword(creds);
      setBusy(false);
      if (error) return setErr(friendly(error.message));
      router.push(next);
      return;
    }
    const { data, error } = await sb.auth.signUp({ ...creds, options: { emailRedirectTo: callback() } });
    setBusy(false);
    if (error) return setErr(friendly(error.message));
    if (data.session) {
      router.push(next);
      return;
    }
    // Email confirmation is still on in Supabase, so no session yet.
    setInfo('Account created, but Supabase wants email confirmation first. Turn off “Confirm email” in Supabase (Authentication → Sign In / Providers → Email), then sign in, or open the confirmation email if it arrives.');
    setMode('signin');
  }

  async function sendLink() {
    const sb = getSupabase();
    if (!sb) return;
    if (!email.trim()) return setErr('Type your email first.');
    setErr(null);
    setBusy(true);
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: callback() } });
    setBusy(false);
    if (error) return setErr(friendly(error.message));
    setInfo(`Sign-in link sent to ${email.trim()}. Open it on this device.`);
  }

  async function oauth(provider: 'google' | 'apple') {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: callback() } });
    if (error)
      setErr(/not enabled|unsupported provider/i.test(error.message) ? `${provider === 'google' ? 'Google' : 'Apple'} sign-in isn’t set up yet. Use email and password for now.` : error.message);
  }

  return (
    <div className="auth">
      <SetupNotice />
      <Logo height={105} />
      <h1>Know the vibe.</h1>
      <p>Browse freely. Sign in to rate, comment and post from where you are.</p>

      <div className="seg glass" role="group" aria-label="Sign in or create account" style={{ marginBottom: 14 }}>
        <button type="button" aria-pressed={mode === 'signin'} onClick={() => { setMode('signin'); setErr(null); }}>Sign in</button>
        <button type="button" aria-pressed={mode === 'signup'} onClick={() => { setMode('signup'); setErr(null); }}>Create account</button>
      </div>

      <form onSubmit={submit}>
        <label className="sr" htmlFor="em">Email</label>
        <input id="em" className="in" type="email" required autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="sr" htmlFor="pw">Password</label>
        <input
          id="pw"
          className="in"
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          placeholder={mode === 'signin' ? 'Password' : 'Choose a password (6+ characters)'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn hot wide" disabled={busy}>
          {busy ? <span className="spin sm" /> : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {err && <p role="alert" style={{ color: 'var(--no)', marginTop: 14 }}>{err}</p>}
      {info && <p role="status" style={{ color: 'var(--brand-hi)', marginTop: 14 }}>{info}</p>}

      <div className="or">or</div>
      <div style={{ display: 'grid', gap: 10 }}>
        <button className="btn gl wide" onClick={() => oauth('apple')}>Continue with Apple</button>
        <button className="btn gl wide" onClick={() => oauth('google')}>Continue with Google</button>
      </div>
      <button className="linkb" style={{ display: 'block', margin: '10px auto 0' }} onClick={sendLink} disabled={busy}>
        Email me a sign-in link instead
      </button>

      <p className="foot-note" style={{ marginTop: 20 }}>We never show your location to anyone. Ratings are anonymous; comments and posts show your username.</p>
    </div>
  );
}
