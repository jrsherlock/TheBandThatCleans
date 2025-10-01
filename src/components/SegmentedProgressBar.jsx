/**
 * Segmented Progress Bar Component
 * Displays a horizontal bar where each segment represents one parking lot,
 * color-coded by status and grouped by status type.
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;

/**
 * Individual lot segment with hover tooltip
 */
const LotSegment = ({ lot, getStatusStyles, index, totalLots }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { label, color } = getStatusStyles(lot.status);
  
  // Convert Tailwind color class to actual color value for styling
  const getColorValue = (colorClass) => {
    const colorMap = {
      'bg-gray-500': '#6B7280',
      'bg-blue-500': '#3B82F6',
      'bg-red-500': '#EF4444',
      'bg-yellow-500': '#EAB308',
      'bg-green-500': '#10B981',
    };
    return colorMap[colorClass] || '#6B7280';
  };

  const segmentColor = getColorValue(color);
  
  // Calculate width percentage for each segment
  const widthPercent = (1 / totalLots) * 100;

  return (
    <div
      className="relative flex-shrink-0 h-full cursor-pointer transition-all duration-200 hover:brightness-110"
      style={{
        width: `${widthPercent}%`,
        backgroundColor: segmentColor,
        minWidth: '4px', // Ensure segments are visible even with many lots
        overflow: 'visible'
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 mb-2 pointer-events-none"
            style={{
              transform: 'translateX(-50%)',
              zIndex: 9999
            }}
          >
            <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-xl whitespace-nowrap border border-gray-700 dark:border-gray-600">
              <div className="font-bold text-white">{lot.name}</div>
              <div className="text-gray-300">{label}</div>
              <div className="text-gray-400">
                {lot.totalStudentsSignedUp || 0} students
              </div>
              {/* Tooltip arrow */}
              <div
                className="absolute left-1/2"
                style={{
                  top: '100%',
                  transform: 'translateX(-50%)',
                  marginTop: '-1px'
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid #1F2937'
                  }}
                ></div>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Main Segmented Progress Bar Component
 */
const SegmentedProgressBar = ({ lots, getStatusStyles, stats }) => {
  // Define the status order for grouping
  const statusOrder = ['not-started', 'in-progress', 'needs-help', 'pending-approval', 'complete'];
  
  // Group and sort lots by status
  const groupedLots = useMemo(() => {
    const grouped = {};
    
    // Initialize groups
    statusOrder.forEach(status => {
      grouped[status] = [];
    });
    
    // Group lots by status
    lots.forEach(lot => {
      if (grouped[lot.status]) {
        grouped[lot.status].push(lot);
      }
    });
    
    // Flatten in the correct order
    return statusOrder.flatMap(status => grouped[status]);
  }, [lots]);

  const percentageComplete = stats.totalLots > 0 
    ? Math.round(stats.completedLots / stats.totalLots * 100) 
    : 0;

  // Calculate status counts for the legend
  const statusCounts = useMemo(() => {
    return statusOrder.map(status => ({
      status,
      count: lots.filter(l => l.status === status).length,
      ...getStatusStyles(status)
    }));
  }, [lots, statusOrder, getStatusStyles]);

  if (!lots || lots.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Progress</h3>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">0%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-1">
            No lots available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Progress</h3>
        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{percentageComplete}%</span>
      </div>

      {/* Segmented Progress Bar */}
      <div className="w-full mb-4 relative" style={{ paddingTop: '60px', marginTop: '-60px' }}>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 flex overflow-visible relative" style={{ overflow: 'visible' }}>
          {groupedLots.map((lot, index) => (
            <LotSegment
              key={lot.id}
              lot={lot}
              getStatusStyles={getStatusStyles}
              index={index}
              totalLots={lots.length}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center text-xs">
        {statusCounts.map(({ status, count, label, color }) => {
          if (count === 0) return null;
          
          const colorMap = {
            'bg-gray-500': 'bg-gray-500',
            'bg-blue-500': 'bg-blue-500',
            'bg-red-500': 'bg-red-500',
            'bg-yellow-500': 'bg-yellow-500',
            'bg-green-500': 'bg-green-500',
          };
          
          return (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${colorMap[color]}`}></div>
              <span className="text-gray-700 dark:text-gray-300">
                {label}: <span className="font-semibold">{count}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Helper text */}
      <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
        Hover over segments to see lot details
      </div>
    </div>
  );
};

export default SegmentedProgressBar;

