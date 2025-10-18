# 📱 Quick Start: Test AR Game on iPhone

## The Fastest Way (5 Minutes)

### Step 1: Install ngrok
```bash
brew install ngrok
```

### Step 2: Start Dev Server
```bash
cd /Users/sherlock/TBTC-MVP
npm run dev
```
✅ Leave this terminal running!

### Step 3: Start ngrok (in a NEW terminal)
```bash
ngrok http 3000
```

You'll see something like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

### Step 4: Open on iPhone
1. Open Safari on your iPhone
2. Type the URL: `https://abc123.ngrok.io`
3. The TBTC app loads!
4. Click "AR Game" tab
5. Click "Launch AR Game"
6. Allow camera access
7. Point at floor and tap to place bin
8. Swipe to throw trash! 🎯

---

## Visual Guide

```
┌─────────────────────────────────────────┐
│  Your Mac                               │
│  ┌───────────────────────────────────┐  │
│  │ Terminal 1: npm run dev           │  │
│  │ Running on http://localhost:3000  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Terminal 2: ngrok http 3000       │  │
│  │ Forwarding:                       │  │
│  │ https://abc123.ngrok.io           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    │ Secure HTTPS Tunnel
                    ▼
┌─────────────────────────────────────────┐
│  Your iPhone                            │
│  ┌───────────────────────────────────┐  │
│  │ Safari                            │  │
│  │ https://abc123.ngrok.io           │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │ TBTC App                    │  │  │
│  │  │ [Dashboard] [Lots]          │  │  │
│  │  │ [Students] [AR Game] ◄──────┼──┼──┼─ Click here!
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## What You'll See

### 1. On Your Mac (Terminal 1)
```
  VITE v4.5.14  ready in 148 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 2. On Your Mac (Terminal 2)
```
ngrok

Session Status                online
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### 3. On Your iPhone
```
┌──────────────────────────────────┐
│ 🧹 AR Cleanup Game               │
│                                  │
│ Experience parking lot cleanup   │
│ in augmented reality!            │
│                                  │
│ 📱 Mobile AR                     │
│ 🎯 Interactive                   │
│ 🏆 Score Tracking                │
│                                  │
│ [Launch AR Game]                 │
└──────────────────────────────────┘
```

---

## Troubleshooting

### "ngrok: command not found"
```bash
# Install ngrok first
brew install ngrok
```

### "npm: command not found"
```bash
# Install Node.js first
brew install node
```

### Can't connect on iPhone
- Make sure you're using the **https://** URL (not http://)
- Copy the URL exactly from ngrok terminal
- Try refreshing the page

### AR doesn't work
- Make sure you're using **Safari** (not Chrome)
- Ensure you allowed camera permissions
- Try in good lighting
- Point at a textured surface (not plain white)

---

## Alternative: Use Helper Script

I created a helper script for you:

```bash
./test-on-mobile.sh
```

Just run this and follow the prompts!

---

## Stop Testing

When you're done:

1. **Stop ngrok:** Press `Ctrl+C` in Terminal 2
2. **Stop dev server:** Press `Ctrl+C` in Terminal 1

---

## Next Time

The ngrok URL changes each time you restart it. So next time:

1. Start dev server: `npm run dev`
2. Start ngrok: `ngrok http 3000`
3. Use the NEW ngrok URL on your iPhone

**Tip:** Keep both terminals running while testing to keep the same URL!

---

## Need More Help?

See the full guide: `Docs/MOBILE-TESTING-GUIDE.md`

---

**That's it! You're ready to test! 🚀**

