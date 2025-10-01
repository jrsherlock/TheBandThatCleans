# Real-Time Sync Testing Checklist

**Date:** 2025-10-01  
**Feature:** Background polling and manual refresh  
**App URL:** http://localhost:3001

---

## 🧪 Pre-Testing Setup

### Requirements:
- [ ] Dev server running on `http://localhost:3001`
- [ ] Google Apps Script API deployed and accessible
- [ ] Two browsers available for multi-user testing (Chrome + Firefox, or Chrome + Incognito)
- [ ] Browser DevTools knowledge (Network tab, Console tab)

### Before You Start:
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Open Console tab to see debug logs
3. Open Network tab to monitor API requests
4. Clear browser cache if needed

---

## ✅ Test 1: Basic Polling Functionality

**Goal:** Verify background polling starts and works correctly

### Steps:
1. [ ] Open app at `http://localhost:3001`
2. [ ] Wait for initial data to load
3. [ ] Check footer for sync status indicator
4. [ ] Observe Network tab for polling requests

### Expected Results:
- [ ] Footer shows: "Auto-updating every 30s" with green pulsing dot
- [ ] Network tab shows request to Google Apps Script every 30 seconds
- [ ] Console shows: `[usePolling] Tab visible - resuming polling` (or similar)
- [ ] No errors in console

### Success Criteria:
✅ Polling starts automatically  
✅ Green dot indicator visible  
✅ Network requests every 30 seconds  
✅ No console errors

---

## ✅ Test 2: Manual Refresh Button

**Goal:** Verify manual refresh works with proper visual feedback

### Steps:
1. [ ] Locate refresh button in header (next to dark mode toggle)
2. [ ] Note the "Updated X ago" timestamp
3. [ ] Click the refresh button
4. [ ] Observe the button animation
5. [ ] Check for success toast notification

### Expected Results:
- [ ] Button shows spinning animation during refresh
- [ ] Button is disabled during refresh (can't click again)
- [ ] Success toast appears: "Data refreshed successfully!"
- [ ] Toast auto-dismisses after 2 seconds
- [ ] Timestamp updates to "Updated just now" or "Updated 0 seconds ago"
- [ ] Button re-enables after refresh completes

### Success Criteria:
✅ Spinning animation works  
✅ Button disabled during refresh  
✅ Success toast appears  
✅ Timestamp updates  
✅ No errors

---

## ✅ Test 3: Tab Visibility Detection

**Goal:** Verify polling pauses when tab is inactive and resumes when active

### Steps:
1. [ ] Open app and verify polling is active (green dot)
2. [ ] Open Network tab in DevTools
3. [ ] Note the time of the last polling request
4. [ ] Switch to another browser tab (or minimize window)
5. [ ] Wait 1 minute
6. [ ] Check Network tab - should see no new requests
7. [ ] Switch back to the app tab
8. [ ] Observe Network tab and footer status

### Expected Results:
- [ ] When tab inactive: Footer shows "Auto-update paused" with gray dot
- [ ] When tab inactive: No new network requests in Network tab
- [ ] When tab becomes active: Immediate network request
- [ ] When tab becomes active: Footer shows "Auto-updating every 30s" with green dot
- [ ] Console shows: `[usePolling] Tab hidden - pausing polling` and `[usePolling] Tab visible - resuming polling`

### Success Criteria:
✅ Polling pauses when tab inactive  
✅ Gray dot indicator when paused  
✅ Polling resumes when tab active  
✅ Immediate fetch on tab activation  
✅ Green dot indicator when active

---

## ✅ Test 4: Multi-User Collaboration

**Goal:** Verify multiple users can see each other's changes within 30 seconds

### Setup:
1. [ ] Open app in Browser 1 (e.g., Chrome)
2. [ ] Open app in Browser 2 (e.g., Firefox or Chrome Incognito)
3. [ ] Both browsers should show the same initial data

### Test Scenario 1: Lot Status Change
1. [ ] In Browser 1: Navigate to "Parking Lots" tab
2. [ ] In Browser 1: Change a lot status (e.g., "Lot 11" from "pending-approval" to "complete")
3. [ ] In Browser 2: Wait up to 30 seconds
4. [ ] In Browser 2: Observe the lot status

**Expected:**
- [ ] Browser 2 shows toast: "Updates available - 1 lot changed" (within 30 seconds)
- [ ] Lot status updates automatically in Browser 2
- [ ] Last updated timestamp updates in Browser 2
- [ ] No manual refresh needed

### Test Scenario 2: Student Check-In
1. [ ] In Browser 1: Navigate to "Students" tab
2. [ ] In Browser 1: Check in a student
3. [ ] In Browser 2: Wait up to 30 seconds
4. [ ] In Browser 2: Observe the student list

**Expected:**
- [ ] Browser 2 shows toast: "Updates available - X lots changed" (if student was assigned to a lot)
- [ ] Student check-in status updates in Browser 2
- [ ] Last updated timestamp updates in Browser 2

### Success Criteria:
✅ Changes appear in other browser within 30 seconds  
✅ Toast notification shows number of changes  
✅ No manual refresh needed  
✅ Both browsers stay in sync

---

## ✅ Test 5: Error Handling

**Goal:** Verify error handling works correctly with retry logic

### Test Scenario 1: Network Disconnection
1. [ ] Open app and verify polling is active
2. [ ] Open DevTools → Network tab
3. [ ] Enable "Offline" mode (or disconnect internet)
4. [ ] Wait 30 seconds for next poll attempt
5. [ ] Observe footer status and console

**Expected:**
- [ ] Footer shows "Sync error" with red dot
- [ ] "Retry now" button appears in footer
- [ ] Console shows retry attempts: `[usePolling] Retry 1/3 in 5000ms`
- [ ] No error toast (silent failure for background polling)
- [ ] After 3 failed retries: Red dot persists

### Test Scenario 2: Manual Refresh While Offline
1. [ ] While still offline, click refresh button in header
2. [ ] Observe behavior

**Expected:**
- [ ] Button shows spinning animation
- [ ] Error toast appears: "Failed to refresh. Please try again."
- [ ] Button re-enables after error
- [ ] Footer still shows "Sync error" with red dot

### Test Scenario 3: Recovery
1. [ ] Disable "Offline" mode (reconnect internet)
2. [ ] Click "Retry now" button in footer
3. [ ] Observe behavior

**Expected:**
- [ ] Success toast: "Data refreshed successfully!"
- [ ] Footer shows "Auto-updating every 30s" with green dot
- [ ] Polling resumes normally
- [ ] Last updated timestamp updates

### Success Criteria:
✅ Error state shows red dot  
✅ Retry button appears  
✅ Silent failure for background polling  
✅ Error toast for manual refresh  
✅ Automatic recovery works  
✅ Manual retry works

---

## ✅ Test 6: Performance

**Goal:** Verify no performance degradation during polling

### Steps:
1. [ ] Open app
2. [ ] Open DevTools → Performance tab
3. [ ] Click "Record" button
4. [ ] Wait for 2-3 polling cycles (60-90 seconds)
5. [ ] Interact with the app (navigate tabs, scroll, click buttons)
6. [ ] Stop recording
7. [ ] Analyze the performance timeline

### Expected Results:
- [ ] No UI jank or freezing during polling
- [ ] Smooth animations and transitions
- [ ] No long tasks (> 50ms) during polling
- [ ] CPU usage < 1% during idle polling
- [ ] Memory stable (no leaks)

### Additional Checks:
1. [ ] Open DevTools → Memory tab
2. [ ] Take heap snapshot
3. [ ] Wait 5 minutes (10 polling cycles)
4. [ ] Take another heap snapshot
5. [ ] Compare snapshots

**Expected:**
- [ ] Memory increase < 5MB
- [ ] No detached DOM nodes
- [ ] No memory leaks

### Success Criteria:
✅ No UI jank or freezing  
✅ Smooth user experience  
✅ Low CPU usage  
✅ Stable memory  
✅ No memory leaks

---

## ✅ Test 7: Change Detection

**Goal:** Verify only actual changes trigger state updates

### Steps:
1. [ ] Open app
2. [ ] Open Console tab
3. [ ] Wait for several polling cycles (2-3 minutes)
4. [ ] Observe console logs

### Expected Results:
- [ ] Console shows: `🔍 Sections Debug: Processing lots data` every 30 seconds
- [ ] If no changes: No toast notifications
- [ ] If no changes: No unnecessary re-renders (check React DevTools)
- [ ] If changes: Toast notification appears

### Test with Changes:
1. [ ] Open app in Browser 1
2. [ ] Open app in Browser 2
3. [ ] In Browser 1: Make a change (update lot status)
4. [ ] In Browser 2: Wait for next poll
5. [ ] Observe console and toast

**Expected:**
- [ ] Browser 2 console shows data comparison
- [ ] Browser 2 shows toast: "Updates available - 1 lot changed"
- [ ] State updates only when changes detected

### Success Criteria:
✅ No unnecessary state updates  
✅ Toast only appears when changes detected  
✅ Efficient data comparison  
✅ No performance impact

---

## ✅ Test 8: Timestamp Accuracy

**Goal:** Verify timestamp updates correctly and shows accurate relative time

### Steps:
1. [ ] Open app
2. [ ] Note the "Updated X ago" text in header
3. [ ] Wait 1 minute without refreshing
4. [ ] Observe the timestamp text

**Expected:**
- [ ] Timestamp updates every second
- [ ] Shows relative time: "Updated 1 minute ago", "Updated 2 minutes ago", etc.
- [ ] Hover over timestamp shows exact time (tooltip)
- [ ] After manual refresh: Shows "Updated just now" or "Updated 0 seconds ago"

### Success Criteria:
✅ Timestamp updates every second  
✅ Relative time is accurate  
✅ Tooltip shows exact time  
✅ Updates after refresh

---

## ✅ Test 9: QR Code Routes

**Goal:** Verify polling is disabled on QR code check-in/check-out pages

### Steps:
1. [ ] Navigate to a QR code route (e.g., `#checkin/lot-101`)
2. [ ] Check footer for sync status indicator
3. [ ] Open Network tab
4. [ ] Wait 1 minute

**Expected:**
- [ ] Sync status indicator NOT visible in footer
- [ ] No polling requests in Network tab
- [ ] Polling disabled on QR routes

### Success Criteria:
✅ Polling disabled on QR routes  
✅ No sync indicator on QR routes  
✅ No unnecessary network requests

---

## ✅ Test 10: Edge Cases

### Test Case 1: Rapid Tab Switching
1. [ ] Open app
2. [ ] Rapidly switch between tabs (app tab ↔ other tab) 10 times
3. [ ] Observe behavior

**Expected:**
- [ ] No errors in console
- [ ] Polling resumes correctly
- [ ] No duplicate requests

### Test Case 2: Long Inactive Period
1. [ ] Open app
2. [ ] Switch to another tab
3. [ ] Wait 10 minutes
4. [ ] Switch back to app tab

**Expected:**
- [ ] Immediate fetch on tab activation
- [ ] Polling resumes normally
- [ ] No errors

### Test Case 3: Multiple Simultaneous Changes
1. [ ] Open app in 3 browsers
2. [ ] Make changes in all 3 browsers simultaneously
3. [ ] Wait for polling to sync

**Expected:**
- [ ] All browsers eventually show the same data
- [ ] No conflicts or errors
- [ ] Last change wins (expected behavior)

### Success Criteria:
✅ No errors in edge cases  
✅ Polling recovers correctly  
✅ Data stays consistent

---

## 📊 Test Results Summary

### Overall Status:
- [ ] All tests passed
- [ ] Some tests failed (document below)
- [ ] Tests not completed

### Failed Tests (if any):
```
Test #: ___
Issue: _______________________________________________
Expected: _____________________________________________
Actual: _______________________________________________
```

### Performance Metrics:
- CPU usage during polling: _____%
- Memory increase after 10 minutes: _____MB
- Average polling request time: _____ms
- UI responsiveness: _____ (Excellent / Good / Fair / Poor)

### Browser Compatibility:
- [ ] Chrome: ✅ / ❌
- [ ] Firefox: ✅ / ❌
- [ ] Safari: ✅ / ❌
- [ ] Edge: ✅ / ❌

---

## 🐛 Issues Found

### Issue 1:
**Description:** _______________________________________________
**Severity:** Critical / High / Medium / Low
**Steps to Reproduce:** _______________________________________________
**Expected:** _______________________________________________
**Actual:** _______________________________________________

### Issue 2:
**Description:** _______________________________________________
**Severity:** Critical / High / Medium / Low
**Steps to Reproduce:** _______________________________________________
**Expected:** _______________________________________________
**Actual:** _______________________________________________

---

## ✅ Sign-Off

**Tester Name:** _______________________________________________
**Date:** _______________________________________________
**Overall Assessment:** _______________________________________________

**Ready for Production:** Yes / No / With Reservations

**Notes:** _______________________________________________
_______________________________________________
_______________________________________________

---

**Testing Complete!** 🎉

