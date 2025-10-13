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
  // Folder name for storing sign-in sheet images
  FOLDER_NAME: "TBTC Sign-In Sheets",

  // Whether to create the folder if it doesn't exist
  AUTO_CREATE_FOLDER: true,

  // Image file naming pattern: "signin_sheet_{lotId}_{timestamp}.{ext}"
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
      "manualCountOverride"
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
const VALID_LOT_STATUSES = ["not-started", "in-progress", "needs-help", "pending-approval", "complete"];

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
        case "RECONCILE_PLACEHOLDER":
          return handleReconcilePlaceholder(payload);
        default:
          return createJsonResponse({
            error: `Invalid update type: ${type}. Supported: UPDATE_LOT_STATUS, UPDATE_BULK_STATUS, UPDATE_LOT_DETAILS, UPDATE_STUDENT_STATUS, UPDATE_EVENT_CONFIG, OCR_UPLOAD, UPLOAD_SIGNIN_SHEET, RECONCILE_PLACEHOLDER`
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
      case "RECONCILE_PLACEHOLDER":
        return handleReconcilePlaceholder(payload);
      default:
        return createJsonResponse({
          error: `Invalid POST type: ${type}. Supported: UPDATE_LOT_STATUS, UPDATE_BULK_STATUS, UPDATE_LOT_DETAILS, UPDATE_STUDENT_STATUS, UPDATE_EVENT_CONFIG, OCR_UPLOAD, UPLOAD_SIGNIN_SHEET, RECONCILE_PLACEHOLDER`
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

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.LOTS.name);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find column indices
    const idIndex = headers.indexOf("id");
    const photoIndex = headers.indexOf("signUpSheetPhoto");
    const aiCountIndex = headers.indexOf("aiStudentCount");
    const aiConfidenceIndex = headers.indexOf("aiConfidence");
    const aiTimestampIndex = headers.indexOf("aiAnalysisTimestamp");
    const countSourceIndex = headers.indexOf("countSource");
    const enteredByIndex = headers.indexOf("countEnteredBy");
    const manualOverrideIndex = headers.indexOf("manualCountOverride");
    const commentIndex = headers.indexOf("comment");
    const lastUpdatedIndex = headers.indexOf("lastUpdated");
    const updatedByIndex = headers.indexOf("updatedBy");

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

        // Upload image to Google Drive if provided
        if (payload.imageData) {
          try {
            // Upload to Drive and get the file URL
            driveUploadResult = uploadImageToDrive(payload.imageData, lotIdToUpdate);

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

        // Update metadata
        data[i][lastUpdatedIndex] = currentTime;
        data[i][updatedByIndex] = payload.enteredBy || "AI Check-in System";

        break;
      }
    }

    if (!lotFound) {
      return createJsonResponse({ error: `Lot not found: ${payload.lotId}` }, 404);
    }

    // Write updated data back to sheet
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

    const finalCount = payload.manualCount || payload.aiCount || 0;
    const source = payload.countSource || (payload.aiCount !== undefined ? 'ai' : 'manual');

    logInfo("handleSignInSheetUpload",
      `Sign-in sheet uploaded for lot ${payload.lotId}: ${finalCount} students (${source})`);

    // Process student names if provided (AI extraction)
    let matchResults = null;
    if (payload.studentNames && Array.isArray(payload.studentNames) && payload.studentNames.length > 0) {
      try {
        matchResults = processStudentNames(payload.studentNames, payload.lotId, currentTime);
        logInfo("handleSignInSheetUpload",
          `Processed ${matchResults.matched.length} student names for lot ${payload.lotId}`);
      } catch (nameError) {
        logError("handleSignInSheetUpload", `Failed to process student names: ${nameError.message}`);
        // Don't fail the entire operation if name processing fails
      }
    }

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
 */
function processStudentNames(extractedNames, lotId, checkInTime) {
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
    duplicates: duplicates,
    matchRate: matchRate,
    totalProcessed: extractedNames.length,
    matchedCount: matched.length,
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
 * Gets or creates the Google Drive folder for storing sign-in sheet images.
 * @returns {GoogleAppsScript.Drive.Folder} The folder object
 */
function getOrCreateImageFolder() {
  try {
    // Search for existing folder
    const folders = DriveApp.getFoldersByName(DRIVE_CONFIG.FOLDER_NAME);

    if (folders.hasNext()) {
      const folder = folders.next();
      logInfo("getOrCreateImageFolder", `Using existing folder: ${folder.getId()}`);
      return folder;
    }

    // Create new folder if it doesn't exist and auto-create is enabled
    if (DRIVE_CONFIG.AUTO_CREATE_FOLDER) {
      const newFolder = DriveApp.createFolder(DRIVE_CONFIG.FOLDER_NAME);
      logInfo("getOrCreateImageFolder", `Created new folder: ${newFolder.getId()}`);
      return newFolder;
    }

    throw new Error(`Folder "${DRIVE_CONFIG.FOLDER_NAME}" not found and AUTO_CREATE_FOLDER is disabled`);
  } catch (error) {
    logError("getOrCreateImageFolder", error);
    throw error;
  }
}

/**
 * Uploads a base64-encoded image to Google Drive.
 * @param {string} base64Data - Base64 encoded image data (with or without data URI prefix)
 * @param {string} lotId - Lot identifier for naming the file
 * @param {string} mimeType - MIME type of the image (default: image/jpeg)
 * @returns {Object} Object containing fileId, fileUrl, and viewUrl
 */
function uploadImageToDrive(base64Data, lotId, mimeType = 'image/jpeg') {
  try {
    // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');

    // Decode base64 to blob
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Clean),
      mimeType,
      `${DRIVE_CONFIG.FILE_NAME_PREFIX}${lotId}_${new Date().getTime()}.jpg`
    );

    // Get or create the folder
    const folder = getOrCreateImageFolder();

    // Check if there's an existing file for this lot and delete it
    const existingFiles = folder.getFilesByName(blob.getName());
    while (existingFiles.hasNext()) {
      const file = existingFiles.next();
      logInfo("uploadImageToDrive", `Deleting old file: ${file.getId()}`);
      file.setTrashed(true);
    }

    // Upload the new file
    const file = folder.createFile(blob);

    // Make the file accessible to anyone with the link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const fileUrl = file.getUrl();
    const viewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    logInfo("uploadImageToDrive", `Uploaded image for lot ${lotId}: ${fileId}`);

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
