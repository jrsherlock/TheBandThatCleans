# Verify Google Sheets Columns

## 🎯 Purpose

This guide helps you verify that your Google Sheets "Lots" tab has the correct column headers for the AI-assisted check-ins feature.

---

## ✅ Required Columns

The "Lots" sheet must have these columns with **EXACT** header names (case-sensitive):

| Column Letter | Header Name | Data Type | Example Value |
|---------------|-------------|-----------|---------------|
| P | `aiStudentCount` | Number | 4 |
| Q | `aiConfidence` | Text | "high" |
| R | `aiAnalysisTimestamp` | Timestamp | "2024-10-12T15:30:00.000Z" |
| S | `countSource` | Text | "ai" or "manual" |
| T | `countEnteredBy` | Text | "John Doe" |
| U | `manualCountOverride` | Number | 5 |

**IMPORTANT:** 
- Header names are **case-sensitive**
- Must be in row 1
- No extra spaces before or after
- Exact spelling required

---

## 🔍 How to Verify

### Step 1: Open Your Google Sheet

1. Go to: https://docs.google.com/spreadsheets/d/1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys/edit
2. Click on the "Lots" tab at the bottom

### Step 2: Check Column Headers

1. Look at row 1 (the header row)
2. Scroll right to columns P, Q, R, S, T, U
3. Verify each header matches exactly:

**Column P:** Should say `aiStudentCount` (not `AIStudentCount` or `ai_student_count`)
**Column Q:** Should say `aiConfidence` (not `AIConfidence` or `ai_confidence`)
**Column R:** Should say `aiAnalysisTimestamp` (not `AIAnalysisTimestamp`)
**Column S:** Should say `countSource` (not `CountSource` or `count_source`)
**Column T:** Should say `countEnteredBy` (not `CountEnteredBy`)
**Column U:** Should say `manualCountOverride` (not `ManualCountOverride`)

### Step 3: Check for Extra Spaces

1. Click on cell P1
2. Look at the formula bar at the top
3. Make sure there are no spaces before or after the text
4. Repeat for Q1, R1, S1, T1, U1

---

## 🛠️ How to Add Missing Columns

If any columns are missing:

### Option 1: Add Manually

1. Click on the column letter where you want to insert (e.g., click "P")
2. Right-click → "Insert 1 column left" or "Insert 1 column right"
3. Type the header name in row 1
4. Make sure spelling and capitalization are exact

### Option 2: Copy from Template

If you want to add all 6 columns at once:

1. Click on column P header (the letter "P")
2. Hold Shift and click on column U header (selects P through U)
3. Right-click → "Insert 6 columns left" (if columns don't exist)
4. Type these headers in row 1:
   - P1: `aiStudentCount`
   - Q1: `aiConfidence`
   - R1: `aiAnalysisTimestamp`
   - S1: `countSource`
   - T1: `countEnteredBy`
   - U1: `manualCountOverride`

---

## 🧪 Test Column Headers

After adding/verifying columns, test if the backend can find them:

### Test Script

1. Open Google Apps Script editor (Extensions → Apps Script)
2. Create a new function:

```javascript
function testColumnHeaders() {
  const ss = SpreadsheetApp.openById('1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys');
  const sheet = ss.getSheetByName('Lots');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const requiredColumns = [
    'aiStudentCount',
    'aiConfidence',
    'aiAnalysisTimestamp',
    'countSource',
    'countEnteredBy',
    'manualCountOverride'
  ];
  
  Logger.log('=== Column Header Verification ===');
  
  requiredColumns.forEach(colName => {
    const index = headers.indexOf(colName);
    if (index === -1) {
      Logger.log(`❌ MISSING: ${colName}`);
    } else {
      const columnLetter = String.fromCharCode(65 + index);
      Logger.log(`✅ FOUND: ${colName} in column ${columnLetter}`);
    }
  });
  
  Logger.log('\n=== All Headers ===');
  headers.forEach((header, index) => {
    const columnLetter = String.fromCharCode(65 + index);
    Logger.log(`${columnLetter}: "${header}"`);
  });
}
```

3. Click "Run" → Select `testColumnHeaders`
4. Check the "Execution log" at the bottom
5. Should show ✅ for all required columns

---

## 📋 Common Issues

### Issue 1: Column header has wrong capitalization

**Example:** `AIStudentCount` instead of `aiStudentCount`

**Fix:**
1. Click on the cell with wrong header
2. Delete the text
3. Type the correct header exactly: `aiStudentCount`

### Issue 2: Column header has extra spaces

**Example:** ` aiStudentCount ` (spaces before/after)

**Fix:**
1. Click on the cell
2. Look at formula bar
3. Remove any spaces before or after the text

### Issue 3: Column header has underscores

**Example:** `ai_student_count` instead of `aiStudentCount`

**Fix:**
1. Use camelCase (first word lowercase, subsequent words capitalized)
2. No underscores or hyphens

### Issue 4: Column is in wrong position

**Example:** `aiStudentCount` is in column O instead of P

**Fix:**
- The column letter doesn't matter, only the header name
- The backend searches for the header by name, not position
- As long as the header exists somewhere in row 1, it will work

---

## ✅ Verification Checklist

Before testing uploads, verify:

- [ ] Opened Google Sheets "Lots" tab
- [ ] Row 1 contains headers
- [ ] Column with header `aiStudentCount` exists
- [ ] Column with header `aiConfidence` exists
- [ ] Column with header `aiAnalysisTimestamp` exists
- [ ] Column with header `countSource` exists
- [ ] Column with header `countEnteredBy` exists
- [ ] Column with header `manualCountOverride` exists
- [ ] All headers are spelled exactly as shown (case-sensitive)
- [ ] No extra spaces in header cells
- [ ] Ran test script (optional) and all columns found

---

## 🎯 Quick Reference

Copy and paste these exact header names:

```
aiStudentCount
aiConfidence
aiAnalysisTimestamp
countSource
countEnteredBy
manualCountOverride
```

---

## 📸 Visual Guide

From your screenshot, I can see:

- ✅ Column P header exists
- ✅ Column Q header exists
- ✅ Column R header exists
- ✅ Column S header exists
- ✅ Column T header exists
- ✅ Column U header exists

**BUT** I need to verify the exact text in each header cell. The screenshot shows the columns exist, but I can't read the exact header names.

**To verify:**
1. Click on cell P1
2. Look at the formula bar at the top
3. It should show exactly: `aiStudentCount`
4. Repeat for Q1, R1, S1, T1, U1

---

## 🚀 After Verification

Once you've verified all columns exist with correct headers:

1. ✅ Columns are ready
2. ✅ Deploy the backend (see BACKEND-DEPLOYMENT-CHECKLIST.md)
3. ✅ Test the upload feature
4. ✅ Verify data appears in Google Sheets

---

**The columns appear to exist in your screenshot, but please verify the exact header names match the required format!**

