import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import EnquiryPopup from '@/components/ui/EnquiryPopup';
import FloatingContactWidget from '@/components/ui/FloatingContactWidget';

export const metadata: Metadata = {
  metadataBase: new URL('https://sarql.com'),
  title: {
    default: 'Sarql — Digital Engineering & Visual Identity Agency',
    template: '%s | Sarql',
  },
  description:
    'Sarql is a premier digital agency in Kerala & global tech partner specializing in high-performance web development, custom UI/UX design, branding, and scalable digital solutions.',
  keywords: [
    'Sarql',
    'Sarql Agency',
    'Web Development Kerala',
    'Website Design Kochi',
    'Digital Agency Kerala',
    'UI UX Design Agency',
    'Brand Identity Kerala',
    'Next.js Developers',
    'Full Stack Web Development',
    'Website Packages Kerala',
    'Custom Software Development',
    'Vengara Malappuram',
    'Infopark Kochi',
  ],
  authors: [{ name: 'Sarql Engineering Team', url: 'https://sarql.com' }],
  creator: 'Sarql',
  publisher: 'Sarql',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://sarql.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://sarql.com',
    siteName: 'Sarql',
    title: 'Sarql — Digital Engineering & Visual Identity Agency',
    description:
      'Sarql engineers clear, functional, and memorable digital experiences. From cinematic visual identity to enterprise web development.',
    images: [
      {
        url: '/sarql-og.png',
        width: 1200,
        height: 630,
        alt: 'Sarql — Digital Engineering & Visual Identity Agency',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sarql — Digital Engineering & Visual Identity Agency',
    description:
      'Sarql engineers clear, functional, and memorable digital experiences. From cinematic visual identity to enterprise web development.',
    images: ['/sarql-og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/sarql-icon.png?v=5', type: 'image/png' },
      { url: '/favicon.ico?v=5' },
    ],
    shortcut: ['/sarql-icon.png?v=5'],
    apple: ['/apple-icon.png?v=5'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['ProfessionalService', 'Organization'],
      '@id': 'https://sarql.com/#organization',
      name: 'Sarql',
      url: 'https://sarql.com',
      logo: 'https://sarql.com/sarql.png',
      image: 'https://sarql.com/sarql-og.png',
      description:
        'Premier digital engineering and visual identity agency based in Kerala, India.',
      telephone: '+917558811574',
      email: 'team.sarql@gmail.com',
      priceRange: '₹₹',
      address: [
        {
          '@type': 'PostalAddress',
          streetAddress: 'Vengara',
          addressLocality: 'Malappuram',
          addressRegion: 'Kerala',
          postalCode: '676304',
          addressCountry: 'IN',
        },
        {
          '@type': 'PostalAddress',
          streetAddress: 'Infopark Phase II',
          addressLocality: 'Kochi',
          addressRegion: 'Kerala',
          postalCode: '682042',
          addressCountry: 'IN',
        },
      ],
      sameAs: [
        'https://instagram.com/sarql.agency',
        'https://wa.me/917558811574',
      ],
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
        opens: '09:00',
        closes: '19:00',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://sarql.com/#website',
      url: 'https://sarql.com',
      name: 'Sarql',
      publisher: {
        '@id': 'https://sarql.com/#organization',
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="site-frame">
        <Header />
        <main>{children}</main>
        <Footer />
        <EnquiryPopup />
        <FloatingContactWidget />
      </body>
    </html>
  );
}
