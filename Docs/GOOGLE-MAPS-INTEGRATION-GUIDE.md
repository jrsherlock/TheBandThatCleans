# Google Maps Integration Guide for TBTC Map View

**Component:** `src/components/ParkingLotsScreen.jsx` - LotMapView  
**Status:** 🔲 Not Yet Implemented (Phase 3)  
**Prerequisites:** Google Cloud account, billing enabled

---

## Overview

This guide walks through the complete process of integrating Google Maps into the TBTC Parking Lots Map View, from API setup to implementation.

---

## Part 1: Google Cloud Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "TBTC Parking Lot App"
4. Click "Create"

### Step 2: Enable Required APIs

1. In the Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Maps JavaScript API** (for displaying the map)
   - **Directions API** (for route calculations)
   - **Geocoding API** (optional - for address lookup)

### Step 3: Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key (you'll need this later)
4. Click "Edit API key" to configure restrictions

### Step 4: Restrict API Key (Important for Security)

**Application Restrictions:**
1. Select "HTTP referrers (web sites)"
2. Add your domains:
   ```
   http://localhost:3000/*
   https://yourdomain.com/*
   https://*.yourdomain.com/*
   ```

**API Restrictions:**
1. Select "Restrict key"
2. Choose:
   - Maps JavaScript API
   - Directions API
   - Geocoding API (if using)

3. Click "Save"

### Step 5: Enable Billing

⚠️ **Important:** Google Maps requires a billing account, but offers $200/month free credit.

1. Go to "Billing" in Cloud Console
2. Link a billing account or create a new one
3. Add payment method

**Cost Estimate for TBTC:**
- Maps JavaScript API: $7 per 1,000 loads
- Directions API: $5 per 1,000 requests
- With $200 free credit, you can handle ~28,000 map loads/month for free

---

## Part 2: Add Coordinates to Parking Lots

### Update Google Sheets

1. Open your TBTC Google Sheet
2. Go to the "Lots" tab
3. Add two new columns at the end:
   - **Column L:** `latitude`
   - **Column M:** `longitude`

4. Fill in coordinates for each lot:
   ```
   Example for Iowa City, IA area:
   Lot A: 41.6611, -91.5302
   Lot B: 41.6625, -91.5315
   Lot C: 41.6640, -91.5328
   ```

**How to Find Coordinates:**
1. Go to [Google Maps](https://maps.google.com)
2. Right-click on the parking lot location
3. Click the coordinates (e.g., "41.6611, -91.5302")
4. Coordinates are copied to clipboard
5. Paste into spreadsheet (latitude first, then longitude)

### Update Backend (Code.gs)

Edit the `SHEETS.LOTS.headers` array:

```javascript
const SHEETS = {
  LOTS: {
    name: "Lots",
    headers: [
      "id", "name", "section", "status", "priority",
      "totalStudentsSignedUp", "comment", "lastUpdated", "updatedBy",
      "actualStartTime", "completedTime", "signUpSheetPhoto",
      "latitude", "longitude"  // ADD THESE TWO
    ]
  },
  // ... other sheets
};
```

**Deploy the updated script:**
1. In Apps Script editor, click "Deploy" → "New deployment"
2. Select "Web app"
3. Click "Deploy"
4. Copy the new deployment URL (if changed)

---

## Part 3: Frontend Implementation

### Step 1: Add Environment Variable

Create `.env` file in project root:

```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

Add to `.gitignore`:
```
.env
.env.local
.env.production
```

### Step 2: Install Google Maps React Library (Optional)

For easier integration, you can use a React wrapper:

```bash
npm install @react-google-maps/api
```

Or use the vanilla JavaScript API (no additional dependencies).

### Step 3: Update LotMapView Component

Replace the placeholder in `src/components/ParkingLotsScreen.jsx`:

```javascript
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const LotMapView = ({ lots, students, currentUser, onStatusChange, getStatusStyles, StatusBadge }) => {
  const [selectedLot, setSelectedLot] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [map, setMap] = useState(null);

  const canEdit = hasPermission(currentUser, 'canEditLotStatus');

  // Get user's assigned lot (for students)
  const assignedLot = useMemo(() => {
    if (currentUser.role === 'student') {
      return lots.find(lot => (lot.assignedStudents || []).includes(currentUser.id));
    }
    return null;
  }, [lots, currentUser]);

  // Request user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Filter lots with coordinates
  const lotsWithCoordinates = lots.filter(lot => lot.latitude && lot.longitude);

  // Calculate map center
  const mapCenter = useMemo(() => {
    if (lotsWithCoordinates.length === 0) return { lat: 41.6611, lng: -91.5302 };
    
    const avgLat = lotsWithCoordinates.reduce((sum, lot) => sum + parseFloat(lot.latitude), 0) / lotsWithCoordinates.length;
    const avgLng = lotsWithCoordinates.reduce((sum, lot) => sum + parseFloat(lot.longitude), 0) / lotsWithCoordinates.length;
    
    return { lat: avgLat, lng: avgLng };
  }, [lotsWithCoordinates]);

  // Get marker color based on status
  const getMarkerColor = (status) => {
    switch (status) {
      case 'complete': return '#10B981';
      case 'in-progress': return '#3B82F6';
      case 'needs-help': return '#EF4444';
      case 'pending-approval': return '#EAB308';
      case 'not-started': default: return '#6B7280';
    }
  };

  // Get directions
  const getDirections = (lot) => {
    const destination = `${lot.latitude},${lot.longitude}`;
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}${origin ? `&origin=${origin}` : ''}`;
    window.open(url, '_blank');
  };

  if (lotsWithCoordinates.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <MapIcon size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Map View Not Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Parking lot location coordinates have not been configured yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Google Map */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '600px' }}
            center={mapCenter}
            zoom={15}
            onLoad={setMap}
            options={{
              styles: [], // Add custom styles for dark mode if needed
              zoomControl: true,
              streetViewControl: true,
              mapTypeControl: true,
              fullscreenControl: true,
            }}
          >
            {/* User location marker */}
            {userLocation && (
              <Marker
                position={userLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#4285F4',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
                title="Your Location"
              />
            )}

            {/* Lot markers */}
            {lotsWithCoordinates.map((lot) => {
              const isAssigned = assignedLot?.id === lot.id;
              const markerColor = getMarkerColor(lot.status);

              return (
                <Marker
                  key={lot.id}
                  position={{ lat: parseFloat(lot.latitude), lng: parseFloat(lot.longitude) }}
                  onClick={() => setSelectedLot(lot)}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: isAssigned ? 12 : 10,
                    fillColor: markerColor,
                    fillOpacity: 1,
                    strokeColor: isAssigned ? '#3B82F6' : '#ffffff',
                    strokeWeight: isAssigned ? 3 : 2,
                  }}
                  title={lot.name}
                  animation={isAssigned ? google.maps.Animation.BOUNCE : null}
                />
              );
            })}

            {/* Info Window */}
            {selectedLot && (
              <InfoWindow
                position={{ lat: parseFloat(selectedLot.latitude), lng: parseFloat(selectedLot.longitude) }}
                onCloseClick={() => setSelectedLot(null)}
              >
                <div className="p-2" style={{ minWidth: '200px' }}>
                  <h3 className="font-bold text-gray-900 mb-2">{selectedLot.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      <StatusBadge status={selectedLot.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span className="capitalize">{selectedLot.section}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      <span>
                        {students.filter(s => (selectedLot.assignedStudents || []).includes(s.id) && s.checkedIn).length} / 
                        {students.filter(s => (selectedLot.assignedStudents || []).includes(s.id)).length} present
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => getDirections(selectedLot)}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                  >
                    <Navigation size={14} />
                    Get Directions
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* Lot List (keep existing implementation) */}
      {/* ... */}
    </div>
  );
};
```

---

## Part 4: Testing

### Test Checklist

1. **Map Loads:**
   - [ ] Map displays without errors
   - [ ] Correct center point
   - [ ] Appropriate zoom level

2. **Markers:**
   - [ ] All lots with coordinates show markers
   - [ ] Marker colors match lot status
   - [ ] Student's assigned lot bounces/pulses
   - [ ] User location marker appears (if permission granted)

3. **Interactions:**
   - [ ] Clicking marker opens info window
   - [ ] Info window shows correct lot details
   - [ ] Get Directions button works
   - [ ] Map controls (zoom, pan) work

4. **Error Handling:**
   - [ ] Graceful handling if API key invalid
   - [ ] Message if no coordinates available
   - [ ] Fallback if geolocation denied

5. **Performance:**
   - [ ] Map loads in < 3 seconds
   - [ ] No lag when panning/zooming
   - [ ] Smooth marker animations

---

## Part 5: Optimization & Best Practices

### Performance Optimization

1. **Lazy Load Google Maps:**
   ```javascript
   // Only load when Map View is selected
   {viewMode === 'map' && <LoadScript ...>}
   ```

2. **Marker Clustering:**
   ```bash
   npm install @googlemaps/markerclusterer
   ```

3. **Memoize Expensive Calculations:**
   ```javascript
   const mapCenter = useMemo(() => { /* ... */ }, [lots]);
   ```

### Dark Mode Support

Add custom map styles for dark mode:

```javascript
const darkModeStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  // ... more styles
];

<GoogleMap
  options={{
    styles: isDarkMode ? darkModeStyles : [],
  }}
/>
```

### Security Best Practices

1. **Never commit API key to git**
2. **Use environment variables**
3. **Restrict API key to your domains**
4. **Monitor API usage in Cloud Console**
5. **Set up billing alerts**

---

## Troubleshooting

### Common Issues

**Issue:** Map doesn't load
- Check API key is correct
- Verify APIs are enabled in Cloud Console
- Check browser console for errors
- Ensure billing is enabled

**Issue:** Markers don't appear
- Verify lots have valid latitude/longitude
- Check coordinates are numbers, not strings
- Ensure coordinates are in correct format (lat, lng)

**Issue:** "This page can't load Google Maps correctly"
- API key restrictions too strict
- Billing not enabled
- API not enabled in Cloud Console

**Issue:** Geolocation not working
- User denied permission
- HTTPS required for geolocation
- Browser doesn't support geolocation

---

## Cost Management

### Monitor Usage

1. Go to Cloud Console → "APIs & Services" → "Dashboard"
2. View API usage charts
3. Set up billing alerts

### Set Quotas

1. Go to "APIs & Services" → "Quotas"
2. Set daily limits for each API
3. Recommended limits for TBTC:
   - Maps JavaScript API: 1,000 loads/day
   - Directions API: 500 requests/day

---

## Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [React Google Maps API Library](https://react-google-maps-api-docs.netlify.app/)
- [Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)

---

## Conclusion

Once Google Maps is integrated, the Map View will provide:
- Visual representation of all parking lots
- Easy navigation with directions
- Real-time status updates via color-coded markers
- Enhanced student experience for finding assigned lots

**Estimated Implementation Time:** 2-4 hours  
**Monthly Cost:** $0 (within free tier for typical TBTC usage)

