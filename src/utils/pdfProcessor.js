/**
 * PDF Processing Utilities
 * Handles PDF file validation and page extraction to images
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker for pdf.js
// Use Vite's import.meta.url to correctly resolve the worker path
// This works reliably in both development and production builds
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href;
}

/**
 * Maximum PDF file size in bytes (50MB - PDFs can be larger than images)
 */
const MAX_PDF_SIZE = 50 * 1024 * 1024;

/**
 * Validate PDF file
 * @param {File} file - The file to validate
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export function validatePDFFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.type !== 'application/pdf') {
    return { 
      valid: false, 
      error: 'Invalid file type. Please upload a PDF file.' 
    };
  }

  if (file.size > MAX_PDF_SIZE) {
    return { 
      valid: false, 
      error: `PDF file too large. Maximum size is ${formatBytes(MAX_PDF_SIZE)}.` 
    };
  }

  return { valid: true, error: null };
}

/**
 * Extract all pages from a PDF and convert them to image files
 * @param {File} pdfFile - The PDF file to process
 * @param {Object} options - Processing options
 * @param {number} options.scale - Scale factor for rendering (default: 2.0 for better quality)
 * @returns {Promise<Array<File>>} - Array of image files (one per page)
 */
export async function extractPDFPagesToImages(pdfFile, options = {}) {
  const { scale = 2.0 } = options;

  try {
    console.log('📄 Loading PDF file:', pdfFile.name);

    // Read PDF file as array buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    // Load the PDF document
    // Use standard font/cmap settings to ensure better compatibility
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });
    const pdf = await loadingTask.promise;
    
    const numPages = pdf.numPages;
    console.log(`📄 PDF has ${numPages} pages`);

    if (numPages === 0) {
      throw new Error('PDF has 0 pages');
    }

    const imageFiles = [];

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      console.log(`📄 Processing page ${pageNum}/${numPages}...`);
      
      const page = await pdf.getPage(pageNum);
      
      // Set up viewport with scale
      const viewport = page.getViewport({ scale });
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Convert canvas to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });
      
      // Create File object from blob
      const imageFile = new File(
        [blob],
        `${pdfFile.name.replace('.pdf', '')}_page_${pageNum}.jpg`,
        {
          type: 'image/jpeg',
          lastModified: Date.now()
        }
      );
      
      imageFiles.push(imageFile);
      console.log(`✅ Page ${pageNum} converted to image (${formatBytes(imageFile.size)})`);
    }

    console.log(`✅ Successfully extracted ${imageFiles.length} pages from PDF`);
    return imageFiles;

  } catch (error) {
    console.error('❌ Error processing PDF:', error);
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
}

/**
 * Check if a file is a PDF
 * @param {File} file - The file to check
 * @returns {boolean} - True if file is a PDF
 */
export function isPDFFile(file) {
  return file && file.type === 'application/pdf';
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted string (e.g., "1.5 MB")
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

