# Students Tab Column Setup Guide

## Overview
This guide explains how to add the required tracking columns to the **Students** tab in your Google Sheet to support placeholder student records and reconciliation workflows.

---

## Required Columns

The following columns must be added to the **Students** tab (if they don't already exist):

| Column Name | Data Type | Purpose | Example Value |
|------------|-----------|---------|---------------|
| `matchedByAI` | Boolean | Indicates if student was auto-matched by AI fuzzy matching | `TRUE` or `FALSE` |
| `manualCheckIn` | Boolean | Indicates if student was manually checked in by a Director | `TRUE` or `FALSE` |
| `isPlaceholder` | Boolean | Indicates if this is an unmatched placeholder record | `TRUE` or `FALSE` |
| `extractedNameText` | String | Original AI-extracted name from handwritten sign-in sheet | `"Illegible Name"` |
| `requiresReconciliation` | Boolean | Indicates if placeholder needs manual reconciliation | `TRUE` or `FALSE` |
| `signInSheetPhotoUrl` | String | Google Drive URL of the sign-in sheet image | `"https://drive.google.com/..."` |

---

## Setup Instructions

### Step 1: Open Your Google Sheet

1. Navigate to your TBTC Google Sheet
2. Click on the **Students** tab at the bottom

### Step 2: Identify Current Columns

Your Students tab should currently have these columns (A-O):

| Column | Name | Description |
|--------|------|-------------|
| A | `id` | Student ID |
| B | `name` | Student name |
| C | `instrument` | Instrument played |
| D | `section` | Band section |
| E | `year` | Grade/year |
| F | `checkedIn` | Check-in status (TRUE/FALSE) |
| G | `checkInTime` | Check-in timestamp |
| H | `assignedLot` | Assigned parking lot |
| I-O | `event1` - `event7` | Attendance for 7 events |

### Step 3: Add New Columns

Add the following 6 columns **after** column O (event7):

| Column | Name | Header Text |
|--------|------|-------------|
| P | `matchedByAI` | matchedByAI |
| Q | `manualCheckIn` | manualCheckIn |
| R | `isPlaceholder` | isPlaceholder |
| S | `extractedNameText` | extractedNameText |
| T | `requiresReconciliation` | requiresReconciliation |
| U | `signInSheetPhotoUrl` | signInSheetPhotoUrl |

**To add columns:**
1. Right-click on column P header
2. Select "Insert 6 columns right"
3. Type the header names exactly as shown above (case-sensitive)

### Step 4: Set Default Values (Optional)

For existing student records, you may want to set default values:

1. Select all cells in column P (matchedByAI) below the header
2. Type `FALSE` and press Ctrl+Enter (Windows) or Cmd+Enter (Mac)
3. Repeat for columns Q, R, and T (all should be `FALSE`)
4. Leave columns S and U empty for existing students

### Step 5: Verify Column Order

Your final column order should be:

```
A: id
B: name
C: instrument
D: section
E: year
F: checkedIn
G: checkInTime
H: assignedLot
I: event1
J: event2
K: event3
L: event4
M: event5
N: event6
O: event7
P: matchedByAI
Q: manualCheckIn
R: isPlaceholder
S: extractedNameText
T: requiresReconciliation
U: signInSheetPhotoUrl
```

---

## How These Columns Are Used

### During Bulk Upload

When a sign-in sheet is uploaded:

1. **AI extracts student names** from the handwritten sheet
2. **Fuzzy matching** attempts to match each name to ActualRoster (85% similarity threshold)
3. **For matched students:**
   - `matchedByAI` = `TRUE`
   - `manualCheckIn` = `FALSE`
   - `isPlaceholder` = `FALSE`
   - `requiresReconciliation` = `FALSE`
   - `extractedNameText` = Original extracted name (for audit trail)
   - `signInSheetPhotoUrl` = Empty (not needed for matched students)

4. **For unmatched students (placeholders):**
   - `id` = `placeholder-{lotId}-{index}` (e.g., "placeholder-55-1")
   - `name` = `{lotName} - Unidentified #{index}` (e.g., "Lot 55 - Hancher - Unidentified #1")
   - `matchedByAI` = `FALSE`
   - `manualCheckIn` = `FALSE`
   - `isPlaceholder` = `TRUE`
   - `extractedNameText` = Original AI-extracted name (e.g., "Illegible Name")
   - `requiresReconciliation` = `TRUE`
   - `signInSheetPhotoUrl` = Google Drive URL of sign-in sheet image

### During Manual Check-In

When a Director manually checks in a student:

- `manualCheckIn` = `TRUE`
- `matchedByAI` = `FALSE`
- `isPlaceholder` = `FALSE`
- `requiresReconciliation` = `FALSE`

### During Reconciliation (Future Feature)

When a Director reconciles a placeholder:

1. Director views the sign-in sheet image using `signInSheetPhotoUrl`
2. Director identifies the correct student from ActualRoster
3. System merges placeholder check-in data with actual student record
4. Placeholder record is deleted
5. Actual student record is updated with:
   - `checkedIn` = `TRUE`
   - `checkInTime` = Placeholder's check-in time
   - `assignedLot` = Placeholder's assigned lot
   - `requiresReconciliation` = `FALSE`

---

## Filtering Placeholder Students

To view only placeholder students that need reconciliation:

1. Click on the filter icon in the header row
2. Filter column R (`isPlaceholder`) to show only `TRUE`
3. Or filter column T (`requiresReconciliation`) to show only `TRUE`

This will show all unmatched students that need manual reconciliation.

---

## Example Placeholder Record

After bulk upload with 1 unmatched name:

| Column | Value |
|--------|-------|
| A (id) | `placeholder-55-1` |
| B (name) | `Lot 55 - Hancher - Unidentified #1` |
| C (instrument) | *(empty)* |
| D (section) | *(empty)* |
| E (year) | *(empty)* |
| F (checkedIn) | `TRUE` |
| G (checkInTime) | `2025-01-19T12:34:56.789Z` |
| H (assignedLot) | `55` |
| I-O (events) | *(empty)* |
| P (matchedByAI) | `FALSE` |
| Q (manualCheckIn) | `FALSE` |
| R (isPlaceholder) | `TRUE` |
| S (extractedNameText) | `Illegible Name` |
| T (requiresReconciliation) | `TRUE` |
| U (signInSheetPhotoUrl) | `https://drive.google.com/file/d/abc123/view` |

---

## Troubleshooting

### Error: "Cannot read property 'indexOf' of undefined"

**Cause:** Column headers are missing or misspelled

**Solution:**
1. Verify all column names are spelled exactly as shown (case-sensitive)
2. Ensure there are no extra spaces in column names
3. Refresh the Google Apps Script deployment

### Placeholder Records Not Created

**Cause:** Columns don't exist in the sheet

**Solution:**
1. Verify all 6 new columns exist in the Students tab
2. Check that column headers match exactly (case-sensitive)
3. Redeploy the Google Apps Script

### Photo URL Not Stored

**Cause:** `signInSheetPhotoUrl` column missing or misspelled

**Solution:**
1. Verify column U header is exactly `signInSheetPhotoUrl`
2. Check that the column exists in the sheet
3. Redeploy the Google Apps Script

---

## Next Steps

After adding these columns:

1. **Test with sample upload** - Upload a sign-in sheet with 1-2 illegible names
2. **Verify placeholder creation** - Check that placeholder records appear in Students tab
3. **Check photo URLs** - Verify Google Drive URLs are stored correctly
4. **Test filtering** - Filter by `requiresReconciliation = TRUE` to see placeholders
5. **Plan reconciliation workflow** - Decide how Directors will reconcile placeholders

---

## Related Documentation

- [Bulk Upload Enhancements](./BULK-UPLOAD-ENHANCEMENTS.md) - Full feature documentation
- [Hybrid Check-In System](./HYBRID-CHECKIN-SYSTEM.md) - AI-assisted check-in overview
- [Enhanced OCR Roster Matching](./ENHANCED-OCR-ROSTER-MATCHING.md) - Fuzzy matching details

