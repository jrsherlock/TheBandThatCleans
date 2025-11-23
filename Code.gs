/**
 * The Band That Cleans (TBTC) - Google Apps Script Backend
 * Zero-Cost Web Platform for City High Band Parking Lot Cleanup Operations
 * 
 * This script provides a REST-like API for managing parking lot cleanup operations
 * using Google Sheets as the data persistence layer.
 */

/**
 * Global Configuration for Google Sheets Data Source
 * IMPORTANT: Replace SPREADSHEET_ID with your actual Google Sheets ID
 */
const SPREADSHEET_ID = "1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys"; // TODO: Replace with actual ID after creating sheets

/**
 * Google Drive Configuration for Image Storage
 * Images will be stored in a dedicated folder instead of as base64 in the spreadsheet
 */
const DRIVE_CONFIG = {
  // ID of the shared Google Drive folder for storing sign-in sheet images
  // URL: https://drive.google.com/drive/folders/1OaR3INpGTpnY0p5q7lAVxUzuIyUOQokr
  FOLDER_ID: "1OaR3INpGTpnY0p5q7lAVxUzuIyUOQokr",

  // Fallback file name prefix (if naming fails)
  FILE_NAME_PREFIX: "signin_sheet_"
};

const SHEETS = {
  LOTS: {
    name: "Lots",
    headers: [
      "id", "name", "status", "zone", "priority",
      "totalStudentsSignedUp", "comment", "lastUpdated", "updatedBy",
      "actualStartTime", "completedTime", "signUpSheetPhoto",
      "polygonCoordinates", "centerLatitude", "centerLongitude",
      // NEW FIELDS FOR AI CHECK-INS
      "aiStudentCount",
      "aiConfidence",
      "aiAnalysisTimestamp",
      "countSource",
      "countEnteredBy",
      "manualCountOverride",
      "aiMatchedCount",
      "aiUnmatchedCount"
    ]
  },
  STUDENTS: {
    name: "Students",
    headers: [
      "id", "name", "instrument", "section", "year",
      "checkedIn", "checkInTime", "assignedLot",
      // Attendance tracking for 7 events (columns F-L in sheet)
      "event1", "event2", "event3", "event4", "event5", "event6", "event7"
    ]
  },
  ACTUAL_ROSTER: {
    name: "ActualRoster",
    headers: [
      "name", "instrument", "grade", "section",
      "event1", "event2", "event3", "event4", "event5", "event6", "event7"
    ]
  },
  ATTENDANCE_LOG: {
    name: "AttendanceLog",
    headers: [
      "studentId", "studentName", "gameDate", "checkInTime", "checkOutTime", "assignedLotId"
    ]
  },
  EVENT_CONFIG: {
    name: "EventConfig",
    headers: [
      "eventId", "eventName", "eventDate", "checkOutEnabled", "lastUpdated"
    ]
  }
};

// Valid status values for lots
const VALID_LOT_STATUSES = ["ready", "in-progress", "needs-help", "pending-approval", "complete"];

// Mock API key for basic authentication (replace with proper auth in production)
const MOCK_API_KEY = "tbtc-director-key-2024";

/**
 * Main entry point for GET requests. Handles both read and write operations via URL parameters.
 * WORKAROUND: Using GET for all operations to avoid CORS preflight issues with POST requests.
 *
 * Supported endpoints:
 * READ operations:
 * - ?action=data - Returns all lots and students data
 * - ?action=report - Returns attendance report data
 * - ?action=eventConfig - Returns event configuration (check-out toggle state)
 *
 * WRITE operations (pass data as JSON in 'payload' parameter):
 * - ?action=update&payload={...} - Handle all update operations
 */
function doGet(e) {
  try {
    logRequest("GET", e.parameter);

    const action = e.parameter.action;

    // Read operations
    if (action === "data") {
      return handleGetData();
    } else if (action === "report") {
      return handleGetReport();
    } else if (action === "eventConfig") {
      return handleGetEventConfig();
    }

    // Write operations via GET (CORS workaround)
    if (action === "update") {
      if (!e.parameter.payload) {
        return createJsonResponse({ error: "Missing 'payload' parameter" }, 400);
      }

      const payload = JSON.parse(decodeURIComponent(e.parameter.payload));

      if (!checkAuth(e, payload)) {
        return createJsonResponse({ error: "Unauthorized access. Valid API key required." }, 401);
      }

      const type = payload.type;

      if (!type) {
        return createJsonResponse({ error: "Missing 'type' field in payload" }, 400);
      }

      switch (type) {
        case "UPDATE_LOT_STATUS":
          return handleUpdateLotStatus(payload);
        case "UPDATE_BULK_STATUS":
          return handleUpdateBulkStatus(payload);
        case "UPDATE_LOT_DETAILS":
          return handleUpdateLotDetails(payload);
        case "UPDATE_STUDENT_STATUS":
          return handleUpdateStudentStatus(payload);
        case "UPDATE_EVENT_CONFIG":
          return handleUpdateEventConfig(payload);
        case "OCR_UPLOAD":
          return handleOcrUpload(payload);
        case "UPLOAD_SIGNIN_SHEET":
          return handleSignInSheetUpload(payload);
        case "UPLOAD_BULK_SIGNIN_SHEETS":
          return handleBulkSignInSheetUpload(payload);
        case "RECONCILE_PLACEHOLDER":
          return handleReconcilePlaceholder(payload);
        case "RESET_DATABASE":
          return handleResetDatabase(payload);
        default:
          return createJsonResponse({
            error: `Invalid update type: ${type}. Supported: UPDATE_LOT_STATUS, UPDATE_BULK_STATUS, UPDATE_LOT_DETAILS, UPDATE_STUDENT_STATUS, UPDATE_EVENT_CONFIG, OCR_UPLOAD, UPLOAD_SIGNIN_SHEET, UPLOAD_BULK_SIGNIN_SHEETS, RECONCILE_PLACEHOLDER, RESET_DATABASE`
          }, 400);
      }
    }

    return createJsonResponse({ error: "Invalid GET action. Supported: data, report, eventConfig, update" }, 400);
  } catch (error) {
    logError("doGet", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Main entry point for POST requests. Used for all write operations.
 *
 * Supported types:
 * - UPDATE_LOT_STATUS - Update single lot status
 * - UPDATE_BULK_STATUS - Update multiple lots status
 * - UPDATE_LOT_DETAILS - Update lot comments/student counts
 * - UPDATE_STUDENT_STATUS - Update student check-in status
 * - UPDATE_EVENT_CONFIG - Update event configuration (check-out toggle)
 * - OCR_UPLOAD - Process image for text extraction
 */
function doPost(e) {
  try {
    let payload;

    // Handle different POST data formats
    // 1. URL-encoded form data (application/x-www-form-urlencoded)
    //    - Data is in e.parameter.payload
    //    - This is what we use for large payloads to avoid CORS
    if (e.parameter && e.parameter.payload) {
      try {
        payload = JSON.parse(e.parameter.payload);
      } catch (parseError) {
        return createJsonResponse({ error: "Invalid JSON in form payload" }, 400);
      }
    }
    // 2. JSON POST (application/json)
    //    - Data is in e.postData.contents
    else if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseError) {
        return createJsonResponse({ error: "Invalid JSON in POST body" }, 400);
      }
    }
    // 3. No data provided
    else {
      return createJsonResponse({ error: "No POST data provided" }, 400);
    }

    const type = payload.type;

    logRequest("POST", { type, timestamp: new Date().toISOString() });

    if (!checkAuth(e, payload)) {
      return createJsonResponse({ error: "Unauthorized access. Valid API key required." }, 401);
    }

    if (!type) {
      return createJsonResponse({ error: "Missing 'type' field in payload" }, 400);
    }

    switch (type) {
      case "UPDATE_LOT_STATUS":
        return handleUpdateLotStatus(payload);
      case "UPDATE_BULK_STATUS":
        return handleUpdateBulkStatus(payload);
      case "UPDATE_LOT_DETAILS":
        return handleUpdateLotDetails(payload);
      case "UPDATE_STUDENT_STATUS":
        return handleUpdateStudentStatus(payload);
      case "UPDATE_EVENT_CONFIG":
        return handleUpdateEventConfig(payload);
      case "OCR_UPLOAD":
        return handleOcrUpload(payload);
      case "UPLOAD_SIGNIN_SHEET":
        return handleSignInSheetUpload(payload);
      case "UPLOAD_BULK_SIGNIN_SHEETS":
        return handleBulkSignInSheetUpload(payload);
      case "RECONCILE_PLACEHOLDER":
        return handleReconcilePlaceholder(payload);
      case "RESET_DATABASE":
        return handleResetDatabase(payload);
      default:
        return createJsonResponse({
          error: `Invalid POST type: ${type}. Supported: UPDATE_LOT_STATUS, UPDATE_BULK_STATUS, UPDATE_LOT_DETAILS, UPDATE_STUDENT_STATUS, UPDATE_EVENT_CONFIG, OCR_UPLOAD, UPLOAD_SIGNIN_SHEET, UPLOAD_BULK_SIGNIN_SHEETS, RECONCILE_PLACEHOLDER, RESET_DATABASE`
        }, 400);
    }
  } catch (error) {
    logError("doPost", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handles CORS preflight OPTIONS requests.
 * This is critical for allowing POST requests from web applications.
 */
function doOptions(e) {
  const output = ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);

  return output;
}

/**
 * Helper function to read the current event config
 * @returns {object} { eventName, eventDate }
 */
function getEventConfigData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.EVENT_CONFIG.name);
    if (!sheet) {
      logError("getEventConfigData", "EventConfig sheet not found");
      return { eventName: "DefaultEvent", eventDate: new Date().toISOString().split('T')[0] };
    }

    const data = sheet.getDataRange().getValues();
    logInfo("getEventConfigData", `EventConfig sheet has ${data.length} rows`);

    if (data.length < 2) {
      logError("getEventConfigData", "EventConfig sheet is empty (no data rows)");
      return { eventName: "DefaultEvent", eventDate: new Date().toISOString().split('T')[0] };
    }

    const headers = data[0];
    logInfo("getEventConfigData", `Headers found: ${JSON.stringify(headers)}`);

    const eventNameIndex = headers.indexOf("eventName");
    const eventDateIndex = headers.indexOf("eventDate");

    if (eventNameIndex === -1 || eventDateIndex === -1) {
      logError("getEventConfigData", `EventConfig sheet missing required headers. eventNameIndex: ${eventNameIndex}, eventDateIndex: ${eventDateIndex}`);
      return { eventName: "DefaultEvent", eventDate: new Date().toISOString().split('T')[0] };
    }

    const configRow = data[1]; // Get the first config row
    const eventName = configRow[eventNameIndex] || "CleanupEvent";
    const eventDate = configRow[eventDateIndex] ? new Date(configRow[eventDateIndex]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    logInfo("getEventConfigData", `Retrieved event config - Name: "${eventName}", Date: "${eventDate}"`);

    return {
      eventName: eventName,
      eventDate: eventDate
    };

  } catch (error) {
    logError("getEventConfigData", error);
    return { eventName: "ErrorEvent", eventDate: new Date().toISOString().split('T')[0] };
  }
}

// --- NAME MATCHING UTILITIES ---

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Normalize a name for comparison
 */
function normalizeName(name) {
  if (!name || typeof name !== 'string') {
    return { full: '', first: '', last: '', normalized: '' };
  }

  let cleaned = name.trim().toLowerCase();
  cleaned = cleaned.replace(/\s+(jr\.?|sr\.?|iii?|iv|v)$/i, '');
  cleaned = cleaned.replace(/\./g, '').replace(/\s+/g, ' ');

  let first = '';
  let last = '';

  if (cleaned.indexOf(',') !== -1) {
    const parts = cleaned.split(',').map(function(p) { return p.trim(); });
    last = parts[0] || '';
    first = parts[1] || '';
  } else {
    const parts = cleaned.split(' ').filter(function(p) { return p.length > 0; });
    if (parts.length >= 2) {
      first = parts[0];
      last = parts[parts.length - 1];
    } else if (parts.length === 1) {
      last = parts[0];
    }
  }

  const normalized = [first, last].filter(function(p) { return p; }).join(' ');

  return {
    full: cleaned,
    first: first,
    last: last,
    normalized: normalized
  };
}

/**
 * Calculate similarity score between two names
 */
function calculateNameSimilarity(name1, name2) {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);

  if (!norm1.normalized || !norm2.normalized) {
    return 0;
  }

  if (norm1.normalized === norm2.normalized) {
    return 1.0;
  }

  const lastNameMatch = norm1.last && norm2.last && norm1.last === norm2.last;
  const firstNameMatch = norm1.first && norm2.first && norm1.first === norm2.first;

  if (lastNameMatch && firstNameMatch) {
    return 1.0;
  }

  if (lastNameMatch && norm1.first && norm2.first) {
    const firstInitialMatch = norm1.first[0] === norm2.first[0];
    if (firstInitialMatch) {
      return 0.9;
    }

    const firstDistance = levenshteinDistance(norm1.first, norm2.first);
    const maxFirstLen = Math.max(norm1.first.length, norm2.first.length);
    const firstSimilarity = 1 - (firstDistance / maxFirstLen);

    if (firstSimilarity > 0.7) {
      return 0.85;
    }
  }

  const fullDistance = levenshteinDistance(norm1.normalized, norm2.normalized);
  const maxLen = Math.max(norm1.normalized.length, norm2.normalized.length);
  const fullSimilarity = 1 - (fullDistance / maxLen);

  if (fullSimilarity > 0.8) {
    return fullSimilarity;
  }

  if (norm1.last === norm2.last && norm1.first && norm2.first) {
    if (norm1.first.length === 1 && norm2.first[0] === norm1.first[0]) {
      return 0.75;
    }
    if (norm2.first.length === 1 && norm1.first[0] === norm2.first[0]) {
      return 0.75;
    }
  }

  return fullSimilarity;
}

/**
 * Find best match for a name in roster
 * Enhanced with configurable threshold (default 0.85 for higher accuracy)
 */
function findBestMatch(extractedName, roster, threshold) {
  if (!extractedName || !roster || roster.length === 0) {
    return null;
  }

  // Default threshold raised to 0.85 for better accuracy
  threshold = threshold || 0.85;
  let bestMatch = null;
  let bestScore = 0;

  for (let i = 0; i < roster.length; i++) {
    const student = roster[i];
    const score = calculateNameSimilarity(extractedName, student.name);

    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = {
        student: student,
        score: score,
        confidence: score >= 0.95 ? 'exact' : score >= 0.85 ? 'high' : score >= 0.75 ? 'medium' : 'low'
      };
    }
  }

  return bestMatch;
}

// --- HANDLERS ---

/**
 * Handles fetching all data (Lots and Students) for initialization.
 * NOTE: Students data now comes from ActualRoster tab which includes attendance columns (event1-event7)
 */
function handleGetData() {
  const lotsData = readSheetData(SHEETS.LOTS);

  // Read ActualRoster sheet with attendance data
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rosterSheet = ss.getSheetByName(SHEETS.ACTUAL_ROSTER.name);

  if (!rosterSheet) {
    throw new Error('ActualRoster sheet not found');
  }

  const rosterData = rosterSheet.getDataRange().getValues();
  if (rosterData.length === 0) {
    return createJsonResponse({ lots: lotsData, students: [] });
  }

  const headers = rosterData[0];

  // Find column indices
  const nameIdx = headers.indexOf('name');
  const instrumentIdx = headers.indexOf('instrument');
  const gradeIdx = headers.indexOf('grade');
  const sectionIdx = headers.indexOf('section');

  // Attendance columns are E through K (indices 4-10)
  // These columns have dynamic headers like "Aug. 31 - 45%", so we use fixed positions
  const event1Idx = 4;  // Column E
  const event2Idx = 5;  // Column F
  const event3Idx = 6;  // Column G
  const event4Idx = 7;  // Column H
  const event5Idx = 8;  // Column I
  const event6Idx = 9;  // Column J
  const event7Idx = 10; // Column K

  // Build students array
  const studentsData = [];
  for (let i = 1; i < rosterData.length; i++) {
    const row = rosterData[i];
    studentsData.push({
      id: i, // Use row number as ID
      name: row[nameIdx] || '',
      instrument: row[instrumentIdx] || '',
      grade: row[gradeIdx] || '',
      section: row[sectionIdx] || '',
      event1: row[event1Idx] || '',
      event2: row[event2Idx] || '',
      event3: row[event3Idx] || '',
      event4: row[event4Idx] || '',
      event5: row[event5Idx] || '',
      event6: row[event6Idx] || '',
      event7: row[event7Idx] || ''
    });
  }

  // Convert date fields for lots
  lotsData.forEach(lot => {
    if (lot.lastUpdated) lot.lastUpdated = new Date(lot.lastUpdated);
    if (lot.actualStartTime) lot.actualStartTime = new Date(lot.actualStartTime);
    if (lot.completedTime) lot.completedTime = new Date(lot.completedTime);
  });

  // Merge with today's check-in data from STUDENTS sheet (for check-in/check-out times and lot assignments)
  const checkInData = readSheetData(SHEETS.STUDENTS);
  const checkInMap = {};
  checkInData.forEach(student => {
    checkInMap[student.name] = {
      checkedIn: student.checkedIn,
      checkInTime: student.checkInTime ? new Date(student.checkInTime) : null,
      checkOutTime: student.checkOutTime ? new Date(student.checkOutTime) : null,
      assignedLot: student.assignedLot
    };
  });

  // Merge attendance data with check-in data
  studentsData.forEach(student => {
    const checkIn = checkInMap[student.name];
    if (checkIn) {
      student.checkedIn = checkIn.checkedIn;
      student.checkInTime = checkIn.checkInTime;
      student.checkOutTime = checkIn.checkOutTime;
      student.assignedLot = checkIn.assignedLot;
    } else {
      // Default values if no check-in data exists
      student.checkedIn = false;
      student.checkInTime = null;
      student.checkOutTime = null;
      student.assignedLot = null;
    }
  });

  return createJsonResponse({ lots: lotsData, students: studentsData });
}

/**
 * Handles updating lot status for a single lot.
 */
function handleUpdateLotStatus(payload) {
  try {
    validateLotStatusPayload(payload);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.LOTS.name);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const lotIndex = headers.indexOf("id");
    const statusIndex = headers.indexOf("status");
    const lastUpdatedIndex = headers.indexOf("lastUpdated");
    const updatedByIndex = headers.indexOf("updatedBy");
    const actualStartTimeIndex = headers.indexOf("actualStartTime");
    const completedTimeIndex = headers.indexOf("completedTime");

    const currentTime = new Date().toISOString();
    let lotFound = false;

    // Convert payload lotId to string for comparison (handles both string and number IDs)
    const lotIdToUpdate = String(payload.lotId);

    for (let i = 1; i < data.length; i++) {
      const sheetLotId = String(data[i][lotIndex]); // Convert sheet ID to string for comparison

      if (sheetLotId === lotIdToUpdate) {
        lotFound = true;

        // Update basic fields
        data[i][statusIndex] = payload.status;
        data[i][lastUpdatedIndex] = currentTime;
        data[i][updatedByIndex] = payload.updatedBy || "System";

        // Handle status-specific timestamp updates
        if (payload.status === 'in-progress' && !data[i][actualStartTimeIndex]) {
          data[i][actualStartTimeIndex] = currentTime;
        } else if (payload.status === 'complete') {
          if (!data[i][actualStartTimeIndex]) {
            // Estimate start time if not set
            data[i][actualStartTimeIndex] = new Date(Date.now() - 45 * 60 * 1000).toISOString();
          }
          data[i][completedTimeIndex] = currentTime;
        }

        break;
      }
    }

    if (!lotFound) {
      return createJsonResponse({ error: `Lot not found: ${payload.lotId}` }, 404);
    }

    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    logInfo("handleUpdateLotStatus", `Updated lot ${payload.lotId} to ${payload.status}`);

    return createJsonResponse({
      success: true,
      lotId: payload.lotId,
      status: payload.status,
      timestamp: currentTime
    });

  } catch (error) {
    logError("handleUpdateLotStatus", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handles updating status for multiple lots (bulk operation).
 */
function handleUpdateBulkStatus(payload) {
  try {
    // ENHANCED DEBUG: Log the entire payload first
    logInfo("handleUpdateBulkStatus", `=== BULK UPDATE REQUEST START ===`);
    logInfo("handleUpdateBulkStatus", `Full payload: ${JSON.stringify(payload)}`);

    if (!payload.lotIds || !Array.isArray(payload.lotIds) || payload.lotIds.length === 0) {
      logError("handleUpdateBulkStatus", `Invalid lotIds: ${JSON.stringify(payload.lotIds)}`);
      return createJsonResponse({ error: "lotIds array is required and must not be empty" }, 400);
    }

    if (!payload.status || !VALID_LOT_STATUSES.includes(payload.status)) {
      return createJsonResponse({ error: `Invalid status. Must be one of: ${VALID_LOT_STATUSES.join(', ')}` }, 400);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.LOTS.name);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const lotIndex = headers.indexOf("id");
    const statusIndex = headers.indexOf("status");
    const lastUpdatedIndex = headers.indexOf("lastUpdated");
    const updatedByIndex = headers.indexOf("updatedBy");
    const actualStartTimeIndex = headers.indexOf("actualStartTime");
    const completedTimeIndex = headers.indexOf("completedTime");

    const currentTime = new Date().toISOString();
    const updatedLots = [];

    // ENHANCED DEBUG: Log types of received IDs
    logInfo("handleUpdateBulkStatus", `Received lotIds count: ${payload.lotIds.length}`);
    logInfo("handleUpdateBulkStatus", `Received lotIds: ${JSON.stringify(payload.lotIds)}`);
    logInfo("handleUpdateBulkStatus", `Received lotIds types: ${payload.lotIds.map(id => typeof id).join(', ')}`);

    // Convert payload lotIds to strings for comparison (handles both string and number IDs)
    const lotIdsToUpdate = payload.lotIds.map(id => String(id));

    logInfo("handleUpdateBulkStatus", `Converted lotIds: ${JSON.stringify(lotIdsToUpdate)}`);

    // ENHANCED DEBUG: Log all sheet lot IDs BEFORE the loop
    const allSheetLotIds = [];
    const allSheetLotIdTypes = [];
    for (let i = 1; i < data.length; i++) {
      allSheetLotIds.push(data[i][lotIndex]);
      allSheetLotIdTypes.push(typeof data[i][lotIndex]);
    }
    logInfo("handleUpdateBulkStatus", `Sheet lot IDs (raw): ${JSON.stringify(allSheetLotIds)}`);
    logInfo("handleUpdateBulkStatus", `Sheet lot ID types: ${allSheetLotIdTypes.join(', ')}`);

    for (let i = 1; i < data.length; i++) {
      const sheetLotId = String(data[i][lotIndex]); // Convert sheet ID to string for comparison
      const originalSheetLotId = data[i][lotIndex];

      // ENHANCED DEBUG: Log first few comparisons
      if (i <= 3) {
        logInfo("handleUpdateBulkStatus", `Row ${i}: Comparing sheet ID "${sheetLotId}" (type: ${typeof originalSheetLotId}) against ${JSON.stringify(lotIdsToUpdate)}`);
      }

      if (lotIdsToUpdate.includes(sheetLotId)) {
        logInfo("handleUpdateBulkStatus", `MATCH FOUND: Row ${i}, ID: ${sheetLotId}`);
        updatedLots.push(data[i][lotIndex]);

        // Update basic fields
        data[i][statusIndex] = payload.status;
        data[i][lastUpdatedIndex] = currentTime;
        data[i][updatedByIndex] = payload.updatedBy || "System";

        // Handle status-specific timestamp updates
        if (payload.status === 'in-progress' && !data[i][actualStartTimeIndex]) {
          data[i][actualStartTimeIndex] = currentTime;
        } else if (payload.status === 'complete') {
          if (!data[i][actualStartTimeIndex]) {
            data[i][actualStartTimeIndex] = new Date(Date.now() - 45 * 60 * 1000).toISOString();
          }
          data[i][completedTimeIndex] = currentTime;
        }
      }
    }

    // Debug logging
    logInfo("handleUpdateBulkStatus", `Found ${updatedLots.length} lots to update`);
    if (updatedLots.length === 0) {
      logInfo("handleUpdateBulkStatus", `NO MATCHES FOUND!`);
      logInfo("handleUpdateBulkStatus", `Looking for: ${JSON.stringify(lotIdsToUpdate)}`);
      logInfo("handleUpdateBulkStatus", `Available in sheet: ${JSON.stringify(allSheetLotIds.map(id => String(id)))}`);
    }

    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    logInfo("handleUpdateBulkStatus", `Updated ${updatedLots.length} lots to ${payload.status}`);

    return createJsonResponse({
      success: true,
      updatedLots: updatedLots,
      status: payload.status,
      timestamp: currentTime
    });

  } catch (error) {
    logError("handleUpdateBulkStatus", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handles updating specific lot details (e.g., comment, signed up count, photos).
 */
function handleUpdateLotDetails(payload) {
  try {
    if (!payload.lotId) {
      return createJsonResponse({ error: "lotId is required" }, 400);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.LOTS.name);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const idIndex = headers.indexOf("id");
    const commentIndex = headers.indexOf("comment");
    const countIndex = headers.indexOf("totalStudentsSignedUp");
    const lastUpdatedIndex = headers.indexOf("lastUpdated");
    const updatedByIndex = headers.indexOf("updatedBy");
    const photoIndex = headers.indexOf("signUpSheetPhoto");

    let lotFound = false;
    const currentTime = new Date().toISOString();

    // Convert payload lotId to string for comparison (handles both string and number IDs)
    const lotIdToUpdate = String(payload.lotId);

    for (let i = 1; i < data.length; i++) {
      const sheetLotId = String(data[i][idIndex]); // Convert sheet ID to string for comparison

      if (sheetLotId === lotIdToUpdate) {
        lotFound = true;

        // Update fields if provided
        if (payload.comment !== undefined) {
          data[i][commentIndex] = payload.comment;
        }
        if (payload.totalStudentsSignedUp !== undefined) {
          const count = parseInt(payload.totalStudentsSignedUp);
          if (isNaN(count) || count < 0) {
            return createJsonResponse({ error: "totalStudentsSignedUp must be a non-negative number" }, 400);
          }
          data[i][countIndex] = count;
        }
        if (payload.signUpSheetPhoto !== undefined) {
          data[i][photoIndex] = payload.signUpSheetPhoto;
        }

        // Always update metadata
        data[i][lastUpdatedIndex] = currentTime;
        data[i][updatedByIndex] = payload.updatedBy || "Director";

        break;
      }
    }

    if (!lotFound) {
      return createJsonResponse({ error: `Lot not found: ${payload.lotId}` }, 404);
    }

    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    logInfo("handleUpdateLotDetails", `Updated details for lot ${payload.lotId}`);

    return createJsonResponse({
      success: true,
      lotId: payload.lotId,
      timestamp: currentTime
    });

  } catch (error) {
    logError("handleUpdateLotDetails", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handles updating student status (check-in/out) and logging attendance.
 */
function handleUpdateStudentStatus(payload) {
  try {
    if (!payload.studentId) {
      return createJsonResponse({ error: "studentId is required" }, 400);
    }

    if (!payload.updates || typeof payload.updates.checkedIn !== 'boolean') {
      return createJsonResponse({ error: "updates.checkedIn boolean field is required" }, 400);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.STUDENTS.name);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const studentId = payload.studentId;
    const isCheckIn = payload.updates.checkedIn;

    const idIndex = headers.indexOf("id");
    const checkedInIndex = headers.indexOf("checkedIn");
    const timeIndex = headers.indexOf("checkInTime");
    const lotIndex = headers.indexOf("assignedLot");

    // New tracking fields
    const matchedByAIIndex = headers.indexOf("matchedByAI");
    const manualCheckInIndex = headers.indexOf("manualCheckIn");
    const isPlaceholderIndex = headers.indexOf("isPlaceholder");

    const currentTime = new Date();
    let studentFound = false;
    let studentName = "";

    // Convert payload studentId to string for comparison (handles both string and number IDs)
    const studentIdToUpdate = String(studentId);

    for (let i = 1; i < data.length; i++) {
      const sheetStudentId = String(data[i][idIndex]); // Convert sheet ID to string for comparison

      if (sheetStudentId === studentIdToUpdate) {
        studentFound = true;
        studentName = data[i][headers.indexOf("name")] || "Unknown Student";

        const previousCheckInTime = data[i][timeIndex];
        const currentLot = data[i][lotIndex];

        // Update student status
        data[i][checkedInIndex] = isCheckIn;

        // IMPORTANT: Preserve checkInTime on check-out (never clear it)
        // Only update checkInTime when checking IN
        if (isCheckIn) {
          data[i][timeIndex] = currentTime.toISOString();

          // Set manual check-in flag (this is a manual check-in via the app)
          if (manualCheckInIndex >= 0) data[i][manualCheckInIndex] = true;
          if (matchedByAIIndex >= 0) data[i][matchedByAIIndex] = false;
          if (isPlaceholderIndex >= 0) data[i][isPlaceholderIndex] = false;
        }

        // Handle check-out: log to attendance and clear lot assignment
        if (!isCheckIn && previousCheckInTime) {
          try {
            const logSheet = ss.getSheetByName(SHEETS.ATTENDANCE_LOG.name);
            logSheet.appendRow([
              studentId,
              studentName, // Student name for easier reporting
              currentTime.toISOString().split('T')[0], // Game Date (YYYY-MM-DD)
              previousCheckInTime, // Original check-in time (preserved)
              currentTime.toISOString(), // Check-out time
              currentLot || "" // Assigned lot (may be empty)
            ]);

            // Clear lot assignment on checkout
            data[i][lotIndex] = "";

          } catch (logError) {
            logError("handleUpdateStudentStatus", `Failed to log attendance for ${studentId}: ${logError}`);
            // Continue with student update even if logging fails
          }
        }

        // Handle check-in: assign to lot if provided
        if (isCheckIn && payload.updates.assignedLot) {
          data[i][lotIndex] = payload.updates.assignedLot;

          // Log check-in to attendance log
          try {
            const logSheet = ss.getSheetByName(SHEETS.ATTENDANCE_LOG.name);
            logSheet.appendRow([
              studentId,
              studentName,
              currentTime.toISOString().split('T')[0], // Game Date
              currentTime.toISOString(), // Check-in time
              "", // Check-out time (empty until they check out)
              payload.updates.assignedLot
            ]);
          } catch (logError) {
            logError("handleUpdateStudentStatus", `Failed to log check-in for ${studentId}: ${logError}`);
          }
        }

        break;
      }
    }

    if (!studentFound) {
      return createJsonResponse({ error: `Student not found: ${studentId}` }, 404);
    }

    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

    const action = isCheckIn ? "checked in" : "checked out";
    logInfo("handleUpdateStudentStatus", `${studentName} (${studentId}) ${action}`);

    return createJsonResponse({
      success: true,
      studentId: studentId,
      studentName: studentName,
      action: action,
      timestamp: currentTime.toISOString()
    });

  } catch (error) {
    logError("handleUpdateStudentStatus", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handles fetching event configuration (check-out toggle state)
 */
function handleGetEventConfig() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.EVENT_CONFIG.name);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.EVENT_CONFIG.name);
      sheet.getRange(1, 1, 1, SHEETS.EVENT_CONFIG.headers.length)
        .setValues([SHEETS.EVENT_CONFIG.headers])
        .setFontWeight('bold')
        .setBackground('#E8F0FE');

      // Add default event config
      const today = new Date().toISOString().split('T')[0];
      sheet.appendRow([
        "event-current",
        `Cleanup Event ${today}`,
        today,
        false, // checkOutEnabled defaults to false
        new Date().toISOString()
      ]);
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      // No config exists, return default
      return createJsonResponse({
        eventId: "event-current",
        eventName: "Current Event",
        eventDate: new Date().toISOString().split('T')[0],
        checkOutEnabled: false,
        lastUpdated: new Date().toISOString()
      });
    }

    // Return the first (current) event config
    const headers = data[0];
    const row = data[1];
    const config = {};
    headers.forEach((header, index) => {
      config[header] = row[index];
    });

    return createJsonResponse(config);

  } catch (error) {
    logError("handleGetEventConfig", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handles updating event configuration (check-out toggle)
 */
function handleUpdateEventConfig(payload) {
  try {
    if (typeof payload.checkOutEnabled !== 'boolean') {
      return createJsonResponse({ error: "checkOutEnabled boolean field is required" }, 400);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEETS.EVENT_CONFIG.name);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.EVENT_CONFIG.name);
      sheet.getRange(1, 1, 1, SHEETS.EVENT_CONFIG.headers.length)
        .setValues([SHEETS.EVENT_CONFIG.headers])
        .setFontWeight('bold')
        .setBackground('#E8F0FE');
    }

    const data = sheet.getDataRange().getValues();
    const headers = data.length > 0 ? data[0] : SHEETS.EVENT_CONFIG.headers;

    const enabledIndex = headers.indexOf("checkOutEnabled");
    const lastUpdatedIndex = headers.indexOf("lastUpdated");
    const currentTime = new Date().toISOString();

    if (data.length < 2) {
      // No config exists, create one
      const today = new Date().toISOString().split('T')[0];
      sheet.appendRow([
        payload.eventId || "event-current",
        payload.eventName || `Cleanup Event ${today}`,
        today,
        payload.checkOutEnabled,
        currentTime
      ]);
    } else {
      // Update existing config (first row after headers)
      data[1][enabledIndex] = payload.checkOutEnabled;
      data[1][lastUpdatedIndex] = currentTime;
      sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    }

    logInfo("handleUpdateEventConfig", `Check-out enabled: ${payload.checkOutEnabled}`);

    return createJsonResponse({
      success: true,
      checkOutEnabled: payload.checkOutEnabled,
      timestamp: currentTime
    });

  } catch (error) {
    logError("handleUpdateEventConfig", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handles image upload and OCR processing using Google Cloud Vision API.
 * NOTE: This requires enabling the Google Cloud Vision API in your GAS project!
 */
function handleOcrUpload(payload) {
  try {
    if (!payload.data || !payload.lotId) {
      return createJsonResponse({ error: "Both 'data' (base64 image) and 'lotId' are required" }, 400);
    }

    const imageBase64 = payload.data.split(",")[1];
    if (!imageBase64) {
      return createJsonResponse({ error: "Invalid base64 image data" }, 400);
    }

    const imageBytes = Utilities.base64Decode(imageBase64);
    const blob = Utilities.newBlob(imageBytes, 'image/jpeg', 'sign_in_sheet.jpg');

    try {
      // This requires the Cloud Vision API service to be enabled in the Apps Script project
      const visionResponse = Vision.Images.annotate({
        requests: [{
          image: {
            content: Utilities.base64Encode(blob.getBytes())
          },
          features: [{
            type: "TEXT_DETECTION"
          }]
        }]
      });

      const extractedText = visionResponse.responses[0]?.fullTextAnnotation?.text || "No text detected";

      // Store the image and OCR result with the lot
      const updateResult = handleUpdateLotDetails({
        lotId: payload.lotId,
        signUpSheetPhoto: payload.data,
        updatedBy: payload.updatedBy || "OCR System"
      });

      if (!updateResult.success) {
        return updateResult;
      }

      logInfo("handleOcrUpload", `OCR processed for lot ${payload.lotId}, extracted ${extractedText.length} characters`);

      return createJsonResponse({
        success: true,
        ocrResult: extractedText,
        lotId: payload.lotId,
        message: "Image uploaded and text extracted successfully. Review the extracted text and manually update student statuses as needed."
      });

    } catch (visionError) {
      logError("handleOcrUpload", `Vision API error: ${visionError}`);

      // Fallback: still save the image but return mock OCR result
      handleUpdateLotDetails({
        lotId: payload.lotId,
        signUpSheetPhoto: payload.data,
        updatedBy: payload.updatedBy || "OCR System"
      });

      return createJsonResponse({
        success: true,
        ocrResult: `Mock OCR Result: Image uploaded for lot ${payload.lotId}. Vision API not available - please manually review the uploaded image.`,
        lotId: payload.lotId,
        warning: "Vision API not available, image saved but OCR not performed"
      });
    }

  } catch (error) {
    logError("handleOcrUpload", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handles sign-in sheet upload with AI-generated count
 * Supports both AI-powered and manual student count entry
 */
function handleSignInSheetUpload(payload) {
  try {
    // Validate required fields
    if (!payload.lotId) {
      return createJsonResponse({ error: "lotId is required" }, 400);
    }

    if (payload.aiCount === undefined && payload.manualCount === undefined) {
      return createJsonResponse({ error: "Either aiCount or manualCount is required" }, 400);
    }

    // Get event config data for file naming
    const { eventName, eventDate } = getEventConfigData();

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.LOTS.name);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find column indices
    const idIndex = headers.indexOf("id");
    const nameIndex = headers.indexOf("name"); // Added nameIndex for file naming
    const statusIndex = headers.indexOf("status");
    const photoIndex = headers.indexOf("signUpSheetPhoto");
    const aiCountIndex = headers.indexOf("aiStudentCount");
    const aiConfidenceIndex = headers.indexOf("aiConfidence");
    const aiTimestampIndex = headers.indexOf("aiAnalysisTimestamp");
    const countSourceIndex = headers.indexOf("countSource");
    const enteredByIndex = headers.indexOf("countEnteredBy");
    const manualOverrideIndex = headers.indexOf("manualCountOverride");
    const aiMatchedCountIndex = headers.indexOf("aiMatchedCount");
    const aiUnmatchedCountIndex = headers.indexOf("aiUnmatchedCount");
    const commentIndex = headers.indexOf("comment");
    const lastUpdatedIndex = headers.indexOf("lastUpdated");
    const updatedByIndex = headers.indexOf("updatedBy");
    const actualStartTimeIndex = headers.indexOf("actualStartTime");

    const currentTime = new Date().toISOString();
    let lotFound = false;

    // Convert payload lotId to string for comparison
    const lotIdToUpdate = String(payload.lotId);

    // Variable to store Drive upload result
    let driveUploadResult = null;

    // Find and update lot row
    for (let i = 1; i < data.length; i++) {
      const sheetLotId = String(data[i][idIndex]);

      if (sheetLotId === lotIdToUpdate) {
        lotFound = true;

        // Get Lot Name for file naming
        const lotName = data[i][nameIndex] || 'UnknownLot';

        // Upload image to Google Drive if provided
        if (payload.imageData) {
          try {
            // Upload to Drive with meaningful filename
            driveUploadResult = uploadImageToDrive(payload.imageData, lotName, eventName, eventDate);

            // Store the Drive view URL instead of base64 data
            // This URL can be used directly in <img> tags
            data[i][photoIndex] = driveUploadResult.viewUrl;

            logInfo("handleSignInSheetUpload",
              `Image uploaded to Drive for lot ${lotIdToUpdate}: ${driveUploadResult.fileId}`);
          } catch (driveError) {
            // Log error but don't fail the entire operation
            logError("handleSignInSheetUpload", `Drive upload failed: ${driveError.message}`);

            // Fallback: store a note that upload failed
            data[i][photoIndex] = `[Upload failed: ${driveError.message}]`;
          }
        }

        // Determine count source and values
        const countSource = payload.countSource || (payload.aiCount !== undefined ? 'ai' : 'manual');

        if (countSource === 'ai') {
          // AI-powered count
          data[i][aiCountIndex] = payload.aiCount;
          data[i][aiConfidenceIndex] = payload.aiConfidence || 'unknown';
          data[i][aiTimestampIndex] = currentTime;
          data[i][countSourceIndex] = 'ai';

          // If manual override provided, store it
          if (payload.manualCount !== undefined) {
            data[i][manualOverrideIndex] = payload.manualCount;
          }
        } else {
          // Manual entry
          data[i][aiCountIndex] = payload.manualCount || payload.aiCount || 0;
          data[i][aiConfidenceIndex] = 'manual';
          data[i][aiTimestampIndex] = currentTime;
          data[i][countSourceIndex] = 'manual';
          data[i][manualOverrideIndex] = payload.manualCount;
        }

        // Store who entered the data
        data[i][enteredByIndex] = payload.enteredBy || "Unknown User";

        // Add notes to comment if provided
        if (payload.notes) {
          const existingComment = data[i][commentIndex] || "";
          const newComment = existingComment
            ? `${existingComment}\n[AI Check-in ${currentTime}]: ${payload.notes}`
            : `[AI Check-in ${currentTime}]: ${payload.notes}`;
          data[i][commentIndex] = newComment;
        }

        // AUTOMATIC STATUS TRANSITION: Ready → In Progress
        // When a count is submitted (AI or manual), automatically transition from "ready" to "in-progress"
        // Only transition if current status is "ready" - don't override other statuses
        const currentStatus = data[i][statusIndex];
        if (currentStatus === 'ready') {
          data[i][statusIndex] = 'in-progress';
          // Set actualStartTime when transitioning to in-progress
          if (!data[i][actualStartTimeIndex]) {
            data[i][actualStartTimeIndex] = currentTime;
          }
          logInfo("handleSignInSheetUpload",
            `Auto-transitioned lot ${lotIdToUpdate} from 'ready' to 'in-progress'`);
        }

        // Update metadata
        data[i][lastUpdatedIndex] = currentTime;
        data[i][updatedByIndex] = payload.enteredBy || "AI Check-in System";

        break;
      }
    }

    if (!lotFound) {
      return createJsonResponse({ error: `Lot not found: ${payload.lotId}` }, 404);
    }

    const finalCount = payload.manualCount || payload.aiCount || 0;
    const source = payload.countSource || (payload.aiCount !== undefined ? 'ai' : 'manual');

    logInfo("handleSignInSheetUpload",
      `Sign-in sheet uploaded for lot ${payload.lotId}: ${finalCount} students (${source})`);

    // Process student names if provided (AI extraction)
    let matchResults = null;
    if (payload.studentNames && Array.isArray(payload.studentNames) && payload.studentNames.length > 0) {
      try {
        // Pass the photo URL to processStudentNames for placeholder records
        const photoUrl = driveUploadResult ? driveUploadResult.viewUrl : null;
        matchResults = processStudentNames(payload.studentNames, payload.lotId, currentTime, photoUrl);
        logInfo("handleSignInSheetUpload",
          `Processed ${matchResults.matchedCount} matched, ${matchResults.unmatchedCount} unmatched for lot ${payload.lotId}`);

        // Update the lot row with matched/unmatched counts
        for (let i = 1; i < data.length; i++) {
          const sheetLotId = String(data[i][idIndex]);
          if (sheetLotId === lotIdToUpdate) {
            if (aiMatchedCountIndex !== -1) {
              data[i][aiMatchedCountIndex] = matchResults.matchedCount;
            }
            if (aiUnmatchedCountIndex !== -1) {
              data[i][aiUnmatchedCountIndex] = matchResults.unmatchedCount;
            }
            break;
          }
        }
      } catch (nameError) {
        logError("handleSignInSheetUpload", `Failed to process student names: ${nameError.message}`);
        // Don't fail the entire operation if name processing fails
      }
    }

    // Write updated data back to sheet (after processing student names)
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

    // Build response with Drive upload info if available
    const response = {
      success: true,
      message: 'Parking Lot Cleanup Sign-in sheet uploaded successfully',
      lotId: payload.lotId,
      studentCount: finalCount,
      countSource: source,
      confidence: payload.aiConfidence || 'manual',
      timestamp: currentTime
    };

    // Include Drive upload details if image was uploaded
    if (driveUploadResult) {
      response.imageUpload = {
        fileId: driveUploadResult.fileId,
        viewUrl: driveUploadResult.viewUrl,
        fileName: driveUploadResult.fileName,
        uploadedAt: driveUploadResult.uploadedAt
      };
    }

    // Include student matching results if available
    if (matchResults) {
      response.studentMatching = {
        totalExtracted: matchResults.totalProcessed,
        matched: matchResults.matchedCount,
        placeholders: matchResults.placeholderCount,
        duplicates: matchResults.duplicateCount,
        matchRate: matchResults.matchRate,
        matchedStudents: matchResults.matched,
        placeholderStudents: matchResults.unmatched,
        duplicateMatches: matchResults.duplicates
      };

      // Update success message with matching details
      if (matchResults.placeholderCount > 0) {
        response.message = `Sign-in sheet uploaded successfully. ` +
          `Checked in ${matchResults.matchedCount} students (${matchResults.placeholderCount} require reconciliation)`;
      } else {
        response.message = `Sign-in sheet uploaded successfully. ` +
          `Checked in ${matchResults.matchedCount} students (all matched)`;
      }
    }

    return createJsonResponse(response);

  } catch (error) {
    logError("handleSignInSheetUpload", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handles bulk sign-in sheet upload with automatic lot identification
 * Processes multiple sign-in sheets at once, identifying lots from image headers
 *
 * @param {Object} payload - Request payload
 * @param {Array<Object>} payload.uploads - Array of upload objects
 * @param {string} payload.uploads[].lotId - Identified lot ID
 * @param {string} payload.uploads[].lotName - Identified lot name
 * @param {number} payload.uploads[].aiCount - AI-detected student count
 * @param {Array<string>} payload.uploads[].studentNames - Extracted student names
 * @param {string} payload.uploads[].aiConfidence - AI confidence level
 * @param {string} payload.uploads[].imageData - Base64 encoded image
 * @param {string} payload.uploads[].notes - Additional notes
 * @param {string} payload.uploads[].eventDate - Event date from header
 * @param {string} payload.enteredBy - Name of user who submitted
 * @returns {Object} Results with successful and failed uploads
 */
function handleBulkSignInSheetUpload(payload) {
  try {
    // Validate required fields
    if (!payload.uploads || !Array.isArray(payload.uploads) || payload.uploads.length === 0) {
      return createJsonResponse({ error: "uploads array is required and must not be empty" }, 400);
    }

    logInfo("handleBulkSignInSheetUpload", `Processing ${payload.uploads.length} sign-in sheets...`);

    // Get event config data for file naming
    const { eventName: configEventName, eventDate: configEventDate } = getEventConfigData();

    const results = {
      successful: [],
      failed: []
    };

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const lotsSheet = ss.getSheetByName(SHEETS.LOTS.name);
    const lotsData = lotsSheet.getDataRange().getValues();
    const headers = lotsData[0];

    // Get column indices
    const idIndex = headers.indexOf("id");
    const nameIndex = headers.indexOf("name");
    const statusIndex = headers.indexOf("status");
    const photoIndex = headers.indexOf("signUpSheetPhoto");
    const aiCountIndex = headers.indexOf("aiStudentCount");
    const aiConfidenceIndex = headers.indexOf("aiConfidence");
    const aiTimestampIndex = headers.indexOf("aiAnalysisTimestamp");
    const countSourceIndex = headers.indexOf("countSource");
    const countEnteredByIndex = headers.indexOf("countEnteredBy");
    const manualOverrideIndex = headers.indexOf("manualCountOverride");
    const aiMatchedCountIndex = headers.indexOf("aiMatchedCount");
    const aiUnmatchedCountIndex = headers.indexOf("aiUnmatchedCount");
    const lastUpdatedIndex = headers.indexOf("lastUpdated");
    const updatedByIndex = headers.indexOf("updatedBy");
    const actualStartTimeIndex = headers.indexOf("actualStartTime");

    const currentTime = new Date().toISOString();
    let dataModified = false;

    // Process each upload
    for (let uploadIdx = 0; uploadIdx < payload.uploads.length; uploadIdx++) {
      const upload = payload.uploads[uploadIdx];

      try {
        // Validate upload object
        if (!upload.lotId) {
          throw new Error("lotId is required for each upload");
        }

        if (upload.aiCount === undefined) {
          throw new Error("aiCount is required for each upload");
        }

        // Find the lot in the sheet
        let lotFound = false;
        let lotRowIndex = -1;

        for (let i = 1; i < lotsData.length; i++) {
          const sheetLotId = String(lotsData[i][idIndex]);
          if (sheetLotId === String(upload.lotId)) {
            lotFound = true;
            lotRowIndex = i;
            break;
          }
        }

        if (!lotFound) {
          throw new Error(`Lot not found: ${upload.lotId}`);
        }

        // Upload image to Google Drive if provided
        let driveUploadResult = null;
        if (upload.imageData) {
          try {
            // Get data for file name
            const lotName = upload.lotName || lotsData[lotRowIndex][nameIndex] || 'UnknownLot';
            // Use event name from config
            const eventNameForFile = configEventName || 'CleanupEvent';
            // Use event date from upload if present, fallback to config, fallback to today
            const eventDateForFile = upload.eventDate || configEventDate || new Date().toISOString().split('T')[0];

            driveUploadResult = uploadImageToDrive(upload.imageData, lotName, eventNameForFile, eventDateForFile);
            lotsData[lotRowIndex][photoIndex] = driveUploadResult.viewUrl;
            logInfo("handleBulkSignInSheetUpload",
              `Image uploaded to Drive for lot ${upload.lotId}: ${driveUploadResult.fileId}`);
          } catch (driveError) {
            logError("handleBulkSignInSheetUpload", `Drive upload failed for ${upload.lotId}: ${driveError.message}`);
            lotsData[lotRowIndex][photoIndex] = `[Upload failed: ${driveError.message}]`;
          }
        }

        // Update AI count and metadata
        lotsData[lotRowIndex][aiCountIndex] = upload.aiCount;
        lotsData[lotRowIndex][aiConfidenceIndex] = upload.aiConfidence || 'unknown';
        lotsData[lotRowIndex][aiTimestampIndex] = currentTime;
        lotsData[lotRowIndex][countSourceIndex] = 'ai';
        lotsData[lotRowIndex][countEnteredByIndex] = payload.enteredBy || "Bulk Upload System";

        // Auto-transition from ready to in-progress
        const currentStatus = lotsData[lotRowIndex][statusIndex];
        if (currentStatus === 'ready') {
          lotsData[lotRowIndex][statusIndex] = 'in-progress';
          if (!lotsData[lotRowIndex][actualStartTimeIndex]) {
            lotsData[lotRowIndex][actualStartTimeIndex] = currentTime;
          }
        }

        // Update metadata
        lotsData[lotRowIndex][lastUpdatedIndex] = currentTime;
        lotsData[lotRowIndex][updatedByIndex] = payload.enteredBy || "Bulk Upload System";

        dataModified = true;

        // Process student names if provided
        let matchResults = null;
        if (upload.studentNames && Array.isArray(upload.studentNames) && upload.studentNames.length > 0) {
          try {
            // Pass the photo URL to processStudentNames for placeholder records
            const photoUrl = driveUploadResult ? driveUploadResult.viewUrl : null;
            matchResults = processStudentNames(upload.studentNames, upload.lotId, currentTime, photoUrl);
            logInfo("handleBulkSignInSheetUpload",
              `Processed ${matchResults.matchedCount} matched, ${matchResults.unmatchedCount} unmatched for lot ${upload.lotId}`);

            // Store matched/unmatched counts in the lot row
            if (aiMatchedCountIndex !== -1) {
              lotsData[lotRowIndex][aiMatchedCountIndex] = matchResults.matchedCount;
            }
            if (aiUnmatchedCountIndex !== -1) {
              lotsData[lotRowIndex][aiUnmatchedCountIndex] = matchResults.unmatchedCount;
            }
          } catch (nameError) {
            logError("handleBulkSignInSheetUpload", `Failed to process student names for ${upload.lotId}: ${nameError.message}`);
          }
        }

        // Add to successful results with detailed matching statistics
        results.successful.push({
          lotId: upload.lotId,
          lotName: upload.lotName || lotsData[lotRowIndex][nameIndex],
          totalStudentsFound: upload.aiCount,
          matchedCount: matchResults ? matchResults.matchedCount : 0,
          unmatchedCount: matchResults ? matchResults.unmatchedCount : 0,
          unmatchedNames: matchResults ? matchResults.unmatchedNames : [],
          confidence: upload.aiConfidence,
          imageUploaded: !!driveUploadResult,
          // Legacy fields for backward compatibility
          studentCount: upload.aiCount,
          studentsMatched: matchResults ? matchResults.matchedCount : 0,
          studentsUnmatched: matchResults ? matchResults.unmatchedCount : 0
        });

        logInfo("handleBulkSignInSheetUpload",
          `Successfully processed lot ${upload.lotId}: ${upload.aiCount} students`);

      } catch (uploadError) {
        // Add to failed results
        results.failed.push({
          lotId: upload.lotId || 'unknown',
          lotName: upload.lotName || 'unknown',
          error: uploadError.message || 'Processing failed'
        });

        logError("handleBulkSignInSheetUpload",
          `Failed to process upload ${uploadIdx + 1}: ${uploadError.message}`);
      }
    }

    // Write all changes back to sheet at once
    if (dataModified) {
      lotsSheet.getRange(1, 1, lotsData.length, lotsData[0].length).setValues(lotsData);
      logInfo("handleBulkSignInSheetUpload", "All lot data written to sheet");
    }

    const successCount = results.successful.length;
    const failCount = results.failed.length;

    logInfo("handleBulkSignInSheetUpload",
      `Bulk upload complete: ${successCount} successful, ${failCount} failed`);

    return createJsonResponse({
      success: true,
      message: `Processed ${payload.uploads.length} sign-in sheets: ${successCount} successful, ${failCount} failed`,
      successful: results.successful,
      failed: results.failed,
      timestamp: currentTime
    });

  } catch (error) {
    logError("handleBulkSignInSheetUpload", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Reconcile a placeholder student with an actual student from the roster
 * Merges placeholder check-in data with the real student record
 */
function handleReconcilePlaceholder(payload) {
  try {
    if (!payload.placeholderId || !payload.actualStudentId) {
      return createJsonResponse({
        error: "Both placeholderId and actualStudentId are required"
      }, 400);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const studentsSheet = ss.getSheetByName(SHEETS.STUDENTS.name);

    if (!studentsSheet) {
      return createJsonResponse({ error: 'Students sheet not found' }, 404);
    }

    const studentsData = studentsSheet.getDataRange().getValues();
    const headers = studentsData[0];

    // Find column indices
    const idIndex = headers.indexOf('id');
    const checkedInIndex = headers.indexOf('checkedIn');
    const checkInTimeIndex = headers.indexOf('checkInTime');
    const assignedLotIndex = headers.indexOf('assignedLot');
    const matchedByAIIndex = headers.indexOf('matchedByAI');
    const manualCheckInIndex = headers.indexOf('manualCheckIn');
    const isPlaceholderIndex = headers.indexOf('isPlaceholder');
    const extractedNameTextIndex = headers.indexOf('extractedNameText');
    const requiresReconciliationIndex = headers.indexOf('requiresReconciliation');

    let placeholderRow = null;
    let placeholderIndex = -1;
    let actualStudentRow = null;
    let actualStudentIndex = -1;

    // Find placeholder and actual student rows
    for (let i = 1; i < studentsData.length; i++) {
      const rowId = String(studentsData[i][idIndex]);

      if (rowId === String(payload.placeholderId)) {
        placeholderRow = studentsData[i];
        placeholderIndex = i;
      }

      if (rowId === String(payload.actualStudentId)) {
        actualStudentRow = studentsData[i];
        actualStudentIndex = i;
      }

      if (placeholderRow && actualStudentRow) break;
    }

    if (!placeholderRow) {
      return createJsonResponse({
        error: `Placeholder student not found: ${payload.placeholderId}`
      }, 404);
    }

    if (!actualStudentRow) {
      return createJsonResponse({
        error: `Actual student not found: ${payload.actualStudentId}`
      }, 404);
    }

    // Check if actual student is already checked in
    if (actualStudentRow[checkedInIndex] === true) {
      return createJsonResponse({
        error: 'This student is already checked in. Cannot reconcile with placeholder.',
        warning: 'Student may have been checked in manually or through another sign-in sheet.'
      }, 400);
    }

    // Transfer check-in data from placeholder to actual student
    studentsData[actualStudentIndex][checkedInIndex] = placeholderRow[checkedInIndex];
    studentsData[actualStudentIndex][checkInTimeIndex] = placeholderRow[checkInTimeIndex];
    studentsData[actualStudentIndex][assignedLotIndex] = placeholderRow[assignedLotIndex];

    // Set tracking fields on actual student
    if (matchedByAIIndex >= 0) studentsData[actualStudentIndex][matchedByAIIndex] = true;
    if (manualCheckInIndex >= 0) studentsData[actualStudentIndex][manualCheckInIndex] = false;
    if (isPlaceholderIndex >= 0) studentsData[actualStudentIndex][isPlaceholderIndex] = false;
    if (extractedNameTextIndex >= 0) {
      studentsData[actualStudentIndex][extractedNameTextIndex] = placeholderRow[extractedNameTextIndex];
    }
    if (requiresReconciliationIndex >= 0) {
      studentsData[actualStudentIndex][requiresReconciliationIndex] = false;
    }

    // Delete placeholder row
    studentsData.splice(placeholderIndex, 1);

    // Write updated data back to sheet
    studentsSheet.clearContents();
    studentsSheet.getRange(1, 1, studentsData.length, studentsData[0].length).setValues(studentsData);

    logInfo("handleReconcilePlaceholder",
      `Reconciled placeholder ${payload.placeholderId} with student ${payload.actualStudentId}`);

    return createJsonResponse({
      success: true,
      message: 'Placeholder student successfully reconciled',
      placeholderId: payload.placeholderId,
      actualStudentId: payload.actualStudentId,
      studentName: actualStudentRow[headers.indexOf('name')]
    });

  } catch (error) {
    logError("handleReconcilePlaceholder", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Process extracted student names and update Students tab
 * Matches names against ActualRoster and updates check-in status
 * @param {Array<string>} extractedNames - Names extracted from sign-in sheet
 * @param {string} lotId - Lot ID where students signed in
 * @param {string} checkInTime - Check-in timestamp
 * @param {string} signInSheetPhotoUrl - Google Drive URL of the sign-in sheet image (optional)
 * @returns {Object} Match results with statistics
 */
function processStudentNames(extractedNames, lotId, checkInTime, signInSheetPhotoUrl) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Read ActualRoster
  const rosterSheet = ss.getSheetByName(SHEETS.ACTUAL_ROSTER.name);
  if (!rosterSheet) {
    throw new Error('ActualRoster sheet not found');
  }

  const rosterData = rosterSheet.getDataRange().getValues();
  const rosterHeaders = rosterData[0];

  // Build roster array with student objects
  const roster = [];
  for (let i = 1; i < rosterData.length; i++) {
    const row = rosterData[i];
    const nameIndex = rosterHeaders.indexOf('name');
    const instrumentIndex = rosterHeaders.indexOf('instrument');
    const gradeIndex = rosterHeaders.indexOf('grade');
    const sectionIndex = rosterHeaders.indexOf('section');

    if (row[nameIndex]) {
      roster.push({
        id: `student-${i}`, // Generate ID based on row number
        name: row[nameIndex],
        instrument: row[instrumentIndex] || '',
        year: row[gradeIndex] ? String(row[gradeIndex]) : '',
        section: row[sectionIndex] || ''
      });
    }
  }

  // Match extracted names against roster
  const matched = [];
  const unmatched = [];
  const duplicates = [];
  const matchedStudentIds = {};

  // Use 0.85 threshold for auto-matching (higher accuracy)
  for (let i = 0; i < extractedNames.length; i++) {
    const extractedName = extractedNames[i];
    const match = findBestMatch(extractedName, roster, 0.85);

    if (match) {
      // Check for duplicate matches
      if (matchedStudentIds[match.student.id]) {
        duplicates.push({
          extractedName: extractedName,
          student: match.student,
          score: match.score,
          confidence: match.confidence
        });
      } else {
        matched.push({
          extractedName: extractedName,
          student: match.student,
          score: match.score,
          confidence: match.confidence
        });
        matchedStudentIds[match.student.id] = true;
      }
    } else {
      unmatched.push(extractedName);
    }
  }

  // Update Students tab with matched and unmatched students
  const studentsSheet = ss.getSheetByName(SHEETS.STUDENTS.name);
  if (!studentsSheet) {
    throw new Error('Students sheet not found');
  }

  const studentsData = studentsSheet.getDataRange().getValues();
  const studentsHeaders = studentsData[0];

  const idIndex = studentsHeaders.indexOf('id');
  const nameIndex = studentsHeaders.indexOf('name');
  const instrumentIndex = studentsHeaders.indexOf('instrument');
  const sectionIndex = studentsHeaders.indexOf('section');
  const yearIndex = studentsHeaders.indexOf('year');
  const checkedInIndex = studentsHeaders.indexOf('checkedIn');
  const checkInTimeIndex = studentsHeaders.indexOf('checkInTime');
  const assignedLotIndex = studentsHeaders.indexOf('assignedLot');

  // New tracking fields for AI check-in system
  const matchedByAIIndex = studentsHeaders.indexOf('matchedByAI');
  const manualCheckInIndex = studentsHeaders.indexOf('manualCheckIn');
  const isPlaceholderIndex = studentsHeaders.indexOf('isPlaceholder');
  const extractedNameTextIndex = studentsHeaders.indexOf('extractedNameText');
  const requiresReconciliationIndex = studentsHeaders.indexOf('requiresReconciliation');
  const signInSheetPhotoUrlIndex = studentsHeaders.indexOf('signInSheetPhotoUrl');

  // Track which students were updated
  const updatedStudentIds = {};
  const addedUnmatchedCount = 0;

  // Process matched students first
  if (matched.length > 0) {
    // Update existing students or add new ones
    for (let i = 0; i < matched.length; i++) {
      const matchedStudent = matched[i].student;
      let studentFound = false;

      // Look for existing student in Students tab
      for (let j = 1; j < studentsData.length; j++) {
        if (String(studentsData[j][idIndex]) === String(matchedStudent.id)) {
          // Skip if already checked in (duplicate prevention - first check-in wins)
          if (studentsData[j][checkedInIndex] === true) {
            logInfo("processStudentNames",
              `Student ${matchedStudent.name} already checked in, skipping duplicate`);
            studentFound = true;
            break;
          }

          // Update existing student with AI check-in
          studentsData[j][checkedInIndex] = true;
          studentsData[j][checkInTimeIndex] = checkInTime;
          studentsData[j][assignedLotIndex] = lotId;

          // Set AI tracking fields
          if (matchedByAIIndex >= 0) studentsData[j][matchedByAIIndex] = true;
          if (manualCheckInIndex >= 0) studentsData[j][manualCheckInIndex] = false;
          if (isPlaceholderIndex >= 0) studentsData[j][isPlaceholderIndex] = false;
          if (extractedNameTextIndex >= 0) studentsData[j][extractedNameTextIndex] = matched[i].extractedName;
          if (requiresReconciliationIndex >= 0) studentsData[j][requiresReconciliationIndex] = false;

          studentFound = true;
          updatedStudentIds[matchedStudent.id] = true;
          break;
        }
      }

      // If student not found, add new row
      if (!studentFound) {
        // Create array with same length as headers, filled with empty strings
        const newRow = new Array(studentsHeaders.length).fill('');
        newRow[idIndex] = matchedStudent.id;
        newRow[nameIndex] = matchedStudent.name;
        newRow[instrumentIndex] = matchedStudent.instrument || '';
        newRow[sectionIndex] = matchedStudent.section || '';
        newRow[yearIndex] = matchedStudent.year || '';
        newRow[checkedInIndex] = true;
        newRow[checkInTimeIndex] = checkInTime;
        newRow[assignedLotIndex] = lotId;

        // Set AI tracking fields for new students
        if (matchedByAIIndex >= 0) newRow[matchedByAIIndex] = true;
        if (manualCheckInIndex >= 0) newRow[manualCheckInIndex] = false;
        if (isPlaceholderIndex >= 0) newRow[isPlaceholderIndex] = false;
        if (extractedNameTextIndex >= 0) newRow[extractedNameTextIndex] = matched[i].extractedName;
        if (requiresReconciliationIndex >= 0) newRow[requiresReconciliationIndex] = false;

        studentsData.push(newRow);
        updatedStudentIds[matchedStudent.id] = true;
      }
    }
  }

  // Process unmatched students - add them with placeholder values
  if (unmatched.length > 0) {
    const timestamp = new Date().getTime();

    // Get lot name for better placeholder naming
    const lotsSheet = ss.getSheetByName(SHEETS.LOTS.name);
    let lotName = lotId;
    if (lotsSheet) {
      const lotsData = lotsSheet.getDataRange().getValues();
      const lotsHeaders = lotsData[0];
      const lotIdIdx = lotsHeaders.indexOf('id');
      const lotNameIdx = lotsHeaders.indexOf('name');

      for (let i = 1; i < lotsData.length; i++) {
        if (String(lotsData[i][lotIdIdx]) === String(lotId)) {
          lotName = lotsData[i][lotNameIdx] || lotId;
          break;
        }
      }
    }

    for (let i = 0; i < unmatched.length; i++) {
      const unmatchedName = unmatched[i];

      // Generate unique ID for placeholder student
      const placeholderId = `placeholder-${lotId}-${i + 1}`;

      // Create friendly placeholder name: "Lot 48 - Unidentified #1"
      const placeholderDisplayName = `${lotName} - Unidentified #${i + 1}`;

      // Create new row with placeholder values
      const newRow = new Array(studentsHeaders.length).fill('');
      newRow[idIndex] = placeholderId;
      newRow[nameIndex] = placeholderDisplayName;
      newRow[instrumentIndex] = ''; // Empty for unknown
      newRow[sectionIndex] = ''; // Empty for unknown
      newRow[yearIndex] = ''; // Empty for unknown
      newRow[checkedInIndex] = true;
      newRow[checkInTimeIndex] = checkInTime;
      newRow[assignedLotIndex] = lotId;

      // Set placeholder tracking fields
      if (matchedByAIIndex >= 0) newRow[matchedByAIIndex] = false;
      if (manualCheckInIndex >= 0) newRow[manualCheckInIndex] = false;
      if (isPlaceholderIndex >= 0) newRow[isPlaceholderIndex] = true;
      if (extractedNameTextIndex >= 0) newRow[extractedNameTextIndex] = unmatchedName; // Store raw OCR text
      if (requiresReconciliationIndex >= 0) newRow[requiresReconciliationIndex] = true;
      if (signInSheetPhotoUrlIndex >= 0 && signInSheetPhotoUrl) {
        newRow[signInSheetPhotoUrlIndex] = signInSheetPhotoUrl; // Store photo URL for reconciliation
      }

      studentsData.push(newRow);
      updatedStudentIds[placeholderId] = true;
    }

    logInfo("processStudentNames",
      `Added ${unmatched.length} placeholder students for lot ${lotId} (require reconciliation)`);
  }

  // Write updated data back to Students sheet
  studentsSheet.getRange(1, 1, studentsData.length, studentsData[0].length).setValues(studentsData);

  logInfo("processStudentNames",
    `Updated ${Object.keys(updatedStudentIds).length} total students in Students tab for lot ${lotId} ` +
    `(${matched.length} AI-matched, ${unmatched.length} placeholders created)`);

  // Calculate match rate
  const matchRate = extractedNames.length > 0
    ? (matched.length / extractedNames.length) * 100
    : 0;

  return {
    matched: matched,
    unmatched: unmatched,
    unmatchedNames: unmatched, // Array of original extracted names that failed to match
    duplicates: duplicates,
    matchRate: matchRate,
    totalProcessed: extractedNames.length,
    matchedCount: matched.length,
    unmatchedCount: unmatched.length,
    placeholderCount: unmatched.length,
    duplicateCount: duplicates.length
  };
}

/**
 * Handles generating a comprehensive attendance and progress report.
 */
function handleGetReport() {
  try {
    const lotsData = readSheetData(SHEETS.LOTS);
    const studentsData = readSheetData(SHEETS.STUDENTS);
    const attendanceData = readSheetData(SHEETS.ATTENDANCE_LOG);

    // Generate CSV report data
    let csvData = "Lot ID,Lot Name,Status,Students Signed Up,Students Present,Duration (min)\n";

    lotsData.forEach(lot => {
      const studentsPresent = studentsData.filter(s => s.assignedLot === lot.id && s.checkedIn).length;
      let duration = "N/A";

      if (lot.actualStartTime && lot.completedTime) {
        const start = new Date(lot.actualStartTime);
        const end = new Date(lot.completedTime);
        duration = Math.round((end - start) / (1000 * 60)); // minutes
      }

      csvData += `"${lot.id}","${lot.name}","${lot.status}",${lot.totalStudentsSignedUp || 0},${studentsPresent},${duration}\n`;
    });

    // Add attendance summary
    csvData += "\n\nStudent Attendance Summary\n";
    csvData += "Student ID,Student Name,Check In Time,Check Out Time,Assigned Lot\n";

    attendanceData.forEach(record => {
      const student = studentsData.find(s => s.id === record.studentId);
      const studentName = student ? student.name : "Unknown";
      csvData += `"${record.studentId}","${studentName}","${record.checkInTime}","${record.checkOutTime}","${record.assignedLotId}"\n`;
    });

    logInfo("handleGetReport", "Generated attendance report");

    return createJsonResponse({
      success: true,
      reportData: csvData,
      timestamp: new Date().toISOString(),
      summary: {
        totalLots: lotsData.length,
        completedLots: lotsData.filter(l => l.status === 'complete').length,
        totalStudents: studentsData.length,
        checkedInStudents: studentsData.filter(s => s.checkedIn).length,
        attendanceRecords: attendanceData.length
      }
    });

  } catch (error) {
    logError("handleGetReport", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handles resetting the database for testing/development purposes
 * Clears data from Students, AttendanceLog, and EventConfig tabs
 * Resets lot statuses to "ready" and clears student count/timing data from Lots sheet
 * Clears all weekly attendance data (event1-event7) from ActualRoster sheet
 * Preserves student roster data (name, instrument, grade, section) in ActualRoster
 */
function handleResetDatabase(payload) {
  try {
    logInfo("handleResetDatabase", "Starting database reset operation");

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Track which sheets were reset
    const resetSheets = [];
    const clearedColumns = [];

    // 1. Reset Students sheet (clear all data rows, keep headers)
    const studentsSheet = ss.getSheetByName(SHEETS.STUDENTS.name);
    if (studentsSheet) {
      const lastRow = studentsSheet.getLastRow();
      if (lastRow > 1) {
        // Delete all rows except header
        studentsSheet.deleteRows(2, lastRow - 1);
        resetSheets.push("Students");
        logInfo("handleResetDatabase", `Cleared ${lastRow - 1} rows from Students sheet`);
      } else {
        logInfo("handleResetDatabase", "Students sheet already empty");
      }
    }

    // 2. Reset AttendanceLog sheet (clear all data rows, keep headers)
    const attendanceSheet = ss.getSheetByName(SHEETS.ATTENDANCE_LOG.name);
    if (attendanceSheet) {
      const lastRow = attendanceSheet.getLastRow();
      if (lastRow > 1) {
        // Delete all rows except header
        attendanceSheet.deleteRows(2, lastRow - 1);
        resetSheets.push("AttendanceLog");
        logInfo("handleResetDatabase", `Cleared ${lastRow - 1} rows from AttendanceLog sheet`);
      } else {
        logInfo("handleResetDatabase", "AttendanceLog sheet already empty");
      }
    }

    // 3. Reset EventConfig sheet (clear all data rows, keep headers)
    const eventConfigSheet = ss.getSheetByName(SHEETS.EVENT_CONFIG.name);
    if (eventConfigSheet) {
      const lastRow = eventConfigSheet.getLastRow();
      if (lastRow > 1) {
        // Delete all rows except header
        eventConfigSheet.deleteRows(2, lastRow - 1);
        resetSheets.push("EventConfig");
        logInfo("handleResetDatabase", `Cleared ${lastRow - 1} rows from EventConfig sheet`);
      } else {
        logInfo("handleResetDatabase", "EventConfig sheet already empty");
      }
    }

    // 4. Reset Lots sheet: set all statuses to "ready" and clear timing/count data
    const lotsSheet = ss.getSheetByName(SHEETS.LOTS.name);
    if (lotsSheet) {
      const data = lotsSheet.getDataRange().getValues();
      const headers = data[0];

      // Find column indices for fields to reset
      const columnsToReset = [
        'lastUpdated',        // Column H - clear
        'updatedBy',          // Column I - clear
        'actualStartTime',    // Column J - clear
        'completedTime',      // Column K - clear
        'aiStudentCount',     // AI-related fields
        'manualCountOverride',
        'aiConfidence',
        'aiAnalysisTimestamp',
        'countSource',
        'countEnteredBy',
        'aiMatchedCount',     // Event-specific matched/unmatched counts
        'aiUnmatchedCount',
        'signUpSheetPhoto',
        'comment'
      ];

      const columnIndices = {};
      columnsToReset.forEach(colName => {
        const index = headers.indexOf(colName);
        if (index !== -1) {
          columnIndices[colName] = index;
        }
      });

      // Find status column index
      const statusIndex = headers.indexOf('status');

      // Reset status to "ready" and clear specified columns for all data rows
      let clearedCount = 0;
      let statusResetCount = 0;
      for (let i = 1; i < data.length; i++) {
        // Set status to "ready"
        if (statusIndex !== -1 && data[i][statusIndex] !== 'ready') {
          data[i][statusIndex] = 'ready';
          statusResetCount++;
        }

        // Clear the specified columns
        Object.entries(columnIndices).forEach(([colName, colIndex]) => {
          if (data[i][colIndex] !== '') {
            data[i][colIndex] = '';
            clearedCount++;
          }
        });
      }

      // Write updated data back to sheet
      if (clearedCount > 0 || statusResetCount > 0) {
        lotsSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
        clearedColumns.push(...Object.keys(columnIndices));
        logInfo("handleResetDatabase",
          `Reset ${statusResetCount} lot statuses to "ready" and cleared ${clearedCount} cells from Lots sheet (columns: ${Object.keys(columnIndices).join(', ')})`);
      } else {
        logInfo("handleResetDatabase", "Lots sheet already in reset state");
      }
    }

    // 5. Clear weekly attendance data (event1-event7) from ActualRoster sheet
    // Preserve student roster data (name, instrument, grade, section) but clear all event attendance
    const actualRosterSheet = ss.getSheetByName(SHEETS.ACTUAL_ROSTER.name);
    if (actualRosterSheet) {
      const data = actualRosterSheet.getDataRange().getValues();
      if (data.length > 1) { // Has data rows beyond header
        const headers = data[0];
        
        // Find indices for event columns (event1-event7)
        const eventColumns = ['event1', 'event2', 'event3', 'event4', 'event5', 'event6', 'event7'];
        const eventColumnIndices = [];
        
        eventColumns.forEach(eventCol => {
          const index = headers.indexOf(eventCol);
          if (index !== -1) {
            eventColumnIndices.push(index);
          }
        });
        
        // Clear event columns for all data rows
        let clearedEventCells = 0;
        for (let i = 1; i < data.length; i++) {
          eventColumnIndices.forEach(colIndex => {
            if (data[i][colIndex] !== '') {
              data[i][colIndex] = '';
              clearedEventCells++;
            }
          });
        }
        
        // Write updated data back to sheet
        if (clearedEventCells > 0) {
          actualRosterSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
          resetSheets.push("ActualRoster (event columns cleared)");
          logInfo("handleResetDatabase",
            `Cleared ${clearedEventCells} event attendance cells from ActualRoster sheet (preserved student roster data)`);
        } else {
          logInfo("handleResetDatabase", "ActualRoster event columns already empty");
        }
      }
    }

    logInfo("handleResetDatabase",
      `Database reset complete. Reset sheets: ${resetSheets.join(", ")}. Cleared Lots columns: ${clearedColumns.join(", ")}`);

    return createJsonResponse({
      success: true,
      message: "Database reset successfully - all lots set to 'ready' status, all weekly attendance data cleared",
      resetSheets: resetSheets,
      clearedLotsColumns: clearedColumns,
      preservedSheets: ["ActualRoster (student roster preserved)"],
      preservedLotsData: ["id", "name", "zone", "coordinates", "etc."],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError("handleResetDatabase", error);
    return createJsonResponse({
      error: "Failed to reset database: " + error.toString()
    }, 500);
  }
}

// --- UTILITY FUNCTIONS ---

/**
 * Reads all data from a specified sheet and returns it as an array of objects.
 */
function readSheetData(sheetConfig) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetConfig.name);

  if (!sheet) {
    throw new Error(`Sheet not found: ${sheetConfig.name}`);
  }

  const data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    return [];
  }

  const headers = data.shift();

  return data.map(row => {
    const obj = {};
    sheetConfig.headers.forEach((header) => {
      const headerIndex = headers.indexOf(header);
      obj[header] = headerIndex >= 0 ? (row[headerIndex] || "") : "";
    });
    return obj;
  });
}

/**
 * Creates a standard JSON response object for the GAS Web App with CORS headers.
 */
function createJsonResponse(data, status = 200) {
  // Add status to response data for client-side handling
  const responseData = { ...data };
  if (status !== 200) {
    responseData.httpStatus = status;
  }

  // CRITICAL: Explicitly set CORS headers
  // Google Apps Script does NOT automatically set these for all deployment types
  const output = ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);

  // Set CORS headers to allow requests from any origin
  // In production, you may want to restrict this to specific domains
  return output;
}

/**
 * Authorization check with API key validation.
 */
function checkAuth(e, payload) {
  // For GET requests, check query parameter
  if (e && e.parameter && e.parameter.apiKey) {
    return e.parameter.apiKey === MOCK_API_KEY;
  }

  // For POST requests, check payload
  if (payload && payload.apiKey) {
    return payload.apiKey === MOCK_API_KEY;
  }

  // For development/testing, allow requests without API key
  // In production, change this to return false
  return true;
}

// --- GOOGLE DRIVE HELPER FUNCTIONS ---

/**
 * Gets the Google Drive folder for storing sign-in sheet images using the configured FOLDER_ID.
 * @returns {GoogleAppsScript.Drive.Folder} The folder object
 */
function getImageFolder() {
  try {
    if (!DRIVE_CONFIG.FOLDER_ID) {
      throw new Error("DRIVE_CONFIG.FOLDER_ID is not set.");
    }
    const folder = DriveApp.getFolderById(DRIVE_CONFIG.FOLDER_ID);
    logInfo("getImageFolder", `Using configured folder: ${folder.getName()} (ID: ${folder.getId()})`);
    return folder;
  } catch (error) {
    logError("getImageFolder", `Failed to get folder by ID "${DRIVE_CONFIG.FOLDER_ID}": ${error}. Check ID and permissions.`);
    throw new Error(`Failed to access Drive folder. Check FOLDER_ID and script permissions.`);
  }
}

/**
 * Uploads a base64-encoded image to Google Drive with the specified naming convention.
 * @param {string} base64Data - Base64 encoded image data (with or without data URI prefix)
 * @param {string} lotName - The name of the lot (e.g., "Lot 11 Jail Lot")
 * @param {string} eventName - The name of the event (e.g., "2025 Clean Up #5")
 * @param {string} eventDate - The date of the event (e.g., "2025-10-26")
 * @param {string} mimeType - MIME type of the image (default: image/jpeg)
 * @returns {Object} Object containing fileId, fileUrl, and viewUrl
 */
function uploadImageToDrive(base64Data, lotName, eventName, eventDate, mimeType = 'image/jpeg') {
  try {
    // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');

    // Sanitize file name components
    // Remove all special characters except alphanumeric, spaces, hyphens, and # symbol
    // Then replace spaces and colons with underscores
    const safeLotName = (lotName || 'UnknownLot')
      .replace(/[^a-z0-9\s-#]/gi, '')
      .replace(/[\s:]+/g, '_')
      .trim();

    const safeEventName = (eventName || 'CleanupEvent')
      .replace(/[^a-z0-9\s-#]/gi, '')
      .replace(/[\s:]+/g, '')
      .trim();

    // Format date
    let safeDate = new Date().toISOString().split('T')[0]; // Default to today
    if (eventDate) {
      try {
        safeDate = new Date(eventDate).toISOString().split('T')[0];
      } catch (e) {
        // eventDate might not be a full parsable date, just use it as is if it looks like YYYY-MM-DD
        if (typeof eventDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
          safeDate = eventDate;
        }
        // otherwise, default to today is already set
      }
    }

    // Create the new file name: EventName_LotName_EventDate_Timestamp.jpg
    // Event name comes FIRST so files sort by event in Google Drive
    const newFileName = `${safeEventName}_${safeLotName}_${safeDate}_${new Date().getTime()}.jpg`;

    // Decode base64 to blob
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Clean),
      mimeType,
      newFileName
    );

    // Get the configured folder
    const folder = getImageFolder(); // Use the new function

    // Upload the new file
    const file = folder.createFile(blob);

    // Make the file accessible to anyone with the link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const fileUrl = file.getUrl();
    const viewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    logInfo("uploadImageToDrive", `Uploaded image "${newFileName}" (ID: ${fileId})`);

    return {
      fileId: fileId,
      fileUrl: fileUrl,      // Full Drive URL (for editing/managing)
      viewUrl: viewUrl,      // Direct view URL (for embedding in apps)
      fileName: file.getName(),
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    logError("uploadImageToDrive", error);
    throw new Error(`Failed to upload image to Drive: ${error.message}`);
  }
}

/**
 * Deletes an image from Google Drive by file ID.
 * @param {string} fileId - The Google Drive file ID
 * @returns {boolean} True if successful
 */
function deleteImageFromDrive(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    logInfo("deleteImageFromDrive", `Deleted file: ${fileId}`);
    return true;
  } catch (error) {
    logError("deleteImageFromDrive", error);
    return false;
  }
}

// --- VALIDATION FUNCTIONS ---

/**
 * Validates lot status update payload.
 */
function validateLotStatusPayload(payload) {
  if (!payload.lotId) {
    throw new Error("lotId is required");
  }

  if (!payload.status || !VALID_LOT_STATUSES.includes(payload.status)) {
    throw new Error(`Invalid status. Must be one of: ${VALID_LOT_STATUSES.join(', ')}`);
  }
}

// --- LOGGING FUNCTIONS ---

/**
 * Log informational messages.
 */
function logInfo(functionName, message) {
  Logger.log(`[INFO] ${functionName}: ${message}`);
}

/**
 * Log error messages.
 */
function logError(functionName, error) {
  Logger.log(`[ERROR] ${functionName}: ${error.toString()}`);
}

/**
 * Log API requests for debugging.
 */
function logRequest(method, params) {
  Logger.log(`[REQUEST] ${method}: ${JSON.stringify(params)}`);
}

// --- INITIAL SHEET SETUP (Run these functions once manually) ---

/**
 * Function to run once to create the required sheets if they don't exist.
 * Run this function manually from the Apps Script editor after creating your project.
 */
function setupSheets() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create("TBTC - Band Cleanup Event Data");
    const spreadsheetId = ss.getId();

    Logger.log(`Setting up sheets in spreadsheet: ${spreadsheetId}`);
    Logger.log(`IMPORTANT: Update SPREADSHEET_ID constant to: ${spreadsheetId}`);

    for (const key in SHEETS) {
      const config = SHEETS[key];
      let sheet = ss.getSheetByName(config.name);

      if (!sheet) {
        sheet = ss.insertSheet(config.name);
        Logger.log(`Created sheet: ${config.name}`);
      }

      // Set up headers
      const range = sheet.getRange(1, 1, 1, config.headers.length);
      range.setValues([config.headers]);
      range.setFontWeight('bold');
      range.setBackground('#E8F0FE');

      // Set column widths for better readability
      sheet.autoResizeColumns(1, config.headers.length);
    }

    // Remove default Sheet1 if it exists and is empty
    const defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && defaultSheet.getLastRow() <= 1) {
      ss.deleteSheet(defaultSheet);
    }

    Logger.log("Sheets setup complete!");
    Logger.log("Next steps:");
    Logger.log("1. Update SPREADSHEET_ID constant with: " + spreadsheetId);
    Logger.log("2. Run setupSampleData() to add sample data (optional)");
    Logger.log("3. Deploy as Web App");

    return spreadsheetId;

  } catch (error) {
    Logger.log("Error setting up sheets: " + error.toString());
    throw error;
  }
}

/**
 * Optional: Add sample data for testing.
 * Run this after setupSheets() to populate with sample data.
 */
function setupSampleData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Add sample lots
    const lotsSheet = ss.getSheetByName(SHEETS.LOTS.name);
    const sampleLots = [
      ["lot-1", "Lot 33 North", "north", "not-started", "high", 45, 12, "", "", "Director Smith", "", "", ""],
      ["lot-2", "Lot 33 South", "south", "in-progress", "medium", 30, 8, "Heavy debris area", "", "Director Johnson", "", "", ""],
      ["lot-3", "Lot 43", "east", "complete", "low", 60, 15, "", "", "Director Smith", "", "", ""]
    ];

    if (lotsSheet.getLastRow() === 1) { // Only headers exist
      lotsSheet.getRange(2, 1, sampleLots.length, sampleLots[0].length).setValues(sampleLots);
      Logger.log("Added sample lots data");
    }

    // Add sample students
    const studentsSheet = ss.getSheetByName(SHEETS.STUDENTS.name);
    const sampleStudents = [
      ["student-1", "Emma Johnson", "Flute", "Woodwinds", "junior", true, new Date().toISOString(), "lot-1"],
      ["student-2", "Liam Williams", "Trumpet", "Brass", "senior", true, new Date().toISOString(), "lot-2"],
      ["student-3", "Olivia Brown", "Clarinet", "Woodwinds", "sophomore", false, "", ""]
    ];

    if (studentsSheet.getLastRow() === 1) { // Only headers exist
      studentsSheet.getRange(2, 1, sampleStudents.length, sampleStudents[0].length).setValues(sampleStudents);
      Logger.log("Added sample students data");
    }

    Logger.log("Sample data setup complete!");

  } catch (error) {
    Logger.log("Error setting up sample data: " + error.toString());
    throw error;
  }
}

/**
 * Test function to verify the API is working.
 * Run this after deployment to test basic functionality.
 */
function testApi() {
  try {
    Logger.log("Testing API functions...");

    // Test data retrieval
    const dataResult = handleGetData();
    Logger.log("Data retrieval test: " + (dataResult ? "PASSED" : "FAILED"));

    // Test lot status update
    const statusResult = handleUpdateLotStatus({
      lotId: "lot-1",
      status: "in-progress",
      updatedBy: "Test User"
    });
    Logger.log("Lot status update test: " + (statusResult ? "PASSED" : "FAILED"));

    Logger.log("API tests completed!");

  } catch (error) {
    Logger.log("API test error: " + error.toString());
  }
}
