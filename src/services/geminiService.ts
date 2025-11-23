/**
 * Google Gemini AI Service
 * Handles image analysis for sign-in sheet student counting
 * 
 * Upgraded with:
 * - @google/genai SDK (latest production endpoints)
 * - Native JSON mode (responseMimeType: "application/json")
 * - Consolidated retry logic (generateContentWithRetry)
 * - Stable model names (gemini-2.5-flash, gemini-1.5-flash)
 * - TypeScript with strict type safety
 */

import { GoogleGenAI } from '@google/genai';
import { AnalysisResult, Lot } from '../types';

// Initialize Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Use Flash for speed and stability - optimized for high-volume bulk image processing
// gemini-1.5-flash returns 404, so using gemini-2.5-flash as primary
const MODEL_PRIORITY = [
  'gemini-2.5-flash',  // Primary: Latest stable model (gemini-1.5-flash returns 404)
];

// Initialize AI client
let aiClient: GoogleGenAI | null = null;

if (API_KEY && API_KEY !== 'your_gemini_api_key_here') {
  aiClient = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn('⚠️ Gemini API key not configured. AI features will not work.');
}

/**
 * Convert File to base64 string (without data URL prefix)
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Consolidated helper function for generating content with retry logic
 * Handles model fallback, rate limiting (429), and native JSON mode
 */
async function generateContentWithRetry(
  prompt: string,
  imageFile: File,
  base64Image: string
): Promise<string> {
  if (!aiClient) {
    throw new Error('Gemini API not configured. Please set VITE_GEMINI_API_KEY in .env file');
  }

  let lastError: Error | null = null;

  // Try each model in priority order
  for (let i = 0; i < MODEL_PRIORITY.length; i++) {
    const modelName = MODEL_PRIORITY[i];

    try {
      console.log(`🔍 Attempting analysis with model: ${modelName}`);

      // Generate content with image using the new @google/genai API structure
      // The API uses models.generateContent() with contents array containing text and inlineData
      const result = await aiClient.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: imageFile.type,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json', // Native JSON mode - no regex parsing needed!
        },
      });

      // Extract text from response (text is a getter property)
      const text = result.text || '';
      
      if (!text) {
        throw new Error('No text response from AI model');
      }

      console.log(`✅ Success with model: ${modelName}`);
      console.log('🤖 Gemini raw response:', text);

      return text; // Return the JSON string directly

    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || '';

      // Handle rate limiting (429) - wait before trying next model
      if (
        errorMessage.includes('429') ||
        errorMessage.includes('Too Many Requests') ||
        errorMessage.includes('RESOURCE_EXHAUSTED')
      ) {
        console.warn(`⚠️ Rate limit hit for ${modelName}. Waiting 60 seconds before trying next model...`);

        // Wait 60 seconds before trying next model (rate limits are usually per minute)
        if (i < MODEL_PRIORITY.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 60000));
          console.log(`📋 Trying next fallback model after rate limit wait...`);
          continue;
        } else {
          throw new Error('API rate limit exceeded. Please wait a few minutes and try again.');
        }
      }

      console.warn(`⚠️ Model ${modelName} failed: ${error.message}`);

      // If this is the last model, throw the error
      if (i === MODEL_PRIORITY.length - 1) {
        console.error('❌ All models failed');
        throw error;
      }

      // Otherwise, continue to next model
      console.log(`📋 Trying next fallback model...`);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('All models failed');
}

/**
 * Analyze sign-in sheet image and extract student count
 */
export async function analyzeSignInSheet(
  imageFile: File,
  lotName: string,
  lotId: string
): Promise<AnalysisResult> {
  // Validate API key
  if (!aiClient) {
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
      lotId,
    });

    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);

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

Please respond with valid JSON in this exact format:
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

    // Use consolidated retry helper
    const text = await generateContentWithRetry(prompt, imageFile, base64Image);

    // Parse JSON response (now guaranteed to be valid JSON thanks to responseMimeType)
    let analysis: any;
    try {
      analysis = JSON.parse(text);
    } catch (parseError) {
      throw new Error('Failed to parse AI response. Response was not in expected JSON format.');
    }

    // Validate response structure with TypeScript safety checks
    if (typeof analysis.studentCount !== 'number') {
      throw new Error('Invalid AI response: studentCount must be a number');
    }

    if (analysis.studentCount < 0) {
      throw new Error('Invalid AI response: studentCount cannot be negative');
    }

    // TypeScript safety: Ensure studentNames is an array
    if (!Array.isArray(analysis.studentNames)) {
      console.warn('⚠️ studentNames not provided or not an array, defaulting to empty array');
      analysis.studentNames = [];
    }

    // TypeScript safety: Ensure illegibleNames is an array
    if (!Array.isArray(analysis.illegibleNames)) {
      analysis.illegibleNames = [];
    }

    // CRITICAL FIX: Use studentNames.length as the authoritative count
    // The AI sometimes reports a different count than the number of names extracted
    // We trust the actual extracted names array over the reported count
    const actualStudentCount = analysis.studentNames.length;

    // Log discrepancy if AI count doesn't match extracted names
    if (analysis.studentCount !== actualStudentCount) {
      console.warn(
        `⚠️ AI count mismatch: AI reported ${analysis.studentCount} but extracted ${actualStudentCount} names. Using extracted names count.`
      );
      analysis.notes =
        (analysis.notes || '') +
        ` [Note: AI reported count ${analysis.studentCount} adjusted to match ${actualStudentCount} extracted names]`;
    }

    if (actualStudentCount > 50) {
      console.warn('⚠️ Unusually high student count detected:', actualStudentCount);
      analysis.notes =
        (analysis.notes || '') + ' WARNING: Unusually high count detected. Please verify manually.';
      analysis.confidence = 'low';
    }

    const result_data: AnalysisResult = {
      count: actualStudentCount, // Use actual extracted names count, not AI's reported count
      studentNames: analysis.studentNames || [],
      illegibleNames: analysis.illegibleNames || [],
      lotIdentified: analysis.lotIdentified || '',
      zoneIdentified: analysis.zoneIdentified || '',
      confidence: (analysis.confidence || 'low') as 'high' | 'medium' | 'low',
      notes: analysis.notes || '',
      rawResponse: text,
      analyzedAt: new Date().toISOString(),
    };

    console.log('✅ Gemini analysis complete:', result_data);

    return result_data;
  } catch (error: any) {
    console.error('❌ Gemini API Error:', error);

    // Provide user-friendly error messages
    if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid API key. Please check your Gemini API configuration in the .env file.');
    }

    if (
      error.message?.includes('quota') ||
      error.message?.includes('RESOURCE_EXHAUSTED') ||
      error.message?.includes('429') ||
      error.message?.includes('Too Many Requests') ||
      error.message?.includes('rate limit')
    ) {
      throw new Error(
        'API rate limit exceeded. Please wait a few minutes and try again. You may have made too many requests in a short time.'
      );
    }

    if (error.message?.includes('not found') || error.message?.includes('404')) {
      throw new Error(
        'Gemini model not available. The AI service may be updating. Please try manual entry or try again later.'
      );
    }

    if (
      error.message?.includes('network') ||
      error.message?.includes('fetch') ||
      error.message?.includes('Failed to fetch')
    ) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }

    if (error.message?.includes('timeout')) {
      throw new Error('Request timed out. The image may be too large or the service is slow. Please try a smaller image or try again.');
    }

    if (error.message?.includes('Failed to parse') || error.message?.includes('JSON')) {
      throw new Error('AI response format error. The image may be unclear or corrupted. Please try a clearer image.');
    }

    // Generic error with more context
    const errorDetails = error.message || 'Unknown error occurred';
    throw new Error(`Failed to analyze image: ${errorDetails}. If this persists, try a different image or use manual entry.`);
  }
}

/**
 * Analyze sign-in sheet image and identify the lot from the header
 * Enhanced version that extracts lot name, zone, and event date from the image
 */
async function analyzeSignInSheetWithLotIdentification(
  imageFile: File,
  availableLots: Lot[]
): Promise<AnalysisResult> {
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
      fileType: imageFile.type,
    });

    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);

    // Create list of lot names for AI context
    const lotNamesList = availableLots.map((lot) => lot.name).join(', ');

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

Please respond with valid JSON in this exact format:
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

    // Use consolidated retry helper
    const text = await generateContentWithRetry(prompt, imageFile, base64Image);

    // Parse JSON response (now guaranteed to be valid JSON thanks to responseMimeType)
    let analysis: any;
    try {
      analysis = JSON.parse(text);
    } catch (parseError) {
      throw new Error('Failed to parse AI response. Response was not in expected JSON format.');
    }

    // Validate response structure with TypeScript safety checks
    if (typeof analysis.studentCount !== 'number') {
      throw new Error('Invalid AI response: studentCount must be a number');
    }

    if (analysis.studentCount < 0) {
      throw new Error('Invalid AI response: studentCount cannot be negative');
    }

    // TypeScript safety: Ensure studentNames is an array
    if (!Array.isArray(analysis.studentNames)) {
      console.warn('⚠️ studentNames not provided or not an array, defaulting to empty array');
      analysis.studentNames = [];
    }

    // TypeScript safety: Ensure illegibleNames is an array
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
      console.warn(
        `⚠️ AI count mismatch: AI reported ${analysis.studentCount} but extracted ${actualStudentCount} names. Using extracted names count.`
      );
      analysis.notes =
        (analysis.notes || '') +
        ` [Note: AI reported count ${analysis.studentCount} adjusted to match ${actualStudentCount} extracted names]`;
    }

    const result_data: AnalysisResult = {
      count: actualStudentCount, // Use actual extracted names count, not AI's reported count
      studentNames: analysis.studentNames || [],
      illegibleNames: analysis.illegibleNames || [],
      lotIdentified: analysis.lotIdentified || '',
      zoneIdentified: analysis.zoneIdentified || '',
      eventDate: analysis.eventDate || '',
      confidence: (analysis.confidence || 'low') as 'high' | 'medium' | 'low',
      notes: analysis.notes || '',
      rawResponse: text,
      analyzedAt: new Date().toISOString(),
    };

    console.log('✅ Gemini analysis complete:', result_data);

    return result_data;
  } catch (error: any) {
    console.error('❌ Gemini API Error:', error);

    // Provide user-friendly error messages
    if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid API key. Please check your Gemini API configuration in the .env file.');
    }

    if (
      error.message?.includes('quota') ||
      error.message?.includes('RESOURCE_EXHAUSTED') ||
      error.message?.includes('429') ||
      error.message?.includes('Too Many Requests') ||
      error.message?.includes('rate limit')
    ) {
      throw new Error(
        'API rate limit exceeded. Please wait a few minutes and try again. You may have made too many requests in a short time.'
      );
    }

    if (error.message?.includes('not found') || error.message?.includes('404')) {
      throw new Error(
        'Gemini model not available. The AI service may be updating. Please try manual entry or try again later.'
      );
    }

    if (
      error.message?.includes('network') ||
      error.message?.includes('fetch') ||
      error.message?.includes('Failed to fetch')
    ) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }

    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Find matching lot from identified lot name
 * Uses fuzzy matching to handle variations in lot names
 */
function findMatchingLot(identifiedLotName: string, availableLots: Lot[]): Lot | null {
  if (!identifiedLotName || !availableLots || availableLots.length === 0) {
    return null;
  }

  const normalized = identifiedLotName.toLowerCase().trim();

  // Try exact match first
  let match = availableLots.find((lot) => lot.name.toLowerCase().trim() === normalized);

  if (match) {
    console.log(`✅ Exact match: "${identifiedLotName}" → ${match.name}`);
    return match;
  }

  // Handle combined lot names (e.g., "Softball Lot and Soccer Lot")
  // Check if the identified name contains "and" or "&" indicating multiple lots
  const combinedMatch = normalized.match(/(.+?)\s+(?:and|&)\s+(.+)/i);
  if (combinedMatch) {
    const firstPart = combinedMatch[1].trim();
    const secondPart = combinedMatch[2].trim();
    
    console.log(`🔍 Detected combined lot names: "${firstPart}" AND "${secondPart}"`);
    
    // Extract key words from both parts (e.g., "softball", "soccer", "finkbine")
    const keywords = [
      ...firstPart.split(/\s+/).filter(w => w.length > 3),
      ...secondPart.split(/\s+/).filter(w => w.length > 3)
    ].map(w => w.toLowerCase());
    
    // Try to find a lot that contains BOTH key terms (for combined lots in the sheet)
    // Example: "Soccer Lot - Lower Finkbine Fields and Softball Lot" should match
    // when detected name is "Softball Lot and Soccer Lot: Lower Finkbine Fields"
    match = availableLots.find((lot) => {
      const lotNameLower = lot.name.toLowerCase();
      // Check if lot name contains both key terms (softball AND soccer)
      const hasSoftball = keywords.some(kw => kw.includes('softball') || lotNameLower.includes('softball'));
      const hasSoccer = keywords.some(kw => kw.includes('soccer') || lotNameLower.includes('soccer'));
      const hasFinkbine = keywords.some(kw => kw.includes('finkbine') || lotNameLower.includes('finkbine'));
      
      // If both softball and soccer are mentioned, or if finkbine is present with either
      if ((hasSoftball && hasSoccer) || (hasFinkbine && (hasSoftball || hasSoccer))) {
        return true;
      }
      
      // Also check if lot name contains all the key words
      const allKeywordsMatch = keywords.every(kw => 
        lotNameLower.includes(kw) || kw.length <= 3 // Ignore short words
      );
      return allKeywordsMatch;
    });
    
    if (match) {
      console.log(`✅ Combined lot match: "${identifiedLotName}" → ${match.name}`);
      return match;
    }
    
    // Fallback: Try to match each part separately
    const firstMatch = findMatchingLotInternal(firstPart, availableLots);
    const secondMatch = findMatchingLotInternal(secondPart, availableLots);
    
    // If both match, prefer the first one (or could return both, but for now use first)
    if (firstMatch && secondMatch) {
      console.log(`⚠️ Both lots matched: "${firstMatch.name}" and "${secondMatch.name}". Using first match.`);
      return firstMatch;
    } else if (firstMatch) {
      console.log(`✅ Matched first part: "${firstPart}" → ${firstMatch.name}`);
      return firstMatch;
    } else if (secondMatch) {
      console.log(`✅ Matched second part: "${secondPart}" → ${secondMatch.name}`);
      return secondMatch;
    }
    // If neither matches, fall through to regular matching
  }

  // Try partial match (contains) - but prefer more specific matches
  // First try if lot name contains the identified name (more specific)
  match = availableLots.find((lot) => lot.name.toLowerCase().includes(normalized));

  if (match) {
    console.log(`✅ Partial match (lot contains identified): "${identifiedLotName}" → ${match.name}`);
    return match;
  }

  // Then try if identified name contains lot name (less specific, but still valid)
  match = availableLots.find((lot) => normalized.includes(lot.name.toLowerCase()));

  if (match) {
    console.log(`✅ Partial match (identified contains lot): "${identifiedLotName}" → ${match.name}`);
    return match;
  }
  
  // Try keyword-based matching for combined lots (bidirectional)
  // Extract significant keywords from detected name
  const detectedKeywords = normalized
    .split(/\s+/)
    .filter(w => w.length > 3 && !['lot', 'and', 'the', 'lower', 'fields'].includes(w))
    .map(w => w.toLowerCase());
  
  if (detectedKeywords.length > 0) {
    match = availableLots.find((lot) => {
      const lotNameLower = lot.name.toLowerCase();
      // Check if lot name contains at least 2 key words from detected name
      const matchingKeywords = detectedKeywords.filter(kw => lotNameLower.includes(kw));
      return matchingKeywords.length >= 2 || (matchingKeywords.length === 1 && detectedKeywords.length === 1);
    });
    
    if (match) {
      console.log(`✅ Keyword-based match: "${identifiedLotName}" → ${match.name}`);
      return match;
    }
  }

  // Try matching lot number with directional suffix (e.g., "Lot 43 NW" or "43 NW")
  // Extract lot number and direction (N, NW, NE, S, SW, SE, W, E, etc.)
  const lotNumberWithDirection = normalized.match(/lot\s*(\d+)\s*([nsew]+)?|^(\d+)\s*([nsew]+)?/i);
  if (lotNumberWithDirection) {
    const lotNumber = lotNumberWithDirection[1] || lotNumberWithDirection[3];
    const direction = (lotNumberWithDirection[2] || lotNumberWithDirection[4] || '').toLowerCase();
    
    // Try to find lot with matching number and direction
    if (direction) {
      match = availableLots.find((lot) => {
        const lotNameLower = lot.name.toLowerCase();
        const hasNumber = lotNameLower.includes(`lot ${lotNumber}`) || lotNameLower.includes(`lot${lotNumber}`);
        const hasDirection = lotNameLower.includes(direction) || 
                            lotNameLower.includes(` ${direction} `) ||
                            lotNameLower.includes(`- ${direction}`) ||
                            lotNameLower.endsWith(` ${direction}`);
        return hasNumber && hasDirection;
      });

      if (match) {
        console.log(`✅ Lot number + direction match: "${identifiedLotName}" → ${match.name}`);
        return match;
      }
    }
    
    // Fallback: just match by lot number (less precise)
    match = availableLots.find(
      (lot) =>
        lot.name.toLowerCase().includes(`lot ${lotNumber}`) ||
        lot.name.toLowerCase().includes(`lot${lotNumber}`)
    );

    if (match) {
      console.log(`⚠️ Lot number match (no direction): "${identifiedLotName}" → ${match.name} (may be incorrect if multiple lots share this number)`);
      return match;
    }
  }

  console.warn(`⚠️ No match found for: "${identifiedLotName}"`);
  console.warn(`Available lots: ${availableLots.map(l => l.name).join(', ')}`);
  return null;
}

/**
 * Internal matching function (recursive helper for combined lot names)
 */
function findMatchingLotInternal(identifiedLotName: string, availableLots: Lot[]): Lot | null {
  if (!identifiedLotName || !availableLots || availableLots.length === 0) {
    return null;
  }

  const normalized = identifiedLotName.toLowerCase().trim();

  // Try exact match
  let match = availableLots.find((lot) => lot.name.toLowerCase().trim() === normalized);
  if (match) return match;

  // Try if lot name contains the identified name
  match = availableLots.find((lot) => lot.name.toLowerCase().includes(normalized));
  if (match) return match;

  // Try if identified name contains lot name
  match = availableLots.find((lot) => normalized.includes(lot.name.toLowerCase()));
  if (match) return match;

  // Try matching by key words (e.g., "softball", "soccer", "finkbine")
  // Filter out common words that don't help with matching
  const stopWords = ['lot', 'and', 'the', 'lower', 'fields', 'ave', 'ave.', 'street', 'st', 'road', 'rd'];
  const keywords = normalized
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.includes(w))
    .map(w => w.toLowerCase());
    
  if (keywords.length > 0) {
    match = availableLots.find((lot) => {
      const lotNameLower = lot.name.toLowerCase();
      // Match if lot name contains any of the key words
      return keywords.some(keyword => lotNameLower.includes(keyword));
    });
    if (match) return match;
  }

  return null;
}

/**
 * Check if Gemini API is configured and available
 */
export function isGeminiConfigured(): boolean {
  return !!aiClient && !!API_KEY && API_KEY !== 'your_gemini_api_key_here';
}

/**
 * Get Gemini configuration status
 */
export function getGeminiStatus() {
  return {
    configured: isGeminiConfigured(),
    model: MODEL_PRIORITY[0],
    hasApiKey: !!API_KEY && API_KEY !== 'your_gemini_api_key_here',
  };
}

/**
 * Analyze multiple sign-in sheet images in bulk
 * Automatically identifies lot names from image headers and matches against available lots
 */
export async function analyzeBulkSignInSheets(
  imageFiles: File[],
  availableLots: Lot[],
  progressCallback?: (progress: number) => void
): Promise<{ successful: any[]; failed: any[] }> {
  // Validate API key
  if (!aiClient) {
    throw new Error('Gemini API not configured. Please set VITE_GEMINI_API_KEY in .env file');
  }

  if (!imageFiles || imageFiles.length === 0) {
    throw new Error('No image files provided');
  }

  if (!availableLots || availableLots.length === 0) {
    throw new Error('No parking lots available for matching');
  }

  const results = {
    successful: [] as any[],
    failed: [] as any[],
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
        throw new Error(
          `Could not match lot "${analysis.lotIdentified}" to any available parking lot`
        );
      }

      results.successful.push({
        fileName: imageFile.name,
        lotId: matchedLot.id,
        lotName: matchedLot.name,
        detectedLotName: analysis.lotIdentified, // Store the original detected name for comparison
        studentCount: analysis.count,
        studentNames: analysis.studentNames,
        illegibleNames: analysis.illegibleNames,
        confidence: analysis.confidence,
        notes: analysis.notes,
        eventDate: analysis.eventDate,
        zoneIdentified: analysis.zoneIdentified,
        imageFile: imageFile,
        analysis: analysis,
      });

      // Log match details for debugging (important for mobile debugging)
      console.log(`📋 LOT MATCHING DETAILS:`);
      console.log(`   File: ${imageFile.name}`);
      console.log(`   Detected from image: "${analysis.lotIdentified}"`);
      console.log(`   Matched to lot: "${matchedLot.name}" (ID: ${matchedLot.id})`);
      console.log(`   Students found: ${analysis.count}`);
      console.log(`   Match type: ${analysis.lotIdentified === matchedLot.name ? 'EXACT' : 'FUZZY'}`);
      
      if (analysis.lotIdentified !== matchedLot.name) {
        console.warn(`   ⚠️ WARNING: Detected name differs from matched name - verify this is correct!`);
      }
    } catch (error: any) {
      console.error(`❌ Failed: ${imageFile.name}`, error);
      
      // Create a more descriptive error message
      let errorMessage = 'Processing failed';
      
      if (error.message) {
        errorMessage = error.message;
        
        // Add more context for common errors
        if (error.message.includes('API key') || error.message.includes('API_KEY_INVALID')) {
          errorMessage = 'Gemini API key not configured. Please check your environment settings.';
        } else if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
          errorMessage = 'API rate limit exceeded. Please wait a few minutes and try again.';
        } else if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = 'AI model not available. The service may be updating. Please try again later.';
        } else if (error.message.includes('Could not match lot')) {
          errorMessage = `Could not identify parking lot from image. Found: "${error.message.split('"')[1] || 'unknown'}". Please check the image quality or try manual entry.`;
        } else if (error.message.includes('Failed to parse')) {
          errorMessage = 'AI response format error. The image may be unclear or corrupted. Please try a clearer image.';
        } else if (error.message.includes('file too large') || error.message.includes('size')) {
          errorMessage = 'Image file is too large. Please compress the image or use a smaller file.';
        } else if (error.message.includes('Invalid file type')) {
          errorMessage = 'Invalid file format. Please use JPEG, PNG, or PDF files only.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. The image may be too large or the service is slow. Please try again.';
        }
      } else if (error.toString) {
        errorMessage = error.toString();
      }
      
      results.failed.push({
        fileName: imageFile.name,
        error: errorMessage,
        originalError: error.message || error.toString() || 'Unknown error',
      });
    }

    // Update progress
    processedCount++;
    const progress = Math.round((processedCount / totalFiles) * 100);
    if (progressCallback) {
      progressCallback(progress);
    }
  }

  console.log(
    `🏁 Bulk analysis complete: ${results.successful.length} successful, ${results.failed.length} failed`
  );

  return results;
}

export default {
  analyzeSignInSheet,
  analyzeBulkSignInSheets,
  isGeminiConfigured,
  getGeminiStatus,
};

