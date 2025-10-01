# Polling Debug Guide

**Date:** 2025-10-01  
**Issue:** Debugging polling and refresh functionality  
**Status:** 🔍 Debug logging added

---

## Changes Made

I've added comprehensive debug logging throughout the polling system to help identify why polling and manual refresh aren't triggering network requests.

### Files Modified:

1. **`app.jsx`**
   - Added debug logs to `shouldUpdateData` function
   - Added debug logs to `handlePollingSuccess` function
   - Fixed logic issue: First poll now always updates state

2. **`src/hooks/usePolling.js`**
   - Added debug logs to `executePoll` function
   - Added debug logs to `startPolling` function
   - Added debug logs to `refresh` function (manual refresh)
   - Added debug logs to enabled flag useEffect

---

## Critical Fix Applied

### Issue: First Poll Never Updates State

**Problem:**
- `previousDataRef.current` starts with empty arrays `{ lots: [], students: [] }`
- First poll compares new data with empty arrays
- If data hasn't changed since initial load, comparison returns `false`
- `onSuccess` never called, so `previousDataRef` never gets populated
- Chicken-and-egg problem!

**Solution:**
Added check in `shouldUpdateData`:
```javascript
// If this is the first poll (no previous data), always update
if (prevLots.length === 0 && prevStudents.length === 0) {
  console.log('[Polling] shouldUpdateData: First poll, updating state');
  return true;
}
```

---

## How to Debug

### Step 1: Open Browser Console

1. Open the app at `http://localhost:3001`
2. Press F12 (or Cmd+Option+I on Mac)
3. Click on the **Console** tab
4. Clear the console (click the 🚫 icon)

### Step 2: Watch for Debug Logs

You should see logs in this order:

#### On App Load:
```
[usePolling] enabled flag changed: false
[usePolling] Polling disabled, stopping...
```
(Polling is disabled during initial load because `isInitialLoad` is `true`)

#### After Initial Data Loads:
```
[usePolling] enabled flag changed: true
[usePolling] Polling enabled, starting...
[usePolling] startPolling called, interval: 30000
[usePolling] Executing initial poll
[usePolling] executePoll called { isManual: false, isMounted: true, isTabVisible: true }
[usePolling] Fetching data with timeout: 10000
```

#### When Data is Fetched:
```
[usePolling] Data fetched successfully { lotsCount: 21, studentsCount: 120 }
[usePolling] Checking if should update state...
[Polling] shouldUpdateData: First poll, updating state
[usePolling] shouldUpdate returned: true
[usePolling] Updating state and calling onSuccess
[Polling] handlePollingSuccess called { isManual: false, lotsCount: 21, studentsCount: 120 }
[Polling] Updating state with new data
[Polling] Automatic poll - checking if notification needed
[usePolling] Setting up interval for 30000 ms
[usePolling] Polling started successfully
```

#### Every 30 Seconds:
```
[usePolling] Interval triggered, executing poll
[usePolling] executePoll called { isManual: false, isMounted: true, isTabVisible: true }
[usePolling] Fetching data with timeout: 10000
[usePolling] Data fetched successfully { lotsCount: 21, studentsCount: 120 }
[usePolling] Checking if should update state...
[Polling] shouldUpdateData: Changes detected? false
[usePolling] shouldUpdate returned: false
[usePolling] No update needed, skipping state update
```

---

### Step 3: Test Manual Refresh

1. Click the refresh button in the header (next to dark mode toggle)
2. Watch the console for these logs:

```
[usePolling] Manual refresh triggered
[usePolling] Executing manual poll
[usePolling] executePoll called { isManual: true, isMounted: true, isTabVisible: true }
[usePolling] Manual refresh - setting isRefreshing to true
[usePolling] Fetching data with timeout: 10000
[usePolling] Data fetched successfully { lotsCount: 21, studentsCount: 120 }
[usePolling] Checking if should update state...
[Polling] shouldUpdateData: First poll, updating state (or Changes detected? true/false)
[usePolling] shouldUpdate returned: true
[usePolling] Updating state and calling onSuccess
[Polling] handlePollingSuccess called { isManual: true, lotsCount: 21, studentsCount: 120 }
[Polling] Updating state with new data
[Polling] Manual refresh - showing success toast
```

3. You should also see:
   - Spinning animation on refresh button
   - Success toast: "Data refreshed successfully!"
   - Timestamp updates to "Updated just now"

---

### Step 4: Check Network Tab

1. Open DevTools → **Network** tab
2. Filter by "data" or your Google Apps Script URL
3. You should see:
   - Initial request on page load
   - Request when polling starts (after initial load)
   - Request every 30 seconds
   - Immediate request when clicking refresh button

---

## Troubleshooting

### Issue 1: No Logs Appear

**Possible Causes:**
- JavaScript error preventing code execution
- Console is filtered (check filter settings)
- Browser cache issue

**Solutions:**
1. Check for errors in console (red text)
2. Clear console filters (click "Default levels" dropdown)
3. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
4. Clear browser cache and reload

---

### Issue 2: "Polling disabled" Log Persists

**Symptom:**
```
[usePolling] enabled flag changed: false
[usePolling] Polling disabled, stopping...
```
Never changes to `true`

**Possible Causes:**
- `isInitialLoad` is still `true`
- `isQRCodeRoute` is `true`
- Initial data load failed

**Solutions:**
1. Check if initial data load completed successfully
2. Look for error messages in console
3. Verify `isInitialLoad` is set to `false` in the initial load useEffect
4. Check if you're on a QR code route (URL hash starts with `#checkin` or `#checkout`)

**Debug:**
Add this to console:
```javascript
// Check the enabled flag calculation
console.log('isInitialLoad:', window.location.hash);
```

---

### Issue 3: "Tab not visible" Log

**Symptom:**
```
[usePolling] Tab not visible, skipping poll
```

**Cause:**
The browser tab is not active (you switched to another tab)

**Solution:**
This is expected behavior! Polling pauses when tab is inactive to save battery.
- Switch back to the app tab
- Polling should resume automatically
- You should see: `[usePolling] Tab visible - resuming polling`

---

### Issue 4: Fetch Error

**Symptom:**
```
[usePolling] Fetch error: [error message]
```

**Possible Causes:**
- Google Apps Script API not accessible
- Network connection issue
- CORS error
- API timeout

**Solutions:**
1. Check if Google Apps Script is deployed and accessible
2. Verify the API URL in `api-service.js`
3. Check network connection
4. Look for CORS errors in console
5. Try accessing the API URL directly in browser

---

### Issue 5: "shouldUpdate returned: false" Always

**Symptom:**
Polling fetches data but never updates state:
```
[usePolling] shouldUpdate returned: false
[usePolling] No update needed, skipping state update
```

**Possible Causes:**
- Data hasn't changed since last poll
- Data comparison logic issue

**Expected Behavior:**
- First poll should ALWAYS return `true` (fixed in this update)
- Subsequent polls return `false` if no changes
- This is correct! It prevents unnecessary re-renders

**To Test:**
1. Open app in two browsers
2. Make a change in Browser 1 (update lot status)
3. Wait for next poll in Browser 2 (up to 30 seconds)
4. Should see: `[Polling] shouldUpdateData: Changes detected? true`

---

## Expected Console Output

### Successful Polling Cycle:

```
✅ Initial Load:
[usePolling] enabled flag changed: false
[usePolling] Polling disabled, stopping...
🔍 API Data Debug: Received data from API { lotsCount: 21, ... }
🔍 API Data Debug: Setting lots state { count: 21, ... }

✅ Polling Starts:
[usePolling] enabled flag changed: true
[usePolling] Polling enabled, starting...
[usePolling] startPolling called, interval: 30000
[usePolling] Executing initial poll
[usePolling] executePoll called { isManual: false, ... }
[usePolling] Fetching data with timeout: 10000
[usePolling] Data fetched successfully { lotsCount: 21, ... }
[Polling] shouldUpdateData: First poll, updating state
[usePolling] shouldUpdate returned: true
[Polling] handlePollingSuccess called { isManual: false, ... }
[Polling] Updating state with new data
[usePolling] Setting up interval for 30000 ms
[usePolling] Polling started successfully

✅ Subsequent Polls (every 30s):
[usePolling] Interval triggered, executing poll
[usePolling] executePoll called { isManual: false, ... }
[usePolling] Fetching data with timeout: 10000
[usePolling] Data fetched successfully { lotsCount: 21, ... }
[Polling] shouldUpdateData: Changes detected? false
[usePolling] shouldUpdate returned: false
[usePolling] No update needed, skipping state update

✅ Manual Refresh:
[usePolling] Manual refresh triggered
[usePolling] Executing manual poll
[usePolling] executePoll called { isManual: true, ... }
[usePolling] Manual refresh - setting isRefreshing to true
[usePolling] Fetching data with timeout: 10000
[usePolling] Data fetched successfully { lotsCount: 21, ... }
[Polling] shouldUpdateData: First poll, updating state
[usePolling] shouldUpdate returned: true
[Polling] handlePollingSuccess called { isManual: true, ... }
[Polling] Manual refresh - showing success toast
```

---

## Next Steps

1. **Open the app** and check the console
2. **Copy the console output** and share it
3. **Check the Network tab** for API requests
4. **Test manual refresh** and observe behavior
5. **Report findings:**
   - Are logs appearing?
   - Is polling starting?
   - Are network requests being made?
   - Any errors?

---

## Quick Checklist

- [ ] Console shows `[usePolling] enabled flag changed: true`
- [ ] Console shows `[usePolling] Polling enabled, starting...`
- [ ] Console shows `[usePolling] startPolling called`
- [ ] Console shows `[usePolling] Executing initial poll`
- [ ] Console shows `[usePolling] Fetching data with timeout: 10000`
- [ ] Console shows `[usePolling] Data fetched successfully`
- [ ] Network tab shows request to Google Apps Script
- [ ] Manual refresh button triggers logs
- [ ] Manual refresh shows success toast
- [ ] Polling continues every 30 seconds

---

**If all checkboxes are checked, polling is working correctly!** ✅

**If any are missing, share the console output for further debugging.** 🔍

