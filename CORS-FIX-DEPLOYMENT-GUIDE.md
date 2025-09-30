# CORS Fix Deployment Guide

## 🚨 Critical Fix Required

**Issue**: CORS errors preventing API communication between frontend and Google Apps Script backend.

**Error Message**:
```
Access to fetch at 'https://script.google.com/macros/s/.../exec' from origin 
'https://the-band-that-cleans.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root Cause**: Google Apps Script does NOT automatically handle CORS. The backend must explicitly add CORS headers to all responses and implement a `doOptions()` function for preflight requests.

**Fix Applied**: 
- ✅ Added CORS headers to `createJsonResponse()` function
- ✅ Implemented `doOptions()` function for preflight handling
- ✅ Committed to MVP branch (commit: 008e763)

---

## 📋 Deployment Steps

### Step 1: Open Google Apps Script Editor

1. Go to your Google Apps Script project:
   - **Direct Link**: https://script.google.com/
   - Or go to your Google Sheet → Extensions → Apps Script

2. You should see your existing Code.gs file

### Step 2: Update Code.gs

**Option A: Copy from GitHub (Recommended)**

1. Open the updated Code.gs from GitHub:
   - Go to: https://github.com/jrsherlock/TheBandThatCleans/blob/MVP/Code.gs
   - Click "Raw" button
   - Select all (Cmd+A / Ctrl+A)
   - Copy (Cmd+C / Ctrl+C)

2. In Apps Script Editor:
   - Select all existing code (Cmd+A / Ctrl+A)
   - Paste the new code (Cmd+V / Ctrl+V)
   - Click "Save" (💾 icon or Cmd+S / Ctrl+S)

**Option B: Copy from Local File**

1. Open `Code.gs` from your local TBTC-MVP directory
2. Copy all contents
3. Paste into Apps Script Editor
4. Click "Save"

### Step 3: Verify the Changes

Look for these two key additions in your Code.gs:

**1. New `doOptions()` function** (around line 138):
```javascript
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify({ status: 'ok' }))
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    });
}
```

**2. Updated `createJsonResponse()` function** (around line 807):
```javascript
function createJsonResponse(data, status = 200) {
  // ... existing code ...
  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
}
```

### Step 4: Deploy the Updated Script

**IMPORTANT**: Simply saving the script is NOT enough. You MUST deploy it!

**Option A: Update Existing Deployment (Recommended)**

1. Click "Deploy" button (top right)
2. Click "Manage deployments"
3. Find your existing Web App deployment
4. Click the "Edit" (pencil) icon
5. In "Version" dropdown, select "New version"
6. Add description: "Fix CORS errors - Add CORS headers and doOptions()"
7. Click "Deploy"
8. Click "Done"

**Option B: Create New Deployment**

1. Click "Deploy" button (top right)
2. Click "New deployment"
3. Click gear icon ⚙️ next to "Select type"
4. Choose "Web app"
5. Configure:
   - **Description**: "CORS Fix - v2"
   - **Execute as**: "Me" (your Google account)
   - **Who has access**: "Anyone" (NOT "Anyone with Google account")
6. Click "Deploy"
7. **IMPORTANT**: Copy the new Web App URL if it changed
8. Click "Done"

### Step 5: Verify Deployment URL

1. After deployment, note the Web App URL
2. It should look like:
   ```
   https://script.google.com/macros/s/AKfycbyDxwxwsN14CYvHS8mGgVcFYMWjFAykVBNUlAx0fW7E7wXi9rE2_vgwrKNn_Ezq6X6M/exec
   ```

3. **If URL changed**, update `api-service.js`:
   - Open `api-service.js` in your code editor
   - Update `API_CONFIG.BASE_URL` with new URL
   - Commit and push changes
   - Redeploy to Vercel

---

## 🧪 Testing the Fix

### Test 1: Direct Browser Test

1. Open browser DevTools (F12)
2. Go to Console tab
3. Paste this code (replace URL with your Web App URL):
   ```javascript
   fetch('https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=data&apiKey=test-api-key-12345')
     .then(r => r.json())
     .then(data => console.log('Success:', data))
     .catch(err => console.error('Error:', err));
   ```
4. Press Enter
5. **Expected**: Should see data response, NO CORS errors

### Test 2: Check Response Headers

1. Open browser DevTools (F12)
2. Go to Network tab
3. Make a request to your Apps Script URL
4. Click on the request in Network tab
5. Go to "Headers" section
6. Look for "Response Headers"
7. **Expected**: Should see:
   ```
   access-control-allow-origin: *
   access-control-allow-methods: GET, POST, OPTIONS
   access-control-allow-headers: Content-Type, Authorization, X-Requested-With
   ```

### Test 3: Test from Vercel Production

1. Go to: https://the-band-that-cleans.vercel.app/
2. Open browser DevTools (F12)
3. Select a user (Director or Volunteer)
4. Try to interact with the app (view lots, update status, etc.)
5. Check Console tab for errors
6. **Expected**: NO CORS errors, API calls succeed

### Test 4: Test from Localhost

1. Run local dev server:
   ```bash
   npm run dev
   ```
2. Open: http://localhost:5173/
3. Open browser DevTools (F12)
4. Select a user and interact with app
5. **Expected**: NO CORS errors, API calls succeed

---

## ✅ Success Criteria

The fix is successful when:
- ✅ No CORS errors in browser console (Vercel or localhost)
- ✅ POST requests successfully reach Google Apps Script
- ✅ Response headers include `Access-Control-Allow-Origin: *`
- ✅ All MVP features work:
  - View parking lots
  - Update lot status
  - Update lot details
  - Upload images for OCR
  - Bulk status updates
- ✅ Works in both production (Vercel) and local development

---

## 🐛 Troubleshooting

### Issue: Still Getting CORS Errors

**Possible Causes**:
1. **Deployment not updated**: Make sure you deployed (not just saved)
2. **Wrong deployment**: Make sure you're using the correct Web App URL
3. **Browser cache**: Clear browser cache and hard reload (Cmd+Shift+R / Ctrl+Shift+F5)
4. **Old deployment active**: Make sure the new deployment is the active one

**Solutions**:
1. Verify deployment in Apps Script:
   - Click "Deploy" → "Manage deployments"
   - Check that latest version is active
2. Clear browser cache completely
3. Test in incognito/private window
4. Check Network tab to see actual URL being called

### Issue: "Execute as" Permission Error

**Error**: "Authorization required" or "You don't have permission"

**Solution**:
1. In deployment settings, ensure "Execute as" is set to "Me" (your account)
2. Re-authorize the script:
   - Click "Deploy" → "New deployment"
   - Follow authorization prompts
   - Grant necessary permissions

### Issue: Response Headers Not Showing

**Possible Causes**:
1. Looking at request headers instead of response headers
2. Preflight request (OPTIONS) not showing in Network tab

**Solutions**:
1. In Network tab, make sure you're looking at "Response Headers" section
2. For OPTIONS requests, they may be filtered out - uncheck "Hide data URLs" filter
3. Use curl to test directly:
   ```bash
   curl -I https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

### Issue: API Key Validation Failing

**Error**: "Unauthorized access. Valid API key required."

**Solution**:
1. Check that `MOCK_API_KEY` in Code.gs matches `API_KEY` in api-service.js
2. Default should be: `test-api-key-12345`
3. If you changed it, make sure both files match

---

## 📊 What Changed

### Before (CORS Errors)
```javascript
// createJsonResponse() - NO CORS headers
function createJsonResponse(data, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  // ❌ Missing CORS headers
}

// ❌ No doOptions() function
```

### After (CORS Fixed)
```javascript
// createJsonResponse() - WITH CORS headers
function createJsonResponse(data, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
  // ✅ CORS headers added
}

// ✅ doOptions() function added
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify({ status: 'ok' }))
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    });
}
```

---

## 🔐 Security Note

**Why `Access-Control-Allow-Origin: *`?**

This allows requests from ANY origin (domain). This is acceptable because:
1. ✅ API key authentication is still required
2. ✅ Data is not sensitive (parking lot cleanup info)
3. ✅ Simplifies deployment (no need to whitelist specific domains)
4. ✅ Standard practice for public APIs

**If you want to restrict origins** (more secure):
```javascript
'Access-Control-Allow-Origin': 'https://the-band-that-cleans.vercel.app'
```

But you'll need to add localhost for development:
```javascript
const origin = e.parameter.origin || e.headers?.origin || '*';
const allowedOrigins = [
  'https://the-band-that-cleans.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];
const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

// Then use corsOrigin in headers:
'Access-Control-Allow-Origin': corsOrigin
```

---

## 📞 Support

If you continue to experience CORS errors after following this guide:

1. **Check browser console** for exact error message
2. **Check Network tab** to see request/response headers
3. **Verify deployment** is active and using latest version
4. **Test in incognito** to rule out cache issues
5. **Contact support** with screenshots of:
   - Console errors
   - Network tab (request/response headers)
   - Apps Script deployment settings

---

## ✨ Summary

**What was the problem?**
- Google Apps Script doesn't automatically handle CORS
- Browsers send OPTIONS preflight requests before POST requests
- Without proper CORS headers, browsers block the requests

**What was the fix?**
- Added CORS headers to all responses via `createJsonResponse()`
- Implemented `doOptions()` function to handle preflight requests
- Set `Access-Control-Allow-Origin: *` to allow all origins

**What do you need to do?**
1. ✅ Copy updated Code.gs to Apps Script Editor
2. ✅ Deploy the updated script (new version or new deployment)
3. ✅ Test from Vercel and localhost
4. ✅ Verify no CORS errors in console

**Estimated time**: 5-10 minutes

---

**Good luck! 🚀**

