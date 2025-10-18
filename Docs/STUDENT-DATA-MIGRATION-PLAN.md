# Student Data Migration Plan for TBTC Application

## Executive Summary

This document outlines the complete plan for updating the Students tab in your Google Sheet with ~250 students and ensuring the TBTC application works correctly with the new data structure.

---

## 1. Current Student Data Structure

### Current Columns in Students Tab (Code.gs, line 26-29)
```javascript
headers: [
  "id", "name", "instrument", "section", "year",
  "checkedIn", "checkInTime", "assignedLot"
]
```

### Current Column Definitions

| Column | Field | Type | Purpose | Populated By |
|--------|-------|------|---------|--------------|
| **A** | `id` | string | Unique student identifier | **You need to generate** |
| **B** | `name` | string | Student's full name | **Your import data** |
| **C** | `instrument` | string | Student's instrument | **Your import data** |
| **D** | `section` | string | Band section (Woodwinds, Brass, Percussion, etc.) | **Derived from instrument** |
| **E** | `year` | string | Grade level (9-12 or freshman/sophomore/junior/senior) | **Your import data** |
| **F** | `checkedIn` | boolean | Whether student is currently checked in | System (starts FALSE) |
| **G** | `checkInTime` | ISO datetime | When student checked in | System (starts empty) |
| **H** | `assignedLot` | string | Lot ID student is assigned to | System (starts empty) |

---

## 2. Your Import Data Mapping

### Your Data (4 columns)
```
Band    Name                    Instrument      Grade
CB      Abbott, Aamiya          Trumpet         9
MB      Ackermann, Asher        Tenor Sax       10
```

### Mapping to Required Columns

| Your Column | Maps To | Transformation Needed |
|-------------|---------|----------------------|
| **Band** | *(Not directly used)* | Can be used to derive section or stored as metadata |
| **Name** | `name` (Column B) | Direct copy |
| **Instrument** | `instrument` (Column C) | Direct copy |
| **Grade** | `year` (Column E) | Convert to string: "9" → "freshman", "10" → "sophomore", etc. |
| *(Generate)* | `id` (Column A) | Create unique IDs: "student-1", "student-2", etc. |
| *(Derive)* | `section` (Column D) | Map instrument to section (see mapping below) |
| *(System)* | `checkedIn` (Column F) | Set to FALSE for all students |
| *(System)* | `checkInTime` (Column G) | Leave empty (blank) |
| *(System)* | `assignedLot` (Column H) | Leave empty (blank) |

---

## 3. Data Transformation Rules

### A. Generate Student IDs
Create sequential IDs for each student:
```
student-1
student-2
student-3
...
student-250
```

**Important:** These IDs must be unique and permanent. Once assigned, they should never change.

### B. Instrument to Section Mapping

Based on the application code (app.jsx, line 165), the app uses these sections:

| Instrument | Section |
|------------|---------|
| Flute, Piccolo, Clarinet, Oboe, Bassoon | **Woodwinds** |
| Alto Sax, Tenor Sax, Bari Sax | **Woodwinds** |
| Trumpet, Cornet | **Brass** |
| Trombone, Baritone, Euphonium | **Brass** |
| Tuba, Sousaphone | **Brass** |
| French Horn, Mellophone | **Brass** |
| Snare, Bass Drum, Cymbals, Timpani, Marimba, Vibraphone, Xylophone | **Percussion** |
| Color Guard, Flag, Rifle, Sabre | **Color Guard** |
| Drum Major, Section Leader | **Leadership** |

**Note:** You may need to adjust this mapping based on your actual instrument names.

### C. Grade to Year Conversion

The app uses lowercase year names (app.jsx, line 119):

| Grade Number | Year String |
|--------------|-------------|
| 9 | "freshman" |
| 10 | "sophomore" |
| 11 | "junior" |
| 12 | "senior" |

**Alternative:** The app can also work with grade numbers as strings ("9", "10", "11", "12") if you prefer not to convert.

---

## 4. Recommended Column Headers for Students Tab

### Final Column Structure (8 columns)

```
A: id
B: name
C: instrument
D: section
E: year
F: checkedIn
G: checkInTime
H: assignedLot
```

### Sample Data Row (after transformation)

```
id          name                instrument      section     year        checkedIn   checkInTime     assignedLot
student-1   Abbott, Aamiya      Trumpet         Brass       freshman    FALSE                       
student-2   Ackermann, Asher    Tenor Sax       Woodwinds   sophomore   FALSE                       
student-3   Addis, Luken        Alto Sax        Woodwinds   sophomore   FALSE                       
```

---

## 5. Step-by-Step Import Process

### Step 1: Prepare Your Data in Excel/Google Sheets

1. Open your source data (4 columns: Band, Name, Instrument, Grade)
2. Add 4 new columns to the right: `id`, `section`, `checkedIn`, `checkInTime`, `assignedLot`
3. Fill in the new columns:
   - **id**: Use formula `="student-"&ROW()-1` (adjust for header row)
   - **section**: Use VLOOKUP or IF statements based on instrument mapping
   - **year**: Use formula `=IF(E2=9,"freshman",IF(E2=10,"sophomore",IF(E2=11,"junior","senior")))`
   - **checkedIn**: Fill all with `FALSE`
   - **checkInTime**: Leave blank
   - **assignedLot**: Leave blank

### Step 2: Reorder Columns

Rearrange columns to match the required order:
```
A: id
B: name (from your Name column)
C: instrument (from your Instrument column)
D: section (newly derived)
E: year (converted from your Grade column)
F: checkedIn (set to FALSE)
G: checkInTime (blank)
H: assignedLot (blank)
```

### Step 3: Import to Google Sheet

1. Open your Google Sheet: `1mKnHPzGZDMa54aYyaKUbYYihZw9pRdwE3wr_J5EDRys`
2. Go to the **Students** tab
3. **IMPORTANT:** Keep the header row (row 1) as is
4. Delete any existing sample data (rows 2+)
5. Paste your prepared data starting at row 2
6. Verify all 250 students are imported correctly

### Step 4: Verify Data Format

Check that:
- Column F (checkedIn) shows `FALSE` (not "FALSE" as text)
- Column G (checkInTime) is completely empty (no spaces)
- Column H (assignedLot) is completely empty (no spaces)
- All student IDs are unique
- All names are properly formatted

---

## 6. Code Changes Required

### ✅ **GOOD NEWS: No Code Changes Needed!**

After analyzing the codebase, I found that:

1. **Google Apps Script (Code.gs)** already defines the correct 8-column structure (lines 24-30)
2. **React Application (app.jsx)** already expects and uses all 8 fields
3. **API Service (api-service.js)** already handles the data correctly
4. **All Components** (StudentsScreen, StudentCheckIn, StudentCheckOut) already use the correct fields

The application is **already built to handle exactly the data structure you need**. You just need to populate the Students tab with your data following the format above.

---

## 7. Optional: Band Column

Your import data includes a "Band" column (MB/CB for Marching Band/Concert Band). This is **not currently used** by the application, but you have two options:

### Option A: Ignore It
Simply don't include the Band column in your import. The app doesn't need it.

### Option B: Store It for Future Use
If you want to keep this information for future filtering/reporting:

1. Add a 9th column to the Students sheet: `band`
2. Update Code.gs line 26-29 to include it:
   ```javascript
   headers: [
     "id", "name", "instrument", "section", "year",
     "checkedIn", "checkInTime", "assignedLot", "band"
   ]
   ```
3. The app will ignore it for now, but you'll have it available for future features

**Recommendation:** Skip this for now. Add it later if needed.

---

## 8. Testing Checklist

After importing your data, test these scenarios:

### Test 1: Data Loading
- [ ] Open the TBTC application
- [ ] Navigate to the "Students" tab
- [ ] Verify all 250 students appear in the list
- [ ] Check that instruments and sections display correctly

### Test 2: Filtering
- [ ] Test the section filter (Woodwinds, Brass, Percussion, etc.)
- [ ] Test the year filter (freshman, sophomore, junior, senior)
- [ ] Test the search by name

### Test 3: Check-In Flow
- [ ] Generate a QR code for a parking lot
- [ ] Scan the QR code
- [ ] Search for a student by name
- [ ] Complete check-in
- [ ] Verify the student shows as "checked in" in the Students tab
- [ ] Verify the Google Sheet updates (checkedIn = TRUE, checkInTime populated)

### Test 4: Check-Out Flow (if enabled)
- [ ] Enable check-out in the app
- [ ] Check out a student
- [ ] Verify the student is removed from the lot
- [ ] Verify the AttendanceLog tab records the check-out

---

## 9. Common Issues and Solutions

### Issue: Students not appearing in the app
**Solution:** Check that the Google Sheet ID in Code.gs matches your sheet ID

### Issue: Check-in not working
**Solution:** Verify that student IDs are unique and properly formatted (no spaces, consistent format)

### Issue: Sections showing as "undefined"
**Solution:** Check that the section column is properly populated for all students

### Issue: Year filter not working
**Solution:** Ensure year values match exactly: "freshman", "sophomore", "junior", "senior" (all lowercase)

---

## 10. Sample Import Template

Here's a Google Sheets formula template you can use:

### In your preparation sheet:

| A (id) | B (name) | C (instrument) | D (section) | E (year) | F (checkedIn) | G (checkInTime) | H (assignedLot) |
|--------|----------|----------------|-------------|----------|---------------|-----------------|-----------------|
| `="student-"&ROW()-1` | *(your data)* | *(your data)* | `=IFS(OR(C2="Flute",C2="Clarinet",C2="Alto Sax",C2="Tenor Sax",C2="Bassoon"),"Woodwinds",OR(C2="Trumpet",C2="Trombone",C2="Tuba"),"Brass",C2="Percussion","Percussion",TRUE,"Other")` | `=IFS(D2=9,"freshman",D2=10,"sophomore",D2=11,"junior",D2=12,"senior")` | `FALSE` | *(blank)* | *(blank)* |

Adjust the section formula based on your actual instrument names.

---

## 11. Next Steps

1. **Prepare your data** using the template above
2. **Import to Google Sheet** following Step 3 in Section 5
3. **Test the application** using the checklist in Section 8
4. **Report any issues** if something doesn't work as expected

---

## Questions or Issues?

If you encounter any problems during the import or need help with the data transformation, please provide:
1. A sample of your raw data (5-10 rows)
2. The specific error message or unexpected behavior
3. Screenshots of the Google Sheet after import

I can then provide specific formulas or scripts to help with the transformation.

