/**
 * TBTC Student Details Modal Component
 * Comprehensive view of student information, today's assignment, and attendance history
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { X, CheckCircle, Clock, Calendar, TrendingUp, Award, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const MotionDiv = motion.div;

/**
 * Event dates for the 2025 season (matching ActualRoster columns E-K)
 */
const EVENT_DATES = [
  { date: new Date('2025-08-31'), label: 'Aug. 31', field: 'event1' },
  { date: new Date('2025-09-14'), label: 'Sept. 14', field: 'event2' },
  { date: new Date('2025-09-28'), label: 'Sept. 28', field: 'event3' },
  { date: new Date('2025-10-19'), label: 'Oct. 19', field: 'event4' },
  { date: new Date('2025-10-26'), label: 'Oct. 26', field: 'event5' },
  { date: new Date('2025-11-09'), label: 'Nov. 9', field: 'event6' },
  { date: new Date('2025-11-23'), label: 'Nov. 23', field: 'event7' }
];

/**
 * Helper function to find which lot a student is assigned to
 */
const findStudentLot = (studentId, lots) => {
  if (!studentId || !lots) return null;
  return lots.find(lot => 
    lot.assignedStudents && lot.assignedStudents.includes(studentId)
  );
};

/**
 * Helper function to calculate attendance metrics
 */
const calculateAttendanceMetrics = (student) => {
  const eventFields = ['event1', 'event2', 'event3', 'event4', 'event5', 'event6', 'event7'];
  
  let attended = 0;
  let excused = 0;
  const attendedEvents = [];
  const excusedEvents = [];
  
  eventFields.forEach((field, index) => {
    const value = student[field];
    if (value === 'X' || value === 'x') {
      attended++;
      attendedEvents.push(EVENT_DATES[index]);
    } else if (value === 'EX' || value === 'ex' || value === 'Ex') {
      excused++;
      excusedEvents.push(EVENT_DATES[index]);
    }
  });
  
  const total = eventFields.length;
  const eligible = total - excused;
  const percentage = eligible > 0 ? ((attended / eligible) * 100).toFixed(1) : 0;
  
  return {
    attended,
    excused,
    total,
    eligible,
    percentage,
    attendedEvents: attendedEvents.sort((a, b) => b.date - a.date), // Most recent first
    excusedEvents: excusedEvents.sort((a, b) => b.date - a.date)
  };
};

/**
 * StudentDetailsModal Component
 */
const StudentDetailsModal = ({ student, lots, onClose }) => {
  const modalRef = useRef(null);
  
  // Calculate attendance metrics
  const metrics = useMemo(() => {
    if (!student) return null;
    return calculateAttendanceMetrics(student);
  }, [student]);
  
  // Find assigned lot
  const assignedLot = useMemo(() => {
    if (!student) return null;
    return findStudentLot(student.id, lots);
  }, [student, lots]);
  
  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  // Focus trap
  useEffect(() => {
    if (modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, []);
  
  if (!student || !metrics) return null;
  
  // Get progress bar color based on attendance percentage
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-modal-title"
    >
      <MotionDiv
        ref={modalRef}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors duration-200"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 
                id="student-modal-title"
                className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
              >
                {student.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {/* Status Badge */}
                <span className={`
                  inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                  ${student.checkedIn
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {student.checkedIn ? (
                    <>
                      <CheckCircle size={14} />
                      Checked In
                    </>
                  ) : (
                    <>
                      <Clock size={14} />
                      Not Checked In
                    </>
                  )}
                </span>
                
                {/* Instrument Badge */}
                {student.instrument && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                    {student.instrument}
                  </span>
                )}
                
                {/* Section Badge */}
                {student.section && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300">
                    {student.section}
                  </span>
                )}
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X size={24} className="text-gray-900 dark:text-gray-100" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Section B: Today's Event Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <MapPin size={20} className="text-blue-600 dark:text-blue-400" />
              Today's Assignment
            </h3>
            
            <div className="space-y-3">
              {/* Assigned Lot */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Assigned Lot</div>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {assignedLot ? (
                    <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-lg">
                      {assignedLot.name}
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Not Assigned</span>
                  )}
                </div>
              </div>
              
              {/* Check-In Status */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Check-In Status</div>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {student.checkedIn ? (
                    <span className="inline-flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle size={16} />
                      Checked In
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Clock size={16} />
                      Not Checked In
                    </span>
                  )}
                </div>
              </div>
              
              {/* Check-In Time */}
              {student.checkedIn && student.checkInTime && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Check-In Time</div>
                  <div className="text-base font-medium text-gray-900 dark:text-white">
                    {format(new Date(student.checkInTime), 'h:mm a')}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Section C: Attendance Summary Statistics */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
              Attendance Summary
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Total Events Attended */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Events Attended</div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {metrics.attended}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  out of {metrics.eligible} eligible
                </div>
              </div>
              
              {/* Attendance Percentage */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Attendance Rate</div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {metrics.percentage}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {metrics.excused > 0 && `${metrics.excused} excused`}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(metrics.percentage)} transition-all duration-500`}
                style={{ width: `${metrics.percentage}%` }}
              />
            </div>
          </div>
          
          {/* Section D: Attendance History List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Calendar size={20} className="text-gray-600 dark:text-gray-400" />
              Attendance History
            </h3>
            
            {metrics.attendedEvents.length > 0 || metrics.excusedEvents.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* Attended Events */}
                {metrics.attendedEvents.map((event, index) => (
                  <div 
                    key={`attended-${index}`}
                    className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <CheckCircle size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {format(event.date, 'EEEE, MMM d, yyyy')}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Attended
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Excused Events */}
                {metrics.excusedEvents.map((event, index) => (
                  <div 
                    key={`excused-${index}`}
                    className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <Award size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {format(event.date, 'EEEE, MMM d, yyyy')}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Excused
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar size={48} className="mx-auto mb-2 opacity-40" />
                <p>No attendance records yet</p>
              </div>
            )}
          </div>
        </div>
      </MotionDiv>
    </div>
  );
};

export default StudentDetailsModal;

