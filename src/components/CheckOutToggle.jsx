/**
 * Check-Out Toggle Component
 * Allows Parent Volunteers and Directors to enable/disable student check-outs
 * Per-event toggle control
 */

import React from 'react';
import { Lock, Unlock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { hasPermission } from '../utils/permissions.js';
import { ProtectedSection } from '../utils/roleHelpers.jsx';

const CheckOutToggle = ({ currentUser, checkOutEnabled, onToggle, eventName }) => {
  // Check if user has permission to control check-outs
  const canControl = hasPermission(currentUser, 'canControlCheckOuts');

  const handleToggle = () => {
    if (!canControl) {
      toast.error("You don't have permission to control check-outs.");
      return;
    }

    const newState = !checkOutEnabled;
    onToggle(newState);

    if (newState) {
      toast.success('Student check-outs are now ENABLED', {
        icon: '🟢',
        duration: 4000
      });
    } else {
      toast.success('Student check-outs are now DISABLED', {
        icon: '🔴',
        duration: 4000
      });
    }
  };

  return (
    <ProtectedSection
      currentUser={currentUser}
      requiredPermission="canControlCheckOuts"
      fallback={null}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {checkOutEnabled ? (
              <Unlock className="text-green-600 dark:text-green-400" size={24} />
            ) : (
              <Lock className="text-red-600 dark:text-red-400" size={24} />
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Student Check-Outs
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {eventName ? `For ${eventName}` : 'Current Event'}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggle}
            disabled={!canControl}
            className={`
              relative inline-flex h-8 w-14 items-center rounded-full transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              ${checkOutEnabled 
                ? 'bg-green-600 dark:bg-green-500' 
                : 'bg-red-600 dark:bg-red-500'
              }
              ${!canControl ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            role="switch"
            aria-checked={checkOutEnabled}
            aria-label="Toggle student check-outs"
          >
            <span
              className={`
                inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                ${checkOutEnabled ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Status Message */}
        <div className={`
          mt-3 p-3 rounded-lg text-sm
          ${checkOutEnabled 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }
        `}>
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <p>
              {checkOutEnabled 
                ? 'Students can now check out using the master check-out QR code. They will be removed from their assigned lots.'
                : 'Students cannot check out at this time. Enable check-outs when cleanup is complete and you\'re ready for students to leave.'
              }
            </p>
          </div>
        </div>

        {/* Permission Info for Admins */}
        {hasPermission(currentUser, 'canCheckInStudents') && (
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            <p>
              <strong>Note:</strong> This toggle is per-event. When enabled, students can scan the master 
              check-out QR code to sign out. Check-in times are always preserved in the attendance log.
            </p>
          </div>
        )}
      </div>
    </ProtectedSection>
  );
};

export default CheckOutToggle;

