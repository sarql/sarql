import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio & Client Work',
  description:
    'Explore curated web applications, poster designs, brand identities, and production systems crafted by Sarql.',
  alternates: {
    canonical: 'https://sarql.com/portfolio/',
  },
  openGraph: {
    title: 'Portfolio & Client Work | Sarql',
    description:
      'Explore curated web applications, poster designs, brand identities, and production systems crafted by Sarql.',
    url: 'https://sarql.com/portfolio/',
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
