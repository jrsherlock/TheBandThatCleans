/**
 * BACKFILL SCRIPT - Populate matched/unmatched counts for existing AI-processed lots
 * 
 * This script will:
 * 1. Find all lots that have aiStudentCount but missing matched/unmatched counts
 * 2. Look up the corresponding students in the Students sheet who were checked into that lot
 * 3. Count how many were matched (have real student IDs) vs unmatched (placeholder IDs)
 * 4. Update the aiMatchedCount and aiUnmatchedCount columns
 * 
 * IMPORTANT: This is a best-effort backfill based on current Students sheet data.
 * It may not be 100% accurate if students were manually edited after AI processing.
 */

function backfillMatchedUnmatchedCounts() {
  const SPREADSHEET_ID = "1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys";
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const lotsSheet = ss.getSheetByName("Lots");
  const studentsSheet = ss.getSheetByName("Students");
  
  if (!lotsSheet || !studentsSheet) {
    Logger.log("❌ ERROR: Required sheets not found!");
    return;
  }
  
  // Get lots data
  const lotsData = lotsSheet.getDataRange().getValues();
  const lotsHeaders = lotsData[0];
  
  // Get students data
  const studentsData = studentsSheet.getDataRange().getValues();
  const studentsHeaders = studentsData[0];
  
  // Find column indices in Lots sheet
  const lotIdIndex = lotsHeaders.indexOf("id");
  const lotNameIndex = lotsHeaders.indexOf("name");
  const aiCountIndex = lotsHeaders.indexOf("aiStudentCount");
  const aiMatchedCountIndex = lotsHeaders.indexOf("aiMatchedCount");
  const aiUnmatchedCountIndex = lotsHeaders.indexOf("aiUnmatchedCount");
  
  // Find column indices in Students sheet
  const studentIdIndex = studentsHeaders.indexOf("id");
  const studentAssignedLotIndex = studentsHeaders.indexOf("assignedLot");
  const studentCheckedInIndex = studentsHeaders.indexOf("checkedIn");
  
  if (aiMatchedCountIndex === -1 || aiUnmatchedCountIndex === -1) {
    Logger.log("❌ ERROR: aiMatchedCount or aiUnmatchedCount columns not found!");
    Logger.log("   Run addMissingColumns() first to add these columns.");
    return;
  }
  
  Logger.log("=== BACKFILL REPORT ===\n");
  Logger.log("Starting backfill process...\n");
  
  let lotsProcessed = 0;
  let lotsUpdated = 0;
  let lotsSkipped = 0;
  
  // Process each lot
  for (let i = 1; i < lotsData.length; i++) {
    const row = lotsData[i];
    const lotId = row[lotIdIndex];
    const lotName = row[lotNameIndex];
    const aiCount = row[aiCountIndex];
    const currentMatched = row[aiMatchedCountIndex];
    const currentUnmatched = row[aiUnmatchedCountIndex];
    
    // Skip if no AI count
    if (!aiCount || aiCount === '' || aiCount === 0) {
      continue;
    }
    
    lotsProcessed++;
    
    // Skip if already has matched/unmatched counts
    if ((currentMatched !== '' && currentMatched !== null && currentMatched !== undefined) ||
        (currentUnmatched !== '' && currentUnmatched !== null && currentUnmatched !== undefined)) {
      Logger.log(`⏭️  Skipping ${lotId} - ${lotName} (already has counts)`);
      lotsSkipped++;
      continue;
    }
    
    // Count students assigned to this lot
    let matchedCount = 0;
    let unmatchedCount = 0;
    
    for (let j = 1; j < studentsData.length; j++) {
      const studentRow = studentsData[j];
      const studentId = studentRow[studentIdIndex];
      const assignedLot = studentRow[studentAssignedLotIndex];
      const checkedIn = studentRow[studentCheckedInIndex];
      
      // Only count students assigned to this lot
      if (assignedLot === lotId) {
        // Placeholder students have IDs starting with "placeholder-"
        if (studentId && studentId.toString().startsWith("placeholder-")) {
          unmatchedCount++;
        } else if (studentId && studentId !== '') {
          matchedCount++;
        }
      }
    }
    
    // Update the lot row
    lotsData[i][aiMatchedCountIndex] = matchedCount;
    lotsData[i][aiUnmatchedCountIndex] = unmatchedCount;
    
    Logger.log(`✅ Updated ${lotId} - ${lotName}:`);
    Logger.log(`   AI Count: ${aiCount}, Matched: ${matchedCount}, Unmatched: ${unmatchedCount}`);
    
    // Verify the counts add up
    if (matchedCount + unmatchedCount !== parseInt(aiCount)) {
      Logger.log(`   ⚠️  WARNING: Counts don't match! (${matchedCount} + ${unmatchedCount} ≠ ${aiCount})`);
      Logger.log(`   This may indicate students were manually edited or removed.`);
    }
    
    lotsUpdated++;
  }
  
  // Write all updates back to the sheet
  if (lotsUpdated > 0) {
    lotsSheet.getRange(1, 1, lotsData.length, lotsData[0].length).setValues(lotsData);
    Logger.log(`\n✅ Successfully updated ${lotsUpdated} lot(s)`);
  } else {
    Logger.log("\n⚠️  No lots needed updating");
  }
  
  Logger.log("\n📊 SUMMARY:");
  Logger.log(`  Lots with AI data: ${lotsProcessed}`);
  Logger.log(`  Lots updated: ${lotsUpdated}`);
  Logger.log(`  Lots skipped (already had counts): ${lotsSkipped}`);
  
  Logger.log("\n=== END BACKFILL REPORT ===");
}

/**
 * Alternative: Set matched/unmatched to equal aiStudentCount for lots without student data
 * This is useful if you don't have the original student check-in data
 */
function backfillWithAICountOnly() {
  const SPREADSHEET_ID = "1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys";
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const lotsSheet = ss.getSheetByName("Lots");
  
  if (!lotsSheet) {
    Logger.log("❌ ERROR: Lots sheet not found!");
    return;
  }
  
  const lotsData = lotsSheet.getDataRange().getValues();
  const lotsHeaders = lotsData[0];
  
  const lotIdIndex = lotsHeaders.indexOf("id");
  const lotNameIndex = lotsHeaders.indexOf("name");
  const aiCountIndex = lotsHeaders.indexOf("aiStudentCount");
  const aiMatchedCountIndex = lotsHeaders.indexOf("aiMatchedCount");
  const aiUnmatchedCountIndex = lotsHeaders.indexOf("aiUnmatchedCount");
  
  if (aiMatchedCountIndex === -1 || aiUnmatchedCountIndex === -1) {
    Logger.log("❌ ERROR: Columns not found! Run addMissingColumns() first.");
    return;
  }
  
  Logger.log("=== SIMPLE BACKFILL (AI Count Only) ===\n");
  Logger.log("⚠️  WARNING: This will set matched = aiStudentCount and unmatched = 0");
  Logger.log("   This assumes all students were successfully matched.\n");
  
  let lotsUpdated = 0;
  
  for (let i = 1; i < lotsData.length; i++) {
    const row = lotsData[i];
    const lotId = row[lotIdIndex];
    const lotName = row[lotNameIndex];
    const aiCount = row[aiCountIndex];
    const currentMatched = row[aiMatchedCountIndex];
    const currentUnmatched = row[aiUnmatchedCountIndex];
    
    // Skip if no AI count
    if (!aiCount || aiCount === '' || aiCount === 0) {
      continue;
    }
    
    // Skip if already has counts
    if ((currentMatched !== '' && currentMatched !== null) ||
        (currentUnmatched !== '' && currentUnmatched !== null)) {
      continue;
    }
    
    // Set matched = aiCount, unmatched = 0
    lotsData[i][aiMatchedCountIndex] = parseInt(aiCount);
    lotsData[i][aiUnmatchedCountIndex] = 0;
    
    Logger.log(`✅ ${lotId} - ${lotName}: matched=${aiCount}, unmatched=0`);
    lotsUpdated++;
  }
  
  if (lotsUpdated > 0) {
    lotsSheet.getRange(1, 1, lotsData.length, lotsData[0].length).setValues(lotsData);
    Logger.log(`\n✅ Updated ${lotsUpdated} lot(s)`);
  } else {
    Logger.log("\n⚠️  No lots needed updating");
  }
  
  Logger.log("\n=== END SIMPLE BACKFILL ===");
}

