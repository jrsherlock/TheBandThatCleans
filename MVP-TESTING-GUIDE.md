# MVP Testing Guide

## Quick Start Testing for Hybrid Paper/Digital Workflow

---

## 🎯 Testing Objectives

1. Verify image upload functionality works correctly
2. Validate OCR processing extracts student counts accurately
3. Ensure student counts update in real-time across all views
4. Confirm error handling and user feedback
5. Test with various image qualities and formats

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path - Upload Clear Image

**Steps:**
1. Open TBTC app as Director
2. Navigate to "Parking Lots" tab
3. Click "Edit Details" on any lot
4. Click "Upload & Process Photo" button
5. Upload a clear photo of a sign-in sheet with 10 student names
6. Wait for OCR processing (5-10 seconds)
7. Verify student count shows "10"
8. Click "Save"
9. Verify lot card shows updated student count

**Expected Results:**
- ✅ Image uploads successfully
- ✅ OCR processes without errors
- ✅ Student count extracted correctly (10)
- ✅ Count updates in lot edit modal
- ✅ Count persists after saving
- ✅ Count visible in lot card
- ✅ Success toast notification appears

---

### Scenario 2: Poor Quality Image

**Steps:**
1. Upload a blurry or low-resolution image
2. Wait for OCR processing
3. Check extracted student count

**Expected Results:**
- ✅ Image uploads successfully
- ✅ OCR processes (may take longer)
- ⚠️ Student count may be inaccurate
- ✅ Manual override option available
- ✅ User can correct count manually

**Action:**
- Manually adjust student count if OCR is incorrect
- Save with corrected count

---

### Scenario 3: Invalid File Type

**Steps:**
1. Try to upload a PDF or text file
2. Observe error handling

**Expected Results:**
- ❌ Upload rejected
- ✅ Error toast: "Please select a valid image file (JPEG, PNG, or HEIC)"
- ✅ No API call made
- ✅ User can try again with valid file

---

### Scenario 4: File Too Large

**Steps:**
1. Try to upload an image > 10MB
2. Observe error handling

**Expected Results:**
- ❌ Upload rejected
- ✅ Error toast: "Image file is too large. Maximum size is 10MB."
- ✅ No API call made
- ✅ User can compress image and retry

---

### Scenario 5: Network Error

**Steps:**
1. Disconnect internet
2. Try to upload an image
3. Observe error handling

**Expected Results:**
- ❌ Upload fails
- ✅ Error toast: "Failed to upload image. Please try again."
- ✅ Upload progress resets
- ✅ User can retry when connection restored

---

### Scenario 6: OCR API Unavailable

**Steps:**
1. Upload image when Vision API is disabled or quota exceeded
2. Observe fallback behavior

**Expected Results:**
- ✅ Image uploads successfully
- ⚠️ OCR processing fails gracefully
- ✅ Warning message: "Vision API not available, image saved but OCR not performed"
- ✅ Manual count entry still available
- ✅ Image stored for later review

---

### Scenario 7: Multiple Uploads in Sequence

**Steps:**
1. Upload image for Lot 1
2. Wait for processing
3. Save and close
4. Immediately upload image for Lot 2
5. Repeat for Lot 3

**Expected Results:**
- ✅ All uploads process successfully
- ✅ No interference between uploads
- ✅ Each lot gets correct student count
- ✅ No performance degradation

---

### Scenario 8: Drag and Drop Upload

**Steps:**
1. Open lot edit modal
2. Click "Upload & Process Photo"
3. Drag image file from desktop
4. Drop onto upload area

**Expected Results:**
- ✅ Drag-and-drop works smoothly
- ✅ Image preview appears
- ✅ Upload and process button enabled
- ✅ Same behavior as file browser upload

---

### Scenario 9: Cancel Upload

**Steps:**
1. Start uploading an image
2. Click "Cancel" before processing completes

**Expected Results:**
- ✅ Modal closes
- ✅ Upload cancelled
- ✅ No changes saved
- ✅ Lot data unchanged

---

### Scenario 10: Volunteer View

**Steps:**
1. Switch to Volunteer user
2. Navigate to "Parking Lots" tab
3. Verify student counts are visible
4. Try to edit a lot

**Expected Results:**
- ✅ Student counts visible in lot cards
- ✅ Counts update in real-time
- ❌ Edit button disabled (read-only for volunteers)
- ✅ No upload functionality available

---

## 📋 Test Data Preparation

### Sample Sign-In Sheets

Create test images with varying characteristics:

1. **Clear, Well-Lit Image**
   - 10 student names
   - Printed or neat handwriting
   - Good lighting
   - High resolution (> 1MP)

2. **Moderate Quality Image**
   - 15 student names
   - Mixed handwriting styles
   - Average lighting
   - Medium resolution

3. **Poor Quality Image**
   - 8 student names
   - Messy handwriting
   - Low lighting
   - Low resolution (< 0.5MP)

4. **Edge Cases**
   - Empty sheet (0 students)
   - Single student
   - Maximum students (30+)
   - Sheet with headers and timestamps
   - Sheet with crossed-out names

---

## 🔍 Manual Testing Checklist

### Pre-Testing Setup
- [ ] Google Apps Script deployed with latest Code.gs
- [ ] Vision API enabled in Google Cloud Console
- [ ] API_CONFIG.BASE_URL updated in api-service.js
- [ ] Test images prepared (various qualities)
- [ ] Test user accounts created (Director, Volunteer)

### Image Upload Component
- [ ] Upload button visible in lot edit modal
- [ ] Click opens ImageUploadModal
- [ ] Drag-and-drop area functional
- [ ] File browser opens on click
- [ ] File type validation works
- [ ] File size validation works
- [ ] Image preview displays correctly
- [ ] Remove image button works
- [ ] Cancel button closes modal

### OCR Processing
- [ ] Upload triggers OCR processing
- [ ] Progress indicator shows during processing
- [ ] Processing completes within 15 seconds
- [ ] OCR results display correctly
- [ ] Student count extracted accurately
- [ ] Raw OCR text visible (for debugging)
- [ ] Error messages clear and helpful

### Data Persistence
- [ ] Student count updates in modal
- [ ] Count persists after save
- [ ] Count visible in lot card
- [ ] Count syncs across all views
- [ ] Count stored in Google Sheets
- [ ] Image stored in Google Sheets

### Error Handling
- [ ] Invalid file type rejected
- [ ] Oversized file rejected
- [ ] Network errors handled gracefully
- [ ] API errors handled gracefully
- [ ] User feedback clear and actionable
- [ ] Retry mechanism works

### User Experience
- [ ] Loading states clear
- [ ] Success feedback immediate
- [ ] Error messages helpful
- [ ] Manual override available
- [ ] No data loss on errors
- [ ] Responsive on mobile/tablet

---

## 🐛 Bug Reporting Template

When you find a bug, report it with this format:

```markdown
### Bug: [Short Description]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happened

**Screenshots:**
[Attach screenshots if applicable]

**Environment:**
- Browser: Chrome 120
- OS: macOS 14
- User Role: Director
- Image: [Describe test image]

**Console Errors:**
[Paste any console errors]

**Additional Notes:**
Any other relevant information
```

---

## 📊 Test Results Template

Track your testing progress:

```markdown
## Test Session: [Date]

**Tester**: [Name]
**Duration**: [Time]
**Environment**: [Browser, OS]

### Tests Passed: X/10
- ✅ Scenario 1: Happy Path
- ✅ Scenario 2: Poor Quality Image
- ❌ Scenario 3: Invalid File Type (Bug #123)
- ...

### Bugs Found: X
1. [Bug #123] Invalid file type not rejected
2. [Bug #124] OCR timeout after 30 seconds
3. ...

### Notes:
- OCR accuracy: 85% on clear images
- Average processing time: 8 seconds
- User feedback: Positive, intuitive interface
```

---

## 🚀 Performance Testing

### Metrics to Track

1. **Upload Time**
   - Target: < 10 seconds
   - Measure: Time from click to upload complete

2. **OCR Processing Time**
   - Target: < 15 seconds
   - Measure: Time from upload to results displayed

3. **Total Time per Lot**
   - Target: < 30 seconds
   - Measure: Time from edit click to save complete

4. **Accuracy Rate**
   - Target: > 80%
   - Measure: Correct count / Total tests

5. **Error Rate**
   - Target: < 5%
   - Measure: Failed uploads / Total uploads

---

## 🎓 User Acceptance Testing

### Director Feedback Questions

1. How easy was it to upload sign-in sheet photos?
2. Was the OCR student count accurate?
3. How long did it take to process all 20 lots?
4. Did you need to manually override any counts?
5. Would you prefer this over manual counting?
6. What improvements would you suggest?

### Volunteer Feedback Questions

1. Can you see updated student counts in real-time?
2. Is the interface clear and easy to understand?
3. Do you have any questions about the new workflow?

---

## 📝 Next Steps After Testing

1. **Document all bugs** in issue tracker
2. **Prioritize fixes** (Critical → High → Medium → Low)
3. **Gather user feedback** and feature requests
4. **Measure success metrics** against targets
5. **Plan iteration** based on findings
6. **Update documentation** with lessons learned

---

## 🎉 Success Criteria

MVP is ready for production when:
- ✅ All critical bugs fixed
- ✅ OCR accuracy > 80% on clear images
- ✅ Average processing time < 15 seconds
- ✅ Error rate < 5%
- ✅ Positive user feedback from Directors
- ✅ Manual override works reliably
- ✅ No data loss scenarios
- ✅ Documentation complete

---

**Happy Testing! 🧪**

