/**
 * DIAGNOSTIC SCRIPT - Run this in Google Apps Script to check column setup
 * 
 * This script will:
 * 1. Check if aiMatchedCount and aiUnmatchedCount columns exist in the Lots sheet
 * 2. Show the current header row
 * 3. Show sample data from the first few lots
 * 4. Identify which lots have AI data but missing matched/unmatched counts
 */

function diagnosticCheckColumns() {
  const SPREADSHEET_ID = "1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys";
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const lotsSheet = ss.getSheetByName("Lots");
  
  if (!lotsSheet) {
    Logger.log("❌ ERROR: Lots sheet not found!");
    return;
  }
  
  // Get all data
  const data = lotsSheet.getDataRange().getValues();
  const headers = data[0];
  
  Logger.log("=== DIAGNOSTIC REPORT ===\n");
  
  // 1. Check headers
  Logger.log("📋 CURRENT HEADERS:");
  Logger.log("Total columns: " + headers.length);
  headers.forEach((header, index) => {
    const columnLetter = String.fromCharCode(65 + index); // A, B, C, etc.
    Logger.log(`  Column ${columnLetter} (${index}): ${header}`);
  });
  
  // 2. Check for our new columns
  Logger.log("\n🔍 CHECKING FOR NEW COLUMNS:");
  const aiMatchedCountIndex = headers.indexOf("aiMatchedCount");
  const aiUnmatchedCountIndex = headers.indexOf("aiUnmatchedCount");
  
  if (aiMatchedCountIndex === -1) {
    Logger.log("❌ aiMatchedCount column NOT FOUND");
  } else {
    const columnLetter = String.fromCharCode(65 + aiMatchedCountIndex);
    Logger.log(`✅ aiMatchedCount found at column ${columnLetter} (index ${aiMatchedCountIndex})`);
  }
  
  if (aiUnmatchedCountIndex === -1) {
    Logger.log("❌ aiUnmatchedCount column NOT FOUND");
  } else {
    const columnLetter = String.fromCharCode(65 + aiUnmatchedCountIndex);
    Logger.log(`✅ aiUnmatchedCount found at column ${columnLetter} (index ${aiUnmatchedCountIndex})`);
  }
  
  // 3. Check AI-related columns
  Logger.log("\n📊 AI-RELATED COLUMNS:");
  const aiCountIndex = headers.indexOf("aiStudentCount");
  const aiConfidenceIndex = headers.indexOf("aiConfidence");
  const aiTimestampIndex = headers.indexOf("aiAnalysisTimestamp");
  
  Logger.log(`  aiStudentCount: ${aiCountIndex !== -1 ? 'Column ' + String.fromCharCode(65 + aiCountIndex) : 'NOT FOUND'}`);
  Logger.log(`  aiConfidence: ${aiConfidenceIndex !== -1 ? 'Column ' + String.fromCharCode(65 + aiConfidenceIndex) : 'NOT FOUND'}`);
  Logger.log(`  aiAnalysisTimestamp: ${aiTimestampIndex !== -1 ? 'Column ' + String.fromCharCode(65 + aiTimestampIndex) : 'NOT FOUND'}`);
  
  // 4. Sample data from first 5 lots
  Logger.log("\n📝 SAMPLE DATA (First 5 lots):");
  const idIndex = headers.indexOf("id");
  const nameIndex = headers.indexOf("name");
  
  for (let i = 1; i <= Math.min(5, data.length - 1); i++) {
    const row = data[i];
    const lotId = row[idIndex];
    const lotName = row[nameIndex];
    const aiCount = aiCountIndex !== -1 ? row[aiCountIndex] : 'N/A';
    const matched = aiMatchedCountIndex !== -1 ? row[aiMatchedCountIndex] : 'N/A';
    const unmatched = aiUnmatchedCountIndex !== -1 ? row[aiUnmatchedCountIndex] : 'N/A';
    
    Logger.log(`\n  Lot ${i}: ${lotId} - ${lotName}`);
    Logger.log(`    aiStudentCount: ${aiCount}`);
    Logger.log(`    aiMatchedCount: ${matched}`);
    Logger.log(`    aiUnmatchedCount: ${unmatched}`);
  }
  
  // 5. Count lots with AI data but missing matched/unmatched counts
  Logger.log("\n🔢 LOTS NEEDING BACKFILL:");
  let needsBackfill = 0;
  let hasAIData = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const aiCount = aiCountIndex !== -1 ? row[aiCountIndex] : null;
    const matched = aiMatchedCountIndex !== -1 ? row[aiMatchedCountIndex] : null;
    const unmatched = aiUnmatchedCountIndex !== -1 ? row[aiUnmatchedCountIndex] : null;
    
    if (aiCount !== null && aiCount !== '' && aiCount !== undefined) {
      hasAIData++;
      if ((matched === null || matched === '' || matched === undefined) && 
          (unmatched === null || unmatched === '' || unmatched === undefined)) {
        needsBackfill++;
      }
    }
  }
  
  Logger.log(`  Total lots with AI data: ${hasAIData}`);
  Logger.log(`  Lots missing matched/unmatched counts: ${needsBackfill}`);
  
  // 6. Recommendations
  Logger.log("\n💡 RECOMMENDATIONS:");
  if (aiMatchedCountIndex === -1 || aiUnmatchedCountIndex === -1) {
    Logger.log("  ⚠️  CRITICAL: New columns are missing from the sheet!");
    Logger.log("  → Run the initializeSheets() function to add missing columns");
  } else if (needsBackfill > 0) {
    Logger.log(`  ⚠️  ${needsBackfill} lots have AI data but no matched/unmatched counts`);
    Logger.log("  → Option 1: Re-upload sign-in sheets for these lots");
    Logger.log("  → Option 2: Create a backfill script to populate from existing data");
    Logger.log("  → Option 3: Accept that only new uploads will have this data");
  } else {
    Logger.log("  ✅ All columns exist and data looks good!");
  }
  
  Logger.log("\n=== END DIAGNOSTIC REPORT ===");
}

/**
 * If columns are missing, run this to add them
 */
function addMissingColumns() {
  const SPREADSHEET_ID = "1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys";
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const lotsSheet = ss.getSheetByName("Lots");
  
  if (!lotsSheet) {
    Logger.log("❌ ERROR: Lots sheet not found!");
    return;
  }
  
  const headers = lotsSheet.getRange(1, 1, 1, lotsSheet.getLastColumn()).getValues()[0];
  
  // Check if columns already exist
  if (headers.indexOf("aiMatchedCount") !== -1 && headers.indexOf("aiUnmatchedCount") !== -1) {
    Logger.log("✅ Columns already exist! No action needed.");
    return;
  }
  
  // Add missing columns
  const lastColumn = lotsSheet.getLastColumn();
  let columnsAdded = 0;
  
  if (headers.indexOf("aiMatchedCount") === -1) {
    lotsSheet.getRange(1, lastColumn + 1 + columnsAdded).setValue("aiMatchedCount");
    columnsAdded++;
    Logger.log("✅ Added aiMatchedCount column");
  }
  
  if (headers.indexOf("aiUnmatchedCount") === -1) {
    lotsSheet.getRange(1, lastColumn + 1 + columnsAdded).setValue("aiUnmatchedCount");
    columnsAdded++;
    Logger.log("✅ Added aiUnmatchedCount column");
  }
  
  Logger.log(`\n✅ Added ${columnsAdded} column(s) to the Lots sheet`);
  Logger.log("⚠️  Note: Existing rows will have empty values for these columns");
  Logger.log("   New uploads will populate these columns automatically");
}

