/**
 * TBTC Student Details Modal Component
 * Pokemon card-inspired design with event attendance blocks
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { X, CheckCircle, Clock, Calendar, TrendingUp, Award, MapPin, Users } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const eventStatus = [];
  
  eventFields.forEach((field, index) => {
    const value = student[field];
    if (value === 'X' || value === 'x') {
      attended++;
      eventStatus.push({ ...EVENT_DATES[index], status: 'attended' });
    } else if (value === 'EX' || value === 'ex' || value === 'Ex') {
      excused++;
      eventStatus.push({ ...EVENT_DATES[index], status: 'excused' });
    } else {
      eventStatus.push({ ...EVENT_DATES[index], status: 'absent' });
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
    eventStatus
  };
};

/**
 * StudentDetailsModal Component - Pokemon Card Design
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
  
  // Get card color theme based on attendance percentage
  const getCardTheme = (percentage) => {
    if (percentage >= 80) {
      return {
        gradient: 'from-emerald-500 via-green-500 to-teal-500',
        border: 'border-emerald-400',
        glow: 'shadow-emerald-500/50',
        accent: 'text-emerald-600 dark:text-emerald-400'
      };
    } else if (percentage >= 60) {
      return {
        gradient: 'from-yellow-500 via-amber-500 to-orange-500',
        border: 'border-yellow-400',
        glow: 'shadow-yellow-500/50',
        accent: 'text-yellow-600 dark:text-yellow-400'
      };
    } else {
      return {
        gradient: 'from-red-500 via-rose-500 to-pink-500',
        border: 'border-red-400',
        glow: 'shadow-red-500/50',
        accent: 'text-red-600 dark:text-red-400'
      };
    }
  };
  
  const theme = getCardTheme(parseFloat(metrics.percentage));
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-modal-title"
    >
      <MotionDiv
        ref={modalRef}
        initial={{ scale: 0.85, opacity: 0, rotateY: -15 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        exit={{ scale: 0.85, opacity: 0, rotateY: 15 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className={`
          relative w-full max-w-md
          bg-gradient-to-br ${theme.gradient}
          rounded-2xl p-1
          ${theme.glow} shadow-2xl
          transform-gpu
        `}
        style={{ perspective: '1000px' }}
      >
        {/* Pokemon Card Inner */}
        <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden h-full">
          {/* Card Header - Pokemon Style */}
          <div className={`
            relative bg-gradient-to-r ${theme.gradient} p-6
            border-b-4 ${theme.border}
          `}>
            {/* Decorative Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 left-2 w-8 h-8 border-2 border-white rounded-full"></div>
              <div className="absolute top-2 right-2 w-6 h-6 border-2 border-white rotate-45"></div>
              <div className="absolute bottom-2 left-4 w-4 h-4 border-2 border-white rounded-full"></div>
            </div>
            
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
              aria-label="Close modal"
            >
              <X size={20} className="text-white" />
            </button>
            
            {/* Student Name - Large and Bold */}
            <div className="relative z-10">
              <h2 
                id="student-modal-title"
                className="text-3xl font-black text-white mb-2 drop-shadow-lg"
                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}
              >
                {student.name}
              </h2>
              
              {/* Badges Row */}
              <div className="flex flex-wrap gap-2 mt-3">
                {student.instrument && (
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800 shadow-md">
                    {student.instrument}
                  </span>
                )}
                {student.section && (
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800 shadow-md">
                    {student.section}
                  </span>
                )}
                {student.year && (
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800 shadow-md">
                    Grade {student.year}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Card Body */}
          <div className="p-6 space-y-6">
            {/* Stats Section - Pokemon Style */}
            <div className="grid grid-cols-2 gap-4">
              {/* Attendance Rate */}
              <div className={`
                bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700
                rounded-xl p-4 border-2 border-gray-200 dark:border-gray-600
                text-center shadow-inner
              `}>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Attendance
                </div>
                <div className={`text-4xl font-black ${theme.accent} mb-1`}>
                  {metrics.percentage}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {metrics.attended}/{metrics.eligible}
                </div>
              </div>
              
              {/* Check-In Status */}
              <div className={`
                bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700
                rounded-xl p-4 border-2 border-gray-200 dark:border-gray-600
                text-center shadow-inner
              `}>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Status
                </div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  {student.checkedIn ? (
                    <>
                      <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">In</span>
                    </>
                  ) : (
                    <>
                      <Clock size={24} className="text-gray-400" />
                      <span className="text-lg font-bold text-gray-400">Out</span>
                    </>
                  )}
                </div>
                {assignedLot && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {assignedLot.name}
                  </div>
                )}
              </div>
            </div>
            
            {/* Event Attendance Blocks - All 7 Events */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={20} className={theme.accent} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Event Attendance
                </h3>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {metrics.eventStatus.map((event, index) => {
                  const isAttended = event.status === 'attended';
                  const isExcused = event.status === 'excused';
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        aspect-square rounded-lg
                        flex flex-col items-center justify-center
                        border-2 font-bold text-xs
                        shadow-lg transform transition-all duration-200
                        hover:scale-110 hover:z-10
                        ${isAttended
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white'
                          : isExcused
                            ? 'bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 text-white'
                            : 'bg-gradient-to-br from-red-500 to-rose-600 border-red-400 text-white'
                        }
                      `}
                      title={`${event.label} - ${event.status === 'attended' ? 'Attended' : event.status === 'excused' ? 'Excused' : 'Absent'}`}
                    >
                      {isAttended ? (
                        <CheckCircle size={20} className="mb-1" />
                      ) : isExcused ? (
                        <Award size={20} className="mb-1" />
                      ) : (
                        <X size={20} className="mb-1 opacity-75" />
                      )}
                      <span className="text-[10px] leading-tight text-center px-1">
                        {event.label.split(' ')[0]}
                      </span>
                      <span className="text-[9px] leading-tight">
                        {event.label.split(' ')[1]}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-gradient-to-br from-green-500 to-emerald-600 border border-green-400"></div>
                  <span className="text-gray-600 dark:text-gray-400">Attended</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-gradient-to-br from-yellow-400 to-amber-500 border border-yellow-300"></div>
                  <span className="text-gray-600 dark:text-gray-400">Excused</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-gradient-to-br from-red-500 to-rose-600 border border-red-400"></div>
                  <span className="text-gray-600 dark:text-gray-400">Absent</span>
                </div>
              </div>
            </div>
            
            {/* Additional Info Section */}
            {assignedLot && (
              <div className={`
                bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20
                rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800
              `}>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={18} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Assigned Lot</span>
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {assignedLot.name}
                </div>
              </div>
            )}
            
            {/* Footer Stats */}
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {metrics.attended}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {metrics.eligible}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Eligible</div>
              </div>
              {metrics.excused > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400">
                    {metrics.excused}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Excused</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
};

export default StudentDetailsModal;
