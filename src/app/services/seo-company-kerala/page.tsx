import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SEO Company in Kerala — Sarql',
  description: 'Boost your rankings with the best SEO company in Kerala. Sarql provides expert SEO services to help your business dominate search results.',
};

export default function Page() {
  return (
    <div style={{ paddingTop: '3.5rem', paddingBottom: '6rem' }}>
      <div className="tw-container" style={{ maxWidth: '52rem' }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 400, letterSpacing: '0', color: '#737373', marginBottom: '0.5rem' }}>
          SEO Services Kerala
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 3vw + 0.5rem, 2.75rem)', lineHeight: 1.1, fontWeight: 500, letterSpacing: '-0.03em', color: '#000', marginBottom: '0.875rem' }}>
          SEO Company in Kerala
        </h1>
        <p style={{ fontSize: '1.0625rem', lineHeight: 1.55, color: 'var(--text-gray-600)', marginBottom: '2.5rem' }}>
          Boost your rankings with the best SEO company in Kerala. Sarql provides expert SEO services to help your business dominate search results.
        </p>

        <div style={{ background: 'var(--bg-cream)', padding: '2.25rem', borderRadius: '1.25rem', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.1875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#000' }}>
            Why Businesses in Kerala Trust Sarql
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: '1.65', color: 'var(--text-gray-600)', marginBottom: '1.75rem' }}>
            Search dominance is not an afterthought; it is engineered directly into every pixel and code snippet. We implement technical SEO, semantic schema markup, localized keyword targeting, and authority link structures to rank your brand at the summit.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Technical SEO audits & Core Web Vitals perfection</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Local Kerala & Global search intent optimization</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Semantic Schema.org structured data deployment</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Keyword strategy & on-page conversion tuning</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Transparent ranking analytics and monthly performance reports</span></li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/contact" className="btn-signup">
            Schedule Discovery Consultation
          </Link>
          <Link href="/packages" className="btn-sales">
            View Packages & Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
