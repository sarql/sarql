import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us & Start a Project',
  description:
    'Get in touch with the Sarql team. Request a quotation, discuss project requirements, or connect with our engineering team in Kerala.',
  alternates: {
    canonical: 'https://sarql.com/contact/',
  },
  openGraph: {
    title: 'Contact Us & Start a Project | Sarql',
    description:
      'Get in touch with the Sarql team. Request a quotation or discuss project requirements.',
    url: 'https://sarql.com/contact/',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
