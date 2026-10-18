'use client';

import { ArrowUpRight } from '@phosphor-icons/react';
import styles from './Projects.module.css';

const projects = [
  {
    name: 'Sarql Official',
    category: 'Social Media Web App',
    features: ['Modern UI/UX', 'Realtime Chat', 'Fast Loading', 'Video Streaming'],
    url: 'https://sarql.com',
  },
  {
    name: 'MyLet',
    category: 'Property Rental Platform',
    features: ['Property Listings', 'User Dashboards', 'Search Filters', 'Booking System'],
    url: 'https://mylet.in/',
  },
  {
    name: 'Rashee Perfumes',
    category: 'Luxury E-Commerce',
    features: ['Secure Checkout', 'Product Variants', 'Inventory Sync', 'Discount System'],
    url: 'https://rasheeperfumes.com/',
  },
  {
    name: 'EduSarql',
    category: 'Learning Management System',
    features: ['Course Management', 'Student Progress', 'Digital Resources', 'Exam Portal'],
    url: 'https://edusarql.vercel.app/',
  },
  {
    name: 'Hasanath',
    category: 'Educational Institution',
    features: ['Information Portal', 'Event Management', 'Mobile Friendly', 'Document Access'],
    url: 'https://hasanath786.web.app/',
  },
  {
    name: 'Hindiaa',
    category: 'E-Commerce Retail',
    features: ['Product Catalog', 'User Accounts', 'Order History', 'Mobile First'],
    url: 'https://hindiaa.web.app/',
  },
];

export default function Projects() {
  return (
    <section className={styles.section} id="projects">
      <div className="tw-container">
        {/* ElevenLabs exact section separator */}
        <div className="block-divider">
          <div className="marker-dot marker-dot-left"><div className="marker-center" /></div>
          <div className="marker-dot marker-dot-right"><div className="marker-center" /></div>
          <div className="divider-line" />
        </div>

        <div className={styles.padding}>
          <div className={styles.headingWrapper}>
            <h2 className={`${styles.title} tw-type-5xl`}>
              Our Recent Projects
            </h2>
            <p className={`${styles.subtitle} tw-type-base`}>
              Real digital solutions delivered for industry-leading clients, built with cutting-edge web architecture.
            </p>
          </div>

          <div className={styles.grid}>
            {projects.map((p) => (
              <article key={p.name} className={styles.card}>
                <div className={styles.cardVisual}>
                  <span className={`${styles.visualBadge} tw-type-2xs`}>
                    {p.category}
                  </span>
                  <span className={`${styles.visualLogo} tw-type-xl`}>
                    {p.name}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div>
                    <div className={styles.titleRow}>
                      <h3 className={`${styles.cardTitle} tw-type-base`}>
                        {p.name}
                      </h3>
                      <span className={`${styles.category} tw-type-2xs`}>
                        {p.category}
                      </span>
                    </div>

                    <div className={styles.pillsRow}>
                      {p.features.map((feat) => (
                        <span key={feat} className={`${styles.pill} tw-type-2xs`}>
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.cardAction} tw-type-sm`}
                  >
                    <span>View project</span>
                    <ArrowUpRight size={15} weight="bold" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
