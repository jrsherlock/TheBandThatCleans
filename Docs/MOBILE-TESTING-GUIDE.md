# Mobile Testing Guide for iPhone

## Quick Start (Recommended Method)

### Using ngrok - Easiest Option ⭐

**1. Install ngrok:**
```bash
brew install ngrok
```

**2. Start your dev server:**
```bash
npm run dev
```

**3. In a NEW terminal, start ngrok:**
```bash
ngrok http 3000
```

**4. You'll see output like this:**
```
Session Status                online
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
```

**5. Open the HTTPS URL on your iPhone:**
- Open Safari on your iPhone
- Type in the `https://abc123.ngrok.io` URL
- The TBTC app will load
- Click "AR Game" tab
- Click "Launch AR Game"
- Grant camera permissions
- Start playing! 🎮

---

## Alternative Methods

### Method 2: Using the Helper Script

I've created a helper script to make this easier:

```bash
./test-on-mobile.sh
```

This will:
- Check if ngrok is installed
- Show your local IP address
- Give you options for testing
- Start ngrok tunnel if you choose

---

### Method 3: Local Network (HTTP - Limited AR)

**⚠️ Warning:** This provides HTTP, not HTTPS. WebXR AR may not work fully without HTTPS.

**1. Find your Mac's IP address:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Look for something like `192.168.1.x` or `10.0.0.x`

**2. Start dev server with host flag:**
```bash
npm run dev -- --host
```

**3. On your iPhone:**
- Connect to the same WiFi network as your Mac
- Open Safari
- Go to `http://192.168.1.x:3000` (use your actual IP)

**Limitations:**
- AR features may not work (WebXR requires HTTPS)
- Good for testing UI/layout only

---

### Method 4: Local HTTPS (Most Professional)

This sets up a real HTTPS certificate for local development.

**1. Install mkcert:**
```bash
brew install mkcert
mkcert -install
```

**2. Create certificates:**
```bash
cd /Users/sherlock/TBTC-MVP
mkcert localhost 192.168.1.* 10.0.0.* 172.16.0.*
```

This creates:
- `localhost+3.pem` (certificate)
- `localhost+3-key.pem` (private key)

**3. The vite.config.js is already updated** to use these certificates automatically!

**4. Find your Mac's IP:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**5. Restart dev server:**
```bash
npm run dev
```

You should see it's now running on HTTPS!

**6. On your iPhone:**
- Connect to same WiFi
- Open Safari
- Go to `https://192.168.1.x:3000` (use your actual IP)
- You'll see a certificate warning
- Tap "Show Details" → "visit this website"
- Tap "Visit Website" again
- The app will load with HTTPS! ✅

**7. Trust the certificate (one-time setup):**
- On iPhone: Settings → General → About → Certificate Trust Settings
- Enable full trust for the mkcert certificate

---

## Troubleshooting

### "Cannot connect to server"

**Problem:** iPhone can't reach your Mac

**Solutions:**
1. Ensure both devices are on the same WiFi network
2. Check your Mac's firewall settings:
   - System Preferences → Security & Privacy → Firewall
   - Click "Firewall Options"
   - Ensure "Block all incoming connections" is OFF
3. Try ngrok instead (works from any network)

### "This site can't provide a secure connection"

**Problem:** HTTPS certificate issues

**Solutions:**
1. Use ngrok (automatically provides valid HTTPS)
2. Or follow the mkcert setup above
3. Or accept the certificate warning on iPhone

### "Camera access denied"

**Problem:** Safari won't request camera permissions

**Solutions:**
1. Ensure you're using HTTPS (not HTTP)
2. Go to Settings → Safari → Camera → Ask
3. Clear Safari data and try again
4. Try in a private browsing tab

### "AR not supported"

**Problem:** WebXR not available

**Solutions:**
1. Ensure you're using HTTPS (required for WebXR)
2. Use Safari on iOS (not Chrome)
3. Ensure iOS 14.5 or later
4. Check that your iPhone supports ARKit (iPhone 6S or newer)

### ngrok URL changes every time

**Problem:** The ngrok URL is different each time you restart

**Solutions:**
1. Keep ngrok running while testing
2. Or sign up for a free ngrok account to get a static domain
3. Or use the local HTTPS method instead

---

## Testing Checklist

### Before Testing
- [ ] Dev server is running (`npm run dev`)
- [ ] ngrok tunnel is active (or HTTPS is set up)
- [ ] iPhone is connected to WiFi (for local network methods)
- [ ] Safari is updated to latest version

### During Testing
- [ ] App loads without errors
- [ ] Navigation works
- [ ] AR Game tab is visible
- [ ] AR Game Launcher displays correctly
- [ ] "Launch AR Game" button works
- [ ] AR game opens in new tab
- [ ] Camera permission is requested
- [ ] AR session starts
- [ ] Reticle appears on flat surfaces
- [ ] Bin placement works (tap)
- [ ] Trash throwing works (swipe)
- [ ] Score increments correctly
- [ ] Back button returns to main app

### Performance Testing
- [ ] App loads quickly
- [ ] AR tracking is smooth
- [ ] No lag when throwing trash
- [ ] Score updates immediately
- [ ] No crashes or freezes

---

## Tips for Best AR Experience

### Lighting
- ✅ Test in well-lit room
- ✅ Natural daylight is best
- ❌ Avoid direct sunlight
- ❌ Avoid very dark rooms

### Surfaces
- ✅ Textured surfaces (carpet, wood floor)
- ✅ Horizontal surfaces (floor, table)
- ❌ Plain white surfaces
- ❌ Reflective surfaces (mirrors, glass)
- ❌ Moving surfaces

### Device
- ✅ Close other apps
- ✅ Ensure good battery level
- ✅ Keep device cool
- ❌ Don't use while charging (can overheat)

---

## Comparison of Methods

| Method | HTTPS | Easy Setup | Stable URL | Works Anywhere |
|--------|-------|------------|------------|----------------|
| **ngrok** | ✅ | ✅ | ⚠️ Changes | ✅ |
| **Local Network** | ❌ | ✅ | ✅ | ❌ |
| **mkcert** | ✅ | ⚠️ Medium | ✅ | ❌ |
| **Cloudflare** | ✅ | ✅ | ⚠️ Changes | ✅ |

**Recommendation:** Start with **ngrok** for easiest setup!

---

## Quick Reference Commands

```bash
# Start dev server
npm run dev

# Start ngrok tunnel
ngrok http 3000

# Find your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Use helper script
./test-on-mobile.sh

# Create HTTPS certificates (one-time)
brew install mkcert
mkcert -install
mkcert localhost 192.168.1.* 10.0.0.* 172.16.0.*
```

---

## Next Steps

After successful mobile testing:

1. **Gather Feedback:**
   - Test with different users
   - Note any issues or suggestions
   - Document device-specific problems

2. **Optimize:**
   - Adjust AR settings based on testing
   - Improve performance if needed
   - Refine UI for mobile

3. **Deploy:**
   - Once testing is complete
   - Deploy to production (GitHub Pages, etc.)
   - Share with your team!

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console for errors (Safari → Develop → iPhone → Console)
3. Test on different devices/iOS versions
4. Consult AR-GAME-INTEGRATION-GUIDE.md for technical details

---

**Last Updated:** 2025-10-18
**Tested On:** iPhone 12 Pro, iOS 17.x

