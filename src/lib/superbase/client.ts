import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(URL_ && KEY);

let client: SupabaseClient | null | undefined;

/** Browser-only. Returns null until env vars are set, so the app can show setup help. */
export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (client !== undefined) return client;
  client = URL_ && KEY ? createBrowserClient(URL_, KEY) : null;
  return client;
}

export const mediaUrl = (path: string | null | undefined) =>
  path && URL_ ? `${URL_}/storage/v1/object/public/media/${path}` : null;
