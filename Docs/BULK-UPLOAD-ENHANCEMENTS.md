# Bulk Sign-In Sheet Upload Enhancements

## Overview
This document describes two major enhancements to the bulk sign-in sheet upload feature that improve data tracking, user feedback, and reconciliation workflows.

---

## Enhancement 1: Display Name-Matching Statistics in Success Modal

### Problem
After bulk uploading sign-in sheet images, users only saw basic confirmation (lot name and total student count) without visibility into how many names were successfully matched to the roster vs. requiring manual reconciliation.

### Solution
Enhanced the bulk upload success modal to display detailed matching statistics for each lot.

### Implementation

#### Backend Changes (Code.gs)

**Modified `processStudentNames()` function:**
- Added `signInSheetPhotoUrl` parameter to store photo URL in placeholder records
- Enhanced return object to include:
  - `matchedCount` - Number of names successfully matched to roster
  - `unmatchedCount` - Number of names that failed to match
  - `unmatchedNames` - Array of original extracted names that failed to match

**Modified `handleBulkSignInSheetUpload()` function:**
- Passes Google Drive photo URL to `processStudentNames()`
- Returns detailed statistics in response:
  ```javascript
  {
    lotId: "55",
    lotName: "Lot 55 - Hancher",
    totalStudentsFound: 11,
    matchedCount: 8,
    unmatchedCount: 3,
    unmatchedNames: ["Illegible Name 1", "Illegible Name 2", "Illegible Name 3"],
    confidence: "high",
    imageUploaded: true
  }
  ```

#### Frontend Changes (BulkSignInSheetUpload.jsx)

**Enhanced success results display:**
- Shows total students found from AI analysis
- Displays matched vs. unmatched counts
- Different messaging for 100% match vs. partial match:

**Example - All Matched:**
```
✓ Lot 55 - Hancher: 11 students found
  • All 11 names matched to roster
```

**Example - Partial Match:**
```
✓ Lot 53 - Melrose Court: 13 students found
  • 10 names matched to roster
  • 3 students require manual reconciliation
```

### Benefits
- **Transparency**: Users immediately see matching success rate
- **Actionable**: Users know which lots need reconciliation
- **Confidence**: 100% match rate provides confidence in data accuracy

---

## Enhancement 2: Placeholder Student Records for Unmatched Sign-Ins

### Problem
When AI extracts a student name from a sign-in sheet but fuzzy matching cannot find a match in ActualRoster (similarity score < 85%), that student's attendance was not tracked, resulting in data loss.

### Solution
Automatically create placeholder student records for unmatched names, allowing Directors to reconcile them later while ensuring zero data loss.

### Implementation

#### Backend Changes (Code.gs)

**Modified `processStudentNames()` function:**

1. **Added `signInSheetPhotoUrl` parameter** - Stores Google Drive URL of sign-in sheet image in placeholder records

2. **Enhanced placeholder creation** - For each unmatched name, creates a record with:
   - `id`: `placeholder-{lotId}-{index}` (e.g., "placeholder-55-1")
   - `name`: `{lotName} - Unidentified #{index}` (e.g., "Lot 55 - Hancher - Unidentified #1")
   - `instrument`: "" (empty)
   - `section`: "" (empty)
   - `year`: "" (empty)
   - `checkedIn`: `true`
   - `checkInTime`: Current timestamp
   - `assignedLot`: Lot ID where they signed in
   - `matchedByAI`: `false`
   - `manualCheckIn`: `false`
   - `isPlaceholder`: `true`
   - `extractedNameText`: Original AI-extracted name (e.g., "Illegible Name")
   - `requiresReconciliation`: `true`
   - `signInSheetPhotoUrl`: Google Drive URL of sign-in sheet image

3. **Returns detailed statistics** including placeholder count and unmatched names array

**Modified `handleBulkSignInSheetUpload()` function:**
- Passes Google Drive photo URL to `processStudentNames()`
- Returns placeholder creation statistics in response

**Modified `handleSignInSheetUpload()` function:**
- Also updated to pass photo URL for single uploads

#### AI Prompt Enhancement (geminiService.js)

**Modified `analyzeSignInSheetWithLotIdentification()` prompt:**

Added critical instructions to ignore crossed-out names:
```
**CRITICAL: Do NOT extract any names that have been crossed out, scribbled over, 
or otherwise marked up to indicate deletion or invalidation**

**CRITICAL: Only extract clean, unmarked names that the person clearly intended 
to be counted**

Students sometimes sign into one lot, change their mind, cross out their name, 
and sign into a different lot - only count them at their intended final lot
```

### Required Google Sheet Columns

The following columns must exist in the **Students** tab for placeholder tracking:

| Column Name | Type | Purpose |
|------------|------|---------|
| `matchedByAI` | Boolean | True if student was auto-matched by AI |
| `manualCheckIn` | Boolean | True if manually checked in by Director |
| `isPlaceholder` | Boolean | True if this is an unmatched placeholder record |
| `extractedNameText` | String | Original AI-extracted name from sign-in sheet |
| `requiresReconciliation` | Boolean | True if placeholder needs manual reconciliation |
| `signInSheetPhotoUrl` | String | Google Drive URL of sign-in sheet image |

### Reconciliation Workflow (Future Enhancement)

**Planned Features:**
1. **Filter/Sort** - Show only unmatched students (`requiresReconciliation: true`)
2. **View Original** - Click link to view sign-in sheet image in Google Drive
3. **Manual Match** - Select correct student from ActualRoster
4. **Update Record** - Replace placeholder data with actual student info
5. **Mark Reconciled** - Set `requiresReconciliation: false`

**Existing Backend Support:**
- `handleReconcilePlaceholder()` endpoint already exists in Code.gs
- Merges placeholder check-in data with real student record
- Removes placeholder and updates actual student

### Benefits

1. **Zero Data Loss** - Every student who signs in is tracked, even if name is illegible
2. **Audit Trail** - Original extracted name and photo URL preserved for review
3. **Flexible Reconciliation** - Directors can reconcile at their convenience
4. **Data Integrity** - Placeholder records clearly marked and separated from verified students
5. **Improved Accuracy** - Crossed-out names are ignored, preventing double-counting

---

## Testing Checklist

### Enhancement 1: Matching Statistics Display

- [ ] Upload 3 sign-in sheets with varying match rates
- [ ] Verify success modal shows correct total students found
- [ ] Verify matched count is accurate
- [ ] Verify unmatched count is accurate
- [ ] Verify "All X names matched" message for 100% match
- [ ] Verify "X students require manual reconciliation" for partial match
- [ ] Check console logs for detailed matching statistics

### Enhancement 2: Placeholder Records

- [ ] Upload sign-in sheet with illegible/unmatched names
- [ ] Verify placeholder records created in Students tab
- [ ] Verify placeholder has correct fields:
  - [ ] `isPlaceholder: true`
  - [ ] `requiresReconciliation: true`
  - [ ] `extractedNameText` contains original AI-extracted name
  - [ ] `signInSheetPhotoUrl` contains Google Drive URL
  - [ ] `checkedIn: true`
  - [ ] `assignedLot` matches correct lot
- [ ] Verify crossed-out names are NOT extracted by AI
- [ ] Test with sign-in sheet containing crossed-out names
- [ ] Verify only clean, unmarked names are counted

---

## Files Modified

### Backend
- **Code.gs**
  - `processStudentNames()` - Added photo URL parameter, enhanced return statistics
  - `handleBulkSignInSheetUpload()` - Passes photo URL, returns detailed statistics
  - `handleSignInSheetUpload()` - Passes photo URL to processStudentNames

### Frontend
- **src/services/geminiService.js**
  - `analyzeSignInSheetWithLotIdentification()` - Enhanced prompt to ignore crossed-out names

- **src/components/SignInSheetUpload/BulkSignInSheetUpload.jsx**
  - Enhanced success results display with matching statistics
  - Shows matched/unmatched counts
  - Different messaging for 100% vs. partial match

---

## API Response Format

### Bulk Upload Success Response

```javascript
{
  success: true,
  message: "Processed 3 sign-in sheets: 3 successful, 0 failed",
  successful: [
    {
      lotId: "55",
      lotName: "Lot 55 - Hancher",
      totalStudentsFound: 11,
      matchedCount: 8,
      unmatchedCount: 3,
      unmatchedNames: ["Illegible Name 1", "Illegible Name 2", "Illegible Name 3"],
      confidence: "high",
      imageUploaded: true,
      // Legacy fields for backward compatibility
      studentCount: 11,
      studentsMatched: 8,
      studentsUnmatched: 3
    },
    // ... more lots
  ],
  failed: [],
  timestamp: "2025-01-19T12:34:56.789Z"
}
```

---

## Future Enhancements

1. **Reconciliation UI** - Build frontend interface for reconciling placeholder students
2. **Bulk Reconciliation** - Allow reconciling multiple placeholders at once
3. **Smart Suggestions** - AI-powered suggestions for matching placeholders to roster
4. **Reconciliation Reports** - Track reconciliation completion rate
5. **Photo Viewer** - Inline image viewer for sign-in sheets in reconciliation UI

