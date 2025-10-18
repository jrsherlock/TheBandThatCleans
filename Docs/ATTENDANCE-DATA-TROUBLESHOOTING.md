# Attendance Data Troubleshooting Guide

## Problem: Students show "0/7" Events Attended and Analytics crashes

### Root Cause
The Google Apps Script backend has not been updated with the new code that reads attendance data from the ActualRoster tab.

### Symptoms
1. ✗ All students show "0/7" in the Events Attended column
2. ✗ All students show "0/7" in the Excused column  
3. ✗ Clicking "Show Attendance Analytics" shows a warning message or crashes
4. ✗ Browser console shows: "Attendance data (event1-event7 fields) is not present"

### How to Verify the Issue

#### Option 1: Use the API Test Page
1. Open `test-api.html` in your browser (located in the project root)
2. The page will automatically fetch data from the API
3. Look for the "Attendance Fields Check" section:
   - ✓ **If event1-event7 show "✓ Present"**: Data is working correctly
   - ✗ **If event1-event7 show "✗ Missing"**: Backend needs to be updated

#### Option 2: Check Browser Console
1. Open the TBTC app in your browser
2. Open Developer Tools (F12 or Cmd+Option+I on Mac)
3. Go to the Console tab
4. Look for debug messages:
   ```
   === STUDENTS DATA DEBUG ===
   First student has event1? false  ← This means backend not updated
   ```

### Solution: Deploy Updated Google Apps Script

#### Step 1: Open Google Apps Script Editor
1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys
2. Click **Extensions** → **Apps Script**
3. You should see the Code.gs file

#### Step 2: Replace Code.gs Content
1. In the Apps Script editor, select all content in Code.gs (Cmd+A or Ctrl+A)
2. Delete the old code
3. Open the `Code.gs` file from your local repository
4. Copy all the content
5. Paste it into the Apps Script editor

#### Step 3: Verify the Changes
Look for these key sections in the new code:

**1. ACTUAL_ROSTER Configuration (around line 56):**
```javascript
ACTUAL_ROSTER: {
  name: "ActualRoster",
  headers: [
    "name", "instrument", "grade", "section", 
    "event1", "event2", "event3", "event4", "event5", "event6", "event7"
  ]
},
```

**2. handleGetData() Function (around line 405):**
```javascript
function handleGetData() {
  const lotsData = readSheetData(SHEETS.LOTS);
  
  // Read ActualRoster sheet with attendance data
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rosterSheet = ss.getSheetByName(SHEETS.ACTUAL_ROSTER.name);
  
  // ... code that reads columns E-K (indices 4-10) for event1-event7
```

#### Step 4: Deploy the Updated Script
1. Click the **Deploy** button (top right)
2. Select **Manage deployments**
3. Click the **Edit** icon (pencil) next to your existing deployment
4. Under "Version", select **New version**
5. Add description: "Added ActualRoster attendance data integration"
6. Click **Deploy**
7. **IMPORTANT:** Copy the new Web App URL if it changed (it usually doesn't)

#### Step 5: Verify Deployment
1. Close the deployment dialog
2. The version number should have incremented (e.g., from Version 5 to Version 6)
3. Note: Changes take effect immediately after deployment

#### Step 6: Test the Application
1. Go back to your TBTC application
2. **Hard refresh** the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Navigate to the Students tab
4. Check the "Events Attended" column - should now show actual numbers (not all 0/7)
5. Click "Show Attendance Analytics" - should display without errors
6. Verify the Instrument Competition visualization appears

### Expected Results After Fix

✓ **Events Attended column** shows correct counts (e.g., "5/7", "3/7", "7/7")
✓ **Excused column** shows correct counts (e.g., "0/7", "1/7", "2/7")
✓ **Attendance Analytics** opens without errors
✓ **Instrument Competition** shows rankings with percentages
✓ **Event-by-Event chart** displays attendance trends
✓ **Browser console** shows:
```
=== STUDENTS DATA DEBUG ===
First student has event1? true
First student event1 value: "X" (or "EX" or "")
```

### Common Issues

#### Issue: "Sheet not found: ActualRoster"
**Solution:** Verify that your Google Sheet has a tab named exactly "ActualRoster" (case-sensitive)

#### Issue: Still showing 0/7 after deployment
**Solutions:**
1. Hard refresh the browser (Cmd+Shift+R or Ctrl+Shift+R)
2. Clear browser cache
3. Check that you deployed a "New version" (not just saved the script)
4. Verify the deployment is set to "Anyone" with access

#### Issue: Analytics shows "No attendance data"
**Solution:** This is the expected behavior when event1-event7 fields are missing. Follow the deployment steps above.

#### Issue: Some students have data, others don't
**Solution:** Check the ActualRoster sheet - ensure all rows have data in columns E-K

### Data Format Reference

The ActualRoster sheet should have:
- **Column A:** name
- **Column B:** instrument  
- **Column C:** grade
- **Column D:** section
- **Column E:** Event 1 attendance (Aug. 31) - values: 'X', 'EX', or blank
- **Column F:** Event 2 attendance (Sept. 14) - values: 'X', 'EX', or blank
- **Column G:** Event 3 attendance (Sept. 28) - values: 'X', 'EX', or blank
- **Column H:** Event 4 attendance (Oct. 19) - values: 'X', 'EX', or blank
- **Column I:** Event 5 attendance (Oct. 26) - values: 'X', 'EX', or blank
- **Column J:** Event 6 attendance (Nov. 9) - values: 'X', 'EX', or blank
- **Column K:** Event 7 attendance (Nov. 23) - values: 'X', 'EX', or blank

**Value meanings:**
- `X` or `x` = Student attended
- `EX`, `ex`, or `Ex` = Student was excused
- Empty/blank = Student was absent

### Still Having Issues?

1. Open `test-api.html` in your browser to inspect the raw API response
2. Check the browser console for detailed error messages
3. Verify the ActualRoster sheet structure matches the expected format
4. Ensure you're using the correct Google Sheet ID in Code.gs (SPREADSHEET_ID constant)
5. Check that the API_KEY in api-service.js matches the one in Code.gs

### Contact Information
If you continue to experience issues after following this guide, please provide:
1. Screenshot of the API Test Page output
2. Browser console logs (from the Students tab)
3. Screenshot of your ActualRoster sheet structure
4. Google Apps Script deployment version number

