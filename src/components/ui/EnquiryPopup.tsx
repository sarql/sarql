'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import styles from './EnquiryPopup.module.css';
import {
  submitInquiry,
  capturePartialLead,
  sendBeaconLead,
  getSessionLeadId,
} from '@/services/crmService';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';

export default function EnquiryPopup() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    scope: '',
  });

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
    }, 5000); // 5 seconds

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

  // Ref tracking latest data for exit-intent / unload capture
  const latestRef = useRef(formData);
  useEffect(() => {
    latestRef.current = formData;
  }, [formData]);

  // 1. Debounced live partial lead capture as visitor types
  useEffect(() => {
    if (!isOpen) return;
    if (!formData.name && !formData.phone) return;

    const timer = setTimeout(() => {
      capturePartialLead({
        fullName: formData.name,
        phone: formData.phone,
        scope: formData.scope ? `Discovery: ${formData.scope}` : 'Quick Consultation Inquiry',
        source: 'Website 5s Discovery Popup',
      });
    }, 1400);

    return () => clearTimeout(timer);
  }, [formData, isOpen]);

  // 2. Beacon capture on tab close / exit / page hide
  useEffect(() => {
    if (!isOpen) return;

    const handleExit = () => {
      const data = latestRef.current;
      if (data.name || data.phone) {
        sendBeaconLead({
          fullName: data.name,
          phone: data.phone,
          scope: data.scope ? `Discovery Abandoned: ${data.scope}` : 'Quick Consultation (Tab Exit)',
          source: 'Website 5s Discovery Popup',
        });
      }
    };

    window.addEventListener('beforeunload', handleExit);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') handleExit();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', handleExit);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('sarql_enquiry_popup_dismissed', 'true');
    } catch { }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    setIsSubmitting(true);
    try {
      await submitInquiry({
        id: getSessionLeadId(),
        fullName: formData.name.trim(),
        phone: formData.phone.trim(),
        email: 'N/A',
        company: 'N/A',
        scope: formData.scope.trim() || 'Quick Consultation Inquiry',
        source: 'Website 5s Discovery Popup',
        status: 'Submitted / Active',
        notes: 'Inquiry submitted via 5s Discovery Popup.',
      });

      setSubmitted(true);

      // Open WhatsApp chat directly
      const text = `*New Quick Inquiry via Sarql*\n\n*Name:* ${formData.name}\n*Phone:* ${formData.phone}\n*Requirements:* ${formData.scope || 'General Consultation'}`;
      const waUrl = `https://wa.me/917558811574?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');

      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (err) {
      console.error('Failed to submit popup inquiry:', err);
      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
          >
            {/* Minimal Close Button */}
            <button
              onClick={handleClose}
              className={styles.closeBtn}
              aria-label="Close"
              title="Close (Esc)"
            >
              <X size={15} strokeWidth={2.2} />
            </button>

            {submitted ? (
              <motion.div
                className={styles.successBox}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                <CheckCircle2 size={32} color="#111111" />
                <h3 className={styles.successTitle}>Thank You</h3>
                <p className={styles.successDesc}>
                  We received your details and our team will get in touch shortly.
                </p>
              </motion.div>
            ) : (
              <>
                <div className={styles.header}>
                  <h2 className={styles.title}>Start Your Project</h2>
                  <p className={styles.subtitle}>
                    Tell us about your project. We’ll connect with you shortly.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.field}>
                    <label className={styles.label}>Your Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Muhammed Ansar"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>What do you need?</label>
                    <textarea
                      rows={2}
                      value={formData.scope}
                      onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                      placeholder="e.g. Website, Branding, Web App..."
                      className={styles.textarea}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.submitBtn}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Inquiry'}
                  </button>

                  <a
                    href="https://wa.me/917558811574"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.waOption}
                  >
                    Prefer WhatsApp? Chat with our team →
                  </a>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
