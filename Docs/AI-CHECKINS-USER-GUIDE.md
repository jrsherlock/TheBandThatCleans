# AI-Assisted Student Check-Ins - User Guide

## 📱 For Parent Volunteers and Directors

This guide explains how to use the new AI-assisted sign-in sheet upload feature to quickly digitize physical sign-in sheets during parking lot cleanup events.

---

## 🎯 What This Feature Does

Instead of manually counting students from paper sign-in sheets, you can now:
1. **Take a photo** of the sign-in sheet with your phone
2. **Upload it** to the app
3. **Let AI count** the students automatically
4. **Review and submit** the count

The AI will analyze the image and tell you how many students signed in, with a confidence level (high/medium/low).

---

## 👥 Who Can Use This Feature

✅ **Directors (Admin users)** - Full access
✅ **Parent Volunteers** - Full access
❌ **Students** - Cannot access this feature

---

## 📸 Step-by-Step Instructions

### Step 1: Navigate to Parking Lots Screen
- Open the TBTC app
- Click on "Parking Lots" in the navigation menu
- You'll see all parking lot cards

### Step 2: Find the Lot You're Working On
- Scroll through the lot cards
- Find the lot you need to upload a sign-in sheet for
- Example: "Lot 55: Hancher Lot"

### Step 3: Click "Upload Sign-In Sheet"
- On the lot card, you'll see a **green button** that says "Upload Sign-In Sheet"
- Click this button
- A modal window will open

### Step 4: Take or Select a Photo
- Click the camera icon or "Click to upload" area
- Options:
  - **Take a photo** with your phone camera
  - **Select an existing photo** from your gallery
- Make sure the photo is clear and all names are visible

### Step 5: Wait for Compression
- The app will automatically compress the image
- You'll see a message: "Image ready (X KB)"
- A preview of your image will appear

### Step 6: Analyze with AI (Recommended)
- Click the **"Analyze with AI"** button
- Wait a few seconds while the AI analyzes the image
- The AI will show you:
  - **Student count** (e.g., "11 students")
  - **Confidence level** (High/Medium/Low)
  - **Notes** about the analysis

### Step 7: Review the Results

#### If Confidence is HIGH ✅
- The count is likely accurate
- You can submit as-is

#### If Confidence is MEDIUM ⚠️
- Double-check the count manually
- Override if needed

#### If Confidence is LOW ⚠️
- Manually count the students
- Use the manual override option

### Step 8: Manual Override (Optional)
- If the AI count is wrong, you can override it:
  - Toggle "Use Manual Entry"
  - Enter the correct count
  - The system will save both the AI count and your manual count

### Step 9: Add Notes (Optional)
- Add any additional information:
  - "Clear image, all names legible"
  - "Some names hard to read due to handwriting"
  - "Verified count manually - AI was correct"

### Step 10: Submit
- Click the **"Submit"** button
- You'll see a success message: "✅ Lot 55: 11 students recorded"
- The modal will close
- The lot card will update with the new count

---

## 🔄 Alternative: Manual Entry (No Photo)

If you don't have a photo or prefer to enter the count manually:

1. Click "Upload Sign-In Sheet"
2. Toggle **"Use Manual Entry"** at the top
3. Enter the student count
4. Add notes (optional)
5. Click "Submit"

---

## 💡 Tips for Best Results

### Taking Good Photos
✅ **Good lighting** - Take photos in well-lit areas
✅ **Steady hands** - Avoid blurry photos
✅ **Full sheet visible** - Capture the entire sign-in sheet
✅ **Straight angle** - Take photo from directly above
✅ **Clear text** - Make sure all names are readable

❌ **Avoid:**
- Blurry or out-of-focus images
- Photos taken at extreme angles
- Dark or poorly lit images
- Partial sheets (cut off names)

### When to Use Manual Override
- AI count doesn't match your manual count
- Low confidence result
- Handwriting is very messy
- Some names are crossed out or unclear

### When to Use Manual Entry (No Photo)
- No camera available
- Sign-in sheet is damaged or illegible
- Privacy concerns about uploading photos
- Faster to just count and enter

---

## 🎨 What You'll See

### Upload Button
```
┌─────────────────────────────────────┐
│  📤 Upload Sign-In Sheet            │
└─────────────────────────────────────┘
```
- **Color**: Green background
- **Location**: On each parking lot card
- **Visibility**: Only for volunteers and directors

### Modal Window
```
┌───────────────────────────────────────────┐
│  Upload Sign-In Sheet                  ✕  │
│  Lot 55: Hancher Lot • Zone 1 East       │
├───────────────────────────────────────────┤
│                                           │
│  [  Click to upload or drag and drop  ]  │
│     JPEG, PNG up to 10MB                  │
│                                           │
│  [ Analyze with AI ]                      │
│                                           │
│  AI Result:                               │
│  ✅ 11 students found (High confidence)   │
│                                           │
│  Notes: Clear image, all names legible   │
│                                           │
│  [ ] Use Manual Entry                     │
│                                           │
│  Additional Notes (optional):             │
│  [                                    ]   │
│                                           │
│  [Cancel]              [Submit]           │
└───────────────────────────────────────────┘
```

### Success Notification
```
┌─────────────────────────────────────┐
│  ✅ Lot 55: 11 students recorded 🤖 │
└─────────────────────────────────────┘
```
- **Icon**: ✅ for success
- **Robot emoji** 🤖 for AI-powered counts
- **Pencil emoji** ✍️ for manual entries

---

## ❓ Troubleshooting

### "AI analysis not configured"
- **Cause**: Gemini API key not set up
- **Solution**: Use manual entry mode instead
- **Contact**: Ask a director to configure the AI

### "Image file too large"
- **Cause**: Photo is over 10MB
- **Solution**: The app will automatically compress it, but if it fails, try taking a smaller photo

### "Failed to analyze image"
- **Cause**: Network error or AI service issue
- **Solution**: 
  1. Check your internet connection
  2. Try again
  3. Use manual entry if problem persists

### "Failed to upload sign-in sheet"
- **Cause**: Network error or backend issue
- **Solution**:
  1. Check your internet connection
  2. Try again
  3. Contact a director if problem persists

### AI count seems wrong
- **Solution**: Use manual override
  1. Toggle "Use Manual Entry"
  2. Enter the correct count
  3. Add a note explaining the discrepancy

---

## 📊 What Happens to the Data

When you submit a sign-in sheet upload:

1. **Image is saved** to Google Sheets (as base64)
2. **Student count is recorded** in the lot's data
3. **Your name is logged** as the person who submitted
4. **Timestamp is recorded** for when the upload happened
5. **Confidence level is saved** (if AI was used)
6. **Notes are appended** to the lot's comments

All this data is available to directors for review and reporting.

---

## 🔒 Privacy & Security

- **Images are stored securely** in Google Sheets
- **Only authorized users** can upload (volunteers and directors)
- **All uploads are logged** with user name and timestamp
- **Students cannot access** this feature
- **Data is only used** for attendance tracking

---

## 📞 Need Help?

If you encounter any issues:
1. Try refreshing the page
2. Check your internet connection
3. Try manual entry mode
4. Contact a director for assistance

---

## 🎉 Benefits of This Feature

✅ **Faster** - No need to manually count and type
✅ **More accurate** - AI reduces human counting errors
✅ **Convenient** - Upload from your phone on-site
✅ **Auditable** - Photos are saved for verification
✅ **Flexible** - Manual override always available
✅ **User-friendly** - Simple 3-step process

---

**Happy uploading!** 📸✨

This feature makes it easy to digitize sign-in sheets and keep accurate attendance records during cleanup events.

