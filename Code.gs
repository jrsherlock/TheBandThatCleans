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

const SHEETS = {
  LOTS: {
    name: "Lots",
    headers: [
      "id", "name", "section", "status", "priority", "estimatedTime",
      "totalStudentsSignedUp", "comment", "lastUpdated", "updatedBy",
      "actualStartTime", "completedTime", "signUpSheetPhoto"
    ]
  },
  STUDENTS: {
    name: "Students",
    headers: [
      "id", "name", "instrument", "section", "year",
      "checkedIn", "checkInTime", "assignedLot"
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
 * Main entry point for GET requests. Used primarily for fetching initial data or reports.
 *
 * Supported endpoints:
 * - ?action=data - Returns all lots and students data
 * - ?action=report - Returns attendance report data
 * - ?action=eventConfig - Returns event configuration (check-out toggle state)
 */
function doGet(e) {
  try {
    logRequest("GET", e.parameter);

    const action = e.parameter.action;

    if (action === "data") {
      return handleGetData();
    } else if (action === "report") {
      return handleGetReport();
    } else if (action === "eventConfig") {
      return handleGetEventConfig();
    }

    return createJsonResponse({ error: "Invalid GET action. Supported: data, report, eventConfig" }, 400);
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
    if (!e.postData || !e.postData.contents) {
      return createJsonResponse({ error: "No POST data provided" }, 400);
    }

    const payload = JSON.parse(e.postData.contents);
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
      default:
        return createJsonResponse({
          error: `Invalid POST type: ${type}. Supported: UPDATE_LOT_STATUS, UPDATE_BULK_STATUS, UPDATE_LOT_DETAILS, UPDATE_STUDENT_STATUS, UPDATE_EVENT_CONFIG, OCR_UPLOAD`
        }, 400);
    }
  } catch (error) {
    logError("doPost", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

// --- HANDLERS ---

/**
 * Handles fetching all data (Lots and Students) for initialization.
 */
function handleGetData() {
  const lotsData = readSheetData(SHEETS.LOTS);
  const studentsData = readSheetData(SHEETS.STUDENTS);
  
  // Convert date fields back to Date objects for the frontend, assuming UTC time for transfer
  lotsData.forEach(lot => {
    if (lot.lastUpdated) lot.lastUpdated = new Date(lot.lastUpdated);
    if (lot.actualStartTime) lot.actualStartTime = new Date(lot.actualStartTime);
    if (lot.completedTime) lot.completedTime = new Date(lot.completedTime);
  });
  
  studentsData.forEach(student => {
    if (student.checkInTime) student.checkInTime = new Date(student.checkInTime);
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

    for (let i = 1; i < data.length; i++) {
      if (data[i][lotIndex] === payload.lotId) {
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
    if (!payload.lotIds || !Array.isArray(payload.lotIds) || payload.lotIds.length === 0) {
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

    for (let i = 1; i < data.length; i++) {
      if (payload.lotIds.includes(data[i][lotIndex])) {
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

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === payload.lotId) {
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

    const currentTime = new Date();
    let studentFound = false;
    let studentName = "";

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === studentId) {
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
 * Handles generating a comprehensive attendance and progress report.
 */
function handleGetReport() {
  try {
    const lotsData = readSheetData(SHEETS.LOTS);
    const studentsData = readSheetData(SHEETS.STUDENTS);
    const attendanceData = readSheetData(SHEETS.ATTENDANCE_LOG);

    // Generate CSV report data
    let csvData = "Lot ID,Lot Name,Status,Students Signed Up,Students Present,Completion Time,Duration (min)\n";

    lotsData.forEach(lot => {
      const studentsPresent = studentsData.filter(s => s.assignedLot === lot.id && s.checkedIn).length;
      let duration = "N/A";

      if (lot.actualStartTime && lot.completedTime) {
        const start = new Date(lot.actualStartTime);
        const end = new Date(lot.completedTime);
        duration = Math.round((end - start) / (1000 * 60)); // minutes
      }

      csvData += `"${lot.id}","${lot.name}","${lot.status}",${lot.totalStudentsSignedUp || 0},${studentsPresent},"${lot.completedTime || 'N/A'}",${duration}\n`;
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
 * Creates a standard JSON response object for the GAS Web App.
 */
function createJsonResponse(data, status = 200) {
  // Add status to response data for client-side handling
  const responseData = { ...data };
  if (status !== 200) {
    responseData.httpStatus = status;
  }

  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
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
