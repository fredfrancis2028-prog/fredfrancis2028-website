/**
 * Google Apps Script — Campaign Contact Form Handler
 * Deploy as: Web App → Execute as: Me → Who has access: Anyone
 *
 * Receives POST requests from fredfrancis2028.com contact forms,
 * logs each submission to a Google Sheet, and forwards a notification
 * email to the appropriate campaign address.
 *
 * SETUP:
 * 1. Create a new Google Sheet (name it "Campaign Form Submissions").
 * 2. In that sheet, go to Extensions → Apps Script.
 * 3. Delete whatever is in the editor and paste this entire file.
 * 4. Near the top of the code below, set SHEET_ID to the spreadsheet's ID
 *    (the long string in the Google Sheet URL between /d/ and /edit).
 * 5. Click Deploy → New deployment → Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Authorize when prompted (it will ask to send email and edit sheets on your behalf).
 * 7. Copy the deployment URL (looks like https://script.google.com/macros/s/.../exec).
 * 8. Give that URL to Claude to put in site.js.
 */

// ---- CONFIGURATION ----
var SHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';
var VOLUNTEER_EMAIL = 'volunteers@fredfrancis2028.com';
var CONTACT_EMAIL = 'contact@fredfrancis2028.com';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var formType = data.formType; // 'volunteer' or 'message'

    // Log to spreadsheet
    logToSheet(formType, data);

    // Send notification email
    if (formType === 'volunteer') {
      sendVolunteerEmail(data);
    } else {
      sendMessageEmail(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function logToSheet(formType, data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);

  if (formType === 'volunteer') {
    var sheet = ss.getSheetByName('Volunteers') || ss.insertSheet('Volunteers');
    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Name', 'Email', 'Phone', 'State', 'County',
        'Roles', 'Hours', 'Skills', 'Musician', 'How Heard'
      ]);
      sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
    }
    sheet.appendRow([
      new Date(),
      data.name || '',
      data.email || '',
      data.phone || '',
      data.state || '',
      data.county || '',
      (data.roles || []).join(', '),
      data.hours || '',
      data.skills || '',
      (data.musician || []).join(', '),
      data.heard || ''
    ]);

  } else {
    var sheet = ss.getSheetByName('Messages') || ss.insertSheet('Messages');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Subject', 'Message']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    }
    sheet.appendRow([
      new Date(),
      data.name || '(anonymous)',
      data.email || '(not provided)',
      data.subject || '(no subject)',
      data.message || ''
    ]);
  }
}

function sendVolunteerEmail(data) {
  var subject = 'Volunteer Signup: ' + (data.name || 'Unknown');
  var body = 'VOLUNTEER SIGNUP\n'
    + '================\n\n'
    + 'Name: ' + (data.name || '') + '\n'
    + 'Email: ' + (data.email || '') + '\n'
    + 'Phone: ' + (data.phone || 'Not provided') + '\n'
    + 'State: ' + (data.state || '') + '\n'
    + 'County: ' + (data.county || 'Not provided') + '\n\n'
    + 'Roles of interest:\n'
    + (data.roles && data.roles.length > 0
       ? data.roles.map(function(r){ return '  - ' + r; }).join('\n')
       : '  (none selected)') + '\n\n'
    + 'Hours: ' + (data.hours || 'Not specified') + '\n\n'
    + 'Skills/experience:\n'
    + (data.skills || '  (not provided)') + '\n\n'
    + 'Musician:\n'
    + (data.musician && data.musician.length > 0
       ? data.musician.map(function(m){ return '  - ' + m; }).join('\n')
       : '  No') + '\n\n'
    + 'How they heard about us:\n'
    + (data.heard || '  (not provided)') + '\n';

  MailApp.sendEmail(VOLUNTEER_EMAIL, subject, body);
}

function sendMessageEmail(data) {
  var name = data.name || 'Anonymous';
  var subject = data.subject
    ? data.subject + ' \u2014 from ' + name
    : 'Message from ' + name;
  var body = 'From: ' + name + '\n'
    + 'Email: ' + (data.email || '(not provided)') + '\n\n'
    + (data.message || '') + '\n';

  MailApp.sendEmail(CONTACT_EMAIL, subject, body);
}

// Allow GET for testing (returns simple confirmation)
function doGet() {
  return ContentService
    .createTextOutput('Campaign form handler is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}
