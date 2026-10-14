import type { Metadata } from 'next';
import { EventDetail } from '@/components/EventDetail';
import { getServerSupabase } from '@/lib/supabase/server';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const sb = await getServerSupabase();
    if (!sb) return { title: 'Event' };
    const { data } = await sb.rpc('get_event', { p_id: id });
    const e = data as { name?: string; area?: string | null } | null;
    if (!e?.name) return { title: 'Event' };
    return {
      title: e.name,
      description: `Live vibe ratings for ${e.name}${e.area ? ` in ${e.area}` : ''}. Is it popping, mid or dead right now?`,
    };
  } catch {
    return { title: 'Event' };
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <EventDetail id={id} />;
}
