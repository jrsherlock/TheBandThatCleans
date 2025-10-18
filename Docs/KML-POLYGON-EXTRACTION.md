# KML Polygon Extraction - Real Coordinate Data

**Date:** 2025-10-18  
**Status:** ✅ Complete  
**Source:** University of Iowa Parking Lot KML Data

---

## Overview

The TBTC Map View has been updated to use **real polygon coordinate data** extracted from the University of Iowa parking lot KML file (`Polygons.kml`). This replaces the approximate coordinates that were initially created and provides accurate, precise lot boundaries for the interactive map.

---

## KML File Details

- **File:** `/Users/sherlock/TBTC-MVP/Polygons.kml`
- **Format:** KML (Keyhole Markup Language) - Google Earth/Maps format
- **Total Lots in KML:** 65 parking lots
- **Matched TBTC Lots:** 15 out of 22 lots

---

## Extraction Process

### 1. KML Parsing Script

Created `parse_kml.py` - a Python script that:
- Parses the KML XML structure
- Extracts polygon coordinates for each lot
- Converts KML coordinates (longitude, latitude, altitude) to Leaflet format ([latitude, longitude])
- Calculates center points for each polygon
- Generates updated `src/data/lotCoordinates.js` file

### 2. Lot Mapping

The script uses a mapping table to match TBTC lot IDs with KML placemark names:

| TBTC Lot ID | TBTC Lot Name | KML Placemark Name | Status |
|-------------|---------------|-------------------|--------|
| lot-1 | Lot 3 - Library Lot | Library Lot | ✅ Matched |
| lot-2 | Lot 11 - Jail Lot | N/A | ❌ Not in KML |
| lot-3 | Lot 55 - Hancher | Hancher Commuter Lot | ✅ Matched |
| lot-4 | Lot 48 - Myrtle | Lot 48 | ✅ Matched |
| lot-5 | Lot 53 - Melrose Court | Lot 53 | ✅ Matched |
| lot-6 | Lot 49 - Red Barn | Lot 49 | ✅ Matched |
| lot-7 | Lot 58 - Adjacent to Lot 49 | N/A | ❌ Not in KML |
| lot-8 | Ramp 4 (South Side) | N/A | ❌ Not in KML |
| lot-9 | Lot 75 - Arena Commuter | Arena Commuter Lot | ✅ Matched |
| lot-10 | Lot 46 - Carver | Lot 46/47 | ✅ Matched |
| lot-11 | Lot 40 - Dental Lot | Lot 40 | ✅ Matched |
| lot-12 | Lot 65 - Finkbine | Finkbine Commuter Lot | ✅ Matched |
| lot-13 | Lot 43 N - N of Hawkeye Ramp | Lot 43 | ✅ Matched |
| lot-14 | Lot 43 NW - Rec Bldg Area | Lot 43 | ✅ Matched |
| lot-15 | Lot 43 W - West of Kinnick | Lot 43 | ✅ Matched |
| lot-16 | Lot 85 - Hawkeye Commuter | Hawkeye Commuter Lot | ✅ Matched |
| lot-17 | Soccer Lot - Lower Finkbine | N/A | ❌ Not in KML |
| lot-18 | Softball Lot | N/A | ❌ Not in KML |
| lot-19 | Lot 71 - Hall of Fame | Lot 71 | ✅ Matched |
| lot-20 | Golf Course | N/A | ❌ Not in KML |
| lot-21 | Lot 73 - University Club | Lot 73 | ✅ Matched |

**Match Rate:** 15/22 (68.2%)

---

## Coordinate Format

### KML Format (Input)
```xml
<coordinates>
  -91.5357994,41.6668613,0
  -91.5348218,41.6668683,0
  -91.5348278,41.6670286,0
  ...
</coordinates>
```

**Format:** `longitude,latitude,altitude` (one per line)

### Leaflet Format (Output)
```javascript
polygon: [
  [41.6668613, -91.5357994],
  [41.6668683, -91.5348218],
  [41.6670286, -91.5348278],
  ...
]
```

**Format:** `[latitude, longitude]` (array of arrays)

---

## Generated File Structure

The updated `src/data/lotCoordinates.js` contains:

```javascript
export const LOT_COORDINATES = {
  'lot-1': {
    id: 'lot-1',
    name: 'Lot 3 - Library Lot',
    center: [41.65958655714286, -91.53979714285715],  // Calculated center
    polygon: [
      [41.6590575, -91.540237],
      [41.6590616, -91.539545],
      // ... more points
    ]
  },
  // ... more lots
};
```

---

## Benefits of Real Polygon Data

### 1. **Accuracy**
- Exact lot boundaries instead of approximate rectangles
- Matches actual parking lot shapes and sizes
- Reflects real-world geography

### 2. **Visual Fidelity**
- Polygons match satellite imagery
- Irregular lot shapes are accurately represented
- Better user experience for navigation

### 3. **Precision**
- Center points calculated from actual polygon vertices
- More accurate "Get Directions" functionality
- Better map zoom/fit calculations

---

## Lots Not in KML

The following 7 TBTC lots were not found in the KML file and will need manual coordinate entry or alternative data sources:

1. **lot-2** - Lot 11 - Jail Lot (500 S Madison)
2. **lot-7** - Lot 58 - Adjacent to Lot 49 (20 stalls)
3. **lot-8** - Ramp 4 (South Side) (South side of Ramp 4 along Melrose)
4. **lot-17** - Soccer Lot - Lower Finkbine (Highway 6)
5. **lot-18** - Softball Lot (105 1st Ave, Coralville)
6. **lot-20** - Golf Course (1380 Melrose Ave)

**Note:** These lots may be:
- New lots not yet in the UI parking system
- Off-campus lots not managed by UI
- Lots with different names in the KML file

---

## Special Cases

### Lot 43 Variants

The TBTC system tracks Lot 43 as three separate lots:
- lot-13: Lot 43 N - N of Hawkeye Ramp
- lot-14: Lot 43 NW - Rec Bldg Area
- lot-15: Lot 43 W - West of Kinnick

However, the KML file contains only one "Lot 43" polygon. Currently, all three TBTC lots use the same polygon data. This should be refined by:
1. Manually dividing the Lot 43 polygon into three sections
2. Or using approximate coordinates for the three sub-lots
3. Or treating them as a single lot in the map view

---

## Running the Extraction Script

To re-generate the coordinates file:

```bash
# From the project root directory
python3 parse_kml.py
```

**Output:**
```
Parsing KML file...
Found 65 lots in KML file

Matched TBTC lots:
  ✓ lot-1: Library Lot
  ✓ lot-3: Hancher Commuter Lot
  ✓ lot-4: Lot 48
  ...

Generating JavaScript file...
✓ Generated src/data/lotCoordinates.js
```

---

## Future Improvements

### 1. Complete Missing Lots
- Manually add coordinates for the 7 missing lots
- Use Google Maps or satellite imagery to trace polygon boundaries
- Or use approximate rectangular polygons

### 2. Refine Lot 43
- Divide the Lot 43 polygon into three sub-sections
- Assign each sub-section to the appropriate TBTC lot ID

### 3. Validate Coordinates
- Cross-reference with actual lot locations
- Verify polygon accuracy with satellite imagery
- Test "Get Directions" functionality for each lot

### 4. Automate Updates
- Set up a process to periodically update from UI parking data
- Monitor for new lots or boundary changes
- Version control for coordinate data

---

## Technical Details

### Coordinate Precision

- **Latitude/Longitude:** 7-8 decimal places (~1-10 cm precision)
- **Center Calculation:** Average of all polygon vertices
- **Polygon Closure:** First and last points are the same (closed polygon)

### File Size

- **Original (approximate):** ~8 KB
- **Updated (real polygons):** ~12 KB
- **Increase:** ~50% (due to more detailed polygon shapes)

---

## Testing

After updating the coordinates:

- [x] Map displays correctly
- [x] Polygons render with accurate shapes
- [x] Center points are calculated correctly
- [x] "Get Directions" works for matched lots
- [x] No console errors
- [x] HMR (Hot Module Replacement) updates successfully

---

## References

- **KML File:** `/Users/sherlock/TBTC-MVP/Polygons.kml`
- **Extraction Script:** `/Users/sherlock/TBTC-MVP/parse_kml.py`
- **Generated File:** `/Users/sherlock/TBTC-MVP/src/data/lotCoordinates.js`
- **Map Component:** `/Users/sherlock/TBTC-MVP/src/components/LeafletMapView.jsx`
- **KML Specification:** https://developers.google.com/kml/documentation/kmlreference
- **Leaflet Documentation:** https://leafletjs.com/reference.html#polygon

---

## Summary

The TBTC Map View now uses **real, accurate polygon data** for 15 out of 22 parking lots, extracted from the University of Iowa parking lot KML file. This provides a significant improvement in visual accuracy and user experience. The remaining 7 lots will need manual coordinate entry or alternative data sources to complete the map.

