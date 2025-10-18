# 🔒 Securing Gemini API Key - Complete Guide

## ⚠️ CRITICAL SECURITY WARNING

**Your current setup has a fundamental security flaw:**

Using `VITE_` prefix in environment variables **exposes the API key in the client-side JavaScript bundle**. This means:
- ❌ Anyone can view your API key by inspecting browser DevTools
- ❌ The key is visible in the compiled JavaScript files
- ❌ The key can be extracted from the Vercel deployment
- ❌ This violates Google's API key security best practices

## 🚨 Immediate Actions Taken

1. ✅ Removed exposed API key from `.env.example`
2. ✅ Verified `.env` is properly gitignored
3. ✅ Confirmed no API keys in Git history (except `.env.example`)

## 🔐 The Fundamental Problem

### **Why VITE_ Prefix is Insecure:**

Vite bundles any environment variable prefixed with `VITE_` into the client-side JavaScript:

```javascript
// This gets compiled into your JavaScript bundle:
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Becomes: const API_KEY = "AIzaSy...actual_key_here";
```

**Anyone can see this by:**
1. Opening browser DevTools → Sources tab
2. Searching for "AIza" in JavaScript files
3. Finding your API key in plain text

### **Google AI Studio API Keys are Client-Side Only**

Unfortunately, Google AI Studio API keys are **designed for client-side use** and cannot be used server-side like Google Cloud API keys. This creates a security dilemma:

- ✅ **Google Cloud Platform (GCP) API keys**: Can be restricted by IP, referrer, etc.
- ❌ **Google AI Studio API keys**: Limited security options, meant for prototyping

## 🛡️ Security Solutions (Ranked by Security Level)

### **Option 1: Use Google Cloud Platform (RECOMMENDED) ⭐**

**Security Level:** 🔒🔒🔒🔒🔒 (Highest)

**How it works:**
- Migrate from Google AI Studio to Google Cloud Platform
- Use Vertex AI API (same Gemini models)
- API calls go through your backend (Google Apps Script or serverless function)
- API key never exposed to client

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Vertex AI API
4. Create a service account with Vertex AI permissions
5. Download service account JSON key
6. Store key in Vercel environment variables (server-side only)
7. Create a serverless function to proxy Gemini requests

**Pros:**
- ✅ API key never exposed to client
- ✅ Can restrict by IP address
- ✅ Better rate limiting and quotas
- ✅ Production-ready security

**Cons:**
- ❌ Requires Google Cloud billing account
- ❌ More complex setup
- ❌ May incur costs (has free tier)

---

### **Option 2: API Key Restrictions (CURRENT APPROACH) ⚠️**

**Security Level:** 🔒🔒 (Medium - Better than nothing)

**How it works:**
- Keep using Google AI Studio API key
- Apply restrictions in Google AI Studio console
- Accept that key is visible in client-side code
- Rely on restrictions to prevent abuse

**Steps:**

#### **A. Restrict API Key in Google AI Studio**

1. Go to [Google AI Studio API Keys](https://aistudio.google.com/app/apikey)
2. Click on your API key (the one ending in ...XcNc)
3. Click "Edit API key restrictions"
4. Apply these restrictions:

**Application Restrictions:**
- Select "HTTP referrers (websites)"
- Add these referrers:
  ```
  https://your-vercel-app.vercel.app/*
  https://*.vercel.app/*  (for preview deployments)
  http://localhost:3000/*  (for local development)
  ```

**API Restrictions:**
- Select "Restrict key"
- Only enable: "Generative Language API"

#### **B. Set Up Environment Variables in Vercel**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: "TheBandThatCleans"
3. Go to Settings → Environment Variables
4. Add new variable:
   - **Key:** `VITE_GEMINI_API_KEY`
   - **Value:** `AIza...your_new_key_here` (from screenshot)
   - **Environments:** Production, Preview, Development
5. Click "Save"

#### **C. Redeploy Application**

```bash
# Trigger redeployment
git commit --allow-empty -m "chore: Trigger redeploy with new API key"
git push origin main
```

Or in Vercel Dashboard:
- Go to Deployments tab
- Click "..." on latest deployment
- Click "Redeploy"

**Pros:**
- ✅ Quick to implement
- ✅ No code changes needed
- ✅ Free (Google AI Studio)
- ✅ Prevents unauthorized domains from using your key

**Cons:**
- ❌ API key still visible in client-side code
- ❌ Anyone can extract and use it (but only from allowed domains)
- ❌ Limited to 60 requests per minute
- ❌ Not suitable for production at scale

---

### **Option 3: Proxy Through Google Apps Script (HYBRID)**

**Security Level:** 🔒🔒🔒🔒 (High)

**How it works:**
- Move Gemini API calls to Google Apps Script backend
- Frontend calls your Apps Script endpoint
- Apps Script calls Gemini API with key stored in Script Properties
- API key never exposed to client

**Steps:**

1. **Store API Key in Apps Script:**
   ```javascript
   // In Code.gs, add at the top:
   const GEMINI_API_KEY = PropertiesService.getScriptProperties()
     .getProperty('GEMINI_API_KEY');
   ```

2. **Set Script Property:**
   - In Apps Script Editor: Project Settings → Script Properties
   - Add property: `GEMINI_API_KEY` = `your_new_key`

3. **Create Gemini Proxy Endpoint:**
   ```javascript
   function handleGeminiAnalysis(payload) {
     const { imageData, lotName, lotId } = payload;
     
     // Call Gemini API from server-side
     const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
     
     const response = UrlFetchApp.fetch(url, {
       method: 'POST',
       contentType: 'application/json',
       payload: JSON.stringify({
         contents: [{
           parts: [
             { text: "Analyze this sign-in sheet..." },
             { inline_data: { mime_type: "image/jpeg", data: imageData } }
           ]
         }]
       })
     });
     
     return JSON.parse(response.getContentText());
   }
   ```

4. **Update Frontend:**
   ```javascript
   // In geminiService.js, replace direct Gemini calls with:
   const response = await apiService.analyzeSignInSheet({
     imageData: base64Image,
     lotName,
     lotId
   });
   ```

**Pros:**
- ✅ API key completely hidden from client
- ✅ Uses existing Apps Script infrastructure
- ✅ Free (Google AI Studio)
- ✅ Can add additional server-side validation

**Cons:**
- ❌ Requires code refactoring
- ❌ Apps Script has 6-minute execution limit
- ❌ More complex error handling

---

## 📋 Step-by-Step: Securing Your Current Setup

### **Phase 1: Immediate Security (Do This Now)**

1. **Verify New API Key is Active:**
   - From your screenshot: `...XcNc` (created Oct 12, 2025)
   - This is your new, uncompromised key ✅

2. **Remove Exposed Key from Git:**
   ```bash
   cd /Users/sherlock/TBTC-MVP
   git add .env.example
   git commit -m "security: Remove exposed API key from .env.example"
   git push origin main
   ```

3. **Update Local .env File:**
   ```bash
   # Edit .env file with your new key
   echo "VITE_GEMINI_API_KEY=AIza...your_new_key_from_screenshot" > .env
   ```

4. **Add API Key to Vercel:**
   - Go to: https://vercel.com/jrsherlock/the-band-that-cleans/settings/environment-variables
   - Add: `VITE_GEMINI_API_KEY` = `your_new_key`
   - Select all environments (Production, Preview, Development)
   - Save

5. **Restrict API Key in Google AI Studio:**
   - Go to: https://aistudio.google.com/app/apikey
   - Click on your key (...XcNc)
   - Add HTTP referrer restrictions:
     ```
     https://*.vercel.app/*
     http://localhost:3000/*
     ```
   - Restrict to "Generative Language API" only

6. **Redeploy:**
   ```bash
   git commit --allow-empty -m "chore: Trigger redeploy with secured API key"
   git push origin main
   ```

### **Phase 2: Verify Security**

1. **Test Locally:**
   ```bash
   npm run dev
   # Upload a sign-in sheet
   # Verify Gemini analysis works
   ```

2. **Test in Production:**
   - Go to your Vercel deployment
   - Upload a sign-in sheet
   - Verify it works

3. **Verify Key is Restricted:**
   - Open browser DevTools → Console
   - Try to use the API key from a different domain
   - Should get "API key not valid" error ✅

4. **Check for Key Exposure:**
   - Open DevTools → Sources
   - Search for "AIza" in JavaScript files
   - You WILL find it (this is expected with VITE_ prefix)
   - Verify it only works from your domain (due to restrictions)

### **Phase 3: Long-Term Security (Recommended)**

Choose one of these approaches:

**Option A: Migrate to Google Cloud (Best for Production)**
- Follow "Option 1" steps above
- Estimated time: 2-3 hours
- Cost: Free tier available, then pay-as-you-go

**Option B: Proxy Through Apps Script (Good Balance)**
- Follow "Option 3" steps above
- Estimated time: 1-2 hours
- Cost: Free

**Option C: Accept Client-Side Exposure (Quick Fix)**
- Keep current setup
- Rely on API key restrictions
- Monitor usage in Google AI Studio
- Set up billing alerts

---

## 🧪 Testing Your Security

### **Test 1: Verify API Key Works**
```bash
# Should work from your domain
curl -X POST "https://your-app.vercel.app/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{"image": "base64..."}'
```

### **Test 2: Verify Restrictions Work**
```bash
# Should FAIL from unauthorized domain
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -H "Referer: https://evil-site.com" \
  -d '{"contents": [...]}'
```

### **Test 3: Check for Key in Bundle**
1. Open your Vercel deployment
2. Open DevTools → Sources
3. Search for "AIza"
4. If found: Key is exposed (expected with VITE_)
5. Verify restrictions prevent abuse

---

## 📊 Security Comparison

| Approach | Security | Cost | Complexity | Recommended For |
|----------|----------|------|------------|-----------------|
| Google Cloud + Backend | ⭐⭐⭐⭐⭐ | $$ | High | Production apps |
| Apps Script Proxy | ⭐⭐⭐⭐ | Free | Medium | Current setup |
| Client-Side + Restrictions | ⭐⭐ | Free | Low | Prototypes only |

---

## 🚨 What to Do If Key is Compromised Again

1. **Immediately delete the key** in Google AI Studio
2. **Create a new key**
3. **Update Vercel environment variables**
4. **Redeploy application**
5. **Check Git history** for any commits with the key
6. **If found in Git:** Use BFG Repo-Cleaner to remove from history

---

## 📞 Next Steps

**Choose your security approach:**

1. **Quick Fix (Today):** Follow Phase 1 steps above
2. **Better Security (This Week):** Implement Apps Script proxy (Option 3)
3. **Production Ready (Next Sprint):** Migrate to Google Cloud (Option 1)

**Need help?** Check these resources:
- [Google AI Studio Docs](https://ai.google.dev/docs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

