import type { Metadata, Viewport } from 'next';
import { DM_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const metadataBase = new URL(productionHost ? `https://${productionHost}` : 'http://localhost:3001');

export const metadata: Metadata = {
  metadataBase,
  title: 'SYNC / 7 — Music Supervision Deal Sprint',
  description: 'Learn to clear and negotiate music deals in seven bite-size daily sessions.',
  openGraph: {
    title: 'SYNC / 7',
    description: 'Music Supervision Deal Sprint',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'SYNC / 7 — Music Supervision Deal Sprint' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SYNC / 7',
    description: 'Music Supervision Deal Sprint',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f4efe3',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased`}>{children}</body>
    </html>
  );
}
