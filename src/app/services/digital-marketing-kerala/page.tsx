import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Digital Marketing Agency in Kerala — Sarql',
  description: 'Scale your business with the top digital marketing agency in Kerala. Sarql specializes in social media, PPC, and data-driven marketing strategies.',
};

export default function Page() {
  return (
    <div style={{ paddingTop: '3.5rem', paddingBottom: '6rem' }}>
      <div className="tw-container" style={{ maxWidth: '52rem' }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 400, letterSpacing: '0', color: '#737373', marginBottom: '0.5rem' }}>
          Digital Marketing Kerala
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 3vw + 0.5rem, 2.75rem)', lineHeight: 1.1, fontWeight: 500, letterSpacing: '-0.03em', color: '#000', marginBottom: '0.875rem' }}>
          Digital Marketing Agency in Kerala
        </h1>
        <p style={{ fontSize: '1.0625rem', lineHeight: 1.55, color: 'var(--text-gray-600)', marginBottom: '2.5rem' }}>
          Scale your business with the top digital marketing agency in Kerala. Sarql specializes in social media, PPC, and data-driven marketing strategies.
        </p>

        <div style={{ background: 'var(--bg-cream)', padding: '2.25rem', borderRadius: '1.25rem', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.1875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#000' }}>
            Why Businesses in Kerala Trust Sarql
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: '1.65', color: 'var(--text-gray-600)', marginBottom: '1.75rem' }}>
            We transform attention into revenue through data-backed marketing campaigns, precision audience targeting, engaging reels, and high-ROI sponsored advertising across Meta and Google.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Full Social Media Account management & content calendars</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Sponsored Ads optimization (Meta Ads & Google Ads)</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Short-form viral reel scripting & dynamic editing</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Direct conversion funnels connecting traffic to WhatsApp and CRM</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: '#000' }}><span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span><span>Monthly executive growth reports with ROI metrics</span></li>
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
