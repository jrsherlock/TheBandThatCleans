# Student Check-In/Check-Out Quick Start Guide

## For Directors

### Before the Event

#### 1. Generate QR Codes (30 minutes)
```bash
# You need 23 QR codes total:
# - 22 check-in QR codes (one per parking lot)
# - 1 master check-out QR code

# Use this website: https://www.qr-code-generator.com/

# Check-in URLs (replace with your actual Google Sites URL):
https://sites.google.com/view/tbtc-cleanup#checkin/lot-1
https://sites.google.com/view/tbtc-cleanup#checkin/lot-2
...
https://sites.google.com/view/tbtc-cleanup#checkin/lot-22

# Check-out URL:
https://sites.google.com/view/tbtc-cleanup#checkout
```

See **QR-CODE-GENERATION-GUIDE.md** for detailed instructions.

#### 2. Print and Laminate QR Codes
- Print all 23 QR codes on cardstock or regular paper
- Laminate for weather protection
- Include lot name and address on each check-in QR code
- Label the check-out QR code clearly: "MASTER CHECK-OUT - DO NOT DISPLAY UNTIL DIRECTED"

#### 3. Deploy QR Codes
- **Check-in QR codes**: Post at each parking lot entrance
- **Check-out QR code**: Keep in staging area (do NOT post yet)

#### 4. Verify Backend Setup
```bash
# Test these URLs in your browser:
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=data
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=eventConfig

# Should return JSON data (not errors)
```

### During the Event

#### 1. Students Arrive and Check In
- Students scan the QR code at their assigned parking lot
- They enter their name or campus ID
- They click "Validate" then "Check In"
- They receive confirmation and begin work

**You don't need to do anything - it's automatic!**

#### 2. Monitor Check-Ins
- Go to the **Students** tab in the app
- See real-time list of checked-in students
- See which lot each student is assigned to

#### 3. When Cleanup is Complete

**Enable Check-Outs**:
1. Go to **Students** tab
2. Find the "Student Check-Outs" toggle at the top
3. Click the toggle to turn it **GREEN** (enabled)
4. Display the master check-out QR code in the staging area

**Students Can Now Check Out**:
- Students scan the master check-out QR code
- They find their name in the list
- They click on their name and then "Check Out"
- They receive confirmation and can leave

#### 4. After the Event
- Toggle check-outs back to **RED** (disabled)
- Collect all QR codes
- Download attendance report from **Dashboard** tab

## For Parent Volunteers

### Your Permissions
✅ You can:
- View the dashboard
- View parking lots status
- View student roster
- **Enable/disable check-outs** (toggle)

❌ You cannot:
- Change lot status
- Manually check students in/out
- Edit lot details
- Send notifications

### Enabling Check-Outs

When a director tells you to enable check-outs:

1. Go to **Students** tab
2. Find "Student Check-Outs" toggle at the top
3. Click the toggle to turn it **GREEN**
4. Display the master check-out QR code

**Important**: Only enable check-outs when directed by a director!

## For Students

### Checking In

1. **Arrive at your assigned parking lot**
2. **Find the QR code** posted at the lot entrance
3. **Scan the QR code** with your phone camera
4. **Enter your full name** or campus ID
5. **Click "Validate"** to verify your information
6. **Review your details** (name, instrument, section)
7. **Click "Check In to [Lot Name]"**
8. **Wait for green confirmation** message
9. **Begin cleanup work**

### If You Get an Error

**"Your name was not found in our system"**
- Use the paper attendance sheet instead
- See a director for help

**"You are already checked into another lot"**
- You can only be checked into ONE lot at a time
- Check out from your current lot first
- OR see a director if you need to switch lots

### Checking Out

1. **Complete your cleanup work**
2. **Wait for director approval** (check-outs must be enabled)
3. **Find the master check-out QR code** in the staging area
4. **Scan the QR code** with your phone
5. **Search for your name** in the list
6. **Click on your name** to select it
7. **Click "Check Out"**
8. **Wait for confirmation** message
9. **You're free to leave!**

### If Check-Out is Disabled

You'll see a yellow warning message:
> "Check-Outs Currently Disabled. Please wait for a director to enable check-outs before leaving your assigned lot."

**What to do**: Wait in the staging area until a director enables check-outs.

## Troubleshooting

### QR Code Won't Scan
- Make sure you have good lighting
- Hold phone steady
- Try moving closer/farther from QR code
- Clean your camera lens
- Try a different QR code scanner app

### App Won't Load
- Check your internet connection
- Try refreshing the page
- Make sure you scanned the correct QR code
- See a director for help

### Can't Find Your Name
- Try searching by last name only
- Try searching by first name only
- Check spelling
- See a director for manual check-in

### Already Checked In Error
- You can only be in one lot at a time
- Check out from your current lot first
- OR see a director to manually switch you

## Quick Reference

### QR Code URLs

**Check-In** (one per lot):
```
https://sites.google.com/view/tbtc-cleanup#checkin/lot-[NUMBER]
```

**Check-Out** (one for all):
```
https://sites.google.com/view/tbtc-cleanup#checkout
```

### Toggle States

🔴 **RED** = Check-outs DISABLED (students cannot leave)
🟢 **GREEN** = Check-outs ENABLED (students can leave)

### Permissions

| Action | Director | Volunteer | Student |
|--------|----------|-----------|---------|
| View dashboard | ✅ | ✅ | ✅ |
| View lots | ✅ | ✅ | ✅ |
| View students | ✅ | ✅ | ❌ |
| Check-out toggle | ✅ | ✅ | ❌ |
| Manual check-in | ✅ | ❌ | ❌ |
| Edit lot status | ✅ | ❌ | ❌ |
| Self check-in | ✅ | ✅ | ✅ |
| Self check-out | ✅ | ✅ | ✅ |

## Support

### During Event
- See a director at the staging area
- Use paper backup sheets if needed

### After Event
- Email: director@school.edu
- Check documentation: CHECKIN-CHECKOUT-GUIDE.md

## Tips for Success

### For Directors
- Test QR codes before the event
- Have paper backup sheets ready
- Assign a volunteer to monitor check-ins
- Enable check-outs only when all lots are complete
- Download attendance report after event

### For Volunteers
- Familiarize yourself with the toggle location
- Know when to enable check-outs
- Help students who have trouble scanning
- Direct students to paper sheets if needed

### For Students
- Charge your phone before the event
- Know your campus ID
- Scan the correct lot's QR code
- Wait for confirmation before starting work
- Don't leave until check-outs are enabled

## Event Day Checklist

### Setup (30 min before)
- [ ] Post check-in QR codes at all lots
- [ ] Keep check-out QR code in staging area
- [ ] Test a few QR codes
- [ ] Verify toggle is set to RED (disabled)
- [ ] Have paper backup sheets ready

### During Event
- [ ] Monitor check-ins on Students tab
- [ ] Help students with issues
- [ ] Track lot completion

### Cleanup Complete
- [ ] Verify all lots are complete
- [ ] Toggle check-outs to GREEN
- [ ] Display check-out QR code
- [ ] Monitor check-outs

### After Event
- [ ] Toggle check-outs to RED
- [ ] Collect all QR codes
- [ ] Download attendance report
- [ ] Store QR codes for next event

---

**Need More Help?**

See the complete documentation:
- **CHECKIN-CHECKOUT-GUIDE.md** - Full technical guide
- **QR-CODE-GENERATION-GUIDE.md** - QR code creation
- **CHECKIN-IMPLEMENTATION-SUMMARY.md** - Technical details

