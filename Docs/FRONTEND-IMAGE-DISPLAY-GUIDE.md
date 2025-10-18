# Frontend Image Display Guide

## 🖼️ **How to Display Drive Images in Your App**

Now that images are stored in Google Drive, you'll receive URLs instead of base64 data. Here's how to use them.

---

## 📥 **What the API Returns**

### **Upload Response:**

When you upload a sign-in sheet, the API now returns:

```javascript
{
  success: true,
  message: "Parking Lot Cleanup Sign-in sheet uploaded successfully",
  lotId: "A1",
  studentCount: 15,
  countSource: "ai",
  confidence: "high",
  timestamp: "2025-01-15T10:30:00.000Z",
  
  // NEW: Image upload information
  imageUpload: {
    fileId: "1abc123def456...",
    viewUrl: "https://drive.google.com/uc?export=view&id=1abc123def456...",
    fileName: "signin_sheet_A1_1234567890.jpg",
    uploadedAt: "2025-01-15T10:30:00.000Z"
  }
}
```

### **Lot Data from fetchInitialData():**

When you fetch lot data, the `signUpSheetPhoto` field now contains a URL:

```javascript
{
  id: "A1",
  name: "Lot A1",
  // ... other fields ...
  signUpSheetPhoto: "https://drive.google.com/uc?export=view&id=1abc123def456..."
}
```

---

## 🎨 **Displaying Images in React**

### **Option 1: Simple Image Tag**

```jsx
function LotImage({ lot }) {
  if (!lot.signUpSheetPhoto) {
    return <div>No image uploaded</div>;
  }

  return (
    <img 
      src={lot.signUpSheetPhoto} 
      alt={`Sign-in sheet for ${lot.name}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
```

### **Option 2: With Loading State**

```jsx
function LotImage({ lot }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!lot.signUpSheetPhoto) {
    return <div>No image uploaded</div>;
  }

  return (
    <div>
      {loading && <div>Loading image...</div>}
      {error && <div>Failed to load image</div>}
      <img 
        src={lot.signUpSheetPhoto}
        alt={`Sign-in sheet for ${lot.name}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        style={{ 
          display: loading ? 'none' : 'block',
          maxWidth: '100%', 
          height: 'auto' 
        }}
      />
    </div>
  );
}
```

### **Option 3: Modal/Lightbox View**

```jsx
function LotImageModal({ lot, onClose }) {
  if (!lot.signUpSheetPhoto) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}>Close</button>
        <img 
          src={lot.signUpSheetPhoto}
          alt={`Sign-in sheet for ${lot.name}`}
          style={{ maxWidth: '90vw', maxHeight: '90vh' }}
        />
        <div className="image-info">
          <p>Lot: {lot.name}</p>
          <p>Students: {lot.aiStudentCount || lot.totalStudentsSignedUp}</p>
          <a 
            href={lot.signUpSheetPhoto} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Open in Drive
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔄 **Updating Your Upload Component**

### **Before (with base64):**

```jsx
async function handleUpload(lotId, imageData, aiCount) {
  const response = await apiService.uploadSignInSheet({
    lotId,
    imageData,  // base64 string
    aiCount,
    aiConfidence: 'high',
    enteredBy: currentUser.name
  });
  
  // Response only had basic info
  console.log('Uploaded:', response.lotId);
}
```

### **After (with Drive URLs):**

```jsx
async function handleUpload(lotId, imageData, aiCount) {
  const response = await apiService.uploadSignInSheet({
    lotId,
    imageData,  // Still send base64 (backend handles Drive upload)
    aiCount,
    aiConfidence: 'high',
    enteredBy: currentUser.name
  });
  
  // Response now includes Drive info
  if (response.imageUpload) {
    console.log('Image uploaded to Drive:', response.imageUpload.viewUrl);
    console.log('File ID:', response.imageUpload.fileId);
    
    // Update local state with the Drive URL
    updateLotImage(lotId, response.imageUpload.viewUrl);
  }
}
```

---

## 🗂️ **Checking for Old vs New Format**

If you have existing data with base64 images, you'll need to handle both formats:

```jsx
function isBase64Image(data) {
  return data && data.startsWith('data:image');
}

function isDriveUrl(data) {
  return data && data.startsWith('https://drive.google.com');
}

function LotImage({ lot }) {
  const imageData = lot.signUpSheetPhoto;

  if (!imageData) {
    return <div>No image uploaded</div>;
  }

  // Handle old base64 format
  if (isBase64Image(imageData)) {
    return (
      <div>
        <img src={imageData} alt={`Sign-in sheet for ${lot.name}`} />
        <p className="warning">Old format - will be replaced on next upload</p>
      </div>
    );
  }

  // Handle new Drive URL format
  if (isDriveUrl(imageData)) {
    return (
      <img 
        src={imageData} 
        alt={`Sign-in sheet for ${lot.name}`}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    );
  }

  // Handle error messages (e.g., "[Upload failed: ...]")
  if (imageData.startsWith('[')) {
    return <div className="error">{imageData}</div>;
  }

  return <div>Invalid image data</div>;
}
```

---

## 🎯 **Best Practices**

### **1. Always Check for Image Existence**

```jsx
const hasImage = lot.signUpSheetPhoto && 
                 lot.signUpSheetPhoto.startsWith('https://');
```

### **2. Provide Fallback UI**

```jsx
{hasImage ? (
  <img src={lot.signUpSheetPhoto} alt="Sign-in sheet" />
) : (
  <div className="no-image">
    <CameraIcon />
    <p>No sign-in sheet uploaded</p>
  </div>
)}
```

### **3. Add Loading States**

```jsx
const [imageLoaded, setImageLoaded] = useState(false);

<img 
  src={lot.signUpSheetPhoto}
  onLoad={() => setImageLoaded(true)}
  style={{ opacity: imageLoaded ? 1 : 0.5 }}
/>
```

### **4. Handle Errors Gracefully**

```jsx
const [imageError, setImageError] = useState(false);

{!imageError ? (
  <img 
    src={lot.signUpSheetPhoto}
    onError={() => setImageError(true)}
  />
) : (
  <div className="error">
    Failed to load image
    <button onClick={() => setImageError(false)}>Retry</button>
  </div>
)}
```

---

## 🔗 **Opening Images in New Tab**

```jsx
function openImageInNewTab(imageUrl) {
  window.open(imageUrl, '_blank', 'noopener,noreferrer');
}

// Usage:
<button onClick={() => openImageInNewTab(lot.signUpSheetPhoto)}>
  View Full Size
</button>
```

---

## 📱 **Responsive Image Display**

```jsx
function ResponsiveLotImage({ lot }) {
  if (!lot.signUpSheetPhoto) return null;

  return (
    <div className="image-container">
      <img 
        src={lot.signUpSheetPhoto}
        alt={`Sign-in sheet for ${lot.name}`}
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: '600px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      />
    </div>
  );
}
```

---

## 🎨 **Thumbnail vs Full Size**

Google Drive URLs support size parameters:

```jsx
// Thumbnail (faster loading)
const thumbnailUrl = lot.signUpSheetPhoto.replace(
  'export=view',
  'export=view&sz=w400'  // 400px width
);

// Full size
const fullSizeUrl = lot.signUpSheetPhoto;

// Usage:
<img 
  src={thumbnailUrl}
  onClick={() => openModal(fullSizeUrl)}
  style={{ cursor: 'pointer' }}
/>
```

---

## 🔍 **Example: Complete Image Viewer Component**

```jsx
import React, { useState } from 'react';

function SignInSheetViewer({ lot }) {
  const [showModal, setShowModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const hasImage = lot.signUpSheetPhoto && 
                   lot.signUpSheetPhoto.startsWith('https://');

  if (!hasImage) {
    return (
      <div className="no-image-placeholder">
        <p>No sign-in sheet uploaded for {lot.name}</p>
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail */}
      <div className="thumbnail-container">
        {!imageLoaded && <div className="loading-spinner">Loading...</div>}
        {imageError && <div className="error">Failed to load</div>}
        <img 
          src={lot.signUpSheetPhoto}
          alt={`Sign-in sheet for ${lot.name}`}
          onClick={() => setShowModal(true)}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          style={{
            display: imageError ? 'none' : 'block',
            cursor: 'pointer',
            maxWidth: '200px',
            borderRadius: '4px'
          }}
        />
      </div>

      {/* Full Size Modal */}
      {showModal && (
        <div 
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div className="modal-content">
            <button onClick={() => setShowModal(false)}>Close</button>
            <img 
              src={lot.signUpSheetPhoto}
              alt={`Sign-in sheet for ${lot.name}`}
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
            />
            <div className="image-metadata">
              <p>Lot: {lot.name}</p>
              <p>Students: {lot.aiStudentCount || 'N/A'}</p>
              <p>Uploaded: {lot.aiAnalysisTimestamp || 'N/A'}</p>
              <a 
                href={lot.signUpSheetPhoto}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Google Drive
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SignInSheetViewer;
```

---

## ✅ **Migration Checklist**

- [ ] Update image display components to use URLs instead of base64
- [ ] Add loading states for images
- [ ] Add error handling for failed image loads
- [ ] Handle both old (base64) and new (URL) formats during transition
- [ ] Test image display on different screen sizes
- [ ] Test opening images in new tabs
- [ ] Verify images load correctly from Drive

---

**Your images are now stored efficiently in Google Drive!** 🎉

