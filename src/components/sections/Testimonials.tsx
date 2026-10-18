'use client';

import styles from './Testimonials.module.css';

const testimonials = [
  {
    name: 'Ahmed Fawaz',
    role: 'CEO, Walfy',
    quote: 'Sarql delivered a premium e-commerce experience that exceeded our expectations. Their attention to detail and clean design sense is truly world-class.',
  },
  {
    name: 'Dr. Faisal',
    role: 'Director, Sarql Medical',
    quote: 'The medical management portal built by Sarql has transformed our operations. It is fast, intuitive, and incredibly reliable. Highly recommended!',
  },
  {
    name: 'Sarah Joseph',
    role: 'Marketing Head, Classic Diamonds',
    quote: 'Working with Sarql was a seamless experience. They understood our brand luxury and translated it perfectly into our digital catalog.',
  },
];

export default function Testimonials() {
  return (
    <section className={styles.section} id="testimonials">
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
              Client Feedback
            </h2>
            <p className={`${styles.subtitle} tw-type-base`}>
              Long-term partnerships built on engineering excellence and measurable business results in Kerala and beyond.
            </p>
          </div>

          <div className={styles.grid}>
            {testimonials.map((t) => (
              <div key={t.name} className={styles.card}>
                <div>
                  <div className={`${styles.stars} tw-type-sm`}>★★★★★</div>
                  <p className={`${styles.quote} tw-type-base`}>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className={styles.author}>
                  <span className={`${styles.authorName} tw-type-sm`}>
                    {t.name}
                  </span>
                  <span className={`${styles.authorRole} tw-type-2xs`}>
                    {t.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
