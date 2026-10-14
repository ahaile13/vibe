import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Daily (vercel.json): creates today's and tomorrow's events for demo venues.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'missing env' }, { status: 500 });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  const tomorrow = d.toISOString().slice(0, 10);

  let created = 0;
  for (const day of [today, tomorrow]) {
    const { data, error } = await supabase.rpc('ensure_demo_events', { p_day: day });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    created += Number(data ?? 0);
  }
  return NextResponse.json({ created, days: [today, tomorrow] });
}
