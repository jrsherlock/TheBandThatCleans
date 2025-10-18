# AI-Assisted Student Check-Ins Implementation Guide

## 📋 Overview

This feature enables Parent Volunteers and Admin/Director users to process physical sign-in sheets using AI-powered image recognition via Google's Gemini API. The system will automatically count students from uploaded photos of the 22 parking lot sign-in sheets per cleanup event.

## 🎯 Feature Requirements

### Core Functionality
1. **Image Upload Interface** - UI for uploading sign-in sheet photos
2. **Image Storage** - Persistent storage of uploaded images
3. **AI Integration** - Google Gemini API for student count extraction
4. **Manual Entry/Override** - Alternative manual entry and edit capability
5. **Data Persistence** - Store counts and metadata in Google Sheets

### User Permissions
- **Parent Volunteer**: Can upload images, manually enter/edit counts
- **Admin/Director**: Full access to all features

## 🔧 Technical Architecture

### 1. Google Gemini API Integration

#### API Setup Steps

**Step 1: Get Gemini API Key**
```bash
# Visit: https://aistudio.google.com/app/apikey
# Create a new API key for your project
# Store it securely (DO NOT commit to git)
```

**Step 2: Install Gemini SDK**
```bash
npm install @google/generative-ai
```

**Step 3: Create Gemini Service**
Create `src/services/geminiService.js`:

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
// IMPORTANT: In production, use environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Analyze sign-in sheet image and extract student count
 * @param {File} imageFile - The uploaded image file
 * @param {string} lotName - Name of the parking lot for context
 * @returns {Promise<{count: number, confidence: string, lotId: string}>}
 */
export async function analyzeSignInSheet(imageFile, lotName) {
  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Use Gemini Pro Vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Craft prompt for student count extraction
    const prompt = `
You are analyzing a parking lot cleanup sign-in sheet for "${lotName}".

This is a physical sign-in sheet where students manually write their names and times.

Your task:
1. Count the number of students who have SIGNED IN (have entries in the "Student Name" column)
2. Look for the lot identification information at the top of the sheet
3. Verify this matches "${lotName}"

Please respond in JSON format:
{
  "studentCount": <number of students who signed in>,
  "lotIdentified": "<lot name/number found on sheet>",
  "confidence": "high|medium|low",
  "notes": "<any observations about the sheet quality or issues>"
}

Only count rows where a student name is clearly written. Ignore empty rows.
    `.trim();
    
    // Generate content with image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: imageFile.type,
          data: base64Image
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      count: analysis.studentCount || 0,
      lotIdentified: analysis.lotIdentified || '',
      confidence: analysis.confidence || 'low',
      notes: analysis.notes || '',
      rawResponse: text
    };
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### 2. Image Storage Strategy

Since we're using Google Sheets as the backend, we have two options:

#### Option A: Base64 Encoding in Google Sheets (Recommended for MVP)
- Store images as base64 strings directly in the `signUpSheetPhoto` column
- Pros: Simple, no additional infrastructure needed
- Cons: Limited to ~50KB per image (Google Sheets cell limit)
- Solution: Compress images before upload

#### Option B: Google Drive Storage (For Production)
- Upload images to Google Drive
- Store Drive file IDs in Google Sheets
- Pros: No size limits, better performance
- Cons: Requires Google Drive API setup

**For MVP, we'll use Option A with image compression.**

### 3. Backend Updates (Code.gs)

Update the `SHEETS.LOTS.headers` to include new fields:

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
      "aiStudentCount",           // Count from AI analysis
      "aiConfidence",             // AI confidence level (high/medium/low)
      "aiAnalysisTimestamp",      // When AI analysis was performed
      "countSource",              // "ai" or "manual"
      "countEnteredBy",           // User who uploaded/entered count
      "manualCountOverride"       // Manual override if AI count was incorrect
    ]
  },
  // ... other sheets
};
```

Add new handler for image upload with AI count:

```javascript
/**
 * Handle sign-in sheet upload with AI-generated count
 */
function handleSignInSheetUpload() {
  try {
    const payload = JSON.parse(e.parameter.payload);
    const { lotId, imageData, aiCount, aiConfidence, countSource, enteredBy } = payload;
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.LOTS.name);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find lot row
    const idIndex = headers.indexOf("id");
    const photoIndex = headers.indexOf("signUpSheetPhoto");
    const aiCountIndex = headers.indexOf("aiStudentCount");
    const aiConfidenceIndex = headers.indexOf("aiConfidence");
    const aiTimestampIndex = headers.indexOf("aiAnalysisTimestamp");
    const countSourceIndex = headers.indexOf("countSource");
    const enteredByIndex = headers.indexOf("countEnteredBy");
    const lastUpdatedIndex = headers.indexOf("lastUpdated");
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIndex]) === String(lotId)) {
        // Update row with image and AI data
        data[i][photoIndex] = imageData;
        data[i][aiCountIndex] = aiCount;
        data[i][aiConfidenceIndex] = aiConfidence;
        data[i][aiTimestampIndex] = new Date().toISOString();
        data[i][countSourceIndex] = countSource;
        data[i][enteredByIndex] = enteredBy;
        data[i][lastUpdatedIndex] = new Date().toISOString();
        
        sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
        
        return createJsonResponse({ 
          success: true, 
          message: 'Parking Lot Cleanup Sign-in sheet uploaded successfully',
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

### 4. Frontend Components

#### Component Structure
```
src/
├── components/
│   ├── SignInSheetUpload/
│   │   ├── SignInSheetUploadModal.jsx    # Main upload modal
│   │   ├── ImagePreview.jsx              # Image preview component
│   │   ├── AIAnalysisDisplay.jsx         # Show AI results
│   │   └── ManualCountEntry.jsx          # Manual entry fallback
│   └── ParkingLotsScreen.jsx             # Add upload button to lot cards
├── services/
│   ├── geminiService.js                  # Gemini API integration
│   └── imageService.js                   # Image compression utilities
└── utils/
    └── imageCompression.js               # Image compression helpers
```

## 📝 Implementation Steps

### Phase 1: Setup & Configuration (Day 1)
1. ✅ Create feature branch `ai-assisted-checkins`
2. Get Google Gemini API key
3. Add environment variable configuration
4. Install dependencies
5. Update Google Sheets schema

### Phase 2: Backend Development (Day 2-3)
1. Update `Code.gs` with new fields
2. Add image upload handler
3. Add manual count entry handler
4. Test API endpoints

### Phase 3: Gemini Integration (Day 3-4)
1. Create `geminiService.js`
2. Implement image analysis function
3. Add error handling and retries
4. Test with sample sign-in sheet images

### Phase 4: Frontend Components (Day 4-6)
1. Create upload modal component
2. Add image compression
3. Implement AI analysis display
4. Add manual entry/override UI
5. Integrate with ParkingLotsScreen

### Phase 5: Testing & Refinement (Day 7)
1. Test with real sign-in sheet photos
2. Validate AI accuracy
3. Test permission controls
4. User acceptance testing

## 🔐 Security Considerations

1. **API Key Protection**
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys regularly

2. **Image Data**
   - Compress images before upload
   - Validate file types (JPEG, PNG only)
   - Limit file size (max 5MB)

3. **User Permissions**
   - Verify user role before allowing uploads
   - Log all AI analysis attempts
   - Track manual overrides

## 📊 Data Flow

```
1. User uploads sign-in sheet photo
   ↓
2. Frontend compresses image
   ↓
3. Image sent to Gemini API for analysis
   ↓
4. AI returns student count + confidence
   ↓
5. User reviews and confirms/edits count
   ↓
6. Data saved to Google Sheets
   ↓
7. Image stored as base64 in sheet
   ↓
8. UI updates to show count and source
```

## 🧪 Testing Strategy

### Test Cases
1. Upload clear, high-quality sign-in sheet
2. Upload blurry/low-quality image
3. Upload image with partial data
4. Manual entry without image
5. Override AI count with manual entry
6. Permission checks (volunteer vs admin)
7. Multiple uploads for same lot
8. Network failure scenarios

## 📚 Next Steps

After reading this guide, you'll need to:

1. **Get Gemini API Key**: Visit https://aistudio.google.com/app/apikey
2. **Create `.env` file** in project root:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
3. **Install dependencies**: `npm install @google/generative-ai`
4. **Update Google Sheets**: Add new columns to Lots sheet
5. **Deploy updated Code.gs**: Redeploy Google Apps Script

Would you like me to proceed with implementing any specific component?

