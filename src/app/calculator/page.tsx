'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronUp, X, CheckCircle2, Pencil, RotateCcw } from 'lucide-react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import styles from './Calculator.module.css';
import {
  submitInquiry,
  capturePartialLead,
  sendBeaconLead,
  getSessionLeadId,
} from '@/services/crmService';

interface ClientInfo {
  fullName: string;
  phone: string;
  email: string;
  company: string;
}

const DRAFT_STORAGE_KEY = 'sarql_calculator_draft';

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
  // Client Info State
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    fullName: '',
    phone: '',
    email: '',
    company: '',
  });
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [hasClientSaved, setHasClientSaved] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Package Selections State
  const [selectedWeb, setSelectedWeb] = useState<string | null>(null);
  const [graphicCounts, setGraphicCounts] = useState<Record<string, number>>({});
  const [videoCounts, setVideoCounts] = useState<Record<string, number>>({});
  const [selectedMarketing, setSelectedMarketing] = useState<string | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // 1. Restore Draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.clientInfo && (parsed.clientInfo.fullName || parsed.clientInfo.phone)) {
          setClientInfo(parsed.clientInfo);
          setHasClientSaved(true);
        } else {
          setIsClientModalOpen(true);
        }

        if (parsed.selectedWeb) setSelectedWeb(parsed.selectedWeb);
        if (parsed.graphicCounts) setGraphicCounts(parsed.graphicCounts);
        if (parsed.videoCounts) setVideoCounts(parsed.videoCounts);
        if (parsed.selectedMarketing) setSelectedMarketing(parsed.selectedMarketing);

        const hasSelections =
          Boolean(parsed.selectedWeb) ||
          Object.values(parsed.graphicCounts || {}).some((v: any) => v > 0) ||
          Object.values(parsed.videoCounts || {}).some((v: any) => v > 0) ||
          Boolean(parsed.selectedMarketing);

        if (hasSelections) {
          setDraftNotice('Draft restored from your previous session.');
          setTimeout(() => setDraftNotice(null), 5000);
        }
      } else {
        // First-time visitor: open the client details capture component
        setIsClientModalOpen(true);
      }
    } catch (e) {
      console.error('Failed to load calculator draft:', e);
      setIsClientModalOpen(true);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Auto-save Draft to localStorage whenever selections or clientInfo change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      const payload = {
        clientInfo,
        hasClientSaved,
        selectedWeb,
        graphicCounts,
        videoCounts,
        selectedMarketing,
        updatedAt: Date.now(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  }, [clientInfo, hasClientSaved, selectedWeb, graphicCounts, videoCounts, selectedMarketing, isInitialized]);

  const handleClearDraft = () => {
    if (typeof window !== 'undefined' && window.confirm('Are you sure you want to reset your configuration?')) {
      setSelectedWeb(null);
      setGraphicCounts({});
      setVideoCounts({});
      setSelectedMarketing(null);
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}
      setDraftNotice('Draft cleared. You can start fresh.');
      setTimeout(() => setDraftNotice(null), 3000);
    }
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientInfo.fullName.trim() || !clientInfo.phone.trim()) return;

    setHasClientSaved(true);
    setIsClientModalOpen(false);

    // Save lead capture immediately into CRM & Google Sheet (upgrades draft to configuring lead)
    try {
      submitInquiry({
        id: getSessionLeadId(),
        fullName: clientInfo.fullName.trim(),
        phone: clientInfo.phone.trim(),
        email: clientInfo.email.trim() || 'N/A',
        company: clientInfo.company.trim() || 'N/A',
        scope: 'Custom Package Builder (Started Architecture)',
        budget: estimatedTotal > 0 ? `₹${estimatedTotal.toLocaleString('en-IN')}` : 'Draft in progress',
        source: 'Package Builder (Lead Capture)',
        status: 'Active / Configuring',
        notes: 'Client completed initial architecture modal and started selecting package items.',
      });
    } catch (err) {
      console.error('Error submitting initial builder lead:', err);
    }
  };

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

  const selectedCount =
    (webItem ? 1 : 0) +
    Object.values(graphicCounts).reduce((a, b) => a + b, 0) +
    Object.values(videoCounts).reduce((a, b) => a + b, 0) +
    (mktItem ? 1 : 0);

  // Ref tracking latest client info & selections for unload beacon
  const latestCalcRef = useRef({ clientInfo, selectedWeb, graphicCounts, videoCounts, selectedMarketing, estimatedTotal });
  useEffect(() => {
    latestCalcRef.current = { clientInfo, selectedWeb, graphicCounts, videoCounts, selectedMarketing, estimatedTotal };
  }, [clientInfo, selectedWeb, graphicCounts, videoCounts, selectedMarketing, estimatedTotal]);

  // Debounced auto-capture as visitor types their details into the builder modal or updates selections
  useEffect(() => {
    if (!clientInfo.fullName.trim() && !clientInfo.phone.trim() && !clientInfo.email.trim()) return;

    const timer = setTimeout(() => {
      const selectedTitles: string[] = [];
      if (selectedWeb) {
        const w = WEBSITES.find((x) => x.id === selectedWeb);
        if (w) selectedTitles.push(w.name);
      }
      Object.entries(graphicCounts).forEach(([k, count]) => {
        if (count > 0) {
          const g = GRAPHICS.find((x) => x.id === k);
          if (g) selectedTitles.push(`${g.name} × ${count}`);
        }
      });
      Object.entries(videoCounts).forEach(([k, count]) => {
        if (count > 0) {
          const v = VIDEOS.find((x) => x.id === k);
          if (v) selectedTitles.push(`${v.name} × ${count}`);
        }
      });
      if (selectedMarketing) {
        const m = MARKETING.find((x) => x.id === selectedMarketing);
        if (m) selectedTitles.push(m.name);
      }

      const scopeDesc = selectedTitles.length > 0
        ? `Builder Items: ${selectedTitles.join(', ')}`
        : 'Custom Package Builder (Started Configuration)';

      capturePartialLead({
        fullName: clientInfo.fullName,
        phone: clientInfo.phone,
        email: clientInfo.email,
        company: clientInfo.company,
        scope: scopeDesc,
        budget: estimatedTotal > 0 ? `₹${estimatedTotal.toLocaleString('en-IN')}` : 'TBD',
        source: 'Package Builder',
      });
    }, 1400);

    return () => clearTimeout(timer);
  }, [clientInfo, selectedWeb, graphicCounts, videoCounts, selectedMarketing, estimatedTotal]);

  // Exit-intent unload beacon for package builder
  useEffect(() => {
    const handleExit = () => {
      const data = latestCalcRef.current;
      if (data.clientInfo.fullName || data.clientInfo.phone || data.clientInfo.email) {
        sendBeaconLead({
          fullName: data.clientInfo.fullName,
          phone: data.clientInfo.phone,
          email: data.clientInfo.email,
          company: data.clientInfo.company,
          scope: `Builder Session Abandoned (Est Total: ₹${data.estimatedTotal.toLocaleString('en-IN')})`,
          budget: `₹${data.estimatedTotal.toLocaleString('en-IN')}`,
          source: 'Package Builder',
        });
      }
    };

    window.addEventListener('beforeunload', handleExit);
    const handleVis = () => {
      if (document.visibilityState === 'hidden') handleExit();
    };
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      window.removeEventListener('beforeunload', handleExit);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, []);

  
  const handleCalculatorSubmit = async () => {
    try {
      const summaryScope: string[] = [];
      if (webItem) summaryScope.push(`Website: ${webItem.name} (₹${webItem.price.toLocaleString('en-IN')})`);
      Object.entries(graphicCounts).forEach(([id, count]) => {
        if (count > 0) {
          const item = GRAPHICS.find((g) => g.id === id);
          if (item) summaryScope.push(`Graphics: ${item.name} x${count} (₹${(item.price * count).toLocaleString('en-IN')})`);
        }
      });
      Object.entries(videoCounts).forEach(([id, count]) => {
        if (count > 0) {
          const item = VIDEOS.find((v) => v.id === id);
          if (item) summaryScope.push(`Video: ${item.name} x${count} (₹${(item.price * count).toLocaleString('en-IN')})`);
        }
      });
      if (mktItem) summaryScope.push(`Marketing: ${mktItem.name} (₹${mktItem.price.toLocaleString('en-IN')}/mo)`);
      if (discount > 0) summaryScope.push(`Bundle Discount (10%): -₹${discount.toLocaleString('en-IN')}`);
      summaryScope.push(`Total: ₹${estimatedTotal.toLocaleString('en-IN')}`);

      await submitInquiry({
        id: getSessionLeadId(),
        fullName: clientInfo.fullName.trim() || 'Client Partner',
        phone: clientInfo.phone.trim() || 'WhatsApp Lead',
        email: clientInfo.email.trim() || 'N/A',
        company: clientInfo.company.trim() || 'N/A',
        scope: summaryScope.join(' | ') || 'Custom Package Estimate',
        budget: `₹${estimatedTotal.toLocaleString('en-IN')}`,
        source: 'Custom Package Builder (Finalized)',
        status: 'Submitted / WhatsApp Inquiry',
        notes: 'Client finalized customized package configuration.',
      });
    } catch (e) {
      console.error('Failed to submit final calculator inquiry:', e);
    }
  };

  // WhatsApp Inquiry Generator with complete Client Details & Itemized Scope
  const generateWhatsAppMessage = () => {
    let msg = '*Sarql Custom Package Architecture Inquiry*\n\n';

    if (clientInfo.fullName) {
      msg += `*Client Details:*\n`;
      msg += `• Name: ${clientInfo.fullName}\n`;
      if (clientInfo.phone) msg += `• Phone: ${clientInfo.phone}\n`;
      if (clientInfo.company) msg += `• Business/Brand: ${clientInfo.company}\n`;
      if (clientInfo.email) msg += `• Email: ${clientInfo.email}\n`;
      msg += `\n`;
    }

    msg += `*Selected Package Scope:*\n`;
    if (webItem) msg += `• Website: ${webItem.name} (₹${webItem.price.toLocaleString('en-IN')})\n`;

    Object.entries(graphicCounts).forEach(([id, count]) => {
      if (count > 0) {
        const item = GRAPHICS.find((g) => g.id === id);
        if (item) msg += `• Graphics: ${item.name} x${count} (₹${(item.price * count).toLocaleString('en-IN')})\n`;
      }
    });

    Object.entries(videoCounts).forEach(([id, count]) => {
      if (count > 0) {
        const item = VIDEOS.find((v) => v.id === id);
        if (item) msg += `• Video: ${item.name} x${count} (₹${(item.price * count).toLocaleString('en-IN')})\n`;
      }
    });

    if (mktItem) msg += `• Marketing: ${mktItem.name} (₹${mktItem.price.toLocaleString('en-IN')}/mo)\n`;

    msg += `\nSubtotal: ₹${subtotal.toLocaleString('en-IN')}\n`;
    if (discount > 0) msg += `Bundle Discount (10%): -₹${discount.toLocaleString('en-IN')}\n`;
    msg += `*Estimated Total: ₹${estimatedTotal.toLocaleString('en-IN')}*\n\nI would like to initiate and discuss this project with Sarql engineering.`;

    return `https://wa.me/917558811574?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className={`${styles.pageWrapper} ${subtotal > 0 ? styles.pageWrapperWithFloatingBar : ''}`}>
      <div className="tw-container">
        {/* Hero */}
        <div className={styles.hero}>
          <p className={styles.eyebrow}>Custom Package Builder</p>
          <h1 className={styles.h1}>Design Your Project Architecture</h1>
          <p className={styles.lead}>
            Configure your own service package with real-time pricing and multi-category bundle discounts.
          </p>

          {/* Client Profile / Active Draft Banner */}
          {hasClientSaved && (
            <div className={styles.clientProfileBar}>
              <div className={styles.clientProfileInfo}>
                <span className={styles.clientProfileDot} />
                <span className={styles.clientProfileText}>
                  Architecture tailored for: <strong>{clientInfo.fullName}</strong>
                  {clientInfo.company ? ` (${clientInfo.company})` : ''} • <span style={{ color: '#10B981' }}>{clientInfo.phone}</span>
                </span>
              </div>
              <div className={styles.clientProfileActions}>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className={styles.clientEditBtn}
                >
                  <Pencil size={13} strokeWidth={2.2} />
                  <span>Edit Info</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className={styles.clientResetBtn}
                  title="Clear configuration and start over"
                >
                  <RotateCcw size={13} strokeWidth={2.2} />
                  <span>Reset Draft</span>
                </button>
              </div>
            </div>
          )}

          {draftNotice && (
            <div className={styles.draftNoticeBanner}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>{draftNotice}</span>
            </div>
          )}
        </div>

        <div className={styles.calcLayout}>
          {/* Controls Column */}
          <div className={styles.controlsCol}>
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: '#000' }}>
                        ₹{w.price.toLocaleString('en-IN')}
                      </div>
                      {selectedWeb === w.id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWeb(null);
                          }}
                          className={styles.cardRemoveBadge}
                          title="Remove this option"
                        >
                          ✕ Remove
                        </button>
                      )}
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: '#000' }}>
                        ₹{m.price.toLocaleString('en-IN')}/mo
                      </div>
                      {selectedMarketing === m.id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMarketing(null);
                          }}
                          className={styles.cardRemoveBadge}
                          title="Remove this option"
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating Sticky Summary Column (Desktop View) */}
          <div className={styles.summaryCol}>
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
                      <div className={styles.summaryItemTitle}>
                        <span>{webItem.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedWeb(null)}
                          className={styles.summaryItemRemoveBtn}
                          title="Remove from package"
                          aria-label={`Remove ${webItem.name}`}
                        >
                          ✕
                        </button>
                      </div>
                      <span>₹{webItem.price.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {Object.entries(graphicCounts).map(([id, count]) => {
                    if (count === 0) return null;
                    const item = GRAPHICS.find((g) => g.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className={styles.summaryRow}>
                        <div className={styles.summaryItemTitle}>
                          <span>{item.name} × {count}</span>
                          <button
                            type="button"
                            onClick={() => setGraphicCounts((prev) => ({ ...prev, [id]: 0 }))}
                            className={styles.summaryItemRemoveBtn}
                            title="Remove from package"
                            aria-label={`Remove ${item.name}`}
                          >
                            ✕
                          </button>
                        </div>
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
                        <div className={styles.summaryItemTitle}>
                          <span>{item.name} × {count}</span>
                          <button
                            type="button"
                            onClick={() => setVideoCounts((prev) => ({ ...prev, [id]: 0 }))}
                            className={styles.summaryItemRemoveBtn}
                            title="Remove from package"
                            aria-label={`Remove ${item.name}`}
                          >
                            ✕
                          </button>
                        </div>
                        <span>₹{(item.price * count).toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}

                  {mktItem && (
                    <div className={styles.summaryRow}>
                      <div className={styles.summaryItemTitle}>
                        <span>{mktItem.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedMarketing(null)}
                          className={styles.summaryItemRemoveBtn}
                          title="Remove from package"
                          aria-label={`Remove ${mktItem.name}`}
                        >
                          ✕
                        </button>
                      </div>
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
                  onClick={handleCalculatorSubmit}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-signup"
                  style={{
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    width: '100%',
                    textAlign: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    pointerEvents: subtotal === 0 ? 'none' : 'auto',
                    opacity: subtotal === 0 ? 0.4 : 1,
                    fontWeight: 600,
                  }}
                >
                  <WhatsAppIcon size={20} color="#FFFFFF" />
                  <span>Send Inquiry on WhatsApp</span>
                </a>
                <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.45)' }}>
                  Instant response from Sarql engineering team
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Minimized Floating Summary Bar */}
      {subtotal > 0 && (
        <>
          <div
            className={styles.mobileFloatingBar}
            onClick={() => setIsMobileSheetOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="View estimated scope"
          >
            <div className={styles.mobileBarLeft}>
              <div className={styles.mobileBarTag}>
                <span>{selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected</span>
                {discount > 0 && <span className={styles.mobileDiscountBadge}>10% BUNDLE OFF</span>}
              </div>
              <div className={styles.mobileBarPrice}>
                ₹{estimatedTotal.toLocaleString('en-IN')}
              </div>
            </div>

            <div className={styles.mobileBarRight}>
              <button
                type="button"
                className={styles.mobileExpandBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileSheetOpen(true);
                }}
              >
                <span>View Scope</span>
                <ChevronUp size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Mobile Detailed Bottom Sheet Drawer */}
          {isMobileSheetOpen && (
            <div
              className={styles.mobileSheetOverlay}
              onClick={() => setIsMobileSheetOpen(false)}
            >
              <div
                className={styles.mobileSheetContent}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.sheetHandle} />

                <div className={styles.sheetHeader}>
                  <div>
                    <h3 className={styles.sheetTitle}>Estimated Scope</h3>
                    <p className={styles.sheetSubtitle}>
                      {selectedCount} {selectedCount === 1 ? 'item' : 'items'} configured in custom package
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.sheetCloseBtn}
                    onClick={() => setIsMobileSheetOpen(false)}
                    aria-label="Close details"
                  >
                    <X size={20} strokeWidth={2.2} />
                  </button>
                </div>

                <div className={styles.sheetBody}>
                  <div className={styles.summaryList} style={{ maxHeight: '18rem' }}>
                    {webItem && (
                      <div className={styles.summaryRow}>
                        <div className={styles.summaryItemTitle}>
                          <span style={{ fontWeight: 500 }}>{webItem.name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedWeb(null)}
                            className={styles.summaryItemRemoveBtn}
                            title="Remove from package"
                            aria-label={`Remove ${webItem.name}`}
                          >
                            ✕
                          </button>
                        </div>
                        <span>₹{webItem.price.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {Object.entries(graphicCounts).map(([id, count]) => {
                      if (count === 0) return null;
                      const item = GRAPHICS.find((g) => g.id === id);
                      if (!item) return null;
                      return (
                        <div key={id} className={styles.summaryRow}>
                          <div className={styles.summaryItemTitle}>
                            <span>{item.name} × {count}</span>
                            <button
                              type="button"
                              onClick={() => setGraphicCounts((prev) => ({ ...prev, [id]: 0 }))}
                              className={styles.summaryItemRemoveBtn}
                              title="Remove from package"
                              aria-label={`Remove ${item.name}`}
                            >
                              ✕
                            </button>
                          </div>
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
                          <div className={styles.summaryItemTitle}>
                            <span>{item.name} × {count}</span>
                            <button
                              type="button"
                              onClick={() => setVideoCounts((prev) => ({ ...prev, [id]: 0 }))}
                              className={styles.summaryItemRemoveBtn}
                              title="Remove from package"
                              aria-label={`Remove ${item.name}`}
                            >
                              ✕
                            </button>
                          </div>
                          <span>₹{(item.price * count).toLocaleString('en-IN')}</span>
                        </div>
                      );
                    })}

                    {mktItem && (
                      <div className={styles.summaryRow}>
                        <div className={styles.summaryItemTitle}>
                          <span style={{ fontWeight: 500 }}>{mktItem.name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedMarketing(null)}
                            className={styles.summaryItemRemoveBtn}
                            title="Remove from package"
                            aria-label={`Remove ${mktItem.name}`}
                          >
                            ✕
                          </button>
                        </div>
                        <span>₹{mktItem.price.toLocaleString('en-IN')}/mo</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.calcTotalBlock}>
                    <div className={styles.summaryRow}>
                      <span>Subtotal</span>
                      <span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>

                    {discount > 0 && (
                      <div className={styles.summaryRow} style={{ color: '#10B981', fontWeight: 500 }}>
                        <span>Bundle Discount (10%)</span>
                        <span>-₹{discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className={styles.summaryRow} style={{ marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>Estimated Total</span>
                      <span className={styles.grandTotal}>₹{estimatedTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <a
                      href={generateWhatsAppMessage()}
                      onClick={() => {
                        handleCalculatorSubmit();
                        setIsMobileSheetOpen(false);
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-signup"
                      style={{
                        backgroundColor: '#25D366',
                        color: '#FFFFFF',
                        width: '100%',
                        textAlign: 'center',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.875rem 1.25rem',
                        fontWeight: 600,
                        borderRadius: '0.75rem',
                      }}
                    >
                      <WhatsAppIcon size={20} color="#FFFFFF" />
                      <span>Send Inquiry on WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setIsMobileSheetOpen(false)}
                      className={styles.sheetCollapseBtn}
                    >
                      Keep Editing / Add More Items
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* INITIAL CLIENT DATA CAPTURE MODAL */}
      {isClientModalOpen && (
        <div className={styles.clientModalOverlay}>
          <div className={styles.clientModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.clientModalHeader}>
              <div>
                <h3 className={styles.clientModalTitle}>Let&apos;s Build Your Package</h3>
                <p className={styles.clientModalSubtitle}>
                  Please share your basic details so we can tailor the system architecture and preserve your draft automatically.
                </p>
              </div>
              {hasClientSaved && (
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className={styles.clientModalCloseBtn}
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={2.2} />
                </button>
              )}
            </div>

            <form onSubmit={handleClientSubmit} className={styles.clientModalForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammed Ansar"
                    value={clientInfo.fullName}
                    onChange={(e) => setClientInfo({ ...clientInfo, fullName: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>WhatsApp / Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Company / Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Innovations"
                    value={clientInfo.company}
                    onChange={(e) => setClientInfo({ ...clientInfo, company: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ marginTop: '0.625rem' }}>
                <button
                  type="submit"
                  className="btn-signup"
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    padding: '0.875rem 1.25rem',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Start Customizing Architecture →
                </button>
              </div>

              <p className={styles.clientPrivacyNotice}>
                ✓ Your selections and progress will be securely saved as a draft. You can return anytime.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
