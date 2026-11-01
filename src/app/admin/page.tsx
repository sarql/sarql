'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './Admin.module.css';
import {
  getGoogleSheetUrl,
  setGoogleSheetUrl,
  sendToGoogleSheets,
  fetchSpreadsheetData,
  deleteFromGoogleSheets,
  updateGoogleSheetStatus,
  requestEmailOtp,
  verifyEmailOtp,
  STORAGE_KEYS,
  InquiryData,
  FeedbackData,
} from '@/services/crmService';
import {
  getPortfolioCategories,
  savePortfolioCategories,
  toggleCategoryVisibility,
  addCustomCategory,
  deleteCategory,
  getAllPortfolioProjects,
  addPortfolioProject,
  deletePortfolioProject,
  PortfolioCategory,
  PortfolioProject,
} from '@/services/portfolioService';

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
  'team.sarql@gmail.com',
];

/* ------------------------------------------------------------- Initial Seed Leads */
const INITIAL_LEADS: Lead[] = [];
const INITIAL_INQUIRIES: (InquiryData & { id: string; time: string })[] = [];
const INITIAL_REVIEWS: (FeedbackData & { id: string; time: string })[] = [];

const GOOGLE_APPS_SCRIPT_SAMPLE = `/**
 * =========================================================================
 * SARQL DIGITAL - UNIFIED CRM & INQUIRIES GOOGLE APPS SCRIPT WEBHOOK
 * =========================================================================
 * Target Spreadsheet: Sarql Inquiries & CRM
 * Spreadsheet ID: 1S0Tn0skJBJH9tnGkFn73WQJ94Iypd0Ytm7ca4bma8FA
 * 
 * Features:
 * 1. doGet:
 *    - ?action=DELETE&id=... : Instant reliable row deletion via GET
 *    - Default: Returns all Project Inquiries and Client Reviews as JSON
 * 2. doPost:
 *    - DELETE / DELETE_INQUIRY / DELETE_FEEDBACK / DELETE_LEAD: Deletes row matching ID
 *    - UPDATE_STATUS: Updates lead status in "Project Inquiries"
 *    - FEEDBACK / REVIEW: Appends new review to "Client Feedback"
 *    - TEST: Verifies connectivity
 *    - INQUIRY / LEAD: Appends new lead to "Project Inquiries"
 * =========================================================================
 */

var TARGET_SPREADSHEET_ID = "1S0Tn0skJBJH9tnGkFn73WQJ94Iypd0Ytm7ca4bma8FA";

function getSpreadsheet() {
  try {
    if (TARGET_SPREADSHEET_ID && TARGET_SPREADSHEET_ID.trim() !== "") {
      return SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
    }
  } catch (err) {
    Logger.log("openById error: " + err);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Handle GET requests - Read inquiries & feedback, or handle direct GET deletion
 */
function doGet(e) {
  try {
    var ss = getSpreadsheet();
    if (!ss) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "error", message: "Spreadsheet not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var params = (e && e.parameter) || {};
    var action = String(params.action || params.type || "").toUpperCase();

    // Direct deletion via GET (Fastest, zero CORS issues, follows redirect cleanly)
    if (action === "DELETE" || action === "DELETE_INQUIRY" || action === "DELETE_FEEDBACK" || action === "DELETE_LEAD") {
      return handleDeleteRequest(ss, params);
    }

    // Direct status update via GET
    if (action === "UPDATE_STATUS") {
      return handleUpdateStatusRequest(ss, params);
    }

    // OTP Email Security Authentication via GET
    if (action === "SEND_OTP") {
      return handleSendOtp(params);
    }
    if (action === "VERIFY_OTP") {
      return handleVerifyOtp(params);
    }

    var inquiries = [];
    var feedback = [];

    // 1. Fetch Project Inquiries (checks "Project Inquiries", or first sheet as fallback)
    var inqSheet = ss.getSheetByName("Project Inquiries") || ss.getSheets()[0];
    if (inqSheet && inqSheet.getLastRow() > 1) {
      var inqData = inqSheet.getDataRange().getValues();
      for (var i = 1; i < inqData.length; i++) {
        var row = inqData[i];
        if (!row[1] && !row[2] && !row[4]) continue; // Skip empty rows

        var rawTs = row[0];
        var dateStr = "";
        var timeStr = "";
        if (rawTs instanceof Date) {
          dateStr = Utilities.formatDate(rawTs, Session.getScriptTimeZone(), "yyyy-MM-dd");
          timeStr = Utilities.formatDate(rawTs, Session.getScriptTimeZone(), "HH:mm");
        } else if (rawTs) {
          var parts = String(rawTs).split(" ");
          dateStr = parts[0] || "";
          timeStr = parts.slice(1).join(" ") || "";
        }

        inquiries.push({
          id: String(row[1] || ("INQ-" + i)).trim(),
          timestamp: String(row[0] || ""),
          date: dateStr,
          time: timeStr,
          fullName: String(row[2] || "Anonymous"),
          name: String(row[2] || "Anonymous"),
          phone: String(row[3] || "N/A"),
          email: String(row[4] || "N/A"),
          company: String(row[5] || ""),
          scope: String(row[6] || "General Inquiry"),
          service: String(row[6] || "General Inquiry"),
          budget: String(row[7] || "Custom"),
          source: String(row[8] || "Website"),
          status: String(row[9] || "New"),
          notes: String(row[10] || "")
        });
      }
    }

    // 2. Fetch Client Feedback
    var feedSheet = ss.getSheetByName("Client Feedback");
    if (feedSheet && feedSheet.getLastRow() > 1) {
      var feedData = feedSheet.getDataRange().getValues();
      for (var j = 1; j < feedData.length; j++) {
        var fRow = feedData[j];
        if (!fRow[1] && !fRow[2] && !fRow[5]) continue; // Skip empty rows

        var fRawTs = fRow[0];
        var fDateStr = "";
        var fTimeStr = "";
        if (fRawTs instanceof Date) {
          fDateStr = Utilities.formatDate(fRawTs, Session.getScriptTimeZone(), "yyyy-MM-dd");
          fTimeStr = Utilities.formatDate(fRawTs, Session.getScriptTimeZone(), "HH:mm");
        } else if (fRawTs) {
          var fParts = String(fRawTs).split(" ");
          fDateStr = fParts[0] || "";
          fTimeStr = fParts.slice(1).join(" ") || "";
        }

        var starRating = 5;
        var parsedRating = parseInt(String(fRow[4] || "").replace(/[^0-9]/g, ""));
        if (!isNaN(parsedRating) && parsedRating > 0) {
          starRating = Math.min(5, parsedRating);
        }

        feedback.push({
          id: String(fRow[1] || ("REV-" + j)).trim(),
          timestamp: String(fRow[0] || ""),
          date: fDateStr,
          time: fTimeStr,
          name: String(fRow[2] || "Anonymous"),
          roleCompany: String(fRow[3] || "Client"),
          rating: starRating,
          review: String(fRow[5] || ""),
          source: String(fRow[6] || "Website Review Tab"),
          verified: String(fRow[7] || "Pending Verification")
        });
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        sheetName: ss.getName(),
        inquiries: inquiries,
        feedback: feedback,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests - Create, Delete, Update
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var rawData = e.postData ? e.postData.contents : "";
    var data = {};
    if (rawData) {
      try {
        data = JSON.parse(rawData);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    var ss = getSpreadsheet();
    var submissionType = (data.type || data.action || "INQUIRY").toUpperCase();

    // 1. DELETE ACTION
    if (submissionType === "DELETE" || submissionType === "DELETE_INQUIRY" || submissionType === "DELETE_FEEDBACK" || submissionType === "DELETE_LEAD") {
      return handleDeleteRequest(ss, data);
    }

    // OTP Email Security Authentication via POST
    if (submissionType === "SEND_OTP") {
      return handleSendOtp(data);
    }
    if (submissionType === "VERIFY_OTP") {
      return handleVerifyOtp(data);
    }

    // 2. STATUS UPDATE ACTION
    if (submissionType === "UPDATE_STATUS") {
      return handleUpdateStatusRequest(ss, data);
    }

    // 3. TEST CONNECTIVITY
    if (submissionType === "TEST") {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          status: "success", 
          message: "Connected to " + ss.getName(),
          sheetName: ss.getName()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. FEEDBACK / REVIEW
    if (submissionType === "FEEDBACK" || submissionType === "REVIEW") {
      handleFeedbackSubmission(ss, data);
      return ContentService
        .createTextOutput(JSON.stringify({ 
          status: "success", 
          message: "Review saved to Google Sheet",
          timestamp: new Date() 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 5. INQUIRY / LEAD (Default)
    handleInquirySubmission(ss, data);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Inquiry logged to Google Sheets CRM successfully",
        timestamp: new Date() 
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * Universal Row Deletion by ID (checks Project Inquiries, Client Feedback, and all tabs)
 */
function handleDeleteRequest(ss, data) {
  var targetId = String(data.id || "").trim();
  if (!targetId) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "No target ID provided for deletion" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var deletedCount = 0;
  var targetType = String(data.target || "").toUpperCase();

  function isMatch(cellId, testId) {
    if (!cellId) return false;
    var c = String(cellId).trim().toLowerCase();
    var t = String(testId).trim().toLowerCase();
    if (c === t) return true;
    if (t.indexOf("lead-") === 0 && c === "inq-" + t.slice(5)) return true;
    if (t.indexOf("inq-") === 0 && c === "lead-" + t.slice(4)) return true;
    return false;
  }

  // 1. Search in Project Inquiries
  if (targetType !== "FEEDBACK" && targetType !== "REVIEW") {
    var inqSheet = ss.getSheetByName("Project Inquiries");
    if (inqSheet && inqSheet.getLastRow() > 1) {
      var inqData = inqSheet.getDataRange().getValues();
      for (var i = inqData.length - 1; i >= 1; i--) {
        var rowId = inqData[i][1];
        var colA = inqData[i][0];
        
        if (isMatch(rowId, targetId) || isMatch(colA, targetId) || (colA && String(colA).indexOf(targetId) !== -1)) {
          inqSheet.deleteRow(i + 1);
          deletedCount++;
        }
      }
    }
  }

  // 2. Search in Client Feedback
  if (targetType !== "INQUIRY" && targetType !== "LEAD") {
    var feedSheet = ss.getSheetByName("Client Feedback");
    if (feedSheet && feedSheet.getLastRow() > 1) {
      var feedData = feedSheet.getDataRange().getValues();
      for (var j = feedData.length - 1; j >= 1; j--) {
        var revId = feedData[j][1];
        if (isMatch(revId, targetId)) {
          feedSheet.deleteRow(j + 1);
          deletedCount++;
        }
      }
    }
  }

  // 3. Fallback: Search all sheets in workbook if not yet deleted
  if (deletedCount === 0) {
    var allSheets = ss.getSheets();
    for (var sIdx = 0; sIdx < allSheets.length; sIdx++) {
      var s = allSheets[sIdx];
      if (s.getLastRow() > 1) {
        var sData = s.getDataRange().getValues();
        for (var r = sData.length - 1; r >= 1; r--) {
          var valB = sData[r][1];
          var valA = sData[r][0];
          if (isMatch(valB, targetId) || isMatch(valA, targetId) || (valA && String(valA).indexOf(targetId) !== -1)) {
            s.deleteRow(r + 1);
            deletedCount++;
          }
        }
      }
      if (deletedCount > 0) break;
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({
      status: "success",
      action: "DELETE",
      id: targetId,
      deletedRows: deletedCount,
      message: deletedCount > 0 ? "Deleted " + deletedCount + " row(s) from Google Sheets" : "No matching row found in Google Sheet"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Update lead status in Project Inquiries
 */
function handleUpdateStatusRequest(ss, data) {
  var targetId = String(data.id || "").trim();
  var newStatus = String(data.status || "In Discussion").trim();
  var inqSheet = ss.getSheetByName("Project Inquiries") || ss.getSheets()[0];

  if (inqSheet && inqSheet.getLastRow() > 1) {
    var inqData = inqSheet.getDataRange().getValues();
    for (var i = 1; i < inqData.length; i++) {
      var rowId = String(inqData[i][1] || "").trim().toLowerCase();
      var tId = targetId.toLowerCase();
      var match = (rowId === tId) ||
                  (tId.indexOf("lead-") === 0 && rowId === "inq-" + tId.slice(5)) ||
                  (tId.indexOf("inq-") === 0 && rowId === "lead-" + tId.slice(4));
      
      if (match) {
        inqSheet.getRange(i + 1, 10).setValue(newStatus);
        if (data.notes) {
          inqSheet.getRange(i + 1, 11).setValue(data.notes);
        }
        return ContentService
          .createTextOutput(JSON.stringify({ status: "success", action: "UPDATE_STATUS", id: targetId, newStatus: newStatus }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "not_found", message: "Inquiry ID not found in sheet" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ONE-TIME AUTHORIZATION FUNCTION
 * In Google Apps Script Editor:
 * 1. Select "authorizeEmailPermissions" in the function dropdown at top.
 * 2. Click "Run".
 * 3. A popup will say "Authorization required" -> Click "Review permissions".
 * 4. Choose your Google account (team.sarql@gmail.com).
 * 5. Click "Advanced" -> Click "Go to Sarql CRM (unsafe)".
 * 6. Click "Allow".
 * 7. Deploy > Manage deployments > Edit > New Version > Deploy.
 */
function authorizeEmailPermissions() {
  var userEmail = Session.getActiveUser().getEmail() || "team.sarql@gmail.com";
  Logger.log("Testing email authorization for: " + userEmail);
  try {
    GmailApp.sendEmail(userEmail, "Sarql Gateway Authorization", "Google Apps Script email permissions are now fully active!");
    Logger.log("SUCCESS: GmailApp authorization granted!");
  } catch (e1) {
    Logger.log("GmailApp error: " + e1);
    try {
      MailApp.sendEmail(userEmail, "Sarql Gateway Authorization", "Google Apps Script email permissions are now fully active!");
      Logger.log("SUCCESS: MailApp authorization granted!");
    } catch (e2) {
      Logger.log("MailApp error: " + e2);
    }
  }
}

/**
 * Handle OTP Verification Request via GET/POST
 */
function handleSendOtp(params) {
  var email = String(params.email || "").trim().toLowerCase();
  if (!email || email.indexOf("@") === -1) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Valid email address required." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Generate secure 6-digit OTP
  var otp = ("000000" + Math.floor(Math.random() * 1000000)).slice(-6);
  var expiresAt = new Date().getTime() + (10 * 60 * 1000); // 10 minutes

  // Store in PropertiesService
  var props = PropertiesService.getScriptProperties();
  props.setProperty("OTP_" + email, JSON.stringify({ otp: otp, expiresAt: expiresAt }));

  var subject = "Sarql Admin Security: Your One-Time Login Code is " + otp;
  var htmlBody = "<div style='font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #eaeaea;border-radius:12px;background:#ffffff;'>" +
    "<h2 style='margin:0 0 12px;color:#111111;font-size:20px;'>Sarql Digital Administrative Access</h2>" +
    "<p style='color:#555555;font-size:14px;line-height:1.5;margin-bottom:20px;'>A login attempt was initiated for your authorized Sarql Admin account (<strong>" + email + "</strong>).</p>" +
    "<div style='background:#f4f4f5;padding:16px 24px;border-radius:8px;text-align:center;margin-bottom:20px;'>" +
    "<span style='font-family:monospace;font-size:32px;font-weight:700;letter-spacing:6px;color:#000000;'>" + otp + "</span>" +
    "</div>" +
    "<p style='color:#888888;font-size:12px;margin:0;'>This verification code is single-use and will expire in 10 minutes.<br>If you did not request this login code, your account remains secure — please ignore this email.</p>" +
    "</div>";

  var emailDispatched = false;
  var errDetail = "";

  try {
    GmailApp.sendEmail(email, subject, "Your Sarql Admin verification code is " + otp + ". It expires in 10 minutes.", {
      name: "Sarql Security Gateway",
      htmlBody: htmlBody
    });
    emailDispatched = true;
  } catch (gErr) {
    Logger.log("GmailApp failed: " + gErr);
    errDetail = String(gErr);
    try {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        body: "Your Sarql Admin verification code is " + otp + ". It expires in 10 minutes.",
        htmlBody: htmlBody,
        name: "Sarql Security Gateway"
      });
      emailDispatched = true;
    } catch (mErr) {
      Logger.log("MailApp failed: " + mErr);
      errDetail = String(mErr);
    }
  }

  if (emailDispatched) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "A 6-digit verification code has been dispatched to " + email + ". Check your inbox."
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "Apps Script permission required: " + errDetail + ". Please run authorizeEmailPermissions() in the Apps Script editor once."
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleVerifyOtp(params) {
  var email = String(params.email || "").trim().toLowerCase();
  var inputOtp = String(params.otp || "").trim();

  if (!email || !inputOtp) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Email and verification code are required." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var props = PropertiesService.getScriptProperties();
  var storedRaw = props.getProperty("OTP_" + email);

  if (!storedRaw) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "No active verification code found or code expired. Please request a new code." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var stored = JSON.parse(storedRaw);
    var now = new Date().getTime();

    if (now > stored.expiresAt) {
      props.deleteProperty("OTP_" + email);
      return ContentService
        .createTextOutput(JSON.stringify({ status: "error", message: "Verification code has expired. Please request a new one." }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (stored.otp !== inputOtp) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "error", message: "Incorrect verification code. Please check your email and try again." }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Success! Invalidate OTP so it cannot be re-used
    props.deleteProperty("OTP_" + email);

    // Create session payload
    var sessionToken = Utilities.base64Encode(email + ":" + now + ":" + Utilities.getUuid());

    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Verification successful.",
        token: sessionToken,
        user: {
          email: email,
          name: email.split("@")[0].toUpperCase()
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Verification error: " + e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleInquirySubmission(ss, data) {
  var sheetName = "Project Inquiries";
  var sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headers = [
      "Timestamp",
      "Inquiry ID",
      "Client Name",
      "Phone Number",
      "Email Address",
      "Company / Brand",
      "Requested Service / Scope",
      "Budget Estimate",
      "Lead Source",
      "Lead Status",
      "Notes / Follow-up"
    ];
    
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#111111");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 35);
  }

  var timestamp = data.timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  var id = data.id || "INQ-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyMMddHHmmss");
  var name = data.name || data.fullName || "Anonymous";
  var rawDigits = String(data.phone || "").replace(/[^0-9]/g, "");
  var phone = rawDigits ? "'" + (rawDigits.length >= 10 ? "+91 " + rawDigits.slice(-10) : "+91 " + rawDigits) : "N/A";
  var email = data.email || "N/A";
  var company = data.company || "N/A";
  var service = data.service || data.scope || "General Inquiry";
  var budget = data.budget || "Custom";
  var source = data.source || "Website Contact Form";
  var status = data.status || "New";
  var notes = data.notes || "";

  sheet.appendRow([
    timestamp,
    id,
    name,
    phone,
    email,
    company,
    service,
    budget,
    source,
    status,
    notes
  ]);

  try { sheet.autoResizeColumns(1, 11); } catch (e) {}
}

function handleFeedbackSubmission(ss, data) {
  var sheetName = "Client Feedback";
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headers = [
      "Timestamp",
      "Review ID",
      "Client Name",
      "Role & Company",
      "Rating (Stars)",
      "Review / Feedback Message",
      "Source",
      "Verified Status"
    ];
    
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1E293B");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 35);
  }

  var timestamp = data.timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  var id = data.id || "REV-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyMMddHHmmss");
  var name = data.name || "Anonymous";
  var roleCompany = data.roleCompany || "Client";
  var rating = data.rating ? data.rating + " / 5 Stars" : "5 / 5 Stars";
  var review = data.review || data.message || "";
  var source = data.source || "Website Feedback Form";
  var verified = "Pending Verification";

  sheet.appendRow([
    timestamp,
    id,
    name,
    roleCompany,
    rating,
    review,
    source,
    verified
  ]);

  try { sheet.autoResizeColumns(1, 8); } catch (e) {}
}
`;

export default function AdminPage() {
  /* ----------------------------------------------------------- Auth State */
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; loginTime?: number } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authStep, setAuthStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(0);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  /* ----------------------------------------------------------- Dashboard State */
  const [activeTab, setActiveTab] = useState<'overview' | 'crm' | 'drive' | 'settings'>('overview');
  const [crmSubTab, setCrmSubTab] = useState<'leads' | 'inquiries' | 'feedback'>('leads');
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [inquiries, setInquiries] = useState<(InquiryData & { id: string; time: string })[]>(INITIAL_INQUIRIES);
  const [reviews, setReviews] = useState<(FeedbackData & { id: string; time: string })[]>(INITIAL_REVIEWS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New review form
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRole, setNewReviewRole] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');

  // Google Sheets integration state
  const [sheetUrlInput, setSheetUrlInput] = useState('https://script.google.com/macros/s/AKfycbwzQxDRoJBKUndr6AzV0XAculqJGy1BR5GacR9N2YF2Oq27tMLLfVUmW1JDIIh-rvuR/exec');
  const [sheetSaveStatus, setSheetSaveStatus] = useState<string | null>(null);
  const [isTestingSheet, setIsTestingSheet] = useState(false);
  const [sheetTestFeedback, setSheetTestFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isScriptCopied, setIsScriptCopied] = useState(false);

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
      email: 'team.sarql@gmail.com',
      action: 'Google SSO Authentication',
      status: 'SUCCESS',
    },
  ]);

  /* ----------------------------------------------------------- Portfolio Management State */
  const [portfolioCategories, setPortfolioCategories] = useState<PortfolioCategory[]>(() => getPortfolioCategories());
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>(() => getAllPortfolioProjects());
  const [selectedPortfolioCat, setSelectedPortfolioCat] = useState<string>('All');
  const [portfolioSearchQuery, setPortfolioSearchQuery] = useState<string>('');
  const [portfolioPage, setPortfolioPage] = useState<number>(1);
  const [newCatInput, setNewCatInput] = useState<string>('');

  // Upload Project Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Posters');
  const [uploadSubCategory, setUploadSubCategory] = useState('Visual Design');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadDriveId, setUploadDriveId] = useState('');
  const [uploadImageFile, setUploadImageFile] = useState<string | null>(null);
  const [portfolioToast, setPortfolioToast] = useState<string | null>(null);

  const refreshPortfolioData = () => {
    setPortfolioCategories(getPortfolioCategories());
    setPortfolioProjects(getAllPortfolioProjects());
  };

  const handleToggleCategory = (catName: string, enabled: boolean) => {
    const updated = toggleCategoryVisibility(catName, enabled);
    setPortfolioCategories(updated);
    setPortfolioToast(`Section "${catName}" is now ${enabled ? 'VISIBLE' : 'HIDDEN'} on portfolio.`);
    setTimeout(() => setPortfolioToast(null), 3500);
  };

  const handleHideAllEmptyCategories = () => {
    const counts: Record<string, number> = {};
    portfolioCategories.forEach((c) => (counts[c.name.toLowerCase()] = 0));
    portfolioProjects.forEach((p) => {
      const k = p.category.toLowerCase();
      counts[k] = (counts[k] || 0) + 1;
    });

    const updated = portfolioCategories.map((c) => {
      const cnt = counts[c.name.toLowerCase()] || 0;
      return { ...c, enabled: cnt > 0 };
    });
    savePortfolioCategories(updated);
    setPortfolioCategories(updated);
    setPortfolioToast('All empty sections (0 items) are now hidden from portfolio.');
    setTimeout(() => setPortfolioToast(null), 3500);
  };

  const handleShowAllCategories = () => {
    const updated = portfolioCategories.map((c) => ({ ...c, enabled: true }));
    savePortfolioCategories(updated);
    setPortfolioCategories(updated);
    setPortfolioToast('All sections are now visible on portfolio.');
    setTimeout(() => setPortfolioToast(null), 3500);
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    const updated = addCustomCategory(newCatInput.trim());
    setPortfolioCategories(updated);
    setNewCatInput('');
    setPortfolioToast(`Section "${newCatInput.trim()}" added successfully.`);
    setTimeout(() => setPortfolioToast(null), 3500);
  };

  const handleDeleteCategoryClick = (catName: string) => {
    if (confirm(`Remove section "${catName}"?`)) {
      const updated = deleteCategory(catName);
      setPortfolioCategories(updated);
      setPortfolioToast(`Section "${catName}" removed.`);
      setTimeout(() => setPortfolioToast(null), 3500);
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadImageFile(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      alert('Please enter a project title.');
      return;
    }
    if (!uploadImageFile && !uploadDriveId.trim()) {
      alert('Please upload an image file or provide a Google Drive ID / Image URL.');
      return;
    }

    let finalImageUrl = uploadImageFile || '';
    let finalDriveId = '';

    if (uploadDriveId.trim()) {
      const trimmed = uploadDriveId.trim();
      if (trimmed.startsWith('http')) {
        finalImageUrl = trimmed;
      } else {
        finalDriveId = trimmed;
      }
    }

    addPortfolioProject({
      title: uploadTitle.trim(),
      category: uploadCategory,
      subCategory: uploadSubCategory.trim() || 'Visual Design',
      url: uploadUrl.trim() || undefined,
      imageUrl: finalImageUrl || undefined,
      driveId: finalDriveId || undefined,
      desc: `Client artwork: ${uploadTitle.trim()}`,
      tags: [uploadCategory, 'Sarql Upload', 'Verified'],
    });

    setPortfolioProjects(getAllPortfolioProjects());
    setIsUploadModalOpen(false);
    setUploadTitle('');
    setUploadSubCategory('Visual Design');
    setUploadUrl('');
    setUploadDriveId('');
    setUploadImageFile(null);
    setPortfolioToast(`"${uploadTitle.trim()}" uploaded and published to ${uploadCategory}!`);
    setTimeout(() => setPortfolioToast(null), 4500);
  };

  const handleDeleteProjectClick = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}" from the portfolio?`)) {
      deletePortfolioProject(id);
      setPortfolioProjects(getAllPortfolioProjects());
      setPortfolioToast(`Deleted "${title}" from portfolio.`);
      setTimeout(() => setPortfolioToast(null), 3500);
    }
  };

  const filteredPortfolioProjects = useMemo(() => {
    let list = portfolioProjects;
    if (selectedPortfolioCat !== 'All') {
      list = list.filter((p) => p.category.toLowerCase() === selectedPortfolioCat.toLowerCase());
    }
    if (portfolioSearchQuery.trim()) {
      const q = portfolioSearchQuery.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q))
      );
    }
    return list;
  }, [portfolioProjects, selectedPortfolioCat, portfolioSearchQuery]);

  const PORTFOLIO_PAGE_SIZE = 24;
  const totalPortfolioPages = Math.max(1, Math.ceil(filteredPortfolioProjects.length / PORTFOLIO_PAGE_SIZE));
  const paginatedProjects = useMemo(() => {
    const start = (portfolioPage - 1) * PORTFOLIO_PAGE_SIZE;
    return filteredPortfolioProjects.slice(start, start + PORTFOLIO_PAGE_SIZE);
  }, [filteredPortfolioProjects, portfolioPage]);

  // Synchronize live data directly from Google Sheets
  const syncFromGoogleSheets = async (showToast = false) => {
    setIsSyncing(true);
    try {
      const res = await fetchSpreadsheetData();
      if (res.success) {
        if (res.inquiries && Array.isArray(res.inquiries)) {
          setInquiries(res.inquiries);
          try { localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(res.inquiries)); } catch {}

          const mappedLeads: Lead[] = res.inquiries.map((inq, idx) => {
            const cleanId = inq.id || `INQ-${idx + 1}`;
            const cleanPhone = (inq.phone && inq.phone !== '#ERROR!') ? inq.phone : 'N/A';
            return {
              id: cleanId,
              name: inq.fullName || inq.name || 'Anonymous',
              company: inq.company || 'Website Inquiry',
              email: inq.email || 'N/A',
              phone: cleanPhone,
              service: inq.scope || inq.service || 'Web Platform',
              budget: inq.budget || 'Custom Scope',
              status: (['New', 'In Discussion', 'Proposal Sent', 'Won / Closed', 'Delivered'].includes(inq.status || '') ? inq.status : 'New') as Lead['status'],
              date: inq.date || (inq.timestamp ? inq.timestamp.slice(0, 10) : new Date().toISOString().slice(0, 10)),
              notes: inq.notes || `Source: ${inq.source || 'Website'}`,
            };
          });
          setLeads(mappedLeads);
          try { localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(mappedLeads)); } catch {}
        }

        if (res.feedback && Array.isArray(res.feedback)) {
          setReviews(res.feedback);
          try { localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(res.feedback)); } catch {}
        }

        if (showToast) {
          setSyncNotice('✓ Synced with Google Sheets');
          setTimeout(() => setSyncNotice(null), 3000);
        }
      } else if (showToast && res.error) {
        setSyncNotice(`Notice: ${res.error}`);
        setTimeout(() => setSyncNotice(null), 4000);
      }
    } catch (err: any) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync state loader
  const loadCrmData = () => {
    try {
      const savedUser = localStorage.getItem('sarql_admin_user');
      if (savedUser) {
        try {
          const userObj = JSON.parse(savedUser);
          const savedWhitelist = localStorage.getItem('sarql_whitelist');
          const currentWhitelist = savedWhitelist ? JSON.parse(savedWhitelist) : DEFAULT_WHITELIST;
          const userEmail = String(userObj?.email || '').trim().toLowerCase();
          const isAllowed = userEmail && (
            userEmail === 'team.sarql@gmail.com' ||
            (Array.isArray(currentWhitelist) && currentWhitelist.map((w: string) => w.toLowerCase()).includes(userEmail))
          );

          // Once verified, session stays active until the user clicks Sign Out
          if (isAllowed) {
            setCurrentUser(userObj);
          } else {
            localStorage.removeItem('sarql_admin_user');
            setCurrentUser(null);
          }
        } catch {
          localStorage.removeItem('sarql_admin_user');
          setCurrentUser(null);
        }
      }

      const savedLeads = localStorage.getItem(STORAGE_KEYS.LEADS);
      if (savedLeads) {
        try {
          const parsed = JSON.parse(savedLeads);
          // Purge legacy mock data if present
          const hasLegacyMock = Array.isArray(parsed) && parsed.some((l: any) => l.name === 'Dr. Aisha Rahman' || l.name === 'Rahul Varma' || l.company === 'UK Xpress Global');
          if (hasLegacyMock) {
            localStorage.removeItem(STORAGE_KEYS.LEADS);
            localStorage.removeItem(STORAGE_KEYS.INQUIRIES);
          } else if (Array.isArray(parsed) && parsed.length > 0) {
            setLeads(parsed);
          }
        } catch {}
      }

      const savedInquiries = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
      if (savedInquiries) {
        try {
          const parsed = JSON.parse(savedInquiries);
          if (Array.isArray(parsed) && parsed.length > 0) setInquiries(parsed);
        } catch {}
      }

      const savedReviews = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (savedReviews) {
        try {
          const parsed = JSON.parse(savedReviews);
          if (Array.isArray(parsed) && parsed.length > 0) setReviews(parsed);
        } catch {}
      }

      const savedWhitelist = localStorage.getItem('sarql_whitelist');
      if (savedWhitelist) setWhitelist(JSON.parse(savedWhitelist));

      const savedLogs = localStorage.getItem('sarql_audit_logs');
      if (savedLogs) setAuditLogs(JSON.parse(savedLogs));

      const savedSheetUrl = getGoogleSheetUrl();
      if (savedSheetUrl) setSheetUrlInput(savedSheetUrl);

      // Refresh portfolio items and categories
      refreshPortfolioData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    loadCrmData();
    syncFromGoogleSheets(false);

    // Auto-sync with Google Sheet every 8 seconds so sheet edits appear automatically
    const pollInterval = setInterval(() => {
      syncFromGoogleSheets(false);
    }, 8000);

    // Listen for real-time inquiry and feedback events from website forms
    const handleStorageUpdate = () => {
      loadCrmData();
      syncFromGoogleSheets(false);
    };

    window.addEventListener('sarql_crm_updated', handleStorageUpdate);
    window.addEventListener('sarql_portfolio_updated', refreshPortfolioData);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('sarql_crm_updated', handleStorageUpdate);
      window.removeEventListener('sarql_portfolio_updated', refreshPortfolioData);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Save leads on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
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

  const handleSendLoginCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid administrator email address.');
      return;
    }

    // Strict Whitelist Access Verification: only authorized emails can request login codes
    const isAllowed =
      cleanEmail === 'team.sarql@gmail.com' ||
      whitelist.map((w) => w.toLowerCase()).includes(cleanEmail);

    if (!isAllowed) {
      logAudit(cleanEmail, 'Unauthorized Admin Access Blocked', 'DENIED');
      setAuthError(`Access Denied: The account "${cleanEmail}" is not authorized. Entry is strictly restricted to verified Sarql administrators.`);
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await requestEmailOtp(cleanEmail);
      if (res.success) {
        setAuthStep('OTP');
        setResendTimer(60);
        setAuthSuccessMsg(res.message || `A 6-digit verification code has been dispatched to ${cleanEmail}.`);
        setOtpInput('');
      } else {
        setAuthError(res.message || 'Failed to dispatch verification code. Please check your network connection.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Security gateway connection error.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanOtp = otpInput.trim();

    if (cleanOtp.length !== 6) {
      setAuthError('Please enter the full 6-digit verification code sent to your email.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await verifyEmailOtp(cleanEmail, cleanOtp);
      if (res.success && res.user) {
        const userObj = {
          email: cleanEmail,
          name: res.user.name || cleanEmail.split('@')[0].toUpperCase(),
          loginTime: Date.now(),
        };
        setCurrentUser(userObj);
        try {
          localStorage.setItem('sarql_admin_user', JSON.stringify(userObj));
        } catch {}
        logAudit(cleanEmail, 'Verified Two-Factor Email OTP Sign-in', 'SUCCESS');
        setAuthStep('EMAIL');
        setOtpInput('');
        setEmailInput('');
      } else {
        setAuthError(res.message || 'Incorrect or expired verification code. Please check your inbox.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to connect to verification gateway.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('sarql_admin_user');
    } catch {}
    setAuthStep('EMAIL');
    setEmailInput('');
    setOtpInput('');
    setAuthError(null);
    setAuthSuccessMsg(null);
  };

  /* ----------------------------------------------------------- Google Sheets Handlers */
  const handleSaveSheetUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleSheetUrl(sheetUrlInput);
    setSheetSaveStatus('✓ Google Sheet Webhook URL saved successfully!');
    setTimeout(() => setSheetSaveStatus(null), 4000);
  };

  const handleTestSheetConnection = async () => {
    if (!sheetUrlInput) {
      setSheetTestFeedback({ success: false, message: 'Please enter a Google Apps Script Web App URL first.' });
      return;
    }
    setIsTestingSheet(true);
    setSheetTestFeedback(null);

    try {
      // Save URL first
      setGoogleSheetUrl(sheetUrlInput);

      await sendToGoogleSheets({
        type: 'TEST',
        timestamp: new Date().toISOString(),
        id: 'TEST-PING',
        name: 'Sarql Admin Test Connection',
        email: currentUser?.email || 'team.sarql@gmail.com',
        source: 'Admin Settings Test',
      });

      setSheetTestFeedback({
        success: true,
        message: '✓ Connection Test Sent! Verified Google Sheets Webhook responds without errors.',
      });
    } catch (err: any) {
      setSheetTestFeedback({
        success: false,
        message: `Connection failed: ${err.message || 'Check Apps Script deployment permissions.'}`,
      });
    } finally {
      setIsTestingSheet(false);
    }
  };

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SAMPLE);
    setIsScriptCopied(true);
    setTimeout(() => setIsScriptCopied(false), 3000);
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

    setNewLeadName('');
    setNewLeadCompany('');
    setNewLeadEmail('');
    setNewLeadPhone('');
  };

  const updateLeadStatus = async (id: string, newStatus: Lead['status']) => {
    setLeads(leads.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    try {
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads.map((l) => (l.id === id ? { ...l, status: newStatus } : l))));
    } catch {}
    // Sync status to Google Sheet
    await updateGoogleSheetStatus(id, newStatus);
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead from Google Sheet?')) return;
    setDeletingId(id);
    setSyncNotice('Deleting from Google Sheet...');
    try {
      const res = await deleteFromGoogleSheets(id, 'LEAD');
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setInquiries((prev) => prev.filter((inq) => inq.id !== id));
      try {
        const remaining = leads.filter((l) => l.id !== id);
        localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(remaining));
      } catch {}

      if (res && res.deletedRows && res.deletedRows > 0) {
        setSyncNotice(`✓ Row deleted from Google Sheet (${res.deletedRows} row removed)`);
      } else {
        setSyncNotice('✓ Row removed from Google Sheet');
      }
    } catch (e: any) {
      alert('Delete error: ' + (e.message || e));
    } finally {
      setDeletingId(null);
      setTimeout(() => setSyncNotice(null), 3500);
      syncFromGoogleSheets(false);
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm('Delete this inquiry from Google Sheet?')) return;
    setDeletingId(id);
    setSyncNotice('Deleting from Google Sheet...');
    try {
      const res = await deleteFromGoogleSheets(id, 'INQUIRY');
      setInquiries((prev) => prev.filter((inq) => inq.id !== id));
      setLeads((prev) => prev.filter((l) => l.id !== id));
      try {
        const remaining = inquiries.filter((inq) => inq.id !== id);
        localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(remaining));
      } catch {}

      if (res && res.deletedRows && res.deletedRows > 0) {
        setSyncNotice(`✓ Row deleted from Google Sheet (${res.deletedRows} row removed)`);
      } else {
        setSyncNotice('✓ Row removed from Google Sheet');
      }
    } catch (e: any) {
      alert('Delete error: ' + (e.message || e));
    } finally {
      setDeletingId(null);
      setTimeout(() => setSyncNotice(null), 3500);
      syncFromGoogleSheets(false);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this client review from Google Sheet?')) return;
    setDeletingId(id);
    setSyncNotice('Deleting review from Google Sheet...');
    try {
      const res = await deleteFromGoogleSheets(id, 'FEEDBACK');
      setReviews((prev) => prev.filter((r) => r.id !== id));
      try {
        const remaining = reviews.filter((r) => r.id !== id);
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(remaining));
      } catch {}

      if (res && res.deletedRows && res.deletedRows > 0) {
        setSyncNotice('✓ Review deleted from Google Sheet');
      } else {
        setSyncNotice('✓ Review removed from Google Sheet');
      }
    } catch (e: any) {
      alert('Delete error: ' + (e.message || e));
    } finally {
      setDeletingId(null);
      setTimeout(() => setSyncNotice(null), 3500);
      syncFromGoogleSheets(false);
    }
  };

  const handleAddReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewText.trim()) return;

    const id = `REV-${Date.now().toString().slice(-6)}`;
    const date = new Date().toISOString().slice(0, 10);
    const time = new Date().toLocaleTimeString();

    const revObj: FeedbackData & { id: string; time: string } = {
      id,
      name: newReviewName.trim(),
      roleCompany: newReviewRole.trim() || 'Client Partner',
      rating: newReviewRating,
      review: newReviewText.trim(),
      source: 'Admin Direct / Verified',
      date,
      time,
    };

    setReviews([revObj, ...reviews]);
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS) || '[]');
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([revObj, ...existing]));
      window.dispatchEvent(new Event('sarql_crm_updated'));
    } catch {}

    sendToGoogleSheets({
      type: 'FEEDBACK',
      timestamp: `${date} ${time}`,
      id,
      name: revObj.name,
      roleCompany: revObj.roleCompany,
      rating: revObj.rating,
      review: revObj.review,
      source: revObj.source,
    });

    setNewReviewName('');
    setNewReviewRole('');
    setNewReviewRating(5);
    setNewReviewText('');
    setIsAddReviewModalOpen(false);
    setSyncNotice('✓ New client review published live to website and Google Sheet!');
    setTimeout(() => setSyncNotice(null), 4000);
  };

  const promoteInquiryToLead = (inq: InquiryData & { id: string }) => {
    const existing = leads.find((l) => l.email === inq.email || l.name === inq.fullName);
    if (existing) {
      alert(`A lead for "${inq.fullName}" is already in your active pipeline.`);
      return;
    }

    const newLead: Lead = {
      id: `LEAD-${inq.id.replace('INQ-', '')}`,
      name: inq.fullName,
      company: inq.company || 'Website Inquiry',
      email: inq.email,
      phone: inq.phone.replace(/[^0-9]/g, ''),
      service: inq.scope.slice(0, 60),
      budget: inq.budget || 'Custom Scope',
      status: 'New',
      date: inq.date || new Date().toISOString().slice(0, 10),
      notes: inq.scope,
    };

    const updated = [newLead, ...leads];
    setLeads(updated);
    try { localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(updated)); } catch {}
    alert(`✓ Successfully added "${inq.fullName}" to your active CRM Pipeline!`);
    setCrmSubTab('leads');
  };

  const triggerWhatsApp = (lead: Lead | (InquiryData & { id: string })) => {
    const name = 'fullName' in lead ? lead.fullName : lead.name;
    const service = 'scope' in lead ? lead.scope : lead.service;
    const phone = lead.phone.replace(/[^0-9]/g, '');
    const text = `Hello ${name}, this is the Sarql Executive Team regarding your project inquiry (${service}). We have reviewed your vision and would love to schedule a direct discovery consultation.`;
    const cleanPhone = phone || '917558811574';
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
    logAudit(currentUser?.email || 'admin', `Added ${email} to Authorized Whitelist`, 'SUCCESS');
  };

  const removeWhitelistEmail = (email: string) => {
    if (email === 'team.sarql@gmail.com') {
      alert('Cannot revoke access for the master administrator (team.sarql@gmail.com).');
      return;
    }
    if (whitelist.length <= 1) {
      alert('Cannot delete the last remaining authorized administrator.');
      return;
    }
    if (confirm(`Remove ${email} from authorized access?`)) {
      setWhitelist(whitelist.filter((w) => w !== email));
      logAudit(currentUser?.email || 'admin', `Revoked access for ${email}`, 'SUCCESS');
    }
  };

  // Filter leads
  const filteredLeads = useMemo(() => {
    if (statusFilter === 'All') return leads;
    return leads.filter((l) => l.status === statusFilter);
  }, [leads, statusFilter]);

  /* ----------------------------------------------------------- Render Gatekeeper */
  if (isAuthLoading) {
    return (
      <div className={styles.gatekeeperWrapper} style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid rgba(0,0,0,0.1)', borderTopColor: '#000000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '0.8125rem', color: '#777169', fontWeight: 500 }}>Verifying Authorized Session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={styles.gatekeeperWrapper}>
        <div className={styles.gatekeeperCard}>
          <div className={styles.shieldIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          <p className={styles.gatekeeperEyebrow}>Sarql Security Gateway</p>
          <h1 className={styles.gatekeeperTitle}>Administrative Control</h1>
          <p className={styles.gatekeeperDesc}>
            Strict two-factor authentication required. Single-use login codes are sent exclusively to authorized administrator emails.
          </p>

          {authError && (
            <div className={styles.alertDenied}>
              <span style={{ fontWeight: 600 }}>Security Notice:</span> {authError}
            </div>
          )}

          {authSuccessMsg && (
            <div className={styles.alertSuccess}>
              <span style={{ fontWeight: 600 }}>✓ Code Dispatched:</span> {authSuccessMsg}
            </div>
          )}

          {authStep === 'EMAIL' ? (
            <form onSubmit={handleSendLoginCode} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.35rem' }}>
                  Authorized Admin Email
                </label>
                <input
                  type="email"
                  placeholder="team.sarql@gmail.com"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  required
                  autoFocus
                  className={styles.inputField}
                  disabled={isSendingOtp}
                />
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className={styles.googleBtn}
                style={{ marginTop: '0.5rem', opacity: isSendingOtp ? 0.7 : 1 }}
              >
                {isSendingOtp ? (
                  <span>Dispatching Security Code...</span>
                ) : (
                  <span>Send One-Time Login Code →</span>
                )}
              </button>

              <p style={{ fontSize: '0.75rem', color: '#6B7280', textAlign: 'left', lineHeight: 1.5, marginTop: '0.5rem' }}>
                A 6-digit verification code will be sent to your Gmail inbox. Non-whitelisted email addresses are automatically blocked and logged.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.otpEmailBadge}>
                <span>
                  Code sent to: <strong>{emailInput}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthStep('EMAIL');
                    setOtpInput('');
                    setAuthError(null);
                    setAuthSuccessMsg(null);
                  }}
                  className={styles.changeEmailBtn}
                >
                  Change Email
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem', textAlign: 'left' }}>
                  Enter 6-Digit One-Time Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={otpInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    setOtpInput(val);
                    if (authError) setAuthError(null);
                  }}
                  autoFocus
                  required
                  className={styles.otpInput}
                  disabled={isVerifyingOtp}
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otpInput.trim().length !== 6}
                className={styles.googleBtn}
                style={{ opacity: isVerifyingOtp || otpInput.trim().length !== 6 ? 0.6 : 1 }}
              >
                {isVerifyingOtp ? 'Verifying Code...' : 'Verify & Unlock Panel →'}
              </button>

              <div className={styles.resendRow}>
                {resendTimer > 0 ? (
                  <span>Resend code in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendLoginCode()}
                    disabled={isSendingOtp}
                    className={styles.resendBtn}
                  >
                    Didn&apos;t receive code? Resend Code
                  </button>
                )}
              </div>
            </form>
          )}

          <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #F3F4F6' }}>
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center', margin: 0 }}>
              Sarql Digital Co. · Operational Identity System · All Access Monitored
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------- Render Admin Dashboard */
  const isSheetConfigured = Boolean(sheetUrlInput && sheetUrlInput.includes('script.google.com'));

  return (
    <div className={styles.adminPage}>
      <div className="tw-container">
        {/* Header matching Sarql Website Aesthetic */}
        <div className={styles.heroSection}>
          <div>
            <p className={styles.eyebrow}>Operations & Control Suite</p>
            <h1 className={styles.h1}>Customer Relationship & Archive</h1>
            <p className={styles.lead}>
              Authorized Session: <strong>{currentUser.email}</strong> · Verified Executive Admin
            </p>
          </div>

          <div className={styles.heroActions}>
            <button
              onClick={() => syncFromGoogleSheets(true)}
              disabled={isSyncing}
              className={styles.actionBtnSecondary}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              title="Refresh all rows directly from Google Sheet"
            >
              <span style={{ display: 'inline-block', transform: isSyncing ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s' }}>↻</span>
              {isSyncing ? 'Syncing...' : 'Sync Sheet'}
            </button>
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
                onClick={() => setIsUploadModalOpen(true)}
                className={styles.actionBtn}
              >
                + Upload Project
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

        {/* Tab Navigation */}
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
            CRM & Inquiries
            <span className={styles.tabBadge}>{leads.length + inquiries.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`${styles.tabBtn} ${activeTab === 'drive' ? styles.tabBtnActive : ''}`}
          >
            Portfolio & Sections
            <span className={styles.tabBadge}>{portfolioProjects.length.toLocaleString()}</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`${styles.tabBtn} ${activeTab === 'settings' ? styles.tabBtnActive : ''}`}
          >
            Settings & Sheets
            {isSheetConfigured && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />}
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
                <div className={styles.metricNote}>Active deals in pipeline</div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>
                  <span>Website Inquiries</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
                <div className={styles.metricValue}>{inquiries.length}</div>
                <div className={styles.metricNote}>Auto-synced to Google Sheets</div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>
                  <span>Client Feedback</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                </div>
                <div className={styles.metricValue}>{reviews.length}</div>
                <div className={styles.metricNote}>Verified client testimonials</div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>
                  <span>Google Sheets Sync</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                </div>
                <div className={styles.metricValue} style={{ fontSize: '1.25rem', color: isSheetConfigured ? '#059669' : '#D97706' }}>
                  {isSheetConfigured ? 'Connected' : 'Setup Needed'}
                </div>
                <div className={styles.metricNote}>
                  {isSheetConfigured ? 'Real-time webhook live' : 'Configure in Settings'}
                </div>
              </div>
            </div>

            <div className={styles.contentCard}>
              <div className={styles.cardTopBar}>
                <h3 className={styles.cardTitle}>Recent Client Inquiries</h3>
                <button onClick={() => { setActiveTab('crm'); setCrmSubTab('inquiries'); }} className={styles.actionBtnSecondary}>
                  Open Inquiries Inbox ({inquiries.length}) →
                </button>
              </div>

              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Client / Brand</th>
                      <th>Service Scope</th>
                      <th>Estimated Budget</th>
                      <th>Source</th>
                      <th>Direct Connect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.slice(0, 4).map((inq) => (
                      <tr key={inq.id} className={styles.tableRow}>
                        <td>
                          <span className={styles.clientName}>{inq.fullName}</span>
                          <span className={styles.clientCompany}>{inq.company || inq.email}</span>
                        </td>
                        <td style={{ maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inq.scope}</td>
                        <td><span className={styles.budget}>{inq.budget || 'Custom'}</span></td>
                        <td><span style={{ fontSize: '0.75rem', background: '#F3F4F6', padding: '0.2rem 0.5rem', borderRadius: 9999 }}>{inq.source || 'Website'}</span></td>
                        <td>
                          <button onClick={() => triggerWhatsApp(inq)} className={styles.whatsappPill}>
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

        {/* TAB 2: CRM & INQUIRIES & REVIEWS */}
        {activeTab === 'crm' && (
          <div className={styles.contentCard}>
            {/* Sub-tabs header */}
            <div className={styles.subTabRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setCrmSubTab('leads')}
                  className={`${styles.subTabBtn} ${crmSubTab === 'leads' ? styles.subTabBtnActive : ''}`}
                >
                  Pipeline Leads
                  <span className={styles.subTabBadge}>{leads.length}</span>
                </button>
                <button
                  onClick={() => setCrmSubTab('inquiries')}
                  className={`${styles.subTabBtn} ${crmSubTab === 'inquiries' ? styles.subTabBtnActive : ''}`}
                >
                  Website Inquiries Inbox
                  <span className={styles.subTabBadge}>{inquiries.length}</span>
                </button>
                <button
                  onClick={() => setCrmSubTab('feedback')}
                  className={`${styles.subTabBtn} ${crmSubTab === 'feedback' ? styles.subTabBtnActive : ''}`}
                >
                  Client Reviews & Feedback
                  <span className={styles.subTabBadge}>{reviews.length}</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {syncNotice && (
                  <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                    {syncNotice}
                  </span>
                )}
                <button
                  onClick={() => syncFromGoogleSheets(true)}
                  disabled={isSyncing}
                  style={{
                    background: isSyncing ? '#E5E7EB' : '#111111',
                    color: isSyncing ? '#6B7280' : '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    cursor: isSyncing ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    padding: '0.45rem 0.95rem',
                    borderRadius: 9999,
                    fontWeight: 600,
                  }}
                  title="Fetch latest rows directly from Google Sheet"
                >
                  <span style={{ display: 'inline-block', transform: isSyncing ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s' }}>
                    ↻
                  </span>
                  {isSyncing ? 'Syncing...' : 'Sync with Sheet'}
                </button>
              </div>
            </div>

            {/* SUB-VIEW 1: LEADS PIPELINE */}
            {crmSubTab === 'leads' && (
              <>
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
                      {filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                            {isSyncing ? 'Loading leads from Google Sheet...' : 'No inquiries/leads found in Google Sheet. Click "Sync with Sheet" to refresh.'}
                          </td>
                        </tr>
                      ) : (
                        filteredLeads.map((lead, idx) => (
                        <tr key={`${lead.id}-${idx}`} className={styles.tableRow}>
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
                              <button onClick={() => deleteLead(lead.id)} disabled={deletingId === lead.id} className={styles.deletePill} title="Delete Lead from Google Sheet">
                                {deletingId === lead.id ? '...' : '✕'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* SUB-VIEW 2: WEBSITE INQUIRIES INBOX */}
            {crmSubTab === 'inquiries' && (
              <div>
                <div className={styles.cardTopBar}>
                  <div>
                    <h3 className={styles.cardTitle}>Inbound Website Inquiries</h3>
                    <p style={{ fontSize: '0.8125rem', color: '#777777', marginTop: '0.25rem' }}>
                      Captures submissions from the &quot;Start a Project&quot; form and Package Calculator. Automatically synced to Google Sheets.
                    </p>
                  </div>
                </div>

                <div className={styles.tableResponsive}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Client Details</th>
                        <th>Scope & Requirements</th>
                        <th>Budget</th>
                        <th>Origin</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                            No inquiries recorded yet. Submissions on the Contact form will appear here automatically.
                          </td>
                        </tr>
                      ) : (
                        inquiries.map((inq, idx) => (
                          <tr key={`${inq.id}-${idx}`} className={styles.tableRow}>
                            <td>
                              <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{inq.date}</div>
                              <div style={{ fontSize: '0.72rem', color: '#888888' }}>{inq.time || 'N/A'}</div>
                            </td>
                            <td>
                              <span className={styles.clientName}>{inq.fullName}</span>
                              <div style={{ fontSize: '0.75rem', color: '#555' }}>{inq.phone}</div>
                              <div style={{ fontSize: '0.75rem', color: '#777' }}>{inq.email}</div>
                              {inq.company && inq.company !== 'N/A' && (
                                <span className={styles.clientCompany}>{inq.company}</span>
                              )}
                            </td>
                            <td style={{ maxWidth: 300 }}>
                              <p style={{ fontSize: '0.8125rem', lineHeight: 1.4, margin: 0, color: '#1F2937' }}>
                                {inq.scope}
                              </p>
                            </td>
                            <td>
                              <span className={styles.budget}>{inq.budget || 'Custom'}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.72rem', background: '#F3F4F6', padding: '0.25rem 0.55rem', borderRadius: 9999, fontWeight: 500 }}>
                                {inq.source || 'Website'}
                              </span>
                            </td>
                            <td>
                              <div className={styles.tableActions}>
                                <button onClick={() => triggerWhatsApp(inq)} className={styles.whatsappPill}>
                                  WhatsApp
                                </button>
                                <button
                                  onClick={() => promoteInquiryToLead(inq)}
                                  style={{
                                    background: '#000000',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                  }}
                                  title="Add to active Deals Pipeline"
                                >
                                  + Lead
                                </button>
                                <button onClick={() => deleteInquiry(inq.id)} disabled={deletingId === inq.id} className={styles.deletePill} title="Delete Inquiry from Google Sheet">
                                  {deletingId === inq.id ? '...' : '✕'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: CLIENT FEEDBACK & REVIEWS */}
            {crmSubTab === 'feedback' && (
              <div>
                <div className={styles.cardTopBar}>
                  <div>
                    <h3 className={styles.cardTitle}>Client Reviews & Testimonials ({reviews.length})</h3>
                    <p style={{ fontSize: '0.8125rem', color: '#777777', marginTop: '0.25rem' }}>
                      Reviews published live to website and synced with Google Sheets.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddReviewModalOpen(true)}
                    className={styles.actionBtn}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}
                  >
                    <span>+ Add Client Review</span>
                  </button>
                </div>

                <div className={styles.tableResponsive}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Client & Role</th>
                        <th>Rating</th>
                        <th>Review Content</th>
                        <th>Source</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                            No client reviews recorded yet. Submissions on the Contact Review tab will appear here.
                          </td>
                        </tr>
                      ) : (
                        reviews.map((rev, idx) => (
                          <tr key={`${rev.id}-${idx}`} className={styles.tableRow}>
                            <td>
                              <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{rev.date}</div>
                            </td>
                            <td>
                              <span className={styles.clientName}>{rev.name}</span>
                              <span className={styles.clientCompany}>{rev.roleCompany}</span>
                            </td>
                            <td>
                              <div style={{ color: '#F59E0B', fontSize: '0.9rem', letterSpacing: 1 }}>
                                {'★'.repeat(rev.rating)}
                                <span style={{ color: '#E5E7EB' }}>{'★'.repeat(Math.max(0, 5 - rev.rating))}</span>
                              </div>
                            </td>
                            <td style={{ maxWidth: 360 }}>
                              <p style={{ fontSize: '0.8125rem', lineHeight: 1.45, fontStyle: 'italic', margin: 0, color: '#374151' }}>
                                &ldquo;{rev.review}&rdquo;
                              </p>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.72rem', background: '#F3F4F6', padding: '0.25rem 0.55rem', borderRadius: 9999 }}>
                                {rev.source || 'Website'}
                              </span>
                            </td>
                            <td>
                              <div className={styles.tableActions}>
                                <button
                                  onClick={() => {
                                    const text = `Hello ${rev.name}, thank you for your kind testimonial for Sarql!`;
                                    window.open(`https://wa.me/917558811574?text=${encodeURIComponent(text)}`, '_blank');
                                  }}
                                  className={styles.whatsappPill}
                                >
                                  WhatsApp
                                </button>
                                <button onClick={() => deleteReview(rev.id)} disabled={deletingId === rev.id} className={styles.deletePill} title="Delete Review from Google Sheet">
                                  {deletingId === rev.id ? '...' : '✕'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PORTFOLIO & ARCHIVE MANAGER */}
        {activeTab === 'drive' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Notification Toast */}
            {portfolioToast && (
              <div style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                padding: '0.85rem 1.25rem',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>✓ {portfolioToast}</span>
                <button onClick={() => setPortfolioToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', fontWeight: 600 }}>✕</button>
              </div>
            )}

            {/* Header & Metrics */}
            <div className={styles.contentCard} style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 className={styles.cardTitle} style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>
                    Portfolio Sections & Asset Pipeline
                  </h3>
                  <p style={{ color: 'var(--text-gray-600, #59544F)', fontSize: '0.875rem', maxWidth: '44rem', margin: 0 }}>
                    Enable or hide portfolio sections, upload new design assets directly, or remove unwanted items with instant live synchronization.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setIsUploadModalOpen(true)} className={styles.actionBtn}>
                    + Upload New Project
                  </button>
                  <a href="/portfolio/" target="_blank" rel="noopener noreferrer" className={styles.actionBtnSecondary}>
                    Preview Live Portfolio ↗
                  </a>
                </div>
              </div>

              {/* Dynamic Metrics */}
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Total Live Projects</span>
                  <span className={styles.metricValue}>{portfolioProjects.length.toLocaleString()}</span>
                  <span className={styles.metricNote}>● Live in 3D Carousel</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Visible Sections</span>
                  <span className={styles.metricValue}>
                    {portfolioCategories.filter(c => c.enabled).length} of {portfolioCategories.length}
                  </span>
                  <span className={styles.metricNote} style={{ color: '#10B981' }}>● Displayed on /portfolio</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Custom Uploads</span>
                  <span className={styles.metricValue}>
                    {portfolioProjects.filter(p => p.isCustom).length}
                  </span>
                  <span className={styles.metricNote}>● Admin Added</span>
                </div>
              </div>
            </div>

            {/* SECTION 1: SECTION VISIBILITY CONTROLS (ENABLE / HIDE) */}
            <div className={styles.contentCard} style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 className={styles.cardTitle} style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                    Section Visibility (Enable / Hide Tabs)
                  </h3>
                  <p style={{ color: 'var(--text-gray-600, #59544F)', fontSize: '0.84rem', margin: 0 }}>
                    Toggle sections on or off. Hidden sections will not appear as tabs or in the 3D portfolio stream.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleHideAllEmptyCategories}
                    className={styles.actionBtnSecondary}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                    title="Hide sections with 0 items"
                  >
                    Hide Empty (0 Items)
                  </button>
                  <button
                    onClick={handleShowAllCategories}
                    className={styles.actionBtnSecondary}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  >
                    Show All Sections
                  </button>
                </div>
              </div>

              {/* Category Grid */}
              <div className={styles.categoryGrid}>
                {portfolioCategories.map((cat) => {
                  const itemCount = portfolioProjects.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;
                  return (
                    <div
                      key={cat.id}
                      className={`${styles.categoryCard} ${!cat.enabled ? styles.categoryCardDisabled : ''}`}
                    >
                      <div className={styles.catInfo}>
                        <div className={styles.catName}>
                          {cat.name}
                          <span className={styles.catBadge}>{itemCount} items</span>
                        </div>
                        <div>
                          <span className={`${styles.catStatusPill} ${cat.enabled ? styles.catStatusActive : styles.catStatusHidden}`}>
                            {cat.enabled ? '● Visible on Site' : '○ Hidden from Site'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <label className={styles.switch} title={`Toggle visibility for ${cat.name}`}>
                          <input
                            type="checkbox"
                            checked={cat.enabled}
                            onChange={(e) => handleToggleCategory(cat.name, e.target.checked)}
                          />
                          <span className={styles.slider} />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Category Form */}
              <form onSubmit={handleAddCategorySubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', maxWidth: '28rem', marginTop: '1rem' }}>
                <input
                  type="text"
                  placeholder="Create new section (e.g. 3D Renders, Brochures)"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  className={styles.inputField}
                  style={{ flex: 1 }}
                />
                <button type="submit" className={styles.actionBtn} style={{ whiteSpace: 'nowrap' }}>
                  + Add Section
                </button>
              </form>
            </div>

            {/* SECTION 2: ARCHIVE ASSETS BROWSER & DELETION */}
            <div className={styles.contentCard} style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 className={styles.cardTitle} style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                    Browse & Manage Projects ({filteredPortfolioProjects.length.toLocaleString()})
                  </h3>
                  <p style={{ color: 'var(--text-gray-600, #59544F)', fontSize: '0.84rem', margin: 0 }}>
                    Search and delete projects across any section. Deleted items are immediately removed from the live portfolio.
                  </p>
                </div>
                <button onClick={() => setIsUploadModalOpen(true)} className={styles.actionBtn}>
                  + Upload to Portfolio
                </button>
              </div>

              {/* Category Filter Pills & Search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { setSelectedPortfolioCat('All'); setPortfolioPage(1); }}
                    className={`${styles.filterPill} ${selectedPortfolioCat === 'All' ? styles.filterPillActive : ''}`}
                  >
                    All ({portfolioProjects.length})
                  </button>
                  {portfolioCategories.map((c) => {
                    const count = portfolioProjects.filter((p) => p.category.toLowerCase() === c.name.toLowerCase()).length;
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedPortfolioCat(c.name); setPortfolioPage(1); }}
                        className={`${styles.filterPill} ${selectedPortfolioCat.toLowerCase() === c.name.toLowerCase() ? styles.filterPillActive : ''}`}
                      >
                        {c.name} ({count})
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search artwork by title, tag, or ID..."
                    value={portfolioSearchQuery}
                    onChange={(e) => { setPortfolioSearchQuery(e.target.value); setPortfolioPage(1); }}
                    className={styles.inputField}
                    style={{ maxWidth: '24rem' }}
                  />
                  {portfolioSearchQuery && (
                    <button
                      onClick={() => setPortfolioSearchQuery('')}
                      className={styles.actionBtnSecondary}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              </div>

              {/* Projects Grid */}
              {paginatedProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#FAFAF9', borderRadius: '1rem', border: '1px dashed #D4D4D8' }}>
                  <p style={{ fontWeight: 600, color: '#18181B', marginBottom: '0.35rem' }}>No projects found in this section</p>
                  <p style={{ fontSize: '0.85rem', color: '#71717A', marginBottom: '1rem' }}>
                    {portfolioSearchQuery ? 'Try adjusting your search terms.' : 'Upload an image or sync Google Drive to display assets here.'}
                  </p>
                  <button onClick={() => setIsUploadModalOpen(true)} className={styles.actionBtn}>
                    + Upload First Project
                  </button>
                </div>
              ) : (
                <div className={styles.assetGrid}>
                  {paginatedProjects.map((item) => {
                    const thumbUrl = item.imageUrl
                      ? item.imageUrl
                      : item.driveId
                      ? `https://lh3.googleusercontent.com/d/${item.driveId}=w400`
                      : '/sarql.png';

                    return (
                      <div key={item.id} className={styles.assetCard}>
                        <div className={styles.assetThumbContainer}>
                          <img
                            src={thumbUrl}
                            alt={item.title}
                            loading="lazy"
                            className={styles.assetThumb}
                            onError={(e) => {
                              if (item.driveId && !e.currentTarget.src.includes('thumbnail?id=')) {
                                e.currentTarget.src = `https://drive.google.com/thumbnail?id=${item.driveId}&sz=w400`;
                              }
                            }}
                          />
                          <span className={styles.assetOverlayBadge}>{item.category}</span>
                          {item.isCustom && (
                            <span className={styles.assetCustomBadge}>Custom</span>
                          )}
                        </div>

                        <div className={styles.assetBody}>
                          <span className={styles.assetTitle} title={item.title}>
                            {item.title}
                          </span>
                          <span className={styles.assetSub}>
                            {item.subCategory || item.category}
                          </span>
                        </div>

                        <div className={styles.assetFooter}>
                          {item.url ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '0.75rem', color: '#000', fontWeight: 500, textDecoration: 'none' }}
                            >
                              Visit Site ↗
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: '#A1A1AA' }}>
                              {item.id.length > 14 ? `${item.id.slice(0, 10)}...` : item.id}
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteProjectClick(item.id, item.title)}
                            className={styles.deleteAssetBtn}
                            title="Delete this project from portfolio"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Row */}
              {totalPortfolioPages > 1 && (
                <div className={styles.paginationRow}>
                  <button
                    disabled={portfolioPage <= 1}
                    onClick={() => setPortfolioPage((p) => Math.max(1, p - 1))}
                    className={styles.pageBtn}
                  >
                    ← Previous
                  </button>

                  <span style={{ fontSize: '0.84rem', color: '#52525B', fontWeight: 500 }}>
                    Page <strong>{portfolioPage}</strong> of <strong>{totalPortfolioPages}</strong> ({filteredPortfolioProjects.length.toLocaleString()} items)
                  </span>

                  <button
                    disabled={portfolioPage >= totalPortfolioPages}
                    onClick={() => setPortfolioPage((p) => Math.min(totalPortfolioPages, p + 1))}
                    className={styles.pageBtn}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* UPLOAD PROJECT MODAL */}
            {isUploadModalOpen && (
              <div className={styles.modalOverlay} onClick={() => setIsUploadModalOpen(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Upload New Project to Portfolio</h3>
                    <button onClick={() => setIsUploadModalOpen(false)} className={styles.closeBtn}>✕</button>
                  </div>

                  <form onSubmit={handleUploadProjectSubmit} className={styles.modalBody}>
                    <div>
                      <label className={styles.formLabel}>Target Section / Category *</label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className={styles.inputField}
                        style={{ width: '100%' }}
                        required
                      >
                        {portfolioCategories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} {!c.enabled ? '(Currently Hidden)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={styles.formLabel}>Project Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Luxury Brand Packaging, Tech Portal"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className={styles.inputField}
                        style={{ width: '100%' }}
                        required
                      />
                    </div>

                    <div>
                      <label className={styles.formLabel}>Subcategory / Tags</label>
                      <input
                        type="text"
                        placeholder="e.g. Visual Design, Brand Identity, Web Portal"
                        value={uploadSubCategory}
                        onChange={(e) => setUploadSubCategory(e.target.value)}
                        className={styles.inputField}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label className={styles.formLabel}>Upload Artwork Image File *</label>
                      <label className={styles.fileDropArea} style={{ display: 'block' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileSelect}
                          style={{ display: 'none' }}
                        />
                        <div style={{ color: '#52525B', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, color: '#000' }}>Click to select an image</span> from your device
                          <div style={{ fontSize: '0.75rem', color: '#A1A1AA', marginTop: '0.25rem' }}>
                            PNG, JPG, WEBP up to 10MB
                          </div>
                        </div>
                      </label>

                      {uploadImageFile && (
                        <div className={styles.previewImageContainer}>
                          <img src={uploadImageFile} alt="Preview" className={styles.previewImg} />
                          <button
                            type="button"
                            onClick={() => setUploadImageFile(null)}
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              background: 'rgba(0,0,0,0.7)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: 24,
                              height: 24,
                              cursor: 'pointer',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={styles.formLabel}>OR Enter Google Drive ID / Image URL</label>
                      <input
                        type="text"
                        placeholder="e.g. 1VYTiPjf1nI_lN9WdB0bqCaXh5xMNErWy or https://..."
                        value={uploadDriveId}
                        onChange={(e) => setUploadDriveId(e.target.value)}
                        className={styles.inputField}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label className={styles.formLabel}>External Website URL (Optional)</label>
                      <input
                        type="url"
                        placeholder="e.g. https://clientwebsite.com"
                        value={uploadUrl}
                        onChange={(e) => setUploadUrl(e.target.value)}
                        className={styles.inputField}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(false)}
                        className={styles.actionBtnSecondary}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={styles.actionBtn}
                        style={{ flex: 1.5, background: '#10B981', borderColor: '#10B981', color: '#fff' }}
                      >
                        Publish to Portfolio
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SETTINGS & INTEGRATIONS */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* GOOGLE SHEETS LIVE INTEGRATION CARD */}
            <div className={styles.integrationCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="3" y1="15" x2="21" y2="15" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                      <line x1="15" y1="3" x2="15" y2="21" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.cardTitle} style={{ fontSize: '1.2rem', margin: 0 }}>
                      Google Sheets Real-time CRM Sync
                    </h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: '#6B7280' }}>
                      ഓരോ വെബ്സൈറ്റ് അന്വേഷണവും ഫീഡ്‌ബാക്കും തത്സമയം ഗൂഗിൾ ഷീറ്റിലേക്ക് ആഡ് ചെയ്യപ്പെടുന്നു.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: isSheetConfigured ? '#ECFDF5' : '#FEF3C7', padding: '0.4rem 0.85rem', borderRadius: 9999 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: isSheetConfigured ? '#10B981' : '#F59E0B' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isSheetConfigured ? '#065F46' : '#92400E' }}>
                    {isSheetConfigured ? 'Live & Connected' : 'Configuration Required'}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, margin: '1rem 0' }}>
                Whenever a client submits an inquiry or leaves a review on <strong>sarql.com</strong>, the data is automatically dispatched via webhook to your private Google Sheet without any third-party fees.
              </p>

              {/* URL Form */}
              <form onSubmit={handleSaveSheetUrl} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '1.25rem 0' }}>
                <input
                  type="url"
                  required
                  value={sheetUrlInput}
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className={styles.inputField}
                  style={{ flex: '1 1 360px' }}
                />
                <button type="submit" className={styles.actionBtn} style={{ flexShrink: 0 }}>
                  Save Webhook URL
                </button>
                <button
                  type="button"
                  onClick={handleTestSheetConnection}
                  disabled={isTestingSheet}
                  className={styles.actionBtnSecondary}
                  style={{ flexShrink: 0 }}
                >
                  {isTestingSheet ? 'Pinging Sheets...' : 'Test Connection ⚡'}
                </button>
              </form>

              {sheetSaveStatus && (
                <div style={{ background: '#ECFDF5', color: '#065F46', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.84rem', marginBottom: '1rem' }}>
                  {sheetSaveStatus}
                </div>
              )}

              {sheetTestFeedback && (
                <div style={{
                  background: sheetTestFeedback.success ? '#ECFDF5' : '#FEF2F2',
                  color: sheetTestFeedback.success ? '#065F46' : '#991B1B',
                  border: `1px solid ${sheetTestFeedback.success ? '#A7F3D0' : '#FECACA'}`,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.84rem',
                  marginBottom: '1rem',
                }}>
                  {sheetTestFeedback.message}
                </div>
              )}

              {/* Step by step guide */}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
                    1-Minute Setup Guide (എളുപ്പത്തിൽ സെറ്റ് ചെയ്യാനുള്ള വഴികൾ)
                  </h4>
                  <button
                    onClick={handleCopyScriptCode}
                    className={styles.actionBtnSecondary}
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                  >
                    {isScriptCopied ? '✓ Copied to Clipboard!' : 'Copy Apps Script Code'}
                  </button>
                </div>

                <div className={styles.guideStepList}>
                  <div className={styles.guideStepItem}>
                    <span className={styles.guideStepNum}>1</span>
                    <div>
                      <strong>പുതിയ ഗൂഗിൾ ഷീറ്റ് തുറക്കുക:</strong>{' '}
                      <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" style={{ color: '#000', textDecoration: 'underline', fontWeight: 600 }}>
                        sheets.new ↗
                      </a>{' '}
                      തുറന്ന് ഷീറ്റിന് &quot;Sarql Inquiries & CRM&quot; എന്ന് പേര് നൽകുക.
                    </div>
                  </div>

                  <div className={styles.guideStepItem}>
                    <span className={styles.guideStepNum}>2</span>
                    <div>
                      <strong>Apps Script തുറക്കുക:</strong> മെനുവിൽ നിന്ന് <code>Extensions &gt; Apps Script</code> ക്ലിക്ക് ചെയ്യുക.
                    </div>
                  </div>

                  <div className={styles.guideStepItem}>
                    <span className={styles.guideStepNum}>3</span>
                    <div>
                      <strong>കോഡ് പേസ്റ്റ് ചെയ്യുക:</strong> മുകളിലെ &quot;Copy Apps Script Code&quot; ബട്ടൺ ക്ലിക്ക് ചെയ്ത് കോഡ് മുഴുവനായും അവിടെ പേസ്റ്റ് ചെയ്ത് <strong>Save</strong> (ഫ്ലോപ്പി ഡിസ്ക് ഐക്കൺ) ക്ലിക്ക് ചെയ്യുക.
                    </div>
                  </div>

                  <div className={styles.guideStepItem}>
                    <span className={styles.guideStepNum}>4</span>
                    <div>
                      <strong>വെബ് ആപ്പായി വിന്യസിക്കുക:</strong> മുകളിൽ വലതുവശത്ത് <code>Deploy &gt; New deployment</code> ക്ലിക്ക് ചെയ്യുക. ടൈപ്പായി <strong>Web app</strong> തിരഞ്ഞെടുത്ത്, <em>Execute as: Me</em> എന്നും <em>Who has access: Anyone</em> എന്നും സെറ്റ് ചെയ്ത് <strong>Deploy</strong> ക്ലിക്ക് ചെയ്യുക.
                    </div>
                  </div>

                  <div className={styles.guideStepItem}>
                    <span className={styles.guideStepNum}>5</span>
                    <div>
                      <strong>URL ഇവിടെ നൽകുക:</strong> ലഭിക്കുന്ന Web App URL കോപ്പി ചെയ്ത് മുകളിലെ ഇൻപുട്ടിൽ പേസ്റ്റ് ചെയ്ത് <strong>Save Webhook URL</strong> ക്ലിക്ക് ചെയ്യുക!
                    </div>
                  </div>
                </div>

                {/* Code Preview */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', marginBottom: '0.4rem' }}>
                    Google Apps Script Code Preview (Code.gs):
                  </div>
                  <pre className={styles.codeSnippetBox}>
                    {GOOGLE_APPS_SCRIPT_SAMPLE}
                  </pre>
                </div>
              </div>
            </div>

            {/* WHITELIST CARD */}
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
                  placeholder="Enter admin Gmail (e.g. team.sarql@gmail.com)"
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
                      {email === 'team.sarql@gmail.com' && (
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

            {/* SECURITY AUDIT LOG */}
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
      {/* ADD REVIEW MODAL */}
      {isAddReviewModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddReviewModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add New Client Review</h3>
              <button onClick={() => setIsAddReviewModalOpen(false)} className={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleAddReviewSubmit} className={styles.modalBody}>
              <div>
                <label className={styles.formLabel}>Client Name *</label>
                <input
                  type="text"
                  required
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  placeholder="e.g. Muhammed Ansar"
                  className={styles.inputField}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className={styles.formLabel}>Role & Company / Brand *</label>
                <input
                  type="text"
                  required
                  value={newReviewRole}
                  onChange={(e) => setNewReviewRole(e.target.value)}
                  placeholder="e.g. Founder, Walfy E-Commerce"
                  className={styles.inputField}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className={styles.formLabel}>Star Rating</label>
                <select
                  value={newReviewRating}
                  onChange={(e) => setNewReviewRating(Number(e.target.value))}
                  className={styles.inputField}
                  style={{ width: '100%' }}
                >
                  <option value={5}>★★★★★ (5 Stars - Exceptional)</option>
                  <option value={4}>★★★★☆ (4 Stars - Great)</option>
                  <option value={3}>★★★☆☆ (3 Stars - Good)</option>
                  <option value={2}>★★☆☆☆ (2 Stars - Average)</option>
                  <option value={1}>★☆☆☆☆ (1 Star - Poor)</option>
                </select>
              </div>

              <div>
                <label className={styles.formLabel}>Review / Testimonial *</label>
                <textarea
                  required
                  rows={4}
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="Enter the client testimonial text..."
                  className={styles.inputField}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddReviewModalOpen(false)}
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
                  Publish Review Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
