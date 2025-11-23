/**
 * Google Gemini AI Service
 * Handles image analysis for sign-in sheet student counting
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// List of models to try in order of preference
// Using correct model names for v1beta API
const MODEL_PRIORITY = [
  'gemini-1.5-flash-latest',   // Latest 1.5 flash (Recommended for speed/cost)
  'gemini-1.5-pro-latest',     // Latest 1.5 pro (Higher intelligence)
];

const MODEL_NAME = MODEL_PRIORITY[0];

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
- **CRITICAL: Extract ALL student names that are clearly written in the sign-in sheet**
- Only extract names from rows where a student name is clearly written
- Ignore empty rows
- Ignore header rows
- Extract all students regardless of whether they have a time-out entry
- **IMPORTANT: Only skip a name if it has a clear line drawn through it (crossed out)**
- Do NOT skip names just because they have minor marks, corrections, or messy handwriting nearby
- A name is only "crossed out" if there is an obvious horizontal or diagonal line through the entire name
- Preserve the name format as written (Last, First or First Last)
- If handwriting is unclear but you can make out most of the name, include it with a note
- **IMPORTANT: The studentCount field MUST exactly match the number of names in the studentNames array**
- Count every single non-crossed-out name, even if handwriting is messy or partially illegible
- When in doubt about whether a name is crossed out, INCLUDE it in the extraction

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
        const errorMessage = error.message || '';
        
        // Handle rate limiting (429) - wait before trying next model
        if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          console.warn(`⚠️ Rate limit hit for ${modelName}. Waiting 60 seconds before trying next model...`);
          
          // Wait 60 seconds before trying next model (rate limits are usually per minute)
          if (i < allModels.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 60000));
            console.log(`📋 Trying next fallback model after rate limit wait...`);
            continue;
          } else {
            throw new Error('API rate limit exceeded. Please wait a few minutes and try again.');
          }
        }
        
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

    // CRITICAL FIX: Use studentNames.length as the authoritative count
    // The AI sometimes reports a different count than the number of names extracted
    // We trust the actual extracted names array over the reported count
    const actualStudentCount = analysis.studentNames.length;

    // Log discrepancy if AI count doesn't match extracted names
    if (analysis.studentCount !== actualStudentCount) {
      console.warn(`⚠️ AI count mismatch: AI reported ${analysis.studentCount} but extracted ${actualStudentCount} names. Using extracted names count.`);
      analysis.notes = (analysis.notes || '') + ` [Note: AI reported count ${analysis.studentCount} adjusted to match ${actualStudentCount} extracted names]`;
    }

    if (actualStudentCount > 50) {
      console.warn('⚠️ Unusually high student count detected:', actualStudentCount);
      analysis.notes = (analysis.notes || '') + ' WARNING: Unusually high count detected. Please verify manually.';
      analysis.confidence = 'low';
    }

    const result_data = {
      count: actualStudentCount, // Use actual extracted names count, not AI's reported count
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

    if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429') || error.message?.includes('Too Many Requests') || error.message?.includes('rate limit')) {
      throw new Error('API rate limit exceeded. Please wait a few minutes and try again. You may have made too many requests in a short time.');
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

  // Ignore env variable if it points to deprecated models, otherwise prioritize it
  if (import.meta.env.VITE_GEMINI_MODEL) {
    const envModel = import.meta.env.VITE_GEMINI_MODEL;
    // Filter out deprecated or problematic models
    if (envModel === 'gemini-pro-vision' || envModel === 'gemini-pro' || 
        envModel === 'gemini-1.5-flash' || envModel === 'gemini-1.5-pro') {
       console.warn(`⚠️ VITE_GEMINI_MODEL is set to "${envModel}" which may not be available. Using stable defaults.`);
    } else {
       modelsToTry.push(envModel);
    }
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

/**
 * Analyze multiple sign-in sheet images in bulk
 * Automatically identifies lot names from image headers and matches against available lots
 *
 * @param {Array<File>} imageFiles - Array of uploaded image files
 * @param {Array<Object>} availableLots - Array of lot objects with id and name properties
 * @param {Function} progressCallback - Optional callback for progress updates (0-100)
 * @returns {Promise<{successful: Array, failed: Array}>}
 */
export async function analyzeBulkSignInSheets(imageFiles, availableLots, progressCallback = null) {
  // Validate API key
  if (!genAI) {
    throw new Error('Gemini API not configured. Please set VITE_GEMINI_API_KEY in .env file');
  }

  if (!imageFiles || imageFiles.length === 0) {
    throw new Error('No image files provided');
  }

  if (!availableLots || availableLots.length === 0) {
    throw new Error('No parking lots available for matching');
  }

  const results = {
    successful: [],
    failed: []
  };

  const totalFiles = imageFiles.length;
  let processedCount = 0;

  console.log(`🚀 Starting bulk analysis of ${totalFiles} sign-in sheets...`);

  // Process each image sequentially to avoid rate limiting
  for (const imageFile of imageFiles) {
    try {
      console.log(`📄 Processing: ${imageFile.name}`);

      // Analyze the image without specifying a lot (AI will identify it)
      const analysis = await analyzeSignInSheetWithLotIdentification(imageFile, availableLots);

      // Match the identified lot name against available lots
      const matchedLot = findMatchingLot(analysis.lotIdentified, availableLots);

      if (!matchedLot) {
        throw new Error(`Could not match lot "${analysis.lotIdentified}" to any available parking lot`);
      }

      results.successful.push({
        fileName: imageFile.name,
        lotId: matchedLot.id,
        lotName: matchedLot.name,
        studentCount: analysis.count,
        studentNames: analysis.studentNames,
        illegibleNames: analysis.illegibleNames,
        confidence: analysis.confidence,
        notes: analysis.notes,
        eventDate: analysis.eventDate,
        zoneIdentified: analysis.zoneIdentified,
        imageFile: imageFile,
        analysis: analysis
      });

      console.log(`✅ Success: ${imageFile.name} → ${matchedLot.name} (${analysis.count} students)`);

    } catch (error) {
      console.error(`❌ Failed: ${imageFile.name}`, error);
      results.failed.push({
        fileName: imageFile.name,
        error: error.message || 'Processing failed'
      });
    }

    // Update progress
    processedCount++;
    const progress = Math.round((processedCount / totalFiles) * 100);
    if (progressCallback) {
      progressCallback(progress);
    }
  }

  console.log(`🏁 Bulk analysis complete: ${results.successful.length} successful, ${results.failed.length} failed`);

  return results;
}

/**
 * Analyze sign-in sheet image and identify the lot from the header
 * Enhanced version that extracts lot name, zone, and event date from the image
 *
 * @param {File} imageFile - The uploaded image file
 * @param {Array<Object>} availableLots - Array of lot objects for context
 * @returns {Promise<Object>} Analysis results with lot identification
 */
async function analyzeSignInSheetWithLotIdentification(imageFile, availableLots) {
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
    console.log('🤖 Analyzing sign-in sheet with lot identification...', {
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type
    });

    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);

    // Get model configuration with fallbacks
    const modelConfig = getAvailableModel();
    let currentModel = modelConfig.model;
    let currentModelName = modelConfig.modelName;
    const fallbackModels = modelConfig.fallbackModels;

    // Create list of lot names for AI context
    const lotNamesList = availableLots.map(lot => lot.name).join(', ');

    // Enhanced prompt for lot identification
    const prompt = `
You are analyzing a parking lot cleanup sign-in sheet image.

This is a physical sign-in sheet where students manually write their names and check-in times for a band cleanup event.

TASK:
1. Extract the LOT IDENTIFICATION from the header (Zone, Lot Number, Lot Name, Address)
2. Extract the EVENT DATE from the header (e.g., "2025 Clean Up #2: September 14th")
3. Extract the FULL NAME of each student who has SIGNED IN
4. Count the TOTAL number of students who signed in
5. Note the quality of the image and any issues

HEADER INFORMATION TO EXTRACT:
- Zone (e.g., "Zone 1 East Side of River")
- Lot Number and Name (e.g., "Lot 3: Library Lot")
- Address (e.g., "123 Museum Drive")
- Event Date (e.g., "2025 Clean Up #2: September 14th")

AVAILABLE PARKING LOTS (for reference):
${lotNamesList}

IMPORTANT EXTRACTION RULES:
- Extract the COMPLETE lot name as it appears in the header
- Extract the event date exactly as written
- Extract the COMPLETE student name as written (e.g., "Smith, John" or "John Smith")
- **CRITICAL: Extract ALL student names that are clearly written in the sign-in sheet**
- Only extract names from rows where a student name is clearly written
- Ignore empty rows and header rows
- **IMPORTANT: Only skip a name if it has a clear line drawn through it (crossed out)**
- Do NOT skip names just because they have minor marks, corrections, or messy handwriting nearby
- A name is only "crossed out" if there is an obvious horizontal or diagonal line through the entire name
- Preserve the name format as written (Last, First or First Last)
- **IMPORTANT: The studentCount field MUST exactly match the number of names in the studentNames array**
- Count every single non-crossed-out name, even if handwriting is messy or partially illegible
- When in doubt about whether a name is crossed out, INCLUDE it in the extraction

Please respond ONLY with valid JSON in this exact format:
{
  "lotIdentified": "<exact lot name from header>",
  "zoneIdentified": "<zone from header, if any>",
  "eventDate": "<event date from header, if any>",
  "studentCount": <number of students who signed in>,
  "studentNames": [
    "Name as written on sheet",
    "Another Name",
    ...
  ],
  "confidence": "high|medium|low",
  "notes": "<any observations about sheet quality, issues, or discrepancies>",
  "illegibleNames": [
    "Partial name or description of illegible entry",
    ...
  ]
}

CONFIDENCE LEVELS:
- "high": Image is clear, all names are legible, lot info is clear
- "medium": Image is acceptable, most names are legible, minor issues
- "low": Image is blurry, hard to read, or lot info is unclear

Be precise and thorough. Extract all readable information from the header and student names.
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
        const errorMessage = error.message || '';
        
        // Handle rate limiting (429) - wait before trying next model
        if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          console.warn(`⚠️ Rate limit hit for ${modelName}. Waiting 60 seconds before trying next model...`);
          
          // Wait 60 seconds before trying next model (rate limits are usually per minute)
          if (i < allModels.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 60000));
            console.log(`📋 Trying next fallback model after rate limit wait...`);
            continue;
          } else {
            throw new Error('API rate limit exceeded. Please wait a few minutes and try again.');
          }
        }
        
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

    // Validate lot identification
    if (!analysis.lotIdentified || analysis.lotIdentified.trim() === '') {
      throw new Error('Could not identify lot name from image header');
    }

    // CRITICAL FIX: Use studentNames.length as the authoritative count
    // The AI sometimes reports a different count than the number of names extracted
    // We trust the actual extracted names array over the reported count
    const actualStudentCount = analysis.studentNames.length;

    // Log discrepancy if AI count doesn't match extracted names
    if (analysis.studentCount !== actualStudentCount) {
      console.warn(`⚠️ AI count mismatch: AI reported ${analysis.studentCount} but extracted ${actualStudentCount} names. Using extracted names count.`);
      analysis.notes = (analysis.notes || '') + ` [Note: AI reported count ${analysis.studentCount} adjusted to match ${actualStudentCount} extracted names]`;
    }

    const result_data = {
      count: actualStudentCount, // Use actual extracted names count, not AI's reported count
      studentNames: analysis.studentNames || [],
      illegibleNames: analysis.illegibleNames || [],
      lotIdentified: analysis.lotIdentified || '',
      zoneIdentified: analysis.zoneIdentified || '',
      eventDate: analysis.eventDate || '',
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

    if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429') || error.message?.includes('Too Many Requests') || error.message?.includes('rate limit')) {
      throw new Error('API rate limit exceeded. Please wait a few minutes and try again. You may have made too many requests in a short time.');
    }

    if (error.message?.includes('not found') || error.message?.includes('404')) {
      throw new Error(
        'Gemini model not available. The AI service may be updating. Please try manual entry or try again later.'
      );
    }

    if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }

    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Find matching lot from identified lot name
 * Uses fuzzy matching to handle variations in lot names
 *
 * @param {string} identifiedLotName - Lot name extracted from image
 * @param {Array<Object>} availableLots - Array of lot objects
 * @returns {Object|null} Matched lot object or null
 */
function findMatchingLot(identifiedLotName, availableLots) {
  if (!identifiedLotName || !availableLots || availableLots.length === 0) {
    return null;
  }

  const normalized = identifiedLotName.toLowerCase().trim();

  // Try exact match first
  let match = availableLots.find(lot =>
    lot.name.toLowerCase().trim() === normalized
  );

  if (match) {
    console.log(`✅ Exact match: "${identifiedLotName}" → ${match.name}`);
    return match;
  }

  // Try partial match (contains)
  match = availableLots.find(lot =>
    lot.name.toLowerCase().includes(normalized) ||
    normalized.includes(lot.name.toLowerCase())
  );

  if (match) {
    console.log(`✅ Partial match: "${identifiedLotName}" → ${match.name}`);
    return match;
  }

  // Try matching just the lot number (e.g., "Lot 3" or "3")
  const lotNumberMatch = normalized.match(/lot\s*(\d+)|^(\d+)$/i);
  if (lotNumberMatch) {
    const lotNumber = lotNumberMatch[1] || lotNumberMatch[2];
    match = availableLots.find(lot =>
      lot.name.toLowerCase().includes(`lot ${lotNumber}`) ||
      lot.name.toLowerCase().includes(`lot${lotNumber}`)
    );

    if (match) {
      console.log(`✅ Lot number match: "${identifiedLotName}" → ${match.name}`);
      return match;
    }
  }

  console.warn(`⚠️ No match found for: "${identifiedLotName}"`);
  return null;
}

export default {
  analyzeSignInSheet,
  analyzeBulkSignInSheets,
  isGeminiConfigured,
  getGeminiStatus
};

