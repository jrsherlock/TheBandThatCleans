# 🚀 AI-Assisted Check-Ins: Next Steps to Hook Up Gemini

## ✅ What's Been Done

The feature branch `ai-assisted-checkins` has been created with the following foundation:

### Files Created:
1. **Documentation** (in `Docs/` folder):
   - `AI-ASSISTED-CHECKINS-IMPLEMENTATION-GUIDE.md` - Technical implementation details
   - `AI-CHECKINS-SETUP-STEPS.md` - Step-by-step setup guide
   - `AI-CHECKINS-FEATURE-SUMMARY.md` - Feature overview

2. **Core Services**:
   - `src/services/geminiService.js` - Gemini API integration
   - `src/utils/imageCompression.js` - Image processing utilities

3. **UI Components**:
   - `src/components/SignInSheetUpload/SignInSheetUploadModal.jsx` - Upload modal

4. **Configuration**:
   - `.env.example` - Environment variable template

---

## 🎯 What You Need to Do Next

### Step 1: Get Your Gemini API Key (5 minutes)

1. Visit: **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select **"Create API key in new project"** (or use existing)
5. **Copy the API key** (you'll need it in the next step)

⚠️ **IMPORTANT**: Keep this key secure! Never commit it to git.

---

### Step 2: Configure Environment Variables (2 minutes)

1. In your project root (`/Users/sherlock/TBTC-MVP`), create a file named `.env`:

```bash
# Create .env file
touch .env
```

2. Open `.env` and add your API key:

```env
VITE_GEMINI_API_KEY=YOUR_ACTUAL_API_KEY_HERE
VITE_GEMINI_MODEL=gemini-1.5-flash
```

3. Replace `YOUR_ACTUAL_API_KEY_HERE` with the key you copied in Step 1

4. Save the file

5. Verify `.env` is in `.gitignore` (it should already be there)

---

### Step 3: Install Dependencies (1 minute)

Run this command in your terminal:

```bash
npm install @google/generative-ai
```

This installs the Google Generative AI SDK needed for Gemini integration.

---

### Step 4: Update Google Sheets Schema (5 minutes)

1. Open your Google Sheet:
   https://docs.google.com/spreadsheets/d/1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys

2. Go to the **"Lots"** sheet tab

3. Add these new columns (after column O):

| Column | Header Name | Description |
|--------|-------------|-------------|
| P | aiStudentCount | Student count from AI |
| Q | aiConfidence | high/medium/low |
| R | aiAnalysisTimestamp | When AI ran |
| S | countSource | "ai" or "manual" |
| T | countEnteredBy | User who submitted |
| U | manualCountOverride | Manual override value |

4. Format the header row:
   - Make text **bold**
   - Set background color to **light blue** (#E8F0FE)
   - Enable **text wrapping**

---

### Step 5: Update Google Apps Script Backend (10 minutes)

1. In your Google Sheet, go to: **Extensions → Apps Script**

2. Open the `Code.gs` file

3. Find the `SHEETS` constant (around line 15) and update it:

```javascript
const SHEETS = {
  LOTS: {
    name: "Lots",
    headers: [
      "id", "name", "status", "zone", "priority",
      "totalStudentsSignedUp", "comment", "lastUpdated", "updatedBy",
      "actualStartTime", "completedTime", "signUpSheetPhoto",
      "polygonCoordinates", "centerLatitude", "centerLongitude",
      // NEW FIELDS FOR AI CHECK-INS
      "aiStudentCount",
      "aiConfidence",
      "aiAnalysisTimestamp",
      "countSource",
      "countEnteredBy",
      "manualCountOverride"
    ]
  },
  // ... rest stays the same
};
```

4. Add this new handler function (paste at the end of the file, before `setupSheets()`):

```javascript
/**
 * Handle sign-in sheet upload with AI-generated count
 */
function handleSignInSheetUpload() {
  try {
    const payload = JSON.parse(e.parameter.payload);
    const { 
      lotId, 
      imageData, 
      aiCount, 
      aiConfidence, 
      countSource, 
      enteredBy,
      notes 
    } = payload;
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.LOTS.name);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indices
    const idIndex = headers.indexOf("id");
    const photoIndex = headers.indexOf("signUpSheetPhoto");
    const aiCountIndex = headers.indexOf("aiStudentCount");
    const aiConfidenceIndex = headers.indexOf("aiConfidence");
    const aiTimestampIndex = headers.indexOf("aiAnalysisTimestamp");
    const countSourceIndex = headers.indexOf("countSource");
    const enteredByIndex = headers.indexOf("countEnteredBy");
    const commentIndex = headers.indexOf("comment");
    const lastUpdatedIndex = headers.indexOf("lastUpdated");
    
    // Find and update lot row
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIndex]) === String(lotId)) {
        data[i][photoIndex] = imageData;
        data[i][aiCountIndex] = aiCount;
        data[i][aiConfidenceIndex] = aiConfidence;
        data[i][aiTimestampIndex] = new Date().toISOString();
        data[i][countSourceIndex] = countSource;
        data[i][enteredByIndex] = enteredBy;
        if (notes) {
          data[i][commentIndex] = notes;
        }
        data[i][lastUpdatedIndex] = new Date().toISOString();
        
        sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
        
        return createJsonResponse({ 
          success: true, 
          message: 'Sign-in sheet uploaded successfully',
          lotId: lotId,
          aiCount: aiCount
        });
      }
    }
    
    return createJsonResponse({ error: 'Lot not found' }, 404);
    
  } catch (error) {
    logError("handleSignInSheetUpload", error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}
```

5. Update the `doGet` function to include the new action:

Find this section:
```javascript
function doGet(e) {
  const action = e.parameter.action;
  
  switch (action) {
    case 'getData':
      return handleGetData();
    case 'report':
      return handleGetReport();
    case 'getEventConfig':
      return handleGetEventConfig();
    // ADD THIS LINE:
    case 'uploadSignInSheet':
      return handleSignInSheetUpload();
    default:
      return createJsonResponse({ error: 'Invalid action' }, 400);
  }
}
```

6. **Deploy the updated script**:
   - Click **Deploy** → **New deployment**
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**
   - Copy the deployment URL (if it changed, update `api-service.js`)

---

### Step 6: Test the Setup (5 minutes)

1. Start your development server:
```bash
npm run dev
```

2. Open the browser console (F12)

3. Look for this message:
```
✅ Gemini API configured
```

If you see a warning instead, double-check your `.env` file.

4. Try uploading a test image (you can use the sample image from the feature requirements)

---

## 🧪 Testing Checklist

Before considering the feature complete:

- [ ] Gemini API key obtained and configured in `.env`
- [ ] Dependencies installed (`@google/generative-ai`)
- [ ] Google Sheets has new columns (P through U)
- [ ] Apps Script updated with new handler
- [ ] Apps Script deployed successfully
- [ ] Dev server starts without errors
- [ ] Console shows "Gemini API configured"
- [ ] Can upload test image
- [ ] AI analysis returns results
- [ ] Manual entry works as fallback
- [ ] Data saves to Google Sheets correctly

---

## 📁 File Locations Reference

```
TBTC-MVP/
├── .env                          # CREATE THIS - Your API key goes here
├── .env.example                  # Template (already created)
├── src/
│   ├── services/
│   │   └── geminiService.js      # Gemini API integration (created)
│   ├── utils/
│   │   └── imageCompression.js   # Image utilities (created)
│   └── components/
│       └── SignInSheetUpload/
│           └── SignInSheetUploadModal.jsx  # Upload UI (created)
└── Docs/
    ├── AI-ASSISTED-CHECKINS-IMPLEMENTATION-GUIDE.md  # Technical guide
    ├── AI-CHECKINS-SETUP-STEPS.md                    # Setup steps
    └── AI-CHECKINS-FEATURE-SUMMARY.md                # Feature overview
```

---

## 🔍 Troubleshooting

### "Gemini API not configured"
- Check `.env` file exists in project root
- Verify `VITE_GEMINI_API_KEY` is set correctly
- Restart dev server after changing `.env`

### "Failed to analyze image"
- Verify API key is valid (test at https://aistudio.google.com)
- Check image file size < 5MB
- Ensure internet connection is working
- Check browser console for detailed error

### "Quota exceeded"
- Gemini free tier has limits
- Wait a few minutes and try again
- Consider upgrading API plan if needed

### Image upload fails
- Verify Google Sheets has new columns
- Check Apps Script is deployed
- Review Apps Script execution logs
- Verify API service URL is correct

---

## 📞 Need Help?

1. Check the detailed guides in `Docs/` folder
2. Review browser console for errors
3. Check Apps Script execution logs (View → Logs)
4. Verify all setup steps completed

---

## 🎉 Once Setup is Complete

After completing all steps above, you'll be ready to:

1. **Integrate the upload modal** into ParkingLotsScreen
2. **Test with real sign-in sheet photos**
3. **Train users** on the new feature
4. **Monitor AI accuracy** and gather feedback
5. **Iterate and improve** based on usage

---

## 📝 Commit Your Work

Once you've verified everything works, commit your changes:

```bash
# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "feat: Complete AI-assisted check-ins setup

- Configure Gemini API integration
- Update Google Sheets schema
- Deploy Apps Script handlers
- Test AI analysis functionality"

# Push to remote
git push origin ai-assisted-checkins
```

---

## 🚀 Ready to Go!

You now have everything you need to hook up Gemini to your TBTC application!

**Start with Step 1** above and work through each step in order.

Good luck! 🎺🧹

