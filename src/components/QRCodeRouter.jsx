/**
 * QR Code Router Component
 * Handles URL hash parameter parsing and routing to check-in/check-out flows
 * 
 * URL Formats:
 * - Check-in: https://sites.google.com/view/tbtc-cleanup#checkin/lot-11
 * - Check-out: https://sites.google.com/view/tbtc-cleanup#checkout
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import StudentCheckIn from './StudentCheckIn.jsx';
import StudentCheckOut from './StudentCheckOut.jsx';

const QRCodeRouter = ({ students, lots, checkOutEnabled, onCheckInComplete, onCheckOutComplete, onNavigateHome }) => {
  const [route, setRoute] = useState(null);
  const [lotId, setLotId] = useState(null);
  const [error, setError] = useState(null);

  // Parse URL hash on mount and when hash changes
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash;
      
      if (!hash || hash === '#') {
        setRoute(null);
        setLotId(null);
        setError(null);
        return;
      }

      // Remove leading '#' and split by '/'
      const parts = hash.substring(1).split('/');
      const action = parts[0];

      if (action === 'checkin') {
        // Check-in flow
        const extractedLotId = parts[1];
        
        if (!extractedLotId) {
          setError('Invalid check-in URL: Missing lot ID');
          setRoute('error');
          return;
        }

        // Validate lot exists
        const lot = lots.find(l => l.id === extractedLotId);
        if (!lot) {
          setError(`Lot "${extractedLotId}" not found. Please scan a valid QR code.`);
          setRoute('error');
          return;
        }

        setRoute('checkin');
        setLotId(extractedLotId);
        setError(null);

      } else if (action === 'checkout') {
        // Check-out flow (master QR code)
        setRoute('checkout');
        setLotId(null);
        setError(null);

      } else {
        setError(`Unknown action: "${action}". Valid actions are "checkin" or "checkout".`);
        setRoute('error');
      }
    };

    // Parse on mount
    parseHash();

    // Listen for hash changes
    window.addEventListener('hashchange', parseHash);

    return () => {
      window.removeEventListener('hashchange', parseHash);
    };
  }, [lots]);

  // Handle check-in completion
  const handleCheckInComplete = (studentId, assignedLotId) => {
    if (onCheckInComplete) {
      onCheckInComplete(studentId, assignedLotId);
    }
    // Optionally navigate back to home or show success screen
  };

  // Handle check-out completion
  const handleCheckOutComplete = (studentId) => {
    if (onCheckOutComplete) {
      onCheckOutComplete(studentId);
    }
    // Optionally navigate back to home or show success screen
  };

  // Handle navigation to home
  const handleGoHome = () => {
    window.location.hash = '';
    if (onNavigateHome) {
      onNavigateHome();
    }
  };

  // Error state
  if (route === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto text-red-600 dark:text-red-400 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Invalid QR Code
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={handleGoHome}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
                       hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Home size={20} />
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check-in route
  if (route === 'checkin' && lotId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
        <StudentCheckIn
          lotId={lotId}
          students={students}
          lots={lots}
          onCheckInComplete={handleCheckInComplete}
        />
        <div className="text-center mt-6">
          <button
            onClick={handleGoHome}
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 mx-auto"
          >
            <Home size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check-out route
  if (route === 'checkout') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
        <StudentCheckOut
          students={students}
          lots={lots}
          checkOutEnabled={checkOutEnabled}
          onCheckOutComplete={handleCheckOutComplete}
        />
        <div className="text-center mt-6">
          <button
            onClick={handleGoHome}
            className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-2 mx-auto"
          >
            <Home size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // No route - return null (main app will render)
  return null;
};

export default QRCodeRouter;

