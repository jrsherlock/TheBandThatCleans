/**
 * Re-upload Warning Modal
 * Shows when user attempts to upload a sign-in sheet for a lot that already has one
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { format } from 'date-fns';

const ReuploadWarningModal = ({ 
  lot, 
  onContinue, 
  onCancel 
}) => {
  const previousCount = lot.aiStudentCount || lot.totalStudentsSignedUp || 0;
  const uploadedBy = lot.countEnteredBy || 'Unknown';
  const uploadedAt = lot.lastUpdated ? new Date(lot.lastUpdated) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
              <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Re-upload Sign-In Sheet?
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
              This lot already has a sign-in sheet uploaded
            </p>
            <div className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
              <p><strong>Previous count:</strong> {previousCount} students</p>
              <p><strong>Uploaded by:</strong> {uploadedBy}</p>
              {uploadedAt && (
                <p><strong>Uploaded at:</strong> {format(uploadedAt, 'MMM d, yyyy h:mm a')}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Common reasons to re-upload:</strong>
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
              <li>Correcting a bad scan or blurry image</li>
              <li>Updating count after more students signed in</li>
              <li>Reprocessing with improved AI</li>
              <li>Fixing an incorrect count</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> The new count will replace the previous count across all displays (Dashboard, Header, Students Tab).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium"
          >
            Continue with Re-upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReuploadWarningModal;

