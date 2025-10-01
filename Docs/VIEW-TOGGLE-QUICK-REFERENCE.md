# View Toggle Feature - Quick Reference

**Component:** `src/components/ParkingLotsScreen.jsx`  
**Status:** ✅ Implemented (Phases 1 & 2)  
**Date:** 2025-10-01

---

## Quick Overview

The Parking Lots screen now supports three view modes:
- **Card View** (default) - Enhanced card grid
- **List View** - Sortable table/list
- **Map View** - Location-based display with directions

User's view preference is saved in localStorage.

---

## View Modes

### Card View (Grid3x3 icon)
- **Best for:** Detailed lot information and status management
- **Layout:** Responsive grid (1-4 columns)
- **Features:**
  - Enhanced lot cards with status colors
  - Full status change controls (admins)
  - Edit details button (admins)
  - Notes and comments display
  - Attendance tracking

### List View (List icon)
- **Best for:** Quick scanning and comparison
- **Desktop:** Sortable table with columns
- **Mobile:** Stacked card-like items
- **Features:**
  - Sort by: name, status, section, attendance, updated
  - Compact, scannable layout
  - Color-coded status borders
  - Quick edit access (admins)

### Map View (Map icon)
- **Best for:** Location-based navigation
- **Current:** Placeholder + directions feature
- **Future:** Interactive Google Maps
- **Features:**
  - Get Directions to any lot
  - Student assigned lot highlighting
  - Attendance display
  - Status badges

---

## How to Use

### Switching Views
1. Navigate to "Parking Lots" tab
2. Look for view toggle at top of screen
3. Click desired view icon (Card/List/Map)
4. View preference is automatically saved

### Sorting in List View
1. Switch to List View
2. Click any column header to sort
3. Click again to reverse sort direction
4. Active sort column highlighted with blue icon

### Getting Directions (Map View)
1. Switch to Map View
2. Find desired lot in the list
3. Click "Get Directions" button
4. Google Maps opens in new tab with route

---

## localStorage Key

```javascript
// Key: 'tbtc-lots-view-mode'
// Values: 'card', 'list', 'map'
// Location: Browser localStorage
```

To reset view preference:
```javascript
localStorage.removeItem('tbtc-lots-view-mode');
```

---

## Components

### LotCard (existing)
- **File:** `src/components/ParkingLotsScreen.jsx` (lines 100-240)
- **Used in:** Card View
- **Props:** lot, students, currentUser, onStatusChange, onEditClick, getStatusStyles, statuses, StatusBadge

### LotListView (new)
- **File:** `src/components/ParkingLotsScreen.jsx` (lines 243-458)
- **Used in:** List View
- **Features:** Sortable table (desktop), stacked cards (mobile)

### LotMapView (new)
- **File:** `src/components/ParkingLotsScreen.jsx` (lines 459-657)
- **Used in:** Map View
- **Features:** Directions, assigned lot highlighting

---

## Responsive Behavior

| Screen Size | Card View | List View | Map View |
|-------------|-----------|-----------|----------|
| < 768px | 1 column | Stacked cards | 1 column |
| 768px - 1024px | 2 columns | Table | 2 columns |
| 1024px - 1280px | 3 columns | Table | 3 columns |
| ≥ 1280px | 4 columns | Table | 3 columns |

---

## Filter Behavior

- **Card View:** All filters active
- **List View:** All filters active
- **Map View:** Filters hidden, shows all lots

---

## Permission-Based Features

### Admin (Director)
- ✅ All three views accessible
- ✅ Can change lot status (Card & List views)
- ✅ Can edit lot details (all views)
- ✅ Can sort in List View

### Volunteer
- ✅ All three views accessible
- ✅ Read-only mode
- ❌ Cannot change status
- ❌ Cannot edit details
- ✅ Can sort in List View

### Student
- ✅ All three views accessible
- ✅ Assigned lot highlighted in Map View
- ✅ Can get directions to assigned lot
- ❌ Cannot change status
- ❌ Cannot edit details

---

## Data Requirements

### For Full Map View Functionality

**Google Sheets - Add to "Lots" tab:**
```
Column L: latitude  (number)
Column M: longitude (number)
```

**Backend Update - Code.gs:**
```javascript
headers: [
  // ... existing fields ...
  "latitude", "longitude"
]
```

**Example Coordinates (Iowa City, IA):**
```
Lot A: 41.6611, -91.5302
Lot B: 41.6625, -91.5315
Lot C: 41.6640, -91.5328
```

---

## Keyboard Shortcuts

| Action | Key |
|--------|-----|
| Switch to Card View | Tab to button, Enter |
| Switch to List View | Tab to button, Enter |
| Switch to Map View | Tab to button, Enter |
| Sort column (List View) | Tab to header, Enter |

---

## Troubleshooting

### View toggle not showing
- **Check:** Component is ParkingLotsScreen
- **Check:** Browser supports localStorage
- **Fix:** Clear browser cache

### View preference not saving
- **Check:** localStorage is enabled
- **Check:** Not in private/incognito mode
- **Fix:** Check browser settings

### List View not sorting
- **Check:** Clicked on column header
- **Check:** Data is available
- **Fix:** Refresh page

### Map View shows "Not Available"
- **Cause:** Lots don't have coordinates
- **Fix:** Add latitude/longitude to Google Sheets
- **See:** GOOGLE-MAPS-INTEGRATION-GUIDE.md

### Get Directions not working
- **Check:** Lot has coordinates
- **Check:** Pop-up blocker not blocking
- **Fix:** Allow pop-ups for this site

---

## Common Tasks

### Change Default View
Edit `ParkingLotsScreen.jsx`:
```javascript
const [viewMode, setViewMode] = useState(() => {
  const saved = localStorage.getItem('tbtc-lots-view-mode');
  return saved || 'list'; // Change 'card' to 'list' or 'map'
});
```

### Add New Sort Field (List View)
Edit `LotListView` component:
```javascript
// Add to sortField switch statement
case 'newField':
  aVal = a.newField;
  bVal = b.newField;
  break;
```

### Customize Map View Placeholder
Edit `LotMapView` component (lines 520-540)

### Hide View Toggle for Specific Roles
Edit `ParkingLotsScreen` return statement:
```javascript
{currentUser.role === 'admin' && (
  <div className="flex items-center gap-2">
    {/* View toggle buttons */}
  </div>
)}
```

---

## Testing Checklist

### Visual Testing
- [ ] View toggle displays correctly
- [ ] All three views render without errors
- [ ] Transitions are smooth
- [ ] Dark mode works in all views
- [ ] Mobile layout is responsive

### Functional Testing
- [ ] View preference persists across sessions
- [ ] Filters work in Card and List views
- [ ] Sorting works in List View
- [ ] Get Directions opens Google Maps
- [ ] Student assigned lot highlights

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Screen reader announces view changes
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA

---

## Performance Notes

- **View switching:** < 200ms transition
- **List sorting:** Instant (memoized)
- **localStorage:** Negligible overhead
- **Animations:** GPU-accelerated

---

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ iOS Safari 14+
- ✅ Chrome Mobile 90+

---

## Related Documentation

- **Implementation Summary:** `VIEW-TOGGLE-IMPLEMENTATION-SUMMARY.md`
- **Google Maps Guide:** `GOOGLE-MAPS-INTEGRATION-GUIDE.md`
- **Lot Card Enhancement:** `LOT-CARD-UI-ENHANCEMENT-SUMMARY.md`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-01 | Initial implementation (Phases 1 & 2) |

---

## Support

**Questions?** Check the full documentation or review code comments in `src/components/ParkingLotsScreen.jsx`.

**Issues?** See Troubleshooting section above or GOOGLE-MAPS-INTEGRATION-GUIDE.md for Map View setup.

