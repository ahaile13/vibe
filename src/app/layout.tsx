import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { LiveProvider } from '@/components/LiveProvider';
import { AppShell } from '@/components/AppShell';

const head = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-head' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });
const mono = Geist_Mono({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'VIBES · Where’s the vibe tonight?', template: '%s · VIBES' },
  description: 'Live, location-verified ratings of what’s popping in Dallas right now.',
  applicationName: 'VIBES',
  appleWebApp: { capable: true, title: 'VIBES', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#07060A',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${head.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <LiveProvider>
          <AppShell>{children}</AppShell>
        </LiveProvider>
      </body>
    </html>
  );
}
