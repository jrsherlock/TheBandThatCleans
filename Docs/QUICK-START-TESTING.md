# Quick Start: Testing AI-Assisted Sign-In Sheet Upload

## 🚀 Ready to Test!

The AI-assisted sign-in sheet upload feature is now fully integrated into the frontend. Follow these steps to get it working end-to-end.

---

## ✅ Prerequisites Checklist

Before you can test the feature, you need to complete these setup steps:

### 1. Backend Deployment ⏳
- [ ] Copy `googleappsscript.js` to Google Apps Script editor (Code.gs)
- [ ] Deploy as Web App with "Anyone" access
- [ ] Copy the deployment URL
- [ ] Verify `api-service.js` has the correct `BASE_URL`

### 2. Gemini API Configuration ⏳
- [ ] Get API key from https://aistudio.google.com/app/apikey
- [ ] Create `.env` file in project root
- [ ] Add: `VITE_GEMINI_API_KEY=your_actual_api_key_here`
- [ ] Install package: `npm install @google/generative-ai`

### 3. Google Sheets Schema Update ⏳
Add 6 new columns to the "Lots" sheet:
- [ ] Column P: `aiStudentCount`
- [ ] Column Q: `aiConfidence`
- [ ] Column R: `aiAnalysisTimestamp`
- [ ] Column S: `countSource`
- [ ] Column T: `countEnteredBy`
- [ ] Column U: `manualCountOverride`

---

## 🧪 Testing Steps

### Step 1: Start the Development Server

```bash
cd /Users/sherlock/TBTC-MVP
npm run dev
```

Open your browser to `http://localhost:5173`

### Step 2: Log In as a Volunteer or Director

The feature is only visible to users with the `canUploadSignInSheets` permission:
- ✅ Admin/Director users
- ✅ Parent Volunteer users
- ❌ Student users

### Step 3: Navigate to Parking Lots Screen

1. Click "Parking Lots" in the navigation
2. You should see all parking lot cards
3. Each card should have a **green "Upload Sign-In Sheet" button**

### Step 4: Test the Upload Flow

#### Test 1: AI-Powered Upload (Recommended)

1. Click "Upload Sign-In Sheet" on any lot
2. Modal should open showing lot name and zone
3. Click the upload area or camera icon
4. Select the sample sign-in sheet image (the one you provided earlier)
5. Wait for compression (should show "Image ready (X KB)")
6. Click "Analyze with AI"
7. Wait for AI analysis (should take 2-5 seconds)
8. Verify AI result shows:
   - Student count (should be 11 for the sample image)
   - Confidence level (should be "high")
   - Notes about the analysis
9. Click "Submit"
10. Verify success notification appears
11. Verify modal closes
12. Verify lot card updates with new count

#### Test 2: Manual Entry (No Image)

1. Click "Upload Sign-In Sheet" on a different lot
2. Toggle "Use Manual Entry" at the top
3. Enter a student count (e.g., 8)
4. Add notes: "Manual count - no image available"
5. Click "Submit"
6. Verify success notification appears
7. Verify modal closes

#### Test 3: Manual Override of AI Count

1. Click "Upload Sign-In Sheet" on another lot
2. Upload an image
3. Click "Analyze with AI"
4. After AI analysis, toggle "Use Manual Entry"
5. Enter a different count than the AI suggested
6. Add notes: "AI said X, manually verified as Y"
7. Click "Submit"
8. Verify success notification appears

---

## 🔍 What to Verify

### Frontend Verification

✅ **Upload button appears** for authorized users
✅ **Upload button hidden** for student users
✅ **Modal opens** when button clicked
✅ **Image selection** works
✅ **Image compression** works (check file size in preview)
✅ **Image preview** displays correctly
✅ **AI analysis button** works (if Gemini configured)
✅ **AI result** displays with count, confidence, notes
✅ **Manual entry toggle** works
✅ **Manual override** works
✅ **Notes field** accepts input
✅ **Submit button** disabled when no count entered
✅ **Loading states** show during compression and analysis
✅ **Success notification** appears after submit
✅ **Modal closes** after successful submit
✅ **Lot card updates** with new count

### Backend Verification (Google Sheets)

After submitting an upload, check the Google Sheets "Lots" tab:

✅ **Column P (aiStudentCount)** - Should show the count
✅ **Column Q (aiConfidence)** - Should show "high", "medium", "low", or "manual"
✅ **Column R (aiAnalysisTimestamp)** - Should show timestamp
✅ **Column S (countSource)** - Should show "ai" or "manual"
✅ **Column T (countEnteredBy)** - Should show user's name
✅ **Column U (manualCountOverride)** - Should show override count (if applicable)
✅ **Column L (signUpSheetPhoto)** - Should show base64 image data
✅ **Column G (comment)** - Should have notes appended
✅ **Column H (lastUpdated)** - Should show current timestamp
✅ **Column I (updatedBy)** - Should show user's name

### Network Verification (Browser DevTools)

1. Open browser DevTools (F12)
2. Go to Network tab
3. Submit an upload
4. Look for the API request
5. Verify:
   - ✅ Request URL is correct
   - ✅ Request method is GET (with payload parameter)
   - ✅ Response status is 200
   - ✅ Response has `success: true`
   - ✅ Response includes lotId, studentCount, etc.

---

## 🐛 Common Issues & Solutions

### Issue: "Upload Sign-In Sheet" button not visible
**Cause**: User doesn't have permission
**Solution**: Make sure you're logged in as a Volunteer or Director, not a Student

### Issue: "AI analysis not configured"
**Cause**: Gemini API key not set or invalid
**Solution**: 
1. Check `.env` file exists in project root
2. Verify `VITE_GEMINI_API_KEY` is set correctly
3. Restart dev server after adding `.env`

### Issue: "Failed to upload sign-in sheet"
**Cause**: Backend not deployed or URL incorrect
**Solution**:
1. Verify `googleappsscript.js` is deployed to Google Apps Script
2. Check `api-service.js` has correct `BASE_URL`
3. Test the backend URL directly in browser

### Issue: Image compression fails
**Cause**: Browser doesn't support canvas API
**Solution**: Try a different browser (Chrome, Firefox, Safari)

### Issue: AI analysis takes too long
**Cause**: Large image or slow network
**Solution**: 
1. Check internet connection
2. Try with a smaller image
3. Use manual entry if timeout occurs

### Issue: Data doesn't appear in Google Sheets
**Cause**: Columns not added or backend handler not working
**Solution**:
1. Verify 6 new columns exist in Lots sheet
2. Check Google Apps Script logs for errors
3. Test backend with sample payload

---

## 📊 Sample Test Data

### Sample Payload for Backend Testing

You can test the backend directly by sending this payload:

```javascript
{
  "type": "UPLOAD_SIGNIN_SHEET",
  "lotId": "lot-1",
  "aiCount": 11,
  "aiConfidence": "high",
  "countSource": "ai",
  "enteredBy": "Test User",
  "notes": "Test upload from frontend",
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // truncated
}
```

### Expected Response

```javascript
{
  "success": true,
  "message": "Parking Lot Cleanup Sign-in sheet uploaded successfully",
  "lotId": "lot-1",
  "studentCount": 11,
  "countSource": "ai",
  "confidence": "high",
  "timestamp": "2024-10-12T12:34:56.789Z"
}
```

---

## 📸 Sample Sign-In Sheet Image

Use the image you provided earlier (Lot 55: Hancher Lot with 11 students) for testing.

Expected AI analysis result:
- **Count**: 11 students
- **Confidence**: High
- **Lot Identified**: Lot 55 / Hancher Lot
- **Notes**: Clear image, all names legible, lot info matches

---

## 🎯 Success Criteria

The feature is working correctly if:

✅ Upload button appears for authorized users
✅ Modal opens and closes properly
✅ Image upload and compression works
✅ AI analysis returns correct count (11 for sample image)
✅ Manual entry mode works
✅ Manual override works
✅ Submit succeeds without errors
✅ Success notification appears
✅ Data appears in Google Sheets
✅ Lot card updates with new count
✅ Data refresh works automatically

---

## 🔄 Next Steps After Testing

Once testing is complete:

1. **Commit the changes** to the `ai-assisted-checkins` branch
2. **Create a pull request** for review
3. **Deploy to production** after approval
4. **Train volunteers** on how to use the feature
5. **Monitor usage** during first cleanup event
6. **Gather feedback** and iterate

---

## 📞 Need Help?

If you encounter issues during testing:

1. Check the browser console for errors
2. Check the Network tab for failed requests
3. Check Google Apps Script logs for backend errors
4. Review the documentation files:
   - `Docs/AI-CHECKINS-INTEGRATION-COMPLETE.md`
   - `Docs/AI-CHECKINS-USER-GUIDE.md`
   - `API-PAYLOAD-REFERENCE.md`
   - `GOOGLE-APPS-SCRIPT-UPDATES.md`
   - `GEMINI-INTEGRATION-NEXT-STEPS.md`

---

## ✨ You're Ready to Test!

The frontend integration is complete. Once you complete the 3 prerequisite steps (backend deployment, Gemini configuration, Google Sheets update), you can start testing the full end-to-end workflow.

**Good luck!** 🚀

