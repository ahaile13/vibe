import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'vibes',
    short_name: 'vibes',
    description: 'Live, location-verified ratings of what’s popping right now.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0F11',
    theme_color: '#0B0F11',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
