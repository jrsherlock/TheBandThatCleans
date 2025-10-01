/**
 * Student Check-In Component
 * Handles QR code-based check-in flow for students
 * URL Format: https://sites.google.com/view/tbtc-cleanup#checkin/[lot-id]
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, MapPin, Clock, Loader2, User, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import apiService from '../../api-service.js';

// Import TBTC Logo
import TBTCLogo from '../public/TBTC.png';

const StudentCheckIn = ({ lotId, students, lots, onCheckInComplete }) => {
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState(null);
  const [validationState, setValidationState] = useState('idle'); // idle, validating, valid, invalid

  // Get lot information
  const lot = lots.find(l => l.id === lotId);

  // Validate student identifier (name or campus ID)
  const validateStudent = async () => {
    if (!studentIdentifier.trim()) {
      setError('Please enter your name or campus ID');
      return;
    }

    setIsLoading(true);
    setValidationState('validating');
    setError(null);

    try {
      // Search for student by name or ID
      const searchTerm = studentIdentifier.trim().toLowerCase();
      const foundStudent = students.find(s => 
        s.name.toLowerCase().includes(searchTerm) || 
        s.id.toLowerCase() === searchTerm
      );

      if (!foundStudent) {
        // Student not found in roster
        setValidationState('invalid');
        setError('Your name was not found in our system. Please sign in on the paper attendance sheet instead.');
        setStudentData(null);
        toast.error('Student not found in roster');
        return;
      }

      // Check if student is already checked in to another lot
      if (foundStudent.checkedIn && foundStudent.assignedLot && foundStudent.assignedLot !== lotId) {
        const currentLot = lots.find(l => l.id === foundStudent.assignedLot);
        setValidationState('invalid');
        setError(
          `You are already checked into ${currentLot?.name || 'another lot'}. ` +
          `Check-in time: ${foundStudent.checkInTime ? format(new Date(foundStudent.checkInTime), 'h:mm a') : 'Unknown'}. ` +
          `Please check out from your current lot before checking into a new one.`
        );
        setStudentData(foundStudent);
        toast.error('Already checked into another lot');
        return;
      }

      // Student found and available for check-in
      setValidationState('valid');
      setStudentData(foundStudent);
      toast.success(`Welcome, ${foundStudent.name}!`);

    } catch (err) {
      console.error('Validation error:', err);
      setValidationState('invalid');
      setError('An error occurred while validating your information. Please try again.');
      toast.error('Validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle check-in submission
  const handleCheckIn = async () => {
    if (!studentData || validationState !== 'valid') {
      toast.error('Please validate your information first');
      return;
    }

    setIsLoading(true);

    try {
      // Update student status via API
      await apiService.updateStudentStatus(studentData.id, {
        checkedIn: true,
        checkInTime: new Date().toISOString(),
        assignedLot: lotId
      });

      // Log to attendance log (handled by backend)
      
      // Show success message
      toast.success(
        `Successfully checked in to ${lot?.name || 'parking lot'}!`,
        { duration: 5000, icon: '✅' }
      );

      // Call completion callback
      if (onCheckInComplete) {
        onCheckInComplete(studentData.id, lotId);
      }

      // Reset form
      setStudentIdentifier('');
      setStudentData(null);
      setValidationState('idle');
      setError(null);

    } catch (err) {
      console.error('Check-in error:', err);
      toast.error('Failed to check in. Please try again or use the paper sheet.');
      setError('Check-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <MapPin className="flex-shrink-0" size={32} />
            <h1 className="text-xl sm:text-2xl font-bold">Student Check-In</h1>
          </div>
          {/* TBTC Logo */}
          <img
            src={TBTCLogo}
            alt="TBTC Logo"
            className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 object-contain flex-shrink-0"
          />
        </div>
        {lot && (
          <p className="text-blue-100 text-base sm:text-lg">
            {lot.name}
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-lg p-6">
        {/* Input Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter Your Full Name or Campus ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={studentIdentifier}
              onChange={(e) => setStudentIdentifier(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && validateStudent()}
              placeholder="e.g., John Smith or 12345"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={validateStudent}
              disabled={isLoading || !studentIdentifier.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
                       hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                       transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <User size={20} />
                  Validate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Student Info Display */}
        {studentData && validationState === 'valid' && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={24} />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                  Student Verified
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-green-800 dark:text-green-200">
                  <div><strong>Name:</strong> {studentData.name}</div>
                  <div><strong>Section:</strong> {studentData.section}</div>
                  <div><strong>Instrument:</strong> {studentData.instrument}</div>
                  <div><strong>Year:</strong> <span className="capitalize">{studentData.year}</span></div>
                </div>
              </div>
            </div>

            {/* Check-In Button */}
            <button
              onClick={handleCheckIn}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-green-600 text-white rounded-lg font-bold text-lg
                       hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                       transition-colors flex items-center justify-center gap-3 shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Checking In...
                </>
              ) : (
                <>
                  <CheckCircle size={24} />
                  Check In to {lot?.name || 'This Lot'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Instructions:</h4>
          <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>Enter your full name or campus ID</li>
            <li>Click "Validate" to verify your information</li>
            <li>Review your details and click "Check In"</li>
            <li>Wait for confirmation before starting work</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default StudentCheckIn;

