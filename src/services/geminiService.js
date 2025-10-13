/**
 * Google Gemini AI Service
 * Handles image analysis for sign-in sheet student counting
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// List of models to try in order of preference
// Google has updated model names - try newer models first, fall back to older ones
const MODEL_PRIORITY = [
  'gemini-2.0-flash-exp',      // Latest experimental model
  'gemini-1.5-flash-latest',   // Latest stable 1.5 flash
  'gemini-1.5-flash',          // Standard 1.5 flash
  'gemini-1.5-pro-latest',     // Latest stable 1.5 pro
  'gemini-1.5-pro',            // Standard 1.5 pro
  'gemini-pro-vision'          // Fallback to older vision model
];

const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || MODEL_PRIORITY[0];

// Validate API key on module load
if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
  console.warn('⚠️ Gemini API key not configured. AI features will not work.');
  console.warn('Please set VITE_GEMINI_API_KEY in your .env file');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Analyze sign-in sheet image and extract student count
 * 
 * @param {File} imageFile - The uploaded image file
 * @param {string} lotName - Name of the parking lot for context
 * @param {string} lotId - ID of the parking lot
 * @returns {Promise<{count: number, lotIdentified: string, confidence: string, notes: string}>}
 */
export async function analyzeSignInSheet(imageFile, lotName, lotId) {
  // Validate API key
  if (!genAI) {
    throw new Error('Gemini API not configured. Please set VITE_GEMINI_API_KEY in .env file');
  }

  // Validate inputs
  if (!imageFile) {
    throw new Error('No image file provided');
  }

  if (!imageFile.type.startsWith('image/')) {
    throw new Error('Invalid file type. Please upload an image file (JPEG, PNG, etc.)');
  }

  // Check file size (max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (imageFile.size > MAX_SIZE) {
    throw new Error('Image file too large. Please upload an image smaller than 5MB');
  }

  try {
    console.log('🤖 Analyzing sign-in sheet with Gemini AI...', {
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type,
      lotName,
      lotId
    });

    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);

    // Get model configuration with fallbacks
    const modelConfig = getAvailableModel();
    let currentModel = modelConfig.model;
    let currentModelName = modelConfig.modelName;
    const fallbackModels = modelConfig.fallbackModels;
    
    // Craft detailed prompt for student name extraction and counting
    const prompt = `
You are analyzing a parking lot cleanup sign-in sheet for "${lotName}" (Lot ID: ${lotId}).

This is a physical sign-in sheet where students manually write their names and check-in times for a band cleanup event.

TASK:
1. Extract the FULL NAME of each student who has SIGNED IN (has an entry in the "Student Name" column)
2. Count the TOTAL number of students who signed in
3. Look for the lot identification information at the top of the sheet (Zone, Lot Number, Lot Name, Address)
4. Verify the lot information matches "${lotName}"
5. Note the quality of the image and any issues

IMPORTANT EXTRACTION RULES:
- Extract the COMPLETE name as written (e.g., "Smith, John" or "John Smith")
- Only extract names from rows where a student name is clearly written
- Ignore empty rows
- Ignore header rows
- Extract all students regardless of whether they have a time-out entry
- If a row has a name but is crossed out or marked as invalid, do NOT extract it
- Preserve the name format as written (Last, First or First Last)
- If handwriting is unclear but you can make out most of the name, include it with a note

Please respond ONLY with valid JSON in this exact format:
{
  "studentCount": <number of students who signed in>,
  "studentNames": [
    "Name as written on sheet",
    "Another Name",
    ...
  ],
  "lotIdentified": "<lot name/number found on sheet>",
  "zoneIdentified": "<zone found on sheet, if any>",
  "confidence": "high|medium|low",
  "notes": "<any observations about sheet quality, issues, or discrepancies>",
  "illegibleNames": [
    "Partial name or description of illegible entry",
    ...
  ]
}

CONFIDENCE LEVELS:
- "high": Image is clear, all names are legible, lot info matches
- "medium": Image is acceptable, most names are legible, minor issues
- "low": Image is blurry, hard to read, or lot info doesn't match

EXAMPLES:
- If you see "Smith, John" written clearly → include in studentNames
- If you see "J. Smith" or partial name → include in studentNames with note
- If you see scribbled text that might be a name → include in illegibleNames
- If row is completely empty → ignore it

Be precise and thorough. Extract all readable names, even if handwriting is imperfect.
    `.trim();

    // Try to generate content with fallback logic
    let result;
    let response;
    let text;
    let lastError;

    // Try current model first, then fallback models
    const allModels = [currentModelName, ...fallbackModels];

    for (let i = 0; i < allModels.length; i++) {
      const modelName = allModels[i];

      try {
        console.log(`🔍 Attempting analysis with model: ${modelName}`);

        // Get fresh model instance for this attempt
        const attemptModel = genAI.getGenerativeModel({ model: modelName });

        // Generate content with image
        result = await attemptModel.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: imageFile.type,
              data: base64Image
            }
          }
        ]);

        response = await result.response;
        text = response.text();

        console.log(`✅ Success with model: ${modelName}`);
        console.log('🤖 Gemini raw response:', text);

        // Success! Break out of retry loop
        break;

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Model ${modelName} failed: ${error.message}`);

        // If this is the last model, throw the error
        if (i === allModels.length - 1) {
          console.error('❌ All models failed');
          throw error;
        }

        // Otherwise, continue to next model
        console.log(`📋 Trying next fallback model...`);
      }
    }
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response. Response was not in expected JSON format.');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate response structure
    if (typeof analysis.studentCount !== 'number') {
      throw new Error('Invalid AI response: studentCount must be a number');
    }

    if (analysis.studentCount < 0) {
      throw new Error('Invalid AI response: studentCount cannot be negative');
    }

    // Validate studentNames array
    if (!Array.isArray(analysis.studentNames)) {
      console.warn('⚠️ studentNames not provided or not an array, defaulting to empty array');
      analysis.studentNames = [];
    }

    // Ensure illegibleNames is an array
    if (!Array.isArray(analysis.illegibleNames)) {
      analysis.illegibleNames = [];
    }

    if (analysis.studentCount > 50) {
      console.warn('⚠️ Unusually high student count detected:', analysis.studentCount);
      analysis.notes = (analysis.notes || '') + ' WARNING: Unusually high count detected. Please verify manually.';
      analysis.confidence = 'low';
    }

    // Validate that studentCount matches studentNames length (with some tolerance)
    if (analysis.studentNames.length > 0 &&
        Math.abs(analysis.studentCount - analysis.studentNames.length) > 2) {
      console.warn('⚠️ Mismatch between studentCount and studentNames array length');
      analysis.notes = (analysis.notes || '') + ` Note: Count (${analysis.studentCount}) differs from extracted names (${analysis.studentNames.length}).`;
    }

    const result_data = {
      count: analysis.studentCount || 0,
      studentNames: analysis.studentNames || [],
      illegibleNames: analysis.illegibleNames || [],
      lotIdentified: analysis.lotIdentified || '',
      zoneIdentified: analysis.zoneIdentified || '',
      confidence: analysis.confidence || 'low',
      notes: analysis.notes || '',
      rawResponse: text,
      analyzedAt: new Date().toISOString()
    };

    console.log('✅ Gemini analysis complete:', result_data);
    
    return result_data;
    
  } catch (error) {
    console.error('❌ Gemini API Error:', error);

    // Provide user-friendly error messages
    if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid API key. Please check your Gemini API configuration in the .env file.');
    }

    if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('API quota exceeded. Please try again later or contact support.');
    }

    if (error.message?.includes('not found') || error.message?.includes('404')) {
      throw new Error(
        'Gemini model not available. The AI service may be updating. Please try manual entry or try again later.'
      );
    }

    if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }

    if (error.message?.includes('No Gemini models available')) {
      throw new Error(error.message); // Pass through our custom error
    }

    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Get an available Gemini model, trying multiple models in priority order
 * This function returns a model instance but doesn't test it (testing happens on first use)
 *
 * @returns {Object} Gemini model instance
 */
function getAvailableModel() {
  if (!genAI) {
    throw new Error('Gemini API not initialized');
  }

  // Build list of models to try
  const modelsToTry = [];

  // If user specified a model in env, add it first
  if (import.meta.env.VITE_GEMINI_MODEL) {
    modelsToTry.push(import.meta.env.VITE_GEMINI_MODEL);
  }

  // Add all priority models
  modelsToTry.push(...MODEL_PRIORITY);

  // Remove duplicates
  const uniqueModels = [...new Set(modelsToTry)];

  console.log(`📋 Will try models in order: ${uniqueModels.join(', ')}`);

  // Return the first model - actual testing happens when we call generateContent
  const firstModel = uniqueModels[0];
  console.log(`🔍 Starting with model: ${firstModel}`);

  return {
    model: genAI.getGenerativeModel({ model: firstModel }),
    modelName: firstModel,
    fallbackModels: uniqueModels.slice(1)
  };
}

/**
 * Convert File to base64 string (without data URL prefix)
 *
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 encoded string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Check if Gemini API is configured and available
 * 
 * @returns {boolean} True if API is configured
 */
export function isGeminiConfigured() {
  return !!genAI && !!API_KEY && API_KEY !== 'your_gemini_api_key_here';
}

/**
 * Get Gemini configuration status
 * 
 * @returns {Object} Configuration status
 */
export function getGeminiStatus() {
  return {
    configured: isGeminiConfigured(),
    model: MODEL_NAME,
    hasApiKey: !!API_KEY && API_KEY !== 'your_gemini_api_key_here'
  };
}

export default {
  analyzeSignInSheet,
  isGeminiConfigured,
  getGeminiStatus
};

