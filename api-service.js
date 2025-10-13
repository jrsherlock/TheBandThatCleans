/**
 * API Service Layer for TBTC (The Band That Cleans)
 * Handles all communication with the Google Apps Script backend
 */

// Configuration - Update these values after deploying your Google Apps Script
const API_CONFIG = {
  // Google Apps Script Web App URL (TBTC - MVP with CORS fixes - Deployed 2025-09-30)
  BASE_URL: 'https://script.google.com/macros/s/AKfycbxNlt9phocm1x17BVBhSGqRbQ8P3U4ApHNpCdbWl1aCX791UMtQxzdU_RFxLwfTuezX/exec',
    
  // API key for authentication (matches MOCK_API_KEY in Code.gs)
  API_KEY: 'tbtc-director-key-2024',
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

/**
 * Utility function to add delay for retries
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced fetch with timeout, retries, and error handling
 * IMPORTANT: Google Apps Script has CORS limitations with POST requests
 * Solution: Use GET requests with URL parameters for all operations
 */
async function fetchWithRetry(url, options = {}, retries = API_CONFIG.MAX_RETRIES) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const fetchOptions = {
      ...options,
      signal: controller.signal,
      redirect: 'follow'  // Follow redirects automatically
    };

    // Don't set Content-Type header to avoid CORS preflight
    // Google Apps Script doesn't support OPTIONS requests properly

    const response = await fetch(url, fetchOptions);

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response
      );
    }

    const data = await response.json();

    // Check for application-level errors
    if (data.error) {
      throw new ApiError(data.error, data.httpStatus || 400, data);
    }

    return data;

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle network errors and timeouts with retries
    if (retries > 0 && (
      error.name === 'AbortError' ||
      error.name === 'TypeError' ||
      (error.status >= 500)
    )) {
      console.warn(`API request failed, retrying... (${retries} attempts left)`, error.message);
      await delay(API_CONFIG.RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }

    throw error;
  }
}

/**
 * Main API service class
 */
class TbtcApiService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.apiKey = API_CONFIG.API_KEY;
  }

  /**
   * Validate API configuration
   */
  validateConfig() {
    if (!this.baseUrl || this.baseUrl === 'YOUR_GAS_WEB_APP_URL_HERE') {
      throw new Error('API_CONFIG.BASE_URL must be set to your deployed Google Apps Script Web App URL');
    }
  }

  /**
   * GET request helper
   */
  async get(endpoint, params = {}) {
    this.validateConfig();

    const url = new URL(this.baseUrl);
    url.searchParams.append('action', endpoint);
    url.searchParams.append('apiKey', this.apiKey);

    // Add additional parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return fetchWithRetry(url.toString(), {
      method: 'GET'
    });
  }

  /**
   * POST request helper (converted to GET to avoid CORS issues)
   * WORKAROUND: Google Apps Script POST requests have redirect issues with fetch()
   * Solution: Use GET with payload in URL parameter
   * NOTE: This has URL length limits - use postWithBody() for large payloads
   */
  async post(payload) {
    this.validateConfig();

    const requestPayload = {
      ...payload,
      apiKey: this.apiKey
    };

    // Convert POST to GET with payload parameter
    const payloadParam = encodeURIComponent(JSON.stringify(requestPayload));
    const url = `${this.baseUrl}?action=update&payload=${payloadParam}`;

    return fetchWithRetry(url, {
      method: 'GET'
    });
  }

  /**
   * POST request with body (for large payloads like image uploads)
   * Uses URL-encoded form data to avoid CORS preflight issues with Google Apps Script
   * Google Apps Script receives this in e.parameter (not e.postData)
   */
  async postWithBody(payload) {
    this.validateConfig();

    const requestPayload = {
      ...payload,
      apiKey: this.apiKey
    };

    // Use URLSearchParams for application/x-www-form-urlencoded
    // This avoids CORS preflight and works reliably with Google Apps Script
    const formBody = new URLSearchParams();
    formBody.append('payload', JSON.stringify(requestPayload));

    const url = `${this.baseUrl}`;

    return fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody.toString(),
      redirect: 'follow'
    });
  }

  // --- DATA RETRIEVAL METHODS ---

  /**
   * Fetch all lots and students data for initialization
   */
  async fetchInitialData() {
    try {
      const response = await this.get('data');

      // Convert date strings back to Date objects
      if (response.lots) {
        response.lots.forEach(lot => {
          if (lot.lastUpdated) lot.lastUpdated = new Date(lot.lastUpdated);
          if (lot.actualStartTime) lot.actualStartTime = new Date(lot.actualStartTime);
          if (lot.completedTime) lot.completedTime = new Date(lot.completedTime);
        });
      }

      if (response.students) {
        response.students.forEach(student => {
          if (student.checkInTime) student.checkInTime = new Date(student.checkInTime);
        });
      }

      return response;
    } catch (error) {
      console.error('Failed to fetch initial data:', error);

      // If it's a CORS error, provide helpful message
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        throw new ApiError('CORS error detected. Please verify your Google Apps Script is deployed with "Anyone" access, or test the Web App URL directly in your browser first.', 500);
      }

      throw new ApiError('Failed to load initial data. Please check your connection and try again.', 500);
    }
  }

  /**
   * Generate and fetch attendance report
   */
  async fetchReport() {
    try {
      return await this.get('report');
    } catch (error) {
      console.error('Failed to fetch report:', error);
      throw new ApiError('Failed to generate report. Please try again.', 500);
    }
  }

  // --- LOT MANAGEMENT METHODS ---

  /**
   * Update a single lot's status
   */
  async updateLotStatus(lotId, status, updatedBy = 'Director') {
    try {
      return await this.post({
        type: 'UPDATE_LOT_STATUS',
        lotId,
        status,
        updatedBy
      });
    } catch (error) {
      console.error('Failed to update lot status:', error);
      throw new ApiError(`Failed to update ${lotId} status. Please try again.`, 500);
    }
  }

  /**
   * Update multiple lots' status (bulk operation)
   */
  async updateBulkLotStatus(lotIds, status, updatedBy = 'Director') {
    try {
      return await this.post({
        type: 'UPDATE_BULK_STATUS',
        lotIds,
        status,
        updatedBy
      });
    } catch (error) {
      console.error('Failed to update bulk lot status:', error);
      throw new ApiError(`Failed to update ${lotIds.length} lots. Please try again.`, 500);
    }
  }

  /**
   * Update lot details (comment, student count, photos)
   */
  async updateLotDetails(lotId, details, updatedBy = 'Director') {
    try {
      return await this.post({
        type: 'UPDATE_LOT_DETAILS',
        lotId,
        ...details,
        updatedBy
      });
    } catch (error) {
      console.error('Failed to update lot details:', error);
      throw new ApiError(`Failed to update ${lotId} details. Please try again.`, 500);
    }
  }

  // --- STUDENT MANAGEMENT METHODS ---

  /**
   * Update student check-in/out status
   */
  async updateStudentStatus(studentId, updates) {
    try {
      return await this.post({
        type: 'UPDATE_STUDENT_STATUS',
        studentId,
        updates
      });
    } catch (error) {
      console.error('Failed to update student status:', error);
      throw new ApiError(`Failed to update student status. Please try again.`, 500);
    }
  }

  // --- EVENT CONFIGURATION METHODS ---

  /**
   * Get event configuration (check-out toggle state)
   */
  async getEventConfig() {
    try {
      return await this.get('eventConfig');
    } catch (error) {
      console.error('Failed to fetch event config:', error);
      throw new ApiError('Failed to load event configuration. Please try again.', 500);
    }
  }

  /**
   * Update event configuration (check-out toggle)
   */
  async updateEventConfig(checkOutEnabled, eventId = 'event-current', eventName = null) {
    try {
      return await this.post({
        type: 'UPDATE_EVENT_CONFIG',
        checkOutEnabled,
        eventId,
        eventName
      });
    } catch (error) {
      console.error('Failed to update event config:', error);
      throw new ApiError('Failed to update event configuration. Please try again.', 500);
    }
  }

  // --- OCR AND IMAGE PROCESSING ---

  /**
   * Upload image for OCR processing
   */
  async uploadImageForOcr(lotId, imageData, updatedBy = 'Director') {
    try {
      return await this.post({
        type: 'OCR_UPLOAD',
        lotId,
        data: imageData,
        updatedBy
      });
    } catch (error) {
      console.error('Failed to process OCR upload:', error);
      throw new ApiError('Failed to process image upload. Please try again.', 500);
    }
  }

  // --- AI-ASSISTED SIGN-IN SHEET UPLOAD ---

  /**
   * Upload sign-in sheet with AI analysis or manual count
   * Uses POST with body to handle large image data
   * @param {Object} payload - Upload payload
   * @param {string} payload.lotId - Lot ID
   * @param {number} payload.aiCount - AI-detected student count (optional)
   * @param {number} payload.manualCount - Manual student count (optional)
   * @param {string} payload.aiConfidence - AI confidence level: "high", "medium", "low" (optional)
   * @param {string} payload.countSource - Source: "ai" or "manual" (optional)
   * @param {string} payload.enteredBy - Name of user who submitted (optional)
   * @param {string} payload.imageData - Base64 encoded image (optional)
   * @param {string} payload.notes - Additional notes (optional)
   * @param {Array<string>} payload.studentNames - Array of extracted student names for auto check-in (optional)
   */
  async uploadSignInSheet(payload) {
    try {
      // Use postWithBody for large payloads (images can be very large)
      return await this.postWithBody({
        type: 'UPLOAD_SIGNIN_SHEET',
        ...payload
      });
    } catch (error) {
      console.error('Failed to upload sign-in sheet:', error);
      throw new ApiError('Failed to upload sign-in sheet. Please try again.', 500);
    }
  }

  /**
   * Reconcile a placeholder student with an actual student from the roster
   * Merges placeholder check-in data with the real student record
   * @param {string} placeholderId - ID of the placeholder student (e.g., "placeholder-lot48-1")
   * @param {string} actualStudentId - ID of the actual student from the roster
   */
  async reconcilePlaceholderStudent(placeholderId, actualStudentId) {
    try {
      return await this.post({
        type: 'RECONCILE_PLACEHOLDER',
        placeholderId,
        actualStudentId
      });
    } catch (error) {
      console.error('Failed to reconcile placeholder student:', error);
      throw new ApiError('Failed to reconcile placeholder student. Please try again.', 500);
    }
  }
}

// Create and export singleton instance
const apiService = new TbtcApiService();

export default apiService;
export { ApiError };
