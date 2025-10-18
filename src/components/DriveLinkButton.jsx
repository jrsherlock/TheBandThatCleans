/**
 * DriveLinkButton Component
 * Reusable button for viewing Google Drive sign-in sheet images
 * 
 * Features:
 * - Opens Drive URLs in new tab
 * - Permission-based visibility
 * - Accessible design with ARIA labels
 * - Dark mode support
 * - Hover animations
 */

import React from 'react';
import { FileImage, ExternalLink } from 'lucide-react';

/**
 * DriveLinkButton - Button to view sign-in sheet images stored in Google Drive
 * 
 * @param {Object} props
 * @param {string} props.url - Google Drive URL to open
 * @param {string} props.lotName - Name of the parking lot (for accessibility)
 * @param {string} [props.label="View Sign-In Sheet"] - Button label text
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.compact=false] - Use compact styling
 * @param {Function} [props.onClick] - Optional click handler (called before opening URL)
 */
const DriveLinkButton = ({ 
  url, 
  lotName, 
  label = "View Sign-In Sheet",
  className = "",
  compact = false,
  onClick
}) => {
  // Don't render if no URL provided
  if (!url || url.trim() === '') {
    return null;
  }

  const handleClick = (e) => {
    // Call optional onClick handler
    if (onClick) {
      onClick(e);
    }
    // URL opening is handled by the <a> tag
  };

  // Compact styling for list views or tight spaces
  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        aria-label={`View sign-in sheet for ${lotName}`}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5
          bg-blue-100 dark:bg-blue-900/40 
          text-blue-700 dark:text-blue-300 
          rounded-md
          hover:bg-blue-200 dark:hover:bg-blue-900/60 
          transition-all duration-200
          hover:-translate-y-0.5 active:translate-y-0
          focus:outline-none focus:ring-2 focus:ring-offset-2 
          focus:ring-blue-500 dark:focus:ring-blue-400
          text-xs font-medium
          ${className}
        `}
      >
        <FileImage size={14} aria-hidden="true" />
        <span>{label}</span>
        <ExternalLink size={12} aria-hidden="true" />
      </a>
    );
  }

  // Full-width styling for card views
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={`View sign-in sheet for ${lotName}`}
      className={`
        w-full flex items-center justify-center gap-2 
        px-4 py-2.5 
        bg-blue-100 dark:bg-blue-900/40 
        text-blue-700 dark:text-blue-300 
        rounded-lg 
        hover:bg-blue-200 dark:hover:bg-blue-900/60 
        transition-all duration-200 
        hover:-translate-y-0.5 active:translate-y-0 
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        focus:ring-blue-500 dark:focus:ring-blue-400 
        min-h-[44px]
        ${className}
      `}
    >
      <FileImage size={16} aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
      <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
};

export default DriveLinkButton;

