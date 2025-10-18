# Map View Feature - Implementation Guide

**Status:** ✅ Implemented  
**Date:** 2025-10-18  
**Technology:** Leaflet + OpenStreetMap (React Leaflet 4.2.1)

---

## Overview

The Map View feature provides an interactive map display of all 22 TBTC parking lots with the following capabilities:

- **Interactive Map**: Pan, zoom, and click on parking lots to view details
- **Status-Based Color Coding**: Lots are color-coded based on their current status
- **Polygon Visualization**: Each lot is displayed as a polygon shape on the map
- **Click-to-View Details**: Click on any lot to see detailed information in a popup or modal
- **Get Directions**: Direct integration with Google Maps for navigation
- **Responsive Design**: Works on desktop and mobile devices
- **Legend**: Visual legend explaining the color coding system

---

## Technology Stack

### Why Leaflet + OpenStreetMap?

After evaluating multiple options, we chose Leaflet with OpenStreetMap for the following reasons:

1. **Completely Free**: No API keys, no usage limits, no billing setup required
2. **Lightweight**: Smaller bundle size compared to Google Maps
3. **Easy Integration**: Simple React integration with `react-leaflet`
4. **Full Features**: Supports polygons, markers, popups, and all needed functionality
5. **No Vendor Lock-in**: Open-source solution with active community support

### Dependencies

```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "4.2.1"
}
```

**Note:** We use React Leaflet 4.2.1 (not 5.x) for compatibility with React 18.

---

## File Structure

### New Files Created

1. **`src/data/lotCoordinates.js`**
   - Contains latitude/longitude coordinates for all 22 parking lots
   - Includes polygon boundary points for each lot
   - Provides helper functions: `getLotCoordinates()`, `getAllLotCoordinates()`, `getMapCenter()`

2. **`src/components/LeafletMapView.jsx`**
   - Main map component using React Leaflet
   - Renders interactive map with lot polygons
   - Handles click events, popups, and modals
   - Includes legend and status-based color coding

### Modified Files

1. **`src/components/ParkingLotsScreen.jsx`**
   - Added import for `LeafletMapView`
   - Exported `getStatusCardColors()` function for use in LeafletMapView
   - Replaced placeholder `LotMapView` with wrapper that calls `LeafletMapView`
   - Removed duplicate `case 'ready':` clause in switch statement

---

## Lot Coordinates

**UPDATE (2025-10-18):** Coordinates have been updated to use **real polygon data** extracted from University of Iowa parking lot KML file.

- **15 out of 22 lots** now use actual polygon boundaries from KML data
- **7 lots** still use approximate coordinates (not found in KML file)
- See `Docs/KML-POLYGON-EXTRACTION.md` for details

All 22 parking lots have coordinates assigned:

### Zone 1 - East Side of River (3 lots)
- Lot 3 - Library Lot
- Lot 11 - Jail Lot
- Lot 55 - Hancher

### Zone 2 - South of Melrose Ave (5 lots)
- Lot 48 - Myrtle
- Lot 53 - Melrose Court
- Lot 49 - Red Barn
- Lot 58 - Adjacent to Lot 49
- Ramp 4 (South Side)

### Zone 3 - North of Kinnick Stadium Area (4 lots)
- Lot 75 - Arena Commuter
- Lot 46 - Carver
- Lot 40 - Dental Lot
- Lot 65 - Finkbine

### Zone 4 - Kinnick Stadium Area (3 lots)
- Lot 43 N - N of Hawkeye Ramp
- Lot 43 NW - Rec Bldg Area
- Lot 43 W - West of Kinnick

### Zone 5 - Far West Campus (4 lots)
- Lot 85 - Hawkeye Commuter
- Soccer Lot - Lower Finkbine
- Softball Lot
- Lot 71 - Hall of Fame

### Zone 6 - Golf Course Area (2 lots)
- Golf Course
- Lot 73 - University Club

**Note:**
- **15 lots** use real polygon data extracted from University of Iowa KML file (accurate boundaries)
- **7 lots** use approximate coordinates based on addresses (need manual refinement)
- See `Docs/KML-POLYGON-EXTRACTION.md` for extraction details and missing lots

---

## Features

### 1. Interactive Map Display

- **Map Library**: Leaflet with OpenStreetMap tiles
- **Default View**: Automatically centers and zooms to show all lots
- **Controls**: Pan, zoom in/out, full-screen (standard Leaflet controls)

### 2. Lot Visualization

Each parking lot is displayed as a **polygon** on the map with:

- **Color Coding**: Based on lot status
  - Ready: Teal (#14B8A6)
  - In Progress: Blue (#3B82F6)
  - Needs Help: Red (#EF4444)
  - Pending Approval: Yellow (#EAB308)
  - Complete: Green (#10B981)
- **Opacity**: 40% fill opacity for better visibility
- **Border**: 2px border (3px for assigned lots)
- **Hover Effect**: Polygons are clickable

### 3. Click-to-View Details

When a user clicks on a lot polygon:

1. **Popup (on map)**: Shows basic information
   - Lot name
   - Current status
   - Student count (AI-scanned or manual)
   - Zone
   - "Get Directions" button

2. **Modal (detailed view)**: Shows comprehensive information
   - Lot name
   - Status badge
   - Student count with AI indicator
   - Zone
   - Notes/comments
   - Last updated timestamp and user
   - "Get Directions" button

### 4. Get Directions

- Opens Google Maps in a new tab with directions to the selected lot
- Uses user's current location as origin (if geolocation permission granted)
- Falls back to destination-only if location not available

### 5. Legend

Visual legend at the bottom of the map showing:
- Color coding for each status
- Responsive grid layout (2 columns on mobile, 6 on desktop)

### 6. Student Assigned Lot Highlighting

For students:
- Their assigned lot is highlighted with a blue border and ring
- Popup shows "Your Assigned Lot" badge

---

## User Permissions

The Map View respects the existing permission system:

- **All Users**: Can view the map and lot details
- **Students**: See their assigned lot highlighted
- **Parent Volunteers**: Can view all lots
- **Admins/Directors**: Can view all lots (future: may add ability to update status from map)

---

## Responsive Design

### Desktop (≥1024px)
- Full-width map (600px height)
- Legend in 6-column grid
- Modal centered on screen

### Tablet (768px - 1023px)
- Full-width map (600px height)
- Legend in 3-column grid
- Modal centered on screen

### Mobile (<768px)
- Full-width map (600px height)
- Legend in 2-column grid
- Modal full-width with padding

---

## Data Integration

### Lot Data Source

The Map View integrates with the existing data flow:

1. **Google Sheet**: Lot data is fetched from the "Lots" tab
2. **API Service**: Uses existing `api-service.js` to fetch lot data
3. **Coordinate Mapping**: Merges lot data with coordinates from `lotCoordinates.js`

### Real-Time Updates

- Map view updates when lot statuses change in the system
- Uses React's state management to re-render polygons with new colors
- No manual refresh required

---

## Navigation

The Map View is accessible via the view mode toggle in the Parking Lots screen:

1. **Card View** (default): Grid of lot cards
2. **List View**: Sortable table of lots
3. **Map View**: Interactive map (NEW)

Users can switch between views using the toggle buttons at the top of the screen.

---

## Future Enhancements

### Potential Improvements

1. **Real GPS Coordinates**: Replace approximate coordinates with actual GPS data
2. **Polygon Refinement**: Use actual lot boundary shapes from satellite imagery
3. **Clustering**: Group nearby lots when zoomed out
4. **Heat Map**: Show lot activity/traffic patterns
5. **Route Optimization**: Suggest optimal cleanup order based on location
6. **Status Update from Map**: Allow admins to update lot status directly from the map
7. **Photo Overlay**: Display sign-in sheet photos on the map
8. **Student Tracking**: Show real-time student locations (with permission)
9. **Offline Support**: Cache map tiles for offline use
10. **Custom Markers**: Add custom icons for different lot types

---

## Troubleshooting

### Map Not Displaying

**Issue**: Map container is empty or shows gray box

**Solutions**:
1. Check that Leaflet CSS is imported: `import 'leaflet/dist/leaflet.css'`
2. Verify map container has explicit height: `style={{ height: '600px' }}`
3. Check browser console for errors

### Polygons Not Showing

**Issue**: Map displays but no lot polygons visible

**Solutions**:
1. Verify lot coordinates are loaded: Check `lotCoordinates.js`
2. Check that lots have matching IDs between Google Sheet and coordinate data
3. Verify polygon positions array is valid: `[[lat, lng], [lat, lng], ...]`

### Marker Icons Missing

**Issue**: Default Leaflet markers show broken image icons

**Solution**: The fix is already implemented in `LeafletMapView.jsx`:
```javascript
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
```

---

## Testing Checklist

- [x] Map displays correctly on desktop
- [x] Map displays correctly on mobile
- [x] All 22 lots are visible on the map
- [x] Lot polygons are color-coded by status
- [x] Clicking a lot shows popup with details
- [x] "Get Directions" button opens Google Maps
- [x] Legend displays all status colors
- [x] Student assigned lot is highlighted
- [x] Map centers and zooms to show all lots
- [x] No console errors
- [x] Responsive design works on all screen sizes

---

## References

- **Leaflet Documentation**: https://leafletjs.com/
- **React Leaflet Documentation**: https://react-leaflet.js.org/
- **OpenStreetMap**: https://www.openstreetmap.org/
- **TBTC Lot Reference**: `Docs/REAL-LOTS-REFERENCE.md`
- **UI Parking Map (Reference)**: https://maps.facilities.uiowa.edu/buildings/

---

## Summary

The Map View feature successfully provides an interactive, visual way for users to view and navigate to parking lots. It uses free, open-source technology (Leaflet + OpenStreetMap) and integrates seamlessly with the existing TBTC application architecture. The feature is fully responsive, accessible, and ready for production use.

