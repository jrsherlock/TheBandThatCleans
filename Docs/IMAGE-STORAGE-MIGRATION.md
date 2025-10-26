# Image Storage Migration - Centralized Google Drive Folder with Meaningful Filenames

## Overview
This document describes the migration from auto-created Google Drive folders to a centralized shared folder with human-readable filenames for sign-in sheet images.

---

## Changes Implemented

### 1. Centralized Google Drive Folder

**Previous Behavior:**
- Images were saved to a folder named "TBTC Sign-In Sheets"
- Folder was auto-created if it didn't exist
- Used `getOrCreateImageFolder()` function to find or create folder by name

**New Behavior:**
- All images are saved to a specific shared Google Drive folder
- Folder ID: `1OaR3INpGTpnY0p5q7lAVxUzuIyUOQokr`
- Folder URL: https://drive.google.com/drive/folders/1OaR3INpGTpnY0p5q7lAVxUzuIyUOQokr
- Uses `getImageFolder()` function to access folder by ID

**Benefits:**
- Single centralized location for all sign-in sheet images
- Easy to share folder with Directors and Parent Volunteers
- Consistent permissions across all images
- No risk of duplicate folders

### 2. Meaningful Filenames

**Previous Behavior:**
- Filenames: `signin_sheet_{lotId}_{timestamp}.jpg`
- Example: `signin_sheet_55_1737312345678.jpg`
- Difficult to identify which lot when browsing Drive folder

**New Behavior:**
- Filenames: `{lotName}_{eventName}_{eventDate}_{timestamp}.jpg`
- Example: `Lot_11_Jail_Lot_2025_Clean_Up_5_2025-10-26_1737312345678.jpg`
- Human-readable and easy to search

**Filename Components:**
1. **Lot Name** - Sanitized lot name (e.g., "Lot_11_Jail_Lot")
2. **Event Name** - Sanitized event name from EventConfig (e.g., "2025_Clean_Up_5")
3. **Event Date** - Date in YYYY-MM-DD format (e.g., "2025-10-26")
4. **Timestamp** - Unix timestamp for uniqueness (e.g., "1737312345678")

**Sanitization Rules:**
- Remove special characters except alphanumeric, spaces, hyphens, and # (for event names)
- Replace spaces and colons with underscores
- Example: "Lot 11: Jail Lot" → "Lot_11_Jail_Lot"
- Example: "2025 Clean Up #5" → "2025_Clean_Up_5"

### 3. Event Configuration Integration

**New Helper Function: `getEventConfigData()`**
- Reads event name and date from EventConfig sheet
- Returns default values if EventConfig is missing or empty
- Used by both single and bulk upload handlers

**Fallback Logic:**
- Event Name: Defaults to "DefaultEvent" or "CleanupEvent"
- Event Date: Defaults to current date (YYYY-MM-DD)

---

## Backend Changes (Code.gs)

### Updated Constants

```javascript
const DRIVE_CONFIG = {
  // ID of the shared Google Drive folder for storing sign-in sheet images
  // URL: https://drive.google.com/drive/folders/1OaR3INpGTpnY0p5q7lAVxUzuIyUOQokr
  FOLDER_ID: "1OaR3INpGTpnY0p5q7lAVxUzuIyUOQokr",

  // Fallback file name prefix (if naming fails)
  FILE_NAME_PREFIX: "signin_sheet_"
};
```

### New Functions

**`getEventConfigData()`** (Lines 258-297)
- Retrieves current event name and date from EventConfig sheet
- Returns object: `{ eventName: string, eventDate: string }`
- Handles missing sheet, empty data, and missing headers gracefully

**`getImageFolder()`** (Lines 2169-2185)
- Replaces `getOrCreateImageFolder()`
- Accesses folder by ID instead of name
- Throws error if folder ID is not set or folder cannot be accessed

### Updated Functions

**`uploadImageToDrive()`** (Lines 2187-2255)
- **Old signature:** `uploadImageToDrive(base64Data, lotId, mimeType)`
- **New signature:** `uploadImageToDrive(base64Data, lotName, eventName, eventDate, mimeType)`
- Sanitizes filename components
- Creates meaningful filename: `{lotName}_{eventName}_{eventDate}_{timestamp}.jpg`
- Uses `getImageFolder()` instead of `getOrCreateImageFolder()`
- No longer deletes old files (timestamp ensures uniqueness)

**`handleSignInSheetUpload()`** (Lines 1129-1206)
- Calls `getEventConfigData()` to get event name and date
- Retrieves lot name from sheet data
- Passes lot name, event name, and event date to `uploadImageToDrive()`

**`handleBulkSignInSheetUpload()`** (Lines 1362-1452)
- Calls `getEventConfigData()` to get event name and date
- Uses event date from upload payload if available, falls back to config
- Passes lot name, event name, and event date to `uploadImageToDrive()`

---

## Frontend Impact

### No Changes Required

The frontend components are already designed to work with Google Drive URLs:

1. **Image Display Components:**
   - `ParkingLotsScreen.jsx` - Displays `lot.signUpSheetPhoto` URL
   - `SignInSheetUploadModal.jsx` - Uploads images and receives Drive URLs
   - `BulkSignInSheetUpload.jsx` - Uploads multiple images
   - `LotEditModal.jsx` - Shows uploaded image indicator

2. **URL Handling:**
   - All components use `<img src={lot.signUpSheetPhoto}>` which works with any valid URL
   - `DriveLinkButton` component handles Drive URLs correctly
   - No hardcoded folder references or URL parsing logic

3. **Backward Compatibility:**
   - Existing Drive URLs in Google Sheet will continue to work
   - Old images remain accessible at their original URLs
   - New uploads use the new folder and naming convention

---

## Folder Permissions

### Required Permissions

The shared Google Drive folder must be configured with appropriate permissions:

1. **Script Access:**
   - Google Apps Script must have permission to write to the folder
   - Folder ID must be accessible by the script's service account

2. **User Access:**
   - **Directors (Admin):** Edit access to upload and manage images
   - **Parent Volunteers:** View access to see uploaded images
   - **Students:** No access (images not visible to students)

3. **Sharing Settings:**
   - Recommended: "Anyone with the link can view"
   - This allows embedded images to display in the app
   - Individual file permissions are set to `ANYONE_WITH_LINK` with `VIEW` permission

### Setting Up Permissions

1. Open the Google Drive folder: https://drive.google.com/drive/folders/1OaR3INpGTpnY0p5q7lAVxUzuIyUOQokr
2. Click "Share" button
3. Add Directors and Parent Volunteers with appropriate access
4. Set link sharing to "Anyone with the link can view"
5. Verify that the Google Apps Script service account has write access

---

## Testing Checklist

### Single Upload Testing

- [ ] Upload a sign-in sheet for a lot
- [ ] Verify image appears in the shared Google Drive folder
- [ ] Verify filename format: `{LotName}_{EventName}_{Date}_{Timestamp}.jpg`
- [ ] Verify lot name is readable (e.g., "Lot_11_Jail_Lot")
- [ ] Verify event name is readable (e.g., "2025_Clean_Up_5")
- [ ] Verify date is in YYYY-MM-DD format
- [ ] Verify image displays correctly in the app
- [ ] Verify Drive URL is stored in `signUpSheetPhoto` column

### Bulk Upload Testing

- [ ] Upload 3+ sign-in sheets at once
- [ ] Verify all images appear in the shared Google Drive folder
- [ ] Verify each filename is unique (different timestamps)
- [ ] Verify lot names are correct for each image
- [ ] Verify event name and date are consistent across all uploads
- [ ] Verify all images display correctly in the app
- [ ] Verify Drive URLs are stored in Google Sheet

### Event Configuration Testing

- [ ] Set event name in EventConfig sheet (e.g., "2025 Clean Up #5")
- [ ] Set event date in EventConfig sheet (e.g., "2025-10-26")
- [ ] Upload a sign-in sheet
- [ ] Verify filename includes correct event name and date
- [ ] Test with missing EventConfig sheet (should use defaults)
- [ ] Test with empty EventConfig sheet (should use defaults)

### Permissions Testing

- [ ] Verify Directors can upload images
- [ ] Verify Parent Volunteers can upload images
- [ ] Verify Students cannot upload images
- [ ] Verify uploaded images are viewable by all authorized users
- [ ] Verify images display in embedded `<img>` tags

### Backward Compatibility Testing

- [ ] Verify existing Drive URLs in Google Sheet still work
- [ ] Verify old images are still accessible
- [ ] Verify new uploads don't affect old images
- [ ] Verify app displays both old and new images correctly

---

## Troubleshooting

### Error: "Failed to access Drive folder"

**Cause:** Folder ID is incorrect or script doesn't have permission

**Solution:**
1. Verify `DRIVE_CONFIG.FOLDER_ID` is set to `1OaR3INpGTpnY0p5q7lAVxUzuIyUOQokr`
2. Check that the folder exists and is accessible
3. Verify Google Apps Script has permission to access the folder
4. Redeploy the script

### Error: "Upload failed: Invalid folder ID"

**Cause:** Folder ID is missing or malformed

**Solution:**
1. Check that `DRIVE_CONFIG.FOLDER_ID` is not empty
2. Verify the folder ID is exactly 33 characters
3. Ensure no extra spaces or quotes in the folder ID

### Images Not Displaying in App

**Cause:** Folder permissions are too restrictive

**Solution:**
1. Open the Google Drive folder
2. Set sharing to "Anyone with the link can view"
3. Verify individual file permissions are set correctly
4. Check browser console for CORS or permission errors

### Filenames Are Garbled

**Cause:** Special characters in lot name or event name

**Solution:**
1. Check lot names in Google Sheet for unusual characters
2. Check event name in EventConfig for unusual characters
3. Sanitization should handle most cases automatically
4. If issues persist, manually clean up lot/event names

### Multiple Uploads for Same Lot on Same Day

**Behavior:** Each upload creates a new file with unique timestamp

**Expected:** This is correct behavior - timestamp ensures uniqueness

**Management:**
- Old files are not automatically deleted
- Directors can manually delete old files from Drive folder
- Consider implementing file cleanup logic in future

---

## Migration Notes

### Existing Images

- **Old images remain in their original folders**
- **Old Drive URLs continue to work**
- **No automatic migration of old images**
- **New uploads use the new folder and naming convention**

### Manual Migration (Optional)

If you want to migrate old images to the new folder:

1. Locate old images in the original "TBTC Sign-In Sheets" folder
2. Manually move or copy them to the new shared folder
3. Optionally rename them to match the new naming convention
4. Update Google Sheet URLs if files were moved (not copied)

**Note:** Manual migration is optional and not required for the app to function.

---

## Related Documentation

- [Bulk Upload Enhancements](./BULK-UPLOAD-ENHANCEMENTS.md) - Matching statistics and placeholder records
- [Frontend Image Display Guide](./FRONTEND-IMAGE-DISPLAY-GUIDE.md) - How to display images in React
- [Students Tab Columns Setup](./STUDENTS-TAB-COLUMNS-SETUP.md) - Placeholder student tracking

