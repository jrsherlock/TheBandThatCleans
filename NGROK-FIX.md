# ngrok Host Blocking Fix

## Problem
When accessing your app through ngrok, you see:
```
Blocked request. This host ("96768b1c76b7.ngrok-free.app") is not allowed.
```

## Solution ✅

I've updated `vite.config.js` to allow ngrok and other tunneling services.

## What to Do Now

**1. Stop your dev server** (if running)
   - Go to the terminal running `npm run dev`
   - Press `Ctrl+C`

**2. Restart the dev server**
   ```bash
   npm run dev
   ```

**3. Refresh the page on your iPhone**
   - The app should now load! 🎉

## What Changed

The `vite.config.js` now includes:
```javascript
allowedHosts: [
  '.ngrok.io',           // ngrok classic domains
  '.ngrok-free.app',     // ngrok free tier domains
  '.loca.lt',            // localtunnel
  '.cloudflare.com',     // cloudflare tunnel
  'localhost'            // local development
]
```

This allows Vite to accept requests from these tunneling services.

## Testing Steps

1. **Terminal 1:** Start dev server
   ```bash
   npm run dev
   ```

2. **Terminal 2:** Start ngrok (keep the same one running)
   ```bash
   ngrok http 3000
   ```

3. **iPhone:** Refresh the ngrok URL in Safari
   - The app should now load properly
   - Navigate to "AR Game" tab
   - Click "Launch AR Game"
   - Enjoy! 🎮

## If You Still See Issues

### Clear Browser Cache
On iPhone Safari:
- Settings → Safari → Clear History and Website Data
- Or use Private Browsing mode

### Check ngrok URL
Make sure you're using the **https://** URL from ngrok, not http://

### Verify Dev Server Restarted
Look for this in the terminal:
```
VITE v4.5.14  ready in 148 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

## Future ngrok Sessions

You don't need to change anything again! The fix is permanent.

Every time you use ngrok:
1. Start dev server: `npm run dev`
2. Start ngrok: `ngrok http 3000`
3. Use the new ngrok URL on your iPhone

The allowed hosts configuration will work for all ngrok URLs.

---

**Status:** ✅ Fixed!
**Next Step:** Restart dev server and refresh your iPhone

