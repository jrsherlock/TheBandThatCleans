# API Payload Reference for AI-Assisted Check-Ins

## 📡 Backend Endpoint

The Google Apps Script backend now supports a new action type: `UPLOAD_SIGNIN_SHEET`

---

## 📤 Request Payload Format

### Required Fields

```javascript
{
  "type": "UPLOAD_SIGNIN_SHEET",  // Action type (required)
  "lotId": "lot-55"                // Lot ID (required)
}
```

### Optional Fields

```javascript
{
  "aiCount": 11,                   // Student count from AI (optional, but either this or manualCount required)
  "manualCount": 12,               // Manual student count (optional, but either this or aiCount required)
  "aiConfidence": "high",          // AI confidence: "high", "medium", "low" (optional)
  "countSource": "ai",             // Source: "ai" or "manual" (optional, auto-detected if not provided)
  "enteredBy": "Jane Volunteer",   // Name of user who submitted (optional, defaults to "Unknown User")
  "imageData": "data:image/jpeg;base64,...", // Base64 encoded image (optional)
  "notes": "Clear image, all names legible"  // Additional notes (optional)
}
```

---

## 📥 Response Format

### Success Response

```javascript
{
  "success": true,
  "message": "Parking Lot Cleanup Sign-in sheet uploaded successfully",
  "lotId": "lot-55",
  "studentCount": 11,
  "countSource": "ai",
  "confidence": "high",
  "timestamp": "2024-10-12T12:34:56.789Z"
}
```

### Error Response

```javascript
{
  "error": "Lot not found: lot-99",
  "httpStatus": 404
}
```

---

## 🎯 Usage Examples

### Example 1: AI-Powered Upload (Recommended)

```javascript
const payload = {
  type: "UPLOAD_SIGNIN_SHEET",
  lotId: "lot-55",
  aiCount: 11,
  aiConfidence: "high",
  countSource: "ai",
  enteredBy: currentUser.name,
  imageData: compressedImageBase64,
  notes: "AI analysis: Clear image, all names legible, lot info matches"
};

// Send to backend
const response = await fetch(APPS_SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify(payload)
});
```

### Example 2: Manual Entry (No Image)

```javascript
const payload = {
  type: "UPLOAD_SIGNIN_SHEET",
  lotId: "lot-55",
  manualCount: 12,
  countSource: "manual",
  enteredBy: currentUser.name,
  notes: "Manual count - no image available"
};
```

### Example 3: Manual Override of AI Count

```javascript
const payload = {
  type: "UPLOAD_SIGNIN_SHEET",
  lotId: "lot-55",
  aiCount: 11,              // AI suggested 11
  manualCount: 12,          // User corrected to 12
  aiConfidence: "medium",
  countSource: "ai",        // Still mark as AI source
  enteredBy: currentUser.name,
  imageData: compressedImageBase64,
  notes: "AI suggested 11 students, manually verified and corrected to 12"
};
```

### Example 4: Low Confidence AI Result

```javascript
const payload = {
  type: "UPLOAD_SIGNIN_SHEET",
  lotId: "lot-55",
  aiCount: 8,
  aiConfidence: "low",
  countSource: "ai",
  enteredBy: currentUser.name,
  imageData: compressedImageBase64,
  notes: "WARNING: Image quality poor, blurry text. Manual verification recommended."
};
```

---

## 🔧 Frontend Integration Guide

### Step 1: Prepare the Data

```javascript
// From SignInSheetUploadModal.jsx
const handleSubmit = async () => {
  // Prepare submission data
  const submissionData = {
    type: "UPLOAD_SIGNIN_SHEET",
    lotId: lot.id,
    aiCount: aiResult?.count,
    aiConfidence: aiResult?.confidence,
    countSource: useManualEntry ? 'manual' : 'ai',
    enteredBy: currentUser.name,
    notes: notes || aiResult?.notes || '',
    timestamp: new Date().toISOString()
  };

  // Add manual count if user overrode AI
  if (useManualEntry && manualCount) {
    submissionData.manualCount = parseInt(manualCount);
  }

  // Add image if available
  if (selectedFile) {
    const base64Image = await imageToBase64(selectedFile);
    submissionData.imageData = base64Image;
  }

  // Send to backend
  await apiService.uploadSignInSheet(submissionData);
};
```

### Step 2: Create API Service Method

Add this to your `api-service.js`:

```javascript
/**
 * Upload sign-in sheet with AI analysis
 */
async uploadSignInSheet(payload) {
  try {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error('Failed to upload sign-in sheet:', error);
    throw new Error('Failed to upload sign-in sheet. Please try again.');
  }
}
```

### Step 3: Call from Component

```javascript
import { toast } from 'react-hot-toast';
import apiService from '../../services/api-service';

// In your component
const handleUpload = async (submissionData) => {
  try {
    toast.loading('Uploading sign-in sheet...', { id: 'upload' });
    
    const result = await apiService.uploadSignInSheet(submissionData);
    
    toast.dismiss('upload');
    toast.success(`✅ ${result.message}`);
    
    // Refresh data to show updated count
    await refreshData();
    
  } catch (error) {
    toast.dismiss('upload');
    toast.error(error.message);
  }
};
```

---

## 📊 Data Storage in Google Sheets

When you submit a sign-in sheet upload, the following columns are updated in the Lots sheet:

| Column | Field Name | Example Value | Description |
|--------|------------|---------------|-------------|
| L | signUpSheetPhoto | `data:image/jpeg;base64,...` | Base64 encoded image |
| P | aiStudentCount | `11` | Student count (from AI or manual) |
| Q | aiConfidence | `high` | Confidence level |
| R | aiAnalysisTimestamp | `2024-10-12T12:34:56.789Z` | When analysis was done |
| S | countSource | `ai` | Source of count |
| T | countEnteredBy | `Jane Volunteer` | Who submitted |
| U | manualCountOverride | `12` | Manual override (if any) |
| G | comment | `[AI Check-in ...]: notes` | Notes appended |
| H | lastUpdated | `2024-10-12T12:34:56.789Z` | Last update time |
| I | updatedBy | `Jane Volunteer` | Who updated |

---

## 🧪 Testing Checklist

### Backend Testing (Google Apps Script)

```javascript
// Test 1: AI upload with image
{
  "type": "UPLOAD_SIGNIN_SHEET",
  "lotId": "lot-1",
  "aiCount": 11,
  "aiConfidence": "high",
  "countSource": "ai",
  "enteredBy": "Test User",
  "imageData": "data:image/jpeg;base64,iVBORw0KGgo...",
  "notes": "Test AI upload"
}

// Test 2: Manual entry without image
{
  "type": "UPLOAD_SIGNIN_SHEET",
  "lotId": "lot-1",
  "manualCount": 8,
  "countSource": "manual",
  "enteredBy": "Test User",
  "notes": "Test manual entry"
}

// Test 3: Manual override
{
  "type": "UPLOAD_SIGNIN_SHEET",
  "lotId": "lot-1",
  "aiCount": 10,
  "manualCount": 11,
  "aiConfidence": "medium",
  "countSource": "ai",
  "enteredBy": "Test User",
  "notes": "AI said 10, corrected to 11"
}
```

### Frontend Testing

- [ ] Upload clear sign-in sheet image
- [ ] AI analysis returns correct count
- [ ] Manual entry works without image
- [ ] Manual override works correctly
- [ ] Notes are saved properly
- [ ] User name is recorded
- [ ] Timestamp is accurate
- [ ] Data appears in Google Sheets
- [ ] Image is stored correctly
- [ ] Error handling works

---

## 🚨 Error Handling

### Common Errors

**Error: "lotId is required"**
- Ensure `lotId` is included in payload
- Check that lotId is not null or undefined

**Error: "Either aiCount or manualCount is required"**
- Include at least one count value
- Verify the value is a number, not a string

**Error: "Lot not found: lot-99"**
- Check that the lot exists in Google Sheets
- Verify the lot ID matches exactly (case-sensitive)

**Error: "Invalid update type"**
- Ensure `type` is exactly `"UPLOAD_SIGNIN_SHEET"`
- Check for typos in the type field

---

## 📝 Notes

1. **Image Size**: Keep images under 5MB (frontend should compress)
2. **Base64 Format**: Include the data URL prefix: `data:image/jpeg;base64,...`
3. **Count Values**: Must be non-negative integers
4. **Confidence Levels**: Use "high", "medium", or "low" (lowercase)
5. **Count Source**: Use "ai" or "manual" (lowercase)
6. **Notes**: Will be appended to existing comments with timestamp
7. **User Name**: Should come from authenticated user context

---

## ✅ Integration Checklist

- [ ] Backend deployed with new handler
- [ ] API service method created
- [ ] Upload modal component integrated
- [ ] Image compression implemented
- [ ] Gemini API configured
- [ ] Error handling added
- [ ] Success notifications working
- [ ] Data refresh after upload
- [ ] Permission checks in place
- [ ] Testing completed

---

**Ready to integrate!** Use this reference when building the frontend API calls.

