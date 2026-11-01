'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import styles from './Contact.module.css';
import ContactCard from '@/components/ui/ContactCard';

export default function ContactPage() {
  return (
    <div className={styles.pageWrapper}>
      <div className="tw-container">
        {/* Hero */}
        <div className={styles.hero}>
          <p className={styles.eyebrow}>Contact Us</p>
          <h1 className={styles.h1}>Let&apos;s Build Something Great</h1>
          <p className={styles.lead}>
            Tell us about your project or share your experience working with Sarql.
          </p>
        </div>

        <div className={styles.layout}>
          {/* Main Forms Section wrapped in Suspense for useSearchParams */}
          <Suspense fallback={<div style={{ minHeight: '300px' }} />}>
            <ContactCard />
          </Suspense>

          {/* Side Info Column */}
          <div className={styles.sideCol}>
            <div className={styles.infoCard}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#000', marginBottom: '1.5rem' }}>
                Direct Contact
              </h3>

              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Headquarters Location</div>
                <div className={styles.infoVal}>
                  Vengara, Malappuram, Kerala, India – 676304
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Branch / Tech Partner</div>
                <div className={styles.infoVal}>
                  Infopark Phase II, Kochi, Kerala, India – 682042
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Phone / WhatsApp</div>
                <div className={styles.infoVal}>
                  <a href="https://wa.me/917558811574" target="_blank" rel="noopener noreferrer" className={styles.infoLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <WhatsAppIcon size={18} color="#25D366" />
                    <span>+91 75588 11574</span>
                  </a>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Direct Admin Email</div>
                <div className={styles.infoVal}>
                  <a href="mailto:team.sarql@gmail.com" className={styles.infoLink}>
                    team.sarql@gmail.com
                  </a>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Business Hours</div>
                <div className={styles.infoVal}>
                  Monday – Saturday: 9:00 AM – 7:00 PM IST
                </div>
              </div>
            </div>

            <div className={styles.infoCard} style={{ background: '#000000', color: '#FFFFFF' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#FFFFFF' }}>
                Instant Project Discussion
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#A3A3A3', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Need immediate engineering or design consultation? Reach out directly via WhatsApp for swift scope scoping.
              </p>
              <a
                href="https://wa.me/917558811574?text=Hi%20Sarql%20Team%2C%20I%20would%20like%20to%20discuss%20a%20new%20project."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill-white"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}
              >
                <WhatsAppIcon size={18} color="#25D366" />
                <span>Chat on WhatsApp →</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
