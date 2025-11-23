# Google Apps Script Deployment Guide

## 📋 Instructions for Copying Code to Google Apps Script

Follow these steps to update your Google Apps Script project with the latest code from your local repository.

---

## Step 1: Open Your Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com/)
2. Sign in with your Google account
3. Open your existing project (or create a new one if needed)
   - If you don't have the project URL, you can find it in your Google Sheet:
     - Open your Google Sheet: https://docs.google.com/spreadsheets/d/1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys
     - Go to **Extensions** → **Apps Script**

---

## Step 2: Clear Existing Code

1. In the Apps Script editor, select **ALL** the existing code in the editor (Ctrl+A / Cmd+A)
2. **Delete** it (Backspace or Delete key)
3. This ensures you're starting with a clean slate

---

## Step 3: Copy the Code from Your Local File

### Option A: Copy from Code.gs (Recommended - Full Version)

1. Open the file `Code.gs` in your local project:
   ```
   /Users/sherlock/TBTC-MVP/Code.gs
   ```

2. Select **ALL** the code (Ctrl+A / Cmd+A)

3. Copy it (Ctrl+C / Cmd+C)

4. Go back to the Google Apps Script editor

5. Paste the code (Ctrl+V / Cmd+V)

### Option B: Copy from Terminal (Quick Method)

If you're comfortable with terminal, you can copy directly:

```bash
# Copy Code.gs to clipboard (macOS)
cat Code.gs | pbcopy

# Or view the file first
cat Code.gs
```

Then paste into Google Apps Script editor.

---

## Step 4: Verify the Code

1. Check that the code pasted correctly:
   - Look for the `SPREADSHEET_ID` constant at the top
   - Verify it matches: `"1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys"`
   - Check that all functions are present (doGet, doPost, handleGetData, etc.)

2. Look for any syntax errors (red underlines in the editor)

---

## Step 5: Save the Script

1. Click **File** → **Save** (or Ctrl+S / Cmd+S)
2. Give it a name if prompted (e.g., "TBTC Backend API")

---

## Step 6: Deploy as Web App

### First Time Deployment:

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description**: "TBTC API - Updated [Date]"
   - **Execute as**: "Me" (your account)
   - **Who has access**: "Anyone" (important for CORS!)
5. Click **Deploy**
6. **Copy the Web App URL** - you'll need this for your frontend!

### Updating Existing Deployment:

1. Click **Deploy** → **Manage deployments**
2. Click the **pencil icon** ✏️ next to your active deployment
3. Click **New version**
4. Add a description (e.g., "Updated with latest changes")
5. Click **Deploy**
6. **Important**: The URL stays the same - no need to update your frontend!

---

## Step 7: Update Frontend API URL (If New Deployment)

If this is a **new deployment** (not an update), you need to update your frontend:

1. Copy the new Web App URL from the deployment dialog
2. Open `api-service.js` in your local project
3. Update the `BASE_URL` in `API_CONFIG`:

```javascript
const API_CONFIG = {
  BASE_URL: 'YOUR_NEW_WEB_APP_URL_HERE',
  // ... rest of config
};
```

4. Save and redeploy your frontend (Vercel will auto-deploy if connected to GitHub)

---

## Step 8: Test the Deployment

1. Test the API endpoint directly in your browser:
   ```
   https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=data&apiKey=tbtc-director-key-2024
   ```

2. You should see JSON data with `lots` and `students` arrays

3. If you get an error, check:
   - The Web App is deployed with "Anyone" access
   - The API key matches (`tbtc-director-key-2024`)
   - The spreadsheet ID is correct

---

## 🔧 Troubleshooting

### Error: "Authorization required"
- Make sure the Web App is deployed with "Anyone" access
- Check that you clicked "Deploy" after making changes

### Error: "Spreadsheet not found"
- Verify `SPREADSHEET_ID` matches your actual Google Sheet ID
- Make sure you have access to the spreadsheet

### Error: "Function not found"
- Make sure you copied ALL the code from `Code.gs`
- Check that function names match exactly (case-sensitive)

### Changes Not Reflecting
- **Important**: After updating code, you MUST create a new deployment version
- Just saving the script is NOT enough - you need to deploy!

---

## 📝 Quick Reference

**File to Copy:** `Code.gs` (from your local project)

**Location:** `/Users/sherlock/TBTC-MVP/Code.gs`

**Current Spreadsheet ID:** `1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys`

**API Key:** `tbtc-director-key-2024`

**Current Deployment URL:** (Check in your Apps Script project under Deploy → Manage deployments)

---

## ✅ Checklist

- [ ] Opened Google Apps Script project
- [ ] Cleared old code
- [ ] Copied all code from `Code.gs`
- [ ] Saved the script
- [ ] Created new deployment version (or new deployment)
- [ ] Set "Anyone" access
- [ ] Copied new Web App URL (if new deployment)
- [ ] Updated `api-service.js` with new URL (if needed)
- [ ] Tested API endpoint in browser
- [ ] Verified frontend can connect

---

## 🚀 Next Steps After Deployment

1. Test the API endpoints from your frontend
2. Verify sign-in sheet uploads work
3. Check that student check-ins are recording correctly
4. Monitor the Apps Script execution logs for any errors

---

**Need Help?** Check the execution logs in Apps Script: **View** → **Logs**

