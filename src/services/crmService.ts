/**
 * Sarql Unified CRM & Google Sheets Sync Service
 * Captures inquiries, feedback, and leads, stores them in the CRM database (localStorage),
 * and synchronizes bi-directionally with Google Sheets via Webhook.
 */

export interface InquiryData {
  id?: string;
  fullName: string;
  name?: string;
  timestamp?: string;
  phone: string;
  email: string;
  company?: string;
  scope: string;
  service?: string;
  budget?: string;
  source?: string;
  date?: string;
  time?: string;
  status?: string;
  notes?: string;
}

export interface FeedbackData {
  id?: string;
  name: string;
  roleCompany: string;
  rating: number;
  review: string;
  source?: string;
  date?: string;
  time?: string;
  timestamp?: string;
  verified?: string;
}

export const STORAGE_KEYS = {
  LEADS: 'sarql_leads',
  INQUIRIES: 'sarql_inquiries',
  REVIEWS: 'sarql_reviews',
  SHEET_URL: 'sarql_google_sheet_url',
};

// Default Google Sheet Webhook URL (Can be updated in Admin Settings)
export const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwzQxDRoJBKUndr6AzV0XAculqJGy1BR5GacR9N2YF2Oq27tMLLfVUmW1JDIIh-rvuR/exec';

/**
 * Get configured Google Sheet Webhook URL
 */
export function getGoogleSheetUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_SHEET_URL;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SHEET_URL);
    if (saved && saved.includes('AKfycbwzQxDRoJBKUndr6AzV0XAculqJGy1BR5GacR9N2YF2Oq27tMLLfVUmW1JDIIh-rvuR')) {
      return saved.trim();
    }
    localStorage.setItem(STORAGE_KEYS.SHEET_URL, DEFAULT_SHEET_URL);
    return DEFAULT_SHEET_URL;
  } catch {
    return DEFAULT_SHEET_URL;
  }
}

/**
 * Set Google Sheet Webhook URL
 */
export function setGoogleSheetUrl(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SHEET_URL, url.trim());
  } catch {}
}

/**
 * Fetch all inquiries and reviews live from the Google Sheet
 */
export async function fetchSpreadsheetData(): Promise<{
  success: boolean;
  inquiries: (InquiryData & { id: string; time: string })[];
  feedback: (FeedbackData & { id: string; time: string })[];
  sheetName?: string;
  error?: string;
}> {
  const url = getGoogleSheetUrl();
  if (!url) {
    return { success: false, inquiries: [], feedback: [], error: 'Google Sheet URL not configured' };
  }

  try {
    const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    const res = await fetch(fetchUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP status ${res.status}`);
    }

    const data = await res.json();
    if (data.status === 'success' || Array.isArray(data.inquiries)) {
      return {
        success: true,
        sheetName: data.sheetName || 'Google Sheets CRM',
        inquiries: data.inquiries || [],
        feedback: data.feedback || [],
      };
    }
    return { success: false, inquiries: [], feedback: [], error: data.error || data.message || 'Failed to read sheet' };
  } catch (err: any) {
    console.warn('Google Sheets live fetch notice:', err.message);
    return { success: false, inquiries: [], feedback: [], error: err.message };
  }
}

/**
 * Asynchronously post payload to Google Sheets Webhook
 */
export async function sendToGoogleSheets(payload: Record<string, any>): Promise<boolean> {
  const url = getGoogleSheetUrl();
  if (!url) {
    console.info('Google Sheets URL not configured yet. Payload saved to local CRM.');
    return false;
  }

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.error('Failed to post to Google Sheets webhook:', err);
    return false;
  }
}

/**
 * Delete row from Google Sheets by ID
 * Tries direct GET first (returns JSON with confirmation), falls back to POST
 */
export async function deleteFromGoogleSheets(id: string, target?: 'INQUIRY' | 'FEEDBACK' | 'LEAD'): Promise<{ success: boolean; deletedRows?: number }> {
  const url = getGoogleSheetUrl();
  if (!url) return { success: false };

  // 1. Try GET deletion
  try {
    const deleteUrl = `${url}${url.includes('?') ? '&' : '?'}action=DELETE&id=${encodeURIComponent(id)}&target=${encodeURIComponent(target || 'INQUIRY')}&_t=${Date.now()}`;
    const res = await fetch(deleteUrl, { method: 'GET', cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      console.log('Google Sheets delete response:', data);
      return { success: true, deletedRows: data.deletedRows };
    }
  } catch (err) {
    console.warn('GET delete notice, falling back to POST:', err);
  }

  // 2. Fallback POST deletion
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        type: 'DELETE',
        target: target || 'INQUIRY',
        id: id,
        timestamp: new Date().toISOString(),
      }),
    });
    return { success: true };
  } catch (err) {
    console.error('POST delete error:', err);
    return { success: false };
  }
}

/**
 * Update lead status in Google Sheets
 */
export async function updateGoogleSheetStatus(id: string, status: string, notes?: string): Promise<boolean> {
  const url = getGoogleSheetUrl();
  if (!url) return false;

  // 1. Try GET status update
  try {
    const updateUrl = `${url}${url.includes('?') ? '&' : '?'}action=UPDATE_STATUS&id=${encodeURIComponent(id)}&status=${encodeURIComponent(status)}&notes=${encodeURIComponent(notes || '')}&_t=${Date.now()}`;
    const res = await fetch(updateUrl, { method: 'GET' });
    if (res.ok) {
      return true;
    }
  } catch (err) {}

  // 2. Fallback to POST
  return sendToGoogleSheets({
    type: 'UPDATE_STATUS',
    id: id,
    status: status,
    notes: notes || '',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Submit a Project Inquiry
 */
export async function submitInquiry(data: InquiryData): Promise<{ id: string; success: boolean }> {
  const id = data.id || `INQ-${Date.now().toString().slice(-6)}`;
  const date = data.date || new Date().toISOString().slice(0, 10);
  const time = data.time || new Date().toLocaleTimeString();

  const inquiryRecord = {
    id,
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    company: data.company || 'N/A',
    scope: data.scope,
    budget: data.budget || 'Custom Scope',
    source: data.source || 'Website Contact Form',
    date,
    time,
  };

  // 1. Save to Inquiries Inbox in localStorage
  if (typeof window !== 'undefined') {
    try {
      const existingInquiries = JSON.parse(localStorage.getItem(STORAGE_KEYS.INQUIRIES) || '[]');
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify([inquiryRecord, ...existingInquiries]));

      const existingLeads = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADS) || '[]');
      const newLead = {
        id: `LEAD-${id.replace('INQ-', '')}`,
        name: data.fullName,
        company: data.company || 'Website Inquiry',
        email: data.email,
        phone: data.phone.replace(/[^0-9]/g, ''),
        service: data.scope.slice(0, 50),
        budget: data.budget || 'Pending Discussion',
        status: 'New',
        date,
        notes: `Inquiry via ${data.source || 'Website Contact Form'}: ${data.scope}`,
      };
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify([newLead, ...existingLeads]));

      window.dispatchEvent(new Event('sarql_crm_updated'));
    } catch (e) {
      console.error('Error saving inquiry locally:', e);
    }
  }

  // 2. Format safe phone string for Google Sheets with leading apostrophe to eliminate #ERROR! formula parsing
  const rawDigits = String(data.phone || '').replace(/[^0-9]/g, '');
  const safePhone = rawDigits
    ? `'${rawDigits.length >= 10 ? '+91 ' + rawDigits.slice(-10) : '+91 ' + rawDigits}`
    : 'N/A';

  // 3. Post to Google Sheets
  sendToGoogleSheets({
    type: 'INQUIRY',
    timestamp: `${date} ${time}`,
    id,
    name: data.fullName,
    phone: safePhone,
    email: data.email,
    company: data.company || 'N/A',
    service: data.scope,
    budget: data.budget || 'TBD',
    source: data.source || 'Website',
  });

  return { id, success: true };
}

/**
 * Submit Client Feedback / Review
 */
export async function submitFeedback(data: FeedbackData): Promise<{ id: string; success: boolean }> {
  const id = data.id || `REV-${Date.now().toString().slice(-6)}`;
  const date = data.date || new Date().toISOString().slice(0, 10);
  const time = data.time || new Date().toLocaleTimeString();

  const reviewRecord = {
    id,
    name: data.name,
    roleCompany: data.roleCompany,
    rating: data.rating,
    review: data.review,
    source: data.source || 'Website Review Tab',
    date,
    time,
  };

  // 1. Save to Reviews storage
  if (typeof window !== 'undefined') {
    try {
      const existingReviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS) || '[]');
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([reviewRecord, ...existingReviews]));
      window.dispatchEvent(new Event('sarql_crm_updated'));
    } catch (e) {
      console.error('Error saving review locally:', e);
    }
  }

  // 2. Post to Google Sheets
  sendToGoogleSheets({
    type: 'FEEDBACK',
    timestamp: `${date} ${time}`,
    id,
    name: data.name,
    roleCompany: data.roleCompany,
    rating: data.rating,
    review: data.review,
    source: data.source || 'Website',
  });

  return { id, success: true };
}

/**
 * Get all stored client reviews / testimonials
 */
export function getStoredReviews(): (FeedbackData & { id: string; time: string })[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Exclude any legacy dummy reviews
        return parsed.filter(
          (r: any) =>
            r &&
            r.name !== 'Ahmed Fawaz' &&
            r.name !== 'Dr. Faisal' &&
            r.name !== 'Sarah Joseph'
        );
      }
    }
  } catch (e) {
    console.error('Error reading reviews:', e);
  }
  return [];
}

/**
 * Delete a review from storage and trigger update
 */
export function deleteStoredReview(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredReviews();
    const updated = existing.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(updated));
    window.dispatchEvent(new Event('sarql_crm_updated'));
  } catch (e) {
    console.error('Error deleting review locally:', e);
  }
}

/**
 * Purge legacy mock reviews if present in localStorage
 */
export function purgeLegacyMockReviews(): void {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (r: any) =>
            r &&
            r.name !== 'Ahmed Fawaz' &&
            r.name !== 'Dr. Faisal' &&
            r.name !== 'Sarah Joseph'
        );
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(cleaned));
          window.dispatchEvent(new Event('sarql_crm_updated'));
        }
      }
    }
  } catch {}
}

/**
 * Request single-use 6-digit OTP sent to authorized Gmail
 */
export async function requestEmailOtp(email: string): Promise<{ success: boolean; message: string }> {
  const url = getGoogleSheetUrl();
  if (!url) return { success: false, message: 'Google Sheets Webhook URL not configured in settings.' };

  try {
    const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}action=SEND_OTP&email=${encodeURIComponent(email.trim().toLowerCase())}&_t=${Date.now()}`;
    const res = await fetch(fetchUrl, { method: 'GET', cache: 'no-store' });
    const data = await res.json();
    if (data && data.status === 'success') {
      return { success: true, message: data.message || `Verification code sent to ${email}` };
    }
    return { 
      success: false, 
      message: data?.message || data?.error || 'Failed to dispatch verification code. Please check Apps Script permissions.' 
    };
  } catch (err: any) {
    return { 
      success: false, 
      message: 'Connection error reaching Google Apps Script Webhook: ' + (err?.message || 'Check network connection.') 
    };
  }
}

/**
 * Verify 6-digit OTP code against Webhook
 */
export async function verifyEmailOtp(email: string, otp: string): Promise<{ success: boolean; user?: { email: string; name: string }; message?: string }> {
  const url = getGoogleSheetUrl();
  if (!url) return { success: false, message: 'Webhook not configured.' };

  const cleanOtp = String(otp || '').trim();
  if (!cleanOtp || cleanOtp.length !== 6) {
    return { success: false, message: 'Please enter the complete 6-digit verification code.' };
  }

  try {
    const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}action=VERIFY_OTP&email=${encodeURIComponent(email.trim().toLowerCase())}&otp=${encodeURIComponent(cleanOtp)}&_t=${Date.now()}`;
    const res = await fetch(fetchUrl, { method: 'GET', cache: 'no-store' });
    const data = await res.json();
    if (data && data.status === 'success') {
      return {
        success: true,
        user: data.user || { email: email.trim().toLowerCase(), name: email.split('@')[0].toUpperCase() },
        message: 'Verification successful.',
      };
    }
    return { 
      success: false, 
      message: data?.message || 'Incorrect verification code. Please check your email and try again.' 
    };
  } catch (err: any) {
    return { 
      success: false, 
      message: 'Failed to communicate with verification gateway: ' + (err?.message || 'Network error') 
    };
  }
}
