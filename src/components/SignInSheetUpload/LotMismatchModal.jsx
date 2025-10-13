/**
 * Lot Mismatch Detection Modal
 * Shows when uploaded sign-in sheet doesn't match the expected lot
 */

import React from 'react';
import { AlertTriangle, X, MapPin, FileWarning } from 'lucide-react';

const LotMismatchModal = ({ 
  expectedLot,
  detectedLot,
  detectedZone,
  confidence,
  onContinueAnyway, 
  onCancel,
  onRedirect,
  availableLots
}) => {
  // Try to find matching lot in available lots
  const matchingLot = availableLots?.find(lot => 
    lot.name?.toLowerCase().includes(detectedLot?.toLowerCase()) ||
    lot.zone?.toLowerCase().includes(detectedZone?.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
              <FileWarning className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Lot Mismatch Detected
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
          {/* Error Message */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  The uploaded sign-in sheet appears to be for a different parking lot
                </p>
                <div className="space-y-1 text-sm text-red-700 dark:text-red-300">
                  <p><strong>Expected lot:</strong> {expectedLot.name} ({expectedLot.zone})</p>
                  <p><strong>Detected on sheet:</strong> {detectedLot || 'Unknown'} {detectedZone ? `(${detectedZone})` : ''}</p>
                  {confidence && (
                    <p><strong>Detection confidence:</strong> {confidence}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>This usually happens when:</strong>
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
              <li>You accidentally selected the wrong lot card to upload from</li>
              <li>You're uploading a photo of the wrong sign-in sheet</li>
              <li>The lot name on the sheet is different from the system name</li>
            </ul>
          </div>

          {/* Matching Lot Suggestion */}
          {matchingLot && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Suggested correct lot:
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>{matchingLot.name}</strong> ({matchingLot.zone})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ Warning:</strong> Uploading to the wrong lot will cause incorrect student counts and confusion. Please verify before continuing.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          {/* Primary Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel Upload
            </button>
            {matchingLot && onRedirect && (
              <button
                onClick={() => onRedirect(matchingLot)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Upload to {matchingLot.name} Instead
              </button>
            )}
          </div>

          {/* Override Option */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onContinueAnyway}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              Continue Anyway (Override - Not Recommended)
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Only use this if you're certain the lot information is correct
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotMismatchModal;

