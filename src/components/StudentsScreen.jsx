/**
 * TBTC Students Screen Component
 * Comprehensive check-in ledger with spreadsheet-style layout
 * Role-adaptive with permission-based controls
 */

import React, { useState, useMemo } from 'react';
import { Users, CheckCircle, Filter, Search, Clock, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { hasPermission } from '../utils/permissions.js';
import { isReadOnly } from '../utils/roleHelpers.jsx';
import { ProtectedButton, ReadOnlyBadge } from './ProtectedComponents.jsx';

const MotionDiv = motion.div;

/**
 * Helper function to format check-in time
 */
const formatCheckInTime = (checkInTime) => {
  if (!checkInTime) return '-';

  const date = checkInTime instanceof Date ? checkInTime : new Date(checkInTime);
  const timeStr = format(date, 'h:mm a');
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });

  return { timeStr, relativeTime };
};

/**
 * Helper function to get lot name from lot ID
 */
const getLotName = (lotId, lots) => {
  if (!lotId) return '-';
  const lot = lots?.find(l => l.id === lotId);
  return lot ? lot.name : lotId;
};

/**
 * Main Students Screen Component - Spreadsheet-Style Check-In Ledger
 */
const StudentsScreen = ({ students, currentUser, onStudentUpdate, lots = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [instrumentFilter, setInstrumentFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  const canCheckIn = hasPermission(currentUser, 'canCheckInStudents');
  const canView = hasPermission(currentUser, 'canViewStudentRoster');

  // Get unique values for filters
  const sections = useMemo(() => Array.from(new Set(students.map(s => s.section).filter(Boolean))), [students]);
  const years = useMemo(() => {
    const validYears = students
      .map(s => s.year)
      .filter(y => y !== null && y !== undefined && y !== '')
      .map(y => String(y));
    return Array.from(new Set(validYears));
  }, [students]);
  const instruments = useMemo(() => Array.from(new Set(students.map(s => s.instrument).filter(Boolean))), [students]);

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    let filtered = students.filter(s => {
      const nameMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.instrument?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.section?.toLowerCase().includes(searchTerm.toLowerCase());
      const sectionMatch = sectionFilter === "all" || s.section === sectionFilter;
      const statusMatch = statusFilter === "all" ||
        (statusFilter === "checked-in" && s.checkedIn) ||
        (statusFilter === "not-checked-in" && !s.checkedIn) ||
        (statusFilter === "checked-out" && s.checkOutTime) ||
        (statusFilter === "still-cleaning" && s.checkedIn && !s.checkOutTime);
      const yearMatch = yearFilter === "all" || s.year === yearFilter;
      const instrumentMatch = instrumentFilter === "all" || s.instrument === instrumentFilter;

      return nameMatch && sectionMatch && statusMatch && yearMatch && instrumentMatch;
    });

    // Sort students
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortColumn) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'instrument':
          aVal = a.instrument || '';
          bVal = b.instrument || '';
          break;
        case 'section':
          aVal = a.section || '';
          bVal = b.section || '';
          break;
        case 'year':
          aVal = a.year || '';
          bVal = b.year || '';
          break;
        case 'status':
          aVal = a.checkedIn ? 1 : 0;
          bVal = b.checkedIn ? 1 : 0;
          break;
        case 'checkInTime':
          aVal = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
          bVal = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
          break;
        case 'assignedLot':
          aVal = getLotName(a.assignedLot, lots);
          bVal = getLotName(b.assignedLot, lots);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [students, searchTerm, sectionFilter, statusFilter, yearFilter, instrumentFilter, sortColumn, sortDirection, lots]);

  // Statistics
  const stats = useMemo(() => {
    const checkedIn = students.filter(s => s.checkedIn).length;
    const stillCleaning = students.filter(s => s.checkedIn && !s.checkOutTime).length;
    return {
      total: students.length,
      checkedIn,
      stillCleaning,
      percentage: students.length > 0 ? Math.round(checkedIn / students.length * 100) : 0
    };
  }, [students]);

  const handleManualCheckIn = (studentId, isCheckedIn) => {
    if (!canCheckIn) {
      toast.error("You don't have permission to check students in or out.");
      return;
    }

    const student = students.find(s => s.id === studentId);
    if (!student) return;

    onStudentUpdate(studentId, {
      checkedIn: !isCheckedIn,
      checkInTime: !isCheckedIn ? new Date() : undefined,
      assignedLot: !isCheckedIn ? student.assignedLot : undefined,
    });

    if (!isCheckedIn) {
      toast.success(`${student.name} checked in!`, { icon: '✅' });
    } else {
      toast.error(`${student.name} checked out.`, { icon: '🚪' });
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSectionFilter("all");
    setStatusFilter("all");
    setYearFilter("all");
    setInstrumentFilter("all");
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) return <ArrowUpDown size={14} className="opacity-40" />;
    return sortDirection === 'asc'
      ? <ArrowUp size={14} className="text-blue-600 dark:text-blue-400" />
      : <ArrowDown size={14} className="text-blue-600 dark:text-blue-400" />;
  };

  if (!canView) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
        <p className="text-gray-600 dark:text-gray-400">You don't have permission to view the student roster.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check-In Ledger</h2>
        {!canCheckIn && <ReadOnlyBadge />}
      </div>

      {/* Statistics KPI Boxes */}
      <div className="grid grid-cols-3 gap-4 mb-6 flex-shrink-0">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center">
          <Users className="mx-auto mb-2 text-blue-600 dark:text-blue-400" size={24} />
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
          <div className="text-sm text-blue-800 dark:text-blue-300">Total Students</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg text-center">
          <CheckCircle className="mx-auto mb-2 text-green-600 dark:text-green-400" size={24} />
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.checkedIn}</div>
          <div className="text-sm text-green-800 dark:text-green-300">Checked In</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg text-center">
          <Clock className="mx-auto mb-2 text-purple-600 dark:text-purple-400" size={24} />
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.stillCleaning}</div>
          <div className="text-sm text-purple-800 dark:text-purple-300">Still Cleaning</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search by name, instrument, or section..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="all">All Sections</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={instrumentFilter}
            onChange={e => setInstrumentFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="all">All Instruments</option>
            {instruments.map(i => <option key={i} value={i}>{i}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="checked-in">Checked In</option>
            <option value="not-checked-in">Not Checked In</option>
            <option value="still-cleaning">Still Cleaning</option>
            <option value="checked-out">Checked Out</option>
          </select>

          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>{y.charAt(0).toUpperCase() + y.slice(1)}</option>)}
          </select>

          <button
            onClick={handleClearFilters}
            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <X size={16} />
            Clear Filters
          </button>

          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="font-medium">{filteredStudents.length}</span>
            <span className="mx-1">/</span>
            <span>{students.length}</span>
          </div>
        </div>
      </div>

      {/* Spreadsheet-Style Table */}
      <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th
                onClick={() => handleSort('name')}
                className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>Student Name</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th
                onClick={() => handleSort('instrument')}
                className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:table-cell"
              >
                <div className="flex items-center gap-2">
                  <span>Instrument</span>
                  {getSortIcon('instrument')}
                </div>
              </th>
              <th
                onClick={() => handleSort('section')}
                className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden lg:table-cell"
              >
                <div className="flex items-center gap-2">
                  <span>Section</span>
                  {getSortIcon('section')}
                </div>
              </th>
              <th
                onClick={() => handleSort('year')}
                className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden xl:table-cell"
              >
                <div className="flex items-center gap-2">
                  <span>Year</span>
                  {getSortIcon('year')}
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>
              <th
                onClick={() => handleSort('checkInTime')}
                className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:table-cell"
              >
                <div className="flex items-center gap-2">
                  <span>Check-In Time</span>
                  {getSortIcon('checkInTime')}
                </div>
              </th>
              <th
                onClick={() => handleSort('assignedLot')}
                className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden lg:table-cell"
              >
                <div className="flex items-center gap-2">
                  <span>Assigned Lot</span>
                  {getSortIcon('assignedLot')}
                </div>
              </th>
              {canCheckIn && (
                <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => {
                const timeInfo = formatCheckInTime(student.checkInTime);
                const lotName = getLotName(student.assignedLot, lots);

                return (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className={`
                      transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50
                      ${student.checkedIn
                        ? 'bg-green-50/30 dark:bg-green-900/10'
                        : 'bg-white dark:bg-gray-800'
                      }
                    `}
                  >
                    {/* Student Name */}
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {student.name}
                    </td>

                    {/* Instrument */}
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 hidden md:table-cell">
                      {student.instrument || '-'}
                    </td>

                    {/* Section */}
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                      {student.section || '-'}
                    </td>

                    {/* Year */}
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 capitalize hidden xl:table-cell">
                      {student.year || '-'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${student.checkedIn
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }
                      `}>
                        {student.checkedIn ? (
                          <>
                            <CheckCircle size={12} />
                            Present
                          </>
                        ) : (
                          <>
                            <Clock size={12} />
                            Absent
                          </>
                        )}
                      </span>
                    </td>

                    {/* Check-In Time */}
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 hidden md:table-cell">
                      {student.checkInTime ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{timeInfo.timeStr}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{timeInfo.relativeTime}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>

                    {/* Assigned Lot */}
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                      {student.assignedLot ? (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs rounded">
                          {lotName}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>

                    {/* Action */}
                    {canCheckIn && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleManualCheckIn(student.id, student.checkedIn)}
                          className={`
                            px-3 py-1 rounded text-xs font-medium transition-colors
                            ${student.checkedIn
                              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60'
                              : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60'
                            }
                          `}
                        >
                          {student.checkedIn ? 'Check Out' : 'Check In'}
                        </button>
                      </td>
                    )}
                  </motion.tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={canCheckIn ? 8 : 7}
                  className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Search size={32} className="opacity-40" />
                    <p>No students match the current filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsScreen;

