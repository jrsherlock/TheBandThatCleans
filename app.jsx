import React, { useState, useMemo, useEffect, useRef, createContext, useContext } from 'react';
import {
  CheckCircle, Clock, Users, MapPin, AlertTriangle, Download, Bell, X,
  Save, MessageSquare, Image, RefreshCw, Filter, PenLine, Play, Settings,
  Calendar, Music, Eye, Search, Send, Camera, Loader2, Sun, Moon
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import apiService, { ApiError } from './api-service.js';

// Import new consolidated components
import Dashboard from './src/components/Dashboard.jsx';
import ParkingLotsScreen from './src/components/ParkingLotsScreen.jsx';
import StudentsScreen from './src/components/StudentsScreen.jsx';
import QRCodeRouter from './src/components/QRCodeRouter.jsx';
import CheckOutToggle from './src/components/CheckOutToggle.jsx';
import { hasPermission } from './src/utils/permissions.js';
import { getDefaultTab } from './src/utils/roleHelpers.jsx';

const MotionDiv = motion.div;

// Theme Context
const ThemeContext = createContext();

// Custom hook for theme
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Provider Component
const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('tbtc-theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }

    // Fall back to system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return false;
  });

  useEffect(() => {
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('tbtc-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Dark Mode Toggle Component
const DarkModeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun className="text-yellow-500" size={20} />
      ) : (
        <Moon className="text-gray-700" size={20} />
      )}
    </button>
  );
};

// --- MOCK DATA SETUP ---
// NOTE: This is fallback data for development. Production data comes from Google Sheets.
const lotNames = [
  "Lot 33 North", "Lot 33 South", "Lot 43", "Lot 46", "Lot 55", "Lot 65",
  "Lot 70", "Lot 72", "Lot 73", "Lot 75", "Lot 80", "Lot 85",
  "Lot 90", "Lot 95", "Lot 100", "Lot 110", "Lot 120", "Lot 130",
  "Lot 140", "Lot 150", "Lot F", "Lot H"
];
const sections = ["north", "south", "east", "west"];
const priorities = ["high", "medium", "low"];
const statuses = ["not-started", "in-progress", "needs-help", "pending-approval", "complete"];
const studentInstruments = ["Flute", "Piccolo", "Clarinet", "Saxophone", "Trumpet", "Trombone", "Tuba", "Percussion", "Color Guard"];
const studentYears = ["freshman", "sophomore", "junior", "senior"];

// Initialize lots (fallback mock data)
const initialLots = lotNames.map((name, index) => {
  const lotId = `lot-${index + 1}`;
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const estimatedTime = Math.floor(Math.random() * 60) + 30; // 30-90 minutes
  let actualStartTime, completedTime;

  if (status === 'complete') {
    actualStartTime = new Date(Date.now() - estimatedTime * 60 * 1000 - Math.random() * 3600000); // Check-in time
    completedTime = new Date(actualStartTime.getTime() + estimatedTime * 60 * 1000);
  }

  return {
    id: lotId,
    name,
    status: status,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    assignedStudents: [],
    estimatedTime: estimatedTime,
    capacity: Math.floor(Math.random() * 100) + 50,
    section: sections[Math.floor(Math.random() * sections.length)],
    notes: Math.random() > 0.7 ? "Special attention needed for heavy debris" : undefined,
    totalStudentsSignedUp: Math.floor(Math.random() * 15) + 5,
    lastUpdated: new Date(Date.now() - Math.random() * 3600000),
    updatedBy: Math.random() > 0.5 ? "Director Smith" : "Director Johnson",
    actualStartTime,
    completedTime,
    comment: Math.random() > 0.8 ? "Very messy lot this game, sending extra team." : undefined,
    signUpSheetPhoto: undefined,
  };
});

// Mock Students
const studentNames = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "William", "Mia", "James", "Charlotte", "Benjamin", "Amelia", "Lucas", "Harper", "Henry", "Evelyn", "Alexander"];
const studentSurnames = ["Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez"];
const initialStudents = Array.from({ length: 120 }, (e, t) => {
  const firstName = studentNames[t % studentNames.length];
  const lastName = studentSurnames[t % studentSurnames.length];
  const checkedIn = Math.random() > 0.3;
  const assignedLot = checkedIn && Math.random() > 0.5 ? initialLots[Math.floor(Math.random() * initialLots.length)].id : undefined;

  return {
    id: `student-${t + 1}`,
    name: `${firstName} ${lastName}`,
    instrument: studentInstruments[Math.floor(Math.random() * studentInstruments.length)],
    section: ["Woodwinds", "Brass", "Percussion", "Color Guard", "Leadership"][Math.floor(Math.random() * 5)],
    checkedIn: checkedIn,
    checkInTime: checkedIn ? new Date(Date.now() - Math.random() * 3600000) : undefined,
    year: studentYears[Math.floor(Math.random() * studentYears.length)],
    assignedLot: assignedLot,
  };
});

// Update initialLots with assigned students
initialLots.forEach(lot => {
  lot.assignedStudents = initialStudents.filter(s => s.assignedLot === lot.id).map(s => s.id);
});


// Mock Users for Select Dropdown
const mockUsers = [
  { id: "user-1", name: "Director Smith", role: "admin", email: "director.smith@school.edu" },
  { id: "user-2", name: "Director Johnson", role: "admin", email: "director.johnson@school.edu" },
  { id: "user-3", name: "Parent Volunteer", role: "volunteer", email: "volunteer@parent.com" },
  { id: "student-1", name: "Emma Johnson", role: "student", email: "emma.j@student.edu" }
];

// --- UTILITY AND STYLES ---

const getStatusStyles = (status) => {
  switch (status) {
    case 'complete': return { label: "Complete", color: "bg-green-500", textColor: "text-white", icon: CheckCircle, pulse: false };
    case 'in-progress': return { label: "In Progress", color: "bg-blue-500", textColor: "text-white", icon: Play, pulse: true };
    case 'needs-help': return { label: "Needs Help", color: "bg-red-500", textColor: "text-white", icon: AlertTriangle, pulse: true };
    case 'pending-approval': return { label: "Pending Approval", color: "bg-yellow-500", textColor: "text-white", icon: Clock, pulse: false };
    case 'not-started': default: return { label: "Ready", color: "bg-gray-500", textColor: "text-white", icon: MapPin, pulse: false };
  }
};

const StatusBadge = ({ status, size = "md" }) => {
  const { label, color, textColor, icon: Icon, pulse } = getStatusStyles(status);
  const sizeClasses = { sm: "px-2 py-1 text-xs", md: "px-3 py-1.5 text-sm", lg: "px-4 py-2 text-base" };
  const iconSize = size === "sm" ? 12 : size === "md" ? 14 : 16;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${color} ${textColor} ${sizeClasses[size]}
        ${pulse ? "animate-pulse" : ""}
      `}
    >
      <Icon size={iconSize} />
      {label}
    </span>
  );
};

// OLD COMPONENT REMOVED - Replaced by ParkingLotsScreen/LotCard in src/components/ParkingLotsScreen.jsx
// See git history or CONSOLIDATION-IMPLEMENTATION-SUMMARY.md for reference

// OLD COMPONENT REMOVED - Replaced by StudentsScreen in src/components/StudentsScreen.jsx
// See git history or CONSOLIDATION-IMPLEMENTATION-SUMMARY.md for reference

// --- MAIN APP COMPONENT ---

const App = () => {
  // State management
  const [lots, setLots] = useState([]);
  const [students, setStudents] = useState([]);
  const [currentUser, setCurrentUser] = useState(mockUsers[0]);
  const [activeTab, setActiveTab] = useState(getDefaultTab(mockUsers[0]));

  // Event configuration state
  const [checkOutEnabled, setCheckOutEnabled] = useState(false);
  const [eventConfig, setEventConfig] = useState(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState(null);

  // API operation states
  const [operationLoading, setOperationLoading] = useState(false);

  // QR Code routing state
  const [isQRCodeRoute, setIsQRCodeRoute] = useState(false);

  // Check for QR code route on mount
  useEffect(() => {
    const checkQRRoute = () => {
      const hash = window.location.hash;
      setIsQRCodeRoute(hash.startsWith('#checkin') || hash.startsWith('#checkout'));
    };

    checkQRRoute();
    window.addEventListener('hashchange', checkQRRoute);

    return () => {
      window.removeEventListener('hashchange', checkQRRoute);
    };
  }, []);

  // Load initial data from API
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load main data
        const data = await apiService.fetchInitialData();

        if (data.lots) {
          // Initialize assignedStudents property for each lot
          const lotsWithAssignedStudents = data.lots.map(lot => ({
            ...lot,
            assignedStudents: lot.assignedStudents || []
          }));
          setLots(lotsWithAssignedStudents);
        }

        if (data.students) {
          setStudents(data.students);
        }

        // After both lots and students are loaded, populate assignedStudents arrays
        if (data.lots && data.students) {
          setLots(prevLots =>
            prevLots.map(lot => ({
              ...lot,
              assignedStudents: data.students
                .filter(student => student.assignedLot === lot.id)
                .map(student => student.id)
            }))
          );
        }

        // Load event configuration
        try {
          const config = await apiService.getEventConfig();
          setEventConfig(config);
          setCheckOutEnabled(config.checkOutEnabled || false);
        } catch (configError) {
          console.error('Failed to load event config:', configError);
          // Continue with default config
          setCheckOutEnabled(false);
        }

        toast.success('Data loaded successfully!');

      } catch (error) {
        console.error('Failed to load initial data:', error);
        setError(error.message || 'Failed to load data');

        // Fallback to mock data for development
        if (error.message?.includes('BASE_URL')) {
          toast.error('API not configured. Using mock data for development.');
          setLots(initialLots);
          setStudents(initialStudents);
        } else {
          toast.error('Failed to load data. Please check your connection.');
        }
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    };

    loadInitialData();
  }, []);

  const stats = useMemo(() => {
    // Return default stats if lots array is empty or undefined
    if (!lots || lots.length === 0) {
      return {
        totalLots: 0,
        completedLots: 0,
        inProgressLots: 0,
        notStartedLots: 0,
        totalStudents: 0,
        checkedInStudents: 0,
        averageCompletionTime: 0
      };
    }
    const totalLots = lots.length;
    const completedLots = lots.filter(l => l.status === 'complete').length;
    const studentsPresent = students.filter(s => s.checkedIn).length;
    const totalStudents = students.length;
    const totalStudentsSignedUp = lots.reduce((acc, l) => acc + l.totalStudentsSignedUp, 0);

    const completedDurations = lots
      .filter(l => l.status === 'complete' && l.actualStartTime && l.completedTime)
      .map(l => (l.completedTime.getTime() - l.actualStartTime.getTime()) / (60 * 1000)); // duration in minutes

    const averageCompletionTime = completedDurations.length > 0
      ? completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length
      : 45; // Default average time

    const remainingLots = lots.filter(l => l.status !== 'complete').length;
    const estimatedCompletionTime = new Date(Date.now() + remainingLots * averageCompletionTime * 60 * 1000);

    return {
      totalLots,
      completedLots,
      studentsPresent,
      totalStudents,
      averageCompletionTime: averageCompletionTime,
      estimatedCompletion: estimatedCompletionTime,
      totalStudentsSignedUp,
    };
  }, [lots, students]);

  // Handler for single lot status update
  const handleLotStatusUpdate = async (lotId, status) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    try {
      setOperationLoading(true);

      // Optimistic update
      setLots(prevLots =>
        prevLots.map(l => {
          if (l.id === lotId) {
            const updatedLot = { ...l, status, lastUpdated: new Date(), updatedBy: currentUser.name };

            if (status === 'in-progress' && !l.actualStartTime) {
              updatedLot.actualStartTime = new Date();
            } else if (status === 'complete') {
              if (!l.actualStartTime) {
                updatedLot.actualStartTime = new Date(Date.now() - (l.estimatedTime || 45) * 60 * 1000);
              }
              updatedLot.completedTime = new Date();
            }
            return updatedLot;
          }
          return l;
        })
      );

      // API call
      await apiService.updateLotStatus(lotId, status, currentUser.name);

      toast.success(`${lot.name} updated to ${getStatusStyles(status).label}`);

    } catch (error) {
      console.error('Failed to update lot status:', error);

      // Revert optimistic update on error
      setLots(prevLots =>
        prevLots.map(l => l.id === lotId ? lot : l)
      );

      toast.error(error.message || 'Failed to update lot status');
    } finally {
      setOperationLoading(false);
    }
  };

  // Handler for lot details update (Comment/Count)
  const handleLotDetailsUpdate = async (lotId, details) => {
    const originalLot = lots.find(l => l.id === lotId);
    if (!originalLot) return;

    try {
      setOperationLoading(true);

      // Optimistic update
      setLots(prevLots =>
        prevLots.map(lot =>
          lot.id === lotId ? { ...lot, ...details, lastUpdated: new Date(), updatedBy: currentUser.name } : lot
        )
      );

      // API call
      await apiService.updateLotDetails(lotId, details, currentUser.name);

      toast.success(`${originalLot.name} details updated`);

    } catch (error) {
      console.error('Failed to update lot details:', error);

      // Revert optimistic update on error
      setLots(prevLots =>
        prevLots.map(lot => lot.id === lotId ? originalLot : lot)
      );

      toast.error(error.message || 'Failed to update lot details');
    } finally {
      setOperationLoading(false);
    }
  };

  // Handler for bulk lot status update (used in Command Center)
  const handleBulkStatusUpdate = async (lotIds, status) => {
    if (!lotIds || lotIds.length === 0) return;

    const originalLots = lots.filter(l => lotIds.includes(l.id));

    try {
      setOperationLoading(true);

      // Optimistic update
      setLots(prevLots =>
        prevLots.map(lot => {
          if (lotIds.includes(lot.id)) {
            const updatedLot = { ...lot, status, lastUpdated: new Date(), updatedBy: currentUser.name };

            if (status === 'in-progress' && !lot.actualStartTime) {
              updatedLot.actualStartTime = new Date();
            } else if (status === 'complete') {
              if (!lot.actualStartTime) {
                updatedLot.actualStartTime = new Date(Date.now() - (lot.estimatedTime || 45) * 60 * 1000);
              }
              updatedLot.completedTime = new Date();
            }
            return updatedLot;
          }
          return lot;
        })
      );

      // API call
      await apiService.updateBulkLotStatus(lotIds, status, currentUser.name);

      toast.success(`Updated ${lotIds.length} lots to ${getStatusStyles(status).label}`);

    } catch (error) {
      console.error('Failed to update bulk lot status:', error);

      // Revert optimistic update on error
      setLots(prevLots =>
        prevLots.map(lot => {
          const originalLot = originalLots.find(ol => ol.id === lot.id);
          return originalLot || lot;
        })
      );

      toast.error(error.message || 'Failed to update lots');
    } finally {
      setOperationLoading(false);
    }
  };

  // Handler for student updates (used in Roster)
  const handleStudentUpdate = async (studentId, updates) => {
    const originalStudent = students.find(s => s.id === studentId);
    if (!originalStudent) return;

    try {
      setOperationLoading(true);

      // Optimistic update
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.id === studentId ? { ...student, ...updates } : student
        )
      );

      // Update lot assignment roster when a student checks in/out
      if (updates.checkedIn !== undefined) {
        if (!updates.checkedIn) {
          // If student checks out, remove them from the assigned lot roster
          if (originalStudent.assignedLot) {
            setLots(prevLots =>
              prevLots.map(lot =>
                lot.id === originalStudent.assignedLot
                  ? { ...lot, assignedStudents: (lot.assignedStudents || []).filter(id => id !== studentId) }
                  : lot
              )
            );
          }
        }
      }

      // API call
      await apiService.updateStudentStatus(studentId, updates);

      const action = updates.checkedIn ? 'checked in' : 'checked out';
      toast.success(`${originalStudent.name} ${action} successfully`);

    } catch (error) {
      console.error('Failed to update student status:', error);

      // Revert optimistic update on error
      setStudents(prevStudents =>
        prevStudents.map(student => student.id === studentId ? originalStudent : student)
      );

      toast.error(error.message || 'Failed to update student status');
    } finally {
      setOperationLoading(false);
    }
  };

  // Handler for check-out toggle
  const handleCheckOutToggle = async (enabled) => {
    try {
      setOperationLoading(true);

      // Optimistic update
      setCheckOutEnabled(enabled);

      // API call
      await apiService.updateEventConfig(enabled, eventConfig?.eventId, eventConfig?.eventName);

      // Update event config
      setEventConfig(prev => ({
        ...prev,
        checkOutEnabled: enabled,
        lastUpdated: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Failed to update check-out toggle:', error);

      // Revert optimistic update
      setCheckOutEnabled(!enabled);

      toast.error(error.message || 'Failed to update check-out settings');
    } finally {
      setOperationLoading(false);
    }
  };

  // Handler for QR code check-in completion
  const handleCheckInComplete = (studentId, lotId) => {
    // Reload data to reflect changes
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === studentId
          ? { ...student, checkedIn: true, checkInTime: new Date(), assignedLot: lotId }
          : student
      )
    );

    setLots(prevLots =>
      prevLots.map(lot =>
        lot.id === lotId
          ? { ...lot, assignedStudents: [...(lot.assignedStudents || []), studentId] }
          : lot
      )
    );
  };

  // Handler for QR code check-out completion
  const handleCheckOutComplete = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // Reload data to reflect changes
    setStudents(prevStudents =>
      prevStudents.map(s =>
        s.id === studentId
          ? { ...s, checkedIn: false, assignedLot: null }
          : s
      )
    );

    if (student.assignedLot) {
      setLots(prevLots =>
        prevLots.map(lot =>
          lot.id === student.assignedLot
            ? { ...lot, assignedStudents: (lot.assignedStudents || []).filter(id => id !== studentId) }
            : lot
        )
      );
    }
  };


  // Handler for notification/messaging (mock)
  const handleSendNotification = (message, recipients) => {
    console.log("Sending notification:", { message, recipients });
    toast.success(`Notification sent to ${recipients.length} students!`);
  };

  // Handler for report export
  const handleExportReport = async () => {
    try {
      setOperationLoading(true);

      const reportResponse = await apiService.fetchReport();

      if (reportResponse.reportData) {
        // Create and download CSV file
        const blob = new Blob([reportResponse.reportData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tbtc-cleanup-report-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Report exported successfully!");
      } else {
        throw new Error('No report data received');
      }

    } catch (error) {
      console.error('Failed to export report:', error);

      // Fallback to local data export
      const fallbackData = {
        timestamp: new Date().toISOString(),
        stats: stats,
        lots: lots,
        students: students.map(s => ({ ...s, checkInTime: s.checkInTime ? s.checkInTime.toISOString() : undefined })),
      };

      const blob = new Blob([JSON.stringify(fallbackData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tbtc-cleanup-report-fallback-${format(new Date(), 'yyyyMMdd-HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.error('Failed to fetch server report. Downloaded local data instead.');
    } finally {
      setOperationLoading(false);
    }
  };

  // Navigation Setup - Consolidated to 3 tabs for all users
  const navItems = () => {
    const allItems = [
      { id: "dashboard", label: "Dashboard", icon: Calendar, requiredPermission: "canViewDashboard" },
      { id: "lots", label: "Parking Lots", icon: MapPin, requiredPermission: "canViewParkingLots" },
      { id: "students", label: "Students", icon: Users, requiredPermission: "canViewStudents" },
    ];

    // Filter items based on permissions
    return allItems.filter(item => {
      if (!item.requiredPermission) return true;
      return hasPermission(currentUser, item.requiredPermission);
    });
  };

  // Tab Components - Using new consolidated components
  const tabComponents = {
    dashboard: (
      <Dashboard
        lots={lots}
        students={students}
        stats={stats}
        currentUser={currentUser}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        onSendNotification={handleSendNotification}
        onExportReport={handleExportReport}
        getStatusStyles={getStatusStyles}
        statuses={statuses}
        sections={sections}
        useTheme={useTheme}
        StatusBadge={StatusBadge}
      />
    ),
    lots: (
      <ParkingLotsScreen
        lots={lots}
        students={students}
        currentUser={currentUser}
        onLotStatusUpdate={handleLotStatusUpdate}
        onLotDetailsUpdate={handleLotDetailsUpdate}
        getStatusStyles={getStatusStyles}
        statuses={statuses}
        sections={sections}
        StatusBadge={StatusBadge}
      />
    ),
    students: (
      <>
        {/* Check-Out Toggle Control */}
        <div className="mb-6">
          <CheckOutToggle
            currentUser={currentUser}
            checkOutEnabled={checkOutEnabled}
            onToggle={handleCheckOutToggle}
            eventName={eventConfig?.eventName}
          />
        </div>

        {/* Students Screen */}
        <StudentsScreen
          students={students}
          currentUser={currentUser}
          onStudentUpdate={handleStudentUpdate}
        />
      </>
    ),
  };

  // Loading component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading TBTC platform...</p>
      </div>
    </div>
  );

  // Error component
  const ErrorDisplay = ({ error, onRetry }) => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center max-w-md mx-auto p-6">
        <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to Load</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  // Show loading state during initial load
  if (isInitialLoad && isLoading) {
    return <LoadingSpinner />;
  }

  // Show error state if initial load failed and no fallback data
  if (error && lots.length === 0 && students.length === 0) {
    return <ErrorDisplay error={error} onRetry={() => window.location.reload()} />;
  }

  // If QR code route is active, show QR code router instead of main app
  if (isQRCodeRoute) {
    return (
      <>
        <Toaster position="top-right" />
        <QRCodeRouter
          students={students}
          lots={lots}
          checkOutEnabled={checkOutEnabled}
          onCheckInComplete={handleCheckInComplete}
          onCheckOutComplete={handleCheckOutComplete}
          onNavigateHome={() => setIsQRCodeRoute(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-inter transition-colors duration-200">
      <Toaster position="top-right" />

      {/* Operation loading overlay */}
      {operationLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 dark:bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <span className="text-gray-700 dark:text-gray-200">Processing...</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <Music className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">The Band That Cleans</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {currentUser.role === 'admin' ? "Director Dashboard" : currentUser.role === 'volunteer' ? "Volunteer View" : "Student View"} • Parking Lot Cleanup Event
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
              <div className="text-right hidden md:block">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completedLots}/{stats.totalLots}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Lots Complete</div>
              </div>
              <div className="text-right hidden md:block">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.studentsPresent}/{stats.totalStudentsSignedUp}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Students Present</div>
              </div>
              <DarkModeToggle />
              <div className="border-l border-gray-300 dark:border-gray-600 pl-3 md:pl-6">
                <select
                  value={currentUser.id}
                  onChange={e => setCurrentUser(mockUsers.find(u => u.id === e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  {mockUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {navItems().map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    flex items-center gap-2 px-3 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                    ${activeTab === item.id
                      ? "border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"}
                  `}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MotionDiv
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {tabComponents[activeTab]}
        </MotionDiv>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <p>Last updated: {new Date().toLocaleTimeString()} • Logged in as: {currentUser.name}</p>
            <p>Go Hawks! ({stats.estimatedCompletion.toLocaleTimeString()})</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- OLD SUB-COMPONENTS REMOVED ---
// The following components have been replaced by new consolidated components:
// - Overview → Dashboard/AdminDashboard (src/components/Dashboard.jsx)
// - CommandCenter → Dashboard/AdminDashboard (src/components/Dashboard.jsx)
// - DirectorDashboard → ParkingLotsScreen + LotEditModal (src/components/)
// - VolunteerView → Dashboard/VolunteerDashboard (src/components/Dashboard.jsx)
// See git history or CONSOLIDATION-IMPLEMENTATION-SUMMARY.md for reference

// Wrap App with ThemeProvider
const AppWithTheme = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

export default AppWithTheme;
