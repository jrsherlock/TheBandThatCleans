/**
 * Lot Matching Utilities
 * Helper functions for comparing and matching lot names from sign-in sheets
 */

/**
 * Normalize lot name for comparison
 * Removes common variations and standardizes format
 */
function normalizeLotName(name) {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    // Remove common prefixes
    .replace(/^(lot|parking lot|pl)\s*/i, '')
    // Remove special characters
    .replace(/[^a-z0-9\s]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize zone name for comparison
 */
function normalizeZone(zone) {
  if (!zone) return '';
  
  return zone
    .toLowerCase()
    .trim()
    // Remove "zone" prefix
    .replace(/^zone\s*/i, '')
    // Remove special characters
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Extract lot number from name
 * Examples: "Lot 48" -> "48", "Library Lot" -> null
 */
function extractLotNumber(name) {
  if (!name) return null;
  
  const match = name.match(/\b(\d+)\b/);
  return match ? match[1] : null;
}

/**
 * Check if two lot names match
 * Returns { matches: boolean, confidence: 'high'|'medium'|'low', reason: string }
 */
export function compareLotNames(expectedLot, detectedLot, detectedZone = null) {
  // Handle missing data
  if (!expectedLot || !expectedLot.name) {
    return {
      matches: false,
      confidence: 'low',
      reason: 'Expected lot name is missing'
    };
  }

  if (!detectedLot || detectedLot.trim() === '') {
    return {
      matches: false,
      confidence: 'low',
      reason: 'No lot name detected on sign-in sheet'
    };
  }

  const expectedName = normalizeLotName(expectedLot.name);
  const detectedName = normalizeLotName(detectedLot);
  const expectedZone = normalizeZone(expectedLot.zone || '');
  const detectedZoneNorm = normalizeZone(detectedZone || '');

  // EXACT MATCH (High Confidence)
  if (expectedName === detectedName) {
    return {
      matches: true,
      confidence: 'high',
      reason: 'Exact lot name match'
    };
  }

  // LOT NUMBER MATCH (High Confidence)
  const expectedNumber = extractLotNumber(expectedLot.name);
  const detectedNumber = extractLotNumber(detectedLot);
  
  if (expectedNumber && detectedNumber && expectedNumber === detectedNumber) {
    return {
      matches: true,
      confidence: 'high',
      reason: `Lot number match (${expectedNumber})`
    };
  }

  // ZONE MATCH (Medium Confidence)
  if (expectedZone && detectedZoneNorm && expectedZone === detectedZoneNorm) {
    return {
      matches: true,
      confidence: 'medium',
      reason: `Zone match (${expectedLot.zone})`
    };
  }

  // PARTIAL NAME MATCH (Medium Confidence)
  if (expectedName.includes(detectedName) || detectedName.includes(expectedName)) {
    return {
      matches: true,
      confidence: 'medium',
      reason: 'Partial lot name match'
    };
  }

  // FUZZY MATCH - Check for common variations
  const commonVariations = [
    // "Library" vs "Library Lot"
    expectedName.replace(/\s*lot\s*$/, ''),
    // "48" vs "Lot 48"
    expectedNumber,
    // "Melrose" vs "Melrose Ave"
    expectedName.split(' ')[0]
  ].filter(Boolean);

  for (const variation of commonVariations) {
    if (detectedName.includes(variation) || variation.includes(detectedName)) {
      return {
        matches: true,
        confidence: 'medium',
        reason: 'Fuzzy lot name match'
      };
    }
  }

  // NO MATCH
  return {
    matches: false,
    confidence: 'high',
    reason: `Lot name mismatch: expected "${expectedLot.name}", detected "${detectedLot}"`
  };
}

/**
 * Find best matching lot from available lots
 * Returns the lot object that best matches the detected lot name/zone
 */
export function findMatchingLot(detectedLot, detectedZone, availableLots) {
  if (!availableLots || availableLots.length === 0) {
    return null;
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const lot of availableLots) {
    const comparison = compareLotNames(lot, detectedLot, detectedZone);
    
    // Calculate score based on confidence
    let score = 0;
    if (comparison.matches) {
      if (comparison.confidence === 'high') score = 3;
      else if (comparison.confidence === 'medium') score = 2;
      else score = 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = lot;
    }
  }

  return bestMatch;
}

/**
 * Validate lot match and return validation result
 * Used in upload flow to check if detected lot matches expected lot
 */
export function validateLotMatch(expectedLot, aiAnalysis, availableLots = []) {
  const detectedLot = aiAnalysis?.lotIdentified || '';
  const detectedZone = aiAnalysis?.zoneIdentified || '';

  const comparison = compareLotNames(expectedLot, detectedLot, detectedZone);

  // If no match, try to find the correct lot
  let suggestedLot = null;
  if (!comparison.matches && detectedLot) {
    suggestedLot = findMatchingLot(detectedLot, detectedZone, availableLots);
  }

  return {
    isValid: comparison.matches,
    confidence: comparison.confidence,
    reason: comparison.reason,
    expectedLot: expectedLot,
    detectedLot: detectedLot,
    detectedZone: detectedZone,
    suggestedLot: suggestedLot,
    shouldWarn: !comparison.matches && comparison.confidence === 'high'
  };
}

/**
 * Check if lot already has a sign-in sheet uploaded
 */
export function hasExistingUpload(lot) {
  return !!(
    lot.aiStudentCount !== undefined && 
    lot.aiStudentCount !== null && 
    lot.aiStudentCount !== ''
  ) || !!(
    lot.signInSheetImageUrl
  );
}

/**
 * Get upload history info for display
 */
export function getUploadInfo(lot) {
  if (!hasExistingUpload(lot)) {
    return null;
  }

  return {
    count: lot.aiStudentCount || lot.totalStudentsSignedUp || 0,
    uploadedBy: lot.countEnteredBy || 'Unknown',
    uploadedAt: lot.lastUpdated ? new Date(lot.lastUpdated) : null,
    confidence: lot.aiConfidence || 'unknown',
    source: lot.countSource || 'unknown'
  };
}

