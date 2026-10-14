'use client';
import { useEffect, useRef } from 'react';
import { Flyer } from './Flyer';
import { mediaUrl } from '@/lib/supabase/client';
import type { EventRow, PostRow } from '@/lib/types';

/** Muted, looping video that only plays while on screen. */
export function AutoVideo({ src, poster, controls = false }: { src: string; poster?: string | null; controls?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || controls) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [controls]);
  return (
    <video
      ref={ref}
      src={src}
      poster={poster ?? undefined}
      muted={!controls}
      loop
      playsInline
      controls={controls}
      autoPlay={controls}
      preload="metadata"
    />
  );
}

export function PostMedia({ post, controls = false }: { post: PostRow; controls?: boolean }) {
  const src = mediaUrl(post.media_path);
  const thumb = mediaUrl(post.thumb_path);
  if (!src) return <div className="art" />;
  return (
    <div className="art">
      {post.kind === 'video' ? <AutoVideo src={src} poster={thumb} controls={controls} /> : <img src={src} alt={post.caption ?? ''} loading="lazy" />}
    </div>
  );
}

/** Latest attendee upload, otherwise generated art. */
export function Cover({ event, posts }: { event: EventRow; posts?: PostRow[] }) {
  const latest = posts?.[0];
  if (latest) return <PostMedia post={latest} />;
  return <Flyer event={event} />;
}
