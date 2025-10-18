# Students Tab Visual Guide

## What Your Google Sheet Should Look Like

This guide shows exactly how the Students tab should be structured in your Google Sheet.

---

## Sheet Structure

### Tab Name
```
Students
```
(Must match exactly - case sensitive)

### Sheet ID
```
1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys
```

---

## Column Layout (8 columns total)

```
┌─────────────┬──────────────────┬─────────────┬───────────┬───────────┬───────────┬──────────────┬──────────────┐
│      A      │        B         │      C      │     D     │     E     │     F     │      G       │      H       │
├─────────────┼──────────────────┼─────────────┼───────────┼───────────┼───────────┼──────────────┼──────────────┤
│     id      │      name        │ instrument  │  section  │   year    │ checkedIn │ checkInTime  │ assignedLot  │
├─────────────┼──────────────────┼─────────────┼───────────┼───────────┼───────────┼──────────────┼──────────────┤
│ student-1   │ Abbott, Aamiya   │ Trumpet     │ Brass     │ freshman  │   FALSE   │              │              │
│ student-2   │ Ackermann, Asher │ Tenor Sax   │ Woodwinds │ sophomore │   FALSE   │              │              │
│ student-3   │ Addis, Luken     │ Alto Sax    │ Woodwinds │ sophomore │   FALSE   │              │              │
│ student-4   │ Adjaho, Pascal   │ Bassoon     │ Woodwinds │ sophomore │   FALSE   │              │              │
│ student-5   │ Aguirre-Connelly │ Alto Sax    │ Woodwinds │ senior    │   FALSE   │              │              │
│     ...     │       ...        │     ...     │    ...    │    ...    │    ...    │     ...      │     ...      │
│ student-250 │ [Last Student]   │ [Inst]      │ [Section] │ [Year]    │   FALSE   │              │              │
└─────────────┴──────────────────┴─────────────┴───────────┴───────────┴───────────┴──────────────┴──────────────┘
```

---

## Column Details

### Column A: id
- **Type:** Text/String
- **Format:** `student-###` where ### is a sequential number
- **Examples:** 
  - `student-1`
  - `student-2`
  - `student-250`
- **Rules:**
  - Must be unique for each student
  - Must start with "student-"
  - Must be sequential (1, 2, 3, ... 250)
  - No gaps in numbering
  - Never change once assigned

### Column B: name
- **Type:** Text/String
- **Format:** Any format (Last, First or First Last)
- **Examples:**
  - `Abbott, Aamiya`
  - `Ackermann, Asher`
  - `John Smith`
- **Rules:**
  - Must be the student's full name
  - Used for searching in the app
  - Should be consistent format across all students

### Column C: instrument
- **Type:** Text/String
- **Format:** Instrument name
- **Examples:**
  - `Trumpet`
  - `Tenor Sax`
  - `Clarinet`
  - `Percussion`
- **Rules:**
  - Must match the actual instrument the student plays
  - Used for display in the app
  - Case doesn't matter, but consistency is good

### Column D: section
- **Type:** Text/String
- **Format:** One of the predefined sections
- **Valid Values:**
  - `Woodwinds`
  - `Brass`
  - `Percussion`
  - `Color Guard`
  - `Leadership`
- **Rules:**
  - Must be one of the 5 valid values above
  - Case-sensitive (use exact capitalization)
  - Derived from the instrument
  - Used for filtering in the app

### Column E: year
- **Type:** Text/String
- **Format:** Grade level
- **Valid Values (Option 1 - Recommended):**
  - `freshman`
  - `sophomore`
  - `junior`
  - `senior`
- **Valid Values (Option 2 - Alternative):**
  - `9`
  - `10`
  - `11`
  - `12`
- **Rules:**
  - Must be lowercase if using year names
  - Used for filtering in the app
  - Pick one format and be consistent

### Column F: checkedIn
- **Type:** Boolean (TRUE/FALSE)
- **Format:** Boolean value, not text
- **Initial Value:** `FALSE` for all students
- **Rules:**
  - Must be the boolean value FALSE, not the text "FALSE"
  - System will change to TRUE when student checks in
  - System will change to FALSE when student checks out

### Column G: checkInTime
- **Type:** DateTime (ISO 8601 format)
- **Format:** `YYYY-MM-DDTHH:MM:SS.sssZ`
- **Initial Value:** Empty (blank cell)
- **Example (after check-in):** `2024-10-15T14:30:00.000Z`
- **Rules:**
  - Leave completely empty initially
  - System will populate when student checks in
  - System preserves this value even after check-out

### Column H: assignedLot
- **Type:** Text/String
- **Format:** Lot ID (e.g., `lot-1`, `lot-2`)
- **Initial Value:** Empty (blank cell)
- **Example (after assignment):** `lot-33-north`
- **Rules:**
  - Leave completely empty initially
  - System will populate when student checks in to a lot
  - System will clear when student checks out

---

## Before Import (Empty State)

Your Students tab should look like this before importing data:

```
Row 1 (Headers):
┌───────────┬──────────┬────────────┬─────────┬──────┬───────────┬─────────────┬─────────────┐
│    id     │   name   │ instrument │ section │ year │ checkedIn │ checkInTime │ assignedLot │
└───────────┴──────────┴────────────┴─────────┴──────┴───────────┴─────────────┴─────────────┘

Rows 2+: Empty or sample data to be deleted
```

---

## After Import (Initial State)

After importing your 250 students, it should look like this:

```
Row 1 (Headers):
┌───────────┬──────────────────┬────────────┬───────────┬───────────┬───────────┬─────────────┬─────────────┐
│    id     │      name        │ instrument │  section  │   year    │ checkedIn │ checkInTime │ assignedLot │
├───────────┼──────────────────┼────────────┼───────────┼───────────┼───────────┼─────────────┼─────────────┤
│ student-1 │ Abbott, Aamiya   │ Trumpet    │ Brass     │ freshman  │   FALSE   │             │             │
│ student-2 │ Ackermann, Asher │ Tenor Sax  │ Woodwinds │ sophomore │   FALSE   │             │             │
│ student-3 │ Addis, Luken     │ Alto Sax   │ Woodwinds │ sophomore │   FALSE   │             │             │
│   ...     │       ...        │    ...     │    ...    │    ...    │    ...    │     ...     │     ...     │
│student-250│ [Last Student]   │ [Inst]     │ [Section] │ [Year]    │   FALSE   │             │             │
└───────────┴──────────────────┴────────────┴───────────┴───────────┴───────────┴─────────────┴─────────────┘

Total Rows: 251 (1 header + 250 students)
```

---

## After Students Check In (Runtime State)

After students start checking in, the sheet will look like this:

```
Row 1 (Headers):
┌───────────┬──────────────────┬────────────┬───────────┬───────────┬───────────┬──────────────────────────┬────────────────┐
│    id     │      name        │ instrument │  section  │   year    │ checkedIn │      checkInTime         │  assignedLot   │
├───────────┼──────────────────┼────────────┼───────────┼───────────┼───────────┼──────────────────────────┼────────────────┤
│ student-1 │ Abbott, Aamiya   │ Trumpet    │ Brass     │ freshman  │   TRUE    │ 2024-10-15T14:30:00.000Z │ lot-33-north   │
│ student-2 │ Ackermann, Asher │ Tenor Sax  │ Woodwinds │ sophomore │   TRUE    │ 2024-10-15T14:32:00.000Z │ lot-33-south   │
│ student-3 │ Addis, Luken     │ Alto Sax   │ Woodwinds │ sophomore │   FALSE   │                          │                │
│   ...     │       ...        │    ...     │    ...    │    ...    │    ...    │           ...            │      ...       │
└───────────┴──────────────────┴────────────┴───────────┴───────────┴───────────┴──────────────────────────┴────────────────┘
```

**Note:** Students 1 and 2 have checked in, Student 3 has not.

---

## Data Type Verification

### How to Check Data Types in Google Sheets

1. **For checkedIn column (F):**
   - Click on a cell in column F
   - It should show `FALSE` (not "FALSE" with quotes)
   - The cell should be left-aligned (booleans are left-aligned)
   - If it's centered or right-aligned, it's text - fix it!

2. **For empty columns (G, H):**
   - Click on a cell in column G or H
   - The formula bar should be completely empty
   - No spaces, no formulas, nothing

3. **For text columns (A, B, C, D, E):**
   - Should be left-aligned
   - Should show as plain text in the formula bar

---

## Common Formatting Issues

### ❌ WRONG: checkedIn as text
```
┌───────────┐
│ "FALSE"   │  ← Text (has quotes, centered)
└───────────┘
```

### ✅ CORRECT: checkedIn as boolean
```
┌───────────┐
│ FALSE     │  ← Boolean (no quotes, left-aligned)
└───────────┘
```

### ❌ WRONG: Empty cells with spaces
```
┌───────────┐
│ " "       │  ← Has a space (bad!)
└───────────┘
```

### ✅ CORRECT: Truly empty cells
```
┌───────────┐
│           │  ← Completely empty (good!)
└───────────┘
```

---

## Import Checklist

Before importing to the Students tab:

- [ ] **Header row exists** in row 1 with exact column names
- [ ] **8 columns** (A through H)
- [ ] **250 student rows** (rows 2-251)
- [ ] **Column A (id):** All values are unique, format is "student-###"
- [ ] **Column B (name):** All students have names
- [ ] **Column C (instrument):** All students have instruments
- [ ] **Column D (section):** All values are one of: Woodwinds, Brass, Percussion, Color Guard, Leadership
- [ ] **Column E (year):** All values are one of: freshman, sophomore, junior, senior (or 9, 10, 11, 12)
- [ ] **Column F (checkedIn):** All values are boolean FALSE (not text "FALSE")
- [ ] **Column G (checkInTime):** All cells are completely empty
- [ ] **Column H (assignedLot):** All cells are completely empty

---

## Sample Data for Testing

If you want to test with a small sample first, here are 5 rows you can use:

```
id          name                instrument      section     year        checkedIn   checkInTime     assignedLot
student-1   Abbott, Aamiya      Trumpet         Brass       freshman    FALSE                       
student-2   Ackermann, Asher    Tenor Sax       Woodwinds   sophomore   FALSE                       
student-3   Addis, Luken        Alto Sax        Woodwinds   sophomore   FALSE                       
student-4   Adjaho, Pascal      Bassoon         Woodwinds   sophomore   FALSE                       
student-5   Aguirre-Connelly    Alto Sax        Woodwinds   senior      FALSE                       
```

---

## What Happens During App Usage

### When a student checks in:
1. **checkedIn** changes from `FALSE` to `TRUE`
2. **checkInTime** gets populated with current timestamp
3. **assignedLot** gets populated with the lot ID they checked into

### When a student checks out:
1. **checkedIn** changes from `TRUE` to `FALSE`
2. **checkInTime** stays the same (preserved!)
3. **assignedLot** gets cleared (becomes empty)
4. A record is added to the **AttendanceLog** tab

---

## Related Tabs

Your Google Sheet should also have these tabs:

### Lots Tab
Contains parking lot information (already set up)

### AttendanceLog Tab
Records check-in/check-out history (auto-populated by system)

### EventConfig Tab
Stores event settings like check-out toggle (auto-created by system)

---

## Final Verification

After importing, open the TBTC application and verify:

1. **Navigate to Students tab** in the app
2. **Check total count:** Should show "250 students" or similar
3. **Test search:** Search for a student name - should find them
4. **Test filters:** 
   - Filter by section - should show correct students
   - Filter by year - should show correct students
5. **Check student cards:** Each student should display:
   - Name
   - Instrument
   - Section
   - Year
   - Status (should all be "Absent" initially)

If all of the above work, your import was successful! 🎉

---

## Troubleshooting

### Students not showing in app
1. Check that the sheet name is exactly "Students" (case-sensitive)
2. Verify the Google Sheet ID in Code.gs matches your sheet
3. Check that row 1 has the exact header names
4. Refresh the app (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)

### Some students missing
1. Check that all rows have data (no blank rows in the middle)
2. Verify all student IDs are unique
3. Check that all required columns (A-E) have values

### Filters not working
1. Verify section values are exactly: Woodwinds, Brass, Percussion, Color Guard, or Leadership
2. Verify year values are exactly: freshman, sophomore, junior, senior (all lowercase)
3. Check for extra spaces in the data

### Check-in not working
1. Verify checkedIn column is boolean FALSE, not text "FALSE"
2. Check that checkInTime and assignedLot columns are completely empty
3. Verify student IDs are unique and properly formatted

---

## Need Help?

If your sheet doesn't look like the examples above, or if you're unsure about any formatting:

1. Take a screenshot of your Students tab (first 10 rows)
2. Share the screenshot
3. Describe what's not working

I can then provide specific guidance to fix the issue.

