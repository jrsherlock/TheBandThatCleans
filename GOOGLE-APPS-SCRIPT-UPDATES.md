# Google Apps Script Backend Updates for AI-Assisted Check-Ins

## ✅ Changes Completed

The `googleappsscript.js` file has been successfully updated to support AI-assisted student check-ins. The file is now ready to be copied and pasted directly into your Google Apps Script editor (Code.gs).

---

## 📝 Summary of Changes

### 1. ✅ SHEETS.LOTS.headers Array (Already Present)
**Lines 23-29**: The 6 new fields for AI check-ins were already present in the headers array:
- `aiStudentCount` - Student count from AI analysis
- `aiConfidence` - AI confidence level (high/medium/low)
- `aiAnalysisTimestamp` - When AI analysis was performed
- `countSource` - Source of count ("ai" or "manual")
- `countEnteredBy` - User who uploaded/entered count
- `manualCountOverride` - Manual override if AI was incorrect

### 2. ✅ New Handler Function Added
**Lines 788-909**: Added `handleSignInSheetUpload(payload)` function that:

**Accepts payload with:**
- `lotId` (required) - ID of the parking lot
- `aiCount` (optional) - Student count from AI analysis
- `manualCount` (optional) - Manual student count entry
- `aiConfidence` (optional) - AI confidence level
- `countSource` (optional) - "ai" or "manual"
- `enteredBy` (optional) - Name of user who submitted
- `imageData` (optional) - Base64 encoded image
- `notes` (optional) - Additional notes

**Functionality:**
- Validates required fields (lotId and either aiCount or manualCount)
- Finds the lot by ID in the Lots sheet
- Updates all AI-related fields in the lot row
- Stores the uploaded image (if provided)
- Handles both AI-powered and manual entry modes
- Supports manual override of AI counts
- Appends notes to the comment field with timestamp
- Updates metadata (lastUpdated, updatedBy)
- Returns success response with lot ID, count, source, and confidence

**Error Handling:**
- Returns 400 if required fields are missing
- Returns 404 if lot is not found
- Returns 500 for any other errors
- Logs all operations for debugging

### 3. ✅ Updated doGet() Function
**Lines 105-124**: Added new case in the switch statement:
```javascript
case "UPLOAD_SIGNIN_SHEET":
  return handleSignInSheetUpload(payload);
```

Updated error message to include the new action type.

### 4. ✅ Updated doPost() Function
**Lines 164-183**: Added new case in the switch statement:
```javascript
case "UPLOAD_SIGNIN_SHEET":
  return handleSignInSheetUpload(payload);
```

Updated error message to include the new action type.

---

## 🔄 How to Deploy

### Step 1: Open Google Apps Script Editor
1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys
2. Go to: **Extensions → Apps Script**
3. You should see the `Code.gs` file

### Step 2: Replace Code
1. **Select all** the existing code in `Code.gs` (Cmd+A or Ctrl+A)
2. **Delete** the selected code
3. **Open** the updated `googleappsscript.js` file from this repository
4. **Copy all** the code from `googleappsscript.js`
5. **Paste** into the `Code.gs` editor

### Step 3: Save
1. Click the **Save** icon (💾) or press Cmd+S / Ctrl+S
2. Wait for "Saved" confirmation

### Step 4: Deploy
1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Select **Web app**
4. Configure:
   - **Description**: "AI-assisted check-ins update"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. Click **Deploy**
6. **Authorize** the script if prompted
7. **Copy** the deployment URL (you'll need this for the frontend)

### Step 5: Test
1. In the Apps Script editor, select the function `testApi` from the dropdown
2. Click **Run** (▶️)
3. Check the **Execution log** for "PASSED" messages
4. If tests pass, the backend is ready!

---

## 📊 API Usage

### Endpoint
```
POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

### Request Format
```javascript
{
  "type": "UPLOAD_SIGNIN_SHEET",
  "lotId": "lot-55",
  "aiCount": 11,
  "aiConfidence": "high",
  "countSource": "ai",
  "enteredBy": "Jane Volunteer",
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "notes": "Clear image, all names legible"
}
```

### Response Format (Success)
```javascript
{
  "success": true,
  "message": "Parking Lot Cleanup Sign-in sheet uploaded successfully",
  "lotId": "lot-55",
  "studentCount": 11,
  "countSource": "ai",
  "confidence": "high",
  "timestamp": "2024-10-12T12:34:56.789Z"
}
```

### Response Format (Error)
```javascript
{
  "error": "Lot not found: lot-99",
  "httpStatus": 404
}
```

---

## 🧪 Testing the New Endpoint

### Test with Manual Entry
```javascript
{
  "type": "UPLOAD_SIGNIN_SHEET",
  "lotId": "lot-1",
  "manualCount": 8,
  "countSource": "manual",
  "enteredBy": "Test User",
  "notes": "Manual entry test"
}
```

### Test with AI Analysis
```javascript
{
  "type": "UPLOAD_SIGNIN_SHEET",
  "lotId": "lot-1",
  "aiCount": 11,
  "aiConfidence": "high",
  "countSource": "ai",
  "enteredBy": "Test User",
  "imageData": "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "notes": "AI analysis test"
}
```

### Test with Manual Override
```javascript
{
  "type": "UPLOAD_SIGNIN_SHEET",
  "lotId": "lot-1",
  "aiCount": 11,
  "manualCount": 12,
  "aiConfidence": "medium",
  "countSource": "ai",
  "enteredBy": "Test User",
  "notes": "AI suggested 11, manually corrected to 12"
}
```

---

## 📋 Verification Checklist

After deploying, verify:

- [ ] Code saved successfully in Apps Script editor
- [ ] No syntax errors shown in editor
- [ ] Deployment completed successfully
- [ ] Deployment URL copied
- [ ] Test API function runs without errors
- [ ] Can send test request to new endpoint
- [ ] Response includes all expected fields
- [ ] Data appears correctly in Google Sheets
- [ ] All 6 new columns are populated
- [ ] Image data is stored (if provided)
- [ ] Notes are appended to comments
- [ ] Timestamps are recorded

---

## 🔍 Troubleshooting

### "Function not found" error
- Make sure you saved the code before deploying
- Verify the function name is exactly `handleSignInSheetUpload`

### "Lot not found" error
- Check that the lotId exists in your Lots sheet
- Verify the ID format matches (string vs number)

### "Missing required fields" error
- Ensure payload includes `lotId`
- Include either `aiCount` or `manualCount`

### Data not appearing in sheet
- Check that all 6 new columns exist in the Lots sheet
- Verify column headers match exactly (case-sensitive)
- Check Apps Script execution logs for errors

### Image not storing
- Verify imageData is base64 encoded
- Check image size (Google Sheets has cell size limits)
- Consider compressing images before upload

---

## 📚 Related Files

- `googleappsscript.js` - Updated backend code (this file)
- `src/services/geminiService.js` - Frontend Gemini integration
- `src/components/SignInSheetUpload/SignInSheetUploadModal.jsx` - Upload UI
- `Docs/AI-CHECKINS-SETUP-STEPS.md` - Complete setup guide
- `GEMINI-INTEGRATION-NEXT-STEPS.md` - Frontend setup steps

---

## ✨ Next Steps

1. ✅ Deploy updated Google Apps Script (follow steps above)
2. ⏭️ Update frontend API service to call new endpoint
3. ⏭️ Integrate upload modal into ParkingLotsScreen
4. ⏭️ Test end-to-end with real sign-in sheet photos
5. ⏭️ Train users on new feature

---

**Status**: Backend code ready for deployment! 🚀

Copy the entire `googleappsscript.js` file to your Google Apps Script editor and deploy.

