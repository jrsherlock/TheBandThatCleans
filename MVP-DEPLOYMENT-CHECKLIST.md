# MVP Deployment Checklist

## Pre-Deployment Preparation

### 1. Google Cloud Setup
- [ ] **Enable Google Cloud Vision API**
  - Go to [Google Cloud Console](https://console.cloud.google.com/)
  - Select your Apps Script project
  - Navigate to "APIs & Services" → "Library"
  - Search for "Cloud Vision API"
  - Click "Enable"
  - Verify quota: 1000 requests/month (free tier)

- [ ] **Configure API Permissions**
  - Ensure Apps Script has Vision API access
  - Test API with sample request
  - Monitor quota usage dashboard

### 2. Google Sheets Setup
- [ ] **Verify Spreadsheet Structure**
  - Spreadsheet ID: `1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys`
  - Tabs: Lots, Students, AttendanceLog, EventConfig
  - All headers match Code.gs schema
  - Sample data populated for testing

- [ ] **Update Lots Sheet**
  - Ensure all 22 lots are present
  - Status set to "not-started"
  - Priority levels assigned
  - Section assignments correct

### 3. Google Apps Script Deployment
- [ ] **Update Code.gs**
  - Copy latest Code.gs from MVP branch
  - Verify SPREADSHEET_ID is correct
  - Verify MOCK_API_KEY matches frontend
  - Test extractStudentCount() function

- [ ] **Deploy Web App**
  - Open Apps Script editor
  - Click "Deploy" → "New deployment"
  - Type: "Web app"
  - Execute as: "Me"
  - Who has access: "Anyone"
  - Click "Deploy"
  - Copy Web App URL

- [ ] **Update Frontend Configuration**
  - Open `api-service.js`
  - Update `API_CONFIG.BASE_URL` with new Web App URL
  - Verify `API_CONFIG.API_KEY` matches Code.gs
  - Test API connection

### 4. Frontend Build
- [ ] **Install Dependencies**
  ```bash
  npm install
  ```

- [ ] **Build for Production**
  ```bash
  npm run build
  ```

- [ ] **Test Build Locally**
  ```bash
  npm run preview
  ```

### 5. Hosting Setup (GitHub Pages)
- [ ] **Configure GitHub Pages**
  - Go to repository Settings → Pages
  - Source: Deploy from branch
  - Branch: `MVP` (or `main` after merge)
  - Folder: `/` (root)
  - Click "Save"

- [ ] **Update Base URL (if needed)**
  - Check if app uses subdirectory
  - Update `vite.config.js` base path if needed

- [ ] **Deploy to GitHub Pages**
  ```bash
  npm run deploy
  ```

---

## Testing Phase

### 6. Staging Environment Testing
- [ ] **Functional Testing**
  - Test all scenarios from MVP-TESTING-GUIDE.md
  - Verify image upload works
  - Verify OCR processing works
  - Verify student count updates
  - Test error handling

- [ ] **Performance Testing**
  - Measure upload time (target: < 10s)
  - Measure OCR processing time (target: < 15s)
  - Test with 20 consecutive uploads
  - Monitor API quota usage

- [ ] **Cross-Browser Testing**
  - Chrome (latest)
  - Safari (latest)
  - Firefox (latest)
  - Mobile Safari (iOS)
  - Mobile Chrome (Android)

- [ ] **Device Testing**
  - Desktop (1920x1080)
  - Tablet (iPad)
  - Mobile (iPhone, Android)
  - Test camera upload on mobile

### 7. OCR Accuracy Testing
- [ ] **Prepare Test Images**
  - 10 clear, well-lit images
  - 5 moderate quality images
  - 3 poor quality images
  - Various student counts (5, 10, 15, 20, 30)

- [ ] **Measure Accuracy**
  - Upload each test image
  - Compare OCR count to actual count
  - Calculate accuracy rate
  - Target: > 80% accuracy

- [ ] **Document Edge Cases**
  - Images that fail OCR
  - Common OCR errors
  - Recommended image guidelines

---

## User Training

### 8. Director Training
- [ ] **Create Training Materials**
  - Quick start guide (1 page)
  - Video tutorial (5 minutes)
  - FAQ document
  - Troubleshooting guide

- [ ] **Conduct Training Session**
  - Schedule 30-minute session
  - Demonstrate upload process
  - Practice with sample images
  - Answer questions

- [ ] **Provide Support Resources**
  - Contact information for tech support
  - Link to documentation
  - Backup plan (manual count entry)

### 9. Volunteer Training
- [ ] **Brief Volunteers**
  - Explain new workflow
  - Show updated dashboard
  - Demonstrate read-only access
  - Answer questions

---

## Production Deployment

### 10. Final Pre-Launch Checks
- [ ] **Code Review**
  - Review all changes in MVP branch
  - Verify no console errors
  - Check for TODO comments
  - Ensure no hardcoded test data

- [ ] **Security Review**
  - API key not exposed in frontend
  - Proper authentication in place
  - No sensitive data in logs
  - CORS configured correctly

- [ ] **Documentation Review**
  - README.md updated
  - MVP-IMPLEMENTATION-PLAN.md complete
  - MVP-SUMMARY.md accurate
  - MVP-TESTING-GUIDE.md comprehensive

- [ ] **Backup Plan**
  - Manual count entry still available
  - Fallback to previous version if needed
  - Contact list for emergency support

### 11. Launch
- [ ] **Merge MVP to Main**
  ```bash
  git checkout main
  git merge MVP
  git push origin main
  ```

- [ ] **Deploy to Production**
  - Trigger GitHub Pages deployment
  - Verify production URL works
  - Test with production data

- [ ] **Monitor First Event**
  - Be available during first event
  - Monitor for errors
  - Gather real-time feedback
  - Document issues

---

## Post-Deployment

### 12. Monitoring
- [ ] **Track Metrics**
  - Number of images uploaded
  - OCR accuracy rate
  - Average processing time
  - Error rate
  - User satisfaction

- [ ] **Monitor API Usage**
  - Check Vision API quota
  - Monitor for quota warnings
  - Plan for quota increase if needed

- [ ] **Collect Feedback**
  - Survey Directors after first event
  - Ask Volunteers for input
  - Document feature requests
  - Prioritize improvements

### 13. Iteration
- [ ] **Review Feedback**
  - Analyze user feedback
  - Identify pain points
  - Prioritize improvements

- [ ] **Plan Next Release**
  - Bug fixes
  - Performance improvements
  - New features
  - Documentation updates

---

## Rollback Plan

### If Issues Arise

1. **Minor Issues**
   - Document issue
   - Continue with manual override
   - Fix in next release

2. **Major Issues**
   - Revert to previous version
   ```bash
   git checkout main
   git revert HEAD
   git push origin main
   ```
   - Notify users
   - Fix issues in staging
   - Re-deploy when ready

3. **Critical Issues**
   - Disable OCR feature
   - Fall back to manual count entry
   - Emergency hotfix
   - Communicate with users

---

## Success Criteria

### MVP is Successfully Deployed When:
- ✅ All 22 lots can be updated via OCR
- ✅ OCR accuracy > 80% on clear images
- ✅ Average processing time < 15 seconds
- ✅ Error rate < 5%
- ✅ Directors can process all lots in < 10 minutes
- ✅ No data loss or corruption
- ✅ Positive user feedback
- ✅ Manual override works reliably

---

## Contact Information

### Technical Support
- **Developer**: [Your Name]
- **Email**: [Your Email]
- **Phone**: [Your Phone]
- **Availability**: [Hours]

### Emergency Contacts
- **Primary**: [Name, Phone]
- **Secondary**: [Name, Phone]
- **Backup**: [Name, Phone]

---

## Resources

### Documentation
- [MVP Implementation Plan](./MVP-IMPLEMENTATION-PLAN.md)
- [MVP Summary](./MVP-SUMMARY.md)
- [MVP Testing Guide](./MVP-TESTING-GUIDE.md)
- [README](./README.md)

### External Links
- [Google Cloud Console](https://console.cloud.google.com/)
- [Apps Script Editor](https://script.google.com/)
- [Google Sheets](https://docs.google.com/spreadsheets/d/1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys/edit)
- [GitHub Repository](https://github.com/jrsherlock/TheBandThatCleans)

---

## Notes

### Lessons Learned
- [Document lessons learned during deployment]

### Future Improvements
- [List ideas for future enhancements]

### Known Issues
- [Document any known issues that are not critical]

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Production URL**: _______________
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

**Good luck with the deployment! 🚀**

