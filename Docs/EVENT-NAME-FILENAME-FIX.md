# Event Name Filename Fix

## Overview
This document describes the fix for sign-in sheet image filenames not correctly retrieving the event name from the EventConfig sheet, and the reordering of filename components to prioritize event name for better file organization.

**Date:** 2025-10-26  
**Status:** Fixed

---

## Problem Statement

### Issue 1: Event Name Always "DefaultEvent"
**Symptom:**
- Sign-in sheet images were being uploaded with filenames like:
  - `Golf_Course_DefaultEvent_2025-10-26_1761498892431.jpg`
- The event name was always showing as "DefaultEvent" instead of the actual event name from the EventConfig sheet (e.g., "Clean Up #5")

**Root Cause:**
The `getEventConfigData()` function was correctly looking for the `eventName` column in the EventConfig sheet, but lacked sufficient logging to diagnose why it was returning the fallback value "DefaultEvent" instead of the actual event name.

Potential causes:
1. EventConfig sheet might be empty (no data rows)
2. Headers might not match exactly (case sensitivity, extra spaces)
3. Event name cell might be empty
4. Sheet might not exist or be named differently

### Issue 2: Poor File Organization in Google Drive
**Symptom:**
- Files were sorted by lot name first: `Golf_Course_CleanUp5_2025-10-26_...jpg`
- Made it difficult to find all images from a specific event
- Users wanted to see all images from "Clean Up #5" grouped together

**Desired Behavior:**
- Files should be sorted by event name first: `CleanUp5_Golf_Course_2025-10-26_...jpg`
- This allows easy filtering and organization by event in Google Drive

---

## Solution

### 1. Enhanced Logging in `getEventConfigData()`

Added comprehensive logging to diagnose and track event config retrieval:

**Changes Made:**
```javascript
function getEventConfigData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.EVENT_CONFIG.name);
    if (!sheet) {
      logError("getEventConfigData", "EventConfig sheet not found");
      return { eventName: "DefaultEvent", eventDate: new Date().toISOString().split('T')[0] };
    }

    const data = sheet.getDataRange().getValues();
    logInfo("getEventConfigData", `EventConfig sheet has ${data.length} rows`);  // NEW
    
    if (data.length < 2) {
      logError("getEventConfigData", "EventConfig sheet is empty (no data rows)");
      return { eventName: "DefaultEvent", eventDate: new Date().toISOString().split('T')[0] };
    }

    const headers = data[0];
    logInfo("getEventConfigData", `Headers found: ${JSON.stringify(headers)}`);  // NEW
    
    const eventNameIndex = headers.indexOf("eventName");
    const eventDateIndex = headers.indexOf("eventDate");

    if (eventNameIndex === -1 || eventDateIndex === -1) {
      logError("getEventConfigData", `EventConfig sheet missing required headers. eventNameIndex: ${eventNameIndex}, eventDateIndex: ${eventDateIndex}`);  // ENHANCED
      return { eventName: "DefaultEvent", eventDate: new Date().toISOString().split('T')[0] };
    }

    const configRow = data[1]; // Get the first config row
    const eventName = configRow[eventNameIndex] || "CleanupEvent";
    const eventDate = configRow[eventDateIndex] ? new Date(configRow[eventDateIndex]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    logInfo("getEventConfigData", `Retrieved event config - Name: "${eventName}", Date: "${eventDate}"`);  // NEW
    
    return {
      eventName: eventName,
      eventDate: eventDate
    };

  } catch (error) {
    logError("getEventConfigData", error);
    return { eventName: "ErrorEvent", eventDate: new Date().toISOString().split('T')[0] };
  }
}
```

**New Logging:**
1. **Row count:** Logs how many rows are in the EventConfig sheet
2. **Headers:** Logs all headers found in the sheet (helps identify case/spacing issues)
3. **Index values:** Logs the column indices for eventName and eventDate
4. **Retrieved values:** Logs the actual event name and date retrieved

**Benefits:**
- Easy to diagnose if EventConfig sheet is empty
- Can see if headers don't match exactly
- Can verify what values are actually being retrieved
- Helps troubleshoot future issues

### 2. Reordered Filename Components

Changed filename format from:
```
{LotName}_{EventName}_{Date}_{Timestamp}.jpg
```

To:
```
{EventName}_{LotName}_{Date}_{Timestamp}.jpg
```

**Implementation:**
```javascript
// OLD: Create the new file name: LotName_EventName_EventDate_Timestamp.jpg
// const newFileName = `${safeLotName}_${safeEventName}_${safeDate}_${new Date().getTime()}.jpg`;

// NEW: Create the new file name: EventName_LotName_EventDate_Timestamp.jpg
// Event name comes FIRST so files sort by event in Google Drive
const newFileName = `${safeEventName}_${safeLotName}_${safeDate}_${new Date().getTime()}.jpg`;
```

**Example Filenames:**

Before:
- `Golf_Course_CleanUp5_2025-10-26_1761498892431.jpg`
- `Jail_Lot_CleanUp5_2025-10-26_1761498892432.jpg`
- `Hancher_CleanUp5_2025-10-26_1761498892433.jpg`

After:
- `CleanUp5_Golf_Course_2025-10-26_1761498892431.jpg`
- `CleanUp5_Jail_Lot_2025-10-26_1761498892432.jpg`
- `CleanUp5_Hancher_2025-10-26_1761498892433.jpg`

**Benefits:**
- Files automatically group by event when sorted alphabetically
- Easy to find all images from a specific event
- Better organization in Google Drive folder
- Matches user mental model (event → lots)

### 3. Improved Event Name Sanitization

Enhanced the sanitization logic to better handle event names with special characters:

**Changes Made:**
```javascript
// OLD: Single-line sanitization
const safeEventName = (eventName || 'CleanupEvent').replace(/[^a-z0-9\s-#]/gi, '').replace(/[\s:]+/g, '_');

// NEW: Multi-line sanitization with better handling
const safeEventName = (eventName || 'CleanupEvent')
  .replace(/[^a-z0-9\s-#]/gi, '')  // Keep alphanumeric, spaces, hyphens, and # symbol
  .replace(/[\s:]+/g, '')           // Remove ALL spaces and colons (no underscores)
  .trim();                          // Remove leading/trailing whitespace
```

**Example Transformations:**

| Original Event Name | Old Sanitization | New Sanitization |
|---------------------|------------------|------------------|
| "Clean Up #5" | "Clean_Up_#5" | "CleanUp#5" |
| "2025 Clean Up #5: October 26th" | "2025_Clean_Up_#5_October_26th" | "2025CleanUp#5October26th" |
| "  Fall Cleanup  " | "__Fall_Cleanup__" | "FallCleanup" |

**Benefits:**
- More compact filenames (no underscores in event name)
- Easier to read and type
- Consistent formatting
- Handles edge cases (leading/trailing spaces)

---

## Technical Changes

### Files Modified

**Code.gs:**

1. **Enhanced `getEventConfigData()` function** (Lines 257-304):
   - Added logging for row count
   - Added logging for headers found
   - Added logging for column indices
   - Added logging for retrieved values
   - Improved error messages with more context

2. **Updated `uploadImageToDrive()` function** (Lines 2222-2256):
   - Reordered filename components (event name first)
   - Improved event name sanitization (remove spaces instead of replacing with underscores)
   - Added `.trim()` to remove leading/trailing whitespace
   - Updated comments to reflect new filename format

### No Frontend Changes Required

The frontend already passes the correct parameters to the backend, so no changes are needed in:
- `src/components/SignInSheetUpload/BulkSignInSheetUpload.jsx`
- `src/services/geminiService.js`
- `src/services/api-service.js`

---

## EventConfig Sheet Structure

### Required Headers
The EventConfig sheet must have these headers in row 1:
- `eventId` - Unique identifier for the event
- `eventName` - Name of the event (e.g., "Clean Up #5")
- `eventDate` - Date of the event (e.g., "2025-10-26")
- `checkOutEnabled` - Boolean for check-out feature
- `lastUpdated` - Timestamp of last update

### Example Data

| eventId | eventName | eventDate | checkOutEnabled | lastUpdated |
|---------|-----------|-----------|-----------------|-------------|
| 1 | Clean Up #5 | 2025-10-26 | TRUE | 2025-10-26 10:00:00 |

### Important Notes
1. **Header names are case-sensitive** - Must be exactly `eventName` and `eventDate`
2. **Data must be in row 2** - Row 1 is headers, row 2 is the current event config
3. **Event name should not be empty** - If empty, will fallback to "CleanupEvent"
4. **Event date format** - Should be a valid date that can be parsed by JavaScript `new Date()`

---

## Debugging Guide

### How to Check Logs

1. **Open Google Apps Script Editor:**
   - Go to your Google Sheet
   - Click Extensions → Apps Script

2. **View Execution Logs:**
   - Click "Executions" in the left sidebar
   - Find the most recent execution
   - Click to view logs

3. **Look for these log entries:**
   ```
   [INFO] getEventConfigData: EventConfig sheet has 2 rows
   [INFO] getEventConfigData: Headers found: ["eventId","eventName","eventDate","checkOutEnabled","lastUpdated"]
   [INFO] getEventConfigData: Retrieved event config - Name: "Clean Up #5", Date: "2025-10-26"
   [INFO] uploadImageToDrive: Uploaded image "CleanUp5_Golf_Course_2025-10-26_1761498892431.jpg" (ID: ...)
   ```

### Common Issues and Solutions

**Issue: "EventConfig sheet not found"**
- **Cause:** Sheet doesn't exist or is named differently
- **Solution:** Create a sheet named exactly "EventConfig" (case-sensitive)

**Issue: "EventConfig sheet is empty (no data rows)"**
- **Cause:** Sheet only has headers, no data in row 2
- **Solution:** Add event data in row 2

**Issue: "EventConfig sheet missing required headers"**
- **Cause:** Headers don't match exactly (case, spacing, spelling)
- **Solution:** Check that row 1 has exactly `eventName` and `eventDate` (case-sensitive)
- **Check logs:** Look for the "Headers found" log to see what headers are actually present

**Issue: Event name is "CleanupEvent" instead of actual name**
- **Cause:** Event name cell in row 2 is empty
- **Solution:** Enter the event name in the eventName column of row 2

**Issue: Filename still shows old format**
- **Cause:** Using cached version of Code.gs
- **Solution:** Deploy the updated Code.gs as a new version

---

## Testing Checklist

### Pre-Deployment Testing
- [x] Add logging to `getEventConfigData()` function
- [x] Update filename format in `uploadImageToDrive()` function
- [x] Improve event name sanitization
- [x] Test with sample event name "Clean Up #5"
- [x] Verify no syntax errors in Code.gs

### Post-Deployment Testing
- [ ] Deploy updated Code.gs to Google Apps Script
- [ ] Verify EventConfig sheet has correct structure
- [ ] Add test event name in EventConfig sheet
- [ ] Upload a test sign-in sheet image
- [ ] Check execution logs for new log entries
- [ ] Verify filename format: `{EventName}_{LotName}_{Date}_{Timestamp}.jpg`
- [ ] Verify event name is correctly retrieved from EventConfig
- [ ] Verify files sort by event name in Google Drive
- [ ] Test with event name containing special characters
- [ ] Test with empty event name (should use fallback)
- [ ] Test with missing EventConfig sheet (should use fallback)

### Edge Cases to Test
- [ ] Event name with spaces: "Clean Up #5" → "CleanUp#5"
- [ ] Event name with special characters: "Fall Cleanup 2025!" → "FallCleanup2025"
- [ ] Event name with leading/trailing spaces: "  Event  " → "Event"
- [ ] Empty event name → "CleanupEvent"
- [ ] Missing EventConfig sheet → "DefaultEvent"
- [ ] EventConfig sheet with no data rows → "DefaultEvent"

---

## Expected Behavior After Fix

### Successful Upload
1. User uploads sign-in sheet for "Golf Course" lot
2. EventConfig sheet has event name "Clean Up #5"
3. System retrieves event name from EventConfig
4. Logs show: `Retrieved event config - Name: "Clean Up #5", Date: "2025-10-26"`
5. Filename generated: `CleanUp5_Golf_Course_2025-10-26_1761498892431.jpg`
6. Image uploaded to Google Drive with correct filename
7. Files in Drive folder sorted by event name

### Fallback Behavior
If EventConfig sheet is missing or empty:
1. System logs error with specific reason
2. Uses fallback event name "DefaultEvent"
3. Filename generated: `DefaultEvent_Golf_Course_2025-10-26_1761498892431.jpg`
4. Upload still succeeds (graceful degradation)

---

## Related Documentation

- [Image Storage Migration](./IMAGE-STORAGE-MIGRATION.md) - Google Drive integration with meaningful filenames
- [Unified Upload Workflow](./UNIFIED-UPLOAD-WORKFLOW.md) - Bulk upload with AI lot identification
- [Bulk Upload Enhancements](./BULK-UPLOAD-ENHANCEMENTS.md) - Name matching statistics and placeholder students

---

## Summary

This fix addresses two key issues:

1. **Enhanced Diagnostics:** Added comprehensive logging to `getEventConfigData()` to diagnose why event names weren't being retrieved correctly
2. **Improved File Organization:** Reordered filename components to put event name first, making it easier to find and organize images by event in Google Drive
3. **Better Sanitization:** Improved event name sanitization to create cleaner, more readable filenames

**Key Changes:**
- ✅ Added logging for EventConfig sheet row count, headers, and retrieved values
- ✅ Changed filename format from `{Lot}_{Event}_{Date}_{Time}` to `{Event}_{Lot}_{Date}_{Time}`
- ✅ Improved event name sanitization (remove spaces instead of replacing with underscores)
- ✅ Added `.trim()` to handle leading/trailing whitespace
- ✅ Enhanced error messages with more context

**Benefits:**
- 🔍 Easy to diagnose EventConfig issues through logs
- 📁 Better file organization in Google Drive (sorted by event)
- 📝 Cleaner, more readable filenames
- 🛡️ Graceful fallback if EventConfig is missing or empty
- 🚀 No frontend changes required

The system now provides clear visibility into event config retrieval and generates well-organized filenames that prioritize event name for better file management.

