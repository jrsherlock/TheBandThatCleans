import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

/**
 * SyncStatusIndicator Component
 * 
 * Displays sync status in the footer with color-coded indicators
 * 
 * @param {Object} props
 * @param {string} props.pollingStatus - Current polling status ('active' | 'paused' | 'error')
 * @param {Date} props.lastUpdated - Timestamp of last successful update
 * @param {number} props.pollingInterval - Polling interval in milliseconds
 * @param {string} props.pollingError - Error message if polling failed
 * @param {Function} props.onRetry - Callback to retry after error
 */
const SyncStatusIndicator = ({ 
  pollingStatus, 
  lastUpdated, 
  pollingInterval = 30000,
  pollingError,
  onRetry 
}) => {
  const [relativeTime, setRelativeTime] = useState('');

  // Update relative time every second
  useEffect(() => {
    const updateRelativeTime = () => {
      if (lastUpdated) {
        try {
          setRelativeTime(formatDistanceToNow(lastUpdated, { addSuffix: true }));
        } catch (error) {
          setRelativeTime('recently');
        }
      } else {
        setRelativeTime('never');
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  const getStatusColor = () => {
    switch (pollingStatus) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-gray-400';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    const intervalSeconds = Math.floor(pollingInterval / 1000);
    
    switch (pollingStatus) {
      case 'active':
        return `Auto-updating every ${intervalSeconds}s`;
      case 'paused':
        return 'Auto-update paused';
      case 'error':
        return 'Sync error';
      default:
        return 'Unknown status';
    }
  };

  const getTooltipText = () => {
    if (pollingError) {
      return `Error: ${pollingError}`;
    }
    
    if (lastUpdated) {
      try {
        return `Last updated: ${lastUpdated.toLocaleString()}`;
      } catch (error) {
        return 'Last updated: Unknown';
      }
    }
    
    return 'Not yet updated';
  };

  return (
    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
      {/* Status indicator dot */}
      <div className="flex items-center gap-2" title={getTooltipText()}>
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${pollingStatus === 'active' ? 'animate-pulse' : ''}`} />
        <span>{getStatusText()}</span>
      </div>

      {/* Last updated timestamp */}
      {lastUpdated && (
        <>
          <span className="text-gray-400 dark:text-gray-600">•</span>
          <span title={getTooltipText()}>
            Last updated {relativeTime}
          </span>
        </>
      )}

      {/* Retry button for errors */}
      {pollingStatus === 'error' && onRetry && (
        <>
          <span className="text-gray-400 dark:text-gray-600">•</span>
          <button
            onClick={onRetry}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Retry now
          </button>
        </>
      )}
    </div>
  );
};

export default SyncStatusIndicator;

