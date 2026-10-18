'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Contact.module.css';

export default function ContactPage() {
  const [activeTab, setActiveTab] = useState<'project' | 'review'>('project');

  // Start Project Form State
  const [projectData, setProjectData] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: '',
    scope: '',
  });

  // Review Form State
  const [reviewData, setReviewData] = useState({
    name: '',
    roleCompany: '',
    rating: 5,
    review: '',
  });

  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `*New Project Inquiry via Website*\n\n*Name:* ${projectData.fullName}\n*Phone:* ${projectData.phone}\n*Email:* ${projectData.email}\n*Company:* ${projectData.company || 'N/A'}\n*Requirements:* ${projectData.scope}`;
    const waUrl = `https://wa.me/917558811574?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    setSubmittedMessage('Thank you! Redirecting to WhatsApp to finalize details with our engineering team...');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `*Client Review Submission*\n\n*Name:* ${reviewData.name}\n*Role & Company:* ${reviewData.roleCompany}\n*Rating:* ${'★'.repeat(reviewData.rating)}\n*Review:* ${reviewData.review}`;
    const waUrl = `https://wa.me/917558811574?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    setSubmittedMessage('Thank you! Your review has been submitted for verification and will appear on our testimonials.');
  };

  return (
    <div className={styles.pageWrapper}>
      <div className="tw-container">
        {/* Hero */}
        <div className={styles.hero}>
          <p className={styles.eyebrow}>Connect with Sarql</p>
          <h1 className={styles.h1}>Start Your Project / Client Details</h1>
          <p className={styles.lead}>
            Tell us about your visionary project, or share your experience working with the Sarql team.
          </p>
        </div>

        <div className={styles.layout}>
          {/* Main Forms Section */}
          <div className={styles.formCard}>
            {/* Toggle Tabs */}
            <div className={styles.tabsBar}>
              <button
                type="button"
                onClick={() => { setActiveTab('project'); setSubmittedMessage(null); }}
                className={`${styles.tabBtn} ${activeTab === 'project' ? styles.tabBtnActive : ''}`}
              >
                Start a Project
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('review'); setSubmittedMessage(null); }}
                className={`${styles.tabBtn} ${activeTab === 'review' ? styles.tabBtnActive : ''}`}
              >
                Share Experience / Review
              </button>
            </div>

            {submittedMessage && (
              <div style={{ background: '#10B98115', border: '1px solid #10B98140', padding: '1rem', borderRadius: '0.75rem', color: '#047857', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                {submittedMessage}
              </div>
            )}

            {activeTab === 'project' ? (
              <form onSubmit={handleProjectSubmit}>
                <h2 className={styles.cardTitle}>Start Your Project</h2>
                <p className={styles.cardSubtitle}>Tell us about your visionary project.</p>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={projectData.fullName}
                    onChange={(e) => setProjectData({ ...projectData, fullName: e.target.value })}
                    placeholder="e.g. John Doe"
                    className={styles.input}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
                      placeholder="hello@yourbusiness.com"
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
                  <label className={styles.label}>Project Requirements / Scope *</label>
                  <textarea
                    rows={4}
                    required
                    value={projectData.scope}
                    onChange={(e) => setProjectData({ ...projectData, scope: e.target.value })}
                    placeholder="Briefly describe what you want to build, target deadlines, or specific features..."
                    className={styles.textarea}
                  />
                </div>

                <button type="submit" className="btn-signup" style={{ width: '100%', textAlign: 'center', marginTop: '1rem' }}>
                  Launch Discovery Consultation →
                </button>
              </form>
            ) : (
              <form onSubmit={handleReviewSubmit}>
                <h2 className={styles.cardTitle}>Share Your Experience</h2>
                <p className={styles.cardSubtitle}>Your feedback helps us evolve and deliver excellence to more visionaries.</p>

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
                      <span
                        key={star}
                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                        style={{ color: star <= reviewData.rating ? '#F59E0B' : '#E5E7EB' }}
                      >
                        ★
                      </span>
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

                <button type="submit" className="btn-signup" style={{ width: '100%', textAlign: 'center', marginTop: '1rem' }}>
                  Submit Client Review →
                </button>
              </form>
            )}
          </div>

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
                  <a href="tel:+917558811574" className={styles.infoLink}>
                    +91 7558811574
                  </a>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Official Email</div>
                <div className={styles.infoVal}>
                  <a href="mailto:hello@sarql.com" className={styles.infoLink}>
                    hello@sarql.com
                  </a>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Official Website</div>
                <div className={styles.infoVal}>
                  <a href="https://sarql.com" target="_blank" rel="noopener noreferrer" className={styles.infoLink}>
                    https://sarql.com
                  </a>
                </div>
              </div>
            </div>

            <div style={{ background: '#000', color: '#fff', borderRadius: '1.25rem', padding: '2rem' }}>
              <div style={{ fontSize: '0.75rem',  letterSpacing: '0.1em', opacity: 0.6, marginBottom: '0.5rem' }}>
                Rapid Turnaround
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                Instant Project Kickoff
              </div>
              <p style={{ fontSize: '0.875rem', opacity: 0.8, lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Speak directly with co-founders Ilyas and Ansal to architect your digital solution without bureaucracy.
              </p>
              <a
                href="https://wa.me/917558811574?text=Hi%2C%20I%20would%20like%20to%20discuss%20a%20new%20project%20with%20Sarql."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-signup"
                style={{ backgroundColor: '#fff', color: '#000', width: '100%', textAlign: 'center' }}
              >
                Chat on WhatsApp ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
