import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './Packages.module.css';

export const metadata: Metadata = {
  title: 'Pricing & Packages — Sarql | Web Development & Digital Growth',
  description:
    'Transparent pricing for websites, graphic design, video production and digital marketing packages by Sarql in Kerala.',
};

const WEB_PACKAGES = [
  {
    name: 'Basic',
    price: '₹4,999',
    ideal: 'Small businesses starting online',
    delivery: '2–3 Days',
    features: [
      'One Page Website',
      'Mobile Responsive',
      'Basic Design',
      'Contact Button',
      'Clean Codebase',
    ],
  },
  {
    name: 'Standard',
    price: '₹14,999',
    ideal: 'Modern growing businesses',
    delivery: '5–7 Days',
    featured: true,
    features: [
      '4–6 Pages Website',
      'Modern UI/UX Design',
      'WhatsApp Integration',
      'Basic SEO Setup',
      'Fast Loading Speed',
      'Contact Forms',
    ],
  },
  {
    name: 'Premium',
    price: '₹24,999',
    ideal: 'Custom portals and established brands',
    delivery: 'Custom Timeline',
    features: [
      'Custom Website Architecture',
      'Unlimited Pages Capability',
      'Advanced Custom Features',
      'Full SEO Optimization',
      'Priority 24/7 Support',
      'Interactive Micro-animations',
    ],
  },
];

const GRAPHIC_BUNDLES = [
  {
    name: 'Standard Package',
    price: '₹6,999',
    value: 'Value: ₹12,000+',
    ideal: 'Consistent brand growth',
    features: [
      '15 Premium Social Media Posters',
      '15 Story Resizes (Matching Designs)',
      '1 Visiting Card Concept',
      '1 Letterhead Concept',
      '2 Page Digital Brochure',
      '3 Status Updates',
    ],
  },
  {
    name: 'Premium Package',
    price: '₹11,999',
    value: 'Value: ₹25,000+',
    ideal: 'Complete elite brand identity',
    featured: true,
    features: [
      '30 Premium Social Media Posters',
      '30 Story Resizes',
      '3 Visiting Card Concepts',
      'Premium Logo Identity',
      'Source Files (AI / PSD)',
      'Packet / Box Design (1 Concept)',
      'Unlimited Revisions',
    ],
  },
];

const GRAPHIC_RATES = [
  { item: 'Social Media Poster (Single)', rate: '₹350' },
  { item: 'Social Media Posters (Bulk)', rate: '₹200–250' },
  { item: 'Story Resize', rate: '₹50' },
  { item: 'Visiting Card / Envelope', rate: '₹200–250' },
  { item: 'Letterhead Design', rate: '₹150–200' },
  { item: 'Brochures (Per Page)', rate: '₹250' },
  { item: 'Flex / Banner Design', rate: '₹400–500' },
  { item: 'Packet & Box Designing', rate: '₹600–800' },
  { item: 'Logo Design', rate: '₹2,000–3,000' },
];

const VIDEO_RATES = [
  { item: '5–10s Animation', rate: '₹350' },
  { item: '30s Animation', rate: '₹800' },
  { item: '30s Video Editing (Footage Provided)', rate: '₹500' },
  { item: '1 min+ Video Editing (Footage Provided)', rate: '₹1,500+' },
  { item: '3D Animation (30 Sec)', rate: '₹3,500' },
];

const MARKETING_PLANS = [
  {
    name: 'Starter',
    price: '₹6,999',
    period: '/month',
    desc: 'Essential marketing for growing brands.',
    features: [
      '8 Posters Monthly',
      '2 Sponsored Ads',
      'Story Updates',
      'Basic Analytics',
    ],
  },
  {
    name: 'Growth',
    price: '₹11,999',
    period: '/month',
    desc: 'Strategic content to scale presence.',
    featured: true,
    features: [
      '15 Posters Monthly',
      '5 Sponsored Ads',
      'Content Strategy',
      'Monthly Growth Reports',
    ],
  },
  {
    name: 'Elite',
    price: '₹19,999',
    period: '/month',
    desc: 'Full handling for high-performance scale.',
    features: [
      'Full Social Media Management',
      '10 Sponsored Ads',
      'Reel Optimization & Production',
      'Priority 24/7 Dedicated Support',
    ],
  },
];

export default function PackagesPage() {
  return (
    <div className={styles.pageWrapper}>
      <div className="tw-container">
        {/* Hero */}
        <div className={styles.hero}>
          <p className={styles.eyebrow}>Pricing & Packages</p>
          <h1 className={styles.h1}>Predictable Investment for Extraordinary Results</h1>
          <p className={styles.lead}>
            Transparent, milestone-based packages tailored to businesses in Kerala and global enterprises.
          </p>
        </div>

        {/* 1. Website Packages */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Website Packages</h2>
          <div className={styles.cards3}>
            {WEB_PACKAGES.map((pkg) => (
              <div
                key={pkg.name}
                className={`${styles.planCard} ${pkg.featured ? styles.featuredCard : ''}`}
              >
                <div>
                  {pkg.featured && <span className={styles.popularBadge}>Most Popular</span>}
                  <h3 className={styles.planName}>{pkg.name}</h3>
                  <div className={styles.planIdeal}>Ideal for: {pkg.ideal}</div>

                  <div className={styles.priceWrapper}>
                    <span className={styles.price}>{pkg.price}</span>
                  </div>

                  <ul className={styles.featureList}>
                    {pkg.features.map((f) => (
                      <li key={f} className={styles.featureItem}>
                        <span className={styles.checkIcon}>✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className={styles.deliveryTag}>Delivery Time: {pkg.delivery}</div>
                  <div style={{ marginTop: '1.25rem' }}>
                    <Link
                      href={`/contact?pkg=${encodeURIComponent(pkg.name + ' Website')}`}
                      className={pkg.featured ? 'btn-signup' : 'btn-sales'}
                      style={{ width: '100%', textAlign: 'center' }}
                    >
                      Choose Plan
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Graphic Design Bundles */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Graphic Design Bundles</h2>
          <div className={styles.cards2}>
            {GRAPHIC_BUNDLES.map((b) => (
              <div
                key={b.name}
                className={`${styles.planCard} ${b.featured ? styles.featuredCard : ''}`}
              >
                <div>
                  {b.featured && <span className={styles.popularBadge}>Best Value</span>}
                  <h3 className={styles.planName}>{b.name}</h3>
                  <div className={styles.planIdeal}>{b.ideal} · <strong style={{ color: '#000' }}>{b.value}</strong></div>

                  <div className={styles.priceWrapper}>
                    <span className={styles.price}>{b.price}</span>
                  </div>

                  <ul className={styles.featureList}>
                    {b.features.map((f) => (
                      <li key={f} className={styles.featureItem}>
                        <span className={styles.checkIcon}>✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Link
                    href={`/contact?pkg=${encodeURIComponent(b.name)}`}
                    className={b.featured ? 'btn-signup' : 'btn-sales'}
                    style={{ width: '100%', textAlign: 'center' }}
                  >
                    Select Bundle
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Individual Rates */}
        <section className={styles.section}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div>
              <h2 className={styles.sectionTitle}>Individual Graphic Design Rates</h2>
              <div className={styles.tableCard}>
                <table className={styles.rateTable}>
                  <thead>
                    <tr>
                      <th>Service Item</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GRAPHIC_RATES.map((r) => (
                      <tr key={r.item}>
                        <td>{r.item}</td>
                        <td>{r.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className={styles.sectionTitle}>Video & 3D Animation Rates</h2>
              <div className={styles.tableCard}>
                <table className={styles.rateTable}>
                  <thead>
                    <tr>
                      <th>Service Item</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {VIDEO_RATES.map((v) => (
                      <tr key={v.item}>
                        <td>{v.item}</td>
                        <td>{v.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Digital Marketing & Growth Plans */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Digital Marketing & Growth Plans</h2>
          <div className={styles.cards3}>
            {MARKETING_PLANS.map((m) => (
              <div
                key={m.name}
                className={`${styles.planCard} ${m.featured ? styles.featuredCard : ''}`}
              >
                <div>
                  {m.featured && <span className={styles.popularBadge}>Growth Choice</span>}
                  <h3 className={styles.planName}>{m.name}</h3>
                  <div className={styles.planIdeal}>{m.desc}</div>

                  <div className={styles.priceWrapper}>
                    <span className={styles.price}>{m.price}</span>
                    <span className={styles.period}>{m.period}</span>
                  </div>

                  <ul className={styles.featureList}>
                    {m.features.map((f) => (
                      <li key={f} className={styles.featureItem}>
                        <span className={styles.checkIcon}>✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Link
                    href={`/contact?pkg=${encodeURIComponent(m.name + ' Marketing')}`}
                    className={m.featured ? 'btn-signup' : 'btn-sales'}
                    style={{ width: '100%', textAlign: 'center' }}
                  >
                    Subscribe Plan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Calculator Banner */}
        <div className={styles.calcBanner}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Want a custom combination?
            </h3>
            <p style={{ opacity: 0.8, fontSize: '0.9375rem' }}>
              Configure your own service package with real-time pricing and multi-service discounts.
            </p>
          </div>
          <div>
            <Link href="/calculator" className="btn-signup" style={{ backgroundColor: '#fff', color: '#000', whiteSpace: 'nowrap' }}>
              Launch Custom Builder ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
