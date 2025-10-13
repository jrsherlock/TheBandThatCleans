# Gemini API Troubleshooting Guide

## 🔧 Common Issues and Solutions

This guide helps you resolve common issues with the Google Gemini AI integration for sign-in sheet analysis.

---

## ❌ Error: "Model not found" or 404 Error

### Symptoms
- Error message: `models/gemini-1.5-flash is not found for API version v1beta`
- 404 error when calling Gemini API
- Error URL: `https://generativelanguage.googleapis.com/v1beta/models/...`

### Cause
Google has updated their model naming conventions. The model name `gemini-1.5-flash` may not be available or has been renamed.

### Solution ✅
The code has been updated to automatically try multiple models in priority order:

1. `gemini-2.0-flash-exp` (Latest experimental)
2. `gemini-1.5-flash-latest` (Latest stable 1.5)
3. `gemini-1.5-flash` (Standard 1.5)
4. `gemini-1.5-pro-latest` (Latest pro)
5. `gemini-1.5-pro` (Standard pro)
6. `gemini-pro-vision` (Fallback)

**No action needed** - the system will automatically find an available model.

### Manual Override (Optional)
If you want to specify a specific model, add this to your `.env` file:

```bash
VITE_GEMINI_MODEL=gemini-2.0-flash-exp
```

---

## ❌ Error: "Invalid API key"

### Symptoms
- Error message: `Invalid API key. Please check your Gemini API configuration`
- API returns 401 or 403 error

### Cause
- API key is missing
- API key is incorrect
- API key doesn't have proper permissions

### Solution ✅

1. **Verify API key exists in `.env` file:**
   ```bash
   cat .env
   ```
   Should show:
   ```
   VITE_GEMINI_API_KEY=AIzaSy...
   ```

2. **Check API key is valid:**
   - Go to https://aistudio.google.com/app/apikey
   - Verify your API key is active
   - Copy the key exactly (no extra spaces)

3. **Update `.env` file:**
   ```bash
   echo "VITE_GEMINI_API_KEY=YOUR_ACTUAL_KEY_HERE" > .env
   ```

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

---

## ❌ Error: "API quota exceeded"

### Symptoms
- Error message: `API quota exceeded. Please try again later`
- Error code: `RESOURCE_EXHAUSTED`

### Cause
You've exceeded the free tier limits for Gemini API.

### Solution ✅

**Free Tier Limits:**
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per day

**Options:**

1. **Wait and retry** - Quotas reset after the time period
2. **Upgrade to paid tier** - Visit https://ai.google.dev/pricing
3. **Use manual entry** - Toggle "Use Manual Entry" in the upload modal

---

## ❌ Error: "Network error"

### Symptoms
- Error message: `Network error. Please check your internet connection`
- Error: `Failed to fetch`

### Cause
- No internet connection
- Firewall blocking API requests
- CORS issues

### Solution ✅

1. **Check internet connection:**
   ```bash
   ping google.com
   ```

2. **Test API directly:**
   ```bash
   curl https://generativelanguage.googleapis.com/v1beta/models
   ```

3. **Check browser console** for CORS errors

4. **Try different network** (e.g., mobile hotspot)

---

## ❌ Error: "Failed to analyze image"

### Symptoms
- Generic error during AI analysis
- Image uploads but analysis fails

### Possible Causes & Solutions

### 1. Image too large
**Solution:** The app automatically compresses images, but if it still fails:
- Take a smaller photo
- Reduce image quality before upload
- Use manual entry mode

### 2. Image format not supported
**Solution:** Use JPEG or PNG format
- Avoid HEIC, TIFF, or other formats
- Convert image to JPEG before upload

### 3. Image quality too poor
**Solution:** 
- Retake photo with better lighting
- Ensure text is clear and readable
- Use manual entry if image is unusable

### 4. API timeout
**Solution:**
- Check internet speed
- Try again with smaller image
- Use manual entry mode

---

## ❌ Error: "Gemini API not configured"

### Symptoms
- Modal shows: "AI analysis not configured. Please use manual entry."
- AI analysis button is disabled

### Cause
- `.env` file missing
- `VITE_GEMINI_API_KEY` not set
- API key is placeholder value

### Solution ✅

1. **Create `.env` file in project root:**
   ```bash
   cd /Users/sherlock/TBTC-MVP
   touch .env
   ```

2. **Add API key:**
   ```bash
   echo "VITE_GEMINI_API_KEY=AIzaSyCWaIctac3h52sMEZ0SCMu5PuFrm6hMLEs" > .env
   ```

3. **Verify file contents:**
   ```bash
   cat .env
   ```

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

---

## ❌ Error: "No Gemini models available"

### Symptoms
- Error message: `No Gemini models available. Please check your API key...`
- All model attempts failed

### Cause
- API key doesn't have access to any Gemini models
- Google Cloud project not configured correctly
- API not enabled

### Solution ✅

1. **Enable Generative Language API:**
   - Go to https://console.cloud.google.com/
   - Select your project
   - Go to "APIs & Services" > "Library"
   - Search for "Generative Language API"
   - Click "Enable"

2. **Verify API key permissions:**
   - Go to https://aistudio.google.com/app/apikey
   - Check that your key has access to Gemini models
   - Create a new key if needed

3. **Test with simple request:**
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
   ```

---

## 🧪 Testing Your Configuration

### Quick Test Script

Create a test file `test-gemini.js`:

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'YOUR_API_KEY_HERE';
const genAI = new GoogleGenerativeAI(API_KEY);

async function testGemini() {
  try {
    console.log('Testing Gemini API...');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent('Say hello!');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Success! Response:', text);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGemini();
```

Run it:
```bash
node test-gemini.js
```

---

## 📊 Checking API Usage

### View Your Quota Usage

1. Go to https://aistudio.google.com/app/apikey
2. Click on your API key
3. View usage statistics
4. Check remaining quota

### Monitor Requests

Check browser DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "generativelanguage"
4. Watch API requests in real-time

---

## 🔍 Debugging Tips

### Enable Verbose Logging

The service already logs detailed information. Check browser console for:

```
🤖 Analyzing sign-in sheet with Gemini AI...
🔍 Trying model: gemini-2.0-flash-exp
✅ Using model: gemini-2.0-flash-exp
🤖 Gemini raw response: {...}
```

### Check Environment Variables

In browser console:
```javascript
console.log(import.meta.env.VITE_GEMINI_API_KEY);
```

Should show your API key (first few characters).

### Test Model Availability

```javascript
import { getGeminiStatus } from './src/services/geminiService';
console.log(getGeminiStatus());
```

---

## 🆘 Still Having Issues?

### Fallback Options

1. **Use Manual Entry Mode:**
   - Toggle "Use Manual Entry" in upload modal
   - Enter count manually
   - Still saves image for verification

2. **Skip AI Analysis:**
   - Upload image without analyzing
   - Count students manually
   - Submit with manual count

3. **Contact Support:**
   - Check Google AI Studio status: https://status.cloud.google.com/
   - Visit Gemini API docs: https://ai.google.dev/docs
   - Check for service outages

---

## 📝 Best Practices

### For Reliable AI Analysis

✅ **Good practices:**
- Use clear, well-lit photos
- Ensure all text is readable
- Take photos from directly above
- Use JPEG or PNG format
- Keep images under 5MB

❌ **Avoid:**
- Blurry or dark photos
- Extreme angles
- Partial sheets
- Very large files (>5MB)
- Unusual image formats

### For API Key Security

✅ **Do:**
- Keep API key in `.env` file
- Add `.env` to `.gitignore`
- Use environment variables
- Rotate keys periodically

❌ **Don't:**
- Commit API keys to git
- Share keys publicly
- Use keys in client-side code (except for Gemini which is designed for it)
- Use production keys in development

---

## 🔄 Model Update History

| Date | Change | Reason |
|------|--------|--------|
| 2024-10-12 | Changed default from `gemini-1.5-flash` to `gemini-2.0-flash-exp` | Google updated model names |
| 2024-10-12 | Added model fallback system | Improve reliability |
| 2024-10-12 | Added multiple model support | Handle API changes gracefully |

---

## ✅ Verification Checklist

Before reporting an issue, verify:

- [ ] `.env` file exists in project root
- [ ] `VITE_GEMINI_API_KEY` is set correctly
- [ ] API key is valid (test at https://aistudio.google.com/)
- [ ] Dev server was restarted after adding `.env`
- [ ] Internet connection is working
- [ ] Browser console shows no CORS errors
- [ ] Image is in JPEG or PNG format
- [ ] Image is under 5MB
- [ ] Generative Language API is enabled in Google Cloud Console

---

**Most issues are resolved by:**
1. Verifying API key is correct
2. Restarting dev server
3. Using the automatic model fallback (already implemented)

The system is now more robust and will automatically find an available model!

