'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className={styles.headerWrapper}>
      <div className={`tw-container ${styles.headerContainer}`}>
        <div className={styles.leftGroup}>
          <Link href="/" className={styles.logo} aria-label="Sarql">
            <img src="/sarql.png?v=2" alt="Sarql" className={styles.logoImg} />
          </Link>

          <nav className={styles.nav}>
            <Link href="/" className={`${styles.navItem} tw-type-xs-tight`}>
              Home
            </Link>
            <Link href="/portfolio/" className={`${styles.navItem} tw-type-xs-tight`}>
              Projects
            </Link>
            <Link href="/services/" className={`${styles.navItem} tw-type-xs-tight`}>
              Services
            </Link>
            <Link href="/packages/" className={`${styles.navItem} tw-type-xs-tight`}>
              Packages
            </Link>
            <Link href="/about/" className={`${styles.navItem} tw-type-xs-tight`}>
              About
            </Link>
            <Link href="/contact/" className={`${styles.navItem} tw-type-xs-tight`}>
              Contact
            </Link>
          </nav>
        </div>

        <div className={styles.rightGroup}>
          <Link href="/calculator/" className={`${styles.contactBtn} tw-type-xs-tight`}>
            Build Package
          </Link>
          <Link href="/contact/" className={`${styles.signUpBtn} tw-type-xs-tight`}>
            Start a project
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className={styles.mobileMenuBtn}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <>
          <div className={styles.drawerBackdrop} onClick={() => setMobileOpen(false)} />
          <div className={styles.mobileDrawer}>
            <Link href="/" className={styles.drawerItem} onClick={() => setMobileOpen(false)}>
              Home
            </Link>
            <Link href="/portfolio/" className={styles.drawerItem} onClick={() => setMobileOpen(false)}>
              Projects / Portfolio
            </Link>
            <Link href="/services/" className={styles.drawerItem} onClick={() => setMobileOpen(false)}>
              Services &amp; Capabilities
            </Link>
            <Link href="/packages/" className={styles.drawerItem} onClick={() => setMobileOpen(false)}>
              Pricing &amp; Packages
            </Link>
            <Link href="/calculator/" className={styles.drawerItem} onClick={() => setMobileOpen(false)}>
              Custom Package Builder
            </Link>
            <Link href="/about/" className={styles.drawerItem} onClick={() => setMobileOpen(false)}>
              About Sarql
            </Link>
            <Link href="/contact/" className={styles.drawerItem} onClick={() => setMobileOpen(false)}>
              Contact &amp; Reviews
            </Link>
            <Link href="/agreement/" className={styles.drawerItem} onClick={() => setMobileOpen(false)}>
              Client Agreement
            </Link>
          </div>
        </>
      )}
    </header>
  );
}
