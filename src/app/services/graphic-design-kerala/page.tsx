import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Graphic Design Company in Kerala — Sarql',
  description: 'Sarql is the leading graphic design company in Kerala, specializing in premium branding, logo design, and visual identity for modern brands.',
};

export default function Page() {
  return (
    <div style={{ paddingTop: '3.5rem', paddingBottom: '6rem' }}>
      <div className="tw-container" style={{ maxWidth: '52rem' }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 400, letterSpacing: '0', color: '#737373', marginBottom: '0.5rem' }}>
          Graphic Design Kerala
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 3vw + 0.5rem, 2.75rem)', lineHeight: 1.1, fontWeight: 500, letterSpacing: '-0.03em', color: '#000', marginBottom: '0.875rem' }}>
          Graphic Design Company in Kerala
        </h1>
        <p style={{ fontSize: '1.0625rem', lineHeight: 1.55, color: 'var(--text-gray-600)', marginBottom: '2.5rem' }}>
          Sarql is the leading graphic design company in Kerala, specializing in premium branding, logo design, and visual identity for modern brands.
        </p>

        <div style={{ background: 'var(--bg-cream)', padding: '2.25rem', borderRadius: '1.25rem', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.1875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#000' }}>
            Why Businesses in Kerala Trust Sarql
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: '1.65', color: 'var(--text-gray-600)', marginBottom: '1.75rem' }}>
            From cohesive corporate visual identities to high-converting social media creatives and packaging design, our creative directors blend artistic finesse with commercial psychology.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Complete Brand Guidelines & Logo Identity Suites</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Social Media Poster bundles & Story formats</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>High-end Product Packaging & Box Designing</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Corporate Visiting Cards, Letterheads & Digital Brochures</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Vector source files provided with unlimited revision support</span></li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/contact/" className="btn-signup">
            Start Your Project
          </Link>
          <Link href="/packages/" className="btn-sales">
            View Packages & Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
