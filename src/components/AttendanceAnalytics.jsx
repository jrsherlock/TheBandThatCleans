/**
 * TBTC Attendance Analytics Component
 * Displays attendance visualizations and statistics
 */

import React, { useMemo, useEffect, useState } from 'react';
import { Users, TrendingUp, Award, BarChart3, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LabelList, Legend, LineChart, Line, ComposedChart } from 'recharts';

const AttendanceAnalytics = ({ students }) => {
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  // Track which grades are visible in the chart
  const [visibleGrades, setVisibleGrades] = useState({
    9: true,
    10: true,
    11: true,
    12: true
  });

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

    // Identify season-exempt students (have "EX" in ANY event field)
    // These students are exempt for the entire season and should be excluded from all calculations
    const seasonExemptStudents = students.filter(s => {
      return eventFields.some(field => {
        const val = s[field];
        return val === 'EX' || val === 'ex' || val === 'Ex';
      });
    });
    
    // Filter out exempt students - only work with eligible students
    const eligibleStudents = students.filter(s => {
      return !eventFields.some(field => {
        const val = s[field];
        return val === 'EX' || val === 'ex' || val === 'Ex';
      });
    });

    // Event-by-event attendance (only counting eligible students)
    const eventAttendance = eventFields.map((field, index) => {
      const attended = eligibleStudents.filter(s => {
        const val = s[field];
        return val === 'X' || val === 'x';
      }).length;
      const total = eligibleStudents.length; // Only count eligible students
      const eligible = total; // All eligible students are counted
      return {
        event: index + 1,
        eventDate: formatEventDate(eventDates[index]),
        attended,
        excused: 0, // No per-event excused count (exempt students already filtered out)
        total,
        eligible,
        percentage: eligible > 0 ? Math.round((attended / eligible) * 100) : 0
      };
    });

    // Instrument comparison - Competition to see which instrument has highest attendance
    // FIXED: Only count past events in the calculation
    // Only count eligible students (exempt students already filtered out)
    const instrumentStats = {};
    eligibleStudents.forEach(s => {
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
        } else {
          // Absent - counts against them (no excused here, already filtered out)
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


    // Overall stats - calculate total attendances from eligible students only
    // FIXED: Only count past events, not all 7 events
    let totalActualAttendances = 0;
    eligibleStudents.forEach(s => {
      // Only count past events
      pastEventFields.forEach(field => {
        const value = s[field];
        if (value === 'X' || value === 'x') {
          totalActualAttendances++;
        }
        // No excused counting here - exempt students already filtered out
      });
    });

    // Use numPastEvents and only eligible students
    const totalEligibleAttendances = eligibleStudents.length * numPastEvents;
    const overallAttendanceRate = totalEligibleAttendances > 0
      ? Math.round((totalActualAttendances / totalEligibleAttendances) * 100)
      : 0;

    // Calculate average cleanup attendance (average students per event that has occurred)
    const avgCleanupAttendance = numPastEvents > 0
      ? (totalActualAttendances / numPastEvents).toFixed(1)
      : 0;

    // Grade-based attendance statistics (9-12)
    // Only count eligible students (exempt students already filtered out)
    const gradeStats = {};
    const grades = [9, 10, 11, 12];
    
    // Initialize grade stats
    grades.forEach(grade => {
      gradeStats[grade] = {
        totalStudents: 0,
        weeklyAttendance: eventFields.map((field, index) => {
          return {
            event: index + 1,
            eventDate: formatEventDate(eventDates[index]),
            attended: 0,
            eligible: 0,
            excused: 0 // No per-event excused (exempt students filtered out)
          };
        }),
        ytdAttended: 0,
        ytdEligible: 0,
        ytdExcused: 0 // No YTD excused count (exempt students filtered out)
      };
    });
    
    // Calculate grade-based stats - only from eligible students
    eligibleStudents.forEach(s => {
      // Get grade from year or grade field
      const studentGrade = parseInt(s.year || s.grade || '0');
      if (!grades.includes(studentGrade)) return; // Skip if not 9-12
      
      gradeStats[studentGrade].totalStudents++;
      
      // Calculate weekly attendance
      eventFields.forEach((field, index) => {
        const value = s[field];
        if (value === 'X' || value === 'x') {
          gradeStats[studentGrade].weeklyAttendance[index].attended++;
          gradeStats[studentGrade].weeklyAttendance[index].eligible++;
          gradeStats[studentGrade].ytdAttended++;
          gradeStats[studentGrade].ytdEligible++;
        } else {
          // Absent (no excused here - exempt students already filtered out)
          gradeStats[studentGrade].weeklyAttendance[index].eligible++;
          gradeStats[studentGrade].ytdEligible++;
        }
      });
    });
    
    // Calculate percentages for weekly and YTD
    const gradeAttendanceData = grades.map(grade => {
      const stats = gradeStats[grade];
      const weeklyData = stats.weeklyAttendance.map(week => ({
        ...week,
        percentage: week.eligible > 0 ? Math.round((week.attended / week.eligible) * 100) : 0
      }));
      
      return {
        grade,
        totalStudents: stats.totalStudents,
        weeklyAttendance: weeklyData,
        ytdAttended: stats.ytdAttended,
        ytdEligible: stats.ytdEligible,
        ytdPercentage: stats.ytdEligible > 0 ? Math.round((stats.ytdAttended / stats.ytdEligible) * 100) : 0
      };
    });

    return {
      eventAttendance,
      instrumentComparison,
      overallAttendanceRate,
      totalActualAttendances,
      totalPossibleAttendances: totalEligibleAttendances, // Updated to use eligible only
      numPastEvents,
      avgCleanupAttendance,
      eventDates: eventDates, // Include event dates for modal
      gradeAttendanceData, // New: grade-based attendance data
      seasonExemptCount: seasonExemptStudents.length, // Count of season-exempt students
      eligibleStudentCount: eligibleStudents.length // Count of eligible students
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
              {analytics.eligibleStudentCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Eligible Students</div>
            {analytics.seasonExemptCount > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                ({analytics.seasonExemptCount} season-exempt)
              </div>
            )}
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

      {/* Attendance by Grade Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Users size={20} />
          Attendance by Grade (9-12)
        </h3>
        
        {/* YTD Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {analytics.gradeAttendanceData.map((gradeData) => (
            <div
              key={gradeData.grade}
              className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  Grade {gradeData.grade}
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {gradeData.ytdPercentage}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {gradeData.ytdAttended} / {gradeData.ytdEligible} attended
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {gradeData.totalStudents} eligible student{gradeData.totalStudents !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Attendance Chart by Grade */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Event-by-Event Attendance
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart 
              data={analytics.eventAttendance.map((event, eventIndex) => {
                const chartData = {
                  eventDate: event.eventDate,
                  event: event.event
                };
                // Add grade-specific data for each event
                analytics.gradeAttendanceData.forEach(gradeData => {
                  const weekData = gradeData.weeklyAttendance[eventIndex];
                  chartData[`grade${gradeData.grade}Attended`] = weekData?.attended || 0;
                  chartData[`grade${gradeData.grade}Percentage`] = weekData?.percentage || 0;
                });
                return chartData;
              })}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
              <XAxis 
                dataKey="eventDate" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                yAxisId="left"
                label={{ value: 'Students', angle: -90, position: 'insideLeft' }}
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                label={{ value: 'Percentage', angle: 90, position: 'insideRight' }}
                tick={{ fill: 'currentColor' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-color, white)',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  borderRadius: '0.5rem'
                }}
                formatter={(value, name, props) => {
                  if (name.includes('Grade') && name.includes('Count')) {
                    const grade = parseInt(name.match(/Grade (\d+)/)?.[1] || '0');
                    const gradeData = analytics.gradeAttendanceData.find(g => g.grade === grade);
                    if (gradeData && props.payload) {
                      const eventDate = props.payload.eventDate;
                      const eventIndex = analytics.eventAttendance.findIndex(e => e.eventDate === eventDate);
                      if (eventIndex >= 0) {
                        const weekData = gradeData.weeklyAttendance[eventIndex];
                        if (weekData) {
                          return [`${weekData.attended} / ${weekData.eligible} (${weekData.percentage}%)`, name];
                        }
                      }
                    }
                    return [value, name];
                  } else if (name.includes('Grade') && name.includes('%')) {
                    return [`${value}%`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend 
                content={({ payload }) => {
                  // Group payload by grade (combine Count and % entries)
                  const gradeEntries = {};
                  payload?.forEach(entry => {
                    const gradeMatch = entry.dataKey?.match(/grade(\d+)/);
                    if (gradeMatch) {
                      const grade = parseInt(gradeMatch[1]);
                      if (!gradeEntries[grade]) {
                        gradeEntries[grade] = entry; // Use the first entry (Count) as the representative
                      }
                    }
                  });
                  
                  return (
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                      {Object.entries(gradeEntries).map(([grade, entry]) => {
                        const gradeNum = parseInt(grade);
                        const isVisible = visibleGrades[gradeNum];
                        return (
                          <div
                            key={grade}
                            onClick={() => {
                              setVisibleGrades(prev => ({
                                ...prev,
                                [gradeNum]: !prev[gradeNum]
                              }));
                            }}
                            className={`
                              flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer
                              transition-all duration-200
                              ${isVisible 
                                ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600' 
                                : 'bg-gray-50 dark:bg-gray-800 opacity-50 hover:opacity-70'
                              }
                            `}
                            style={{ borderLeft: `4px solid ${entry.color}` }}
                          >
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Grade {grade}
                            </span>
                            {!isVisible && (
                              <span className="text-xs text-gray-500">(hidden)</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
              {analytics.gradeAttendanceData.map((gradeData, index) => {
                if (!visibleGrades[gradeData.grade]) return null;
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
                const color = colors[index % colors.length];
                return (
                  <Bar
                    key={`grade-${gradeData.grade}`}
                    yAxisId="left"
                    dataKey={`grade${gradeData.grade}Attended`}
                    name={`Grade ${gradeData.grade} (Count)`}
                    fill={color}
                    opacity={0.7}
                    radius={[4, 4, 0, 0]}
                  />
                );
              })}
              {analytics.gradeAttendanceData.map((gradeData, index) => {
                if (!visibleGrades[gradeData.grade]) return null;
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
                const color = colors[index % colors.length];
                return (
                  <Line
                    key={`grade-${gradeData.grade}-line`}
                    yAxisId="right"
                    type="monotone"
                    dataKey={`grade${gradeData.grade}Percentage`}
                    name={`Grade ${gradeData.grade} (%)`}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, r: 4 }}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Grade Table */}
        <div className="overflow-x-auto">
          <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Detailed Breakdown by Grade
          </h4>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                  Grade
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center font-semibold text-gray-900 dark:text-white">
                  Students
                </th>
                {analytics.eventAttendance.map((event) => (
                  <th
                    key={event.event}
                    className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center text-xs font-semibold text-gray-900 dark:text-white"
                    title={event.eventDate}
                  >
                    {event.eventDate}
                  </th>
                ))}
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center font-semibold text-gray-900 dark:text-white">
                  YTD Total
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center font-semibold text-gray-900 dark:text-white">
                  YTD %
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.gradeAttendanceData.map((gradeData) => (
                <tr
                  key={gradeData.grade}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-semibold text-gray-900 dark:text-white">
                    Grade {gradeData.grade}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-gray-700 dark:text-gray-300">
                    {gradeData.totalStudents}
                  </td>
                  {gradeData.weeklyAttendance.map((week, index) => (
                    <td
                      key={index}
                      className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center"
                    >
                      <div className="text-xs">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {week.attended} / {week.eligible}
                        </div>
                        <div className={`text-xs ${
                          week.percentage >= 70
                            ? 'text-green-600 dark:text-green-400'
                            : week.percentage >= 50
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}>
                          {week.percentage}%
                        </div>
                      </div>
                    </td>
                  ))}
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center font-semibold text-gray-900 dark:text-white">
                    {gradeData.ytdAttended} / {gradeData.ytdEligible}
                  </td>
                  <td className={`border border-gray-300 dark:border-gray-600 px-4 py-2 text-center font-bold text-lg ${
                    gradeData.ytdPercentage >= 70
                      ? 'text-green-600 dark:text-green-400'
                      : gradeData.ytdPercentage >= 50
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {gradeData.ytdPercentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instrument Detail Modal */}
      {showInstrumentModal && selectedInstrument && (
        <InstrumentDetailModal
          instrument={selectedInstrument}
          students={students}
          eventDates={analytics.eventDates}
          eventAttendance={analytics.eventAttendance}
          instrumentComparison={analytics.instrumentComparison}
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
const InstrumentDetailModal = ({ instrument, students, eventDates, eventAttendance, instrumentComparison, onClose }) => {
  const eventFields = ['event1', 'event2', 'event3', 'event4', 'event5', 'event6', 'event7'];
  
  // Filter students by instrument
  const instrumentStudents = students.filter(s => (s.instrument || 'Unknown') === instrument);
  const totalStudents = instrumentStudents.length;
  
  // Calculate max Y-axis (total students in this section)
  const maxY = totalStudents;

  // Calculate weekly attendance for this instrument and rankings
  const weeklyAttendanceData = eventFields.map((field, index) => {
    const attended = instrumentStudents.filter(s => {
      const val = s[field];
      return val === 'X' || val === 'x';
    }).length;
    const total = totalStudents;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    
    // Calculate ranking for this week by comparing to all instruments
    // Get attendance percentage for each instrument for this event
    const instrumentStatsForEvent = {};
    students.forEach(s => {
      const inst = s.instrument || 'Unknown';
      if (!instrumentStatsForEvent[inst]) {
        instrumentStatsForEvent[inst] = { total: 0, attended: 0 };
      }
      instrumentStatsForEvent[inst].total++;
      const val = s[field];
      if (val === 'X' || val === 'x') {
        instrumentStatsForEvent[inst].attended++;
      }
    });
    
    // Calculate percentage for each instrument and sort
    const rankings = Object.entries(instrumentStatsForEvent)
      .map(([inst, stats]) => ({
        instrument: inst,
        percentage: stats.total > 0 ? (stats.attended / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.percentage - a.percentage);
    
    // Find this instrument's rank (1st, 2nd, 3rd, or null)
    const rankIndex = rankings.findIndex(r => r.instrument === instrument);
    const rank = rankIndex >= 0 && rankIndex < 3 ? rankIndex + 1 : null;
    
    return {
      event: `Event ${index + 1}`,
      date: eventDates[index].toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      attended,
      total,
      percentage,
      rank // 1, 2, 3, or null
    };
  });
  
  // Calculate threshold values for reference lines
  const threshold70 = Math.round(maxY * 0.70);
  const threshold50 = Math.round(maxY * 0.50);

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
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={weeklyAttendanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  domain={[0, maxY]}
                  tick={{ fill: 'currentColor' }}
                  label={{ value: 'Students', angle: -90, position: 'insideLeft' }}
                />
                {/* Threshold reference lines */}
                <ReferenceLine 
                  y={threshold70} 
                  stroke="#10b981" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  label={{ value: "70%", position: "right", fill: "#10b981", fontSize: 12 }}
                />
                <ReferenceLine 
                  y={threshold50} 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  label={{ value: "50%", position: "right", fill: "#f59e0b", fontSize: 12 }}
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
                  <LabelList 
                    dataKey="rank" 
                    content={({ x, y, width, value }) => {
                      if (!value || value > 3) return null;
                      const colors = {
                        1: { bg: '#fbbf24', text: '#78350f' }, // Gold
                        2: { bg: '#94a3b8', text: '#1e293b' }, // Silver
                        3: { bg: '#f97316', text: '#7c2d12' }  // Bronze
                      };
                      const color = colors[value];
                      return (
                        <g>
                          <rect
                            x={x + width / 2 - 12}
                            y={y - 25}
                            width={24}
                            height={20}
                            fill={color.bg}
                            rx={2}
                            stroke={color.text}
                            strokeWidth={1}
                          />
                          <text
                            x={x + width / 2}
                            y={y - 12}
                            fill={color.text}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight="bold"
                          >
                            {value === 1 ? '🥇' : value === 2 ? '🥈' : '🥉'}
                          </text>
                        </g>
                      );
                    }}
                  />
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

