'use client';

import styles from './Founders.module.css';

const founders = [
  {
    initials: 'Il',
    name: 'Ilyas',
    role: 'Lead Developer & Co-Founder',
    bio: 'Ilyas is the core developer behind Sarql, focused on building fast, scalable, and reliable websites. He works mainly with React, Firebase, and Supabase to create modern web applications with clean, high-performance execution.',
  },
  {
    initials: 'An',
    name: 'Ansal P.A',
    role: 'Developer, Creative Director & Co-Founder',
    bio: 'Ansal leads the creative and development side of Sarql. As a developer, graphic designer, and digital marketer, he focuses on building robust websites, visual brand identities, and digital business growth strategies.',
  },
];

export default function Founders() {
  return (
    <section className={styles.section} id="founders">
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
              Meet The Founders
            </h2>
            <p className={`${styles.subtitle} tw-type-base`}>
              The minds behind Sarql, dedicated to engineering elite digital ecosystems from Kerala to the world.
            </p>
          </div>

          <div className={styles.grid}>
            {founders.map((f) => (
              <div key={f.name} className={styles.card}>
                <div className={styles.header}>
                  <div className={`${styles.avatar} tw-type-xl`}>
                    {f.initials}
                  </div>
                  <div>
                    <h3 className={`${styles.name} tw-type-xl`}>
                      {f.name}
                    </h3>
                    <p className={`${styles.role} tw-type-sm`}>
                      {f.role}
                    </p>
                  </div>
                </div>
                <p className={`${styles.bio} tw-type-base`}>
                  {f.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
