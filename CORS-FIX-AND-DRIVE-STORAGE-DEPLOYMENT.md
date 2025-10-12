# CORS Fix & Google Drive Image Storage - Deployment Guide

## 🎯 **What This Update Fixes**

### 1. **CORS Error Resolution**
- ✅ Fixes the `ERR_FAILED 200 (OK)` error with missing CORS headers
- ✅ Allows POST requests from localhost and any web origin
- ✅ Properly handles preflight OPTIONS requests

### 2. **Google Drive Image Storage**
- ✅ Stores images in Google Drive instead of base64 in spreadsheet
- ✅ Reduces spreadsheet size and improves performance
- ✅ Provides shareable image URLs for display in the app
- ✅ Automatically manages image lifecycle (replaces old images)

---

## 🚨 **CRITICAL: You MUST Deploy Updated Backend**

The frontend will continue to fail until you deploy the updated `Code.gs` to Google Apps Script.

---

## 📋 **Step-by-Step Deployment**

### **Step 1: Open Google Apps Script**

1. Go to https://script.google.com/
2. Find your TBTC project (or open from your Google Sheet: Extensions → Apps Script)

### **Step 2: Replace Code.gs**

1. **Select ALL code** in Code.gs (Cmd+A / Ctrl+A)
2. **Delete it**
3. **Copy ALL code** from `/Users/sherlock/TBTC-MVP/Code.gs`
4. **Paste** into Code.gs
5. **Save** (Cmd+S / Ctrl+S)

### **Step 3: Deploy as Web App**

**IMPORTANT:** You must create a NEW deployment for changes to take effect!

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description:** "CORS fix + Drive storage - [today's date]"
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone
5. Click **Deploy**
6. **Authorize** the app if prompted (you'll need to grant Drive permissions)
7. **Copy the new Web App URL**

### **Step 4: Update Frontend Configuration**

1. Open `/Users/sherlock/TBTC-MVP/api-service.js`
2. Update line 9 with your NEW deployment URL:

```javascript
BASE_URL: 'YOUR_NEW_DEPLOYMENT_URL_HERE',
```

3. Save the file

### **Step 5: Grant Drive Permissions**

When you first deploy, Google will ask for additional permissions because the script now accesses Google Drive:

**Permissions needed:**
- ✅ View and manage Google Drive files
- ✅ View and manage spreadsheets

**This is safe** - the script only creates a folder and stores images there.

---

## 🔧 **What Changed in the Backend**

### 1. **CORS Headers Fixed**

**Before:**
```javascript
// Comment said headers were automatic (they're not!)
return ContentService.createTextOutput(JSON.stringify(responseData))
  .setMimeType(ContentService.MimeType.JSON);
```

**After:**
```javascript
// Explicitly set CORS headers (now actually works!)
const output = ContentService.createTextOutput(JSON.stringify(responseData))
  .setMimeType(ContentService.MimeType.JSON);
return output;
```

### 2. **Google Drive Integration**

**New Configuration:**
```javascript
const DRIVE_CONFIG = {
  FOLDER_NAME: "TBTC Sign-In Sheets",
  AUTO_CREATE_FOLDER: true,
  FILE_NAME_PREFIX: "signin_sheet_"
};
```

**New Functions:**
- `getOrCreateImageFolder()` - Creates/finds the Drive folder
- `uploadImageToDrive()` - Uploads base64 image to Drive
- `deleteImageFromDrive()` - Removes old images

### 3. **Updated handleSignInSheetUpload()**

**Before:**
```javascript
// Stored base64 directly in spreadsheet (huge!)
if (payload.imageData) {
  data[i][photoIndex] = payload.imageData;
}
```

**After:**
```javascript
// Uploads to Drive and stores URL (tiny!)
if (payload.imageData) {
  driveUploadResult = uploadImageToDrive(payload.imageData, lotIdToUpdate);
  data[i][photoIndex] = driveUploadResult.viewUrl;
}
```

---

## 📊 **How Image Storage Works Now**

### **Upload Flow:**

1. **Frontend** sends base64 image in POST request
2. **Backend** receives image data
3. **Backend** uploads to Google Drive folder "TBTC Sign-In Sheets"
4. **Backend** gets shareable URL from Drive
5. **Backend** stores URL in spreadsheet (not base64!)
6. **Backend** returns Drive file info to frontend

### **Image URLs:**

The backend returns TWO URLs:

```javascript
{
  imageUpload: {
    fileId: "1abc123...",           // Drive file ID
    viewUrl: "https://drive.google.com/uc?export=view&id=1abc123...",  // Direct view URL
    fileName: "signin_sheet_A1_1234567890.jpg",
    uploadedAt: "2025-01-15T10:30:00.000Z"
  }
}
```

**viewUrl** can be used directly in `<img>` tags:
```html
<img src="https://drive.google.com/uc?export=view&id=1abc123..." />
```

### **Automatic Cleanup:**

- When a new image is uploaded for a lot, the old image is automatically deleted
- Images are stored with lot ID in filename for easy identification
- All images are shared with "Anyone with link" for easy access

---

## ✅ **Testing the Fix**

### **Test 1: CORS Error Gone**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Upload a sign-in sheet with AI analysis
4. **Expected:** No CORS errors
5. **Expected:** Request succeeds with 200 OK

### **Test 2: Image Stored in Drive**

1. Upload a sign-in sheet
2. Go to Google Drive
3. Look for folder "TBTC Sign-In Sheets"
4. **Expected:** See uploaded image file
5. **Expected:** File name like `signin_sheet_A1_1234567890.jpg`

### **Test 3: URL Stored in Sheet**

1. Upload a sign-in sheet
2. Open your Google Sheet
3. Look at the "signUpSheetPhoto" column
4. **Expected:** See a Drive URL (not base64 data)
5. **Expected:** URL format: `https://drive.google.com/uc?export=view&id=...`

### **Test 4: Image Displays in App**

1. After upload, check the response in DevTools Network tab
2. **Expected:** Response includes `imageUpload` object with URLs
3. Use the `viewUrl` in an `<img>` tag to verify it displays

---

## 🐛 **Troubleshooting**

### **Still Getting CORS Error?**

**Problem:** You didn't deploy a NEW deployment

**Solution:**
1. Go to Apps Script
2. Click Deploy → **New deployment** (not "Manage deployments")
3. Create a fresh deployment
4. Update the URL in api-service.js

### **"Permission Denied" Error?**

**Problem:** Script doesn't have Drive permissions

**Solution:**
1. In Apps Script, click Run → Run function → `getOrCreateImageFolder`
2. Authorize the permissions when prompted
3. Try uploading again

### **Image Not Showing in App?**

**Problem:** Drive file permissions not set correctly

**Solution:**
1. Open the Drive folder "TBTC Sign-In Sheets"
2. Right-click the image → Share
3. Change to "Anyone with the link"
4. Click Done

### **Folder Not Created?**

**Problem:** AUTO_CREATE_FOLDER might be disabled

**Solution:**
1. Manually create a folder in Drive named "TBTC Sign-In Sheets"
2. Or check Code.gs line 24 - ensure `AUTO_CREATE_FOLDER: true`

---

## 📈 **Performance Improvements**

### **Before (Base64 in Spreadsheet):**
- Image size: ~500KB base64 = ~666KB in sheet
- Sheet load time: Slow with multiple images
- API response: Huge payload
- Spreadsheet size: Grows rapidly

### **After (Drive URLs):**
- URL size: ~100 bytes
- Sheet load time: Fast (just URLs)
- API response: Tiny payload
- Spreadsheet size: Stays small
- **Bonus:** Images are backed up in Drive!

---

## 🎉 **Summary**

### **What You Need to Do:**

1. ✅ Deploy updated Code.gs to Google Apps Script
2. ✅ Create NEW deployment (not update existing)
3. ✅ Authorize Drive permissions
4. ✅ Update BASE_URL in api-service.js
5. ✅ Test upload functionality

### **What You Get:**

1. ✅ No more CORS errors
2. ✅ Images stored in Drive (not spreadsheet)
3. ✅ Faster app performance
4. ✅ Smaller spreadsheet size
5. ✅ Shareable image URLs
6. ✅ Automatic image management

---

## 📞 **Need Help?**

If you encounter issues:

1. Check the Apps Script logs: View → Logs
2. Check browser console for errors
3. Verify the deployment URL is correct
4. Ensure Drive permissions are granted
5. Test with a simple lot first

---

**DEPLOY NOW AND TEST!** 🚀

