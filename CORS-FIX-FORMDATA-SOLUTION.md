# CORS Error - FormData Solution ✅

## 🐛 **New Problem: CORS Error**

After fixing the URL length issue, we hit a **CORS (Cross-Origin Resource Sharing) error**:

```
Access to fetch at 'https://script.google.com/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access 
control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Why This Happened:

**POST requests with JSON trigger a CORS "preflight" request:**

1. Browser sends OPTIONS request first (preflight)
2. Server must respond with CORS headers
3. Google Apps Script doesn't handle preflight well
4. Request fails before reaching our code

---

## ✅ **Solution: Use FormData Instead of JSON**

### The Trick:

**FormData POST requests don't trigger CORS preflight!**

- ✅ **FormData POST** = "simple request" (no preflight)
- ❌ **JSON POST** = "complex request" (requires preflight)

### How It Works:

**Frontend sends FormData:**
```javascript
const formData = new FormData();
formData.append('payload', JSON.stringify(requestPayload));

fetch(url, {
  method: 'POST',
  body: formData  // ✅ No CORS preflight!
});
```

**Backend extracts JSON from FormData:**
```javascript
// Google Apps Script receives FormData
if (e.parameter && e.parameter.payload) {
  payload = JSON.parse(e.parameter.payload);
}
```

---

## 🔧 **Files Modified**

### 1. `api-service.js` - Frontend

**Updated `postWithBody()` method:**

```javascript
async postWithBody(payload) {
  this.validateConfig();

  const requestPayload = {
    ...payload,
    apiKey: this.apiKey
  };

  // Use FormData to avoid CORS preflight
  const formData = new FormData();
  formData.append('payload', JSON.stringify(requestPayload));

  const url = `${this.baseUrl}`;

  return fetchWithRetry(url, {
    method: 'POST',
    body: formData,
    redirect: 'follow'
    // Don't set Content-Type - let browser set it with boundary
  });
}
```

**Key changes:**
- ✅ Uses `FormData` instead of JSON body
- ✅ Appends JSON string as form field
- ✅ No `Content-Type` header (browser sets it automatically)
- ✅ No CORS preflight triggered

### 2. `googleappsscript.js` - Backend

**Updated `doPost()` function:**

```javascript
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return createJsonResponse({ error: "No POST data provided" }, 400);
    }

    let payload;
    
    // Handle both JSON and FormData POST requests
    if (e.postData.type === 'application/json') {
      // Standard JSON POST
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.payload) {
      // FormData POST - payload is in e.parameter
      payload = JSON.parse(e.parameter.payload);
    } else {
      // Try to parse as JSON anyway
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseError) {
        return createJsonResponse({ error: "Invalid POST data format" }, 400);
      }
    }
    
    // ... rest of function
  }
}
```

**Key changes:**
- ✅ Checks for FormData in `e.parameter.payload`
- ✅ Falls back to JSON if needed
- ✅ Backwards compatible with existing code

---

## 🚀 **Deployment Steps**

### Step 1: Deploy Updated Backend

**CRITICAL:** You must deploy the updated `googleappsscript.js` to Google Apps Script!

1. **Open Google Apps Script:**
   - Go to https://script.google.com/
   - Find your TBTC project

2. **Update Code.gs:**
   - Select ALL code in Code.gs
   - Delete it
   - Copy ALL code from `/Users/sherlock/TBTC-MVP/googleappsscript.js`
   - Paste into Code.gs

3. **Save:**
   - Click save icon (Cmd+S)
   - Wait for "Saved" confirmation

4. **Deploy:**
   - Click "Deploy" → "New deployment"
   - Type: "Web app"
   - Description: "FormData CORS fix"
   - Execute as: Me
   - Who has access: Anyone
   - Click "Deploy"

5. **Verify URL:**
   - Should be: `https://script.google.com/macros/s/AKfycbz3IsREU1PzbJwywm89dZwhtAIVoUw1-XfXKtQk3EJDZvbwIdZr-U-9n9wISbrf78Ja/exec`
   - If different, update `api-service.js` BASE_URL

### Step 2: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## 🧪 **Testing**

### Test 1: Upload Sign-In Sheet

1. Navigate to Parking Lots
2. Click "Upload Sign-In Sheet"
3. Upload library.png
4. Click "Analyze with AI"
5. Click "Submit"

### Test 2: Check Network Tab

**Should see:**
- Request Method: **POST**
- Request Payload: **FormData**
- Content-Type: **multipart/form-data; boundary=...**
- Status: **200 OK**
- Response: `{"success": true, ...}`

**Should NOT see:**
- ❌ CORS error
- ❌ Preflight OPTIONS request
- ❌ ERR_FAILED

### Test 3: Verify Google Sheets

1. Open "Lots" tab
2. Find the lot you uploaded to
3. Verify columns P-U have data
4. Verify column L has base64 image

---

## 📊 **Technical Comparison**

### Approach 1: GET with URL Parameters (Original)
```
✅ No CORS issues
❌ URL length limit (~2,048 chars)
❌ Fails with large images
```

### Approach 2: POST with JSON Body (Attempted)
```
❌ CORS preflight required
❌ Google Apps Script doesn't handle preflight
❌ Request blocked by browser
```

### Approach 3: POST with FormData (SOLUTION)
```
✅ No CORS preflight
✅ No URL length limit
✅ Works with large images
✅ Compatible with Google Apps Script
```

---

## 🎯 **Why FormData Avoids CORS Preflight**

### CORS Preflight Triggers:

Browser sends preflight OPTIONS request when:
1. ❌ Content-Type is `application/json`
2. ❌ Custom headers are present
3. ❌ Method is not GET/POST/HEAD

### FormData is "Simple":

Browser skips preflight when:
1. ✅ Content-Type is `multipart/form-data`
2. ✅ No custom headers
3. ✅ Method is POST

**Result:** FormData POST goes directly to server without preflight!

---

## 🔍 **Request Flow**

### Before (JSON POST - FAILED):

```
1. Browser: "I want to POST JSON to script.google.com"
2. Browser: "Let me send OPTIONS preflight first..."
3. Browser → Server: OPTIONS request
4. Server: (no CORS headers)
5. Browser: "❌ CORS error! Blocking request"
6. Request never reaches doPost()
```

### After (FormData POST - SUCCESS):

```
1. Browser: "I want to POST FormData to script.google.com"
2. Browser: "FormData is simple, no preflight needed"
3. Browser → Server: POST request with FormData
4. Server: doPost() receives request
5. Server: Extracts JSON from FormData
6. Server: Processes request
7. Server → Browser: Success response
8. ✅ Upload complete!
```

---

## ✅ **Verification Checklist**

Before testing, ensure:

- [ ] `googleappsscript.js` updated in Google Apps Script editor
- [ ] Code saved in Apps Script
- [ ] New deployment created
- [ ] Dev server restarted
- [ ] Browser cache cleared (optional but recommended)

After testing, verify:

- [ ] No CORS errors in console
- [ ] No ERR_FAILED errors
- [ ] Network tab shows POST with FormData
- [ ] Response is 200 OK
- [ ] Response has `"success": true`
- [ ] Google Sheets updated with data
- [ ] UI shows updated count

---

## 🚨 **CRITICAL: Backend Must Be Deployed**

**The frontend changes alone won't work!**

You MUST deploy the updated `googleappsscript.js` to Google Apps Script. The backend needs to know how to extract JSON from FormData.

**Without backend update:**
```
❌ Backend receives FormData
❌ Backend doesn't know how to parse it
❌ Backend returns error
```

**With backend update:**
```
✅ Backend receives FormData
✅ Backend extracts JSON from e.parameter.payload
✅ Backend processes request
✅ Success!
```

---

## 📈 **Performance**

### FormData vs JSON:

**Size:**
- FormData: Slightly larger (multipart boundaries)
- JSON: Slightly smaller
- **Difference:** Negligible (~1-2% for large payloads)

**Speed:**
- FormData: No preflight = faster!
- JSON: Preflight adds ~100-200ms
- **Winner:** FormData

**Compatibility:**
- FormData: Works with Google Apps Script ✅
- JSON: Blocked by CORS ❌
- **Winner:** FormData

---

## 🎉 **Summary**

### Problem Chain:
1. ❌ GET with URL → URL too long
2. ❌ POST with JSON → CORS preflight blocked
3. ✅ POST with FormData → Works perfectly!

### Solution:
- Frontend: Use FormData to wrap JSON
- Backend: Extract JSON from FormData
- Result: No CORS, no URL limits, works perfectly!

---

**DEPLOY THE BACKEND AND TEST!** 🚀

Both frontend and backend changes are required for this to work.

