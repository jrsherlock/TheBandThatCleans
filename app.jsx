import React, { useState, useMemo, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import {
  CheckCircle, Clock, Users, MapPin, AlertTriangle, Download, Bell, X,
  Save, MessageSquare, Image, RefreshCw, Filter, PenLine, Play, Settings,
  Calendar, Eye, Search, Send, Camera, Loader2, Sun, Moon
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import apiService, { ApiError } from './api-service.js';

// Import TBTC Logo
import TBTCLogo from './src/public/TBTC.png';

// Import new consolidated components
import Dashboard from './src/components/Dashboard.jsx';
import ParkingLotsScreen from './src/components/ParkingLotsScreen.jsx';
import StudentsScreen from './src/components/StudentsScreen.jsx';
import QRCodeRouter from './src/components/QRCodeRouter.jsx';
import CheckOutToggle from './src/components/CheckOutToggle.jsx';
import RefreshButton from './src/components/RefreshButton.jsx';
import SyncStatusIndicator from './src/components/SyncStatusIndicator.jsx';
import { hasPermission } from './src/utils/permissions.js';
import { getDefaultTab } from './src/utils/roleHelpers.jsx';
import { usePolling } from './src/hooks/usePolling.js';

// --- POLLING CONFIGURATION ---
const POLLING_INTERVAL_MS = 30000; // 30 seconds
const POLLING_TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 5000; // 5 seconds initial backoff

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
// NOTE: sections array is now dynamically generated from Google Sheet zone data (see useMemo hook in App component)
// Fallback sections for mock data only (real data comes from Google Sheet)
const mockSections = ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"];
const priorities = ["high", "medium", "low"];
const statuses = ["not-started", "in-progress", "needs-help", "pending-approval", "complete"];
const studentInstruments = ["Flute", "Piccolo", "Clarinet", "Saxophone", "Trumpet", "Trombone", "Tuba", "Percussion", "Color Guard"];
const studentYears = ["freshman", "sophomore", "junior", "senior"];

// Initialize lots (fallback mock data)
const initialLots = lotNames.map((name, index) => {
  const lotId = `lot-${index + 1}`;
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  let actualStartTime, completedTime;

  if (status === 'complete') {
    const duration = Math.floor(Math.random() * 60) + 30; // 30-90 minutes
    actualStartTime = new Date(Date.now() - duration * 60 * 1000 - Math.random() * 3600000); // Check-in time
    completedTime = new Date(actualStartTime.getTime() + duration * 60 * 1000);
  }

  return {
    id: lotId,
    name,
    status: status,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    assignedStudents: [],
    capacity: Math.floor(Math.random() * 100) + 50,
    zone: mockSections[Math.floor(Math.random() * mockSections.length)], // Zone field from Google Sheet
    notes: Math.random() > 0.7 ? "Special attention needed for heavy debris" : undefined,
    totalStudentsSignedUp: Math.floor(Math.random() * 15) + 5,
    lastUpdated: new Date(Date.now() - Math.random() * 3600000),
    updatedBy: Math.random() > 0.5 ? "Aaron Ottmar - Director" : "Mike Kowbel - Director",
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
  { id: "user-1", name: "Aaron Ottmar - Director", role: "admin", email: "aaron.ottmar@school.edu" },
  { id: "user-2", name: "Mike Kowbel - Director", role: "admin", email: "mike.kowbel@school.edu" },
  { id: "user-3", name: "Parent Volunteer", role: "volunteer", email: "volunteer@parent.com" },
  { id: "student-1", name: "Jameson Sherlock - Student", role: "student", email: "jameson.sherlock@student.edu" }
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

        console.log('🔍 API Data Debug: Received data from API', {
          lotsCount: data.lots?.length || 0,
          studentsCount: data.students?.length || 0,
          firstLot: data.lots?.[0],
          sampleLotFields: data.lots?.[0] ? Object.keys(data.lots[0]) : []
        });

        if (data.lots) {
          // Initialize assignedStudents property for each lot
          const lotsWithAssignedStudents = data.lots.map(lot => ({
            ...lot,
            assignedStudents: lot.assignedStudents || []
          }));

          console.log('🔍 API Data Debug: Setting lots state', {
            count: lotsWithAssignedStudents.length,
            firstLotWithZone: lotsWithAssignedStudents[0]
          });

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

  // --- REAL-TIME POLLING INTEGRATION ---

  // Ref to track previous data for comparison
  const previousDataRef = useRef({ lots: [], students: [] });

  // Polling fetch function
  const fetchPollingData = useCallback(async () => {
    return await apiService.fetchInitialData();
  }, []);

  // Determine if data has changed (to prevent unnecessary re-renders)
  const shouldUpdateData = useCallback((newData) => {
    if (!newData || !newData.lots || !newData.students) {
      console.log('[Polling] shouldUpdateData: Invalid data received');
      return false;
    }

    const prevLots = previousDataRef.current.lots;
    const prevStudents = previousDataRef.current.students;

    // If this is the first poll (no previous data), always update
    if (prevLots.length === 0 && prevStudents.length === 0) {
      console.log('[Polling] shouldUpdateData: First poll, updating state');
      return true;
    }

    // Compare array lengths first (quick check)
    if (newData.lots.length !== prevLots.length ||
        newData.students.length !== prevStudents.length) {
      console.log('[Polling] shouldUpdateData: Array length changed', {
        lotsChanged: newData.lots.length !== prevLots.length,
        studentsChanged: newData.students.length !== prevStudents.length
      });
      return true;
    }

    // Compare lot IDs and lastUpdated timestamps
    const lotsChanged = newData.lots.some((lot, index) => {
      const prevLot = prevLots[index];
      if (!prevLot) return true;

      return lot.id !== prevLot.id ||
             lot.status !== prevLot.status ||
             lot.lastUpdated !== prevLot.lastUpdated ||
             lot.totalStudentsSignedUp !== prevLot.totalStudentsSignedUp;
    });

    // Compare student IDs and check-in status
    const studentsChanged = newData.students.some((student, index) => {
      const prevStudent = prevStudents[index];
      if (!prevStudent) return true;

      return student.id !== prevStudent.id ||
             student.checkedIn !== prevStudent.checkedIn ||
             student.assignedLot !== prevStudent.assignedLot;
    });

    const hasChanges = lotsChanged || studentsChanged;
    console.log('[Polling] shouldUpdateData: Changes detected?', hasChanges);

    return hasChanges;
  }, []);

  // Handle successful polling update
  const handlePollingSuccess = useCallback((data, isManual) => {
    console.log('[Polling] handlePollingSuccess called', {
      isManual,
      lotsCount: data?.lots?.length,
      studentsCount: data?.students?.length
    });

    if (!data || !data.lots || !data.students) {
      console.log('[Polling] handlePollingSuccess: Invalid data, skipping update');
      return;
    }

    // Process lots data
    const lotsWithAssignedStudents = data.lots.map(lot => ({
      ...lot,
      assignedStudents: data.students
        .filter(student => student.assignedLot === lot.id)
        .map(student => student.id)
    }));

    console.log('[Polling] Updating state with new data');

    // Update state
    setLots(lotsWithAssignedStudents);
    setStudents(data.students);

    // Store for next comparison
    previousDataRef.current = {
      lots: lotsWithAssignedStudents,
      students: data.students
    };

    // Show notification for manual refresh or if changes detected
    if (isManual) {
      console.log('[Polling] Manual refresh - showing success toast');
      toast.success('Data refreshed successfully!', {
        duration: 2000,
        position: 'bottom-right'
      });
    } else {
      // For automatic polling, only show toast if there were actual changes
      // Note: We already updated state, this is just for notification
      console.log('[Polling] Automatic poll - checking if notification needed');
    }
  }, []);

  // Handle polling errors
  const handlePollingError = useCallback((error, isManual) => {
    console.error('[Polling] Error:', error);

    // Only show error toast for manual refresh
    if (isManual) {
      toast.error('Failed to refresh. Please try again.', {
        duration: 4000,
        position: 'bottom-right'
      });
    }
  }, []);

  // Initialize polling hook
  const {
    lastUpdated,
    isRefreshing,
    pollingStatus,
    pollingError,
    refresh: manualRefresh
  } = usePolling(fetchPollingData, {
    interval: POLLING_INTERVAL_MS,
    timeout: POLLING_TIMEOUT_MS,
    maxRetries: MAX_RETRY_ATTEMPTS,
    retryBackoff: RETRY_BACKOFF_MS,
    enabled: !isInitialLoad && !isQRCodeRoute, // Don't poll during initial load or on QR routes
    onSuccess: handlePollingSuccess,
    onError: handlePollingError,
    shouldUpdate: shouldUpdateData
  });

  // Dynamic sections array from Google Sheet zone data
  const sections = useMemo(() => {
    if (!lots || lots.length === 0) {
      console.log('🔍 Sections Debug: No lots data available');
      return [];
    }

    console.log('🔍 Sections Debug: Processing lots data', {
      totalLots: lots.length,
      firstLot: lots[0],
      sampleZones: lots.slice(0, 5).map(l => ({ id: l.id, zone: l.zone }))
    });

    // Extract unique zone values from lots data
    const uniqueZones = [...new Set(lots.map(lot => lot.zone).filter(Boolean))];

    console.log('🔍 Sections Debug: Extracted unique zones', uniqueZones);

    // Sort zones naturally (Zone 1, Zone 2, etc.)
    const sorted = uniqueZones.sort((a, b) => {
      // Extract numbers from zone names for natural sorting
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });

    console.log('🔍 Sections Debug: Final sorted sections', sorted);
    return sorted;
  }, [lots]);

  const stats = useMemo(() => {
    // Return default stats if lots array is empty or undefined
    if (!lots || lots.length === 0) {
      return {
        totalLots: 0,
        completedLots: 0,
        inProgressLots: 0,
        notStartedLots: 0,
        totalStudents: 246, // Total roster size (hardcoded for now)
        checkedInStudents: 0
      };
    }
    const totalLots = lots.length;
    const completedLots = lots.filter(l => l.status === 'complete').length;

    // Sum of all students - prioritize AI counts when available
    // Use aiStudentCount if available, otherwise fall back to totalStudentsSignedUp
    const totalStudentsSignedUp = lots.reduce((acc, l) => {
      const count = l.aiStudentCount !== undefined && l.aiStudentCount !== null && l.aiStudentCount !== ''
        ? parseInt(l.aiStudentCount) || 0
        : (l.totalStudentsSignedUp || 0);
      return acc + count;
    }, 0);

    // Total roster size (hardcoded to 246 for now)
    const totalRosterSize = 246;

    return {
      totalLots,
      completedLots,
      studentsPresent: totalStudentsSignedUp, // Show sum of lot sign-ups (AI-verified when available)
      totalStudents: totalRosterSize, // Total roster size
      totalStudentsSignedUp,
    };
  }, [lots]);

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
                updatedLot.actualStartTime = new Date(Date.now() - 45 * 60 * 1000); // Default 45 minutes
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

  // Handler for AI-assisted sign-in sheet upload
  const handleSignInSheetUpload = async (submissionData) => {
    const { lotId, count, countSource, confidence, notes, enteredBy, imageFile, aiAnalysis } = submissionData;

    const originalLot = lots.find(l => l.id === lotId);
    if (!originalLot) {
      throw new Error('Lot not found');
    }

    try {
      setOperationLoading(true);

      // Convert image to base64 if provided
      let imageData = null;
      if (imageFile) {
        const reader = new FileReader();
        imageData = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      }

      // Prepare payload for backend
      const payload = {
        lotId,
        countSource,
        enteredBy: enteredBy || currentUser.name,
        notes: notes || '',
        imageData
      };

      // Add AI count or manual count based on source
      if (countSource === 'ai' && aiAnalysis) {
        payload.aiCount = count;
        payload.aiConfidence = confidence || aiAnalysis.confidence;
        // If user manually overrode the AI count, include both
        if (aiAnalysis.count !== count) {
          payload.manualCount = count;
        }
      } else {
        payload.manualCount = count;
      }

      // Optimistic update - update the lot with new student count
      setLots(prevLots =>
        prevLots.map(lot =>
          lot.id === lotId
            ? {
                ...lot,
                aiStudentCount: count,
                aiConfidence: confidence || 'manual',
                countSource,
                countEnteredBy: enteredBy || currentUser.name,
                lastUpdated: new Date(),
                updatedBy: enteredBy || currentUser.name
              }
            : lot
        )
      );

      // API call
      const response = await apiService.uploadSignInSheet(payload);

      toast.success(`✅ ${originalLot.name}: ${count} students recorded`, {
        duration: 4000,
        icon: countSource === 'ai' ? '🤖' : '✍️'
      });

      // Trigger a manual refresh to get the latest data from backend
      setTimeout(() => {
        manualRefresh();
      }, 500);

      return response;

    } catch (error) {
      console.error('Failed to upload sign-in sheet:', error);

      // Revert optimistic update on error
      setLots(prevLots =>
        prevLots.map(lot => lot.id === lotId ? originalLot : lot)
      );

      throw error; // Re-throw to let modal handle the error
    } finally {
      setOperationLoading(false);
    }
  };

  // Handler for bulk lot status update (used in Command Center)
  const handleBulkStatusUpdate = async (lotIds, status) => {
    if (!lotIds || lotIds.length === 0) return;

    // DEBUG: Log what we're sending
    console.log('🔍 handleBulkStatusUpdate called with:');
    console.log('  lotIds:', lotIds);
    console.log('  lotIds types:', lotIds.map(id => typeof id));
    console.log('  status:', status);
    console.log('  All lot IDs in state:', lots.map(l => ({ id: l.id, type: typeof l.id, name: l.name })));

    const originalLots = lots.filter(l => lotIds.includes(l.id));
    console.log('  Matched lots:', originalLots.map(l => l.name));

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
                updatedLot.actualStartTime = new Date(Date.now() - 45 * 60 * 1000); // Default 45 minutes
              }
              updatedLot.completedTime = new Date();
            }
            return updatedLot;
          }
          return lot;
        })
      );

      // API call
      console.log('  Calling API with lotIds:', lotIds);
      const response = await apiService.updateBulkLotStatus(lotIds, status, currentUser.name);
      console.log('  API response:', response);

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
        onSignInSheetUpload={handleSignInSheetUpload}
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
        {/* TBTC Logo */}
        <img
          src={TBTCLogo}
          alt="The Band That Cleans Logo"
          className="h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48 object-contain mx-auto mb-6 animate-pulse"
        />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading TBTC platform...</p>
      </div>
    </div>
  );

  // Error component
  const ErrorDisplay = ({ error, onRetry }) => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center max-w-md mx-auto p-6">
        {/* TBTC Logo */}
        <img
          src={TBTCLogo}
          alt="The Band That Cleans Logo"
          className="h-28 w-28 sm:h-32 sm:w-32 md:h-40 md:w-40 object-contain mx-auto mb-4"
        />
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

      {/* Header Bar - Redesigned for Mobile-First Responsive Layout */}
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile: Two-row layout | Desktop: Single-row layout */}
          <div className="py-4 md:py-6">

            {/* Row 1: Branding (Logo + Title) */}
            <div className="flex items-center justify-between gap-3 mb-3 md:mb-0">
              {/* Left: Logo + Title */}
              <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                {/* TBTC Logo */}
                <div className="flex-shrink-0">
                  <img
                    src={TBTCLogo}
                    alt="The Band That Cleans Logo"
                    className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 object-contain rounded-lg"
                  />
                </div>
                {/* Title and Subtitle */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                    The Band That Cleans
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 truncate">
                    {currentUser.role === 'admin' ? "Director Dashboard" : currentUser.role === 'volunteer' ? "Volunteer View" : "Student View"} • Parking Lot Cleanup
                  </p>
                </div>
              </div>

              {/* Right: Stats (Desktop Only) */}
              <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
                {/* Lots Complete Stat */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.completedLots}/{stats.totalLots}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Lots Complete</div>
                </div>
                {/* Students Present Stat */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.studentsPresent}/{stats.totalStudents}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Students Present ({stats.totalStudents > 0 ? Math.round((stats.studentsPresent / stats.totalStudents) * 100) : 0}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Controls (Mobile: Full width | Desktop: Right-aligned) */}
            <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 md:gap-4">
              {/* Stats (Tablet Only - Compact Version) */}
              <div className="hidden md:flex lg:hidden items-center gap-3 text-sm">
                <div className="text-center">
                  <div className="font-bold text-blue-600 dark:text-blue-400">
                    {stats.completedLots}/{stats.totalLots}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Lots</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600 dark:text-green-400">
                    {stats.studentsPresent}/{stats.totalStudents}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Students</div>
                </div>
              </div>

              {/* Control Buttons Group */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Refresh Button */}
                <RefreshButton
                  onRefresh={manualRefresh}
                  isRefreshing={isRefreshing}
                  lastUpdated={lastUpdated}
                  disabled={isLoading}
                />

                {/* Dark Mode Toggle */}
                <DarkModeToggle />

                {/* Divider */}
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>

                {/* User Dropdown */}
                <div className="flex-shrink-0">
                  <select
                    value={currentUser.id}
                    onChange={e => setCurrentUser(mockUsers.find(u => u.id === e.target.value))}
                    className="px-2 py-2 sm:px-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent min-h-[44px] cursor-pointer"
                    aria-label="Select user role"
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <p>Logged in as: {currentUser.name}</p>
              {!isQRCodeRoute && (
                <>
                  <span className="hidden sm:inline text-gray-400 dark:text-gray-600">•</span>
                  <SyncStatusIndicator
                    pollingStatus={pollingStatus}
                    lastUpdated={lastUpdated}
                    pollingInterval={POLLING_INTERVAL_MS}
                    pollingError={pollingError}
                    onRetry={manualRefresh}
                  />
                </>
              )}
            </div>
            <p>Go Hawks!</p>
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
