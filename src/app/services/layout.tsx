import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services & Capabilities',
  description:
    'Comprehensive digital agency services: Web Engineering, UI/UX Design, Motion Graphics, Brand Identity, and Digital Growth Strategies.',
  alternates: {
    canonical: 'https://sarql.com/services/',
  },
  openGraph: {
    title: 'Services & Capabilities | Sarql',
    description:
      'Comprehensive digital agency services: Web Engineering, UI/UX Design, Motion Graphics, Brand Identity, and Digital Growth Strategies.',
    url: 'https://sarql.com/services/',
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
