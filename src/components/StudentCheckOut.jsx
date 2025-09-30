/**
 * Student Check-Out Component
 * Master check-out interface - single QR code for all students
 * URL Format: https://sites.google.com/view/tbtc-cleanup#checkout
 */

import React, { useState, useEffect } from 'react';
import { LogOut, AlertTriangle, MapPin, Clock, Loader2, User, Search, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import apiService from '../../api-service.js';

const StudentCheckOut = ({ students, lots, checkOutEnabled, onCheckOutComplete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Filter to only show checked-in students
  const checkedInStudents = students.filter(s => s.checkedIn);

  // Filter students based on search term
  const filteredStudents = checkedInStudents.filter(student => {
    const search = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(search) ||
      student.id.toLowerCase().includes(search) ||
      student.instrument.toLowerCase().includes(search)
    );
  });

  // Handle student selection
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
  };

  // Handle check-out submission
  const handleCheckOut = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student to check out');
      return;
    }

    if (!checkOutEnabled) {
      toast.error('Check-outs are currently disabled. Please wait for director approval.');
      return;
    }

    setIsLoading(true);

    try {
      // Update student status via API
      // Note: checkInTime is preserved (never cleared)
      await apiService.updateStudentStatus(selectedStudent.id, {
        checkedIn: false,
        assignedLot: null // Clear lot assignment
      });

      // Backend will automatically log to AttendanceLog with check-out time
      
      // Show success message
      const lot = lots.find(l => l.id === selectedStudent.assignedLot);
      toast.success(
        `${selectedStudent.name} successfully checked out from ${lot?.name || 'parking lot'}!`,
        { duration: 5000, icon: '👋' }
      );

      // Call completion callback
      if (onCheckOutComplete) {
        onCheckOutComplete(selectedStudent.id);
      }

      // Reset selection
      setSelectedStudent(null);
      setSearchTerm('');

    } catch (err) {
      console.error('Check-out error:', err);
      toast.error('Failed to check out. Please try again or notify a director.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <LogOut size={32} />
          <h1 className="text-2xl font-bold">Student Check-Out</h1>
        </div>
        <p className="text-purple-100">
          Find your name and check out when you're done
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-lg p-6">
        {/* Check-Out Status Banner */}
        {!checkOutEnabled && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-yellow-800 dark:text-yellow-200 font-semibold mb-1">
                  Check-Outs Currently Disabled
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Please wait for a director to enable check-outs before leaving your assigned lot.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search for Your Name
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type your name, ID, or instrument..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Student List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Checked-In Students ({checkedInStudents.length})
            </h3>
            {searchTerm && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredStudents.length} results
              </span>
            )}
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {checkedInStudents.length === 0 ? (
                <p>No students are currently checked in.</p>
              ) : (
                <p>No students found matching "{searchTerm}"</p>
              )}
            </div>
          ) : (
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {filteredStudents.map(student => {
                const lot = lots.find(l => l.id === student.assignedLot);
                const isSelected = selectedStudent?.id === student.id;

                return (
                  <button
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className={`
                      w-full p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750 hover:border-purple-300 dark:hover:border-purple-700'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {student.name}
                          </h4>
                          {isSelected && (
                            <CheckCircle className="text-purple-600 dark:text-purple-400" size={20} />
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            {student.instrument} • {student.section}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            {lot?.name || 'No lot assigned'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            Checked in: {student.checkInTime ? format(new Date(student.checkInTime), 'h:mm a') : 'Unknown'}
                          </div>
                          <div className="capitalize text-gray-500 dark:text-gray-500">
                            {student.year}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Student Info & Check-Out Button */}
        {selectedStudent && (
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="mb-4">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Ready to Check Out:
              </h4>
              <p className="text-purple-800 dark:text-purple-200">
                {selectedStudent.name} - {lots.find(l => l.id === selectedStudent.assignedLot)?.name || 'Unknown Lot'}
              </p>
            </div>

            <button
              onClick={handleCheckOut}
              disabled={isLoading || !checkOutEnabled}
              className="w-full px-6 py-4 bg-purple-600 text-white rounded-lg font-bold text-lg
                       hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                       transition-colors flex items-center justify-center gap-3 shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Checking Out...
                </>
              ) : (
                <>
                  <LogOut size={24} />
                  {checkOutEnabled ? 'Check Out' : 'Check-Outs Disabled'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Instructions:</h4>
          <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>Use the search bar to find your name</li>
            <li>Click on your name to select it</li>
            <li>Click "Check Out" to complete the process</li>
            <li>Wait for confirmation before leaving</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default StudentCheckOut;

