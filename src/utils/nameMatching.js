/**
 * Name Matching Utilities
 * Fuzzy matching logic for student names with handwriting variations
 */

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy string matching
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Normalize a name for comparison
 * Handles various formats: "Last, First", "First Last", etc.
 * 
 * @param {string} name - Name to normalize
 * @returns {Object} - Normalized name parts
 */
export function normalizeName(name) {
  if (!name || typeof name !== 'string') {
    return { full: '', first: '', last: '', normalized: '' };
  }

  // Remove extra whitespace and convert to lowercase
  let cleaned = name.trim().toLowerCase();
  
  // Remove common suffixes (Jr., Sr., III, etc.)
  cleaned = cleaned.replace(/\s+(jr\.?|sr\.?|iii?|iv|v)$/i, '');
  
  // Remove periods and extra spaces
  cleaned = cleaned.replace(/\./g, '').replace(/\s+/g, ' ');

  let first = '';
  let last = '';

  // Handle "Last, First" format
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',').map(p => p.trim());
    last = parts[0] || '';
    first = parts[1] || '';
  } 
  // Handle "First Last" format
  else {
    const parts = cleaned.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      first = parts[0];
      last = parts[parts.length - 1];
    } else if (parts.length === 1) {
      last = parts[0];
    }
  }

  // Create normalized full name (always "first last" format)
  const normalized = [first, last].filter(p => p).join(' ');

  return {
    full: cleaned,
    first,
    last,
    normalized
  };
}

/**
 * Calculate similarity score between two names
 * Returns a score from 0 (no match) to 1 (perfect match)
 * 
 * @param {string} name1 - First name
 * @param {string} name2 - Second name
 * @returns {number} - Similarity score (0-1)
 */
export function calculateNameSimilarity(name1, name2) {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);

  // If either name is empty, no match
  if (!norm1.normalized || !norm2.normalized) {
    return 0;
  }

  // Exact match on normalized name
  if (norm1.normalized === norm2.normalized) {
    return 1.0;
  }

  // Check if last names match exactly
  const lastNameMatch = norm1.last && norm2.last && norm1.last === norm2.last;
  
  // Check if first names match exactly
  const firstNameMatch = norm1.first && norm2.first && norm1.first === norm2.first;

  // Both first and last match
  if (lastNameMatch && firstNameMatch) {
    return 1.0;
  }

  // Last name matches, first name similar
  if (lastNameMatch && norm1.first && norm2.first) {
    const firstInitialMatch = norm1.first[0] === norm2.first[0];
    if (firstInitialMatch) {
      return 0.9; // Very high confidence
    }
    
    // Fuzzy match on first name
    const firstDistance = levenshteinDistance(norm1.first, norm2.first);
    const maxFirstLen = Math.max(norm1.first.length, norm2.first.length);
    const firstSimilarity = 1 - (firstDistance / maxFirstLen);
    
    if (firstSimilarity > 0.7) {
      return 0.85; // High confidence
    }
  }

  // First name matches, last name similar
  if (firstNameMatch && norm1.last && norm2.last) {
    const lastDistance = levenshteinDistance(norm1.last, norm2.last);
    const maxLastLen = Math.max(norm1.last.length, norm2.last.length);
    const lastSimilarity = 1 - (lastDistance / maxLastLen);
    
    if (lastSimilarity > 0.7) {
      return 0.85; // High confidence
    }
  }

  // Fuzzy match on full normalized name
  const fullDistance = levenshteinDistance(norm1.normalized, norm2.normalized);
  const maxLen = Math.max(norm1.normalized.length, norm2.normalized.length);
  const fullSimilarity = 1 - (fullDistance / maxLen);

  // Apply threshold
  if (fullSimilarity > 0.8) {
    return fullSimilarity;
  }

  // Check for partial matches (e.g., "J. Smith" vs "John Smith")
  if (norm1.last === norm2.last) {
    // Last names match, check if one first name is initial of the other
    if (norm1.first && norm2.first) {
      if (norm1.first.length === 1 && norm2.first[0] === norm1.first[0]) {
        return 0.75; // Medium-high confidence
      }
      if (norm2.first.length === 1 && norm1.first[0] === norm2.first[0]) {
        return 0.75; // Medium-high confidence
      }
    }
  }

  return fullSimilarity;
}

/**
 * Find best match for a name in a roster
 * 
 * @param {string} extractedName - Name extracted from sign-in sheet
 * @param {Array} roster - Array of student objects with 'name' property
 * @param {number} threshold - Minimum similarity score (default 0.7)
 * @returns {Object|null} - Best matching student or null
 */
export function findBestMatch(extractedName, roster, threshold = 0.7) {
  if (!extractedName || !roster || roster.length === 0) {
    return null;
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const student of roster) {
    const score = calculateNameSimilarity(extractedName, student.name);
    
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = {
        student,
        score,
        confidence: getConfidenceLevel(score)
      };
    }
  }

  return bestMatch;
}

/**
 * Get confidence level based on similarity score
 * 
 * @param {number} score - Similarity score (0-1)
 * @returns {string} - Confidence level
 */
function getConfidenceLevel(score) {
  if (score >= 0.95) return 'exact';
  if (score >= 0.85) return 'high';
  if (score >= 0.75) return 'medium';
  if (score >= 0.7) return 'low';
  return 'very-low';
}

/**
 * Match multiple extracted names against roster
 * 
 * @param {Array<string>} extractedNames - Names from sign-in sheet
 * @param {Array} roster - Array of student objects
 * @param {number} threshold - Minimum similarity score
 * @returns {Object} - Match results
 */
export function matchNamesAgainstRoster(extractedNames, roster, threshold = 0.7) {
  const matched = [];
  const unmatched = [];
  const duplicates = [];

  // Track which roster students have been matched
  const matchedStudentIds = new Set();

  for (const extractedName of extractedNames) {
    const match = findBestMatch(extractedName, roster, threshold);

    if (match) {
      // Check for duplicate matches
      if (matchedStudentIds.has(match.student.id)) {
        duplicates.push({
          extractedName,
          student: match.student,
          score: match.score,
          confidence: match.confidence
        });
      } else {
        matched.push({
          extractedName,
          student: match.student,
          score: match.score,
          confidence: match.confidence
        });
        matchedStudentIds.add(match.student.id);
      }
    } else {
      unmatched.push(extractedName);
    }
  }

  return {
    matched,
    unmatched,
    duplicates,
    matchRate: extractedNames.length > 0 
      ? (matched.length / extractedNames.length) * 100 
      : 0
  };
}

