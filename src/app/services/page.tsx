import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './ServicesHub.module.css';

export const metadata: Metadata = {
  title: 'Services & Capabilities — Sarql | Web, Design & Growth',
  description:
    'Comprehensive digital services engineered in Kerala: Web Development, Graphic & UI/UX Design, SEO Optimization, and Digital Marketing.',
};

const SERVICES = [
  {
    slug: 'web-development-kerala',
    num: '01',
    title: 'Web Development Company in Kerala',
    leadTag: 'Web Development Kerala',
    desc: 'Looking for the best web development company in Kerala? Sarql delivers premium, high-performance websites and custom web applications for businesses.',
  },
  {
    slug: 'graphic-design-kerala',
    num: '02',
    title: 'Graphic Design Company in Kerala',
    leadTag: 'Graphic Design Kerala',
    desc: 'Sarql is the leading graphic design company in Kerala, specializing in premium branding, logo design, and visual identity for modern brands.',
  },
  {
    slug: 'seo-company-kerala',
    num: '03',
    title: 'SEO Company in Kerala',
    leadTag: 'SEO Services Kerala',
    desc: 'Boost your rankings with the best SEO company in Kerala. Sarql provides expert SEO services to help your business dominate search results.',
  },
  {
    slug: 'digital-marketing-kerala',
    num: '04',
    title: 'Digital Marketing Agency in Kerala',
    leadTag: 'Digital Marketing Kerala',
    desc: 'Scale your business with the top digital marketing agency in Kerala. Sarql specializes in social media, PPC, and data-driven marketing strategies.',
  },
];

export default function ServicesPage() {
  return (
    <div className={styles.pageWrapper}>
      <div className="tw-container">
        <div className={styles.hero}>
          <p className={styles.eyebrow}>Capabilities</p>
          <h1 className={styles.h1}>End-to-End Digital Ecosystem Engineering</h1>
          <p className={styles.lead}>
            Explore our specialized digital disciplines designed to establish search dominance, memorable visual identity, and measurable commercial scale.
          </p>
        </div>

        <div className={styles.grid}>
          {SERVICES.map((s) => (
            <Link key={s.slug} href={`/services/${s.slug}`} className={styles.card}>
              <div>
                <p className={styles.cardEyebrow}>{s.num} · {s.leadTag}</p>
                <h2 className={styles.cardTitle}>{s.title}</h2>
                <p className={styles.cardDesc}>{s.desc}</p>
              </div>
              <div className={styles.cardAction}>
                <span>Explore Discipline</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
