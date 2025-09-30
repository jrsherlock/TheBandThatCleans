# Import Real Parking Lots into Google Sheets

This guide will help you import the 22 real parking lots from the 2025-2026 event sheets into your Google Sheet.

## 📋 Overview

- **Google Sheet URL**: https://docs.google.com/spreadsheets/d/1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys
- **Target Tab**: "Lots"
- **Import File**: `lots-import-data.csv`
- **Total Lots**: 22 real parking lots

## 🎯 Method 1: Manual CSV Import (Recommended)

### Step 1: Open the Google Sheet
1. Go to: https://docs.google.com/spreadsheets/d/1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys
2. Click on the **"Lots"** tab at the bottom

### Step 2: Clear Existing Sample Data
1. Select all rows **except the header row** (row 1)
2. Right-click and select **"Delete rows"**
3. You should now have only the header row with columns: `id`, `name`, `section`, `status`, `priority`, etc.

### Step 3: Import the CSV File
1. In Google Sheets, go to **File > Import**
2. Click **"Upload"** tab
3. Click **"Select a file from your device"**
4. Choose the `lots-import-data.csv` file from this project directory
5. In the import dialog:
   - **Import location**: Select **"Append to current sheet"**
   - **Separator type**: **Comma**
   - **Convert text to numbers, dates, and formulas**: **Yes** (checked)
6. Click **"Import data"**

### Step 4: Verify the Import
After import, you should see:
- **22 rows of data** (plus 1 header row = 23 total rows)
- All lots have `status = "not-started"`
- Lots are organized by zone (Zone 1-6)
- Priority levels are set (high/medium/low)
- Estimated times are set (30-50 minutes)

## 🎯 Method 2: Copy-Paste from CSV

### Step 1: Open the CSV File
1. Open `lots-import-data.csv` in a text editor or Excel
2. Select **all data including the header row**
3. Copy to clipboard (Ctrl+C or Cmd+C)

### Step 2: Paste into Google Sheets
1. Open the Google Sheet "Lots" tab
2. Click on cell **A1** (top-left corner)
3. Delete all existing rows except the header
4. Paste the data (Ctrl+V or Cmd+V)
5. Google Sheets will automatically parse the CSV format

## 🎯 Method 3: Google Apps Script (Advanced)

If you prefer to use a script to automate the import:

### Step 1: Open Apps Script Editor
1. In your Google Sheet, go to **Extensions > Apps Script**
2. You should see the existing `Code.gs` file

### Step 2: Add Import Function
Add this function to `Code.gs`:

```javascript
/**
 * Import real parking lot data into the Lots sheet
 * Run this function once to populate the sheet with real data
 */
function importRealLots() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const lotsSheet = ss.getSheetByName(SHEETS.LOTS.name);
  
  // Clear existing data (keep header)
  const lastRow = lotsSheet.getLastRow();
  if (lastRow > 1) {
    lotsSheet.deleteRows(2, lastRow - 1);
  }
  
  // Real parking lot data
  const realLots = [
    ["lot-1", "Lot 3 - Library Lot", "east", "not-started", "high", 45, 0, "Zone 1 - East side of River", "", "", "", "", ""],
    ["lot-2", "Lot 11 - Jail Lot", "east", "not-started", "medium", 45, 0, "Zone 1 - New for 2025", "", "", "", "", ""],
    ["lot-3", "Lot 55 - Hancher", "east", "not-started", "high", 50, 0, "Zone 1 - East side of River", "", "", "", "", ""],
    ["lot-4", "Lot 48 - Myrtle", "south", "not-started", "medium", 40, 0, "Zone 2 - South of Melrose Ave", "", "", "", "", ""],
    ["lot-5", "Lot 53 - Melrose Court", "south", "not-started", "medium", 40, 0, "Zone 2 - South of Melrose Ave", "", "", "", "", ""],
    ["lot-6", "Lot 49 - Red Barn", "south", "not-started", "medium", 45, 0, "Zone 2 - South of Melrose Ave", "", "", "", "", ""],
    ["lot-7", "Lot 58 - Adjacent to Lot 49", "south", "not-started", "low", 30, 0, "Zone 2 - New for 2025 - 20 stalls", "", "", "", "", ""],
    ["lot-8", "Ramp 4 (South Side)", "south", "not-started", "medium", 40, 0, "Zone 2 - Not in ramp", "", "", "", "", ""],
    ["lot-9", "Lot 75 - Arena Commuter", "north", "not-started", "high", 50, 0, "Zone 3 - North of Kinnick Stadium Area", "", "", "", "", ""],
    ["lot-10", "Lot 46 - Carver", "north", "not-started", "high", 50, 0, "Zone 3 - North of Kinnick Stadium Area", "", "", "", "", ""],
    ["lot-11", "Lot 40 - Dental Lot", "north", "not-started", "high", 50, 0, "Zone 3 - North of Kinnick Stadium Area", "", "", "", "", ""],
    ["lot-12", "Lot 65 - Finkbine", "north", "not-started", "medium", 45, 0, "Zone 3 - North of Kinnick Stadium Area", "", "", "", "", ""],
    ["lot-13", "Lot 43 N - N of Hawkeye Ramp", "north", "not-started", "high", 50, 0, "Zone 4 - Kinnick Stadium Area", "", "", "", "", ""],
    ["lot-14", "Lot 43 NW - Rec Bldg Area", "north", "not-started", "high", 50, 0, "Zone 4 - Between Rec Bldg & Football Facility", "", "", "", "", ""],
    ["lot-15", "Lot 43 W - West of Kinnick", "west", "not-started", "high", 50, 0, "Zone 4 - Kinnick Stadium Area", "", "", "", "", ""],
    ["lot-16", "Lot 85 - Hawkeye Commuter", "west", "not-started", "medium", 45, 0, "Zone 5 - Far West Campus", "", "", "", "", ""],
    ["lot-17", "Soccer Lot - Lower Finkbine", "west", "not-started", "low", 35, 0, "Zone 5 - Far West Campus", "", "", "", "", ""],
    ["lot-18", "Softball Lot", "west", "not-started", "low", 35, 0, "Zone 5 - Far West Campus - Coralville", "", "", "", "", ""],
    ["lot-19", "Lot 71 - Hall of Fame", "west", "not-started", "medium", 40, 0, "Zone 5 - Far West Campus", "", "", "", "", ""],
    ["lot-20", "Golf Course", "west", "not-started", "low", 40, 0, "Zone 6 - Golf Course Area", "", "", "", "", ""],
    ["lot-21", "Lot 73 - University Club", "west", "not-started", "medium", 40, 0, "Zone 6 - Golf Course Area", "", "", "", "", ""]
  ];
  
  // Insert data starting at row 2
  if (realLots.length > 0) {
    const range = lotsSheet.getRange(2, 1, realLots.length, realLots[0].length);
    range.setValues(realLots);
  }
  
  Logger.log(`Successfully imported ${realLots.length} parking lots`);
  SpreadsheetApp.getUi().alert(`Successfully imported ${realLots.length} parking lots into the Lots sheet!`);
}
```

### Step 3: Run the Import Function
1. In the Apps Script editor, select the `importRealLots` function from the dropdown
2. Click the **Run** button (▶️)
3. Authorize the script if prompted
4. You should see a success message

## ✅ Verification Checklist

After importing, verify the following:

- [ ] **22 lots total** (rows 2-23, with row 1 being the header)
- [ ] **Zone 1 (East)**: 3 lots (Lot 3, Lot 11, Lot 55)
- [ ] **Zone 2 (South)**: 5 lots (Lot 48, 53, 49, 58, Ramp 4)
- [ ] **Zone 3 (North)**: 4 lots (Lot 75, 46, 40, 65)
- [ ] **Zone 4 (North/West)**: 3 lots (Lot 43 N, 43 NW, 43 W)
- [ ] **Zone 5 (West)**: 4 lots (Lot 85, Soccer, Softball, Lot 71)
- [ ] **Zone 6 (West)**: 2 lots (Golf Course, Lot 73)
- [ ] All lots have `status = "not-started"`
- [ ] Priority levels are appropriate (high for main lots, low for remote lots)
- [ ] Estimated times are set (30-50 minutes)
- [ ] Comments include zone information

## 📊 Lot Distribution Summary

| Zone | Description | Section | Count | Lots |
|------|-------------|---------|-------|------|
| Zone 1 | East side of River | east | 3 | Lot 3, Lot 11, Lot 55 |
| Zone 2 | South of Melrose Ave | south | 5 | Lot 48, 53, 49, 58, Ramp 4 |
| Zone 3 | North of Kinnick Stadium | north | 4 | Lot 75, 46, 40, 65 |
| Zone 4 | Kinnick Stadium Area | north/west | 3 | Lot 43 N, 43 NW, 43 W |
| Zone 5 | Far West Campus | west | 4 | Lot 85, Soccer, Softball, Lot 71 |
| Zone 6 | Golf Course Area | west | 2 | Golf Course, Lot 73 |

## 🔧 Next Steps After Import

1. **Update Code.gs**:
   - Change `SPREADSHEET_ID` from `"YOUR_SPREADSHEET_ID_HERE"` to `"1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys"`
   - Save the file

2. **Redeploy the Web App**:
   - In Apps Script editor, click **Deploy > Manage deployments**
   - Click **Edit** (pencil icon) on the active deployment
   - Under "Version", select **New version**
   - Click **Deploy**

3. **Test the Application**:
   - Open the React app in your browser
   - Verify that the 22 real lots are displayed
   - Check that all lot details are correct

4. **Populate Student Data** (if needed):
   - Import student roster into the "Students" tab
   - Use similar CSV import process

## 🆘 Troubleshooting

### Issue: Import doesn't work
- **Solution**: Make sure you're importing into the "Lots" tab, not creating a new sheet

### Issue: Data appears in wrong columns
- **Solution**: Ensure the CSV header row matches exactly: `id,name,section,status,priority,estimatedTime,totalStudentsSignedUp,comment,lastUpdated,updatedBy,actualStartTime,completedTime,signUpSheetPhoto`

### Issue: App still shows old data
- **Solution**: 
  1. Verify the Google Sheet has the new data
  2. Check that `SPREADSHEET_ID` in `Code.gs` is correct
  3. Redeploy the Google Apps Script Web App
  4. Clear browser cache and refresh the app

## 📝 Notes

- The `comment` field contains zone information for reference
- All lots start with `status = "not-started"` - this will be updated during the event
- The `lastUpdated`, `updatedBy`, `actualStartTime`, `completedTime`, and `signUpSheetPhoto` fields are empty initially
- These fields will be populated automatically as the event progresses and lots are updated

## 🎉 Success!

Once imported, your Google Sheet will be the single source of truth for parking lot data, and the React application will automatically fetch and display the real lots!

