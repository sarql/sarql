'use client';

import { useState, useEffect } from 'react';
import { MessageSquareQuote, X, CheckCircle2, Star } from 'lucide-react';
import Reveal from '@/components/animations/Reveal';
import styles from './Testimonials.module.css';
import {
  getStoredReviews,
  submitFeedback,
  purgeLegacyMockReviews,
  FeedbackData,
} from '@/services/crmService';

export default function Testimonials() {
  const [reviews, setReviews] = useState<(FeedbackData & { id?: string })[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [roleCompany, setRoleCompany] = useState('');
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  const loadReviews = () => {
    purgeLegacyMockReviews();
    const stored = getStoredReviews();
    setReviews(stored);
  };

  useEffect(() => {
    loadReviews();

    const handleSync = () => {
      loadReviews();
    };

    window.addEventListener('sarql_crm_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('sarql_crm_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !review.trim()) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({
        name: name.trim(),
        roleCompany: roleCompany.trim() || 'Client Partner',
        rating,
        review: review.trim(),
        source: 'Website Feedback Modal',
      });

      // Clear & Close
      setName('');
      setRoleCompany('');
      setRating(5);
      setReview('');
      setIsModalOpen(false);

      setToastMessage('✓ Thank you! Your feedback has been published.');
      setTimeout(() => setToastMessage(null), 4000);
      loadReviews();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {/* Header Row */}
          <Reveal>
            <div className={styles.headingWrapper}>
              <div className={styles.headingText}>
                <h2 className={`${styles.title} tw-type-5xl`}>
                  Client Feedback
                </h2>
                <p className={`${styles.subtitle} tw-type-base`}>
                  Verified client feedback and partnerships built on engineering excellence and measurable business results.
                </p>
              </div>

              <div className={styles.headerActions}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="btn-sales"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}
                >
                  <MessageSquareQuote size={16} strokeWidth={2} />
                  <span>Add Feedback</span>
                </button>
              </div>
            </div>
          </Reveal>

          {/* Toast Notification */}
          {toastMessage && (
            <div className={styles.toastNotice}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="#16A34A" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#15803D' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Reviews Grid or Empty State */}
          {reviews.length === 0 ? (
            <div className={styles.emptyCard}>
              <div className={styles.emptyStars}>★★★★★</div>
              <h3 className={styles.emptyTitle}>Be the First to Share Feedback</h3>
              <p className={styles.emptyText}>
                Have you partnered with Sarql on design, branding, or high-performance web systems? Share your valuable experience with our engineering team.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="btn-sales"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}
              >
                <Star size={16} fill="#F59E0B" color="#F59E0B" />
                <span>Write a Client Review</span>
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {reviews.map((t, idx) => (
                <Reveal key={t.id || `${t.name}-${idx}`} delay={idx * 0.08} duration={0.5}>
                  <div className={styles.card} style={{ height: '100%' }}>
                    <div>
                      <div className={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span
                            key={s}
                            style={{ color: s <= (t.rating || 5) ? '#F59E0B' : '#E5E7EB' }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <p className={`${styles.quote} tw-type-base`}>
                        &ldquo;{t.review}&rdquo;
                      </p>
                    </div>
                    <div className={styles.author}>
                      <span className={`${styles.authorName} tw-type-sm`}>
                        {t.name}
                      </span>
                      <span className={`${styles.authorRole} tw-type-2xs`}>
                        {t.roleCompany || 'Client Partner'}
                      </span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SUBMIT FEEDBACK MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Share Your Feedback</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={styles.closeBtn}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammed Ansar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Company / Brand / Role</label>
                <input
                  type="text"
                  placeholder="e.g. Founder, Walfy E-Commerce"
                  value={roleCompany}
                  onChange={(e) => setRoleCompany(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Rating</label>
                <div className={styles.starPicker}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={styles.starBtn}
                      style={{ color: s <= rating ? '#F59E0B' : '#D1D5DB' }}
                      title={`${s} Stars`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Your Review / Feedback *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your experience collaborating with Sarql on design, digital architecture, or web development..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className={styles.textarea}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-signup"
                style={{ width: '100%', textAlign: 'center', marginTop: '0.5rem', cursor: 'pointer' }}
              >
                {isSubmitting ? 'Publishing...' : 'Publish Feedback →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
