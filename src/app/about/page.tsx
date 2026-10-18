import type { Metadata } from 'next';
import Link from 'next/link';
import Founders from '@/components/sections/Founders';
import Stats from '@/components/sections/Stats';
import styles from './About.module.css';

export const metadata: Metadata = {
  title: 'About Us — Sarql | Best Web Development Company in Kerala',
  description:
    'Sarql is a leading web development company in Kerala offering website design, UI/UX, ecommerce and branding services.',
};

const PILLARS = [
  {
    num: '01',
    name: 'Human Centric',
    tagline: 'Design for Impact',
    desc: 'We believe that every pixel should serve a purpose. Our design process is rooted in deep empathy, ensuring that every digital interaction feels intuitive and memorable.',
  },
  {
    num: '02',
    name: 'Performance First',
    tagline: 'Elite Engineering',
    desc: 'Speed is the ultimate luxury. We engineer lightweight, high-performance architectures that deliver instantaneous responses across all devices.',
  },
  {
    num: '03',
    name: 'Results Driven',
    tagline: 'Strategic Vision',
    desc: "We don't just build websites; we build business tools. Our strategies are designed to convert attention into action and visitors into loyal customers.",
  },
];

export default function AboutPage() {
  return (
    <div className={styles.pageWrapper}>
      <div className="tw-container">
        {/* Hero Section */}
        <div className={styles.hero}>
          <p className={styles.eyebrow}>The Agency</p>
          <h1 className={styles.h1}>Best Web Development Company in Kerala</h1>
          <p className={styles.lead}>
            Sarql is a leading web development company in Kerala offering website design, UI/UX, ecommerce and branding services.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/contact" className="btn-signup">
              Start Project
            </Link>
            <Link href="/portfolio" className="btn-sales">
              View Our Work
            </Link>
          </div>
        </div>

        {/* Global Achievements Stats */}
        <Stats />

        {/* Core Philosophy Section */}
        <section className={styles.philosophySection}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Our Foundation</p>
            <h2 className={styles.sectionTitle}>Our Core Philosophy</h2>
          </div>

          <div className={styles.pillarsGrid}>
            {PILLARS.map((p) => (
              <div key={p.num} className={styles.pillarCard}>
                <div>
                  <div className={styles.pillarNumber}>{p.num}</div>
                  <h3 className={styles.pillarName}>{p.name}</h3>
                  <div className={styles.pillarTagline}>{p.tagline}</div>
                </div>
                <p className={styles.pillarDesc}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Founders */}
        <Founders />

        {/* Call to Action */}
        <div className={styles.ctaBox}>
          <h2 className={styles.ctaTitle}>Ready to evolve your digital presence?</h2>
          <div className={styles.ctaActions}>
            <Link href="/contact" className="btn-signup" style={{ backgroundColor: '#fff', color: '#000' }}>
              Start Project
            </Link>
            <Link href="/calculator" className="btn-sales" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
              Estimate Your Package
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
