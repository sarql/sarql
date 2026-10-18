'use client';

import {
  Code,
  ChartLineUp,
  Palette,
  FilmSlate,
} from '@phosphor-icons/react';
import styles from './Services.module.css';

const services = [
  {
    icon: Code,
    title: 'Web Development',
    description: 'High-performance, scalable websites and enterprise web applications using modern React & Next.js architectures.',
    tag: 'Next.js & Supabase',
  },
  {
    icon: ChartLineUp,
    title: 'Digital Marketing',
    description: 'Strategic growth campaigns and technical search dominance designed to convert attention into measurable revenue.',
    tag: 'SEO & Growth',
  },
  {
    icon: Palette,
    title: 'Graphic & UI/UX Design',
    description: 'From elite brand identities to intuitive digital interfaces and design systems that convert visitors.',
    tag: 'UI/UX & Identity',
  },
  {
    icon: FilmSlate,
    title: 'Video Editing & Motion',
    description: 'Cinematic storytelling, motion graphics, and audio-visual assets that capture your brand narrative.',
    tag: 'Motion & Film',
  },
];

export default function Services() {
  return (
    <section className={styles.section} id="services">
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
              Our Core Services
            </h2>
            <p className={`${styles.subtitle} tw-type-base`}>
              Engineered with precision for businesses seeking elite digital execution and sustainable growth.
            </p>
          </div>

          <div className={styles.grid}>
            {services.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.iconWrap}>
                      <Icon size={18} weight="bold" />
                    </div>
                    <h3 className={`${styles.cardTitle} tw-type-xl`}>
                      {item.title}
                    </h3>
                    <p className={`${styles.cardDesc} tw-type-sm`}>
                      {item.description}
                    </p>
                  </div>
                  <div className={`${styles.cardBottom} tw-type-2xs`}>
                    <span>{item.tag}</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
