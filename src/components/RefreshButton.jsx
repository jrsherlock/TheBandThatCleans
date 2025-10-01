import React from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * RefreshButton Component
 * 
 * Displays a manual refresh button with loading state and last updated timestamp
 * 
 * @param {Object} props
 * @param {Function} props.onRefresh - Callback when refresh button is clicked
 * @param {boolean} props.isRefreshing - Whether refresh is in progress
 * @param {Date} props.lastUpdated - Timestamp of last successful update
 * @param {boolean} props.disabled - Whether button is disabled
 */
const RefreshButton = ({ onRefresh, isRefreshing, lastUpdated, disabled = false }) => {
  const handleClick = async () => {
    if (!isRefreshing && !disabled && onRefresh) {
      await onRefresh();
    }
  };

  const getLastUpdatedText = () => {
    if (!lastUpdated) return 'Never updated';
    
    try {
      return `Updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}`;
    } catch (error) {
      return 'Recently updated';
    }
  };

  const getExactTimestamp = () => {
    if (!lastUpdated) return '';
    
    try {
      return lastUpdated.toLocaleString();
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isRefreshing || disabled}
        className={`
          p-2 rounded-lg transition-all duration-200
          ${isRefreshing || disabled
            ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50'
            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          }
        `}
        aria-label="Refresh data"
        title={getExactTimestamp() || 'Refresh data'}
      >
        <RefreshCw
          className={`
            text-gray-700 dark:text-gray-300
            ${isRefreshing ? 'animate-spin' : ''}
          `}
          size={20}
        />
      </button>
      
      {lastUpdated && (
        <span
          className="hidden sm:block text-xs text-gray-500 dark:text-gray-400"
          title={getExactTimestamp()}
        >
          {getLastUpdatedText()}
        </span>
      )}
    </div>
  );
};

export default RefreshButton;

