# Dashboard Visualization Fix - Deployment Guide

## Problem Summary
The matched/unmatched student counts are showing as 0 in the Dashboard because:
1. The new columns (`aiMatchedCount` and `aiUnmatchedCount`) may not exist in the Google Sheet yet
2. Even if they exist, existing lot records don't have values in these columns (they were uploaded before this feature was added)

## Solution Steps

### Step 1: Run Diagnostic Check
1. Open your Google Apps Script project
2. Copy the contents of `diagnostic-check-columns.gs` into a new file in your Apps Script project
3. Run the `diagnosticCheckColumns()` function
4. Check the Execution Log (View → Logs) to see the diagnostic report

The diagnostic will tell you:
- ✅ Whether the columns exist
- 📊 How many lots have AI data
- 🔢 How many lots need backfilling

### Step 2: Add Missing Columns (if needed)
If the diagnostic shows that columns are missing:

1. In the same script file, run the `addMissingColumns()` function
2. This will add `aiMatchedCount` and `aiUnmatchedCount` columns to your Lots sheet
3. Re-run the diagnostic to confirm columns were added

### Step 3: Backfill Existing Data (Choose One Option)

#### Option A: Accurate Backfill (Recommended if you have student data)
This option counts actual matched vs unmatched students from the Students sheet:

1. Copy the contents of `backfill-matched-unmatched-counts.gs` into your Apps Script project
2. Run the `backfillMatchedUnmatchedCounts()` function
3. Check the Execution Log to see which lots were updated

**How it works:**
- Looks at the Students sheet for each lot
- Counts students with placeholder IDs (unmatched) vs real IDs (matched)
- Updates the counts in the Lots sheet

**Pros:** Most accurate representation of actual match results
**Cons:** Only works if you still have the student check-in data

#### Option B: Simple Backfill (If student data is unavailable)
This option assumes all students were matched:

1. In the same backfill script, run the `backfillWithAICountOnly()` function
2. This sets `matched = aiStudentCount` and `unmatched = 0` for all lots

**Pros:** Quick and simple
**Cons:** Not accurate - shows all students as matched even if some weren't

#### Option C: No Backfill (Only new uploads)
If you prefer, you can skip backfilling entirely:
- Existing lots will show 0/0 for matched/unmatched
- Only new sign-in sheet uploads will populate these fields
- The total count (aiStudentCount) will still be correct

### Step 4: Verify the Fix

1. After running the backfill (or adding columns), refresh your application
2. Check the Dashboard KPI cards:
   - "Students Signed In - Matched" should show a number > 0
   - "Students Signed In - Unmatched" should show a number (could be 0 if all matched)
3. Check the "Student Check-Ins by Lot" visualization:
   - Bars should show purple (matched) and yellow (unmatched) segments
   - Hover over bars to see the breakdown

### Step 5: Test with New Upload

1. Upload a new sign-in sheet using the bulk upload feature
2. Verify that the new lot automatically gets matched/unmatched counts
3. Check that the Dashboard updates correctly

## Expected Results

### Before Fix:
```
📊 AI-SCANNED LOT COUNT SYSTEM:
  ✅ Total Students Present: 95
  ✅ Matched Students: 0
  ⚠️  Unmatched Students: 0
```

### After Fix (Example):
```
📊 AI-SCANNED LOT COUNT SYSTEM:
  ✅ Total Students Present: 95
  ✅ Matched Students: 87
  ⚠️  Unmatched Students: 8
```

### Dashboard KPI Cards:
- **Card 1:** "0/18 Lots Complete" (unchanged)
- **Card 2:** "87 Students Signed In - Matched" (NEW - was "Students Checked In Today")
- **Card 3:** "8 Students Signed In - Unmatched" (NEW - was "Students Signed Out Today")
- **Card 4:** "95 / 246 Participation (39%)" (updated calculation)

### Visualization:
Each lot bar will show:
- Purple segment for matched students
- Yellow segment for unmatched students
- Total count label on the right
- Legend below showing "X matched" and "X unmatched"

## Troubleshooting

### Issue: Columns still not showing in API response
**Solution:** Make sure you deployed the updated Code.gs and copied the new API URL to your `api-service.js`

### Issue: Counts don't add up (matched + unmatched ≠ aiStudentCount)
**Possible causes:**
- Students were manually edited after AI processing
- Students were deleted from the Students sheet
- The backfill script couldn't find all students

**Solution:** Re-upload the sign-in sheet for that lot to get accurate counts

### Issue: All counts show as 0 even after backfill
**Possible causes:**
- The Students sheet doesn't have data for those lots
- The lot IDs don't match between Lots and Students sheets

**Solution:** Use Option B (Simple Backfill) or re-upload sign-in sheets

### Issue: Visualization still shows single-color bars
**Possible causes:**
- Browser cache is showing old version
- React component didn't re-render

**Solution:**
1. Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Clear browser cache
3. Check browser console for errors

## Files Created

1. **diagnostic-check-columns.gs** - Diagnostic script to check column setup
2. **backfill-matched-unmatched-counts.gs** - Backfill scripts for existing data
3. **DEPLOYMENT-GUIDE.md** - This guide

## Next Steps After Deployment

1. Monitor the Dashboard to ensure counts are accurate
2. Test uploading new sign-in sheets to verify automatic population
3. Consider adding a "Re-process" button in the UI to re-run AI matching for specific lots
4. Document the new KPI cards in your user guide

## Questions?

If you encounter issues not covered in this guide:
1. Check the Google Apps Script Execution Log for errors
2. Check the browser console for frontend errors
3. Verify the API URL in `api-service.js` matches your deployed Apps Script URL
4. Ensure the Code.gs file has the latest changes (aiMatchedCount and aiUnmatchedCount in schema)

