/**
 * TBTC Dashboard Component
 * Role-adaptive dashboard that merges Overview + Command Center + Volunteer View
 */

import { useState, useMemo } from 'react';
import {
  CheckCircle, Users, MapPin, AlertTriangle, Download, Bell,
  Send, RefreshCw, Music, Sparkles, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { isAdmin, isVolunteer, isStudent } from '../utils/permissions.js';
import SegmentedProgressBar from './SegmentedProgressBar.jsx';
import apiService from '../../api-service.js';

const MotionDiv = motion.div;

/**
 * Main Dashboard Component - Routes to role-specific dashboard
 */
const Dashboard = ({ lots, students, stats, currentUser, onBulkStatusUpdate, onSendNotification, onExportReport, getStatusStyles, statuses, sections, useTheme, StatusBadge }) => {
  if (isAdmin(currentUser)) {
    return (
      <AdminDashboard
        lots={lots}
        students={students}
        stats={stats}
        currentUser={currentUser}
        onBulkStatusUpdate={onBulkStatusUpdate}
        onSendNotification={onSendNotification}
        onExportReport={onExportReport}
        getStatusStyles={getStatusStyles}
        statuses={statuses}
        sections={sections}
        useTheme={useTheme}
      />
    );
  } else if (isVolunteer(currentUser)) {
    return (
      <VolunteerDashboard
        lots={lots}
        students={students}
        stats={stats}
        getStatusStyles={getStatusStyles}
        statuses={statuses}
        useTheme={useTheme}
        StatusBadge={StatusBadge}
      />
    );
  } else if (isStudent(currentUser)) {
    return (
      <StudentDashboard
        lots={lots}
        students={students}
        stats={stats}
        currentUser={currentUser}
        getStatusStyles={getStatusStyles}
        StatusBadge={StatusBadge}
      />
    );
  }
  
  // Fallback for unknown role
  return (
    <div className="p-8 text-center">
      <p className="text-gray-600 dark:text-gray-400">Unable to load dashboard. Please contact an administrator.</p>
    </div>
  );
};

/**
 * Admin Dashboard - Full featured dashboard with command center
 * Merges Overview + Command Center functionality
 */
const AdminDashboard = ({ lots, students, stats, onBulkStatusUpdate, onSendNotification, onExportReport, getStatusStyles }) => {
  // Command Center state
  const [selectedLots, setSelectedLots] = useState([]);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const lotsNeedingHelp = lots ? lots.filter(l => l.status === 'needs-help') : [];
  const pendingApprovalLots = lots.filter(l => l.status === 'pending-approval');
  const studentsCheckedIn = students.filter(s => s.checkedIn);

  const quickMessages = [
    "Great job everyone! Keep up the excellent work!",
    "Please report to your assigned lot supervisor for further instructions.",
    "Break time! Return to your lots in 15 minutes.",
    "Event completion approaching. Finish up your current tasks.",
    "Emergency: All students report to the main staging area immediately."
  ];

  // Command Center handlers
  const handleBulkUpdate = (status) => {
    if (selectedLots.length === 0) {
      toast.error("Please select lots to update");
      return;
    }
    onBulkStatusUpdate(selectedLots, status);
    setSelectedLots([]);
    toast.success(`Updated ${selectedLots.length} lots to ${status.replace("-", " ")}`);
  };

  const handleSendNotificationAction = () => {
    if (!notificationMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    const recipientIds = studentsCheckedIn.map(s => s.id);
    onSendNotification(notificationMessage, recipientIds);
    setNotificationMessage("");
    setShowNotificationPanel(false);
    toast.success(`Notification sent to ${recipientIds.length} students`);
  };

  // Reset Database handler
  const handleResetDatabase = async () => {
    setShowResetConfirmation(false);
    setIsResetting(true);

    try {
      toast.loading('Resetting database...', { id: 'reset-db' });

      const result = await apiService.resetDatabase();

      toast.dismiss('reset-db');

      // Build success message
      let successMessage = '✅ Database reset successfully!\n\n';

      if (result.resetSheets && result.resetSheets.length > 0) {
        successMessage += `Cleared sheets: ${result.resetSheets.join(', ')}\n`;
      }

      if (result.clearedLotsColumns && result.clearedLotsColumns.length > 0) {
        successMessage += `Cleared Lots columns: ${result.clearedLotsColumns.join(', ')}\n`;
      }

      if (result.preservedSheets && result.preservedSheets.length > 0) {
        successMessage += `Preserved: ${result.preservedSheets.join(', ')}`;
      }

      toast.success(successMessage, { duration: 6000 });

      // Reload the page to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      toast.dismiss('reset-db');
      toast.error(error.message || 'Failed to reset database. Please try again.');
      console.error('Reset database error:', error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert: Lots Needing Help */}
      {lotsNeedingHelp.length > 0 && (
        <MotionDiv initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
            <h3 className="font-semibold text-red-800 dark:text-red-300">Emergency Attention Required</h3>
          </div>
          <p className="text-red-700 dark:text-red-300 mb-3">{lotsNeedingHelp.length} lot(s) need immediate help:</p>
          <div className="flex flex-wrap gap-2">
            {lotsNeedingHelp.map(l => (
              <span key={l.id} className="px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded text-sm">{l.name}</span>
            ))}
          </div>
        </MotionDiv>
      )}

      {/* Alert: Pending Approval */}
      {pendingApprovalLots.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="text-yellow-600 dark:text-yellow-400" size={20} />
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Pending University Approval</h3>
          </div>
          <p className="text-yellow-700 dark:text-yellow-300 mb-3">{pendingApprovalLots.length} lot(s) awaiting final approval:</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {pendingApprovalLots.map(l => <span key={l.id} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded text-sm">{l.name}</span>)}
          </div>
          <button onClick={() => handleBulkUpdate("complete")} className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors">
            Approve All as Complete
          </button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg"><MapPin className="text-blue-600 dark:text-blue-400" size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedLots}/{stats.totalLots}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lots Complete</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-lg"><CheckCircle className="text-purple-600 dark:text-purple-400" size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.matchedStudents || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Students Signed In - Matched</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded-lg"><AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unmatchedStudents || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Students Signed In - Unmatched</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-lg"><Users className="text-green-600 dark:text-green-400" size={20} /></div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {stats.studentsPresent} / {stats.totalStudents}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Participation ({stats.totalStudents > 0 ? Math.round((stats.studentsPresent / stats.totalStudents) * 100) : 0}%)
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <SegmentedProgressBar
        lots={lots}
        getStatusStyles={getStatusStyles}
        stats={stats}
      />

      {/* Student Check-In Counts by Lot */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Student Check-Ins by Lot</h3>
        <div className="space-y-3">
          {lots
            .map(lot => {
              // Determine student count (AI-verified or manual)
              const hasAICount = lot.aiStudentCount !== undefined && lot.aiStudentCount !== null && lot.aiStudentCount !== '';
              const aiCount = hasAICount ? parseInt(lot.aiStudentCount) || 0 : null;
              const manualCount = lot.totalStudentsSignedUp || 0;
              const studentCount = hasAICount ? aiCount : manualCount;

              // Get matched and unmatched counts
              const matchedCount = lot.aiMatchedCount !== undefined && lot.aiMatchedCount !== null && lot.aiMatchedCount !== ''
                ? parseInt(lot.aiMatchedCount) || 0
                : 0;
              const unmatchedCount = lot.aiUnmatchedCount !== undefined && lot.aiUnmatchedCount !== null && lot.aiUnmatchedCount !== ''
                ? parseInt(lot.aiUnmatchedCount) || 0
                : 0;

              return {
                ...lot,
                studentCount,
                matchedCount,
                unmatchedCount,
                hasAICount,
                isAIVerified: hasAICount
              };
            })
            .sort((a, b) => b.studentCount - a.studentCount) // Sort by count descending
            .map(lot => {
              const maxCount = Math.max(...lots.map(l => {
                const hasAI = l.aiStudentCount !== undefined && l.aiStudentCount !== null && l.aiStudentCount !== '';
                return hasAI ? (parseInt(l.aiStudentCount) || 0) : (l.totalStudentsSignedUp || 0);
              }));

              // Calculate percentages for stacked bar
              const matchedPercentage = maxCount > 0 ? (lot.matchedCount / maxCount) * 100 : 0;
              const unmatchedPercentage = maxCount > 0 ? (lot.unmatchedCount / maxCount) * 100 : 0;

              return (
                <div key={lot.id} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {lot.name}
                      </span>
                      {lot.isAIVerified && (
                        <div className="flex items-center gap-1">
                          <Sparkles size={12} className="text-purple-500 dark:text-purple-400" />
                          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                            AI
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {lot.studentCount}
                      </span>
                      <Users size={14} className="text-gray-500 dark:text-gray-400" />
                    </div>
                  </div>
                  <div className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    {/* Stacked bar: Purple (matched) + Yellow (unmatched) */}
                    {lot.studentCount > 0 ? (
                      <>
                        {/* Purple segment - Matched students */}
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 transition-all duration-500"
                          style={{ width: `${matchedPercentage}%` }}
                        />
                        {/* Yellow segment - Unmatched students */}
                        <div
                          className="absolute inset-y-0 bg-gradient-to-r from-yellow-400 to-yellow-500 dark:from-yellow-500 dark:to-yellow-600 transition-all duration-500"
                          style={{
                            left: `${matchedPercentage}%`,
                            width: `${unmatchedPercentage}%`
                          }}
                        />
                        {/* Total count label */}
                        <div className="absolute inset-0 flex items-center justify-end pr-2">
                          <span className="text-xs font-medium text-white drop-shadow-md">
                            {lot.studentCount} {lot.studentCount === 1 ? 'student' : 'students'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          No students checked in
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin size={10} />
                      <span className="capitalize">{lot.zone || lot.section || 'No zone'}</span>
                    </div>
                    {lot.studentCount > 0 && (
                      <div className="flex items-center gap-3 text-xs">
                        {lot.matchedCount > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-gray-600 dark:text-gray-400">{lot.matchedCount} matched</span>
                          </div>
                        )}
                        {lot.unmatchedCount > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span className="text-gray-600 dark:text-gray-400">{lot.unmatchedCount} unmatched</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
        {lots.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No parking lots available
          </div>
        )}
      </div>

      {/* Command Center Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Command Center</h2>

        {/* Bulk Actions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Bulk Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Lots for Bulk Update</label>
              <select
                multiple
                value={selectedLots}
                onChange={e => {
                  // Convert string values back to numbers to match lot.id type
                  const selectedValues = Array.from(e.target.selectedOptions, m => {
                    const value = m.value;
                    // Try to parse as number, otherwise keep as string
                    const numValue = Number(value);
                    return !isNaN(numValue) ? numValue : value;
                  });
                  setSelectedLots(selectedValues);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent h-32"
              >
                {lots.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} - {getStatusStyles(l.status).label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple lots</p>
            </div>
            <div className="space-y-2">
              <button onClick={() => handleBulkUpdate("ready")} disabled={selectedLots.length === 0} className="w-full px-4 py-2 bg-teal-600 dark:bg-teal-500 text-white rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">Set to Ready</button>
              <button onClick={() => handleBulkUpdate("in-progress")} disabled={selectedLots.length === 0} className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">Set to In Progress</button>
              <button onClick={() => handleBulkUpdate("needs-help")} disabled={selectedLots.length === 0} className="w-full px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">Mark as Needs Help</button>
              <button onClick={() => handleBulkUpdate("pending-approval")} disabled={selectedLots.length === 0} className="w-full px-4 py-2 bg-yellow-600 dark:bg-yellow-500 text-white rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">Set Pending Approval</button>
              <button onClick={() => handleBulkUpdate("complete")} disabled={selectedLots.length === 0} className="w-full px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">Mark as Complete</button>
            </div>
          </div>
        </div>

        {/* Send Notification */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Send Notification</h3>
            <button onClick={() => setShowNotificationPanel(!showNotificationPanel)} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors">
              <Bell size={16} />
            </button>
          </div>
          <MotionDiv
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: showNotificationPanel ? 1 : 0, height: showNotificationPanel ? "auto" : 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Messages</label>
              <div className="grid grid-cols-1 gap-2">
                {quickMessages.map((msg, idx) => (
                  <button key={idx} onClick={() => setNotificationMessage(msg)} className="text-left px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm transition-colors">{msg}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Message</label>
              <textarea
                value={notificationMessage}
                onChange={e => setNotificationMessage(e.target.value)}
                placeholder="Enter your message..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSendNotificationAction} className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                <Send size={16} />
                Send to All Present ({studentsCheckedIn.length})
              </button>
            </div>
          </MotionDiv>
        </div>

        {/* Utility Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={onExportReport} className="px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
            <Download size={16} />
            Export Report
          </button>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center justify-center gap-2">
            <RefreshCw size={16} />
            Refresh Data
          </button>
        </div>

        {/* Reset Database Button - Development/Testing Only */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-1">Development Tools</h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Reset database to clear all student check-ins, attendance logs, event configuration, and lot student counts.
                  Parking lot structure and master roster will be preserved.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowResetConfirmation(true)}
              disabled={isResetting}
              className="w-full px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              {isResetting ? 'Resetting...' : 'Reset Database'}
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <MotionDiv
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md transition-colors duration-200"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-lg">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Reset Database?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  This will permanently delete all data from:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                  <li>• <strong>Students</strong> - All check-in/check-out data</li>
                  <li>• <strong>AttendanceLog</strong> - All attendance records</li>
                  <li>• <strong>EventConfig</strong> - Event settings</li>
                  <li>• <strong>Lots (counts only)</strong> - AI/manual student counts, photos, comments</li>
                </ul>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  The following will be <strong className="text-green-600 dark:text-green-400">preserved</strong>:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                  <li>• <strong>Lots (structure)</strong> - Lot names, zones, IDs, coordinates</li>
                  <li>• <strong>ActualRoster</strong> - Master student roster</li>
                </ul>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  ⚠️ This action cannot be undone!
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirmation(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDatabase}
                className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-semibold"
              >
                Yes, Reset Database
              </button>
            </div>
          </MotionDiv>
        </div>
      )}
    </div>
  );
};

/**
 * Volunteer Dashboard - Simplified read-only view with interactive KPI cards
 * Merges VolunteerView functionality
 */
const VolunteerDashboard = ({ lots, students, stats, getStatusStyles, statuses, useTheme, StatusBadge }) => {
  const [selectedStatus, setSelectedStatus] = useState(null);

  const lotStatusCounts = useMemo(() => {
    return lots.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});
  }, [lots]);

  // Filter lots by selected status
  const filteredLots = useMemo(() => {
    if (!selectedStatus) return [];
    return lots.filter(l => l.status === selectedStatus);
  }, [lots, selectedStatus]);

  // Handle status card click
  const handleStatusCardClick = (status) => {
    setSelectedStatus(selectedStatus === status ? null : status);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">The Band That Cleans</h1>
        <p className="text-gray-600 dark:text-gray-400">Live Event Progress • Parent Volunteer View</p>
      </div>

      {/* KPI Ribbon - Same as Director's Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg"><MapPin className="text-blue-600 dark:text-blue-400" size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedLots}/{stats.totalLots}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lots Complete</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-lg"><CheckCircle className="text-purple-600 dark:text-purple-400" size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.matchedStudents || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Students Signed In - Matched</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded-lg"><AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unmatchedStudents || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Students Signed In - Unmatched</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-lg"><Users className="text-green-600 dark:text-green-400" size={20} /></div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {stats.studentsPresent} / {stats.totalStudents}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Participation ({stats.totalStudents > 0 ? Math.round((stats.studentsPresent / stats.totalStudents) * 100) : 0}%)
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <SegmentedProgressBar
        lots={lots}
        getStatusStyles={getStatusStyles}
        stats={stats}
      />

      {/* Interactive Status Counts */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statuses.map(s => {
          const { label, color } = getStatusStyles(s);
          const count = lotStatusCounts[s] || 0;
          const isSelected = selectedStatus === s;
          return (
            <button
              key={s}
              onClick={() => handleStatusCardClick(s)}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
              }`}
            >
              <div className={`text-2xl font-bold ${color.replace('bg-', 'text-')}`}>{count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
              {isSelected && (
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Click to hide</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Filtered Lots Display */}
      {selectedStatus && (
        <MotionDiv
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {getStatusStyles(selectedStatus).label} Lots ({filteredLots.length})
          </h3>
          {filteredLots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLots.map(lot => (
                <div
                  key={lot.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 transition-colors duration-200"
                  style={{ borderColor: getStatusStyles(lot.status).color.replace('bg-', '#').replace('-500', '500') }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-gray-900 dark:text-white">{lot.name}</h4>
                    <StatusBadge status={lot.status} />
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span className="capitalize">Zone {lot.zone || lot.section}</span>
                    </div>
                    {(() => {
                      const hasAICount = lot.aiStudentCount !== undefined && lot.aiStudentCount !== null && lot.aiStudentCount !== '';
                      const aiCount = hasAICount ? parseInt(lot.aiStudentCount) || 0 : null;
                      const manualCount = lot.totalStudentsSignedUp || 0;
                      const displayCount = hasAICount ? aiCount : manualCount;

                      return (
                        <div className="flex items-center gap-1">
                          {hasAICount ? (
                            <Sparkles size={14} className="text-purple-500 dark:text-purple-400" />
                          ) : (
                            <Users size={14} />
                          )}
                          <span>{displayCount} students</span>
                          {hasAICount && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                              AI
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    {lot.comment && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300">
                        {lot.comment}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No lots with this status</p>
          )}
        </MotionDiv>
      )}

      {/* Live Status Indicator */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded-full text-sm">
          <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
          <span>Live Updates • University Liaison is active</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Student Dashboard - Personal view for students
 * New functionality for student role
 */
const StudentDashboard = ({ lots, students, stats, currentUser, getStatusStyles, StatusBadge }) => {
  // Find current student's data
  const currentStudent = students.find(s => s.id === currentUser.id);
  const assignedLot = currentStudent?.assignedLot ? lots.find(l => l.id === currentStudent.assignedLot) : null;
  const teammates = assignedLot ? students.filter(s => s.assignedLot === assignedLot.id && s.id !== currentUser.id) : [];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Music size={32} />
          <h1 className="text-3xl font-bold">Welcome, {currentUser.name}!</h1>
        </div>
        <p className="text-blue-100">The Band That Cleans • Parking Lot Cleanup Event</p>
      </div>

      {/* Check-in Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${currentStudent?.checkedIn ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <CheckCircle className={currentStudent?.checkedIn ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Check-in Status</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {currentStudent?.checkedIn ? 'Checked In' : 'Not Checked In'}
              </div>
              {currentStudent?.checkInTime && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  at {format(new Date(currentStudent.checkInTime), 'h:mm a')}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${assignedLot ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <MapPin className={assignedLot ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Assigned Lot</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {assignedLot ? assignedLot.name : 'Not Assigned'}
              </div>
              {assignedLot && (
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {assignedLot.zone || assignedLot.section}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Lot Details */}
      {assignedLot && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Lot Details</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <StatusBadge status={assignedLot.status} />
            </div>
            {assignedLot.notes && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="font-medium text-yellow-800 dark:text-yellow-300 text-sm">Important Note:</div>
                    <div className="text-yellow-700 dark:text-yellow-300 text-sm">{assignedLot.notes}</div>
                  </div>
                </div>
              </div>
            )}
            {assignedLot.comment && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="font-medium text-blue-800 dark:text-blue-300 text-sm mb-1">Director's Comment:</div>
                <div className="text-blue-700 dark:text-blue-300 text-sm">{assignedLot.comment}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teammates */}
      {teammates.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Team ({teammates.length} students)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teammates.map(student => (
              <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${student.checkedIn ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{student.instrument} • {student.year}</div>
                </div>
                {student.checkedIn && (
                  <CheckCircle className="text-green-500" size={16} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Progress */}
      <SegmentedProgressBar
        lots={lots}
        getStatusStyles={getStatusStyles}
        stats={stats}
      />

      {/* Quick Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedLots}/{stats.totalLots}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lots Complete</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.studentsPresent}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Students Present</div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Instructions</h3>
        <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
          <li>• Make sure you've checked in with a director</li>
          <li>• Report to your assigned lot and find your team</li>
          <li>• Follow your lot supervisor's instructions</li>
          <li>• Work safely and efficiently with your team</li>
          <li>• Check out with a director when your lot is complete</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
export { AdminDashboard, VolunteerDashboard, StudentDashboard };

