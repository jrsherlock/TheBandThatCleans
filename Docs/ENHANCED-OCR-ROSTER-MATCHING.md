# Enhanced OCR with Student Roster Matching

## Overview
This document describes the enhanced Gemini OCR functionality that extracts individual student names from sign-in sheets and automatically matches them against the ActualRoster to populate the Students tab with check-in data.

## Features

### 1. Individual Name Extraction
- Gemini AI extracts each student's full name from the sign-in sheet
- Handles various name formats: "Last, First" or "First Last"
- Identifies illegible or partially readable names
- Provides confidence levels for each extraction

### 2. Fuzzy Name Matching
- Matches extracted names against the ActualRoster using Levenshtein distance algorithm
- Handles handwriting variations and misspellings
- Supports partial matches (e.g., "J. Smith" matches "John Smith")
- Configurable similarity threshold (default: 70%)

### 3. Automatic Student Check-In
- Matched students are automatically checked in to the Students tab
- Updates: `checkedIn`, `checkInTime`, `assignedLot`
- Preserves student data from ActualRoster: `instrument`, `section`, `year`
- Creates new student records if not already in Students tab

### 4. Match Reporting
- Reports matched, unmatched, and duplicate names
- Calculates match rate percentage
- Provides detailed confidence scores for each match
- Logs unmatched names for manual review

## Data Flow

```
1. User uploads sign-in sheet image
   ↓
2. Gemini analyzes image
   - Extracts student count
   - Extracts individual student names
   - Identifies illegible entries
   ↓
3. Frontend sends to backend:
   - Student count
   - Array of student names
   - Illegible names
   - Image data
   ↓
4. Backend processes:
   - Reads ActualRoster tab
   - Matches names using fuzzy logic
   - Updates Students tab with check-ins
   - Returns match results
   ↓
5. Frontend displays:
   - Total count
   - Matched students count
   - Match rate percentage
   - Unmatched names warning
```

## Implementation Details

### Frontend Changes

#### 1. Gemini Service (`src/services/geminiService.js`)
**Enhanced Prompt:**
- Extracts individual student names (not just count)
- Requests names in array format
- Identifies illegible entries separately

**Response Structure:**
```javascript
{
  studentCount: 10,
  studentNames: [
    "Smith, John",
    "Doe, Jane",
    ...
  ],
  illegibleNames: [
    "Partial name or description"
  ],
  lotIdentified: "Lot 11",
  zoneIdentified: "Zone 1",
  confidence: "high",
  notes: "Clear image, all names legible"
}
```

#### 2. Name Matching Utility (`src/utils/nameMatching.js`)
**Functions:**
- `normalizeName(name)` - Normalizes name format for comparison
- `calculateNameSimilarity(name1, name2)` - Returns similarity score (0-1)
- `findBestMatch(extractedName, roster, threshold)` - Finds best roster match
- `matchNamesAgainstRoster(extractedNames, roster, threshold)` - Batch matching

**Similarity Scoring:**
- 1.0 = Exact match
- 0.9 = Last name match + first initial match
- 0.85 = Last name match + fuzzy first name match
- 0.75 = Last name match + first initial only
- 0.7+ = Fuzzy full name match (threshold)

#### 3. App.jsx Updates
**Payload Enhancement:**
```javascript
payload.studentNames = aiAnalysis.studentNames;
payload.illegibleNames = aiAnalysis.illegibleNames;
```

**Response Handling:**
- Displays match rate in success toast
- Shows warning for unmatched names
- Triggers data refresh to show updated Students tab

### Backend Changes

#### 1. Code.gs - Sheet Configuration
**Added ActualRoster Sheet:**
```javascript
ACTUAL_ROSTER: {
  name: "ActualRoster",
  headers: ["name", "instrument", "grade", "section"]
}
```

#### 2. Name Matching Functions
**Implemented in Code.gs:**
- `levenshteinDistance(str1, str2)` - Edit distance calculation
- `normalizeName(name)` - Name normalization
- `calculateNameSimilarity(name1, name2)` - Similarity scoring
- `findBestMatch(extractedName, roster, threshold)` - Best match finder

#### 3. Student Processing Function
**`processStudentNames(extractedNames, lotId, checkInTime)`:**

**Steps:**
1. Read ActualRoster tab
2. Build roster array with student objects
3. Match each extracted name against roster
4. Track matched, unmatched, and duplicate names
5. Update Students tab with check-in data
6. Return match results

**Students Tab Updates:**
- Existing students: Update `checkedIn`, `checkInTime`, `assignedLot`
- New students: Add row with all data from ActualRoster
- Preserves: `id`, `name`, `instrument`, `section`, `year`

#### 4. Enhanced Response
**`handleSignInSheetUpload` returns:**
```javascript
{
  success: true,
  lotId: "101",
  studentCount: 10,
  countSource: "ai",
  confidence: "high",
  timestamp: "2025-10-12T...",
  studentMatching: {
    totalExtracted: 10,
    matched: 9,
    unmatched: 1,
    duplicates: 0,
    matchRate: 90,
    matchedStudents: [...],
    unmatchedNames: ["Illegible Name"],
    duplicateMatches: []
  }
}
```

## ActualRoster Tab Structure

### Required Columns
| Column | Header | Type | Description |
|--------|--------|------|-------------|
| A | name | Text | Student full name |
| B | instrument | Text | Instrument played |
| C | grade | Number | Grade level (9-12) |
| D | section | Text | Band section (MB, CB, etc.) |

### Example Data
```
name                | instrument  | grade | section
Abbas-Clark, MJ     | Bari Sax    | 9     | MB
Abbott, Aamiya      | Trumpet     | 9     | CB
Ackermann, Asher    | Tenor Sax   | 10    | MB
```

## Edge Cases Handled

### 1. Name Format Variations
- "Smith, John" → Matches "John Smith"
- "J. Smith" → Matches "John Smith" (75% confidence)
- "Smith" → Matches if unique last name

### 2. Handwriting Issues
- Misspellings: "Smyth" matches "Smith" (fuzzy match)
- Partial names: Included in illegibleNames array
- Crossed-out names: Not extracted by Gemini

### 3. Duplicate Matches
- Same name appears twice on sheet
- Tracked separately in duplicates array
- Only first occurrence is checked in

### 4. Unmatched Names
- Names not in ActualRoster
- Similarity score below threshold
- Reported for manual review

### 5. Missing Data
- No student names extracted → Count-only mode
- Empty ActualRoster → Error message
- Missing Students tab → Error message

## Testing Checklist

- [ ] Upload sign-in sheet with clear handwriting
- [ ] Verify student names are extracted correctly
- [ ] Check Students tab is updated with check-ins
- [ ] Verify match rate is displayed in toast
- [ ] Test with misspelled names (fuzzy matching)
- [ ] Test with partial names (e.g., "J. Smith")
- [ ] Test with illegible handwriting
- [ ] Verify unmatched names are reported
- [ ] Check duplicate name handling
- [ ] Verify ActualRoster data is preserved
- [ ] Test with empty ActualRoster (error handling)
- [ ] Verify manual entry still works (fallback)

## Configuration

### Similarity Threshold
Default: 0.7 (70% similarity required)

To adjust in Code.gs:
```javascript
const match = findBestMatch(extractedName, roster, 0.75); // 75% threshold
```

### Confidence Levels
- **exact** (≥95%): Perfect match
- **high** (≥85%): Very confident match
- **medium** (≥75%): Probable match
- **low** (≥70%): Possible match

## Performance Considerations

### Gemini API
- Processes images in 2-5 seconds
- Handles up to 50 students per sheet
- Requires clear, well-lit images

### Name Matching
- O(n*m) complexity (n=extracted, m=roster)
- Typical roster: 246 students
- Typical sheet: 10-15 students
- Processing time: <1 second

### Database Updates
- Batch update to Students tab
- Single write operation
- Minimal performance impact

## Future Enhancements

1. **Machine Learning Improvements**
   - Train on historical sign-in sheets
   - Improve handwriting recognition
   - Learn common misspellings

2. **Manual Review Interface**
   - UI for reviewing unmatched names
   - Suggest possible matches
   - Allow manual matching

3. **Duplicate Detection**
   - Warn if student already checked in
   - Prevent duplicate check-ins
   - Track check-in/check-out pairs

4. **Batch Processing**
   - Upload multiple sheets at once
   - Process all lots simultaneously
   - Generate summary report

5. **Analytics**
   - Track match rate over time
   - Identify problematic names
   - Improve matching algorithm

## Related Files

- `src/services/geminiService.js` - AI analysis
- `src/utils/nameMatching.js` - Fuzzy matching
- `app.jsx` - Frontend integration
- `Code.gs` - Backend processing
- `src/components/SignInSheetUpload/SignInSheetUploadModal.jsx` - Upload UI

## Troubleshooting

### Low Match Rate
- Check ActualRoster for correct names
- Verify name format consistency
- Adjust similarity threshold
- Review illegibleNames array

### No Names Extracted
- Check image quality
- Verify Gemini API key
- Review Gemini response in console
- Try manual entry fallback

### Students Not Checking In
- Verify Students tab exists
- Check column headers match exactly
- Review backend logs
- Verify ActualRoster has data

### Duplicate Check-Ins
- Check for duplicate names in ActualRoster
- Review duplicates array in response
- Implement duplicate prevention logic

