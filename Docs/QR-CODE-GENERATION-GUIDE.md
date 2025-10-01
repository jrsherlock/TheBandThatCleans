# QR Code Generation Guide for TBTC Check-In/Check-Out System

## Overview

This guide provides step-by-step instructions for generating and printing QR codes for the TBTC parking lot cleanup check-in/check-out system.

## Prerequisites

- Google Sites URL for your TBTC application
- List of all parking lots with their IDs
- QR code generator (recommended: https://www.qr-code-generator.com/)
- Printer and laminating supplies

## QR Code Types

### 1. Check-In QR Codes (One per parking lot)

**Purpose**: Students scan these to check into a specific parking lot

**URL Format**: `https://sites.google.com/view/tbtc-cleanup#checkin/[lot-id]`

**Example URLs**:
```
https://sites.google.com/view/tbtc-cleanup#checkin/lot-1
https://sites.google.com/view/tbtc-cleanup#checkin/lot-2
https://sites.google.com/view/tbtc-cleanup#checkin/lot-3
...
https://sites.google.com/view/tbtc-cleanup#checkin/lot-22
```

### 2. Master Check-Out QR Code (One for all students)

**Purpose**: Students scan this to check out when cleanup is complete

**URL Format**: `https://sites.google.com/view/tbtc-cleanup#checkout`

**Single URL**:
```
https://sites.google.com/view/tbtc-cleanup#checkout
```

## Step-by-Step Generation Instructions

### Step 1: Prepare Your Lot List

Create a spreadsheet with all your parking lots:

| Lot ID | Lot Name | Address | QR Code URL |
|--------|----------|---------|-------------|
| lot-1 | Lot 33 North | 840 Evashevski Drive | https://sites.google.com/view/tbtc-cleanup#checkin/lot-1 |
| lot-2 | Lot 33 South | 840 Evashevski Drive | https://sites.google.com/view/tbtc-cleanup#checkin/lot-2 |
| lot-3 | Lot 43 North | 840 Evashevski Drive | https://sites.google.com/view/tbtc-cleanup#checkin/lot-3 |
| ... | ... | ... | ... |

### Step 2: Generate QR Codes

#### Option A: Using QR Code Generator Website

1. Go to https://www.qr-code-generator.com/
2. Select "URL" as the content type
3. Enter the check-in URL for the first lot
4. Customize appearance (optional):
   - Add logo (TBTC or school logo)
   - Change colors (school colors)
   - Add frame with text
5. Download as PNG or SVG (high resolution)
6. Repeat for all lots

#### Option B: Using Google Sheets + QR Code Add-on

1. Install "QR Code Generator" add-on in Google Sheets
2. Create a column with all your URLs
3. Use the add-on to batch generate QR codes
4. Download all QR codes at once

#### Option C: Using Python Script (Advanced)

```python
import qrcode
import pandas as pd

# Read lot data
lots = pd.read_csv('lots-import-data.csv')

# Generate QR codes
for index, row in lots.iterrows():
    lot_id = row['id']
    lot_name = row['name']
    
    # Create QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(f'https://sites.google.com/view/tbtc-cleanup#checkin/{lot_id}')
    qr.make(fit=True)
    
    # Save image
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(f'qr_codes/{lot_id}.png')
    
print("QR codes generated successfully!")
```

### Step 3: Create Printable Signs

#### Template for Check-In Signs

```
┌─────────────────────────────────────┐
│                                     │
│   THE BAND THAT CLEANS              │
│   Parking Lot Cleanup Check-In      │
│                                     │
│   [QR CODE HERE]                    │
│                                     │
│   Lot 43 North                      │
│   North of Hawkeye Ramp             │
│   840 Evashevski Drive              │
│                                     │
│   INSTRUCTIONS:                     │
│   1. Scan QR code with phone        │
│   2. Enter your name or ID          │
│   3. Click "Check In"               │
│   4. Wait for confirmation          │
│                                     │
│   Questions? See a director         │
│                                     │
└─────────────────────────────────────┘
```

#### Template for Check-Out Sign

```
┌─────────────────────────────────────┐
│                                     │
│   THE BAND THAT CLEANS              │
│   MASTER CHECK-OUT                  │
│                                     │
│   [QR CODE HERE]                    │
│                                     │
│   ⚠️  ONLY SCAN WHEN DIRECTED       │
│   BY A DIRECTOR                     │
│                                     │
│   INSTRUCTIONS:                     │
│   1. Scan QR code with phone        │
│   2. Find your name in the list     │
│   3. Click on your name             │
│   4. Click "Check Out"              │
│   5. Wait for confirmation          │
│                                     │
│   Questions? See a director         │
│                                     │
└─────────────────────────────────────┘
```

### Step 4: Print and Prepare

#### Printing Recommendations

**Paper Size**: 8.5" x 11" (standard letter)

**Paper Type**: 
- Cardstock (110 lb) for durability
- OR regular paper + lamination

**QR Code Size**: 
- Minimum: 2" x 2"
- Recommended: 4" x 4" for easy scanning

**Print Settings**:
- High quality / Best
- Color (if using school colors)
- Portrait orientation

#### Lamination

1. Print all signs
2. Laminate using:
   - Laminating machine (recommended)
   - OR self-adhesive laminating sheets
3. Trim edges
4. Punch holes for hanging (if needed)

### Step 5: Deployment

#### Check-In QR Codes

**Placement**:
- Post at the entrance of each parking lot
- Attach to a visible post, sign, or wall
- Height: 4-5 feet (easy scanning height)
- Protected from weather

**Mounting Options**:
- Zip ties to fence/post
- Adhesive tape (outdoor-rated)
- Magnetic backing (if metal surface)
- Clipboard with string

#### Master Check-Out QR Code

**Placement**:
- Keep in staging area (NOT posted publicly)
- Only display when directors enable check-outs
- Multiple copies for high-traffic areas

**Storage**:
- Folder or envelope when not in use
- Clearly labeled "CHECK-OUT QR CODE"
- Accessible to directors only

## Testing Your QR Codes

### Before Event Day

1. **Test each check-in QR code**:
   - Scan with phone camera
   - Verify correct lot ID appears
   - Test check-in flow with test student

2. **Test master check-out QR code**:
   - Scan with phone camera
   - Verify check-out interface loads
   - Test with check-outs disabled
   - Test with check-outs enabled

3. **Test on multiple devices**:
   - iPhone (Safari)
   - Android (Chrome)
   - Tablet
   - Different camera apps

### Common Issues and Solutions

**QR code won't scan**:
- Increase QR code size
- Improve lighting
- Clean camera lens
- Try different QR code generator

**Wrong lot appears**:
- Verify URL in QR code
- Check lot ID matches Lots sheet
- Regenerate QR code

**App doesn't load**:
- Verify Google Sites URL is correct
- Check internet connection
- Test URL in browser first

## Maintenance

### After Each Event

- [ ] Collect all check-out QR codes
- [ ] Inspect check-in QR codes for damage
- [ ] Replace any damaged/faded QR codes
- [ ] Store in labeled folder

### Periodic Updates

- [ ] Regenerate QR codes if Google Sites URL changes
- [ ] Update lot information if addresses change
- [ ] Create new QR codes for new lots
- [ ] Archive old QR codes

## Bulk Generation Script

For generating all 22 lot QR codes at once, use this spreadsheet formula:

```
=IMAGE("https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=" & ENCODEURL("https://sites.google.com/view/tbtc-cleanup#checkin/" & A2))
```

Where A2 contains the lot ID (e.g., "lot-1")

## Resources

### QR Code Generators
- https://www.qr-code-generator.com/ (Free, easy to use)
- https://www.qr-code-monkey.com/ (Free, customizable)
- https://www.qrstuff.com/ (Free, batch generation)

### Design Tools
- Canva (https://www.canva.com/) - Sign templates
- Google Slides - Simple layouts
- Microsoft Word - Basic signs

### Printing Services
- Local print shop (for large quantities)
- Office supply stores (Staples, Office Depot)
- School print center

## Appendix: Complete URL List

### Check-In URLs (22 Lots)

```
https://sites.google.com/view/tbtc-cleanup#checkin/lot-1
https://sites.google.com/view/tbtc-cleanup#checkin/lot-2
https://sites.google.com/view/tbtc-cleanup#checkin/lot-3
https://sites.google.com/view/tbtc-cleanup#checkin/lot-4
https://sites.google.com/view/tbtc-cleanup#checkin/lot-5
https://sites.google.com/view/tbtc-cleanup#checkin/lot-6
https://sites.google.com/view/tbtc-cleanup#checkin/lot-7
https://sites.google.com/view/tbtc-cleanup#checkin/lot-8
https://sites.google.com/view/tbtc-cleanup#checkin/lot-9
https://sites.google.com/view/tbtc-cleanup#checkin/lot-10
https://sites.google.com/view/tbtc-cleanup#checkin/lot-11
https://sites.google.com/view/tbtc-cleanup#checkin/lot-12
https://sites.google.com/view/tbtc-cleanup#checkin/lot-13
https://sites.google.com/view/tbtc-cleanup#checkin/lot-14
https://sites.google.com/view/tbtc-cleanup#checkin/lot-15
https://sites.google.com/view/tbtc-cleanup#checkin/lot-16
https://sites.google.com/view/tbtc-cleanup#checkin/lot-17
https://sites.google.com/view/tbtc-cleanup#checkin/lot-18
https://sites.google.com/view/tbtc-cleanup#checkin/lot-19
https://sites.google.com/view/tbtc-cleanup#checkin/lot-20
https://sites.google.com/view/tbtc-cleanup#checkin/lot-21
https://sites.google.com/view/tbtc-cleanup#checkin/lot-22
```

### Check-Out URL (1 Master)

```
https://sites.google.com/view/tbtc-cleanup#checkout
```

---

**Note**: Replace `https://sites.google.com/view/tbtc-cleanup` with your actual Google Sites URL if different.

