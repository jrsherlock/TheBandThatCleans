/**
 * TBTC Parking Lots Screen Component
 * Role-adaptive parking lots view with permission-based controls
 * Merges: Parking Lots + Director Dashboard + Volunteer View (lot grid)
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, MapPin, AlertTriangle, MessageSquare, Clock, PenLine, Filter, CheckCircle, Play,
  Grid3x3, List, Map as MapIcon, ArrowUpDown, Navigation, ExternalLink, Upload, FileImage,
  Sparkles, UserCheck, ChevronDown, Search, X
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { hasPermission } from '../utils/permissions.js';
import { isReadOnly } from '../utils/roleHelpers.jsx';
import { ProtectedButton, ProtectedSelect } from './ProtectedComponents.jsx';
import LotEditModal from './LotEditModal.jsx';
import SignInSheetUploadModal from './SignInSheetUpload/SignInSheetUploadModal.jsx';
import BulkSignInSheetUpload from './SignInSheetUpload/BulkSignInSheetUpload.jsx';
import DriveLinkButton from './DriveLinkButton.jsx';
import { LeafletMapView } from './LeafletMapView.jsx';

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
    case 'ready': return CheckCircle;
    // Backward compatibility: map old "not-started" to "ready"
    case 'not-started':
    default: return CheckCircle;
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
    case 'ready': return 'Ready';
    // Backward compatibility: map old "not-started" to "ready"
    case 'not-started':
    default: return 'Ready';
  }
};

/**
 * Helper function to get status border and background colors
 * Exported for use in LeafletMapView
 */
export const getStatusCardColors = (status) => {
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
    case 'ready':
      return {
        border: 'border-teal-500 dark:border-teal-400',
        bg: 'bg-teal-50/50 dark:bg-teal-900/10',
        badgeBg: 'bg-teal-500',
        buttonBorder: 'border-teal-500 dark:border-teal-400',
        buttonText: 'text-teal-700 dark:text-teal-300',
        buttonHover: 'hover:bg-teal-50 dark:hover:bg-teal-900/20'
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
    // Backward compatibility: map old "not-started" to "ready"
    case 'not-started':
    default:
      return {
        border: 'border-teal-500 dark:border-teal-400',
        bg: 'bg-teal-50/50 dark:bg-teal-900/10',
        badgeBg: 'bg-teal-500',
        buttonBorder: 'border-teal-500 dark:border-teal-400',
        buttonText: 'text-teal-700 dark:text-teal-300',
        buttonHover: 'hover:bg-teal-50 dark:hover:bg-teal-900/20'
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

      {/* Status Change Dropdown - Only for admins */}
      {canEdit && onStatusChange && (
        <div className="mb-4">
          <label
            htmlFor={`status-select-${lot.id}`}
            className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2"
          >
            Change Status
          </label>
          <div className="relative">
            <select
              id={`status-select-${lot.id}`}
              value={lot.status}
              onChange={(e) => onStatusChange(lot.id, e.target.value)}
              aria-label={`Change status for ${lot.name}`}
              className={`
                w-full appearance-none px-4 py-2.5 pr-10 rounded-lg text-sm font-medium
                transition-all duration-200 border-2
                bg-white dark:bg-gray-800
                ${getStatusCardColors(lot.status).buttonBorder}
                ${getStatusCardColors(lot.status).buttonText}
                hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400
                cursor-pointer
                min-h-[44px]
              `}
            >
              {statuses.map(status => {
                const label = getStatusLabel(status);
                return (
                  <option key={status} value={status}>
                    {lot.status === status ? `Current: ${label}` : label}
                  </option>
                );
              })}
            </select>
            <ChevronDown
              size={20}
              className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${getStatusCardColors(lot.status).buttonText}`}
              aria-hidden="true"
            />
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
          <DriveLinkButton
            url={lot.signUpSheetPhoto}
            lotName={lot.name}
          />
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
const LotListView = ({ lots, students, currentUser, onStatusChange, onEditClick, onUploadClick, getStatusStyles, statuses, StatusBadge }) => {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const canEdit = hasPermission(currentUser, 'canEditLotStatus');
  const canEditDetails = hasPermission(currentUser, 'canEditLotDetails');
  const canUploadSignInSheets = hasPermission(currentUser, 'canUploadSignInSheets');

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
              {(canEdit || canUploadSignInSheets) && (
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
                  {(canEdit || canUploadSignInSheets) && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Status Dropdown */}
                        {canEdit && onStatusChange && (
                          <select
                            value={lot.status}
                            onChange={(e) => onStatusChange(lot.id, e.target.value)}
                            aria-label={`Change status for ${lot.name}`}
                            className={`
                              text-xs px-2 py-1 rounded border-2 font-medium
                              transition-all duration-200
                              bg-white dark:bg-gray-800
                              ${getStatusCardColors(lot.status).buttonBorder}
                              ${getStatusCardColors(lot.status).buttonText}
                              hover:shadow-md
                              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400
                              cursor-pointer
                            `}
                          >
                            <option value={lot.status}>{getStatusLabel(lot.status)}</option>
                            {statuses.filter(s => s !== lot.status).map(status => (
                              <option key={status} value={status}>
                                {getStatusLabel(status)}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Upload Button */}
                        {canUploadSignInSheets && onUploadClick && (
                          <button
                            onClick={() => onUploadClick(lot.id)}
                            className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                            aria-label={`Upload sign-in sheet for ${lot.name}`}
                            title="Upload Sign-In Sheet"
                          >
                            <Upload size={16} />
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

              {/* Mobile Actions */}
              {(canEdit || canUploadSignInSheets) && (
                <div className="mt-3 flex gap-2">
                  {/* Status Dropdown */}
                  {canEdit && onStatusChange && (
                    <select
                      value={lot.status}
                      onChange={(e) => onStatusChange(lot.id, e.target.value)}
                      aria-label={`Change status for ${lot.name}`}
                      className={`
                        flex-1 text-xs px-3 py-2 rounded-lg border-2 font-medium
                        transition-all duration-200
                        bg-white dark:bg-gray-800
                        ${getStatusCardColors(lot.status).buttonBorder}
                        ${getStatusCardColors(lot.status).buttonText}
                        hover:shadow-md
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400
                        cursor-pointer
                      `}
                    >
                      <option value={lot.status}>{getStatusLabel(lot.status)}</option>
                      {statuses.filter(s => s !== lot.status).map(status => (
                        <option key={status} value={status}>
                          {getStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Upload Button */}
                  {canUploadSignInSheets && onUploadClick && (
                    <button
                      onClick={() => onUploadClick(lot.id)}
                      className="px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors flex items-center gap-2 text-xs font-medium"
                      aria-label={`Upload sign-in sheet for ${lot.name}`}
                    >
                      <Upload size={14} />
                      <span>Upload</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Map View Component - Leaflet/OpenStreetMap Integration
 * Wrapper component that delegates to LeafletMapView
 */
const LotMapView = ({ lots, students, currentUser, onStatusChange, getStatusStyles, StatusBadge }) => {
  return (
    <LeafletMapView
      lots={lots}
      students={students}
      currentUser={currentUser}
      onStatusChange={onStatusChange}
      getStatusStyles={getStatusStyles}
      StatusBadge={StatusBadge}
    />
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
  onBulkSignInSheetUpload,
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
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

      // Search filter - case-insensitive match on lot name
      const searchMatch = searchQuery.trim() === "" ||
        lot.name.toLowerCase().includes(searchQuery.toLowerCase());

      return sectionMatch && statusMatch && priorityMatch && searchMatch;
    });
  }, [lots, sectionFilter, statusFilter, priorityFilter, searchQuery]);

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

  const handleBulkUploadSubmit = async (files, progressCallback) => {
    return await onBulkSignInSheetUpload(files, progressCallback);
  };

  const canUploadSignInSheets = hasPermission(currentUser, 'canUploadSignInSheets');

  return (
    <div className="space-y-6">
      {/* Bulk Upload Button - For admins and volunteers */}
      {canUploadSignInSheets && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
                <Upload className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bulk Sign-In Sheet Upload
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload up to 21 sign-in sheets at once with automatic lot identification
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBulkUpload(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Upload size={20} />
              <span className="font-medium">Upload Multiple Sheets</span>
            </button>
          </div>
        </div>
      )}

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
            {/* Search Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Lots
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lots by name..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

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
            {(sectionFilter !== "all" || statusFilter !== "all" || priorityFilter !== "all" || searchQuery !== "") && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    setSectionFilter("all");
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setSearchQuery("");
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
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? `No lots found matching "${searchQuery}"` : 'No lots match the current filters.'}
                </p>
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
                onUploadClick={handleUploadClick}
                getStatusStyles={getStatusStyles}
                statuses={statuses}
                StatusBadge={StatusBadge}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? `No lots found matching "${searchQuery}"` : 'No lots match the current filters.'}
                </p>
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
          availableLots={lots}
        />
      )}

      {/* Bulk Sign-In Sheet Upload Modal - For admins and volunteers */}
      {showBulkUpload && (
        <BulkSignInSheetUpload
          onClose={() => setShowBulkUpload(false)}
          onSubmit={handleBulkUploadSubmit}
          currentUser={currentUser}
          availableLots={lots}
        />
      )}
    </div>
  );
};

export default ParkingLotsScreen;
export { LotCard };

