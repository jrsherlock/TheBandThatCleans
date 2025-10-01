# Real-Time Data Synchronization

**Date:** 2025-10-01  
**Feature:** Background polling and manual refresh for near real-time collaboration  
**Status:** ✅ Implemented

---

## Overview

The TBTC application now supports automatic background data synchronization, enabling multiple users to see each other's changes within 30 seconds without manual page refreshes. This feature provides a near real-time collaborative experience while maintaining excellent performance and battery efficiency.

---

## Features

### 1. Background Polling System

**Automatic Updates:**
- Polls Google Apps Script API every 30 seconds
- Fetches latest lots and students data
- Compares with current state to detect changes
- Only updates React state when actual changes are detected
- Prevents unnecessary re-renders for optimal performance

**Intelligent Lifecycle Management:**
- Starts automatically when app loads
- Pauses when browser tab becomes inactive (saves battery)
- Resumes when tab becomes active again
- Cleans up properly on component unmount
- Disabled during initial load and on QR code routes

**Error Handling:**
- Exponential backoff retry logic (3 attempts max)
- Silent failures for background polling (no user interruption)
- Errors logged to console for debugging
- Automatic recovery after successful retry
- Manual retry option for persistent errors

**Performance Optimizations:**
- 10-second request timeout
- Tab visibility detection to pause polling
- Smart data comparison to prevent unnecessary updates
- No UI blocking or jank during updates
- Mobile battery-friendly (pauses when tab inactive)

---

### 2. Manual Refresh Button

**Location:** Header navigation bar, next to dark mode toggle

**Visual Feedback:**
- Spinning animation while refreshing
- Disabled state during refresh
- "Updated X minutes ago" timestamp
- Exact timestamp on hover (tooltip)

**Behavior:**
- Immediate data fetch on click
- Bypasses 30-second polling interval
- Success toast: "Data refreshed successfully!" (2 seconds)
- Error toast: "Failed to refresh. Please try again." (4 seconds)
- Updates timestamp on success

---

### 3. Sync Status Indicator

**Location:** Footer, left side

**Status Indicators:**
- 🟢 **Green dot (pulsing):** Active polling
- ⚪ **Gray dot:** Polling paused (tab inactive)
- 🔴 **Red dot:** Polling error (retry in progress)

**Information Displayed:**
- "Auto-updating every 30s" (when active)
- "Auto-update paused" (when tab inactive)
- "Sync error" (when polling fails)
- "Last updated X seconds ago" (relative time)
- Exact timestamp on hover

**Error Recovery:**
- "Retry now" button appears on persistent errors
- Clicking retry immediately attempts to fetch data
- Auto-dismisses on successful retry

---

### 4. Change Notifications

**Toast Notifications:**
- Appear in bottom-right corner
- Only shown when changes are detected
- Message: "Updates available - X lots changed"
- Auto-dismiss after 3 seconds
- Non-intrusive (doesn't block UI)

**Manual Refresh:**
- Always shows success toast
- Shows error toast with retry option on failure

---

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App Component                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              usePolling Hook                        │    │
│  │                                                     │    │
│  │  • Manages polling lifecycle                       │    │
│  │  • Handles tab visibility                          │    │
│  │  • Implements retry logic                          │    │
│  │  • Provides manual refresh                         │    │
│  └────────────────────────────────────────────────────┘    │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │         apiService.fetchInitialData()              │    │
│  │                                                     │    │
│  │  • Fetches lots and students data                  │    │
│  │  • 10-second timeout                               │    │
│  │  • Returns { lots, students }                      │    │
│  └────────────────────────────────────────────────────┘    │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Data Comparison Logic                      │    │
│  │                                                     │    │
│  │  • Compares array lengths                          │    │
│  │  • Checks lot status, lastUpdated                  │    │
│  │  • Checks student checkedIn, assignedLot           │    │
│  │  • Returns true if changes detected                │    │
│  └────────────────────────────────────────────────────┘    │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │         State Update (if changed)                  │    │
│  │                                                     │    │
│  │  • setLots(newLots)                                │    │
│  │  • setStudents(newStudents)                        │    │
│  │  • Show toast notification                         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Components

#### 1. `usePolling` Hook (`src/hooks/usePolling.js`)

Custom React hook that encapsulates all polling logic.

**Parameters:**
```javascript
{
  interval: 30000,           // Polling interval (ms)
  timeout: 10000,            // Request timeout (ms)
  maxRetries: 3,             // Max retry attempts
  retryBackoff: 5000,        // Initial backoff delay (ms)
  enabled: true,             // Enable/disable polling
  onSuccess: (data, isManual) => {},  // Success callback
  onError: (error, isManual) => {},   // Error callback
  shouldUpdate: (data) => true        // Determine if state should update
}
```

**Returns:**
```javascript
{
  lastUpdated: Date,         // Timestamp of last successful update
  isRefreshing: boolean,     // Whether manual refresh is in progress
  pollingStatus: string,     // 'active' | 'paused' | 'error'
  pollingError: string,      // Error message if polling failed
  retryCount: number,        // Current retry attempt count
  refresh: () => Promise,    // Manual refresh function
  startPolling: () => void,  // Start polling
  stopPolling: () => void    // Stop polling
}
```

**Features:**
- Automatic polling with configurable interval
- Tab visibility detection (pauses when tab hidden)
- Exponential backoff retry logic
- Request timeout support
- Clean lifecycle management
- Memory leak prevention

#### 2. `RefreshButton` Component (`src/components/RefreshButton.jsx`)

Manual refresh button with loading state and timestamp.

**Props:**
```javascript
{
  onRefresh: () => Promise,  // Refresh callback
  isRefreshing: boolean,     // Loading state
  lastUpdated: Date,         // Last update timestamp
  disabled: boolean          // Disabled state
}
```

**Features:**
- Spinning animation during refresh
- Disabled state during loading
- Relative time display ("Updated 2 minutes ago")
- Exact timestamp on hover
- Responsive (hides timestamp on mobile)

#### 3. `SyncStatusIndicator` Component (`src/components/SyncStatusIndicator.jsx`)

Footer status indicator with color-coded dots.

**Props:**
```javascript
{
  pollingStatus: string,     // 'active' | 'paused' | 'error'
  lastUpdated: Date,         // Last update timestamp
  pollingInterval: number,   // Polling interval (ms)
  pollingError: string,      // Error message
  onRetry: () => Promise     // Retry callback
}
```

**Features:**
- Color-coded status dots (green/gray/red)
- Pulsing animation for active status
- Relative time updates every second
- Retry button on errors
- Tooltip with exact timestamp

---

### Configuration Constants

Defined at the top of `app.jsx`:

```javascript
const POLLING_INTERVAL_MS = 30000;  // 30 seconds
const POLLING_TIMEOUT_MS = 10000;   // 10 seconds
const MAX_RETRY_ATTEMPTS = 3;       // 3 retries
const RETRY_BACKOFF_MS = 5000;      // 5 seconds initial backoff
```

**To adjust polling frequency:**
1. Change `POLLING_INTERVAL_MS` value
2. Update footer text in `SyncStatusIndicator` component
3. Redeploy application

---

### Data Comparison Strategy

The `shouldUpdateData` function compares new data with previous data to determine if state should update:

**Quick Checks:**
1. Array length comparison (lots and students)
2. If lengths differ → update immediately

**Detailed Checks (if lengths match):**
1. **Lots:** Compare `id`, `status`, `lastUpdated`, `totalStudentsSignedUp`
2. **Students:** Compare `id`, `checkedIn`, `assignedLot`
3. If any field differs → update

**Benefits:**
- Prevents unnecessary re-renders
- Optimizes performance
- Reduces battery usage
- Maintains UI responsiveness

---

## User Experience

### Silent Operation

Background polling is completely invisible to users:
- No loading spinners
- No UI blocking
- No performance degradation
- No interruption of user workflows

### Clear Feedback

Users always know the sync status:
- Last updated timestamp in header
- Status indicator in footer
- Toast notifications for changes
- Error messages with retry options

### Non-Intrusive

Notifications are minimal and auto-dismiss:
- Bottom-right corner placement
- 2-3 second auto-dismiss
- Only shown when relevant
- Doesn't block content

---

## Testing

### Manual Testing Checklist

- [x] Background polling starts automatically on app load
- [x] Polling pauses when switching to another browser tab
- [x] Polling resumes when returning to the tab
- [x] Manual refresh button shows spinning animation during refresh
- [x] "Last updated" timestamp updates correctly
- [x] Toast notifications appear only when changes are detected
- [x] Error handling works (test by disconnecting network)
- [x] Retry logic works after network errors
- [x] No UI jank or freezing during updates
- [x] Multiple users can see each other's changes within 30 seconds
- [x] Polling stops when navigating away from the app

### Multi-User Testing

**Setup:**
1. Open app in two different browsers (or incognito mode)
2. Log in as different users in each browser
3. Make changes in one browser (e.g., update lot status)
4. Verify changes appear in other browser within 30 seconds

**Expected Behavior:**
- Changes appear automatically without manual refresh
- Toast notification shows "Updates available - X lots changed"
- Last updated timestamp updates
- No performance issues or lag

---

## Performance Considerations

### Optimizations Implemented

1. **Smart Data Comparison:**
   - Only updates state when data actually changes
   - Prevents unnecessary re-renders
   - Reduces CPU usage

2. **Tab Visibility Detection:**
   - Pauses polling when tab is hidden
   - Saves battery on mobile devices
   - Reduces server load

3. **Request Timeout:**
   - 10-second timeout prevents hanging requests
   - Fails fast on slow networks
   - Triggers retry logic automatically

4. **Exponential Backoff:**
   - Prevents server overload during outages
   - Gradually increases retry delay
   - Automatic recovery when service restored

5. **Memory Management:**
   - Proper cleanup on unmount
   - No memory leaks
   - Efficient ref usage

### Performance Metrics

**Expected Performance:**
- Polling overhead: < 1% CPU usage
- Memory footprint: < 5MB additional
- Network usage: ~10KB per poll (compressed)
- Battery impact: Minimal (pauses when tab inactive)

---

## Troubleshooting

### Issue: Polling Not Working

**Symptoms:**
- Status indicator shows "paused" or "error"
- Last updated timestamp not updating
- No toast notifications

**Solutions:**
1. Check browser console for errors
2. Verify Google Apps Script API is accessible
3. Check network connection
4. Try manual refresh button
5. Reload the page

### Issue: Too Many Notifications

**Symptoms:**
- Toast notifications appearing too frequently
- Distracting user experience

**Solutions:**
1. Adjust `POLLING_INTERVAL_MS` to longer interval (e.g., 60000 for 1 minute)
2. Modify `shouldUpdateData` logic to be more selective
3. Disable notifications for minor changes

### Issue: Performance Degradation

**Symptoms:**
- UI feels sluggish
- High CPU usage
- Battery draining quickly

**Solutions:**
1. Increase polling interval
2. Check data comparison logic efficiency
3. Verify no memory leaks in browser dev tools
4. Ensure tab visibility detection is working

---

## Future Enhancements

### Potential Improvements

1. **WebSocket Support:**
   - True real-time updates (if Google Apps Script supports it)
   - Instant change propagation
   - Reduced server load

2. **Optimistic UI Updates:**
   - Show changes immediately
   - Sync in background
   - Rollback on conflict

3. **Conflict Resolution:**
   - Detect simultaneous edits
   - Merge changes intelligently
   - Notify users of conflicts

4. **Offline Support:**
   - Local caching with IndexedDB
   - Queue changes when offline
   - Sync when connection restored

5. **Push Notifications:**
   - Browser notifications for critical updates
   - Customizable notification preferences
   - Sound alerts for urgent changes

6. **Selective Polling:**
   - Only poll for data relevant to current tab
   - Reduce unnecessary data transfer
   - Improve performance

---

## API Requirements

The polling system uses the existing `apiService.fetchInitialData()` method:

**Endpoint:** Google Apps Script Web App URL + `?action=data`

**Response Format:**
```javascript
{
  lots: [
    {
      id: "lot-101",
      name: "Lot 11 - Jal Jal",
      status: "pending-approval",
      zone: "Zone 1",
      priority: "high",
      totalStudentsSignedUp: 4,
      lastUpdated: "2025-10-11T16:19:47Z",
      // ... other fields
    }
  ],
  students: [
    {
      id: "student-1",
      name: "Emma Johnson",
      checkedIn: true,
      assignedLot: "lot-101",
      // ... other fields
    }
  ]
}
```

**No API changes required** - the polling system works with the existing API.

---

## Summary

The real-time synchronization feature provides:

✅ **Automatic background polling** every 30 seconds  
✅ **Manual refresh button** with visual feedback  
✅ **Sync status indicator** in footer  
✅ **Change notifications** when updates detected  
✅ **Intelligent lifecycle management** (pause/resume)  
✅ **Error handling** with retry logic  
✅ **Performance optimizations** for battery and CPU  
✅ **Non-intrusive UX** with minimal notifications  

**Result:** Near real-time collaboration without sacrificing performance or user experience.

---

**Status:** ✅ Fully implemented and ready for production  
**Last Updated:** 2025-10-01

