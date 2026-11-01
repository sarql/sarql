'use client';

import Link from 'next/link';
import styles from './Cta.module.css';

export default function Cta() {
  return (
    <section className={styles.stripSection} id="contact">
      <div className="tw-container">
        {/* ElevenLabs exact section separator */}
        <div className="block-divider">
          <div className="marker-dot marker-dot-left"><div className="marker-center" /></div>
          <div className="marker-dot marker-dot-right"><div className="marker-center" /></div>
          <div className="divider-line" />
        </div>

        <div className={styles.stripInner}>
          <h2 className={`${styles.title} tw-type-4xl`}>
            Digital Engineering &amp; Platform Growth
          </h2>

          <div className={styles.actions}>
            <Link href="mailto:team.sarql@gmail.com" className="btn-sales">
              Talk to us
            </Link>
            <Link href="/contact/" className="btn-signup">
              Start a project
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
