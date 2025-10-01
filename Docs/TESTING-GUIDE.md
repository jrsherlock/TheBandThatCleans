# TBTC Screen Consolidation - Testing Guide

## Quick Start Testing

### How to Test the New Implementation

1. **Open the application** in your browser
2. **Switch between user roles** using the user selector dropdown in the header
3. **Verify the behavior** matches the expected results below

---

## Test Scenarios by Role

### 🔴 Admin Role Testing (Director Smith or Director Johnson)

#### Dashboard Tab
**Expected Behavior:**
- ✅ See full statistics dashboard with KPI cards
- ✅ See pie chart showing lot status distribution
- ✅ See bar chart showing section progress
- ✅ See alert cards for lots needing help
- ✅ See bulk operations panel
- ✅ Can select multiple lots and change status
- ✅ See notification panel
- ✅ Can send quick messages or custom messages
- ✅ See "Export Report" and "Refresh Data" buttons

**Test Actions:**
1. Click on Dashboard tab
2. Verify all charts render correctly
3. Select 2-3 lots in bulk operations
4. Click "Mark as In Progress" button
5. Verify lots update correctly
6. Type a custom message in notification panel
7. Click "Send Custom Message"
8. Verify toast notification appears

#### Parking Lots Tab
**Expected Behavior:**
- ✅ See all parking lots in grid layout
- ✅ See filter bar (section, status, priority)
- ✅ Each lot card shows status change buttons
- ✅ Each lot card shows "Edit Details" button
- ✅ Can click "Edit Details" to open modal
- ✅ Can change student count, add comments, upload photos

**Test Actions:**
1. Click on Parking Lots tab
2. Use filters to filter by section "north"
3. Verify only north section lots appear
4. Click status change button on a lot (e.g., "Set to In Progress")
5. Verify lot status updates
6. Click "Edit Details" on a lot
7. Change student count to 5
8. Add a comment "Test comment"
9. Click Save
10. Verify changes appear on lot card

#### Students Tab
**Expected Behavior:**
- ✅ See full student roster
- ✅ See statistics (checked in, assigned, filtered)
- ✅ See search and filter controls
- ✅ Each student card shows "Check In" or "Check Out" button
- ✅ Can check students in and out

**Test Actions:**
1. Click on Students tab
2. Search for a student name
3. Verify filtered results
4. Click "Check In" on a student
5. Verify student status changes to "Present"
6. Verify toast notification appears
7. Click "Check Out" on same student
8. Verify student status changes to "Absent"

---

### 🟡 Volunteer Role Testing (Parent Volunteer)

#### Dashboard Tab
**Expected Behavior:**
- ✅ See simplified dashboard
- ✅ See overall progress bar
- ✅ See status breakdown badges
- ✅ See KPI cards (students participating, present, estimated completion)
- ✅ See live update indicator
- ❌ NO bulk operations panel
- ❌ NO notification panel
- ❌ NO export/refresh buttons

**Test Actions:**
1. Switch to "Parent Volunteer" user
2. Click on Dashboard tab
3. Verify simplified view (no admin controls)
4. Verify progress bar shows correct percentage
5. Verify status badges show correct counts

#### Parking Lots Tab
**Expected Behavior:**
- ✅ See all parking lots in grid layout
- ✅ See filter bar (section, status, priority)
- ✅ See "Read Only" badge on each lot card
- ❌ NO status change buttons
- ❌ NO "Edit Details" button
- ❌ Cannot modify any lot information

**Test Actions:**
1. Click on Parking Lots tab
2. Verify "Read-only view" indicator appears
3. Verify lot cards show "Read Only" badge
4. Verify NO status change buttons appear
5. Verify NO edit buttons appear
6. Use filters to verify filtering still works

#### Students Tab
**Expected Behavior:**
- ✅ See full student roster (read-only)
- ✅ See statistics (checked in, assigned, filtered)
- ✅ See search and filter controls
- ✅ See "Read Only" badge at top
- ❌ NO check-in/check-out buttons
- ❌ Cannot modify student status

**Test Actions:**
1. Click on Students tab
2. Verify "Read Only" badge appears at top
3. Verify student cards show status but NO buttons
4. Search and filter to verify read-only access works
5. Verify cannot check students in or out

---

### 🟢 Student Role Testing (Emma Johnson)

#### Dashboard Tab
**Expected Behavior:**
- ✅ See personalized student dashboard
- ✅ See welcome card with student name
- ✅ See check-in status card
- ✅ See assigned lot information
- ✅ See lot details (status, notes, comments)
- ✅ See teammates list (other students on same lot)
- ✅ See event progress overview
- ✅ See instructions card

**Test Actions:**
1. Switch to "Emma Johnson" user
2. Click on Dashboard tab
3. Verify welcome message shows "Emma Johnson"
4. Verify check-in status is displayed
5. Verify assigned lot is shown (if assigned)
6. Verify teammates list appears (if on a lot)
7. Verify event progress shows overall stats

#### Parking Lots Tab
**Expected Behavior:**
- ✅ See parking lots (read-only)
- ✅ Can view lot information
- ❌ NO status change buttons
- ❌ NO edit buttons
- ❌ Cannot modify any lot information

**Test Actions:**
1. Click on Parking Lots tab
2. Verify can see lots but cannot edit
3. Verify "Read Only" badges appear

#### Students Tab
**Expected Behavior:**
- ❌ Tab may not be visible (depends on permission settings)
- OR ✅ See read-only student roster

**Test Actions:**
1. Check if Students tab is visible
2. If visible, verify read-only access

---

## Permission System Testing

### Test Permission Checks

#### Lot Status Changes
1. **As Admin:** Should be able to change lot status ✅
2. **As Volunteer:** Should NOT see status change buttons ❌
3. **As Student:** Should NOT see status change buttons ❌

#### Lot Detail Editing
1. **As Admin:** Should see "Edit Details" button and can edit ✅
2. **As Volunteer:** Should NOT see "Edit Details" button ❌
3. **As Student:** Should NOT see "Edit Details" button ❌

#### Student Check-In/Out
1. **As Admin:** Should see check-in/out buttons and can use them ✅
2. **As Volunteer:** Should NOT see check-in/out buttons ❌
3. **As Student:** Should NOT see check-in/out buttons ❌

#### Bulk Operations
1. **As Admin:** Should see bulk operations panel ✅
2. **As Volunteer:** Should NOT see bulk operations panel ❌
3. **As Student:** Should NOT see bulk operations panel ❌

#### Notifications
1. **As Admin:** Should see notification panel and can send ✅
2. **As Volunteer:** Should NOT see notification panel ❌
3. **As Student:** Should NOT see notification panel ❌

---

## Visual Indicators Testing

### Read-Only Badges
**Where to Look:**
- Top of Students screen (for volunteers)
- On each lot card (for volunteers/students)
- Next to results count (for volunteers/students)

**Expected:**
- ✅ Volunteers see "Read Only" badges
- ✅ Students see "Read Only" badges
- ❌ Admins do NOT see "Read Only" badges

### Permission Denied Messages
**How to Test:**
1. Try to perform an action without permission (if possible)
2. Should see toast error message
3. Message should explain why action was denied

---

## Regression Testing

### Verify All Original Features Still Work

#### Lot Management
- ✅ Lot status updates correctly
- ✅ Lot details save correctly
- ✅ Photo uploads work
- ✅ Lot cards display all information
- ✅ Filters work correctly

#### Student Management
- ✅ Student check-in/out works
- ✅ Student roster displays correctly
- ✅ Search and filters work
- ✅ Statistics calculate correctly

#### Dashboard Features
- ✅ Charts render correctly
- ✅ Statistics are accurate
- ✅ Progress bars show correct percentages
- ✅ Alert cards show correct lots

#### Bulk Operations
- ✅ Can select multiple lots
- ✅ Can update status of selected lots
- ✅ Selection clears after update

#### Notifications
- ✅ Quick messages work
- ✅ Custom messages work
- ✅ Toast notifications appear

---

## Browser Testing

### Test in Multiple Browsers
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

### Test Responsive Design
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## Dark Mode Testing

### Toggle Dark Mode
1. Click sun/moon icon in header
2. Verify all screens render correctly in dark mode
3. Verify all components have proper dark mode styling
4. Toggle back to light mode
5. Verify everything still works

---

## Error Handling Testing

### Test Error Scenarios

#### Network Errors
1. Disconnect from internet
2. Try to update a lot status
3. Verify error message appears
4. Reconnect and verify recovery

#### Invalid Data
1. Try to set student count to negative number (if possible)
2. Verify validation prevents it

#### Permission Errors
1. As volunteer, try to access admin features (if possible)
2. Verify permission denied message appears

---

## Performance Testing

### Check Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Parking Lots screen loads in < 2 seconds
- [ ] Students screen loads in < 2 seconds
- [ ] Filters respond instantly
- [ ] Status updates happen quickly

### Check Animations
- [ ] Lot cards animate smoothly
- [ ] Student cards animate smoothly
- [ ] Charts render smoothly
- [ ] No lag or stuttering

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Can tab through all interactive elements
- [ ] Can activate buttons with Enter/Space
- [ ] Focus indicators are visible

### Screen Reader
- [ ] All buttons have descriptive labels
- [ ] All images have alt text
- [ ] All form inputs have labels

---

## Bug Reporting Template

If you find a bug, please report it with this information:

```
**Bug Title:** [Short description]

**User Role:** [Admin/Volunteer/Student]

**Screen:** [Dashboard/Parking Lots/Students]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Third step]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots:**
[If applicable]

**Browser:**
[Chrome/Firefox/Safari/etc.]

**Additional Notes:**
[Any other relevant information]
```

---

## Success Criteria

### All Tests Pass When:
- ✅ All 3 roles can access their permitted screens
- ✅ All permission checks work correctly
- ✅ All original features still work
- ✅ No console errors appear
- ✅ UI is responsive and looks good
- ✅ Dark mode works correctly
- ✅ Performance is acceptable
- ✅ No regressions from old version

---

**Testing Date:** _____________  
**Tester Name:** _____________  
**Role Tested:** _____________  
**Result:** ☐ Pass ☐ Fail  
**Notes:** _____________

