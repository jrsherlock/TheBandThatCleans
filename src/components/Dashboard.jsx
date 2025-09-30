/**
 * TBTC Dashboard Component
 * Role-adaptive dashboard that merges Overview + Command Center + Volunteer View
 */

import React, { useState, useMemo } from 'react';
import {
  CheckCircle, Clock, Users, MapPin, AlertTriangle, Download, Bell, X,
  Send, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { isAdmin, isVolunteer } from '../utils/permissions.js';
import { ProtectedButton } from './ProtectedComponents.jsx';

const MotionDiv = motion.div;

/**
 * Main Dashboard Component - Routes to role-specific dashboard
 * MVP: Student dashboard removed - students no longer use the app
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
const AdminDashboard = ({ lots, students, stats, currentUser, onBulkStatusUpdate, onSendNotification, onExportReport, getStatusStyles, statuses, sections, useTheme }) => {
  const { isDarkMode } = useTheme();
  
  // Command Center state
  const [selectedLots, setSelectedLots] = useState([]);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Computed data for charts
  const lotDistributionData = useMemo(() => {
    return statuses.map(s => {
      const { label, color } = getStatusStyles(s);
      return {
        name: label,
        value: lots.filter(l => l.status === s).length,
        color: color.replace('bg-', '#').replace('-500', '500')
      };
    });
  }, [lots, statuses, getStatusStyles]);

  const sectionProgressData = useMemo(() => {
    return sections.map(sec => ({
      section: sec.charAt(0).toUpperCase() + sec.slice(1),
      total: lots.filter(l => l.section === sec).length,
      completed: lots.filter(l => l.section === sec && l.status === 'complete').length,
    }));
  }, [lots, sections]);

  const percentageComplete = stats.totalLots > 0 ? Math.round(stats.completedLots / stats.totalLots * 100) : 0;
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
          <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-lg"><Users className="text-green-600 dark:text-green-400" size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.studentsPresent}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Students Present</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-lg"><CheckCircle className="text-purple-600 dark:text-purple-400" size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudentsSignedUp}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Signed Up</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-orange-100 dark:bg-orange-900/40 p-2 rounded-lg"><Clock className="text-orange-600 dark:text-orange-400" size={20} /></div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.estimatedCompletion.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Est. Completion</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Progress</h3>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{percentageComplete}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <MotionDiv
            className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full flex items-center justify-end pr-2"
            initial={{ width: 0 }}
            animate={{ width: `${percentageComplete}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            {percentageComplete > 10 && <span className="text-white text-xs font-medium">{percentageComplete}%</span>}
          </MotionDiv>
        </div>
      </div>

      {/* Charts and Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={lotDistributionData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                labelLine={{ stroke: isDarkMode ? '#D1D5DB' : '#374151' }}
                style={{ fill: isDarkMode ? '#F3F4F6' : '#1F2937' }}
              >
                {lotDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                  border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  color: isDarkMode ? '#F3F4F6' : '#1F2937'
                }}
                itemStyle={{ color: isDarkMode ? '#F3F4F6' : '#1F2937' }}
                formatter={(value, name, props) => [`${value} lots`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Section Progress Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Progress by Section</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sectionProgressData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
              <XAxis dataKey="section" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} style={{ fill: isDarkMode ? '#D1D5DB' : '#374151' }} />
              <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} style={{ fill: isDarkMode ? '#D1D5DB' : '#374151' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                  border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  color: isDarkMode ? '#F3F4F6' : '#1F2937'
                }}
                itemStyle={{ color: isDarkMode ? '#F3F4F6' : '#1F2937' }}
              />
              <Bar dataKey="completed" fill="#10B981" name="Completed" />
              <Bar dataKey="total" fill={isDarkMode ? '#6B7280' : '#D1D5DB'} name="Total Lots" />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
                onChange={e => setSelectedLots(Array.from(e.target.selectedOptions, m => m.value))}
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
      </div>
    </div>
  );
};

/**
 * Volunteer Dashboard - Simplified read-only view
 * Merges VolunteerView functionality
 */
const VolunteerDashboard = ({ lots, students, stats, getStatusStyles, statuses, useTheme, StatusBadge }) => {
  const { isDarkMode } = useTheme();

  const lotStatusCounts = useMemo(() => {
    return lots.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});
  }, [lots]);

  const percentageComplete = stats.totalLots > 0 ? Math.round(stats.completedLots / stats.totalLots * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">The Band That Cleans</h1>
        <p className="text-gray-600 dark:text-gray-400">Live Event Progress • Parent Volunteer View</p>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{percentageComplete}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <MotionDiv
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percentageComplete}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Status Counts */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statuses.map(s => {
          const { label, color } = getStatusStyles(s);
          const count = lotStatusCounts[s] || 0;
          return (
            <div key={s} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center transition-colors duration-200">
              <div className={`text-2xl font-bold ${color.replace('bg-', 'text-')}`}>{count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
            </div>
          );
        })}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg"><Users className="text-blue-600 dark:text-blue-400" size={24} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudentsSignedUp}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Students Participating</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-lg"><CheckCircle className="text-green-600 dark:text-green-400" size={24} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.studentsPresent}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Students Present Today</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-lg"><Clock className="text-purple-600 dark:text-purple-400" size={24} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.estimatedCompletion.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Estimated Completion</div>
          </div>
        </div>
      </div>

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

export default Dashboard;
export { AdminDashboard, VolunteerDashboard };

