# Quick Fix - 3 Steps to Get Matched/Unmatched Counts Working

## TL;DR
Your matched/unmatched counts are showing 0 because the new columns don't have data yet. Follow these 3 steps:

## Step 1: Check if Columns Exist (2 minutes)

1. Open Google Apps Script: https://script.google.com
2. Open your TBTC project
3. Create a new file, paste this code:

```javascript
function checkColumns() {
  const ss = SpreadsheetApp.openById("1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys");
  const sheet = ss.getSheetByName("Lots");
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  Logger.log("Checking for columns...");
  Logger.log("aiMatchedCount: " + (headers.indexOf("aiMatchedCount") !== -1 ? "✅ EXISTS" : "❌ MISSING"));
  Logger.log("aiUnmatchedCount: " + (headers.indexOf("aiUnmatchedCount") !== -1 ? "✅ EXISTS" : "❌ MISSING"));
}
```

4. Run `checkColumns()`
5. Check View → Logs

**If columns are MISSING:** Run this to add them:

```javascript
function addColumns() {
  const ss = SpreadsheetApp.openById("1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys");
  const sheet = ss.getSheetByName("Lots");
  const lastCol = sheet.getLastColumn();
  
  sheet.getRange(1, lastCol + 1).setValue("aiMatchedCount");
  sheet.getRange(1, lastCol + 2).setValue("aiUnmatchedCount");
  
  Logger.log("✅ Columns added!");
}
```

## Step 2: Backfill Data (5 minutes)

Choose ONE option:

### Option A: Accurate Backfill (if you have student data)
Use the full script in `backfill-matched-unmatched-counts.gs`

### Option B: Quick Backfill (assume all matched)
Paste and run this:

```javascript
function quickBackfill() {
  const ss = SpreadsheetApp.openById("1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys");
  const sheet = ss.getSheetByName("Lots");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const aiCountIdx = headers.indexOf("aiStudentCount");
  const matchedIdx = headers.indexOf("aiMatchedCount");
  const unmatchedIdx = headers.indexOf("aiUnmatchedCount");
  
  let updated = 0;
  
  for (let i = 1; i < data.length; i++) {
    const aiCount = data[i][aiCountIdx];
    if (aiCount && aiCount !== '' && aiCount > 0) {
      data[i][matchedIdx] = parseInt(aiCount);
      data[i][unmatchedIdx] = 0;
      updated++;
    }
  }
  
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  Logger.log(`✅ Updated ${updated} lots`);
}
```

## Step 3: Verify (1 minute)

1. Refresh your TBTC application
2. Go to Dashboard
3. Check the KPI cards - you should see numbers instead of 0
4. Check the bar chart - you should see purple/yellow segments

## Still Not Working?

### Check 1: API URL
Make sure `src/services/api-service.js` has your latest deployed Apps Script URL

### Check 2: Hard Refresh
Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows) to clear cache

### Check 3: Console Logs
Open browser console (F12) and look for this:
```
📊 AI-SCANNED LOT COUNT SYSTEM:
  ✅ Matched Students: [should be > 0]
  ⚠️  Unmatched Students: [should be >= 0]
```

If still showing 0, the API isn't returning the data. Check that:
- You deployed the updated Code.gs
- The new API URL is in api-service.js
- The columns exist in the Google Sheet

## What Changed?

### Before:
- KPI Card 2: "Students Checked In Today" (total count)
- KPI Card 3: "Students Signed Out Today" (always 0)
- Bar chart: Single purple bar per lot

### After:
- KPI Card 2: "Students Signed In - Matched" (successfully matched students)
- KPI Card 3: "Students Signed In - Unmatched" (needs manual review)
- Bar chart: Stacked purple (matched) + yellow (unmatched) bars

## Future Uploads

Once this is set up, all NEW sign-in sheet uploads will automatically populate matched/unmatched counts. No manual intervention needed!

