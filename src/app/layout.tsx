import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Quicksand } from 'next/font/google';
import './globals.css';
import { LiveProvider } from '@/components/LiveProvider';
import { AppShell } from '@/components/AppShell';
import { THEME_BOOT } from '@/lib/theme';
import { INTRO_BOOT } from '@/lib/intro';

// One rounded geometric family for everything (variable weight 300–700).
const quicksand = Quicksand({ subsets: ['latin'], variable: '--font-q' });
// Condensed display face for event flyers.
const poster = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-poster' });

export const metadata: Metadata = {
  // Vercel provides VERCEL_PROJECT_PRODUCTION_URL automatically; no setup needed.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  ),
  title: { default: 'vibes', template: '%s | vibes' },
  description: 'Live, location-verified ratings of what’s popping in your city right now.',
  applicationName: 'vibes',
  appleWebApp: { capable: true, title: 'vibes', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#0B0F11',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${quicksand.variable} ${poster.variable}`} data-theme="night" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT + INTRO_BOOT }} />
      </head>
      <body>
        <LiveProvider>
          <AppShell>{children}</AppShell>
        </LiveProvider>
      </body>
    </html>
  );
}
