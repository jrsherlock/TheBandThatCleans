# TBTC Logo Integration - Testing Guide

This guide provides step-by-step instructions for testing the logo integration across all screens and scenarios.

---

## Prerequisites

Before testing, ensure:
- ✅ Logo file exists at `/Users/sherlock/TBTC-MVP/src/public/TBTC.png`
- ✅ Development server is running (`npm run dev` or similar)
- ✅ You have access to different devices/browsers for testing

---

## Quick Start Testing

### 1. Start the Development Server

```bash
cd /Users/sherlock/TBTC-MVP
npm run dev
```

### 2. Open the Application

Open your browser and navigate to the local development URL (typically `http://localhost:5173` or similar).

---

## Test Checklist

### ✅ Desktop Testing (Chrome/Firefox/Safari)

#### Main Application Header
- [ ] Open the main application
- [ ] Verify TBTC logo appears in the top-left header
- [ ] Logo should be 64x64px (approximately 1 inch on screen)
- [ ] Logo should be clear and not pixelated
- [ ] Logo should have rounded corners
- [ ] Text "The Band That Cleans" appears next to logo
- [ ] Layout looks balanced and professional

**Expected Result:**
```
[LOGO] The Band That Cleans
       Director Dashboard • Parking Lot Cleanup Event
```

---

#### Loading Screen
- [ ] Refresh the page or clear cache
- [ ] Observe the loading screen
- [ ] TBTC logo should appear above the spinner
- [ ] Logo should be 96x96px (larger than header)
- [ ] Logo should have a subtle pulse animation
- [ ] Spinner should appear below the logo
- [ ] Text "Loading TBTC platform..." appears below spinner

**Expected Result:**
```
[LOGO] (pulsing)
  ⟳ (spinner)
Loading TBTC platform...
```

---

#### Error Screen
- [ ] Simulate an error (disconnect network or modify API endpoint)
- [ ] Verify error screen displays
- [ ] TBTC logo should appear at the top
- [ ] Logo should be 80x80px
- [ ] Warning triangle icon appears below logo
- [ ] "Failed to Load" message appears
- [ ] "Try Again" button is visible

**Expected Result:**
```
[LOGO]
  ⚠️
Failed to Load
[Error message]
[Try Again Button]
```

---

#### Browser Tab (Favicon)
- [ ] Look at the browser tab
- [ ] TBTC logo should appear as the favicon
- [ ] Logo should be clear even at small size
- [ ] Logo should replace the previous emoji (🎵)

**Expected Result:**
```
Browser Tab: [LOGO] The Band That Cleans - TBTC Platform
```

---

### ✅ QR Code Flow Testing

#### Student Check-In Screen
- [ ] Navigate to a check-in URL (e.g., `#checkin/lot-1`)
- [ ] Verify the check-in screen loads
- [ ] TBTC logo should appear in top-right corner of header
- [ ] Logo should be 48x48px
- [ ] Logo should not overlap with title or lot name
- [ ] MapPin icon and "Student Check-In" title on left
- [ ] Layout should be balanced

**Expected Result:**
```
┌─────────────────────────────────────────┐
│ 📍 Student Check-In        [LOGO]       │
│ Lot 33 North                            │
└─────────────────────────────────────────┘
```

**Test Actions:**
- [ ] Enter a student name
- [ ] Verify logo remains visible during interaction
- [ ] Check that logo doesn't interfere with form fields

---

#### Student Check-Out Screen
- [ ] Navigate to check-out URL (`#checkout`)
- [ ] Verify the check-out screen loads
- [ ] TBTC logo should appear in top-right corner of header
- [ ] Logo should be 48x48px
- [ ] Logo should not overlap with title or description
- [ ] LogOut icon and "Student Check-Out" title on left
- [ ] Layout should be balanced

**Expected Result:**
```
┌─────────────────────────────────────────┐
│ 🚪 Student Check-Out       [LOGO]       │
│ Find your name and check out...         │
└─────────────────────────────────────────┘
```

**Test Actions:**
- [ ] Search for a student
- [ ] Verify logo remains visible during search
- [ ] Check that logo doesn't interfere with student list

---

### ✅ Mobile Testing (Responsive Design)

#### iPhone/Android (Portrait Mode)
- [ ] Open application on mobile device or use browser dev tools
- [ ] Set viewport to mobile size (375px width)
- [ ] Verify all logos scale appropriately
- [ ] No horizontal scrolling should occur
- [ ] Logos should remain visible and clear
- [ ] Text should not overlap with logos

**Test Screens:**
1. Main header
2. Loading screen
3. Check-in screen
4. Check-out screen

---

#### Tablet (iPad/Android Tablet)
- [ ] Set viewport to tablet size (768px width)
- [ ] Verify logos display correctly
- [ ] Layout should adapt smoothly
- [ ] Logos should maintain aspect ratio

---

### ✅ Dark Mode Testing

#### Enable Dark Mode
- [ ] Click the theme toggle button (Sun/Moon icon)
- [ ] Verify dark mode activates
- [ ] Check all screens with logo

#### Dark Mode Verification
- [ ] Main header logo visible on dark background
- [ ] Loading screen logo visible on dark gradient
- [ ] Error screen logo visible on dark background
- [ ] Check-in header logo visible on blue/purple gradient
- [ ] Check-out header logo visible on purple/pink gradient
- [ ] Logo colors remain consistent (not inverted)
- [ ] Logo has good contrast on all backgrounds

**Note:** If logo has light colors or transparency, verify it's still visible on dark backgrounds.

---

### ✅ Performance Testing

#### Load Time
- [ ] Clear browser cache
- [ ] Reload the page
- [ ] Measure time to first logo appearance
- [ ] Logo should load within 1-2 seconds
- [ ] No layout shift when logo loads

#### Network Throttling
- [ ] Open browser dev tools
- [ ] Enable network throttling (Slow 3G)
- [ ] Reload the page
- [ ] Verify logo still loads reasonably fast
- [ ] Check for any broken image icons

#### Console Errors
- [ ] Open browser console (F12)
- [ ] Navigate through all screens
- [ ] Verify no errors related to logo loading
- [ ] Check for 404 errors on logo file
- [ ] Verify no CORS errors

---

### ✅ Cross-Browser Testing

Test on multiple browsers:

#### Chrome
- [ ] All logos display correctly
- [ ] Animations work smoothly
- [ ] No console errors

#### Firefox
- [ ] All logos display correctly
- [ ] Animations work smoothly
- [ ] No console errors

#### Safari (macOS/iOS)
- [ ] All logos display correctly
- [ ] Animations work smoothly
- [ ] No console errors

#### Edge
- [ ] All logos display correctly
- [ ] Animations work smoothly
- [ ] No console errors

---

## Common Issues and Solutions

### Issue 1: Logo Not Displaying
**Symptoms:** Broken image icon or empty space where logo should be

**Solutions:**
1. Verify logo file exists at `/Users/sherlock/TBTC-MVP/src/public/TBTC.png`
2. Check browser console for 404 errors
3. Verify import path is correct in each component
4. Clear browser cache and reload

---

### Issue 2: Logo Appears Pixelated
**Symptoms:** Logo looks blurry or low quality

**Solutions:**
1. Check original logo file resolution (should be at least 256x256px)
2. Verify `object-contain` class is applied
3. Check if logo is being stretched beyond original size
4. Consider using a higher resolution logo file

---

### Issue 3: Logo Overlaps Text
**Symptoms:** Logo covers or touches text elements

**Solutions:**
1. Verify `justify-between` class is applied to header containers
2. Check responsive breakpoints in Tailwind classes
3. Test on different screen sizes
4. Adjust logo size if needed (reduce h-12 to h-10, etc.)

---

### Issue 4: Logo Not Visible in Dark Mode
**Symptoms:** Logo disappears or has poor contrast on dark backgrounds

**Solutions:**
1. Check if logo has transparency
2. Consider adding a subtle background or border
3. Use conditional rendering for light/dark logo variants
4. Add `dark:bg-white/10` class to logo container if needed

---

### Issue 5: Favicon Not Updating
**Symptoms:** Browser tab still shows old emoji icon

**Solutions:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard reload (Ctrl+Shift+R or Cmd+Shift+R)
3. Close and reopen browser
4. Check if logo path in index.html is correct

---

## Automated Testing (Optional)

If you have automated tests, add these checks:

```javascript
// Example test cases
describe('Logo Integration', () => {
  test('Logo appears in main header', () => {
    // Check for logo image element
    const logo = screen.getByAltText('The Band That Cleans Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', expect.stringContaining('TBTC.png'));
  });

  test('Logo appears on loading screen', () => {
    // Check for logo with pulse animation
    const logo = screen.getByAltText('The Band That Cleans Logo');
    expect(logo).toHaveClass('animate-pulse');
  });

  test('Logo appears on check-in screen', () => {
    // Navigate to check-in
    // Check for logo in header
    const logo = screen.getByAltText('TBTC Logo');
    expect(logo).toBeInTheDocument();
  });
});
```

---

## Accessibility Testing

### Screen Reader Testing
- [ ] Enable screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Navigate to each screen with logo
- [ ] Verify screen reader announces: "The Band That Cleans Logo, image"
- [ ] Logo should not interrupt navigation flow

### Keyboard Navigation
- [ ] Tab through the application
- [ ] Logo should not receive focus (it's decorative)
- [ ] Logo should not interfere with form field navigation

### Color Contrast
- [ ] Use browser accessibility tools
- [ ] Verify logo has sufficient contrast on all backgrounds
- [ ] Check both light and dark modes

---

## Sign-Off Checklist

Before considering the logo integration complete:

- [ ] All logos display correctly on desktop
- [ ] All logos display correctly on mobile
- [ ] All logos display correctly on tablet
- [ ] Dark mode works properly
- [ ] No console errors
- [ ] No performance issues
- [ ] Favicon updated in browser tab
- [ ] Accessibility requirements met
- [ ] Cross-browser compatibility verified
- [ ] Documentation reviewed and accurate

---

## Reporting Issues

If you find any issues during testing:

1. **Take a screenshot** of the issue
2. **Note the browser and version** (e.g., Chrome 120.0)
3. **Note the screen size** (e.g., 1920x1080 or iPhone 12)
4. **Describe the expected vs actual behavior**
5. **Check browser console** for any errors
6. **Report to development team** with all details

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Mark this task as complete
2. ✅ Update project documentation
3. ✅ Consider deploying to staging environment
4. ✅ Plan for production deployment
5. ✅ Monitor for any user-reported issues

---

## Additional Enhancements (Future)

Consider these improvements after initial testing:

- [ ] Add hover effects to logo (subtle scale or glow)
- [ ] Create logo variants for different themes
- [ ] Optimize logo file size (compress to < 50KB)
- [ ] Add loading="lazy" for below-fold logos
- [ ] Implement WebP format with PNG fallback
- [ ] Add logo to email templates
- [ ] Include logo in PDF reports
- [ ] Use logo in QR code generation

---

## Summary

This testing guide ensures comprehensive verification of the TBTC logo integration across:
- All application screens
- Multiple devices and screen sizes
- Different browsers
- Light and dark modes
- Various network conditions
- Accessibility standards

Follow this guide systematically to ensure a professional, bug-free logo implementation.

