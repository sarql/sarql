import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Web Development Company in Kerala — Sarql',
  description: 'Looking for the best web development company in Kerala? Sarql delivers premium, high-performance websites and custom web applications for businesses.',
};

export default function Page() {
  return (
    <div style={{ paddingTop: '3.5rem', paddingBottom: '6rem' }}>
      <div className="tw-container" style={{ maxWidth: '52rem' }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 400, letterSpacing: '0', color: '#737373', marginBottom: '0.5rem' }}>
          Web Development Kerala
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 3vw + 0.5rem, 2.75rem)', lineHeight: 1.1, fontWeight: 500, letterSpacing: '-0.03em', color: '#000', marginBottom: '0.875rem' }}>
          Web Development Company in Kerala
        </h1>
        <p style={{ fontSize: '1.0625rem', lineHeight: 1.55, color: 'var(--text-gray-600)', marginBottom: '2.5rem' }}>
          Looking for the best web development company in Kerala? Sarql delivers premium, high-performance websites and custom web applications for businesses.
        </p>

        <div style={{ background: 'var(--bg-cream)', padding: '2.25rem', borderRadius: '1.25rem', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.1875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#000' }}>
            Why Businesses in Kerala Trust Sarql
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: '1.65', color: 'var(--text-gray-600)', marginBottom: '1.75rem' }}>
            We engineer digital platforms using cutting-edge technologies including Next.js, React, Node, and Supabase. Every website is built from the ground up for instantaneous page loads, full mobile responsiveness, and high conversion rates.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Custom Next.js & React architectures</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Enterprise Lighthouse 100% performance optimization</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Mobile-first responsive design for 360px–1920px</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Full SEO foundation ready to dominate Google search</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Seamless WhatsApp and payment gateway integration</span></li>
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
