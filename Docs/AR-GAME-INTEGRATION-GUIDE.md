# AR Game Integration Guide

## Overview

This guide documents the integration of an AR (Augmented Reality) cleanup game into the TBTC (The Band That Cleans) parking lot cleanup application. The AR game provides a fun, gamified experience that complements the main application's cleanup tracking functionality.

## What Was Implemented

### 1. Custom WebXR AR Game (`public/ar-cleanup-game.html`)

A standalone HTML5 AR game built with A-Frame that works on AR-capable mobile devices:

**Features:**
- ✅ WebXR AR support for mobile devices
- ✅ Hit testing for placing objects in real-world space
- ✅ Interactive trash bin placement
- ✅ Swipe-to-throw mechanics
- ✅ Score tracking
- ✅ Visual feedback and animations
- ✅ Responsive UI overlay

**Technology Stack:**
- A-Frame 1.4.2 (WebXR framework)
- A-Frame Extras (additional components)
- Vanilla JavaScript for game logic
- CSS3 for UI styling

### 2. AR Game Launcher Component (`src/components/ARGameLauncher.jsx`)

A React component that provides an entry point to the AR game from within the main TBTC application:

**Features:**
- ✅ WebXR support detection
- ✅ Responsive card design with gradient background
- ✅ Feature highlights
- ✅ How-to-play instructions
- ✅ Device compatibility warnings
- ✅ One-click game launch

### 3. Main App Integration (`app.jsx`)

The AR game has been integrated as a new tab in the main navigation:

**Changes Made:**
- Added `Gamepad2` icon import from lucide-react
- Imported `ARGameLauncher` component
- Added "AR Game" tab to navigation (available to all users)
- Added AR game component to tab routing

## File Structure

```
TBTC-MVP/
├── public/
│   └── ar-cleanup-game.html          # Standalone AR game
├── src/
│   └── components/
│       └── ARGameLauncher.jsx        # AR game launcher component
├── app.jsx                           # Main app (updated with AR tab)
└── Docs/
    └── AR-GAME-INTEGRATION-GUIDE.md  # This file
```

## How to Use

### For End Users

1. **Access the AR Game:**
   - Open the TBTC application
   - Click on the "AR Game" tab in the navigation
   - Click "Launch AR Game" button

2. **Play the Game:**
   - Grant camera permissions when prompted
   - Point your camera at a flat surface (floor, table, etc.)
   - Tap the screen to place the trash bin
   - Swipe on the screen to throw trash balls
   - Try to get the trash into the bin to score points!

### Device Requirements

**Supported Devices:**
- Android 8.0+ with ARCore support
- iOS devices with ARKit support (iPhone 6S and newer)

**Supported Browsers:**
- Chrome (Android)
- Edge (Android)
- Safari (iOS - limited support)

**Required Permissions:**
- Camera access
- Motion sensors (automatically granted)

## Technical Details

### WebXR AR Implementation

The game uses the WebXR Device API for AR functionality:

```javascript
// Check AR support
const supported = await navigator.xr.isSessionSupported('immersive-ar');

// Request AR session
scene.enterAR();

// Hit testing for object placement
xrSession.requestHitTestSource({ space: refSpace })
```

### Game Mechanics

1. **Placement Phase:**
   - Uses WebXR hit testing to detect flat surfaces
   - Shows a reticle (green ring) at the detected position
   - User taps to place the trash bin

2. **Throwing Phase:**
   - Detects swipe gestures (touchstart → touchend)
   - Calculates throw direction and velocity
   - Spawns trash ball with physics-like animation
   - Checks collision with bin for scoring

3. **Scoring System:**
   - Distance-based collision detection
   - Visual feedback on successful throws
   - Persistent score display

### Styling and Theming

The AR Game Launcher uses a purple gradient theme to stand out:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

This creates visual distinction from the main app's blue theme while maintaining professional appearance.

## Development Notes

### Why A-Frame Instead of Wonderland Engine?

The original Wastepaperbin AR game from the GitHub repository uses Wonderland Engine, which:
- Requires a proprietary editor and license
- Has a complex build process
- Is not easily integrated into existing web apps

We chose A-Frame because:
- ✅ Open source and free
- ✅ Works with standard web development tools
- ✅ Easy to customize and integrate
- ✅ Good WebXR support
- ✅ Active community and documentation

### Future Enhancements

Potential improvements for future versions:

1. **Theming:**
   - Replace generic trash bin with TBTC-branded assets
   - Add parking lot themed environment
   - Include band-related visual elements

2. **Gameplay:**
   - Multiple difficulty levels
   - Time-based challenges
   - Multiplayer leaderboards
   - Achievement system

3. **Integration:**
   - Link game scores to student profiles
   - Award points for high scores
   - Create team competitions

4. **Assets:**
   - Custom 3D models for trash bin
   - Parking lot ground texture
   - TBTC logo in AR space
   - Sound effects and music

## Troubleshooting

### AR Not Supported Error

**Problem:** "AR Not Supported" message appears

**Solutions:**
1. Ensure you're using a supported device (Android 8.0+ or iOS with ARKit)
2. Use Chrome or Edge browser on Android
3. Check that ARCore is installed and updated (Android)
4. Verify camera permissions are granted

### Camera Permission Denied

**Problem:** Game doesn't start, camera permission error

**Solutions:**
1. Go to browser settings → Site settings → Camera
2. Allow camera access for the site
3. Reload the page

### Game Doesn't Load

**Problem:** Blank screen or loading forever

**Solutions:**
1. Check internet connection (A-Frame loads from CDN)
2. Clear browser cache
3. Try a different browser
4. Check browser console for errors

### Poor Tracking

**Problem:** Objects drift or placement is inaccurate

**Solutions:**
1. Ensure good lighting conditions
2. Point camera at textured surfaces (not plain white)
3. Move device slowly to help tracking
4. Avoid reflective or transparent surfaces

## Testing Checklist

- [ ] AR support detection works correctly
- [ ] Game launches in new tab/window
- [ ] Camera permissions are requested
- [ ] Reticle appears on flat surfaces
- [ ] Bin placement works with tap
- [ ] Swipe gesture throws trash
- [ ] Collision detection works
- [ ] Score increments correctly
- [ ] Back button returns to main app
- [ ] Responsive design works on mobile
- [ ] Instructions are clear and helpful

## Deployment

The AR game is deployed as part of the main TBTC application:

1. **Development:**
   ```bash
   npm run dev
   ```
   Access at: http://localhost:3000

2. **Production Build:**
   ```bash
   npm run build
   ```
   The `public/ar-cleanup-game.html` file is automatically included in the build output.

3. **GitHub Pages:**
   The game will be accessible at:
   `https://[your-username].github.io/TheBandThatCleans/ar-cleanup-game.html`

## Credits

- **Original Concept:** Wastepaperbin AR by Wonderland Engine
- **Implementation:** Custom A-Frame version for TBTC
- **Framework:** A-Frame (https://aframe.io)
- **Icons:** Lucide React (https://lucide.dev)

## License

This AR game integration is part of the TBTC project and follows the same MIT license.

---

**Last Updated:** 2025-10-18
**Version:** 1.0.0

