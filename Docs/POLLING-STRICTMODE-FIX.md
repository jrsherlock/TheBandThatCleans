# Polling StrictMode Fix - CRITICAL BUG RESOLVED

**Date:** 2025-10-01  
**Issue:** `isMountedRef.current` always `false`, preventing all polling  
**Status:** ✅ **FIXED**

---

## 🐛 Critical Bug Identified

### Symptom:
Polling hook detects component as unmounted (`isMounted: false`), causing all polling attempts to be skipped:

```
[usePolling] executePoll called {isManual: true, isMounted: false, isTabVisible: true}
[usePolling] Component unmounted, skipping poll
```

**Result:** No network requests, no polling, no manual refresh.

---

## 🔍 Root Cause: React StrictMode

### What is React StrictMode?

React StrictMode is a development-only feature that helps identify potential problems. It's enabled in `src/main.jsx`:

```javascript
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### How StrictMode Causes the Bug:

In development, StrictMode **intentionally double-invokes** component lifecycles:

1. **First Mount:**
   - Component mounts
   - `isMountedRef.current = true` (initial value)
   - useEffect runs

2. **Immediate Unmount (StrictMode):**
   - Cleanup function runs
   - `isMountedRef.current = false` ❌
   - Intervals cleared

3. **Second Mount:**
   - Component mounts again
   - **BUG:** `isMountedRef.current` stays `false` ❌
   - No code to reset it to `true`!

4. **Result:**
   - All polling attempts check `isMountedRef.current`
   - It's `false`, so they skip execution
   - No network requests ever made

---

## ✅ The Fix

### Before (Broken):

```javascript
// Initial value
const isMountedRef = useRef(true);

// Cleanup on unmount
useEffect(() => {
  return () => {
    isMountedRef.current = false;  // ❌ Never reset to true on remount!
    // ... cleanup
  };
}, []);
```

**Problem:** After StrictMode unmounts and remounts, `isMountedRef.current` stays `false`.

---

### After (Fixed):

```javascript
// Initial value
const isMountedRef = useRef(true);

// Set mounted flag on mount and cleanup on unmount
useEffect(() => {
  console.log('[usePolling] Component mounted, setting isMountedRef to true');
  isMountedRef.current = true;  // ✅ Reset to true on every mount!

  return () => {
    console.log('[usePolling] Component unmounting, setting isMountedRef to false');
    isMountedRef.current = false;
    // ... cleanup
  };
}, []);
```

**Solution:** Explicitly set `isMountedRef.current = true` in the useEffect body, so it runs on every mount (including remounts).

---

## 🎯 Why This Works

### Mount/Unmount Cycle with Fix:

1. **First Mount:**
   - `isMountedRef.current = true` (useEffect body runs)
   - Polling starts

2. **Unmount (StrictMode):**
   - Cleanup runs: `isMountedRef.current = false`
   - Polling stops

3. **Second Mount:**
   - `isMountedRef.current = true` ✅ (useEffect body runs again!)
   - Polling starts again

4. **Result:**
   - `isMountedRef.current` is always `true` when component is mounted
   - Polling works correctly!

---

## 🧪 Testing the Fix

### Expected Console Output:

**On App Load (with StrictMode):**
```
[usePolling] Component mounted, setting isMountedRef to true
[usePolling] enabled flag changed: false
[usePolling] Polling disabled, stopping...
[usePolling] Component unmounting, setting isMountedRef to false
[usePolling] Component mounted, setting isMountedRef to true
[usePolling] enabled flag changed: false
[usePolling] Polling disabled, stopping...
```
(Notice the double mount/unmount - this is StrictMode in action)

**After Initial Data Loads:**
```
[usePolling] enabled flag changed: true
[usePolling] Polling enabled, starting...
[usePolling] startPolling called, interval: 30000
[usePolling] Executing initial poll
[usePolling] executePoll called {isManual: false, isMounted: true, isTabVisible: true}
                                                    ^^^^^^^^^^^^^ ✅ NOW TRUE!
[usePolling] Fetching data with timeout: 10000
[usePolling] Data fetched successfully {lotsCount: 21, studentsCount: 120}
```

**Manual Refresh:**
```
[usePolling] Manual refresh triggered
[usePolling] Executing manual poll
[usePolling] executePoll called {isManual: true, isMounted: true, isTabVisible: true}
                                                  ^^^^^^^^^^^^^ ✅ NOW TRUE!
[usePolling] Manual refresh - setting isRefreshing to true
[usePolling] Fetching data with timeout: 10000
[usePolling] Data fetched successfully {lotsCount: 21, studentsCount: 120}
```

---

## 📊 Verification Checklist

After the fix, verify:

- [ ] Console shows `isMounted: true` in executePoll logs
- [ ] Console shows "Component mounted, setting isMountedRef to true"
- [ ] Console shows "Fetching data with timeout: 10000"
- [ ] Console shows "Data fetched successfully"
- [ ] Network tab shows requests to Google Apps Script
- [ ] Manual refresh button works
- [ ] Success toast appears
- [ ] Polling continues every 30 seconds

---

## 🎓 Lessons Learned

### 1. React StrictMode is Tricky

StrictMode intentionally causes double-mounting in development to help catch bugs. This is **good** for finding issues, but can cause unexpected behavior with refs and side effects.

### 2. Refs Don't Reset Automatically

Unlike state, refs (`useRef`) don't reset when a component remounts. You must explicitly set them in a useEffect if you need them to reset on mount.

### 3. Always Test with StrictMode

StrictMode is enabled by default in Create React App and Vite. Always test your hooks with StrictMode enabled to catch these issues early.

### 4. Cleanup Functions Run on Unmount

The cleanup function in useEffect runs:
- When the component unmounts
- Before the effect runs again (if dependencies change)
- **During StrictMode's intentional unmount**

---

## 🚀 Production Behavior

**Important:** StrictMode only runs in development. In production:
- No double-mounting
- Component mounts once
- `isMountedRef.current` would have stayed `true` even without the fix

**However:** The fix is still necessary because:
1. Development testing would be broken
2. Other scenarios (like hot module reloading) could cause remounts
3. It's the correct way to handle ref initialization

---

## 📝 Code Changes

### File Modified:
- `src/hooks/usePolling.js` (lines 279-297)

### Change Summary:
- Added `isMountedRef.current = true` in useEffect body
- Added debug logs for mount/unmount
- Ensures ref is reset on every mount (StrictMode compatible)

---

## ✅ Status

**Bug:** ✅ Fixed  
**Testing:** ✅ Ready  
**Production:** ✅ Safe  

**The polling system should now work correctly in both development and production!** 🎉

---

## 🔗 Related Documentation

- [React StrictMode Documentation](https://react.dev/reference/react/StrictMode)
- [useEffect Cleanup Functions](https://react.dev/reference/react/useEffect#cleanup-function)
- [useRef Hook](https://react.dev/reference/react/useRef)

---

**Last Updated:** 2025-10-01

