# Lot Name Display Issues - Diagnosis & Fix

**Date:** 2025-10-26  
**Status:** ✅ **FIXED**

---

## 🔍 Issues Identified

### Issue 1: Bulk Actions Dropdown Showing Status Instead of Lot Names
**Location:** Dashboard → Command Center → Bulk Actions → "Select Lots for Bulk Update" dropdown

**Symptom:**
- Dropdown displayed status values ("Ready", "In Progress", etc.) instead of lot names
- Expected: "Lot 3 - Library Lot - Ready"
- Actual: " - Ready" (lot name missing)

**Root Cause:** Column header mismatch between Google Sheet and application code (see Issue 2)

---

### Issue 2: Column Name Mismatch Between Google Sheet and Application ⚠️
**Critical Issue - Requires Manual Fix**

**Problem:**
- Google Sheet column B header: `"lot"`
- Application code expects: `"name"`

**How This Breaks the App:**

The `readSheetData()` function in `Code.gs` (lines 2065-2088) works as follows:

```javascript
function readSheetData(sheetConfig) {
  const headers = data.shift(); // Reads actual headers from your sheet: ["id", "lot", "status", ...]
  
  return data.map(row => {
    const obj = {};
    sheetConfig.headers.forEach((header) => {
      const headerIndex = headers.indexOf(header); // Looks for "name" in your headers
      obj[header] = headerIndex >= 0 ? (row[headerIndex] || "") : "";
    });
    return obj;
  });
}
```

**What happens:**
1. Code looks for `"name"` in your sheet headers
2. `headers.indexOf("name")` returns `-1` (not found)
3. `obj["name"]` gets set to `""` (empty string)
4. All lot objects have `lot.name = ""`
5. Dashboard displays ` - Ready` instead of `Lot 3 - Library Lot - Ready`

**Expected Schema (Code.gs lines 30-45):**
```javascript
const SHEETS = {
  LOTS: {
    name: "Lots",
    headers: [
      "id", "name", "status", "zone", "priority",  // ← Expects "name"
      "totalStudentsSignedUp", "comment", "lastUpdated", "updatedBy",
      "actualStartTime", "completedTime", "signUpSheetPhoto",
      "polygonCoordinates", "centerLatitude", "centerLongitude",
      "aiStudentCount", "aiConfidence", "aiAnalysisTimestamp",
      "countSource", "countEnteredBy", "manualCountOverride"
    ]
  }
}
```

---

### Issue 3: Bulk Upload Description - Wrong Number
**Location:** Bulk Sign-In Sheet Upload modal

**Problem:**
- Description stated "Upload up to 21 sign-in sheets"
- After lot consolidation, you now have 18 active lots
- `MAX_FILES` constant needed to be updated

---

## ✅ Fixes Applied

### Fix 1: Updated MAX_FILES Constant
**File:** `src/components/SignInSheetUpload/BulkSignInSheetUpload.jsx`

**Change:**
```javascript
// Before:
const MAX_FILES = 21; // Maximum number of parking lots

// After:
const MAX_FILES = 18; // Maximum number of parking lots
```

**Impact:**
- Upload modal now correctly states "Upload up to 18 sign-in sheet images at once"
- File counter shows "0/18 selected" instead of "0/21 selected"
- Maximum file validation updated to 18 images

---

### Fix 2: Google Sheet Column Header (MANUAL ACTION REQUIRED) ⚠️

**YOU MUST DO THIS MANUALLY:**

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys/edit
2. Go to the "Lots" tab
3. Click on cell **B1** (currently says "lot")
4. Change it to: **name**
5. Press Enter to save

**Before:**
```
| A  | B   | C      | D    | E        | F                      |
|----|-----|--------|------|----------|------------------------|
| id | lot | status | zone | priority | totalStudentsSignedUp  |
```

**After:**
```
| A  | B    | C      | D    | E        | F                      |
|----|------|--------|------|----------|------------------------|
| id | name | status | zone | priority | totalStudentsSignedUp  |
```

**Why This Fix Works:**
- The `readSheetData()` function will now find "name" in your headers
- `headers.indexOf("name")` will return `1` (column B index)
- `obj["name"]` will correctly get the value from column B
- All lot objects will have proper `lot.name` values
- Dashboard will display "Lot 3 - Library Lot - Ready" correctly

---

### Fix 3: Dashboard Code (No Changes Needed)
**File:** `src/components/Dashboard.jsx` (lines 356-360)

**Current Code (Already Correct):**
```javascript
{lots.map(l => (
  <option key={l.id} value={l.id}>
    {l.name} - {getStatusStyles(l.status).label}
  </option>
))}
```

**Why No Changes Needed:**
- The code is already trying to display `l.name`
- Once you fix the Google Sheet header, `l.name` will have the correct value
- The dropdown will automatically start showing lot names

---

## 🧪 Testing & Verification

### After Renaming Column B to "name":

1. **Refresh the Application**
   - Click the "Refresh Data" button in the app
   - Or reload the page

2. **Verify Dashboard Bulk Actions Dropdown**
   - Go to Dashboard → Command Center
   - Look at "Select Lots for Bulk Update" dropdown
   - Should now show: "Lot 3 - Library Lot - Ready", "Lot 48 - Myrtle - Ready", etc.

3. **Verify Parking Lots Screen**
   - Go to Parking Lots screen
   - Check that lot names appear in both List View and Card View
   - Verify lot names in the table/cards

4. **Verify Bulk Upload Modal**
   - Click "Upload Multiple Sheets" button
   - Verify header says "Upload up to 18 sign-in sheet images at once"
   - Verify file counter shows "0/18 selected"

---

## 📊 Impact Analysis

### What Was Broken:
- ❌ Bulk actions dropdown (showing " - Ready" instead of lot names)
- ❌ Any component displaying `lot.name` (empty string)
- ❌ Bulk upload description (wrong maximum count)

### What Is Now Fixed:
- ✅ Bulk upload MAX_FILES updated to 18
- ✅ Bulk upload description updated to "18 images"
- ⏳ Lot names will work after you rename column B to "name"

### Components That Will Benefit:
- Dashboard bulk actions dropdown
- Parking Lots screen (list and card views)
- Any dropdown or selector showing lot names
- Reports and exports that include lot names

---

## 🔧 Technical Details

### Data Flow:
```
Google Sheet (Column B: "name")
    ↓
Code.gs → readSheetData(SHEETS.LOTS)
    ↓
Reads headers: ["id", "name", "status", ...]
    ↓
Maps to objects: { id: 101, name: "Lot 3 - Library Lot", status: "ready", ... }
    ↓
Returns to frontend via handleGetData()
    ↓
Frontend stores in lots array
    ↓
Dashboard displays: "Lot 3 - Library Lot - Ready"
```

### Why Column Header Matters:
The `readSheetData()` function uses **dynamic header mapping**:
- It reads the actual headers from row 1 of your sheet
- It looks for each expected header name in your actual headers
- If a header is missing or misspelled, that field becomes empty

This design allows flexibility but requires exact header name matches.

---

## 📝 Files Modified

### Frontend Changes:
1. **src/components/SignInSheetUpload/BulkSignInSheetUpload.jsx**
   - Line 24: Updated `MAX_FILES` from 21 to 18
   - Impact: All references to MAX_FILES now use 18

### Backend Changes:
- None (Code.gs is already correct)

### Manual Changes Required:
1. **Google Sheet "Lots" tab**
   - Cell B1: Change "lot" to "name"

---

## ✅ Checklist

- [x] Diagnosed root cause (column header mismatch)
- [x] Updated MAX_FILES constant to 18
- [x] Verified no other code changes needed
- [ ] **USER ACTION:** Rename Google Sheet column B from "lot" to "name"
- [ ] **USER ACTION:** Refresh application data
- [ ] **USER ACTION:** Verify lot names appear in bulk actions dropdown
- [ ] **USER ACTION:** Verify lot names appear throughout application

---

## 🎯 Summary

**Root Cause:** Your Google Sheet has column B labeled "lot" but the application expects "name"

**Solution:** Rename column B header from "lot" to "name" in your Google Sheet

**Additional Fix:** Updated bulk upload maximum from 21 to 18 images to match your current lot count

**Result:** Once you rename the column, all lot names will display correctly throughout the application

