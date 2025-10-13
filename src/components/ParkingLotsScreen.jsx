/**
 * TBTC Parking Lots Screen Component
 * Role-adaptive parking lots view with permission-based controls
 * Merges: Parking Lots + Director Dashboard + Volunteer View (lot grid)
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, MapPin, AlertTriangle, MessageSquare, Clock, PenLine, Filter, CheckCircle, Play,
  Grid3x3, List, Map as MapIcon, ArrowUpDown, Navigation, ExternalLink, Upload, FileImage,
  Sparkles, UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { hasPermission } from '../utils/permissions.js';
import { isReadOnly } from '../utils/roleHelpers.jsx';
import { ProtectedButton, ProtectedSelect } from './ProtectedComponents.jsx';
import LotEditModal from './LotEditModal.jsx';
import SignInSheetUploadModal from './SignInSheetUpload/SignInSheetUploadModal.jsx';

const MotionDiv = motion.div;

/**
 * Helper function to get status icon
 */
const getStatusIcon = (status) => {
  switch (status) {
    case 'complete': return CheckCircle;
    case 'in-progress': return Play;
    case 'needs-help': return AlertTriangle;
    case 'pending-approval': return Clock;
    case 'not-started': default: return MapPin;
  }
};

/**
 * Helper function to get status label
 */
const getStatusLabel = (status) => {
  switch (status) {
    case 'complete': return 'Complete';
    case 'in-progress': return 'In Progress';
    case 'needs-help': return 'Needs Help';
    case 'pending-approval': return 'Pending';
    case 'not-started': default: return 'Not Started';
  }
};

/**
 * Helper function to get status border and background colors
 */
const getStatusCardColors = (status) => {
  switch (status) {
    case 'complete':
      return {
        border: 'border-green-500 dark:border-green-400',
        bg: 'bg-green-50/50 dark:bg-green-900/10',
        badgeBg: 'bg-green-500',
        buttonBorder: 'border-green-500 dark:border-green-400',
        buttonText: 'text-green-700 dark:text-green-300',
        buttonHover: 'hover:bg-green-50 dark:hover:bg-green-900/20'
      };
    case 'in-progress':
      return {
        border: 'border-blue-500 dark:border-blue-400',
        bg: 'bg-blue-50/50 dark:bg-blue-900/10',
        badgeBg: 'bg-blue-500',
        buttonBorder: 'border-blue-500 dark:border-blue-400',
        buttonText: 'text-blue-700 dark:text-blue-300',
        buttonHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
      };
    case 'needs-help':
      return {
        border: 'border-red-500 dark:border-red-400',
        bg: 'bg-red-50/50 dark:bg-red-900/10',
        badgeBg: 'bg-red-500',
        buttonBorder: 'border-red-500 dark:border-red-400',
        buttonText: 'text-red-700 dark:text-red-300',
        buttonHover: 'hover:bg-red-50 dark:hover:bg-red-900/20'
      };
    case 'pending-approval':
      return {
        border: 'border-yellow-500 dark:border-yellow-400',
        bg: 'bg-yellow-50/50 dark:bg-yellow-900/10',
        badgeBg: 'bg-yellow-500',
        buttonBorder: 'border-yellow-500 dark:border-yellow-400',
        buttonText: 'text-yellow-700 dark:text-yellow-300',
        buttonHover: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
      };
    case 'not-started':
    default:
      return {
        border: 'border-gray-400 dark:border-gray-500',
        bg: 'bg-gray-50/50 dark:bg-gray-800/50',
        badgeBg: 'bg-gray-500',
        buttonBorder: 'border-gray-400 dark:border-gray-500',
        buttonText: 'text-gray-700 dark:text-gray-300',
        buttonHover: 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
      };
  }
};

/**
 * Enhanced LotCard with improved visual design and status indicators
 */
const LotCard = ({ lot, students, currentUser, onStatusChange, onEditClick, onUploadClick, getStatusStyles, statuses, StatusBadge }) => {
  const assignedStudents = students.filter(s => (lot.assignedStudents || []).includes(s.id));
  const studentsPresent = assignedStudents.filter(s => s.checkedIn);
  const lotStatusOptions = statuses.filter(s => s !== lot.status);

  const canEdit = hasPermission(currentUser, 'canEditLotStatus');
  const canEditDetails = hasPermission(currentUser, 'canEditLotDetails');
  const canUploadSignInSheets = hasPermission(currentUser, 'canUploadSignInSheets');

  // Get status-specific colors
  const statusColors = getStatusCardColors(lot.status);

  return (
    <MotionDiv
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl shadow-md p-4 border-2 transition-all duration-200
        ${statusColors.border} ${statusColors.bg}
        hover:shadow-lg
      `}
    >
      {/* Header with Status Badge */}
      <div className="flex items-start gap-3 mb-4">
        <StatusBadge status={lot.status} />
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{lot.name}</h3>
        </div>
      </div>

      {/* Lot Details */}
      <div className="space-y-2 mb-4">
        {/* Attendance Info - Shows AI-verified count when available */}
        {(() => {
          const hasAICount = lot.aiStudentCount !== undefined && lot.aiStudentCount !== null && lot.aiStudentCount !== '';
          const aiCount = hasAICount ? parseInt(lot.aiStudentCount) || 0 : null;
          const manualCount = lot.totalStudentsSignedUp || 0;
          const displayCount = hasAICount ? aiCount : manualCount;
          const countSource = lot.countSource || (hasAICount ? 'ai' : 'manual');
          const confidence = lot.aiConfidence || '';

          return (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                {hasAICount ? (
                  <Sparkles size={16} className="text-purple-500 dark:text-purple-400 flex-shrink-0" />
                ) : (
                  <Users size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                )}
                <span className="font-medium">
                  {displayCount} {displayCount === 1 ? 'student' : 'students'}
                </span>
                {hasAICount && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">
                    AI Verified
                  </span>
                )}
              </div>

              {/* Show both counts if they differ significantly */}
              {hasAICount && manualCount > 0 && Math.abs(aiCount - manualCount) > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 ml-6">
                  <UserCheck size={12} />
                  <span>Manual sign-up: {manualCount}</span>
                </div>
              )}

              {/* Show confidence level if available */}
              {hasAICount && confidence && confidence !== 'manual' && (
                <div className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                  Confidence: <span className="capitalize">{confidence}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Zone Info */}
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <MapPin size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span>Zone: <span className="capitalize font-medium">{lot.zone || lot.section}</span></span>
        </div>

        {/* Notes - High Priority Alert */}
        {lot.notes && (
          <div className="flex items-start gap-2 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-xs text-red-800 dark:text-red-300">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{lot.notes}</span>
          </div>
        )}

        {/* Comment - General Info */}
        {lot.comment && (
          <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg text-xs text-blue-800 dark:text-blue-300">
            <MessageSquare size={14} className="flex-shrink-0 mt-0.5" />
            <span>{lot.comment}</span>
          </div>
        )}
      </div>

      {/* Status Change Buttons - Only for admins */}
      {canEdit && onStatusChange && (
        <div className="space-y-2 mb-4">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
            Change Status
          </div>
          <div className="grid grid-cols-1 gap-2">
            {statuses.map(status => {
              const Icon = getStatusIcon(status);
              const label = getStatusLabel(status);
              const colors = getStatusCardColors(status);
              const isActive = lot.status === status;

              return (
                <button
                  key={status}
                  onClick={() => onStatusChange(lot.id, status)}
                  disabled={isActive}
                  aria-label={`Set status to ${label}`}
                  className={`
                    flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 border-2
                    ${isActive
                      ? `${colors.badgeBg} text-white cursor-default`
                      : `bg-white dark:bg-gray-800 ${colors.buttonBorder} ${colors.buttonText} ${colors.buttonHover} hover:-translate-y-0.5 active:translate-y-0`
                    }
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400
                    disabled:cursor-not-allowed
                    min-h-[44px]
                  `}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{isActive ? `Current: ${label}` : label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Sign-In Sheet Button - For admins and volunteers */}
      {canUploadSignInSheets && onUploadClick && (
        <div className="mb-4">
          <button
            onClick={() => onUploadClick(lot.id)}
            aria-label={`Upload sign-in sheet for ${lot.name}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-green-400 min-h-[44px]"
          >
            <Upload size={16} aria-hidden="true" />
            <span className="text-sm font-medium">Upload Sign-In Sheet</span>
          </button>
        </div>
      )}

      {/* View Sign-In Sheet Button - For admins and volunteers when image exists */}
      {(canEdit || canUploadSignInSheets) && lot.signUpSheetPhoto && lot.signUpSheetPhoto.trim() !== '' && (
        <div className="mb-4">
          <a
            href={lot.signUpSheetPhoto}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View sign-in sheet for ${lot.name}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[44px]"
          >
            <FileImage size={16} aria-hidden="true" />
            <span className="text-sm font-medium">View Sign-In Sheet</span>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      )}

      {/* Edit Button - Only for admins */}
      {canEditDetails && onEditClick && (
        <div className="mb-4">
          <button
            onClick={() => onEditClick(lot.id)}
            aria-label={`Edit details for ${lot.name}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[44px]"
          >
            <PenLine size={16} aria-hidden="true" />
            <span className="text-sm font-medium">Edit Details</span>
          </button>
        </div>
      )}

      {/* Read-only indicator for students */}
      {!canEdit && !canUploadSignInSheets && (
        <div className="mb-4 text-center">
          <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
            Read Only
          </span>
        </div>
      )}

      {/* Footer - Last Updated */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Clock size={12} aria-hidden="true" />
          <span>
            Updated: {lot.lastUpdated ? format(lot.lastUpdated, 'HH:mm') : 'N/A'} by {lot.updatedBy || 'Unknown'}
          </span>
        </div>
      </div>
    </MotionDiv>
  );
};

/**
 * List View Component - Compact table/list format
 */
const LotListView = ({ lots, students, currentUser, onStatusChange, onEditClick, getStatusStyles, statuses, StatusBadge }) => {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const canEdit = hasPermission(currentUser, 'canEditLotStatus');
  const canEditDetails = hasPermission(currentUser, 'canEditLotDetails');

  // Sort lots
  const sortedLots = useMemo(() => {
    return [...lots].sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'section':
          aVal = a.section;
          bVal = b.section;
          break;
        case 'attendance':
          const aStudents = students.filter(s => (a.assignedStudents || []).includes(s.id));
          const bStudents = students.filter(s => (b.assignedStudents || []).includes(s.id));
          aVal = aStudents.filter(s => s.checkedIn).length;
          bVal = bStudents.filter(s => s.checkedIn).length;
          break;
        case 'updated':
          aVal = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
          bVal = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [lots, students, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      aria-label={`Sort by ${children}`}
    >
      {children}
      <ArrowUpDown size={14} className={sortField === field ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} />
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <SortButton field="name">Lot Name</SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <SortButton field="status">Status</SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <SortButton field="section">Zone</SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <SortButton field="attendance">Attendance</SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <SortButton field="updated">Last Updated</SortButton>
              </th>
              {canEdit && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedLots.map((lot) => {
              const assignedStudents = students.filter(s => (lot.assignedStudents || []).includes(s.id));
              const studentsPresent = assignedStudents.filter(s => s.checkedIn);
              const statusColors = getStatusCardColors(lot.status);

              return (
                <motion.tr
                  key={lot.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-l-4 ${statusColors.border}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{lot.name}</div>
                    {(lot.notes || lot.comment) && (
                      <div className="flex gap-2 mt-1">
                        {lot.notes && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                            <AlertTriangle size={12} />
                            Note
                          </span>
                        )}
                        {lot.comment && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                            <MessageSquare size={12} />
                            Comment
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lot.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-gray-700 dark:text-gray-300">{lot.zone || lot.section}</span>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const hasAICount = lot.aiStudentCount !== undefined && lot.aiStudentCount !== null && lot.aiStudentCount !== '';
                      const aiCount = hasAICount ? parseInt(lot.aiStudentCount) || 0 : null;
                      const manualCount = lot.totalStudentsSignedUp || 0;
                      const displayCount = hasAICount ? aiCount : manualCount;

                      return (
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          {hasAICount ? (
                            <Sparkles size={14} className="text-purple-500 dark:text-purple-400" />
                          ) : (
                            <Users size={14} className="text-gray-500 dark:text-gray-400" />
                          )}
                          <span>{displayCount}</span>
                          {hasAICount && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                              AI
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {lot.lastUpdated ? format(lot.lastUpdated, 'HH:mm') : 'N/A'}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {canEditDetails && onEditClick && (
                          <button
                            onClick={() => onEditClick(lot.id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                            aria-label={`Edit ${lot.name}`}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile List View */}
      <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {sortedLots.map((lot) => {
          const assignedStudents = students.filter(s => (lot.assignedStudents || []).includes(s.id));
          const studentsPresent = assignedStudents.filter(s => s.checkedIn);
          const statusColors = getStatusCardColors(lot.status);

          return (
            <motion.div
              key={lot.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-4 border-l-4 ${statusColors.border} ${statusColors.bg}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900 dark:text-white">{lot.name}</h3>
                <StatusBadge status={lot.status} size="sm" />
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <MapPin size={14} className="text-gray-500 dark:text-gray-400" />
                  <span className="capitalize">{lot.zone || lot.section}</span>
                </div>
                {(() => {
                  const hasAICount = lot.aiStudentCount !== undefined && lot.aiStudentCount !== null && lot.aiStudentCount !== '';
                  const aiCount = hasAICount ? parseInt(lot.aiStudentCount) || 0 : null;
                  const manualCount = lot.totalStudentsSignedUp || 0;
                  const displayCount = hasAICount ? aiCount : manualCount;

                  return (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      {hasAICount ? (
                        <Sparkles size={14} className="text-purple-500 dark:text-purple-400" />
                      ) : (
                        <Users size={14} className="text-gray-500 dark:text-gray-400" />
                      )}
                      <span>{displayCount} {displayCount === 1 ? 'student' : 'students'}</span>
                      {hasAICount && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                          AI
                        </span>
                      )}
                    </div>
                  );
                })()}
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock size={14} />
                  <span>Updated: {lot.lastUpdated ? format(lot.lastUpdated, 'HH:mm') : 'N/A'}</span>
                </div>
              </div>

              {canEditDetails && onEditClick && (
                <button
                  onClick={() => onEditClick(lot.id)}
                  className="mt-3 w-full px-3 py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium"
                >
                  Edit Details
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Map View Component - Interactive Google Maps display
 */
const LotMapView = ({ lots, students, currentUser, onStatusChange, getStatusStyles, StatusBadge }) => {
  const [selectedLot, setSelectedLot] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);

  const canEdit = hasPermission(currentUser, 'canEditLotStatus');

  // Get user's assigned lot (for students)
  const assignedLot = useMemo(() => {
    if (currentUser.role === 'student') {
      return lots.find(lot => (lot.assignedStudents || []).includes(currentUser.id));
    }
    return null;
  }, [lots, currentUser]);

  // Request user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Continue without user location
        }
      );
    }
  }, []);

  // Get status color for markers
  const getMarkerColor = (status) => {
    const colors = getStatusCardColors(status);
    switch (status) {
      case 'complete': return '#10B981';
      case 'in-progress': return '#3B82F6';
      case 'needs-help': return '#EF4444';
      case 'pending-approval': return '#EAB308';
      case 'not-started': default: return '#6B7280';
    }
  };

  // Get directions to lot
  const getDirections = (lot) => {
    if (!lot.latitude || !lot.longitude) {
      alert('Location coordinates not available for this lot.');
      return;
    }

    const destination = `${lot.latitude},${lot.longitude}`;
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}${origin ? `&origin=${origin}` : ''}`;
    window.open(url, '_blank');
  };

  // Check if lots have coordinates
  const lotsWithCoordinates = lots.filter(lot => lot.latitude && lot.longitude);
  const hasCoordinates = lotsWithCoordinates.length > 0;

  if (!hasCoordinates) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <MapIcon size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Map View Not Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Parking lot location coordinates have not been configured yet.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Please contact an administrator to add latitude and longitude data to the parking lots.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Container - Placeholder for now */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="relative" style={{ height: '600px' }}>
          {/* Placeholder for Google Maps */}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <div className="text-center">
              <MapIcon size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Interactive Map View
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Google Maps integration will be displayed here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 max-w-md mx-auto">
                This feature requires Google Maps API configuration.
                The map will show all parking lot locations with color-coded markers based on status.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lot List with Directions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Parking Lots {assignedLot && '(Your assigned lot is highlighted)'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lotsWithCoordinates.map((lot) => {
            const assignedStudents = students.filter(s => (lot.assignedStudents || []).includes(s.id));
            const studentsPresent = assignedStudents.filter(s => s.checkedIn);
            const statusColors = getStatusCardColors(lot.status);
            const isAssigned = assignedLot?.id === lot.id;

            return (
              <div
                key={lot.id}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isAssigned
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 dark:ring-blue-400'
                    : `${statusColors.border} ${statusColors.bg}`
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {lot.name}
                      {isAssigned && (
                        <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                          Your Lot
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <MapPin size={14} />
                      <span className="capitalize">{lot.zone || lot.section}</span>
                    </div>
                  </div>
                  <StatusBadge status={lot.status} size="sm" />
                </div>

                {(() => {
                  const hasAICount = lot.aiStudentCount !== undefined && lot.aiStudentCount !== null && lot.aiStudentCount !== '';
                  const aiCount = hasAICount ? parseInt(lot.aiStudentCount) || 0 : null;
                  const manualCount = lot.totalStudentsSignedUp || 0;
                  const displayCount = hasAICount ? aiCount : manualCount;

                  return (
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {hasAICount ? (
                        <Sparkles size={14} className="text-purple-500 dark:text-purple-400" />
                      ) : (
                        <Users size={14} className="text-gray-500 dark:text-gray-400" />
                      )}
                      <span>{displayCount} {displayCount === 1 ? 'student' : 'students'}</span>
                      {hasAICount && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                          AI
                        </span>
                      )}
                    </div>
                  );
                })()}

                <button
                  onClick={() => getDirections(lot)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Navigation size={16} />
                  Get Directions
                  <ExternalLink size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Main Parking Lots Screen Component
 */
const ParkingLotsScreen = ({
  lots,
  students,
  currentUser,
  onLotStatusUpdate,
  onLotDetailsUpdate,
  onSignInSheetUpload,
  getStatusStyles,
  statuses,
  sections,
  StatusBadge
}) => {
  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('tbtc-lots-view-mode');
    return saved || 'card';
  });

  const [selectedLotId, setSelectedLotId] = useState(null);
  const [uploadLotId, setUploadLotId] = useState(null);
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem('tbtc-lots-view-mode', viewMode);
  }, [viewMode]);

  const canEdit = hasPermission(currentUser, 'canEditLotStatus');
  const canEditDetails = hasPermission(currentUser, 'canEditLotDetails');

  // Filtered lots
  const filteredLots = useMemo(() => {
    return lots.filter(lot => {
      // Use zone field from Google Sheet, fallback to section for backward compatibility
      const lotZone = lot.zone || lot.section;
      const sectionMatch = sectionFilter === "all" || lotZone === sectionFilter;
      const statusMatch = statusFilter === "all" || lot.status === statusFilter;
      const priorityMatch = priorityFilter === "all" || lot.priority === priorityFilter;
      return sectionMatch && statusMatch && priorityMatch;
    });
  }, [lots, sectionFilter, statusFilter, priorityFilter]);

  const lotToEdit = lots.find(l => l.id === selectedLotId);
  const lotToUpload = lots.find(l => l.id === uploadLotId);

  const handleEditClick = (lotId) => {
    if (canEditDetails) {
      setSelectedLotId(lotId);
    }
  };

  const handleUploadClick = (lotId) => {
    setUploadLotId(lotId);
  };

  const handleCloseModal = () => {
    setSelectedLotId(null);
  };

  const handleCloseUploadModal = () => {
    setUploadLotId(null);
  };

  const handleSaveLot = (lotId, updates) => {
    onLotDetailsUpdate(lotId, updates);
    setSelectedLotId(null);
  };

  const handlePhotoUpload = (lotId, photoData) => {
    onLotDetailsUpdate(lotId, { signUpSheetPhoto: photoData });
  };

  const handleSignInSheetSubmit = async (submissionData) => {
    await onSignInSheetUpload(submissionData);
    setUploadLotId(null);
  };

  return (
    <div className="space-y-6">
      {/* View Toggle and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">View & Filters</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">View:</span>
            <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700">
              <button
                onClick={() => setViewMode('card')}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                  ${viewMode === 'card'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
                aria-label="Card view"
                aria-pressed={viewMode === 'card'}
              >
                <Grid3x3 size={16} />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                  ${viewMode === 'list'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List size={16} />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                  ${viewMode === 'map'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
                aria-label="Map view"
                aria-pressed={viewMode === 'map'}
              >
                <MapIcon size={16} />
                <span className="hidden sm:inline">Map</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters - Hide in Map View */}
        {viewMode !== 'map' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter - MOVED TO FIRST POSITION */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  {statuses.map(status => {
                    const { label } = getStatusStyles(status);
                    return (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Zones Filter - MOVED TO SECOND POSITION */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zones
                </label>
                <select
                  value={sectionFilter}
                  onChange={e => setSectionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="all">All Zones</option>
                  {sections.map(section => (
                    <option key={section} value={section}>
                      {section.charAt(0).toUpperCase() + section.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter - KEPT IN THIRD POSITION */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(sectionFilter !== "all" || statusFilter !== "all" || priorityFilter !== "all") && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    setSectionFilter("all");
                    setStatusFilter("all");
                    setPriorityFilter("all");
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Results Count - Hide in Map View */}
      {viewMode !== 'map' && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredLots.length} of {lots.length} lots
          {!canEdit && <span className="ml-2 text-blue-600 dark:text-blue-400">(Read-only view)</span>}
        </div>
      )}

      {/* Content - Conditional based on view mode */}
      <AnimatePresence mode="wait">
        {viewMode === 'card' && (
          <motion.div
            key="card-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Lot Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredLots.map(lot => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  students={students}
                  currentUser={currentUser}
                  onStatusChange={canEdit ? onLotStatusUpdate : null}
                  onEditClick={canEditDetails ? handleEditClick : null}
                  onUploadClick={handleUploadClick}
                  getStatusStyles={getStatusStyles}
                  statuses={statuses}
                  StatusBadge={StatusBadge}
                />
              ))}
            </div>

            {/* Empty State */}
            {filteredLots.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No lots match the current filters.</p>
              </div>
            )}
          </motion.div>
        )}

        {viewMode === 'list' && (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {filteredLots.length > 0 ? (
              <LotListView
                lots={filteredLots}
                students={students}
                currentUser={currentUser}
                onStatusChange={onLotStatusUpdate}
                onEditClick={handleEditClick}
                getStatusStyles={getStatusStyles}
                statuses={statuses}
                StatusBadge={StatusBadge}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">No lots match the current filters.</p>
              </div>
            )}
          </motion.div>
        )}

        {viewMode === 'map' && (
          <motion.div
            key="map-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <LotMapView
              lots={lots}
              students={students}
              currentUser={currentUser}
              onStatusChange={onLotStatusUpdate}
              getStatusStyles={getStatusStyles}
              StatusBadge={StatusBadge}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal - Only for admins */}
      {canEditDetails && lotToEdit && (
        <LotEditModal
          lot={lotToEdit}
          onClose={handleCloseModal}
          onSave={handleSaveLot}
          onPhotoUpload={handlePhotoUpload}
        />
      )}

      {/* Sign-In Sheet Upload Modal - For admins and volunteers */}
      {lotToUpload && (
        <SignInSheetUploadModal
          lot={lotToUpload}
          onClose={handleCloseUploadModal}
          onSubmit={handleSignInSheetSubmit}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default ParkingLotsScreen;
export { LotCard };

