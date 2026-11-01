'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Hero.module.css';

const TABS = [
  {
    id: 'web',
    label: 'Web Development',
    headline: 'High-performance Next.js architectures & full-stack systems built for scale.',
    meta: { Tech: 'React, Next.js, Node', TTFB: '42ms Global Edge', Lighthouse: '100% Performance' },
  },
  {
    id: 'ui',
    label: 'UX/UI & Motion',
    headline: 'Cinematic interfaces, fluid micro-interactions, and design systems that convert.',
    meta: { Type: 'Waldenburg & Inter', Motion: 'Hardware accelerated', Aesthetic: 'Minimal Editorial' },
  },
  {
    id: 'marketing',
    label: 'Growth & SEO',
    headline: 'Data-driven marketing and technical search dominance built from Kerala for global reach.',
    meta: { Reach: 'Kerala & Global', Focus: 'Quality & Measurable ROI', Success: '100% Delivery' },
  },
];

export default function Hero() {
  const [activeTab, setActiveTab] = useState(0);
  const current = TABS[activeTab];

  return (
    <section className={styles.heroSection}>
      <div className="tw-container">
        <div className={styles.heroPadding}>
          {/* ElevenLabs exact block-el-title layout */}
          <div className={styles.heroGrid}>
            <div className={styles.heroColLeft}>
              <h1 className={`${styles.h1} tw-type-6xl`}>
                We build{' '}
                <span className={styles.h1Break}>digital experiences</span>{' '}
                <span className={styles.h1Break}>that dominate</span>
              </h1>

              <div className={styles.actionsWrap}>
                <div className={styles.buttonRow}>
                  <Link href="/contact/" className="btn-signup">
                    Start a project
                  </Link>
                  <Link href="/portfolio/" className="btn-sales">
                    View work
                  </Link>
                </div>
              </div>
            </div>

            <div className={styles.heroColRight}>
              <h2 className={`${styles.h2Subtitle} tw-type-base`}>
                Sarql engineers clear, functional, and memorable digital experiences. From cinematic visual identity to enterprise web development, we help you build a digital presence that dominates search.
              </h2>
              <div className={styles.spacer} />
            </div>
          </div>

          {/* ElevenLabs signature omnibox container */}
          <div className={styles.omniboxWrapper}>
            <div className={styles.omnibox}>
              <div className={styles.omniboxHeader}>
                <div className={styles.tabsRow}>
                  {TABS.map((tab, idx) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(idx)}
                      className={`${styles.tabItem} ${
                        activeTab === idx ? styles.tabItemActive : ''
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className={styles.omniboxHeaderMeta}>
                  <span className={styles.statusDot} />
                  <span>Production Stack</span>
                </div>
              </div>

              <div className={styles.omniboxContent}>
                <div>
                  <p className={`${styles.boxHeadline} tw-type-4xl`}>
                    &ldquo;{current.headline}&rdquo;
                  </p>
                </div>

                <div className={styles.metaBox}>
                  {Object.entries(current.meta).map(([key, val]) => (
                    <div key={key} className={styles.metaRow}>
                      <span className="tw-type-xs-tight" style={{ color: 'var(--text-gray-400)' }}>
                        {key}
                      </span>
                      <span className="tw-type-xs-tight" style={{ fontWeight: 500, color: '#000' }}>
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
