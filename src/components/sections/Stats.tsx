'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import styles from './Stats.module.css';

const stats = [
  { value: 30, suffix: '+', label: 'Projects Completed' },
  { value: 25, suffix: '+', label: 'Happy Clients' },
  { value: 10, suffix: '+', label: 'Global Reach' },
  { value: 100, suffix: '%', label: 'Success Rate' },
];

function AnimatedNumber({
  target,
  suffix,
  inView,
}: {
  target: number;
  suffix: string;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (shouldReduceMotion) {
      setCount(target);
      return;
    }

    let start = 0;
    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      start = Math.floor(eased * target);
      setCount(start);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [inView, target, shouldReduceMotion]);

  return (
    <>
      {count}
      {suffix}
    </>
  );
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section className={styles.section} id="stats-section">
      <div className="tw-container">
        {/* Exact Sarql block divider */}
        <div className="block-divider">
          <div className="marker-dot marker-dot-left"><div className="marker-center" /></div>
          <div className="marker-dot marker-dot-right"><div className="marker-center" /></div>
          <div className="divider-line" />
        </div>

        <div className={styles.padding} ref={ref}>
          <div className={styles.grid}>
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className={styles.stat}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <div className={`${styles.statValue} tw-type-5xl`}>
                  <AnimatedNumber
                    target={stat.value}
                    suffix={stat.suffix}
                    inView={isInView}
                  />
                </div>
                <div className={`${styles.statLabel} tw-type-xs`}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
