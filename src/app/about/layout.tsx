import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us & Leadership',
  description:
    'Learn about Sarql, our engineering standards, our founders, and our mission to build digital experiences that dominate.',
  alternates: {
    canonical: 'https://sarql.com/about/',
  },
  openGraph: {
    title: 'About Us & Leadership | Sarql',
    description:
      'Learn about Sarql, our engineering standards, our founders, and our mission.',
    url: 'https://sarql.com/about/',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
