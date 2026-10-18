'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Calculator.module.css';

interface WebOption {
  id: string;
  name: string;
  price: number;
  desc: string;
}

const WEBSITES: WebOption[] = [
  { id: 'basic', name: 'Basic Website', price: 4999, desc: 'Single Page, Mobile Responsive, WhatsApp Integration.' },
  { id: 'standard', name: 'Standard Website', price: 14999, desc: 'Up to 5 Pages, Premium UI, SEO Setup, Admin Panel.' },
  { id: 'premium', name: 'Premium Website', price: 24999, desc: 'Dynamic Website, Custom UI/UX, Premium Animations, Advanced Features.' },
];

const GRAPHICS = [
  { id: 'poster_bulk', name: 'Social Media Posters', price: 250 },
  { id: 'poster_single', name: 'Single Premium Poster', price: 350 },
  { id: 'story', name: 'Story Resize', price: 50 },
  { id: 'visiting', name: 'Visiting Card Design', price: 250 },
  { id: 'letterhead', name: 'Letterhead Design', price: 200 },
  { id: 'brochure', name: 'Brochure Design (per page)', price: 250 },
  { id: 'flex', name: 'Flex Design', price: 500 },
  { id: 'packaging', name: 'Packet & Box Design', price: 800 },
  { id: 'logo', name: 'Logo Design', price: 3000 },
];

const VIDEOS = [
  { id: 'anim_short', name: '5–10 Sec Animation', price: 350 },
  { id: 'anim_30', name: '30 Sec Animation', price: 800 },
  { id: 'video_30', name: '30 Sec Video Editing', price: 500 },
  { id: 'video_long', name: 'Long Video Editing', price: 1500 },
  { id: 'anim_3d', name: '3D Animation (30 Sec)', price: 3500 },
];

const MARKETING = [
  { id: 'starter', name: 'Starter Marketing', price: 6999, desc: '8 Posters, 2 Ads, Story Updates, Basic Analytics' },
  { id: 'growth', name: 'Growth Marketing', price: 11999, desc: '15 Posters, 5 Ads, Content Strategy, Monthly Reports' },
  { id: 'elite', name: 'Elite Marketing', price: 19999, desc: 'Full Handling, 10 Ads, Reel Optimization, Priority Support' },
];

export default function CalculatorPage() {
  const [selectedWeb, setSelectedWeb] = useState<string | null>(null);
  const [graphicCounts, setGraphicCounts] = useState<Record<string, number>>({});
  const [videoCounts, setVideoCounts] = useState<Record<string, number>>({});
  const [selectedMarketing, setSelectedMarketing] = useState<string | null>(null);

  const updateCount = (type: 'graphic' | 'video', id: string, delta: number) => {
    if (type === 'graphic') {
      setGraphicCounts((prev) => {
        const cur = prev[id] || 0;
        const next = Math.max(0, cur + delta);
        return { ...prev, [id]: next };
      });
    } else {
      setVideoCounts((prev) => {
        const cur = prev[id] || 0;
        const next = Math.max(0, cur + delta);
        return { ...prev, [id]: next };
      });
    }
  };

  // Calculations
  const webItem = WEBSITES.find((w) => w.id === selectedWeb);
  const webTotal = webItem ? webItem.price : 0;

  let graphicTotal = 0;
  Object.entries(graphicCounts).forEach(([id, count]) => {
    const item = GRAPHICS.find((g) => g.id === id);
    if (item) graphicTotal += item.price * count;
  });

  let videoTotal = 0;
  Object.entries(videoCounts).forEach(([id, count]) => {
    const item = VIDEOS.find((v) => v.id === id);
    if (item) videoTotal += item.price * count;
  });

  const mktItem = MARKETING.find((m) => m.id === selectedMarketing);
  const mktTotal = mktItem ? mktItem.price : 0;

  const subtotal = webTotal + graphicTotal + videoTotal + mktTotal;

  // Bundle Discount: 10% if Web + (Graphics or Videos or Marketing)
  const isBundle = webTotal > 0 && (graphicTotal > 0 || videoTotal > 0 || mktTotal > 0);
  const discount = isBundle ? Math.round(subtotal * 0.1) : 0;
  const estimatedTotal = subtotal - discount;

  // WhatsApp Inquiry Generator
  const generateWhatsAppMessage = () => {
    let msg = 'Sarql Custom Package Inquiry\n\n';
    if (webItem) msg += `- Website: ${webItem.name} (₹${webItem.price.toLocaleString('en-IN')})\n`;

    Object.entries(graphicCounts).forEach(([id, count]) => {
      if (count > 0) {
        const item = GRAPHICS.find((g) => g.id === id);
        if (item) msg += `- Graphics: ${item.name} x${count} (₹${(item.price * count).toLocaleString('en-IN')})\n`;
      }
    });

    Object.entries(videoCounts).forEach(([id, count]) => {
      if (count > 0) {
        const item = VIDEOS.find((v) => v.id === id);
        if (item) msg += `- Video: ${item.name} x${count} (₹${(item.price * count).toLocaleString('en-IN')})\n`;
      }
    });

    if (mktItem) msg += `- Marketing: ${mktItem.name} (₹${mktItem.price.toLocaleString('en-IN')}/mo)\n`;

    msg += `\nSubtotal: ₹${subtotal.toLocaleString('en-IN')}\n`;
    if (discount > 0) msg += `Bundle Discount: -₹${discount.toLocaleString('en-IN')}\n`;
    msg += `Estimated Total: ₹${estimatedTotal.toLocaleString('en-IN')}\n\nI would like to discuss and initiate this project.`;

    return `https://wa.me/917558811574?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className={styles.pageWrapper}>
      <div className="tw-container">
        {/* Hero */}
        <div className={styles.hero}>
          <p className={styles.eyebrow}>Custom Package Builder</p>
          <h1 className={styles.h1}>Design Your Project Architecture</h1>
          <p className={styles.lead}>
            Configure your own service package with real-time pricing and multi-category bundle discounts.
          </p>
        </div>

        <div className={styles.calcLayout}>
          {/* Controls Column */}
          <div>
            {/* 1. Websites */}
            <div className={styles.sectionBlock}>
              <div className={styles.sectionHeading}>
                <span>1. Websites</span>
                {selectedWeb && (
                  <button
                    onClick={() => setSelectedWeb(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-gray-400)', cursor: 'pointer', fontSize: '0.8125rem' }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className={styles.radioGrid}>
                {WEBSITES.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWeb(selectedWeb === w.id ? null : w.id)}
                    className={`${styles.radioCard} ${selectedWeb === w.id ? styles.radioCardSelected : ''}`}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem', color: '#000' }}>
                        {w.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-gray-600)', lineHeight: '1.4' }}>
                        {w.desc}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, marginTop: '0.75rem', fontSize: '1rem', color: '#000' }}>
                      ₹{w.price.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Graphics & Branding */}
            <div className={styles.sectionBlock}>
              <div className={styles.sectionHeading}>
                <span>2. Graphics & Branding</span>
              </div>
              <div className={styles.itemGrid}>
                {GRAPHICS.map((g) => {
                  const count = graphicCounts[g.id] || 0;
                  return (
                    <div key={g.id} className={styles.counterRow}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#000' }}>{g.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-gray-400)' }}>
                          ₹{g.price.toLocaleString('en-IN')} each
                        </div>
                      </div>
                      <div className={styles.counterControls}>
                        <button
                          type="button"
                          className={styles.counterBtn}
                          onClick={() => updateCount('graphic', g.id, -1)}
                        >
                          -
                        </button>
                        <span className={styles.counterVal}>{count}</span>
                        <button
                          type="button"
                          className={styles.counterBtn}
                          onClick={() => updateCount('graphic', g.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Video Production */}
            <div className={styles.sectionBlock}>
              <div className={styles.sectionHeading}>
                <span>3. Video Production</span>
              </div>
              <div className={styles.itemGrid}>
                {VIDEOS.map((v) => {
                  const count = videoCounts[v.id] || 0;
                  return (
                    <div key={v.id} className={styles.counterRow}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#000' }}>{v.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-gray-400)' }}>
                          ₹{v.price.toLocaleString('en-IN')} each
                        </div>
                      </div>
                      <div className={styles.counterControls}>
                        <button
                          type="button"
                          className={styles.counterBtn}
                          onClick={() => updateCount('video', v.id, -1)}
                        >
                          -
                        </button>
                        <span className={styles.counterVal}>{count}</span>
                        <button
                          type="button"
                          className={styles.counterBtn}
                          onClick={() => updateCount('video', v.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Marketing Retainers */}
            <div className={styles.sectionBlock}>
              <div className={styles.sectionHeading}>
                <span>4. Marketing Retainers</span>
                {selectedMarketing && (
                  <button
                    onClick={() => setSelectedMarketing(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-gray-400)', cursor: 'pointer', fontSize: '0.8125rem' }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className={styles.radioGrid}>
                {MARKETING.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMarketing(selectedMarketing === m.id ? null : m.id)}
                    className={`${styles.radioCard} ${selectedMarketing === m.id ? styles.radioCardSelected : ''}`}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem', color: '#000' }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-gray-600)', lineHeight: '1.4' }}>
                        {m.desc}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, marginTop: '0.75rem', fontSize: '1rem', color: '#000' }}>
                      ₹{m.price.toLocaleString('en-IN')}/mo
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating Sticky Summary Column */}
          <div>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Estimated Scope</h2>

              {subtotal === 0 ? (
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', padding: '1rem 0' }}>
                  Select items from the options to configure your custom project package.
                </div>
              ) : (
                <div className={styles.summaryList}>
                  {webItem && (
                    <div className={styles.summaryRow}>
                      <span>{webItem.name}</span>
                      <span>₹{webItem.price.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {Object.entries(graphicCounts).map(([id, count]) => {
                    if (count === 0) return null;
                    const item = GRAPHICS.find((g) => g.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className={styles.summaryRow}>
                        <span>{item.name} × {count}</span>
                        <span>₹{(item.price * count).toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}

                  {Object.entries(videoCounts).map(([id, count]) => {
                    if (count === 0) return null;
                    const item = VIDEOS.find((v) => v.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className={styles.summaryRow}>
                        <span>{item.name} × {count}</span>
                        <span>₹{(item.price * count).toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}

                  {mktItem && (
                    <div className={styles.summaryRow}>
                      <span>{mktItem.name}</span>
                      <span>₹{mktItem.price.toLocaleString('en-IN')}/mo</span>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.calcTotalBlock}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {discount > 0 && (
                  <div className={styles.summaryRow} style={{ color: '#10B981' }}>
                    <span>Bundle Discount (10%)</span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className={styles.summaryRow} style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600 }}>Estimated Total</span>
                  <span className={styles.grandTotal}>₹{estimatedTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <a
                  href={generateWhatsAppMessage()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-signup"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    width: '100%',
                    textAlign: 'center',
                    pointerEvents: subtotal === 0 ? 'none' : 'auto',
                    opacity: subtotal === 0 ? 0.4 : 1,
                  }}
                >
                  Send Inquiry on WhatsApp ↗
                </a>
                <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.45)' }}>
                  Instant response from Sarql engineering team
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
