# Sign-In Sheet Upload Validation System

## Overview

This document describes the validation system for sign-in sheet uploads, which handles two critical use cases:
1. **Re-upload Detection**: Warns users when uploading to a lot that already has a sign-in sheet
2. **Lot Mismatch Detection**: Alerts users when the uploaded sheet doesn't match the expected lot

---

## Architecture

### **Components**

1. **SignInSheetUploadModal.jsx** (Main Upload Component)
   - Orchestrates the upload flow
   - Triggers validation checks
   - Shows validation modals when needed

2. **ReuploadWarningModal.jsx** (Re-upload Warning)
   - Displays when user attempts to re-upload to a lot with existing data
   - Shows previous upload info (count, uploader, timestamp)
   - Allows user to continue or cancel

3. **LotMismatchModal.jsx** (Lot Mismatch Warning)
   - Displays when detected lot name doesn't match expected lot
   - Shows expected vs detected lot information
   - Suggests correct lot if found
   - Allows user to cancel, redirect, or override

4. **lotMatching.js** (Validation Utilities)
   - `compareLotNames()`: Compares expected vs detected lot names
   - `findMatchingLot()`: Finds best matching lot from available lots
   - `validateLotMatch()`: Main validation function
   - `hasExistingUpload()`: Checks if lot already has upload
   - `getUploadInfo()`: Retrieves upload history info

---

## Use Case 1: Re-upload Detection

### **When It Triggers**

When a user clicks "Analyze" on a lot that already has:
- `lot.aiStudentCount` set (from previous AI analysis), OR
- `lot.signInSheetImageUrl` set (previous image uploaded)

### **User Flow**

```
1. User selects image
2. User clicks "Analyze"
3. System checks: hasExistingUpload(lot)
4. If TRUE → Show ReuploadWarningModal
5. User chooses:
   a. "Continue with Re-upload" → Proceed with analysis
   b. "Cancel" → Close modal and upload dialog
```

### **Modal Content**

```
⚠️ Re-upload Sign-In Sheet?

This lot already has a sign-in sheet uploaded

Previous count: 13 students
Uploaded by: John Doe
Uploaded at: Sep 30, 2025 2:30 PM

Common reasons to re-upload:
• Correcting a bad scan or blurry image
• Updating count after more students signed in
• Reprocessing with improved AI
• Fixing an incorrect count

Note: The new count will replace the previous count across all displays.

[Cancel] [Continue with Re-upload]
```

### **Implementation Details**

**State Variables:**
```javascript
const [showReuploadWarning, setShowReuploadWarning] = useState(false);
const [bypassReuploadWarning, setBypassReuploadWarning] = useState(false);
```

**Check Logic:**
```javascript
// In handleAnalyze()
if (hasExisting && !bypassReuploadWarning) {
  setShowReuploadWarning(true);
  return; // Stop analysis
}
```

**Handler:**
```javascript
const handleReuploadContinue = () => {
  setShowReuploadWarning(false);
  setBypassReuploadWarning(true);
  handleAnalyze(); // Retry analysis with bypass flag
};
```

---

## Use Case 2: Lot Mismatch Detection

### **When It Triggers**

After AI analysis completes, if:
- `aiResult.lotIdentified` doesn't match `lot.name`, OR
- `aiResult.zoneIdentified` doesn't match `lot.zone`

### **User Flow**

```
1. User selects image
2. User clicks "Analyze"
3. AI extracts: studentCount, studentNames, lotIdentified, zoneIdentified
4. System validates: validateLotMatch(lot, aiResult, availableLots)
5. If MISMATCH → Show LotMismatchModal
6. User chooses:
   a. "Cancel Upload" → Close modal, clear AI result
   b. "Upload to [Suggested Lot] Instead" → Redirect to correct lot
   c. "Continue Anyway (Override)" → Proceed with upload
```

### **Modal Content**

```
🚨 Lot Mismatch Detected

The uploaded sign-in sheet appears to be for a different parking lot

Expected lot: Library Lot (Zone A)
Detected on sheet: Melrose Lot (Zone B)
Detection confidence: high

This usually happens when:
• You accidentally selected the wrong lot card to upload from
• You're uploading a photo of the wrong sign-in sheet
• The lot name on the sheet is different from the system name

Suggested correct lot:
📍 Melrose Lot (Zone B)

⚠️ Warning: Uploading to the wrong lot will cause incorrect student counts.

[Cancel Upload] [Upload to Melrose Lot Instead]

────────────────────────────────────────
[Continue Anyway (Override - Not Recommended)]
Only use this if you're certain the lot information is correct
```

### **Implementation Details**

**State Variables:**
```javascript
const [showLotMismatch, setShowLotMismatch] = useState(false);
const [lotValidation, setLotValidation] = useState(null);
const [bypassLotMismatch, setBypassLotMismatch] = useState(false);
```

**Validation Logic:**
```javascript
// In handleAnalyze(), after AI analysis
if (!bypassLotMismatch) {
  const validation = validateLotMatch(lot, result, availableLots);
  setLotValidation(validation);
  
  if (validation.shouldWarn) {
    setShowLotMismatch(true);
    return; // Don't show success toast yet
  }
}
```

**Validation Function:**
```javascript
export function validateLotMatch(expectedLot, aiAnalysis, availableLots = []) {
  const detectedLot = aiAnalysis?.lotIdentified || '';
  const detectedZone = aiAnalysis?.zoneIdentified || '';

  const comparison = compareLotNames(expectedLot, detectedLot, detectedZone);

  let suggestedLot = null;
  if (!comparison.matches && detectedLot) {
    suggestedLot = findMatchingLot(detectedLot, detectedZone, availableLots);
  }

  return {
    isValid: comparison.matches,
    confidence: comparison.confidence,
    reason: comparison.reason,
    expectedLot: expectedLot,
    detectedLot: detectedLot,
    detectedZone: detectedZone,
    suggestedLot: suggestedLot,
    shouldWarn: !comparison.matches && comparison.confidence === 'high'
  };
}
```

---

## Lot Name Matching Algorithm

### **Normalization**

```javascript
function normalizeLotName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/^(lot|parking lot|pl)\s*/i, '') // Remove "Lot" prefix
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}
```

### **Matching Levels**

1. **Exact Match (High Confidence)**
   - Normalized names are identical
   - Example: "Lot 48" === "Lot 48"

2. **Lot Number Match (High Confidence)**
   - Lot numbers extracted and compared
   - Example: "Lot 48" matches "48" or "Parking Lot 48"

3. **Zone Match (Medium Confidence)**
   - Zone identifiers match
   - Example: "Library Lot (Zone A)" matches any lot in "Zone A"

4. **Partial Match (Medium Confidence)**
   - One name contains the other
   - Example: "Library" matches "Library Lot"

5. **Fuzzy Match (Medium Confidence)**
   - Common variations checked
   - Example: "Melrose" matches "Melrose Ave"

6. **No Match (High Confidence Mismatch)**
   - None of the above match
   - Triggers warning modal

---

## Edge Cases

### **1. No Lot Name Detected**

```javascript
if (!detectedLot || detectedLot.trim() === '') {
  return {
    matches: false,
    confidence: 'low',
    reason: 'No lot name detected on sign-in sheet'
  };
}
```

**Behavior:** Don't show mismatch warning (low confidence)

### **2. Ambiguous Lot Names**

Example: "Lot 1" could match "Lot 10", "Lot 11", etc.

**Solution:** Use exact lot number matching with word boundaries:
```javascript
const match = name.match(/\b(\d+)\b/);
```

### **3. Multiple Matching Lots**

**Solution:** `findMatchingLot()` returns the **best** match based on confidence score:
- High confidence match = 3 points
- Medium confidence match = 2 points
- Low confidence match = 1 point

### **4. User Bypasses Warning**

**Behavior:** 
- Set `bypassLotMismatch = true`
- Allow upload to proceed
- Log warning in backend for audit trail

---

## Testing Scenarios

### **Re-upload Detection**

| Scenario | Expected Behavior |
|----------|-------------------|
| First upload to lot | No warning, proceed normally |
| Re-upload to same lot | Show ReuploadWarningModal |
| User clicks "Continue" | Proceed with analysis |
| User clicks "Cancel" | Close modal and upload dialog |

### **Lot Mismatch Detection**

| Scenario | Expected Behavior |
|----------|-------------------|
| Exact lot name match | No warning, proceed normally |
| Lot number match | No warning, proceed normally |
| Zone match | No warning (medium confidence) |
| Complete mismatch | Show LotMismatchModal |
| No lot name detected | No warning (low confidence) |
| User clicks "Cancel" | Close modal, clear AI result |
| User clicks "Redirect" | Close modal, open upload for suggested lot |
| User clicks "Override" | Proceed with upload |

---

## Future Enhancements

1. **Upload History Tracking**
   - Store all uploads in database with timestamps
   - Show upload history in lot details modal
   - Allow reverting to previous counts

2. **Audit Trail**
   - Log all overrides and bypasses
   - Track who uploaded what and when
   - Generate reports for directors

3. **Smart Redirection**
   - Automatically open upload modal for suggested lot
   - Pre-fill with the same image
   - Requires parent component callback

4. **Confidence Threshold Tuning**
   - Allow admins to adjust when warnings trigger
   - Configure matching algorithm sensitivity

5. **Machine Learning Improvements**
   - Train model on historical uploads
   - Improve lot name extraction accuracy
   - Learn common lot name variations

---

## Files Modified

1. `src/components/SignInSheetUpload/SignInSheetUploadModal.jsx`
2. `src/components/SignInSheetUpload/ReuploadWarningModal.jsx` (new)
3. `src/components/SignInSheetUpload/LotMismatchModal.jsx` (new)
4. `src/utils/lotMatching.js` (new)
5. `src/components/ParkingLotsScreen.jsx` (pass availableLots prop)

---

## API Changes

No backend API changes required. All validation happens client-side using data already returned by `analyzeSignInSheet()`:
- `aiResult.lotIdentified`
- `aiResult.zoneIdentified`
- `aiResult.studentCount`
- `aiResult.confidence`

