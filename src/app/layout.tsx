import type { Metadata, Viewport } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import './globals.css';
import { LiveProvider } from '@/components/LiveProvider';
import { AppShell } from '@/components/AppShell';

// Variable font: weight and optical size are both available.
const head = Fraunces({ subsets: ['latin'], variable: '--font-head', axes: ['opsz'] });
const body = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' });

export const metadata: Metadata = {
  // Vercel provides VERCEL_PROJECT_PRODUCTION_URL automatically; no setup needed.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  ),
  title: { default: 'VIBES · Where’s the vibe tonight?', template: '%s · VIBES' },
  description: 'Live, location-verified ratings of what’s popping in Dallas right now.',
  applicationName: 'VIBES',
  appleWebApp: { capable: true, title: 'VIBES', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#0B0F11',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${head.variable} ${body.variable}`}>
      <body>
        <LiveProvider>
          <AppShell>{children}</AppShell>
        </LiveProvider>
      </body>
    </html>
  );
}
