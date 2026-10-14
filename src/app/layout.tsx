import type { Metadata, Viewport } from 'next';
import { Quicksand } from 'next/font/google';
import './globals.css';
import { LiveProvider } from '@/components/LiveProvider';
import { AppShell } from '@/components/AppShell';

// One rounded geometric family for everything (variable weight 300–700).
const quicksand = Quicksand({ subsets: ['latin'], variable: '--font-q' });

export const metadata: Metadata = {
  // Vercel provides VERCEL_PROJECT_PRODUCTION_URL automatically; no setup needed.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  ),
  title: { default: 'vibes', template: '%s | vibes' },
  description: 'Live, location-verified ratings of what’s popping in Dallas right now.',
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
    <html lang="en" className={quicksand.variable}>
      <body>
        <LiveProvider>
          <AppShell>{children}</AppShell>
        </LiveProvider>
      </body>
    </html>
  );
}
