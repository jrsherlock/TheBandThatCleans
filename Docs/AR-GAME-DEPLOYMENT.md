# AR Game Deployment Guide

## Quick Start

The AR game has been successfully integrated into your TBTC application! Here's how to deploy it:

## Local Testing

### 1. Start Development Server

```bash
cd /Users/sherlock/TBTC-MVP
npm run dev
```

The app will be available at: http://localhost:3000

### 2. Test the AR Game

1. Open http://localhost:3000 in your browser
2. Click on the "AR Game" tab in the navigation
3. Click "Launch AR Game" to open the game in a new tab

**Note:** For full AR functionality, you'll need to test on an AR-capable mobile device. Desktop browsers will show the game but AR features require mobile.

## Testing on Mobile Device

### Option 1: Port Forwarding (Recommended for Development)

1. **Connect your Android device via USB**
   - Enable Developer Mode on your Android device
   - Enable USB Debugging

2. **Set up Chrome DevTools port forwarding:**
   - Open `chrome://inspect#devices` on your desktop Chrome
   - Click "Port forwarding..."
   - Forward port `3000` to `localhost:3000`
   - Check "Enable port forwarding"

3. **Access on mobile:**
   - Open Chrome on your Android device
   - Navigate to `localhost:3000`
   - Click "AR Game" tab
   - Click "Launch AR Game"

### Option 2: Network Access

1. **Find your computer's local IP:**
   ```bash
   # On Mac/Linux
   ifconfig | grep "inet "
   
   # On Windows
   ipconfig
   ```

2. **Start dev server with network access:**
   ```bash
   npm run dev -- --host
   ```

3. **Access from mobile:**
   - Connect mobile device to same WiFi network
   - Open `http://[YOUR-IP]:3000` in mobile browser
   - Navigate to AR Game tab

## Production Deployment

### Build for Production

```bash
npm run build
```

This creates optimized files in the `dist/` directory, including:
- `dist/index.html` - Main app
- `dist/ar-cleanup-game.html` - AR game
- `dist/assets/` - JavaScript, CSS, and other assets

### Deploy to GitHub Pages

1. **Ensure your repository is set up:**
   ```bash
   git add .
   git commit -m "Add AR game integration"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click "Settings" → "Pages"
   - Source: Deploy from branch
   - Branch: `main` → `/dist` folder
   - Click "Save"

3. **Access your deployed app:**
   - URL: `https://jrsherlock.github.io/TheBandThatCleans/`
   - AR Game: `https://jrsherlock.github.io/TheBandThatCleans/ar-cleanup-game.html`

### Deploy to Other Platforms

#### Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

#### Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   npm run build
   vercel --prod
   ```

## HTTPS Requirement

**Important:** WebXR AR requires HTTPS in production!

- ✅ GitHub Pages provides HTTPS automatically
- ✅ Netlify provides HTTPS automatically
- ✅ Vercel provides HTTPS automatically
- ❌ HTTP will NOT work for AR features (except localhost)

## Testing Checklist

Before deploying to production, verify:

### Desktop Testing
- [ ] App loads without errors
- [ ] AR Game tab appears in navigation
- [ ] AR Game Launcher component displays correctly
- [ ] "Launch AR Game" button works
- [ ] AR game opens in new tab
- [ ] Appropriate "AR not supported" message shows on desktop

### Mobile Testing (Android)
- [ ] App loads on mobile browser
- [ ] AR Game tab is accessible
- [ ] WebXR support is detected
- [ ] Camera permissions are requested
- [ ] AR session starts successfully
- [ ] Reticle appears on flat surfaces
- [ ] Bin placement works
- [ ] Swipe gesture throws trash
- [ ] Score tracking works
- [ ] Back button returns to main app

### Mobile Testing (iOS)
- [ ] App loads in Safari
- [ ] AR features work (limited support)
- [ ] Fallback messaging appears if needed

## Troubleshooting Deployment

### Build Errors

**Problem:** `npm run build` fails

**Solutions:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### AR Game Not Loading

**Problem:** AR game shows 404 error

**Solutions:**
1. Verify `public/ar-cleanup-game.html` exists
2. Check build output includes the file
3. Ensure deployment includes all files from `dist/`

### HTTPS Errors

**Problem:** "WebXR requires HTTPS" error

**Solutions:**
1. Ensure you're accessing via HTTPS URL
2. Use a platform that provides HTTPS (GitHub Pages, Netlify, Vercel)
3. For custom domains, configure SSL certificate

### Camera Permission Issues

**Problem:** Camera permission denied or not requested

**Solutions:**
1. Check browser settings allow camera access
2. Ensure HTTPS is being used
3. Try clearing browser data and reloading
4. Check if camera is being used by another app

## Performance Optimization

### For Better AR Performance:

1. **Good Lighting:**
   - Test in well-lit environments
   - Avoid direct sunlight or very dark areas

2. **Textured Surfaces:**
   - AR tracking works best on textured surfaces
   - Avoid plain white walls or floors

3. **Device Performance:**
   - Close other apps to free up memory
   - Ensure device isn't overheating
   - Use newer devices for better performance

## Monitoring and Analytics

Consider adding analytics to track:
- AR game launches
- Session duration
- Score achievements
- Device/browser compatibility
- Error rates

Example with Google Analytics:
```javascript
// In ar-cleanup-game.html
gtag('event', 'ar_game_launch', {
  'event_category': 'engagement',
  'event_label': 'AR Game Started'
});
```

## Next Steps

After successful deployment:

1. **Share with team:**
   - Send deployment URL to directors and volunteers
   - Provide testing instructions
   - Gather feedback

2. **Monitor usage:**
   - Check for errors in browser console
   - Monitor server logs
   - Track user engagement

3. **Iterate:**
   - Collect user feedback
   - Plan enhancements (see AR-GAME-INTEGRATION-GUIDE.md)
   - Update documentation

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Test on different devices/browsers
4. Consult AR-GAME-INTEGRATION-GUIDE.md for technical details

## Quick Reference

### URLs (Update with your actual deployment)
- **Main App:** https://jrsherlock.github.io/TheBandThatCleans/
- **AR Game Direct:** https://jrsherlock.github.io/TheBandThatCleans/ar-cleanup-game.html

### Commands
```bash
# Development
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

### Files Modified
- `app.jsx` - Added AR game tab and navigation
- `src/components/ARGameLauncher.jsx` - New component
- `public/ar-cleanup-game.html` - AR game implementation

---

**Last Updated:** 2025-10-18
**Deployment Status:** Ready for production

