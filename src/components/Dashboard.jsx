/**
 * TBTC Dashboard Component
 * Role-adaptive dashboard that merges Overview + Command Center + Volunteer View
 */

import React, { useState, useMemo } from 'react';
import {
  CheckCircle, Users, MapPin, AlertTriangle, Download, Bell, X,
  Send, RefreshCw, Music
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { isAdmin, isVolunteer, isStudent } from '../utils/permissions.js';
import { ProtectedButton } from './ProtectedComponents.jsx';
import SegmentedProgressBar from './SegmentedProgressBar.jsx';

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
const AdminDashboard = ({ lots, students, stats, currentUser, onBulkStatusUpdate, onSendNotification, onExportReport, getStatusStyles, statuses, sections, useTheme }) => {
  const { isDarkMode } = useTheme();
  
  // Command Center state
  const [selectedLots, setSelectedLots] = useState([]);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Computed data for charts
  const lotDistributionData = useMemo(() => {
    // Map Tailwind color classes to actual hex values
    const colorMap = {
      'bg-gray-500': '#6B7280',
      'bg-blue-500': '#3B82F6',
      'bg-red-500': '#EF4444',
      'bg-yellow-500': '#EAB308',
      'bg-green-500': '#10B981',
    };

    return statuses.map(s => {
      const { label, color } = getStatusStyles(s);
      return {
        name: label,
        value: lots.filter(l => l.status === s).length,
        color: colorMap[color] || '#6B7280'
      };
    });
  }, [lots, statuses, getStatusStyles]);

  const sectionProgressData = useMemo(() => {
    return sections.map(sec => {
      // Use zone field from Google Sheet, fallback to section for backward compatibility
      const lotsInZone = lots.filter(l => (l.zone || l.section) === sec);
      return {
        section: sec.charAt(0).toUpperCase() + sec.slice(1),
        total: lotsInZone.length,
        completed: lotsInZone.filter(l => l.status === 'complete').length,
      };
    });
  }, [lots, sections]);

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
          <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-lg"><CheckCircle className="text-green-600 dark:text-green-400" size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.studentsPresent}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Students Checked In Today</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-orange-100 dark:bg-orange-900/40 p-2 rounded-lg"><Users className="text-orange-600 dark:text-orange-400" size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Students Signed Out Today</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-lg"><Users className="text-purple-600 dark:text-purple-400" size={20} /></div>
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

      {/* Charts and Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lot Status Distribution</h3>
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

        {/* Zone Progress Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Progress by Zone</h3>
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
          <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-lg"><CheckCircle className="text-green-600 dark:text-green-400" size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.studentsPresent}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Students Checked In Today</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-orange-100 dark:bg-orange-900/40 p-2 rounded-lg"><Users className="text-orange-600 dark:text-orange-400" size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Students Signed Out Today</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-200">
          <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-lg"><Users className="text-purple-600 dark:text-purple-400" size={20} /></div>
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
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{lot.totalStudentsSignedUp || 0} students signed up</span>
                    </div>
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

