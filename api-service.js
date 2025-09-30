/**
 * API Service Layer for TBTC (The Band That Cleans)
 * Handles all communication with the Google Apps Script backend
 */

// Configuration - Update these values after deploying your Google Apps Script
const API_CONFIG = {
  // Replace with your deployed Google Apps Script Web App URL
  BASE_URL: 'https://script.google.com/macros/s/AKfycbyDxwxwsN14CYvHS8mGgVcFYMWjFAykVBNUlAx0fW7E7wXi9rE2_vgwrKNn_Ezq6X6M/exec',
    
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
 */
async function fetchWithRetry(url, options = {}, retries = API_CONFIG.MAX_RETRIES) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    // For GET requests, don't set Content-Type to avoid CORS preflight
    const fetchOptions = {
      ...options,
      signal: controller.signal
    };

    // Only add Content-Type for POST requests with body
    if (options.method === 'POST' && options.body) {
      fetchOptions.headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
    }

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
   * POST request helper
   */
  async post(payload) {
    this.validateConfig();

    const requestPayload = {
      ...payload,
      apiKey: this.apiKey
    };

    return fetchWithRetry(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(requestPayload)
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
}

// Create and export singleton instance
const apiService = new TbtcApiService();

export default apiService;
export { ApiError };
