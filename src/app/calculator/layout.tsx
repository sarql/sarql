import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Custom Package Builder & Price Calculator',
  description:
    'Build and estimate your custom project scope with real-time pricing, multi-category bundle discounts, and instant quotation generator.',
  alternates: {
    canonical: 'https://sarql.com/calculator/',
  },
  openGraph: {
    title: 'Custom Package Builder | Sarql',
    description:
      'Configure your custom website and design package with real-time transparent pricing.',
    url: 'https://sarql.com/calculator/',
  },
};

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
