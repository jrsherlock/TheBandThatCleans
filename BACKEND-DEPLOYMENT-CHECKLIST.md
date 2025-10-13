# Backend Deployment Checklist - URGENT FIX NEEDED

## 🚨 **PROBLEM IDENTIFIED**

The AI analysis is working, but data is NOT being saved to Google Sheets because:

**The Google Apps Script backend has NOT been deployed with the updated `handleSignInSheetUpload()` function.**

---

## ✅ **IMMEDIATE ACTION REQUIRED**

### Step 1: Deploy Updated Google Apps Script

1. **Open Google Apps Script Editor:**
   - Go to: https://script.google.com/
   - Find your TBTC project
   - OR go to your Google Sheet → Extensions → Apps Script

2. **Replace ALL code in Code.gs:**
   - Select ALL existing code in Code.gs (Cmd+A / Ctrl+A)
   - Delete it
   - Copy the ENTIRE contents of `/Users/sherlock/TBTC-MVP/googleappsscript.js`
   - Paste into Code.gs

3. **Save the script:**
   - Click the disk icon or Cmd+S / Ctrl+S
   - Wait for "Saved" confirmation

4. **Deploy as Web App:**
   - Click "Deploy" → "New deployment"
   - Click gear icon ⚙️ → Select "Web app"
   - **Description:** "AI-assisted check-ins update - [today's date]"
   - **Execute as:** Me
   - **Who has access:** Anyone
   - Click "Deploy"
   - **IMPORTANT:** Copy the new deployment URL

5. **Update Frontend with new URL (if changed):**
   - Open `/Users/sherlock/TBTC-MVP/api-service.js`
   - Update `BASE_URL` with the new deployment URL
   - Save file
   - Restart dev server

---

### Step 2: Verify Google Sheets Columns

Open your Google Sheet and verify the "Lots" tab has these columns:

| Column | Header Name | Type |
|--------|-------------|------|
| P | `aiStudentCount` | Number |
| Q | `aiConfidence` | Text (high/medium/low/manual) |
| R | `aiAnalysisTimestamp` | Timestamp |
| S | `countSource` | Text (ai/manual) |
| T | `countEnteredBy` | Text (user name) |
| U | `manualCountOverride` | Number |

**IMPORTANT:** The header names must match EXACTLY (case-sensitive).

From your screenshot, I can see columns P-U exist, but I need to verify the exact header names.

---

### Step 3: Test the Deployment

1. **Test the backend directly:**
   
   Open this URL in your browser (replace with your actual deployment URL):
   ```
   https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?type=UPLOAD_SIGNIN_SHEET&lotId=101&manualCount=5&countSource=manual&enteredBy=Test
   ```

2. **Expected response:**
   ```json
   {
     "success": true,
     "message": "Parking Lot Cleanup Sign-in sheet uploaded successfully",
     "lotId": "101",
     "studentCount": 5,
     "countSource": "manual",
     "confidence": "manual",
     "timestamp": "2024-10-12T..."
   }
   ```

3. **Check Google Sheets:**
   - Open the "Lots" tab
   - Find row with ID 101 (Library Lot)
   - Verify column P shows "5"
   - Verify column S shows "manual"
   - Verify column T shows "Test"

---

## 🔍 **Debugging Steps**

### Check 1: Verify Backend Deployment

**Test if the handler exists:**

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?type=UPLOAD_SIGNIN_SHEET
```

**Expected response if deployed correctly:**
```json
{
  "error": "lotId is required"
}
```

**If you get this instead, backend is NOT deployed:**
```json
{
  "error": "Invalid POST type: UPLOAD_SIGNIN_SHEET..."
}
```

### Check 2: Verify Column Headers

1. Open Google Sheets
2. Go to "Lots" tab
3. Check row 1 (headers)
4. Verify columns P-U have EXACT names:
   - P: `aiStudentCount`
   - Q: `aiConfidence`
   - R: `aiAnalysisTimestamp`
   - S: `countSource`
   - T: `countEnteredBy`
   - U: `manualCountOverride`

### Check 3: Check Apps Script Logs

1. Go to Apps Script editor
2. Click "Executions" (clock icon on left)
3. Look for recent executions
4. Check for errors

### Check 4: Verify API URL in Frontend

1. Open `/Users/sherlock/TBTC-MVP/api-service.js`
2. Check `BASE_URL` matches your deployment URL
3. Should look like:
   ```javascript
   const BASE_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
   ```

---

## 📊 **Expected Data Flow**

### When Upload Works Correctly:

1. **User uploads image** → AI analyzes → Returns count
2. **User clicks Submit** → Frontend sends payload:
   ```json
   {
     "type": "UPLOAD_SIGNIN_SHEET",
     "lotId": "101",
     "aiCount": 4,
     "aiConfidence": "high",
     "countSource": "ai",
     "enteredBy": "John Doe",
     "notes": "Clear image, all names legible",
     "imageData": "data:image/jpeg;base64,/9j/4AAQ..."
   }
   ```

3. **Backend receives** → `handleSignInSheetUpload()` processes
4. **Google Sheets updated:**
   - Row with ID 101 updated
   - Column P: 4
   - Column Q: "high"
   - Column R: "2024-10-12T15:30:00.000Z"
   - Column S: "ai"
   - Column T: "John Doe"
   - Column L: base64 image data

5. **Backend responds:**
   ```json
   {
     "success": true,
     "message": "Parking Lot Cleanup Sign-in sheet uploaded successfully",
     "lotId": "101",
     "studentCount": 4,
     "countSource": "ai",
     "confidence": "high",
     "timestamp": "2024-10-12T15:30:00.000Z"
   }
   ```

6. **Frontend refreshes** → Shows updated count on lot card

---

## 🐛 **Common Issues & Solutions**

### Issue 1: "Invalid POST type: UPLOAD_SIGNIN_SHEET"

**Cause:** Backend not deployed with updated code

**Solution:**
1. Copy entire `googleappsscript.js` to Code.gs
2. Save
3. Deploy as new version
4. Update frontend URL if needed

### Issue 2: "Lot not found: 101"

**Cause:** Lot ID mismatch

**Solution:**
1. Check Google Sheets "Lots" tab
2. Verify lot ID in column A
3. Ensure it matches exactly (101 vs "101")

### Issue 3: Data not appearing in Google Sheets

**Cause:** Column headers don't match

**Solution:**
1. Check column headers in row 1
2. Ensure exact match (case-sensitive):
   - `aiStudentCount` (not `AIStudentCount` or `ai_student_count`)
   - `aiConfidence` (not `AIConfidence`)
   - etc.

### Issue 4: "Cannot read property 'indexOf' of undefined"

**Cause:** Column header missing

**Solution:**
1. Add missing column header to row 1
2. Ensure all 6 new columns exist (P-U)

---

## 🧪 **Testing Procedure**

### Test 1: Backend Direct Test

```bash
# Test with curl (replace URL and params)
curl "https://script.google.com/macros/s/YOUR_ID/exec?type=UPLOAD_SIGNIN_SHEET&lotId=101&manualCount=99&countSource=manual&enteredBy=TestUser"
```

**Expected:** Success response + data in Google Sheets

### Test 2: Frontend Test

1. Open app in browser
2. Open DevTools → Network tab
3. Upload sign-in sheet
4. Click Submit
5. Check Network tab for request
6. Verify response is 200 OK
7. Check response body for `"success": true`

### Test 3: Google Sheets Verification

1. Open Google Sheets
2. Go to "Lots" tab
3. Find the lot you uploaded to
4. Verify columns P-U have data
5. Verify column L has base64 image data

---

## ✅ **Verification Checklist**

Before testing, verify:

- [ ] `googleappsscript.js` copied to Code.gs in Apps Script editor
- [ ] Code saved in Apps Script editor
- [ ] New deployment created
- [ ] Deployment URL copied
- [ ] Frontend `api-service.js` has correct `BASE_URL`
- [ ] Google Sheets has columns P-U with correct headers
- [ ] Dev server restarted (if URL changed)
- [ ] Backend test URL returns expected response
- [ ] Google Sheets shows test data

---

## 🎯 **Quick Fix Summary**

**The issue is almost certainly that the backend hasn't been deployed.**

**To fix:**
1. Copy `googleappsscript.js` → Apps Script Code.gs
2. Save
3. Deploy as new version
4. Test

**That's it!** The frontend code is correct, the AI is working, the payload is being sent correctly. The backend just needs to be deployed.

---

## 📞 **Still Not Working?**

If you've completed all steps and it's still not working:

1. **Check Apps Script Logs:**
   - Apps Script editor → Executions
   - Look for errors

2. **Check Browser Console:**
   - Look for API errors
   - Check response body

3. **Verify Payload:**
   - Network tab → Find the request
   - Check "Payload" tab
   - Verify all required fields are present

4. **Test with minimal payload:**
   ```
   ?type=UPLOAD_SIGNIN_SHEET&lotId=101&manualCount=1&countSource=manual&enteredBy=Test
   ```

---

## 🚀 **Expected Result After Fix**

After deploying the backend:

✅ Upload sign-in sheet → AI analyzes → Submit
✅ Success notification appears
✅ Google Sheets updated with all data
✅ Lot card shows updated count
✅ Data persists across page refreshes

---

**DEPLOY THE BACKEND NOW!** 🚀

The code is ready, it just needs to be deployed to Google Apps Script.

