'use client';

import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';
import { SetupNotice } from './AppShell';
import { Logo } from './Logo';

export function Login() {
  const params = useSearchParams();
  const rawNext = params.get('next') ?? '/';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [err, setErr] = useState<string | null>(params.get('error') ? 'That sign-in link expired or was opened in a different browser. Request a new one.' : null);

  const site = () => window.location.origin;
  const callback = () => `${site()}/auth/callback?next=${encodeURIComponent(next)}`;

  async function sendLink(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setErr(null);
    setState('sending');
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: callback() } });
    if (error) {
      setState('idle');
      setErr(/rate/i.test(error.message) ? 'Too many tries. Wait a minute, then request another link.' : error.message);
    } else setState('sent');
  }

  async function oauth(provider: 'google' | 'apple') {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: callback() } });
    if (error) setErr(/not enabled|unsupported provider/i.test(error.message) ? `${provider === 'google' ? 'Google' : 'Apple'} sign-in isn’t set up yet. Use email for now.` : error.message);
  }

  return (
    <div className="auth">
      <SetupNotice />
      <Logo height={105} />
      {state === 'sent' ? (
        <>
          <h1>Check your email</h1>
          <p>We sent a sign-in link to <b style={{ color: '#fff' }}>{email}</b>. Open it on this device to finish.</p>
          <button className="linkb" style={{ paddingLeft: 0 }} onClick={() => setState('idle')}>Use a different email</button>
        </>
      ) : (
        <>
          <h1>Know the vibe.</h1>
          <p>Browse freely. Sign in to rate, comment and post from where you are.</p>
          <div style={{ display: 'grid', gap: 10 }}>
            <button className="btn pri wide" onClick={() => oauth('apple')}>Continue with Apple</button>
            <button className="btn gl wide" onClick={() => oauth('google')}>Continue with Google</button>
          </div>
          <div className="or">or</div>
          <form onSubmit={sendLink}>
            <label className="sr" htmlFor="em">Email</label>
            <input id="em" className="in" type="email" required autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn hot wide" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}</button>
          </form>
        </>
      )}
      {err && <p role="alert" style={{ color: 'var(--no)', marginTop: 14 }}>{err}</p>}
      <p className="foot-note" style={{ marginTop: 24 }}>We never show your location to anyone. Ratings are anonymous; comments and posts show your username.</p>
    </div>
  );
}
