# Student Check-In/Check-Out System Guide

## Overview

The TBTC Parking Lot Cleanup application now includes a complete QR code-based student check-in/check-out flow with role-based access controls and comprehensive attendance logging.

## Features

### 1. QR Code-Based Check-In
- **URL Format**: `https://sites.google.com/view/tbtc-cleanup#checkin/[lot-id]`
- **Example**: `https://sites.google.com/view/tbtc-cleanup#checkin/lot-11`
- Each parking lot has a unique QR code that students scan to check in
- Students enter their full name or campus ID to validate
- System prevents duplicate check-ins (one lot per student at a time)

### 2. Master Check-Out QR Code
- **URL Format**: `https://sites.google.com/view/tbtc-cleanup#checkout`
- Single QR code for all students to check out
- Students search for their name in a list of checked-in students
- Only available when directors enable check-outs

### 3. Check-Out Toggle Control
- **Access**: Parent Volunteers and Directors only
- **Scope**: Per-event configuration
- **Default**: Disabled (students can only check in)
- Directors enable check-outs when cleanup is complete

### 4. Attendance Logging
- All check-ins and check-outs are logged to the AttendanceLog sheet
- Check-in times are **always preserved** (never cleared)
- Logs include: Student ID, Name, Date, Check-In Time, Check-Out Time, Assigned Lot

## User Flows

### Student Check-In Flow

1. **Student scans QR code** for a specific parking lot
   - App loads with lot ID from URL hash parameter
   
2. **Student enters identifier**
   - Full name OR campus ID
   - Clicks "Validate" button
   
3. **System validates student**
   - ✅ **Success**: Student found in roster and not checked in elsewhere
   - ❌ **Error - Not Found**: "Your name was not found in our system. Please sign in on the paper attendance sheet instead."
   - ❌ **Error - Already Checked In**: Shows current lot assignment and check-in time, requires check-out first
   
4. **Student confirms check-in**
   - Reviews displayed information
   - Clicks "Check In to [Lot Name]" button
   
5. **System updates records**
   - Sets `checkedIn: TRUE`
   - Sets `checkInTime: [current timestamp]`
   - Sets `assignedLot: [lot ID from QR code]`
   - Logs to AttendanceLog sheet
   
6. **Success confirmation**
   - Green success message displayed
   - Student can begin work

### Student Check-Out Flow

1. **Student scans master check-out QR code**
   - App loads check-out interface
   
2. **System checks if check-outs are enabled**
   - ⚠️ If disabled: Shows warning message, prevents check-out
   - ✅ If enabled: Proceeds to next step
   
3. **Student searches for their name**
   - Types name, ID, or instrument in search bar
   - List filters in real-time
   
4. **Student selects their name**
   - Clicks on their name in the list
   - System displays current lot assignment and check-in time
   
5. **Student confirms check-out**
   - Clicks "Check Out" button
   
6. **System updates records**
   - Sets `checkedIn: FALSE`
   - **Preserves** `checkInTime` (never cleared)
   - Clears `assignedLot`
   - Updates AttendanceLog with check-out time
   
7. **Success confirmation**
   - Confirmation message displayed
   - Student is free to leave

### Director/Volunteer Check-Out Toggle

1. **Navigate to Students tab**
   - Check-Out Toggle appears at the top of the screen
   
2. **Toggle check-outs on/off**
   - Click the toggle switch
   - Green = Enabled, Red = Disabled
   
3. **System updates event configuration**
   - Saves to EventConfig sheet
   - All users see updated state immediately

## Technical Implementation

### Components

#### `StudentCheckIn.jsx`
- Handles QR code-based check-in flow
- Validates student against roster
- Enforces single-lot-per-event rule
- Displays friendly error messages for unregistered students

#### `StudentCheckOut.jsx`
- Master check-out interface
- Searchable list of checked-in students
- Respects check-out toggle state
- Preserves check-in times

#### `CheckOutToggle.jsx`
- Role-based toggle control (Volunteers + Directors)
- Per-event configuration
- Visual status indicators

#### `QRCodeRouter.jsx`
- Parses URL hash parameters
- Routes to appropriate check-in/check-out flow
- Handles invalid QR codes gracefully

### Google Sheets Structure

#### Students Sheet
| Column | Field | Type | Notes |
|--------|-------|------|-------|
| A | id | string | Unique student ID |
| B | name | string | Full name |
| C | instrument | string | Instrument/section |
| D | section | string | Band section |
| E | year | string | Grade level |
| F | checkedIn | boolean | Current check-in status |
| G | checkInTime | datetime | **Preserved on check-out** |
| H | assignedLot | string | Current lot assignment (cleared on check-out) |

#### AttendanceLog Sheet
| Column | Field | Type | Notes |
|--------|-------|------|-------|
| A | studentId | string | Student ID |
| B | studentName | string | Student name (for easier reporting) |
| C | gameDate | date | Event date (YYYY-MM-DD) |
| D | checkInTime | datetime | When student checked in |
| E | checkOutTime | datetime | When student checked out |
| F | assignedLotId | string | Which lot they worked on |

#### EventConfig Sheet (New)
| Column | Field | Type | Notes |
|--------|-------|------|-------|
| A | eventId | string | Event identifier |
| B | eventName | string | Event display name |
| C | eventDate | date | Event date |
| D | checkOutEnabled | boolean | Check-out toggle state |
| E | lastUpdated | datetime | Last configuration update |

### API Endpoints

#### GET Endpoints
- `?action=data` - Fetch all lots and students
- `?action=eventConfig` - Fetch event configuration (check-out toggle state)
- `?action=report` - Generate attendance report

#### POST Endpoints
- `type: UPDATE_STUDENT_STATUS` - Update student check-in/check-out
- `type: UPDATE_EVENT_CONFIG` - Update check-out toggle state

### Validation Rules

1. **Single Lot Assignment**
   - A student can only be checked into ONE lot at a time
   - Attempting to check into a second lot shows error with current assignment
   - Must check out from current lot before checking into a new one

2. **Unregistered Student Handling**
   - Students not in the roster cannot check in digitally
   - Friendly error message directs them to paper attendance sheet
   - No automatic student record creation

3. **Check-Out Authorization**
   - Check-outs are disabled by default
   - Only Directors and Parent Volunteers can enable check-outs
   - Students see disabled state and cannot check out until enabled

4. **Data Preservation**
   - Check-in times are NEVER cleared (preserved for reporting)
   - Attendance log maintains complete history
   - Lot assignments are cleared on check-out

## QR Code Generation

### Check-In QR Codes (One per lot)

Generate QR codes with these URLs:
```
https://sites.google.com/view/tbtc-cleanup#checkin/lot-1
https://sites.google.com/view/tbtc-cleanup#checkin/lot-2
https://sites.google.com/view/tbtc-cleanup#checkin/lot-3
...
https://sites.google.com/view/tbtc-cleanup#checkin/lot-22
```

**Recommended QR Code Generator**: https://www.qr-code-generator.com/

**Print Instructions**:
1. Generate QR code for each lot
2. Print on 8.5" x 11" paper or cardstock
3. Include lot name and address on printout
4. Laminate for durability
5. Post at each parking lot location

### Master Check-Out QR Code (One for all students)

Generate QR code with this URL:
```
https://sites.google.com/view/tbtc-cleanup#checkout
```

**Print Instructions**:
1. Generate single master check-out QR code
2. Print multiple copies (8.5" x 11")
3. Laminate for durability
4. Keep in staging area
5. **Only display when directors enable check-outs**

## Deployment Checklist

### Backend Setup
- [ ] Update `Code.gs` with new handlers
- [ ] Deploy Google Apps Script as Web App
- [ ] Test `?action=eventConfig` endpoint
- [ ] Verify EventConfig sheet is created

### Frontend Setup
- [ ] Update `api-service.js` with new methods
- [ ] Test QR code routing locally
- [ ] Verify check-out toggle permissions
- [ ] Test check-in/check-out flows

### QR Code Setup
- [ ] Generate check-in QR codes for all 22 lots
- [ ] Generate master check-out QR code
- [ ] Print and laminate all QR codes
- [ ] Post check-in QR codes at lot locations
- [ ] Keep check-out QR code in staging area

### Testing
- [ ] Test check-in with valid student
- [ ] Test check-in with unregistered student
- [ ] Test duplicate check-in prevention
- [ ] Test check-out toggle (Director)
- [ ] Test check-out toggle (Volunteer)
- [ ] Test check-out flow
- [ ] Verify attendance logging
- [ ] Verify check-in time preservation

## Troubleshooting

### "Student not found" error
- Verify student is in the Students sheet
- Check spelling of name
- Try using campus ID instead

### "Already checked into another lot" error
- Student must check out from current lot first
- Directors can manually check out student from Students tab

### Check-out button disabled
- Directors must enable check-outs via toggle
- Check EventConfig sheet for current state

### QR code not working
- Verify URL format is correct
- Check that lot ID matches a lot in the Lots sheet
- Ensure Google Sites URL is correct

## Future Enhancements

- [ ] Barcode scanner support for campus IDs
- [ ] SMS notifications for check-in/check-out
- [ ] Real-time dashboard updates
- [ ] Automatic check-out after X hours
- [ ] Student self-service lot transfer requests
- [ ] Parent/guardian check-out authorization

