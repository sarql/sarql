'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './EnquiryPopup.module.css';
import ContactCard from './ContactCard';
import { X } from 'lucide-react';

export default function EnquiryPopup() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // 5-Second Timer trigger
  useEffect(() => {
    // Never show on admin or contact pages
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/contact')) return;

    // Check if dismissed in this browser session
    try {
      if (sessionStorage.getItem('sarql_enquiry_popup_dismissed') === 'true') {
        return;
      }
    } catch { }

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5000); // 5 seconds exactly

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('open_enquiry_popup', handleCustomOpen);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('open_enquiry_popup', handleCustomOpen);
    };
  }, [pathname]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('sarql_enquiry_popup_dismissed', 'true');
    } catch { }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* Prominent Close Button */}
        <button
          onClick={handleClose}
          className={styles.closeBtn}
          aria-label="Close Enquiry Modal"
          title="Close (Esc)"
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        {/* The Exact Contact & Review Form Component */}
        <ContactCard isPopup={true} onSuccess={handleClose} />
      </div>
    </div>
  );
}
