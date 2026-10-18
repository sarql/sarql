'use client';

import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="tw-container">
        {/* Section separator */}
        <div className="block-divider">
          <div className="marker-dot marker-dot-left"><div className="marker-center" /></div>
          <div className="marker-dot marker-dot-right"><div className="marker-center" /></div>
          <div className="divider-line" />
        </div>

        <div className={styles.grid}>
          {/* Brand & Tagline */}
          <div className={styles.brandCol}>
            <div className={styles.logo}>
              <img src="/sarql.png?v=2" alt="Sarql" className={styles.footerLogoImg} />
            </div>
            <p className={`${styles.tagline} tw-type-xs-tight`}>
              Architecting elite digital experiences through futuristic design and precision engineering.
            </p>
            <div style={{ marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-gray-600)', lineHeight: '1.6' }}>
              <div><strong>Location:</strong> Vengara, Malappuram, Kerala – 676304</div>
              <div><strong>Infopark:</strong> Phase II, Kochi, Kerala – 682042</div>
              <div><strong>WhatsApp:</strong> <a href="https://wa.me/917558811574" target="_blank" rel="noopener noreferrer" style={{ color: '#000', textDecoration: 'underline' }}>+91 7558811574</a></div>
              <div><strong>Email:</strong> <a href="mailto:hello@sarql.com" style={{ color: '#000', textDecoration: 'underline' }}>hello@sarql.com</a></div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`${styles.colTitle} tw-type-sm`}>Quick Links</h4>
            <ul className={styles.linkList}>
              <li><Link href="/" className={`${styles.linkItem} tw-type-xs-tight`}>Home</Link></li>
              <li><Link href="/about" className={`${styles.linkItem} tw-type-xs-tight`}>The Agency</Link></li>
              <li><Link href="/portfolio" className={`${styles.linkItem} tw-type-xs-tight`}>Portfolio</Link></li>
              <li><Link href="/packages" className={`${styles.linkItem} tw-type-xs-tight`}>Investment / Pricing</Link></li>
              <li><Link href="/calculator" className={`${styles.linkItem} tw-type-xs-tight`}>Custom Package Builder</Link></li>
              <li><Link href="/contact" className={`${styles.linkItem} tw-type-xs-tight`}>Contact &amp; Reviews</Link></li>
            </ul>
          </div>

          {/* Capabilities */}
          <div>
            <h4 className={`${styles.colTitle} tw-type-sm`}>Our Capabilities</h4>
            <ul className={styles.linkList}>
              <li><Link href="/services/web-development-kerala" className={`${styles.linkItem} tw-type-xs-tight`}>Web Engineering</Link></li>
              <li><Link href="/services/graphic-design-kerala" className={`${styles.linkItem} tw-type-xs-tight`}>Cinematic Design</Link></li>
              <li><Link href="/services/seo-company-kerala" className={`${styles.linkItem} tw-type-xs-tight`}>Brand Systems &amp; SEO</Link></li>
              <li><Link href="/services/digital-marketing-kerala" className={`${styles.linkItem} tw-type-xs-tight`}>Motion &amp; Marketing</Link></li>
              <li><Link href="/services" className={`${styles.linkItem} tw-type-xs-tight`}>All Capabilities ↗</Link></li>
            </ul>
          </div>

          {/* Recent Works & Legal */}
          <div>
            <h4 className={`${styles.colTitle} tw-type-sm`}>Legal &amp; Social</h4>
            <ul className={styles.linkList}>
              <li><Link href="/agreement" className={`${styles.linkItem} tw-type-xs-tight`}>Client Agreement</Link></li>
              <li><Link href="/terms" className={`${styles.linkItem} tw-type-xs-tight`}>Terms &amp; Conditions</Link></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className={`${styles.linkItem} tw-type-xs-tight`}>GitHub</a></li>
              <li><a href="https://x.com" target="_blank" rel="noopener noreferrer" className={`${styles.linkItem} tw-type-xs-tight`}>X (Twitter)</a></li>
              <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={`${styles.linkItem} tw-type-xs-tight`}>LinkedIn</a></li>
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={`${styles.linkItem} tw-type-xs-tight`}>Instagram</a></li>
            </ul>
          </div>
        </div>

        <div className={`${styles.bottomBar} tw-type-2xs`}>
          <p>© 2026 Sarql Agency / Digital Ecosystem Architects. All Rights Reserved.</p>
          <p>Origin: Kerala, India</p>
        </div>
      </div>
    </footer>
  );
}
