/**
 * TBTC Attendance Analytics Component
 * Displays attendance visualizations and statistics
 */

import React, { useMemo, useEffect } from 'react';
import { Users, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const AttendanceAnalytics = ({ students }) => {
  // Debug: Log students data
  useEffect(() => {
    console.log('=== ATTENDANCE ANALYTICS DEBUG ===');
    console.log('Students received:', students);
    console.log('Students count:', students?.length);
    if (students && students.length > 0) {
      console.log('First student:', students[0]);
      console.log('Has event fields?', 'event1' in students[0]);
    }
  }, [students]);

  // Calculate attendance statistics
  const analytics = useMemo(() => {
    // Safety check: ensure students array exists and has data
    if (!students || students.length === 0) {
      console.warn('AttendanceAnalytics: No students data available');
      return {
        eventAttendance: [],
        instrumentComparison: [],
        sectionComparison: [],
        overallAttendanceRate: 0,
        totalActualAttendances: 0,
        totalPossibleAttendances: 0,
        numPastEvents: 0,
        avgCleanupAttendance: 0
      };
    }

    const eventFields = ['event1', 'event2', 'event3', 'event4', 'event5', 'event6', 'event7'];

    // Event dates mapping (based on ActualRoster column headers)
    const eventDates = [
      new Date('2025-08-31'), // Event 1: Aug. 31
      new Date('2025-09-14'), // Event 2: Sept. 14
      new Date('2025-09-28'), // Event 3: Sept. 28
      new Date('2025-10-19'), // Event 4: Oct. 19
      new Date('2025-10-26'), // Event 5: Oct. 26
      new Date('2025-11-09'), // Event 6: Nov. 9
      new Date('2025-11-23')  // Event 7: Nov. 23
    ];

    // Determine which events have already occurred (compare to today)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate date comparison

    const pastEventIndices = eventDates
      .map((date, index) => ({ date, index }))
      .filter(({ date }) => date < today)
      .map(({ index }) => index);

    const pastEventFields = pastEventIndices.map(i => eventFields[i]);
    const numPastEvents = pastEventFields.length;

    console.log('Event date calculation:', {
      today: today.toISOString(),
      eventDates: eventDates.map(d => d.toISOString()),
      pastEventIndices,
      pastEventFields,
      numPastEvents
    });

    // Helper function to format event dates
    const formatEventDate = (date) => {
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month}. ${day}`;
    };

    // Event-by-event attendance
    const eventAttendance = eventFields.map((field, index) => {
      const attended = students.filter(s => {
        const val = s[field];
        return val === 'X' || val === 'x';
      }).length;
      const excused = students.filter(s => {
        const val = s[field];
        return val === 'EX' || val === 'ex' || val === 'Ex';
      }).length;
      const total = students.length;
      const eligible = total - excused; // Exclude excused students from denominator
      return {
        event: index + 1,
        eventDate: formatEventDate(eventDates[index]),
        attended,
        excused,
        total,
        eligible,
        percentage: eligible > 0 ? Math.round((attended / eligible) * 100) : 0
      };
    });

    // Instrument comparison - Competition to see which instrument has highest attendance
    // FIXED: Only count past events in the calculation
    const instrumentStats = {};
    students.forEach(s => {
      const instrument = s.instrument || 'Unknown';
      if (!instrumentStats[instrument]) {
        instrumentStats[instrument] = {
          totalStudents: 0,
          totalAttended: 0,
          totalEligible: 0
        };
      }
      instrumentStats[instrument].totalStudents++;

      // Only iterate over past events, not all 7 events
      pastEventFields.forEach(field => {
        const value = s[field];
        if (value === 'X' || value === 'x') {
          instrumentStats[instrument].totalAttended++;
          instrumentStats[instrument].totalEligible++;
        } else if (value === 'EX' || value === 'ex' || value === 'Ex') {
          // Excused - don't count as attended, but also don't count against them
          // Do nothing - this event doesn't count for or against
        } else {
          // Absent - counts against them
          instrumentStats[instrument].totalEligible++;
        }
      });
    });

    const instrumentComparison = Object.entries(instrumentStats).map(([instrument, stats]) => ({
      instrument,
      avgAttendance: stats.totalEligible > 0
        ? ((stats.totalAttended / stats.totalEligible) * 100).toFixed(1)
        : 0,
      totalStudents: stats.totalStudents,
      totalAttended: stats.totalAttended,
      totalEligible: stats.totalEligible
    })).sort((a, b) => b.avgAttendance - a.avgAttendance);

    // Instrument comparison (grouped by instrument to compare trumpets vs trombones, etc.)
    // FIXED: Only count past events, not all 7 events
    const instrumentSectionStats = {};
    students.forEach(s => {
      const instrument = s.instrument || 'Unknown';
      if (!instrumentSectionStats[instrument]) {
        instrumentSectionStats[instrument] = { total: 0, attended: 0 };
      }
      instrumentSectionStats[instrument].total++;

      let studentAttended = 0;
      // Only count past events
      pastEventFields.forEach(field => {
        if (s[field] === 'X' || s[field] === 'x') studentAttended++;
      });
      instrumentSectionStats[instrument].attended += studentAttended;
    });

    const sectionComparison = Object.entries(instrumentSectionStats).map(([instrument, stats]) => ({
      section: instrument, // Using 'section' key name for backward compatibility with display
      // Use numPastEvents instead of hardcoded 7
      avgAttendance: stats.total > 0 ? (stats.attended / (stats.total * numPastEvents) * 100).toFixed(1) : 0,
      totalStudents: stats.total
    })).sort((a, b) => b.avgAttendance - a.avgAttendance);

    // Overall stats - calculate total attendances from all students
    // FIXED: Only count past events, not all 7 events
    let totalActualAttendances = 0;
    let totalExcused = 0;
    students.forEach(s => {
      // Only count past events
      pastEventFields.forEach(field => {
        const value = s[field];
        if (value === 'X' || value === 'x') {
          totalActualAttendances++;
        } else if (value === 'EX' || value === 'ex' || value === 'Ex') {
          totalExcused++;
        }
      });
    });

    // Use numPastEvents instead of hardcoded 7
    const totalPossibleAttendances = students.length * numPastEvents;
    const totalEligibleAttendances = totalPossibleAttendances - totalExcused;
    const overallAttendanceRate = totalEligibleAttendances > 0
      ? Math.round((totalActualAttendances / totalEligibleAttendances) * 100)
      : 0;

    // Calculate average cleanup attendance (average students per event that has occurred)
    const avgCleanupAttendance = numPastEvents > 0
      ? (totalActualAttendances / numPastEvents).toFixed(1)
      : 0;

    return {
      eventAttendance,
      instrumentComparison,
      sectionComparison,
      overallAttendanceRate,
      totalActualAttendances,
      totalPossibleAttendances,
      numPastEvents,
      avgCleanupAttendance
    };
  }, [students]);

  // Safety check: Don't render if no data
  if (!students || students.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
        <p className="text-yellow-800 dark:text-yellow-200">
          No student data available for analytics. Please ensure students are loaded.
        </p>
      </div>
    );
  }

  // Check if attendance data exists
  const hasAttendanceData = students.some(s =>
    s.event1 !== undefined || s.event2 !== undefined || s.event3 !== undefined
  );

  if (!hasAttendanceData) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-2">
          ⚠️ Attendance Data Not Available
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300 mb-4">
          The attendance data (event1-event7 fields) is not present in the student records.
          This usually means the Google Apps Script backend hasn't been updated yet.
        </p>
        <div className="bg-white dark:bg-gray-800 rounded p-4 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-semibold mb-2">To fix this:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open your Google Sheet</li>
            <li>Go to Extensions → Apps Script</li>
            <li>Replace Code.gs with the updated version from the repository</li>
            <li>Deploy → Manage deployments → Edit → New version → Deploy</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-6 space-y-6"
    >
      {/* Overall Season Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          2025 Season Overview
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {analytics.overallAttendanceRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Overall Attendance Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {analytics.avgCleanupAttendance}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Cleanup Attendance - YTD</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {students.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Students</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Week-to-Week Attendance */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Event-by-Event Attendance
          </h3>
          <div className="space-y-3">
            {analytics.eventAttendance.map((event) => (
              <div key={event.event} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Event {event.event} - {event.eventDate}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {event.attended} / {event.eligible} ({event.percentage}%)
                    {event.excused > 0 && (
                      <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                        ({event.excused} excused)
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${event.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instrument Competition - Which instrument has the highest attendance? */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award size={20} />
            Attendance by Instrument - Competition Rankings
          </h3>
          <div className="space-y-3">
            {analytics.instrumentComparison.map((instrument, index) => (
              <div
                key={instrument.instrument}
                className="space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${index === 0
                        ? 'bg-yellow-400 text-yellow-900'
                        : index === 1
                          ? 'bg-gray-300 text-gray-700'
                          : index === 2
                            ? 'bg-orange-400 text-orange-900'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }
                    `}>
                      {index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {instrument.instrument}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {instrument.totalStudents} student{instrument.totalStudents !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`
                        text-lg font-bold
                        ${parseFloat(instrument.avgAttendance) >= 85
                          ? 'text-green-600 dark:text-green-400'
                          : parseFloat(instrument.avgAttendance) >= 70
                            ? 'text-blue-600 dark:text-blue-400'
                            : parseFloat(instrument.avgAttendance) >= 50
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                        }
                      `}>
                        {instrument.avgAttendance}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {instrument.totalAttended}/{instrument.totalEligible}
                      </div>
                    </div>
                    {index === 0 && (
                      <Award size={20} className="text-yellow-500" />
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      parseFloat(instrument.avgAttendance) >= 85
                        ? 'bg-green-600 dark:bg-green-500'
                        : parseFloat(instrument.avgAttendance) >= 70
                          ? 'bg-blue-600 dark:bg-blue-500'
                          : parseFloat(instrument.avgAttendance) >= 50
                            ? 'bg-yellow-600 dark:bg-yellow-500'
                            : 'bg-red-600 dark:bg-red-500'
                    }`}
                    style={{ width: `${instrument.avgAttendance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instrument Comparison */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={20} />
            Attendance by Instrument
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.sectionComparison.map((section) => (
              <div
                key={section.section}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center"
              >
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {section.avgAttendance}%
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                  {section.section}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {section.totalStudents} students
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AttendanceAnalytics;

