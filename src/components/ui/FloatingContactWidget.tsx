'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div
        className={`${styles.widgetContainer} ${isCalculator ? styles.widgetContainerCalculator : ''}`}
        aria-label="Quick contact widget"
      >
        {/* Speed-dial options list: Pure icon-only circular buttons */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className={styles.optionsMenu}
              role="menu"
              initial={{ opacity: 0, y: 12, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.85 }}
              transition={{ type: 'spring', damping: 22, stiffness: 360 }}
            >
              {/* 1. WhatsApp Action */}
              <motion.a
                href="https://wa.me/917558811574?text=Hi%20Sarql%20Team%2C%20I%20would%20like%20to%20discuss%20a%20project."
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.actionBtn} ${styles.whatsappBtn}`}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                aria-label="Chat with Sarql on WhatsApp"
                title="Chat on WhatsApp (+91 75588 11574)"
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.04 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <WhatsAppIcon size={48} />
              </motion.a>

              {/* 2. Direct Phone Call Action */}
              <motion.a
                href="tel:+917558811574"
                className={`${styles.actionBtn} ${styles.callBtn}`}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                aria-label="Call Sarql Directly"
                title="Call Us Directly (+91 75588 11574)"
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.08 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <Phone size={19} strokeWidth={2} />
              </motion.a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Floating Trigger Button */}
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`${styles.triggerBtn} ${isOpen ? styles.triggerBtnActive : ''}`}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close contact options' : 'Open contact options'}
          title={isOpen ? 'Close' : 'Quick Contact'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', damping: 15, stiffness: 400 }}
        >
          <motion.div
            key={isOpen ? 'close' : 'open'}
            initial={{ rotate: isOpen ? -90 : 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: isOpen ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.16 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isOpen ? (
              <X size={20} strokeWidth={2.2} />
            ) : (
              <MessageSquare size={21} strokeWidth={2} />
            )}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
