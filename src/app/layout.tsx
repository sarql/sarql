import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Sarql — Digital Excellence & Engineering',
  description:
    'Sarql engineers clear, functional, and memorable digital experiences. From cinematic visual identity to enterprise web development.',
  keywords: ['Sarql', 'Web Development', 'Digital Agency', 'UI/UX', 'Digital Marketing'],
  icons: {
    icon: [
      { url: '/sarql-icon.png?v=5', type: 'image/png' },
      { url: '/favicon.ico?v=5' }
    ],
    shortcut: ['/sarql-icon.png?v=5'],
    apple: ['/apple-icon.png?v=5'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-waldenburg-fh-en font-waldenburg-en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/sarql-icon.png?v=5" />
        <link rel="icon" href="/favicon.ico?v=5" />
        <link rel="shortcut icon" href="/sarql-icon.png?v=5" />
        <link rel="apple-touch-icon" href="/apple-icon.png?v=5" />
        <link
          rel="preload"
          href="/fonts/KMR-Waldenburg-Buch-latin.1f7863d3c4317f3d.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/KMR-Waldenburg-Normal-latin.47fcefe5bf77b4e5.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/KMR-Waldenburg-Fett-latin.e6b0db8ee0a63897.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/e4af272ccee01ff0-s.p.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="site-frame">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
