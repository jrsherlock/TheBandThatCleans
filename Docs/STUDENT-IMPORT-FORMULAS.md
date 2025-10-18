# Quick Reference: Student Import Formulas

## Overview
Use these formulas in Google Sheets or Excel to transform your 4-column import data into the 8-column format required by the TBTC application.

---

## Your Source Data Format
```
Column A: Band (MB/CB)
Column B: Name (Last, First)
Column C: Instrument
Column D: Grade (9-12)
```

---

## Target Format (8 columns)
```
Column A: id
Column B: name
Column C: instrument
Column D: section
Column E: year
Column F: checkedIn
Column G: checkInTime
Column H: assignedLot
```

---

## Formulas (assuming your data starts in row 2)

### Column A: id
```
="student-"&ROW()-1
```
This creates: student-1, student-2, student-3, etc.

**Note:** If your data starts in a different row, adjust the formula. For example, if data starts in row 3:
```
="student-"&ROW()-2
```

---

### Column B: name
```
=B2
```
Direct copy from your Name column (assuming your Name is in column B of source data)

---

### Column C: instrument
```
=C2
```
Direct copy from your Instrument column

---

### Column D: section
This formula maps instruments to sections. **Adjust instrument names to match your exact data:**

```excel
=IFS(
  OR(C2="Flute",C2="Piccolo",C2="Clarinet",C2="Oboe",C2="Bassoon",C2="Alto Sax",C2="Tenor Sax",C2="Bari Sax"),"Woodwinds",
  OR(C2="Trumpet",C2="Cornet",C2="Trombone",C2="Baritone",C2="Euphonium",C2="Tuba",C2="Sousaphone",C2="French Horn",C2="Mellophone"),"Brass",
  OR(C2="Percussion",C2="Snare",C2="Bass Drum",C2="Cymbals",C2="Timpani",C2="Marimba",C2="Vibraphone",C2="Xylophone"),"Percussion",
  OR(C2="Color Guard",C2="Flag",C2="Rifle",C2="Sabre"),"Color Guard",
  OR(C2="Drum Major",C2="Section Leader"),"Leadership",
  TRUE,"Other"
)
```

**Simplified version** (if you want to manually categorize):
```excel
=IF(OR(C2="Flute",C2="Clarinet",C2="Alto Sax",C2="Tenor Sax",C2="Bassoon"),"Woodwinds",
  IF(OR(C2="Trumpet",C2="Trombone",C2="Tuba",C2="Euphonium"),"Brass",
    IF(C2="Percussion","Percussion","Other")))
```

**Alternative:** Create a lookup table and use VLOOKUP:

1. Create a mapping table on another sheet:
   ```
   Instrument    Section
   Flute         Woodwinds
   Clarinet      Woodwinds
   Alto Sax      Woodwinds
   Tenor Sax     Woodwinds
   Trumpet       Brass
   Trombone      Brass
   ...
   ```

2. Use this formula:
   ```
   =IFERROR(VLOOKUP(C2,InstrumentMapping!A:B,2,FALSE),"Other")
   ```

---

### Column E: year
Convert grade numbers to year names:

```excel
=IFS(D2=9,"freshman",D2=10,"sophomore",D2=11,"junior",D2=12,"senior")
```

**Alternative** (if you prefer to keep grade numbers as strings):
```excel
=TEXT(D2,"0")
```
This converts 9 → "9", 10 → "10", etc.

---

### Column F: checkedIn
```
=FALSE
```
All students start as not checked in.

**Important:** Make sure this is the boolean value FALSE, not the text "FALSE"

---

### Column G: checkInTime
Leave this column **completely empty** (no formula, no spaces, nothing)

---

### Column H: assignedLot
Leave this column **completely empty** (no formula, no spaces, nothing)

---

## Complete Example Row

If your source data in row 2 is:
```
A2: CB
B2: Abbott, Aamiya
C2: Trumpet
D2: 9
```

Your formulas would produce:
```
A2: student-1                (formula: ="student-"&ROW()-1)
B2: Abbott, Aamiya          (formula: =B2 from source)
C2: Trumpet                 (formula: =C2 from source)
D2: Brass                   (formula: =IFS(...))
E2: freshman                (formula: =IFS(D2=9,"freshman",...))
F2: FALSE                   (formula: =FALSE)
G2: [empty]                 (no formula)
H2: [empty]                 (no formula)
```

---

## Step-by-Step Process

### Option 1: Transform in Place

1. **Insert 4 new columns** after your existing data (after column D)
2. **Add headers** in row 1:
   - E1: `section`
   - F1: `year`
   - G1: `checkedIn`
   - H1: `checkInTime`
   - I1: `assignedLot`
3. **Insert 1 new column** at the beginning (before column A)
4. **Add header** in new A1: `id`
5. **Enter formulas** in row 2:
   - A2: `="student-"&ROW()-1`
   - E2: (section formula from above)
   - F2: (year formula from above)
   - G2: `=FALSE`
   - H2: (leave empty)
   - I2: (leave empty)
6. **Copy formulas down** to all 250 rows
7. **Delete the Band column** (original column A, now column B)
8. **Reorder columns** to match: id, name, instrument, section, year, checkedIn, checkInTime, assignedLot

### Option 2: Create New Sheet

1. **Create a new sheet** called "Students_Prepared"
2. **Add headers** in row 1: `id`, `name`, `instrument`, `section`, `year`, `checkedIn`, `checkInTime`, `assignedLot`
3. **Enter formulas** in row 2 (assuming source data is in Sheet1):
   - A2: `="student-"&ROW()-1`
   - B2: `=Sheet1!B2`
   - C2: `=Sheet1!C2`
   - D2: (section formula, referencing Sheet1!C2)
   - E2: (year formula, referencing Sheet1!D2)
   - F2: `=FALSE`
   - G2: (leave empty)
   - H2: (leave empty)
4. **Copy formulas down** to row 251 (250 students + 1 header)
5. **Copy all data** (A1:H251)
6. **Paste as values** in the Students tab of your Google Sheet

---

## Validation Checklist

After creating your transformed data, verify:

- [ ] **Exactly 8 columns** (A through H)
- [ ] **250 data rows** (plus 1 header row = 251 total rows)
- [ ] **All student IDs are unique** (student-1 through student-250)
- [ ] **No duplicate student IDs**
- [ ] **All sections are valid**: Woodwinds, Brass, Percussion, Color Guard, or Leadership
- [ ] **All years are valid**: freshman, sophomore, junior, or senior (or 9, 10, 11, 12)
- [ ] **checkedIn column shows FALSE** (not "FALSE" as text)
- [ ] **checkInTime column is completely empty** (no formulas, no spaces)
- [ ] **assignedLot column is completely empty** (no formulas, no spaces)

---

## Common Instrument Names

Based on typical high school band programs, here are common instrument names you might encounter:

### Woodwinds
- Flute, Piccolo
- Clarinet, Bass Clarinet
- Alto Sax, Tenor Sax, Bari Sax (Baritone Saxophone)
- Oboe, Bassoon

### Brass
- Trumpet, Cornet
- Trombone, Bass Trombone
- Baritone, Euphonium
- Tuba, Sousaphone
- French Horn, Mellophone

### Percussion
- Snare Drum, Bass Drum
- Cymbals, Crash Cymbals
- Timpani, Marimba, Vibraphone, Xylophone
- Percussion (general)

### Color Guard
- Color Guard, Flag, Rifle, Sabre

### Leadership
- Drum Major, Section Leader

**Action Required:** Review your actual instrument names and adjust the section formula accordingly.

---

## Troubleshooting

### Issue: Formula shows #VALUE! error
**Cause:** The IFS function might not be available in older Excel versions
**Solution:** Use nested IF statements instead:
```excel
=IF(D2=9,"freshman",IF(D2=10,"sophomore",IF(D2=11,"junior",IF(D2=12,"senior","unknown"))))
```

### Issue: checkedIn shows "FALSE" as text instead of boolean
**Cause:** Excel/Sheets treating it as text
**Solution:** 
1. Select the entire checkedIn column
2. Find & Replace: "FALSE" → FALSE (without quotes)
3. Or use formula: `=FALSE()` instead of `=FALSE`

### Issue: Student IDs not sequential
**Cause:** Rows were sorted or filtered after formulas were applied
**Solution:** 
1. Copy the ID column
2. Paste as values
3. Manually verify IDs are student-1 through student-250

### Issue: Some instruments don't map to a section
**Cause:** Instrument name doesn't match any in the formula
**Solution:** 
1. Find all "Other" values in the section column
2. Add those instrument names to the section formula
3. Or manually update the section for those rows

---

## Quick Copy-Paste Template

For a quick start, here's a template you can copy into row 2 of your preparation sheet:

```
A2: ="student-"&ROW()-1
B2: [your name column reference]
C2: [your instrument column reference]
D2: =IFS(OR(C2="Flute",C2="Clarinet",C2="Alto Sax",C2="Tenor Sax",C2="Bassoon"),"Woodwinds",OR(C2="Trumpet",C2="Trombone",C2="Tuba"),"Brass",C2="Percussion","Percussion",TRUE,"Other")
E2: =IFS(D2=9,"freshman",D2=10,"sophomore",D2=11,"junior",D2=12,"senior")
F2: =FALSE
G2: [leave empty]
H2: [leave empty]
```

Then copy down to row 251.

---

## Need Help?

If you encounter issues with the formulas or data transformation:

1. **Check your instrument names** - Make sure they match exactly (case-sensitive)
2. **Verify your source data layout** - Adjust column references if needed
3. **Test with a small sample** - Try 5-10 rows first before processing all 250
4. **Share a sample** - If stuck, share 5 rows of your source data for custom formula help

