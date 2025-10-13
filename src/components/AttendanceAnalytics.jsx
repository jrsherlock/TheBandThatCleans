/**
 * TBTC Attendance Analytics Component
 * Displays attendance visualizations and statistics
 */

import React, { useMemo } from 'react';
import { Users, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const AttendanceAnalytics = ({ students }) => {
  // Calculate attendance statistics
  const analytics = useMemo(() => {
    const eventFields = ['event1', 'event2', 'event3', 'event4', 'event5', 'event6', 'event7'];
    
    // Event-by-event attendance
    const eventAttendance = eventFields.map((field, index) => {
      const attended = students.filter(s => s[field] === 'X' || s[field] === 'x').length;
      const excused = students.filter(s => s[field] === 'EX' || s[field] === 'ex').length;
      return {
        event: index + 1,
        attended,
        excused,
        total: students.length,
        percentage: students.length > 0 ? Math.round((attended / students.length) * 100) : 0
      };
    });

    // Student leaderboard
    const studentStats = students.map(s => {
      let attended = 0;
      let excused = 0;
      eventFields.forEach(field => {
        const value = s[field];
        if (value === 'X' || value === 'x') attended++;
        else if (value === 'EX' || value === 'ex') excused++;
      });
      return { ...s, attended, excused };
    });
    
    const topStudents = studentStats
      .sort((a, b) => b.attended - a.attended)
      .slice(0, 10);

    // Section comparison
    const sectionStats = {};
    students.forEach(s => {
      const section = s.section || 'Unknown';
      if (!sectionStats[section]) {
        sectionStats[section] = { total: 0, attended: 0 };
      }
      sectionStats[section].total++;
      
      let studentAttended = 0;
      eventFields.forEach(field => {
        if (s[field] === 'X' || s[field] === 'x') studentAttended++;
      });
      sectionStats[section].attended += studentAttended;
    });

    const sectionComparison = Object.entries(sectionStats).map(([section, stats]) => ({
      section,
      avgAttendance: stats.total > 0 ? (stats.attended / (stats.total * 7) * 100).toFixed(1) : 0,
      totalStudents: stats.total
    })).sort((a, b) => b.avgAttendance - a.avgAttendance);

    // Overall stats
    const totalPossibleAttendances = students.length * 7;
    const totalActualAttendances = studentStats.reduce((sum, s) => sum + s.attended, 0);
    const overallAttendanceRate = totalPossibleAttendances > 0 
      ? Math.round((totalActualAttendances / totalPossibleAttendances) * 100) 
      : 0;

    return {
      eventAttendance,
      topStudents,
      sectionComparison,
      overallAttendanceRate,
      totalActualAttendances,
      totalPossibleAttendances
    };
  }, [students]);

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
              {analytics.totalActualAttendances}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Attendances</div>
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
                    Event {event.event}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {event.attended} / {event.total} ({event.percentage}%)
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

        {/* Student Leaderboard */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award size={20} />
            Top 10 Students by Attendance
          </h3>
          <div className="space-y-2">
            {analytics.topStudents.map((student, index) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  <span className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
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
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {student.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`
                    text-sm font-bold
                    ${student.attended === 7 
                      ? 'text-green-600 dark:text-green-400' 
                      : student.attended >= 5 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    }
                  `}>
                    {student.attended}/7
                  </span>
                  {student.attended === 7 && (
                    <Award size={16} className="text-yellow-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Comparison */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={20} />
            Attendance by Section
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

