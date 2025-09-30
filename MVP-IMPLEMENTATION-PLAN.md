# MVP Implementation Plan - Hybrid Paper/Digital System

## Overview
Transform the TBTC application from a student-facing digital sign-in system to a hybrid paper/digital system where students use physical sign-in sheets, and Directors/Volunteers use the digital platform for management via OCR-processed images.

## Implementation Date
2025-09-30

## Branch
`MVP` (created from `main`)

---

## Key Changes Summary

### What's Being Removed
1. **Student QR Code Sign-In Flow**
   - Remove `StudentCheckIn.jsx` component
   - Remove `StudentCheckOut.jsx` component
   - Remove `QRCodeRouter.jsx` component
   - Remove QR code route detection in `app.jsx`
   - Remove student-facing check-in/check-out interfaces

2. **Student Role Access**
   - Students no longer interact with the app directly
   - Remove student dashboard and student views
   - Update role permissions to reflect new workflow

### What's Being Added
1. **Image Upload Component** (`ImageUploadModal.jsx`)
   - Upload interface for sign-in sheet photos
   - Support for multiple image formats (JPEG, PNG, HEIC)
   - Preview uploaded images before processing
   - Batch upload support (up to 20 sheets per event)

2. **OCR Processing Service** (`ocrService.js`)
   - Integration with Google Cloud Vision API (via Apps Script)
   - Handwriting recognition for student names
   - Student count extraction from images
   - Error handling and retry logic

3. **Name Matching Logic** (`nameMatchingService.js`)
   - Fuzzy matching algorithm to match OCR names with master student list
   - Confidence scoring for matches
   - Manual review interface for low-confidence matches
   - Bulk approval/rejection of matches

4. **Enhanced Lot Edit Modal**
   - Add "Upload Sign-In Sheet" button
   - Display uploaded image thumbnails
   - Show OCR results (extracted names and count)
   - Manual override for student counts
   - Name matching review interface

### What Stays the Same
1. **Director Functionality**
   - Dashboard with statistics and progress tracking
   - Parking lot management (status updates, comments)
   - Command center for bulk operations
   - Report generation and export

2. **Volunteer Functionality**
   - Read-only dashboard view
   - Lot status monitoring
   - Student count visibility

3. **Data Structure**
   - Google Sheets with 3 tabs (Lots, Students, AttendanceLog)
   - Same lot and student data models
   - Existing API endpoints remain functional

---

## Technical Implementation

### Phase 1: Remove Student-Facing Components
**Files to Modify:**
- `app.jsx` - Remove QR code routing logic
- `src/components/Dashboard.jsx` - Remove StudentDashboard component
- Navigation - Remove student role from user selection

**Files to Delete:**
- `src/components/StudentCheckIn.jsx`
- `src/components/StudentCheckOut.jsx`
- `src/components/QRCodeRouter.jsx`

**Documentation to Update:**
- `CHECKIN-CHECKOUT-GUIDE.md` - Archive or remove
- `QR-CODE-GENERATION-GUIDE.md` - Archive or remove
- `README.md` - Update workflow description

### Phase 2: Create Image Upload Infrastructure
**New Files:**
- `src/components/ImageUploadModal.jsx` - Upload UI component
- `src/services/ocrService.js` - OCR processing service
- `src/services/nameMatchingService.js` - Name matching logic
- `src/components/OCRResultsReview.jsx` - Review interface for OCR results

**Features:**
- Drag-and-drop image upload
- Image preview and cropping
- Progress indicators during upload/processing
- Error handling and user feedback

### Phase 3: Enhance Backend OCR Support
**Files to Modify:**
- `Code.gs` - Enhance `handleOcrUpload` function
- `api-service.js` - Add OCR-specific methods

**New Functionality:**
- Batch OCR processing
- Store OCR results in Google Sheets
- Name matching against Students sheet
- Confidence scoring for matches

### Phase 4: Update Lot Management
**Files to Modify:**
- `src/components/LotEditModal.jsx` - Add image upload section
- `src/components/ParkingLotsScreen.jsx` - Display OCR-derived counts

**New Features:**
- "Upload Sign-In Sheet" button in lot edit modal
- Display uploaded image thumbnails
- Show OCR-extracted student count
- Manual override option for counts
- Name matching review interface

### Phase 5: Update Data Flow
**Changes:**
- Student counts now derived from OCR instead of direct check-ins
- `totalStudentsSignedUp` field updated via OCR processing
- Optional: Create new `ocrResults` field in Lots sheet to store extracted names
- Optional: Create new `nameMatches` field to store matching results

---

## New Data Schema

### Lots Sheet - New Fields
| Field | Type | Description |
|-------|------|-------------|
| `ocrResults` | JSON string | Raw OCR extracted text |
| `extractedNames` | JSON array | List of names extracted from OCR |
| `ocrProcessedAt` | datetime | When OCR was last run |
| `ocrProcessedBy` | string | Who uploaded the image |

### New Sheet: OCRLog (Optional)
| Field | Type | Description |
|-------|------|-------------|
| `lotId` | string | Associated parking lot |
| `uploadedAt` | datetime | Upload timestamp |
| `uploadedBy` | string | Director/Volunteer name |
| `imageUrl` | string | Google Drive URL to image |
| `ocrRawText` | text | Raw OCR output |
| `extractedCount` | number | Number of names found |
| `matchedCount` | number | Number of names matched |
| `confidence` | number | Average confidence score |

---

## User Workflow

### Morning of Event (Before 7:10 AM)
1. Students arrive and sign physical paper sheets (no change)
2. Each sheet corresponds to a specific parking lot
3. Students write their names on the appropriate sheet

### After Sign-In Period (~7:10 AM)
1. **Director/Volunteer collects all sign-in sheets**
2. **Takes photos of each sheet** (phone camera)
3. **Opens TBTC web app** on tablet/computer
4. **Navigates to "Parking Lots" tab**
5. **For each lot:**
   - Click "Edit Details" button
   - Click "Upload Sign-In Sheet" button
   - Select/drag photo from phone/computer
   - Wait for OCR processing (5-10 seconds)
   - Review extracted student count
   - (Optional) Review matched student names
   - Click "Save" to update lot

### During Event
- Directors monitor lot progress as usual
- Student counts visible in all views
- Volunteers can see updated counts
- All existing Director features work normally

---

## OCR Processing Details

### Google Cloud Vision API Integration
```javascript
// In Code.gs
function handleOcrUpload(payload) {
  // 1. Decode base64 image
  // 2. Call Vision API for TEXT_DETECTION
  // 3. Extract full text
  // 4. Parse for student names (line-by-line)
  // 5. Count total names
  // 6. (Optional) Match against Students sheet
  // 7. Store results in Lots sheet
  // 8. Return results to frontend
}
```

### Name Extraction Logic
```javascript
// Simple approach: Count non-empty lines
function extractStudentNames(ocrText) {
  const lines = ocrText.split('\n');
  const names = lines
    .map(line => line.trim())
    .filter(line => line.length > 2) // Filter out noise
    .filter(line => !line.match(/^(Time|Lot|Zone|#)/i)); // Filter headers
  
  return {
    names: names,
    count: names.length
  };
}
```

### Fuzzy Name Matching (Optional)
```javascript
// Using Levenshtein distance or similar
function matchNameToStudent(ocrName, studentList) {
  const matches = studentList.map(student => ({
    student: student,
    confidence: calculateSimilarity(ocrName, student.name)
  }));
  
  return matches
    .filter(m => m.confidence > 0.7)
    .sort((a, b) => b.confidence - a.confidence)[0];
}
```

---

## Testing Plan

### Unit Tests
- [ ] OCR service handles valid images
- [ ] OCR service handles invalid images
- [ ] Name extraction logic works correctly
- [ ] Name matching algorithm produces accurate results
- [ ] Image upload component validates file types

### Integration Tests
- [ ] Upload image → OCR processing → count update flow
- [ ] Multiple images uploaded in sequence
- [ ] OCR results stored correctly in Google Sheets
- [ ] Director can override OCR-derived counts

### User Acceptance Tests
- [ ] Director can upload sign-in sheet photo
- [ ] OCR extracts reasonable student count
- [ ] Student count updates in all views
- [ ] Volunteer can see updated counts
- [ ] Report export includes OCR-derived data

---

## Rollout Strategy

### Development
1. Create MVP branch ✅
2. Implement Phase 1 (remove student components)
3. Implement Phase 2 (image upload UI)
4. Implement Phase 3 (backend OCR)
5. Implement Phase 4 (lot management updates)
6. Test thoroughly

### Staging
1. Deploy to test Google Apps Script
2. Test with sample sign-in sheet images
3. Verify OCR accuracy with real handwriting
4. Adjust name extraction logic as needed

### Production
1. Train Directors/Volunteers on new workflow
2. Prepare backup plan (manual count entry)
3. Deploy to production
4. Monitor first event closely
5. Gather feedback and iterate

---

## Success Metrics

### Technical
- OCR accuracy > 80% for student count
- Image upload time < 10 seconds
- Processing time < 15 seconds per image
- Zero data loss during upload

### User Experience
- Directors can process all 20 sheets in < 10 minutes
- Fewer errors than manual count entry
- Positive feedback from Directors/Volunteers

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OCR fails to extract text | High | Manual count override always available |
| Poor handwriting recognition | Medium | Adjust OCR confidence thresholds |
| Image upload fails | High | Retry logic + error messages |
| Google Vision API quota exceeded | High | Implement rate limiting + caching |
| Directors unfamiliar with new workflow | Medium | Training session + documentation |

---

## Future Enhancements (Post-MVP)

1. **Automatic Name Matching**
   - Match OCR names to student roster
   - Auto-assign students to lots
   - Generate attendance log from matches

2. **Image Quality Validation**
   - Check image resolution before upload
   - Suggest retake if quality is poor
   - Auto-rotate images

3. **Batch Processing**
   - Upload all 20 sheets at once
   - Automatic lot detection from image headers
   - Parallel OCR processing

4. **Mobile App**
   - Native camera integration
   - Offline support with sync
   - Push notifications for Directors

---

## Next Steps

1. ✅ Create MVP branch
2. Remove student-facing components
3. Create image upload modal component
4. Implement OCR service integration
5. Update lot edit modal
6. Test with sample images
7. Deploy and gather feedback

