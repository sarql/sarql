'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, Phone, X } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';
import styles from './FloatingContactWidget.module.css';

export default function FloatingContactWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // If on calculator page, lift on mobile so it doesn't collide with sticky summary bar
  const isCalculator = pathname?.includes('/calculator');

  return (
    <>
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`${styles.widgetContainer} ${isCalculator ? styles.widgetContainerCalculator : ''}`}
        aria-label="Quick contact widget"
      >
        {/* Speed-dial options list: Pure icon-only circular buttons */}
        {isOpen && (
          <div className={styles.optionsMenu} role="menu">
            {/* 1. WhatsApp Action */}
            <a
              href="https://wa.me/917558811574?text=Hi%20Sarql%20Team%2C%20I%20would%20like%20to%20discuss%20a%20project."
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.actionBtn} ${styles.whatsappBtn}`}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              aria-label="Chat with Sarql on WhatsApp"
              title="Chat on WhatsApp (+91 75588 11574)"
            >
              <WhatsAppIcon size={48} />
            </a>

            {/* 2. Direct Phone Call Action */}
            <a
              href="tel:+917558811574"
              className={`${styles.actionBtn} ${styles.callBtn}`}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              aria-label="Call Sarql Directly"
              title="Call Us Directly (+91 75588 11574)"
            >
              <Phone size={19} strokeWidth={2} />
            </a>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`${styles.triggerBtn} ${isOpen ? styles.triggerBtnActive : ''}`}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close contact options' : 'Open contact options'}
          title={isOpen ? 'Close' : 'Quick Contact'}
        >
          {isOpen ? (
            <X size={20} strokeWidth={2.2} />
          ) : (
            <MessageSquare size={21} strokeWidth={2} />
          )}
        </button>
      </div>
    </>
  );
}
