/**
 * TBTC Parking Lots Screen Component
 * Role-adaptive parking lots view with permission-based controls
 * Merges: Parking Lots + Director Dashboard + Volunteer View (lot grid)
 */

import React, { useState, useMemo } from 'react';
import {
  Users, MapPin, AlertTriangle, MessageSquare, Clock, PenLine, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { hasPermission } from '../utils/permissions.js';
import { isReadOnly } from '../utils/roleHelpers.jsx';
import { ProtectedButton, ProtectedSelect } from './ProtectedComponents.jsx';
import LotEditModal from './LotEditModal.jsx';

const MotionDiv = motion.div;

/**
 * Enhanced LotCard with permission checks
 */
const LotCard = ({ lot, students, currentUser, onStatusChange, onEditClick, getStatusStyles, statuses, StatusBadge }) => {
  const assignedStudents = students.filter(s => (lot.assignedStudents || []).includes(s.id));
  const studentsPresent = assignedStudents.filter(s => s.checkedIn);
  const lotStatusOptions = statuses.filter(s => s !== lot.status);
  
  const canEdit = hasPermission(currentUser, 'canEditLotStatus');
  const canEditDetails = hasPermission(currentUser, 'canEditLotDetails');

  return (
    <MotionDiv 
      layout 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-indigo-500 dark:border-indigo-400 transition-colors duration-200"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">{lot.name}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
            <MapPin size={14} />
            <span className="capitalize">{lot.section} Section</span>
          </div>
        </div>
        <StatusBadge status={lot.status} />
      </div>

      <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
        <Users size={16} className="text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {studentsPresent.length} / {assignedStudents.length} present
        </span>
      </div>

      {lot.notes && (
        <div className="p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-xs text-red-800 dark:text-red-300 mb-3">
          <AlertTriangle size={12} className="inline mr-1" /> {lot.notes}
        </div>
      )}

      {lot.comment && (
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded text-xs text-yellow-800 dark:text-yellow-300 mb-3">
          <MessageSquare size={12} className="inline mr-1" /> {lot.comment}
        </div>
      )}

      {/* Status Change Buttons - Only for admins */}
      {canEdit && (
        <div className="flex flex-wrap gap-2 mb-3">
          {lotStatusOptions.map(status => {
            const { label, color } = getStatusStyles(status);
            return (
              <button
                key={status}
                onClick={() => onStatusChange(lot.id, status)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                            bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600
                `}
                style={{ backgroundColor: getStatusStyles(status).color }}
              >
                Set to {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Edit Button - Only for admins */}
      {canEditDetails && onEditClick && (
        <div className="mb-3">
          <button 
            onClick={() => onEditClick(lot.id)} 
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
          >
            <PenLine size={16} />
            <span className="text-sm">Edit Details</span>
          </button>
        </div>
      )}

      {/* Read-only indicator for non-admins */}
      {!canEdit && (
        <div className="mb-3 text-center">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
            Read Only
          </span>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Updated: {lot.lastUpdated ? format(lot.lastUpdated, 'HH:mm') : 'N/A'} by {lot.updatedBy}
      </div>
    </MotionDiv>
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
  getStatusStyles,
  statuses,
  sections,
  StatusBadge
}) => {
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const canEdit = hasPermission(currentUser, 'canEditLotStatus');
  const canEditDetails = hasPermission(currentUser, 'canEditLotDetails');

  // Filtered lots
  const filteredLots = useMemo(() => {
    return lots.filter(lot => {
      const sectionMatch = sectionFilter === "all" || lot.section === sectionFilter;
      const statusMatch = statusFilter === "all" || lot.status === statusFilter;
      const priorityMatch = priorityFilter === "all" || lot.priority === priorityFilter;
      return sectionMatch && statusMatch && priorityMatch;
    });
  }, [lots, sectionFilter, statusFilter, priorityFilter]);

  const lotToEdit = lots.find(l => l.id === selectedLotId);

  const handleEditClick = (lotId) => {
    if (canEditDetails) {
      setSelectedLotId(lotId);
    }
  };

  const handleCloseModal = () => {
    setSelectedLotId(null);
  };

  const handleSaveLot = (lotId, updates) => {
    onLotDetailsUpdate(lotId, updates);
    setSelectedLotId(null);
  };

  const handlePhotoUpload = (lotId, photoData) => {
    onLotDetailsUpdate(lotId, { signUpSheetPhoto: photoData });
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={20} className="text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Section Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section
            </label>
            <select
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all">All Sections</option>
              {sections.map(section => (
                <option key={section} value={section}>
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
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

          {/* Priority Filter */}
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
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredLots.length} of {lots.length} lots
        {!canEdit && <span className="ml-2 text-blue-600 dark:text-blue-400">(Read-only view)</span>}
      </div>

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

      {/* Edit Modal - Only for admins */}
      {canEditDetails && lotToEdit && (
        <LotEditModal
          lot={lotToEdit}
          onClose={handleCloseModal}
          onSave={handleSaveLot}
          onPhotoUpload={handlePhotoUpload}
        />
      )}
    </div>
  );
};

export default ParkingLotsScreen;
export { LotCard };

