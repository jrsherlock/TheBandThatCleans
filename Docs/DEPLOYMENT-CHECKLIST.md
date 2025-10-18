# 🚀 TBTC Deployment Checklist - CORS Fix & Drive Storage

**Follow this checklist step-by-step. Check off each item as you complete it.**

---

## ⏱️ **Estimated Time: 10 minutes**

---

## 📋 **Pre-Deployment Checklist**

- [ ] I have access to the Google Apps Script project
- [ ] I have access to the Google Sheet (ID: 1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys)
- [ ] I have the updated Code.gs file at `/Users/sherlock/TBTC-MVP/Code.gs`
- [ ] I have the api-service.js file at `/Users/sherlock/TBTC-MVP/api-service.js`
- [ ] I have the test file at `/Users/sherlock/TBTC-MVP/test-cors-fix.html`

---

## 🔧 **Part 1: Deploy Backend (5 minutes)**

### **Step 1.1: Open Google Apps Script**
- [ ] Go to https://script.google.com/
- [ ] Find the TBTC project in "My Projects"
- [ ] OR: Open your Google Sheet → Extensions → Apps Script
- [ ] Verify you see the Code.gs file

### **Step 1.2: Backup Current Code (Optional but Recommended)**
- [ ] Select ALL code in Code.gs (Cmd+A or Ctrl+A)
- [ ] Copy it
- [ ] Paste into a text file named `Code.gs.backup`
- [ ] Save the backup file somewhere safe

### **Step 1.3: Replace Code**
- [ ] Open `/Users/sherlock/TBTC-MVP/Code.gs` in a text editor
- [ ] Select ALL code (Cmd+A or Ctrl+A)
- [ ] Copy it
- [ ] Go back to Google Apps Script
- [ ] Select ALL code in Code.gs (Cmd+A or Ctrl+A)
- [ ] Delete it
- [ ] Paste the new code
- [ ] Click Save (💾 icon or Cmd+S)
- [ ] Wait for "Saved" confirmation

### **Step 1.4: Create New Deployment**

**CRITICAL: You MUST create a NEW deployment, not update existing!**

- [ ] Click **Deploy** button (top right)
- [ ] Click **New deployment** (NOT "Manage deployments")
- [ ] Click the gear icon ⚙️ next to "Select type"
- [ ] Choose **Web app**
- [ ] Fill in the form:
  - Description: `CORS fix + Drive storage - [today's date]`
  - Execute as: **Me (your email)**
  - Who has access: **Anyone**
- [ ] Click **Deploy**

### **Step 1.5: Authorize Permissions**

**You'll be asked to authorize new permissions for Google Drive:**

- [ ] Click **Authorize access**
- [ ] Choose your Google account
- [ ] You may see "Google hasn't verified this app" - this is normal
- [ ] Click **Advanced**
- [ ] Click **Go to [Your Project Name] (unsafe)**
- [ ] Review permissions:
  - ✅ View and manage Google Drive files
  - ✅ View and manage spreadsheets
- [ ] Click **Allow**

### **Step 1.6: Copy Deployment URL**
- [ ] After authorization, you'll see "Deployment successfully created"
- [ ] **COPY THE WEB APP URL** - it looks like:
  ```
  https://script.google.com/macros/s/AKfycby.../exec
  ```
- [ ] Paste it somewhere safe (you'll need it in the next step)
- [ ] Click **Done**

**✅ Backend deployment complete!**

---

## 💻 **Part 2: Update Frontend (2 minutes)**

### **Step 2.1: Update API Configuration**
- [ ] Open `/Users/sherlock/TBTC-MVP/api-service.js` in your code editor
- [ ] Find line 9 (the BASE_URL line)
- [ ] Replace the URL with your NEW deployment URL from Step 1.6
- [ ] It should look like:
  ```javascript
  BASE_URL: 'https://script.google.com/macros/s/AKfycby.../exec',
  ```
- [ ] Save the file (Cmd+S or Ctrl+S)

**✅ Frontend configuration complete!**

---

## 🧪 **Part 3: Test Deployment (3 minutes)**

### **Step 3.1: Open Test Page**
- [ ] Open `/Users/sherlock/TBTC-MVP/test-cors-fix.html` in a web browser
- [ ] Paste your deployment URL into the input field at the top
- [ ] The URL should already be there if you updated api-service.js

### **Step 3.2: Run Test 1 - GET Request**
- [ ] Click "Run GET Test" button
- [ ] Wait for result
- [ ] **Expected:** Green success message showing lots and students found
- [ ] **If failed:** Check that the URL is correct and the script is deployed

### **Step 3.3: Run Test 2 - POST Request (CORS Test)**
- [ ] Click "Run POST Test" button
- [ ] Wait for result
- [ ] **Expected:** Green success message with response data
- [ ] **If failed:** CORS headers are not set - redeploy backend

### **Step 3.4: Run Test 3 - Image Upload (Drive Test)**
- [ ] Click "Choose File" and select any image (JPG, PNG, etc.)
- [ ] Enter a test lot ID (e.g., "TEST1")
- [ ] Click "Upload Image" button
- [ ] Wait for result (may take 5-10 seconds)
- [ ] **Expected:** Green success message with Drive file info
- [ ] **Expected:** Image displays below the result
- [ ] **If failed:** Check Drive permissions were authorized

### **Step 3.5: Verify Drive Upload**
- [ ] Open Google Drive (https://drive.google.com)
- [ ] Look for a folder named "TBTC Sign-In Sheets"
- [ ] Open the folder
- [ ] **Expected:** See the uploaded image file
- [ ] **Expected:** File name like `signin_sheet_TEST1_1234567890.jpg`

### **Step 3.6: Run Test 4 - Fetch Data**
- [ ] Click "Fetch Lot Data" button
- [ ] Wait for result
- [ ] **Expected:** Green success message showing lots with Drive URLs
- [ ] **Expected:** See the TEST1 lot with its Drive image URL

**✅ All tests passed? Deployment successful!**

---

## 🎯 **Part 4: Test in Your App (Optional)**

### **Step 4.1: Start Your App**
- [ ] Start your development server (e.g., `npm start`)
- [ ] Open the app in browser (usually http://localhost:3000)
- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab

### **Step 4.2: Upload Sign-In Sheet**
- [ ] Navigate to the sign-in sheet upload feature
- [ ] Select a lot (e.g., A1)
- [ ] Upload an image
- [ ] Let Gemini analyze it
- [ ] Submit the upload

### **Step 4.3: Verify Success**
- [ ] **Check Console:** No CORS errors
- [ ] **Check Network Tab:** POST request shows 200 OK
- [ ] **Check Response:** Includes `imageUpload` object with Drive URLs
- [ ] **Check Drive:** Image appears in "TBTC Sign-In Sheets" folder
- [ ] **Check Sheet:** signUpSheetPhoto column shows Drive URL (not base64)
- [ ] **Check App:** Image displays correctly (if you've implemented display)

**✅ App integration successful!**

---

## 📊 **Verification Checklist**

After deployment, verify these conditions:

### **Backend:**
- [ ] New deployment created in Apps Script
- [ ] Drive permissions authorized
- [ ] Deployment URL copied and saved

### **Frontend:**
- [ ] api-service.js updated with new URL
- [ ] File saved

### **CORS:**
- [ ] No CORS errors in browser console
- [ ] POST requests succeed
- [ ] Test 2 passes in test-cors-fix.html

### **Drive Storage:**
- [ ] Folder "TBTC Sign-In Sheets" exists in Drive
- [ ] Images upload successfully
- [ ] Images are viewable in Drive
- [ ] Test 3 passes in test-cors-fix.html

### **Data Storage:**
- [ ] Spreadsheet shows Drive URLs (not base64)
- [ ] URLs format: https://drive.google.com/uc?export=view&id=...
- [ ] Test 4 passes in test-cors-fix.html

---

## ❌ **Troubleshooting**

### **Problem: Test 1 fails (GET request)**
**Possible causes:**
- [ ] Wrong deployment URL
- [ ] Script not deployed
- [ ] Spreadsheet ID incorrect

**Solutions:**
1. Verify the deployment URL is correct
2. Check that you clicked "Deploy" (not just "Save")
3. Try accessing the URL directly in browser

---

### **Problem: Test 2 fails (POST/CORS)**
**Possible causes:**
- [ ] Didn't create NEW deployment
- [ ] Old deployment URL being used
- [ ] Code.gs not updated

**Solutions:**
1. Create a NEW deployment (not update existing)
2. Copy the NEW deployment URL
3. Update api-service.js with NEW URL
4. Verify Code.gs has the updated createJsonResponse function

---

### **Problem: Test 3 fails (Drive upload)**
**Possible causes:**
- [ ] Drive permissions not authorized
- [ ] Image too large
- [ ] Network timeout

**Solutions:**
1. In Apps Script, run function `getOrCreateImageFolder` manually
2. Authorize permissions when prompted
3. Try with a smaller image (<1MB)
4. Check Apps Script logs (View → Logs)

---

### **Problem: Drive folder not created**
**Possible causes:**
- [ ] AUTO_CREATE_FOLDER is false
- [ ] Permissions not granted

**Solutions:**
1. Manually create folder "TBTC Sign-In Sheets" in Drive
2. Or run `getOrCreateImageFolder` function in Apps Script
3. Authorize permissions

---

### **Problem: Image URL doesn't work**
**Possible causes:**
- [ ] File sharing not set correctly
- [ ] File was deleted

**Solutions:**
1. Open the file in Drive
2. Right-click → Share
3. Change to "Anyone with the link"
4. Set permission to "Viewer"

---

## 🎉 **Success Indicators**

You'll know everything is working when:

1. ✅ All 4 tests in test-cors-fix.html pass
2. ✅ No CORS errors in browser console
3. ✅ Images appear in Drive folder
4. ✅ Spreadsheet shows Drive URLs
5. ✅ Images display in app (if implemented)
6. ✅ Upload response includes imageUpload object

---

## 📝 **Post-Deployment Notes**

### **Record These Details:**

**Deployment Information:**
- Deployment Date: _______________
- Deployment URL: _______________
- Apps Script Project ID: _______________
- Drive Folder ID: _______________

**Test Results:**
- Test 1 (GET): ☐ Pass ☐ Fail
- Test 2 (POST/CORS): ☐ Pass ☐ Fail
- Test 3 (Drive Upload): ☐ Pass ☐ Fail
- Test 4 (Fetch Data): ☐ Pass ☐ Fail

**Notes:**
_______________________________________
_______________________________________
_______________________________________

---

## 🔄 **Rollback Plan (If Needed)**

If something goes wrong and you need to rollback:

1. [ ] Go to Apps Script
2. [ ] Click Deploy → Manage deployments
3. [ ] Find your previous working deployment
4. [ ] Click the pencil icon to edit
5. [ ] Copy the old deployment URL
6. [ ] Update api-service.js with the old URL
7. [ ] Or restore Code.gs from your backup file

---

## 📞 **Need Help?**

If you're stuck:

1. Check the troubleshooting section above
2. Review `SOLUTION-SUMMARY.md` for technical details
3. Check Apps Script logs: View → Logs
4. Check browser console for error messages
5. Verify all checklist items are completed

---

**Ready? Start with Part 1!** 🚀

**Remember: Create a NEW deployment, don't update existing!**

