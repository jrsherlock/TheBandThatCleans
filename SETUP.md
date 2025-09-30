# The Band That Cleans (TBTC) - Setup Instructions

## Overview
This guide will help you deploy the TBTC zero-cost web platform for managing City High Band's parking lot cleanup operations using Google Apps Script and Google Sheets.

## Prerequisites
- Google account with access to Google Drive, Sheets, and Apps Script
- Basic understanding of web development (optional but helpful)
- Text editor or IDE for code editing

## Step 1: Google Sheets Setup

### 1.1 Create a New Google Spreadsheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Rename it to "TBTC - Band Cleanup Event Data"
4. Note the Spreadsheet ID from the URL (the long string between `/d/` and `/edit`)
   - Example: `https://docs.google.com/spreadsheets/d/1ABC123DEF456GHI789JKL/edit`
   - Spreadsheet ID: `1ABC123DEF456GHI789JKL`

### 1.2 Set Up Google Apps Script
1. In your spreadsheet, go to **Extensions > Apps Script**
2. Delete the default `myFunction()` code
3. Copy the entire contents of `Code.gs` from this project
4. Paste it into the Apps Script editor
5. Save the project (Ctrl+S or Cmd+S)
6. Rename the project to "TBTC Backend API"

### 1.3 Configure the Spreadsheet ID
1. In the Apps Script editor, find line 12:
   ```javascript
   const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
   ```
2. Replace `YOUR_SPREADSHEET_ID_HERE` with your actual Spreadsheet ID from Step 1.1
3. Save the file

### 1.4 Set Up the Sheets Structure
1. In the Apps Script editor, run the `setupSheets()` function:
   - Click on the function dropdown and select `setupSheets`
   - Click the "Run" button (▶️)
   - Authorize the script when prompted (click "Review permissions" → "Allow")
2. Check the execution log to confirm sheets were created successfully
3. (Optional) Run `setupSampleData()` to add sample data for testing

## Step 2: Deploy the Google Apps Script as Web App

### 2.1 Deploy the Web App
1. In the Apps Script editor, click **Deploy > New deployment**
2. Click the gear icon ⚙️ next to "Type" and select **Web app**
3. Configure the deployment:
   - **Description**: "TBTC API v1.0"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone" (for public access) or "Anyone with Google account" (more secure)
4. Click **Deploy**
5. Copy the **Web app URL** - you'll need this for the frontend configuration
   - Example: `https://script.google.com/macros/s/ABC123.../exec`

### 2.2 Test the API
1. In the Apps Script editor, run the `testApi()` function to verify everything works
2. Test the web app URL by visiting: `YOUR_WEB_APP_URL?action=data`
3. You should see JSON data returned

## Step 3: Frontend Configuration

### 3.1 Update API Configuration
1. Open `api-service.js` in your project
2. Find the `API_CONFIG` object (around line 7):
   ```javascript
   const API_CONFIG = {
     BASE_URL: 'YOUR_GAS_WEB_APP_URL_HERE',
     // ...
   };
   ```
3. Replace `YOUR_GAS_WEB_APP_URL_HERE` with your Web App URL from Step 2.1
4. Save the file

### 3.2 Set Up the Frontend Application
1. Ensure you have Node.js installed on your computer
2. In your project directory, install dependencies:
   ```bash
   npm install react react-dom lucide-react recharts date-fns framer-motion react-hot-toast
   ```
3. If using Vite (recommended):
   ```bash
   npm create vite@latest tbtc-app -- --template react
   cd tbtc-app
   npm install
   ```
4. Replace the default files with the project files:
   - Copy `app.jsx` to `src/App.jsx`
   - Copy `api-service.js` to `src/api-service.js`
5. Update `src/main.jsx` to import the correct App component

### 3.3 Start the Development Server
```bash
npm run dev
```

## Step 4: Production Deployment (Optional)

### 4.1 Build for Production
```bash
npm run build
```

### 4.2 Deploy to Free Hosting
Choose one of these free hosting options:

**Netlify:**
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your `dist` folder
3. Your app will be live instantly

**Vercel:**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Deploy automatically

**GitHub Pages:**
1. Push your code to GitHub
2. Enable GitHub Pages in repository settings
3. Deploy from the `gh-pages` branch

## Step 5: Configuration and Customization

### 5.1 Customize for Your Band
1. Update band name and colors in `app.jsx`
2. Modify lot names in the initial data setup
3. Adjust student sections and instruments as needed
4. Update user roles and permissions

### 5.2 Security Considerations
1. **API Key**: Change the `MOCK_API_KEY` in `Code.gs` to a secure random string
2. **Access Control**: Consider restricting Web App access to specific Google accounts
3. **Data Validation**: The backend includes input validation, but review for your needs

### 5.3 Optional Features
1. **Google Cloud Vision API**: Enable for OCR functionality
   - In Google Cloud Console, enable Vision API
   - Add the service to your Apps Script project
2. **Email Notifications**: Add email sending functionality using GmailApp
3. **SMS Notifications**: Integrate with services like Twilio

## Troubleshooting

### Common Issues

**"Failed to load initial data"**
- Check that your Web App URL is correct in `api-service.js`
- Verify the Apps Script deployment is set to "Anyone" access
- Ensure the Spreadsheet ID is correct in `Code.gs`

**"Unauthorized access"**
- Check that the API key matches between frontend and backend
- Verify Web App permissions are set correctly

**"Sheet not found" errors**
- Run the `setupSheets()` function in Apps Script
- Check that sheet names match exactly (case-sensitive)

**CORS errors**
- Google Apps Script Web Apps handle CORS automatically
- If issues persist, check browser developer console for specific errors

### Getting Help
1. Check the browser developer console for error messages
2. Review the Apps Script execution logs
3. Test API endpoints directly in your browser
4. Verify all configuration values are correct

## Usage Guide

### For Directors/Administrators
1. **Overview Tab**: Monitor overall progress and statistics
2. **Parking Lots Tab**: Update individual lot statuses
3. **Student Roster Tab**: Manage student check-ins
4. **Command Center Tab**: Bulk operations and notifications
5. **Director Dashboard Tab**: Detailed lot management and photo uploads

### For Volunteers
1. **Volunteer View Tab**: See current event status
2. **Parking Lots Tab**: View assigned lots and progress
3. Limited access to administrative functions

### Data Management
- All data is automatically saved to Google Sheets
- Export reports from the Command Center
- Attendance is logged automatically when students check out
- Photos and comments are stored with lot records

## Maintenance

### Regular Tasks
1. **Backup Data**: Export reports regularly
2. **Clean Up**: Archive old event data
3. **Update Users**: Modify user list as needed
4. **Review Logs**: Check Apps Script execution logs for errors

### Updates
1. **Backend Updates**: Modify `Code.gs` and redeploy
2. **Frontend Updates**: Update code and rebuild/redeploy
3. **Data Structure Changes**: Update sheet headers and API accordingly

## Support
For technical support or questions about this implementation, refer to:
- Google Apps Script documentation
- React documentation
- This project's README file

---

**Congratulations!** Your TBTC platform should now be fully operational with zero ongoing costs.
