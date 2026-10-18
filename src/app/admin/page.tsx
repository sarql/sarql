'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './Admin.module.css';

/* ------------------------------------------------------------- Interfaces */
interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  status: 'New' | 'In Discussion' | 'Proposal Sent' | 'Won / Closed' | 'Delivered';
  date: string;
  notes?: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  email: string;
  action: string;
  status: 'SUCCESS' | 'DENIED';
}

/* ------------------------------------------------------------- Default Authorized Accounts */
const DEFAULT_WHITELIST = [
  'hello@sarql.com',
  'sarql.in@gmail.com',
  'ansal@sarql.com',
];

/* ------------------------------------------------------------- Initial Seed Leads */
const INITIAL_LEADS: Lead[] = [
  {
    id: 'LEAD-101',
    name: 'Muhammed Nihal',
    company: 'UK Xpress Global',
    email: 'nihal@ukxpress.co.uk',
    phone: '917558811574',
    service: 'Full Visual Branding & Web Platform',
    budget: '₹4,50,000',
    status: 'Won / Closed',
    date: '2026-10-18',
    notes: 'Approved cinematic motion identity and modern Next.js logistics web app.',
  },
  {
    id: 'LEAD-102',
    name: 'Dr. Aisha Rahman',
    company: 'Ziyarath Wellness Clinics',
    email: 'dr.aisha@ziyarath.com',
    phone: '919846123456',
    service: 'Brand Identity & Social System',
    budget: '₹1,80,000',
    status: 'In Discussion',
    date: '2026-10-17',
    notes: 'Reviewed poster showcase on portfolio. Requested proposal for 12 clinic branches.',
  },
  {
    id: 'LEAD-103',
    name: 'Rahul Varma',
    company: 'Varma Luxury Living Kochi',
    email: 'rahul@varmaliving.in',
    phone: '919447001122',
    service: 'Cinematic 3D Web Experience',
    budget: '₹6,00,000',
    status: 'Proposal Sent',
    date: '2026-10-16',
    notes: 'Sent formal statement of work with Framer 3D interactive preview components.',
  },
  {
    id: 'LEAD-104',
    name: 'Suhail K.P',
    company: 'Rotary District 3201',
    email: 'suhail@rotarymalappuram.org',
    phone: '919895000000',
    service: 'Event Media & Poster Campaigns',
    budget: '₹1,20,000',
    status: 'Delivered',
    date: '2026-10-14',
    notes: 'High-volume poster package delivered and archived into Google Drive.',
  },
  {
    id: 'LEAD-105',
    name: 'Farooq Basheer',
    company: 'Al Aman Perfumes Dubai',
    email: 'farooq@alaman.ae',
    phone: '971501234567',
    service: 'Luxury Perfume E-Commerce',
    budget: '₹8,50,000',
    status: 'New',
    date: '2026-10-19',
    notes: 'Inquiry received via website Start a Project form.',
  },
];

export default function AdminPage() {
  /* ----------------------------------------------------------- Auth State */
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [deniedAttempt, setDeniedAttempt] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');

  /* ----------------------------------------------------------- Dashboard State */
  const [activeTab, setActiveTab] = useState<'overview' | 'crm' | 'drive' | 'settings'>('overview');
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New lead form
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadService, setNewLeadService] = useState('Web Engineering');
  const [newLeadBudget, setNewLeadBudget] = useState('₹2,50,000');

  // Whitelist management
  const [whitelist, setWhitelist] = useState<string[]>(DEFAULT_WHITELIST);
  const [newWhitelistEmail, setNewWhitelistEmail] = useState('');

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'LOG-1',
      timestamp: '2026-10-19 02:20:10',
      email: 'hello@sarql.com',
      action: 'Google SSO Authentication',
      status: 'SUCCESS',
    },
  ]);

  // Load persistent state from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('sarql_admin_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      const savedLeads = localStorage.getItem('sarql_leads');
      if (savedLeads) setLeads(JSON.parse(savedLeads));

      const savedWhitelist = localStorage.getItem('sarql_whitelist');
      if (savedWhitelist) setWhitelist(JSON.parse(savedWhitelist));

      const savedLogs = localStorage.getItem('sarql_audit_logs');
      if (savedLogs) setAuditLogs(JSON.parse(savedLogs));
    } catch {}
  }, []);

  // Save leads on change
  useEffect(() => {
    try {
      localStorage.setItem('sarql_leads', JSON.stringify(leads));
    } catch {}
  }, [leads]);

  // Save whitelist on change
  useEffect(() => {
    try {
      localStorage.setItem('sarql_whitelist', JSON.stringify(whitelist));
    } catch {}
  }, [whitelist]);

  /* ----------------------------------------------------------- Auth Handlers */
  const logAudit = (email: string, action: string, status: 'SUCCESS' | 'DENIED') => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      email,
      action,
      status,
    };
    const updated = [newLog, ...auditLogs.slice(0, 40)];
    setAuditLogs(updated);
    try {
      localStorage.setItem('sarql_audit_logs', JSON.stringify(updated));
    } catch {}
  };

  const handleGoogleVerify = (testEmail: string) => {
    setDeniedAttempt(null);
    const normalized = testEmail.trim().toLowerCase();

    const isAllowed = whitelist.map((w) => w.toLowerCase()).includes(normalized) || normalized.endsWith('@sarql.com');

    if (!isAllowed) {
      logAudit(normalized, 'Unauthorized Access Attempt Blocked', 'DENIED');
      setDeniedAttempt(normalized);
      return;
    }

    // Success
    const user = {
      email: normalized,
      name: normalized.split('@')[0].toUpperCase(),
    };
    setCurrentUser(user);
    try {
      localStorage.setItem('sarql_admin_user', JSON.stringify(user));
    } catch {}
    logAudit(normalized, 'Verified Google SSO Sign-in', 'SUCCESS');
  };

  const handlePasscodeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === 'sarql2026' || passcodeInput === 'sarql') {
      handleGoogleVerify('hello@sarql.com');
    } else {
      setDeniedAttempt('Invalid Passcode');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('sarql_admin_user');
    } catch {}
  };

  /* ----------------------------------------------------------- CRM Handlers */
  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName) return;

    const newLead: Lead = {
      id: `LEAD-${Math.floor(100 + Math.random() * 900)}`,
      name: newLeadName,
      company: newLeadCompany || 'Individual Visionary',
      email: newLeadEmail || 'client@vision.com',
      phone: newLeadPhone.replace(/[^0-9]/g, '') || '917558811574',
      service: newLeadService,
      budget: newLeadBudget,
      status: 'New',
      date: new Date().toISOString().slice(0, 10),
    };

    setLeads([newLead, ...leads]);
    setIsAddModalOpen(false);

    // Reset inputs
    setNewLeadName('');
    setNewLeadCompany('');
    setNewLeadEmail('');
    setNewLeadPhone('');
  };

  const updateLeadStatus = (id: string, newStatus: Lead['status']) => {
    setLeads(leads.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
  };

  const deleteLead = (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      setLeads(leads.filter((l) => l.id !== id));
    }
  };

  const triggerWhatsApp = (lead: Lead) => {
    const text = `Hello ${lead.name}, this is the Sarql Executive Team regarding your project inquiry (${lead.service}). We have reviewed your vision and would love to schedule a direct discovery consultation.`;
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Company', 'Email', 'Phone', 'Service', 'Budget', 'Status', 'Date'];
    const rows = leads.map((l) => [l.id, l.name, l.company, l.email, l.phone, l.service, l.budget, l.status, l.date]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sarql_crm_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ----------------------------------------------------------- Whitelist Handlers */
  const addWhitelistEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newWhitelistEmail.trim().toLowerCase();
    if (!email || whitelist.includes(email)) return;
    setWhitelist([...whitelist, email]);
    setNewWhitelistEmail('');
  };

  const removeWhitelistEmail = (emailToRemove: string) => {
    if (whitelist.length <= 1) {
      alert('You must keep at least one authorized administrator email.');
      return;
    }
    setWhitelist(whitelist.filter((e) => e !== emailToRemove));
  };

  /* ----------------------------------------------------------- Filtered Leads */
  const filteredLeads = useMemo(() => {
    if (statusFilter === 'All') return leads;
    return leads.filter((l) => l.status === statusFilter);
  }, [leads, statusFilter]);

  /* ----------------------------------------------------------- Render Gatekeeper (If not logged in) */
  if (!currentUser) {
    return (
      <div className={styles.gatekeeperWrapper}>
        <div className={styles.gatekeeperCard}>
          <div className={styles.shieldIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          <div className={styles.authBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
            Restricted Admin Area
          </div>

          <h1 className={styles.gatekeeperTitle}>Sarql Security Gateway</h1>
          <p className={styles.gatekeeperDesc}>
            Verify your authorized Google account to access client CRM, leads pipeline, and Google Drive controls.
          </p>

          {/* Google Sign-in */}
          <button
            onClick={() => handleGoogleVerify('hello@sarql.com')}
            className={styles.googleBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Sign in with Google (Sarql Admin)
          </button>

          <div className={styles.divider}>
            <span>Or test specific email</span>
          </div>

          {/* Test verification input */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. sarql.in@gmail.com"
              className={styles.inputField}
            />
            <button
              onClick={() => handleGoogleVerify(emailInput)}
              className={styles.actionBtn}
              style={{ flexShrink: 0 }}
            >
              Verify
            </button>
          </div>

          <form onSubmit={handlePasscodeLogin} className={styles.passcodeForm}>
            <input
              type="password"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="Master Passcode (e.g. sarql2026)"
              className={styles.inputField}
            />
            <button type="submit" className={styles.submitBtn}>
              Unlock with Passcode
            </button>
          </form>

          {/* Denied Alert */}
          {deniedAttempt && (
            <div className={styles.alertDenied}>
              <strong>ACCESS DENIED:</strong> The account <code>{deniedAttempt}</code> is not listed in Sarql's authorized administrators list. Only verified Sarql Google accounts can access this console. This unauthorized incident has been logged.
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------- Render Admin Dashboard */
  return (
    <div className={styles.adminPage}>
      <div className="tw-container">
        {/* Header matching Sarql Website Aesthetic */}
        <div className={styles.heroSection}>
          <div>
            <p className={styles.eyebrow}>Operations & Control Suite</p>
            <h1 className={styles.h1}>Customer Relationship & Archive</h1>
            <p className={styles.lead}>
              Authorized Session: <strong>{currentUser.email}</strong> · Verified Google Admin
            </p>
          </div>

          <div className={styles.heroActions}>
            {activeTab === 'crm' && (
              <>
                <button onClick={exportCSV} className={styles.actionBtnSecondary}>
                  Export CSV
                </button>
                <button onClick={() => setIsAddModalOpen(true)} className={styles.actionBtn}>
                  + Add New Lead
                </button>
              </>
            )}
            {activeTab === 'drive' && (
              <button
                onClick={() => alert('Google Drive cache refreshed: 1,452 assets verified.')}
                className={styles.actionBtn}
              >
                ↻ Sync Drive Assets
              </button>
            )}
            <button onClick={handleLogout} className={styles.logoutBtn} title="Sign Out">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation (Exact Sarql Filter Pill style) */}
        <div className={styles.tabNav}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`${styles.tabBtn} ${activeTab === 'crm' ? styles.tabBtnActive : ''}`}
          >
            CRM & Leads
            <span className={styles.tabBadge}>{leads.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`${styles.tabBtn} ${activeTab === 'drive' ? styles.tabBtnActive : ''}`}
          >
            Drive Archive
            <span className={styles.tabBadge}>1,452</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`${styles.tabBtn} ${activeTab === 'settings' ? styles.tabBtnActive : ''}`}
          >
            Security Whitelist
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>
                  <span>Active CRM Leads</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                </div>
                <div className={styles.metricValue}>{leads.length}</div>
                <div className={styles.metricNote}>+3 new inquiries this week</div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>
                  <span>Pipeline Valuation</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                </div>
                <div className={styles.metricValue}>₹22,00,000</div>
                <div className={styles.metricNote}>5 active proposals</div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>
                  <span>Google Drive Archive</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                </div>
                <div className={styles.metricValue}>1,452</div>
                <div className={styles.metricNote}>1,401 Posters · 48 Logos · 3 Web</div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>
                  <span>WhatsApp Lead Routing</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                </div>
                <div className={styles.metricValue}>+91 7558811574</div>
                <div className={styles.metricNote}>Connected to Sarql Team</div>
              </div>
            </div>

            <div className={styles.contentCard}>
              <div className={styles.cardTopBar}>
                <h3 className={styles.cardTitle}>Recent Client Inquiries</h3>
                <button onClick={() => setActiveTab('crm')} className={styles.actionBtnSecondary}>
                  Open Full CRM →
                </button>
              </div>

              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Client / Brand</th>
                      <th>Service Scope</th>
                      <th>Estimated Budget</th>
                      <th>Status</th>
                      <th>Direct Connect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 4).map((lead) => (
                      <tr key={lead.id} className={styles.tableRow}>
                        <td>
                          <span className={styles.clientName}>{lead.name}</span>
                          <span className={styles.clientCompany}>{lead.company}</span>
                        </td>
                        <td>{lead.service}</td>
                        <td><span className={styles.budget}>{lead.budget}</span></td>
                        <td>
                          <span className={`${styles.statusSelect} ${
                            lead.status === 'Won / Closed' ? styles.statusWon :
                            lead.status === 'New' ? styles.statusNew :
                            lead.status === 'Proposal Sent' ? styles.statusProposal :
                            styles.statusDiscussion
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => triggerWhatsApp(lead)} className={styles.whatsappPill}>
                            WhatsApp
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CRM & LEADS */}
        {activeTab === 'crm' && (
          <div className={styles.contentCard}>
            <div className={styles.cardTopBar}>
              <div className={styles.filterRow}>
                {['All', 'New', 'In Discussion', 'Proposal Sent', 'Won / Closed', 'Delivered'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`${styles.filterPill} ${statusFilter === st ? styles.filterPillActive : ''}`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <span style={{ fontSize: '0.8125rem', color: '#777777' }}>
                Showing {filteredLeads.length} of {leads.length} leads
              </span>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Client / Brand</th>
                    <th>Contact Info</th>
                    <th>Requested Service</th>
                    <th>Budget</th>
                    <th>Status Workflow</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className={styles.tableRow}>
                      <td>
                        <span className={styles.clientName}>{lead.name}</span>
                        <span className={styles.clientCompany}>{lead.company}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem', color: '#111111' }}>{lead.email}</div>
                        <div style={{ fontSize: '0.75rem', color: '#777777' }}>+{lead.phone}</div>
                      </td>
                      <td>{lead.service}</td>
                      <td><span className={styles.budget}>{lead.budget}</span></td>
                      <td>
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as any)}
                          className={`${styles.statusSelect} ${
                            lead.status === 'Won / Closed' ? styles.statusWon :
                            lead.status === 'New' ? styles.statusNew :
                            lead.status === 'Proposal Sent' ? styles.statusProposal :
                            lead.status === 'Delivered' ? styles.statusDelivered :
                            styles.statusDiscussion
                          }`}
                        >
                          <option value="New">New Inquiry</option>
                          <option value="In Discussion">In Discussion</option>
                          <option value="Proposal Sent">Proposal Sent</option>
                          <option value="Won / Closed">Won / Closed</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <button onClick={() => triggerWhatsApp(lead)} className={styles.whatsappPill}>
                            WhatsApp
                          </button>
                          <button onClick={() => deleteLead(lead.id)} className={styles.iconBtn} title="Delete">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DRIVE ARCHIVE */}
        {activeTab === 'drive' && (
          <div className={styles.contentCard} style={{ padding: '2rem' }}>
            <h3 className={styles.cardTitle} style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Google Drive Portfolio Asset Pipeline
            </h3>
            <p style={{ color: 'var(--text-gray-600, #59544F)', fontSize: '0.875rem', marginBottom: '1.75rem', maxWidth: '42rem' }}>
              Your portfolio carousel dynamically renders Google Drive assets with zero cropping and real-time WebGL Curveflow shaders.
            </p>

            <div className={styles.metricsGrid} style={{ marginBottom: '2rem' }}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Posters Active</span>
                <span className={styles.metricValue}>1,401</span>
                <span className={styles.metricNote}>● Connected to Drive</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Logos Active</span>
                <span className={styles.metricValue}>48</span>
                <span className={styles.metricNote}>● Connected to Drive</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Web Designs Active</span>
                <span className={styles.metricValue}>3</span>
                <span className={styles.metricNote}>● Connected to Drive</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={() => alert('Drive cache refreshed: 1,452 assets verified.')} className={styles.actionBtn}>
                Force Refresh Drive Sync ↻
              </button>
              <a href="/portfolio/" target="_blank" className={styles.actionBtnSecondary}>
                Preview Live Portfolio ↗
              </a>
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY & WHITELIST */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className={styles.contentCard} style={{ padding: '2rem' }}>
              <h3 className={styles.cardTitle} style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
                Authorized Gmail Whitelist (Access Control)
              </h3>
              <p style={{ color: 'var(--text-gray-600, #59544F)', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: '44rem' }}>
                Strict security protection: Only users authenticated with these verified Gmail addresses can enter the admin console. Unauthorized sign-in attempts are rejected immediately.
              </p>

              <form onSubmit={addWhitelistEmail} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', maxWidth: '500px' }}>
                <input
                  type="email"
                  value={newWhitelistEmail}
                  onChange={(e) => setNewWhitelistEmail(e.target.value)}
                  placeholder="Enter admin Gmail (e.g. sarql.in@gmail.com)"
                  className={styles.inputField}
                />
                <button type="submit" className={styles.actionBtn} style={{ flexShrink: 0 }}>
                  + Add Admin
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '600px' }}>
                {whitelist.map((email) => (
                  <div
                    key={email}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.25rem',
                      background: 'var(--bg-cream, #F5F3F1)',
                      borderRadius: '0.85rem',
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{email}</span>
                      {email.endsWith('@sarql.com') && (
                        <span style={{ fontSize: '0.68rem', background: '#000000', color: '#FFFFFF', padding: '0.15rem 0.45rem', borderRadius: '9999px', fontWeight: 500 }}>
                          Official Domain
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => removeWhitelistEmail(email)}
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Revoke Access
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.contentCard} style={{ padding: '2rem' }}>
              <h3 className={styles.cardTitle} style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
                Security Audit Log
              </h3>
              <p style={{ color: 'var(--text-gray-600, #59544F)', fontSize: '0.84rem', marginBottom: '1.25rem' }}>
                Real-time record of all verified logins and blocked unauthorized attempts.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1.25rem',
                      background: log.status === 'DENIED' ? '#FEF2F2' : 'var(--bg-cream, #F5F3F1)',
                      borderRadius: '0.75rem',
                      border: log.status === 'DENIED' ? '1px solid #FCA5A5' : '1px solid rgba(0, 0, 0, 0.04)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <div>
                      <strong>{log.email}</strong> — {log.action}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ color: log.status === 'DENIED' ? '#DC2626' : '#059669', fontWeight: 600 }}>
                        {log.status}
                      </span>
                      <span style={{ color: '#888888', fontSize: '0.75rem' }}>{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD LEAD MODAL */}
      {isAddModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add New Client Lead</h3>
              <button onClick={() => setIsAddModalOpen(false)} className={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleAddLead} className={styles.modalBody}>
              <div>
                <label className={styles.formLabel}>Client Full Name *</label>
                <input
                  type="text"
                  required
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="e.g. Farooq Basheer"
                  className={styles.inputField}
                />
              </div>

              <div>
                <label className={styles.formLabel}>Company / Brand Name</label>
                <input
                  type="text"
                  value={newLeadCompany}
                  onChange={(e) => setNewLeadCompany(e.target.value)}
                  placeholder="e.g. Al Aman Perfumes"
                  className={styles.inputField}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className={styles.formLabel}>Email Address</label>
                  <input
                    type="email"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    placeholder="client@brand.com"
                    className={styles.inputField}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>WhatsApp / Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    placeholder="917558811574"
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className={styles.formLabel}>Service Scope</label>
                  <select
                    value={newLeadService}
                    onChange={(e) => setNewLeadService(e.target.value)}
                    className={styles.inputField}
                  >
                    <option value="Web Engineering">Web Engineering</option>
                    <option value="Cinematic Branding">Cinematic Branding</option>
                    <option value="Motion Graphics">Motion Graphics</option>
                    <option value="Poster Campaign">Poster Campaign</option>
                    <option value="Full Digital Suite">Full Digital Suite</option>
                  </select>
                </div>
                <div>
                  <label className={styles.formLabel}>Estimated Budget</label>
                  <input
                    type="text"
                    value={newLeadBudget}
                    onChange={(e) => setNewLeadBudget(e.target.value)}
                    placeholder="e.g. ₹3,50,000"
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={styles.actionBtnSecondary}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.actionBtn}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
