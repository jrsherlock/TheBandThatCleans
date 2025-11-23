/**
 * TBTC Attendance Analytics Component
 * Displays attendance visualizations and statistics
 */

import React, { useMemo, useEffect, useState } from 'react';
import { Users, TrendingUp, Award, BarChart3, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AttendanceAnalytics = ({ students }) => {
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);

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
      overallAttendanceRate,
      totalActualAttendances,
      totalPossibleAttendances,
      numPastEvents,
      avgCleanupAttendance,
      eventDates: eventDates // Include event dates for modal
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
                className="space-y-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
                onClick={() => {
                  setSelectedInstrument(instrument.instrument);
                  setShowInstrumentModal(true);
                }}
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

      </div>

      {/* Instrument Detail Modal */}
      {showInstrumentModal && selectedInstrument && (
        <InstrumentDetailModal
          instrument={selectedInstrument}
          students={students}
          eventDates={analytics.eventDates}
          eventAttendance={analytics.eventAttendance}
          onClose={() => {
            setShowInstrumentModal(false);
            setSelectedInstrument(null);
          }}
        />
      )}
    </motion.div>
  );
};

/**
 * Modal component showing detailed attendance for a specific instrument
 */
const InstrumentDetailModal = ({ instrument, students, eventDates, eventAttendance, onClose }) => {
  const eventFields = ['event1', 'event2', 'event3', 'event4', 'event5', 'event6', 'event7'];
  
  // Filter students by instrument
  const instrumentStudents = students.filter(s => (s.instrument || 'Unknown') === instrument);

  // Calculate weekly attendance for this instrument
  const weeklyAttendanceData = eventFields.map((field, index) => {
    const attended = instrumentStudents.filter(s => {
      const val = s[field];
      return val === 'X' || val === 'x';
    }).length;
    const total = instrumentStudents.length;
    return {
      event: `Event ${index + 1}`,
      date: eventDates[index].toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      attended,
      total,
      percentage: total > 0 ? Math.round((attended / total) * 100) : 0
    };
  });

  // Calculate student-level attendance
  const studentAttendanceData = instrumentStudents.map(student => {
    let totalAttended = 0;
    const weeklyStatus = eventFields.map((field, index) => {
      const value = student[field];
      if (value === 'X' || value === 'x') {
        totalAttended++;
        return { event: index + 1, status: 'attended', date: eventDates[index] };
      } else if (value === 'EX' || value === 'ex' || value === 'Ex') {
        return { event: index + 1, status: 'excused', date: eventDates[index] };
      }
      return { event: index + 1, status: 'absent', date: eventDates[index] };
    });

    return {
      name: student.name || 'Unknown',
      instrument: student.instrument || 'Unknown',
      section: student.section || 'Unknown',
      year: student.year || student.grade || 'Unknown',
      totalAttended,
      totalEvents: eventFields.length,
      weeklyStatus
    };
  }).sort((a, b) => b.totalAttended - a.totalAttended);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {instrument} - Detailed Attendance
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {instrumentStudents.length} student{instrumentStudents.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Weekly Attendance Chart */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Weekly Attendance Totals
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-color, white)',
                    border: '1px solid var(--border-color, #e5e7eb)',
                    borderRadius: '0.5rem'
                  }}
                  formatter={(value, name) => {
                    if (name === 'attended') {
                      const data = weeklyAttendanceData.find(d => d.attended === value);
                      return [`${value} / ${data?.total || 0} (${data?.percentage || 0}%)`, 'Attended'];
                    }
                    return value;
                  }}
                />
                <Bar dataKey="attended" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {weeklyAttendanceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.percentage >= 70 ? '#10b981' : entry.percentage >= 50 ? '#f59e0b' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Student List */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Student Attendance Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Student Name
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      Section
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      Year
                    </th>
                    {eventFields.map((_, index) => (
                      <th 
                        key={index}
                        className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center text-xs font-semibold text-gray-900 dark:text-white"
                        title={eventDates[index].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      >
                        E{index + 1}
                      </th>
                    ))}
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {studentAttendanceData.map((student, idx) => (
                    <tr 
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-900 dark:text-white">
                        {student.name}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-center text-gray-700 dark:text-gray-300">
                        {student.section}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-center text-gray-700 dark:text-gray-300">
                        {student.year}
                      </td>
                      {student.weeklyStatus.map((status, eventIdx) => (
                        <td 
                          key={eventIdx}
                          className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center text-xs"
                        >
                          {status.status === 'attended' && (
                            <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                          )}
                          {status.status === 'excused' && (
                            <span className="text-yellow-600 dark:text-yellow-400">EX</span>
                          )}
                          {status.status === 'absent' && (
                            <span className="text-gray-400 dark:text-gray-600">-</span>
                          )}
                        </td>
                      ))}
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-center font-semibold text-gray-900 dark:text-white">
                        {student.totalAttended} / {student.totalEvents}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AttendanceAnalytics;

