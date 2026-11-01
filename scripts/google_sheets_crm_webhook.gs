/**
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
  var id = String(data.id || ("INQ-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyMMddHHmmss"))).trim();
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

  // Check if an existing row matches this ID or 10-digit Phone to update in-place (prevents duplicate draft rows)
  var lastRow = sheet.getLastRow();
  var updated = false;
  if (lastRow > 1) {
    var dataRange = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
    for (var r = dataRange.length - 1; r >= 0; r--) {
      var rowId = String(dataRange[r][1] || "").trim();
      var rowPhone = String(dataRange[r][3] || "").replace(/[^0-9]/g, "");

      var isIdMatch = id && rowId && (id.toLowerCase() === rowId.toLowerCase());
      var isPhoneMatch = rawDigits && rawDigits.length >= 10 && rowPhone && (rowPhone.slice(-10) === rawDigits.slice(-10));

      if (isIdMatch || isPhoneMatch) {
        var targetRowIndex = r + 2;
        sheet.getRange(targetRowIndex, 1, 1, 11).setValues([[
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
        ]]);
        updated = true;
        break;
      }
    }
  }

  if (!updated) {
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
  }

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
