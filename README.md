# The Band That Cleans (TBTC) - Zero-Cost Web Platform

A comprehensive web platform for managing City High Band's post-game parking lot cleanup operations with zero operational costs using Google Apps Script and Google Sheets.

## 🎯 MVP Version - Hybrid Paper/Digital Workflow

**Current Branch**: `MVP`

This MVP version implements a hybrid paper/digital workflow where:
- **Students** sign physical paper sheets at each parking lot (no app interaction)
- **Directors/Volunteers** upload photos of sign-in sheets via the web app
- **OCR Processing** automatically extracts student counts from uploaded images
- **Real-time Tracking** of lot status and progress continues as before

### Why This Approach?
- Eliminates need for students to have phones/QR codes
- Faster sign-in process (no waiting for app to load)
- Automatic student counting reduces manual data entry
- Maintains digital tracking benefits for Directors

## 🎯 Project Overview

The Band That Cleans (TBTC) platform transforms the existing React single-file component into a fully functional web application with real-time data persistence, multi-user support, and comprehensive reporting capabilities.

### Key Features (MVP)

- **Real-time Lot Management**: Track parking lot cleanup status with live updates
- **OCR-Based Student Counting**: Upload photos of physical sign-in sheets for automatic student counting
- **Image Upload Interface**: Drag-and-drop or browse to upload sign-in sheet photos
- **Multi-user Support**: Different views for directors and volunteers
- **Comprehensive Reporting**: Export detailed attendance and progress reports
- **Zero Operational Costs**: Built entirely on free Google services (Google Sheets + Cloud Vision API)

## 🏗️ Architecture

### Backend (Google Apps Script)
- **Data Persistence**: Google Sheets with 3 structured tabs
- **REST-like API**: Handles all CRUD operations
- **Authentication**: Mock API key system (expandable)
- **Error Handling**: Comprehensive logging and validation
- **OCR Processing**: Google Cloud Vision API integration

### Frontend (React)
- **Modern UI**: Tailwind CSS with Framer Motion animations
- **Real-time Updates**: Optimistic updates with error handling
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Loading States**: User-friendly loading and error states
- **Toast Notifications**: Real-time feedback for all operations

### Data Structure

**Lots Sheet:**
- Lot information, status, timestamps, comments, photos

**Students Sheet:**
- Student details, check-in status, lot assignments

**AttendanceLog Sheet:**
- Historical attendance records for reporting

## 🚀 Quick Start

### Prerequisites
- Google account
- Node.js (for development)
- Basic understanding of React (helpful but not required)

### 1. Backend Setup
1. Create a new Google Spreadsheet
2. Open Apps Script (Extensions > Apps Script)
3. Copy `Code.gs` content into the editor
4. Update the `SPREADSHEET_ID` constant
5. Run `setupSheets()` function
6. Deploy as Web App

### 2. Frontend Setup
1. Update `api-service.js` with your Web App URL
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

### 3. Production Deployment
1. Build: `npm run build`
2. Deploy to Netlify, Vercel, or GitHub Pages

**For detailed instructions, see [SETUP.md](./SETUP.md)**

## 📁 Project Structure

```
TBTC-MVP/
├── Code.gs                 # Google Apps Script backend
├── app.jsx                 # Main React application
├── api-service.js          # API service layer
├── SETUP.md               # Detailed setup instructions
├── README.md              # This file
└── package.json           # Dependencies (if using npm)
```

## 🎨 User Interface

### Director Dashboard
- **Overview**: Real-time statistics and progress tracking
- **Lot Management**: Individual lot status updates and details
- **Student Roster**: Check-in management and filtering
- **Command Center**: Bulk operations and notifications
- **Reporting**: Export comprehensive attendance reports

### Volunteer View
- **Event Status**: Current progress and lot assignments
- **Limited Access**: View-only access to essential information

## 🔧 Technical Details

### API Endpoints

**GET Requests:**
- `?action=data` - Fetch all lots and students
- `?action=report` - Generate attendance report

**POST Requests:**
- `UPDATE_LOT_STATUS` - Update single lot status
- `UPDATE_BULK_STATUS` - Update multiple lots
- `UPDATE_LOT_DETAILS` - Update comments/photos
- `UPDATE_STUDENT_STATUS` - Check-in/out students
- `OCR_UPLOAD` - Process uploaded images

### Security Features
- API key authentication
- Input validation and sanitization
- Error handling and logging
- Configurable access controls

### Performance Optimizations
- Optimistic updates for better UX
- Efficient data structures
- Minimal API calls
- Caching strategies

## 🔒 Security Considerations

### Current Implementation
- Mock API key system for basic authentication
- Input validation on all endpoints
- Error logging for debugging
- Configurable access controls

### Production Recommendations
- Replace mock API key with secure authentication
- Implement proper user management
- Add rate limiting
- Enable HTTPS only
- Regular security audits

## 📊 Data Management

### Automatic Features
- Real-time data synchronization
- Attendance logging on check-out
- Timestamp tracking for all operations
- Photo storage with lot records

### Manual Operations
- Bulk status updates
- Report generation and export
- Data backup and archival
- User management

## 🛠️ Customization

### Easy Modifications
- Band name and branding
- Lot names and sections
- Student instruments and years
- User roles and permissions
- Color schemes and styling

### Advanced Customizations
- Additional data fields
- Custom reporting formats
- Integration with other systems
- Enhanced authentication
- Mobile app development

## 📈 Scalability

### Current Capacity
- Supports hundreds of students
- Dozens of parking lots
- Multiple concurrent users
- Historical data retention

### Scaling Options
- Google Sheets: Up to 10 million cells
- Apps Script: 6 minutes execution time per trigger
- Web App: Handles moderate concurrent load
- Frontend: Scales with hosting platform

## 🐛 Troubleshooting

### Common Issues
1. **API Configuration**: Verify Web App URL and API key
2. **Permissions**: Check Google Apps Script deployment settings
3. **Data Loading**: Confirm Spreadsheet ID and sheet names
4. **CORS Errors**: Google Apps Script handles CORS automatically

### Debug Tools
- Browser developer console
- Apps Script execution logs
- Network tab for API calls
- Toast notifications for user feedback

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Set up local development environment
3. Make changes and test thoroughly
4. Submit pull request with detailed description

### Areas for Contribution
- UI/UX improvements
- Additional features
- Performance optimizations
- Documentation updates
- Bug fixes and testing

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- City High Band for the inspiration and requirements
- Google for providing free, robust cloud services
- React and open-source community for excellent tools
- Contributors and testers who helped refine the platform

## 📞 Support

For technical support:
1. Check the [SETUP.md](./SETUP.md) guide
2. Review troubleshooting section above
3. Check existing GitHub issues
4. Create new issue with detailed description

---

**Built with ❤️ for City High Band's community service efforts**
