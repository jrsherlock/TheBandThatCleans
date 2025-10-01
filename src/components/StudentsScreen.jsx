/**
 * TBTC Students Screen Component
 * Role-adaptive student roster with permission-based controls
 * Enhanced StudentRoster with permission checks
 */

import React, { useState, useMemo } from 'react';
import { Users, CheckCircle, Filter, Search, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { hasPermission } from '../utils/permissions.js';
import { isReadOnly } from '../utils/roleHelpers.jsx';
import { ProtectedButton, ReadOnlyBadge } from './ProtectedComponents.jsx';

const MotionDiv = motion.div;

/**
 * Student Card Component with permission checks
 */
const StudentCard = ({ student, currentUser, onCheckIn }) => {
  const canCheckIn = hasPermission(currentUser, 'canCheckInStudents');

  const handleCheckInClick = () => {
    if (canCheckIn && onCheckIn) {
      onCheckIn(student.id, student.checkedIn);
    }
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-4 rounded-lg border-2 mb-2 transition-all duration-200 flex justify-between items-start ${
        student.checkedIn 
          ? "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20" 
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">{student.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            student.checkedIn 
              ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300" 
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          }`}>
            {student.checkedIn ? "Present" : "Absent"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div>{student.instrument} • {student.section}</div>
          <div className="capitalize">{student.year}</div>
          {student.checkInTime && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              {format(student.checkInTime, 'HH:mm')}
            </div>
          )}
          {student.assignedLot && (
            <div className="mt-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs rounded col-span-2">
              Assigned to Lot {student.assignedLot}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {canCheckIn ? (
          <button
            onClick={handleCheckInClick}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              student.checkedIn 
                ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60" 
                : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60"
            }`}
          >
            {student.checkedIn ? "Check Out" : "Check In"}
          </button>
        ) : (
          <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
            {student.checkedIn ? "Checked In" : "Not Checked In"}
          </div>
        )}
      </div>
    </MotionDiv>
  );
};

/**
 * Main Students Screen Component
 */
const StudentsScreen = ({ students, currentUser, onStudentUpdate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const canCheckIn = hasPermission(currentUser, 'canCheckInStudents');
  const canView = hasPermission(currentUser, 'canViewStudentRoster');

  // Get unique sections and years
  const sections = useMemo(() => Array.from(new Set(students.map(s => s.section))), [students]);
  const years = useMemo(() => Array.from(new Set(students.map(s => s.year))), [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const nameMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const sectionMatch = sectionFilter === "all" || s.section === sectionFilter;
      const statusMatch = statusFilter === "all" ||
        (statusFilter === "checked-in" && s.checkedIn) ||
        (statusFilter === "not-checked-in" && !s.checkedIn) ||
        (statusFilter === "checked-out" && s.checkOutTime) ||
        (statusFilter === "still-cleaning" && s.checkedIn && !s.checkOutTime);
      const yearMatch = yearFilter === "all" || s.year === yearFilter;

      return nameMatch && sectionMatch && statusMatch && yearMatch;
    });
  }, [students, searchTerm, sectionFilter, statusFilter, yearFilter]);

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Roster</h2>
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
            placeholder="Search students..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select 
            value={sectionFilter} 
            onChange={e => setSectionFilter(e.target.value)} 
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="all">All Sections</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
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
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>{y.charAt(0).toUpperCase() + y.slice(1)}</option>)}
          </select>
          
          <button 
            onClick={handleClearFilters} 
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Showing {filteredStudents.length} of {students.length} students
        {!canCheckIn && <span className="ml-2 text-blue-600 dark:text-blue-400">(Read-only view)</span>}
      </div>

      {/* Scrollable Student List */}
      <div className="space-y-3 overflow-y-auto pr-2 flex-1" style={{ maxHeight: 'calc(100vh - 600px)', minHeight: '300px' }}>
        {filteredStudents.length > 0 ? (
          <motion.div initial={false} animate={{ opacity: 1 }}>
            {filteredStudents.map(student => (
              <StudentCard
                key={student.id}
                student={student}
                currentUser={currentUser}
                onCheckIn={handleManualCheckIn}
              />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No students match the current filters
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsScreen;
export { StudentCard };

