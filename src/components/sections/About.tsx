'use client';

import styles from './About.module.css';

export default function About() {
  return (
    <section className={styles.section} id="about">
      <div className="tw-container">
        {/* ElevenLabs exact section separator */}
        <div className="block-divider">
          <div className="marker-dot marker-dot-left"><div className="marker-center" /></div>
          <div className="marker-dot marker-dot-right"><div className="marker-center" /></div>
          <div className="divider-line" />
        </div>

        <div className={styles.padding}>
          <div className={styles.box}>
            <div className={styles.grid}>
              <div>
                <h2 className={`${styles.title} tw-type-5xl`}>
                  Excellence in Digital Solutions for Your Business.
                </h2>
                <p className={`${styles.desc} tw-type-base`}>
                  Sarql is dedicated to helping businesses grow by providing reliable, high-quality digital services that deliver real results. Our team focuses on your specific needs, whether it&apos;s building a new website, improving your user experience, or establishing your brand online. We take pride in our precision and commitment to your success.
                </p>

                <div className={styles.pillRow}>
                  <div className={`${styles.pillItem} tw-type-sm`}>
                    <span style={{ color: 'var(--text-gray-400)' }}>Focus:</span>
                    <strong>Quality &amp; Results</strong>
                  </div>
                  <div className={`${styles.pillItem} tw-type-sm`}>
                    <span style={{ color: 'var(--text-gray-400)' }}>Origin:</span>
                    <strong>Kerala, India</strong>
                  </div>
                  <div className={`${styles.pillItem} tw-type-sm`}>
                    <span style={{ color: 'var(--text-gray-400)' }}>Standard:</span>
                    <strong>Global Reach</strong>
                  </div>
                </div>
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={`${styles.statValue} tw-type-5xl`}>30+</span>
                  <span className={`${styles.statLabel} tw-type-2xs`}>Projects Completed</span>
                </div>
                <div className={styles.statCard}>
                  <span className={`${styles.statValue} tw-type-5xl`}>25+</span>
                  <span className={`${styles.statLabel} tw-type-2xs`}>Happy Clients</span>
                </div>
                <div className={styles.statCard}>
                  <span className={`${styles.statValue} tw-type-5xl`}>10+</span>
                  <span className={`${styles.statLabel} tw-type-2xs`}>Global Reach</span>
                </div>
                <div className={styles.statCard}>
                  <span className={`${styles.statValue} tw-type-5xl`}>100%</span>
                  <span className={`${styles.statLabel} tw-type-2xs`}>Success Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
