'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Reveal from '@/components/animations/Reveal';

import {
  Code2,
  TrendingUp,
  Palette,
  Clapperboard,
} from 'lucide-react';
import styles from './Services.module.css';

const services = [
  {
    icon: Code2,
    title: 'Web Development',
    description: 'High-performance, scalable websites and enterprise web applications using modern React & Next.js architectures.',
    tag: 'Next.js & Supabase',
    href: '/services/web-development-kerala',
  },
  {
    icon: TrendingUp,
    title: 'Digital Marketing',
    description: 'Strategic growth campaigns and technical search dominance designed to convert attention into measurable revenue.',
    tag: 'SEO & Growth',
    href: '/services/digital-marketing-kerala',
  },
  {
    icon: Palette,
    title: 'Graphic & UI/UX Design',
    description: 'From elite brand identities to intuitive digital interfaces and design systems that convert visitors.',
    tag: 'UI/UX & Identity',
    href: '/services/graphic-design-kerala',
  },
  {
    icon: Clapperboard,
    title: 'Video Editing & Motion',
    description: 'Cinematic storytelling, motion graphics, and audio-visual assets that capture your brand narrative.',
    tag: 'Motion & Film',
    href: '/services/seo-company-kerala',
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
          <Reveal>
            <div className={styles.headingWrapper}>
              <h2 className={`${styles.title} tw-type-5xl`}>
                Our Core Services
              </h2>
              <p className={`${styles.subtitle} tw-type-base`}>
                Engineered with precision for businesses seeking elite digital execution and sustainable growth.
              </p>
            </div>
          </Reveal>

          <div className={styles.grid}>
            {services.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={idx * 0.08} duration={0.5}>
                  <Link href={item.href} className={styles.card} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className={styles.cardTop}>
                      <div className={styles.iconWrap}>
                        <Icon size={20} strokeWidth={2} />
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
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
