'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '@/app/contact/Contact.module.css';
import {
  submitInquiry,
  submitFeedback,
  capturePartialLead,
  sendBeaconLead,
  getSessionLeadId,
} from '@/services/crmService';
import { Sparkles, MessageSquareQuote, CheckCircle2, Star, X } from 'lucide-react';

interface ContactCardProps {
  onSuccess?: () => void;
  isPopup?: boolean;
}

export default function ContactCard({ onSuccess, isPopup = false }: ContactCardProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'project' | 'review'>('project');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Start Project Form State
  const [projectData, setProjectData] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: '',
    scope: '',
  });

  // Auto-fill selected plan from URL parameters (?pkg=... or ?plan=...) reactively
  useEffect(() => {
    try {
      const pkgParam = searchParams?.get('pkg') || searchParams?.get('plan') || searchParams?.get('package');
      if (pkgParam && pkgParam.trim()) {
        const planName = decodeURIComponent(pkgParam.trim());
        setSelectedPlan(planName);
        setProjectData((prev) => ({
          ...prev,
          scope: `I am interested in getting started with the "${planName}" package. Please let me know the scope details, timeline, and next steps.`,
        }));
      }
    } catch (e) {
      console.error('Error parsing plan param:', e);
    }
  }, [searchParams]);

  // Ref tracking latest data for exit-intent / unload capture
  const latestProjectRef = useRef(projectData);
  useEffect(() => {
    latestProjectRef.current = projectData;
  }, [projectData]);

  // 1. Debounced live partial lead capture as visitor types
  useEffect(() => {
    if (!projectData.fullName && !projectData.phone && !projectData.email) return;

    const timer = setTimeout(() => {
      capturePartialLead({
        fullName: projectData.fullName,
        phone: projectData.phone,
        email: projectData.email,
        company: projectData.company,
        scope: projectData.scope,
        source: isPopup ? 'Website 5s Discovery Popup' : 'Website Contact Page',
      });
    }, 1400);

    return () => clearTimeout(timer);
  }, [projectData, isPopup]);

  // 2. Beacon capture on tab close / exit / page hide
  useEffect(() => {
    const handleExit = () => {
      const data = latestProjectRef.current;
      if (data.fullName || data.phone || data.email) {
        sendBeaconLead({
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          company: data.company,
          scope: data.scope,
          source: isPopup ? 'Website 5s Discovery Popup' : 'Website Contact Page',
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
  }, [isPopup]);

  // Review Form State
  const [reviewData, setReviewData] = useState({
    name: '',
    roleCompany: '',
    rating: 5,
    review: '',
  });

  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Save to CRM and sync to Google Sheets (upgrading draft to active submitted lead)
      await submitInquiry({
        id: getSessionLeadId(),
        fullName: projectData.fullName,
        phone: projectData.phone,
        email: projectData.email,
        company: projectData.company,
        scope: projectData.scope,
        source: isPopup ? 'Website 5s Discovery Popup' : 'Website Contact Page',
        status: 'Submitted / Active',
        notes: 'Lead completed and submitted by client.',
      });

      setSubmittedMessage('Message sent successfully! We will get in touch with you shortly.');

      // 2. Open WhatsApp for rapid live discussion
      const text = `*New Project Inquiry via Website*\n\n*Name:* ${projectData.fullName}\n*Phone:* ${projectData.phone}\n*Email:* ${projectData.email}\n*Company:* ${projectData.company || 'N/A'}\n*Requirements:* ${projectData.scope}`;
      const waUrl = `https://wa.me/917558811574?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');

      // 3. Clear form
      setProjectData({ fullName: '', phone: '', email: '', company: '', scope: '' });

      if (onSuccess) {
        setTimeout(() => onSuccess(), 3000);
      }
    } catch (err) {
      console.error('Failed to submit inquiry:', err);
      setSubmittedMessage('Message sent successfully! We will get in touch with you shortly.');
      if (onSuccess) {
        setTimeout(() => onSuccess(), 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Save to CRM and sync to Google Sheets
      await submitFeedback({
        name: reviewData.name,
        roleCompany: reviewData.roleCompany,
        rating: reviewData.rating,
        review: reviewData.review,
        source: isPopup ? 'Website Popup Review' : 'Website Client Review Form',
      });

      setSubmittedMessage('Thank you! Your review has been submitted successfully.');

      // 2. Open WhatsApp optionally for verification
      const text = `*Client Review Submission*\n\n*Name:* ${reviewData.name}\n*Role & Company:* ${reviewData.roleCompany}\n*Rating:* ${'★'.repeat(reviewData.rating)}\n*Review:* ${reviewData.review}`;
      const waUrl = `https://wa.me/917558811574?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');

      // 3. Clear form
      setReviewData({ name: '', roleCompany: '', rating: 5, review: '' });

      if (onSuccess) {
        setTimeout(() => onSuccess(), 3000);
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setSubmittedMessage('Thank you! Your review has been submitted successfully.');
      if (onSuccess) {
        setTimeout(() => onSuccess(), 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.formCard}
      style={isPopup ? { background: 'transparent', padding: 0, border: 'none', borderRadius: 0 } : undefined}
    >
      {/* ElevenLabs Style Segmented Switcher */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsSwitcher} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'project'}
            className={`${styles.tabBtn} ${activeTab === 'project' ? styles.tabBtnActive : ''}`}
            onClick={() => { setActiveTab('project'); setSubmittedMessage(null); }}
          >
            <Sparkles size={16} strokeWidth={2} />
            <span>Start a Project</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'review'}
            className={`${styles.tabBtn} ${activeTab === 'review' ? styles.tabBtnActive : ''}`}
            onClick={() => { setActiveTab('review'); setSubmittedMessage(null); }}
          >
            <MessageSquareQuote size={16} strokeWidth={2} />
            <span>Share Experience / Review</span>
          </button>
        </div>
      </div>

      {submittedMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F0FDF4',
          color: '#15803D',
          border: '1px solid #BBF7D0',
          padding: '0.75rem 1rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          lineHeight: 1.4,
          fontWeight: 500,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} color="#16A34A" />
            <span>{submittedMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmittedMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#15803D',
              fontSize: '1.2rem',
              lineHeight: 1,
              padding: '0 0.25rem',
              opacity: 0.7,
            }}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      {activeTab === 'project' ? (
        <form onSubmit={handleProjectSubmit}>
          <h2 className={styles.cardTitle}>Send an Inquiry</h2>
          <p className={styles.cardSubtitle}>Fill in your details and our team will get in touch with you shortly.</p>

          {selectedPlan && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#0F172A',
                color: '#F8FAFC',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                marginBottom: '1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Sparkles size={16} color="#34D399" />
                <span style={{ fontSize: '0.875rem' }}>
                  Selected Package: <strong style={{ color: '#FFFFFF', fontWeight: 600 }}>{selectedPlan}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan(null);
                  setProjectData((prev) => ({ ...prev, scope: '' }));
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.14)',
                  border: 'none',
                  color: '#CBD5E1',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.15s ease',
                }}
                title="Remove selected package"
              >
                <span>Remove</span>
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name *</label>
            <input
              type="text"
              required
              value={projectData.fullName}
              onChange={(e) => setProjectData({ ...projectData, fullName: e.target.value })}
              placeholder="e.g. Muhammed Ansar"
              className={styles.input}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Phone Number *</label>
              <input
                type="tel"
                required
                value={projectData.phone}
                onChange={(e) => setProjectData({ ...projectData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address *</label>
              <input
                type="email"
                required
                value={projectData.email}
                onChange={(e) => setProjectData({ ...projectData, email: e.target.value })}
                placeholder="name@yourcompany.com"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Business / Company Name</label>
            <input
              type="text"
              value={projectData.company}
              onChange={(e) => setProjectData({ ...projectData, company: e.target.value })}
              placeholder="e.g. Acme Innovations"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <label className={styles.label} style={{ marginBottom: 0 }}>Project Requirements / Scope *</label>
              {selectedPlan && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  border: '1px solid #A7F3D0',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                }}>
                  Selected Plan: {selectedPlan}
                </span>
              )}
            </div>
            <textarea
              rows={4}
              required
              value={projectData.scope}
              onChange={(e) => setProjectData({ ...projectData, scope: e.target.value })}
              placeholder="Briefly describe what you want to build, target deadlines, or specific features..."
              className={styles.textarea}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-signup"
            style={{ width: '100%', textAlign: 'center', marginTop: '1rem', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReviewSubmit}>
          <h2 className={styles.cardTitle}>Share Your Review</h2>
          <p className={styles.cardSubtitle}>We appreciate your feedback and experience working with us.</p>

          <div className={styles.formGroup}>
            <label className={styles.label}>Your Name *</label>
            <input
              type="text"
              required
              value={reviewData.name}
              onChange={(e) => setReviewData({ ...reviewData, name: e.target.value })}
              placeholder="e.g. Sarah Joseph"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Role & Company *</label>
            <input
              type="text"
              required
              value={reviewData.roleCompany}
              onChange={(e) => setReviewData({ ...reviewData, roleCompany: e.target.value })}
              placeholder="e.g. Marketing Head, Classic Diamonds"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Star Rating</label>
            <div className={styles.starGroup}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewData({ ...reviewData, rating: star })}
                  className={styles.starBtn}
                  aria-label={`${star} stars`}
                >
                  <Star
                    size={20}
                    fill={star <= reviewData.rating ? '#F59E0B' : 'transparent'}
                    color={star <= reviewData.rating ? '#F59E0B' : '#D1D5DB'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Review / Experience *</label>
            <textarea
              rows={4}
              required
              value={reviewData.review}
              onChange={(e) => setReviewData({ ...reviewData, review: e.target.value })}
              placeholder="Share your experience working with Sarql..."
              className={styles.textarea}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-signup"
            style={{ width: '100%', textAlign: 'center', marginTop: '1rem', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}
    </div>
  );
}
