# AI-Assisted Check-Ins: Setup Steps

## 🚀 Quick Start Guide

Follow these steps to get the AI-assisted check-in feature up and running.

---

## Step 1: Get Google Gemini API Key

### 1.1 Visit Google AI Studio
Go to: https://aistudio.google.com/app/apikey

### 1.2 Create API Key
1. Sign in with your Google account
2. Click "Create API Key"
3. Select "Create API key in new project" (or use existing project)
4. Copy the generated API key

**⚠️ IMPORTANT**: Keep this key secure! Never commit it to git.

---

## Step 2: Configure Environment Variables

### 2.1 Create `.env` File
In the project root directory, create a file named `.env`:

```bash
# Copy the example file
cp .env.example .env
```

### 2.2 Add Your API Key
Edit `.env` and replace the placeholder:

```env
VITE_GEMINI_API_KEY=YOUR_ACTUAL_API_KEY_HERE
VITE_GEMINI_MODEL=gemini-1.5-flash
```

### 2.3 Verify `.gitignore`
Make sure `.env` is in your `.gitignore` file (it should already be there):

```
# .gitignore
.env
.env.local
```

---

## Step 3: Install Dependencies

### 3.1 Install Google Generative AI SDK
```bash
npm install @google/generative-ai
```

### 3.2 Verify Installation
Check that the package was added to `package.json`:

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.1.0",
    // ... other dependencies
  }
}
```

---

## Step 4: Update Google Sheets Schema

### 4.1 Open Your Google Sheet
Open the TBTC Google Sheet:
https://docs.google.com/spreadsheets/d/1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys

### 4.2 Add New Columns to "Lots" Sheet
Add these columns after the existing ones (after column O):

| Column | Header Name | Description |
|--------|-------------|-------------|
| P | aiStudentCount | Student count from AI analysis |
| Q | aiConfidence | AI confidence level (high/medium/low) |
| R | aiAnalysisTimestamp | When AI analysis was performed |
| S | countSource | Source of count ("ai" or "manual") |
| T | countEnteredBy | User who uploaded/entered count |
| U | manualCountOverride | Manual override if AI was incorrect |

### 4.3 Format Headers
1. Select row 1 (header row)
2. Make text bold
3. Set background color to light blue (#E8F0FE)
4. Enable text wrapping

---

## Step 5: Update Google Apps Script Backend

### 5.1 Open Apps Script Editor
1. In your Google Sheet, go to: Extensions → Apps Script
2. Open the `Code.gs` file

### 5.2 Update SHEETS Configuration
Find the `SHEETS` constant and update the `LOTS` headers array:

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
  // ... rest of configuration
};
```

### 5.3 Add New Handler Function
Add this new function to handle sign-in sheet uploads:

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

### 5.4 Update doGet Handler
Add the new action to the `doGet` function:

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
    case 'uploadSignInSheet':  // NEW ACTION
      return handleSignInSheetUpload();
    default:
      return createJsonResponse({ error: 'Invalid action' }, 400);
  }
}
```

### 5.5 Deploy Updated Script
1. Click "Deploy" → "New deployment"
2. Select type: "Web app"
3. Execute as: "Me"
4. Who has access: "Anyone"
5. Click "Deploy"
6. Copy the new deployment URL (if it changed)

---

## Step 6: Update API Service (Frontend)

### 6.1 Add Upload Method to api-service.js
Open `api-service.js` and add this method to the `ApiService` class:

```javascript
/**
 * Upload sign-in sheet with AI analysis
 */
async uploadSignInSheet(lotId, imageData, aiAnalysis, enteredBy, notes = '') {
  try {
    const payload = {
      action: 'uploadSignInSheet',
      lotId: lotId,
      imageData: imageData,
      aiCount: aiAnalysis.count,
      aiConfidence: aiAnalysis.confidence,
      countSource: aiAnalysis.source || 'ai',
      enteredBy: enteredBy,
      notes: notes
    };

    return await this.post(payload);
  } catch (error) {
    console.error('Failed to upload sign-in sheet:', error);
    throw new ApiError('Failed to upload sign-in sheet. Please try again.', 500);
  }
}
```

---

## Step 7: Test the Setup

### 7.1 Start Development Server
```bash
npm run dev
```

### 7.2 Check Console for Gemini Status
Open browser console and look for:
```
✅ Gemini API configured
```

If you see a warning, check your `.env` file.

### 7.3 Test Image Upload
1. Navigate to Parking Lots screen
2. Click on a lot card
3. Look for "Upload Sign-In Sheet" button
4. Upload a test image
5. Verify AI analysis runs

---

## Step 8: Prepare Test Images

### 8.1 Create Test Sign-In Sheet
Use the provided sample image in the feature requirements, or create a test sheet with:
- Lot identification header
- Student name column
- Time in/out columns
- 5-10 sample student names

### 8.2 Take Photo
- Use good lighting
- Keep sheet flat
- Ensure text is readable
- Photo should be clear and in focus

---

## 🔍 Troubleshooting

### Issue: "Gemini API not configured"
**Solution**: 
- Check `.env` file exists in project root
- Verify `VITE_GEMINI_API_KEY` is set
- Restart dev server after changing `.env`

### Issue: "Failed to analyze image"
**Solution**:
- Check API key is valid
- Verify image file size < 5MB
- Check internet connection
- Review browser console for detailed error

### Issue: "Quota exceeded"
**Solution**:
- Gemini has free tier limits
- Wait a few minutes and try again
- Consider upgrading API plan if needed

### Issue: Image upload fails
**Solution**:
- Check Google Sheets has new columns
- Verify Apps Script is deployed
- Check API service URL is correct
- Review Apps Script execution logs

---

## ✅ Verification Checklist

Before proceeding to full implementation:

- [ ] Gemini API key obtained and configured
- [ ] `.env` file created with API key
- [ ] Dependencies installed (`@google/generative-ai`)
- [ ] Google Sheets columns added
- [ ] Apps Script updated and deployed
- [ ] API service method added
- [ ] Dev server starts without errors
- [ ] Console shows Gemini configured
- [ ] Test image can be uploaded
- [ ] AI analysis returns results

---

## 📚 Next Steps

Once setup is complete:
1. Review the full implementation guide: `AI-ASSISTED-CHECKINS-IMPLEMENTATION-GUIDE.md`
2. Integrate upload modal into ParkingLotsScreen
3. Add permission checks for volunteers vs admins
4. Test with real sign-in sheet photos
5. Gather user feedback and iterate

---

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Check Apps Script execution logs
4. Verify all setup steps were completed
5. Test with a simple image first

---

**Ready to proceed?** Once all checklist items are complete, you can start integrating the upload modal into the UI!

