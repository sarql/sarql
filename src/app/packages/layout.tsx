import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Packages & Pricing',
  description:
    'Transparent milestone-based packages for web development, UI/UX design, and graphic design bundles tailored for Kerala businesses and global brands.',
  alternates: {
    canonical: 'https://sarql.com/packages/',
  },
  openGraph: {
    title: 'Packages & Pricing | Sarql',
    description:
      'Transparent milestone-based packages for web development, UI/UX design, and graphic design bundles.',
    url: 'https://sarql.com/packages/',
  },
};

export default function PackagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
