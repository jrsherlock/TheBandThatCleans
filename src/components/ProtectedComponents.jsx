/**
 * TBTC Protected Components
 * Reusable components with built-in permission checks
 */

import React from 'react';
import { hasPermission } from '../utils/permissions.js';
import { getPermissionDeniedMessage } from '../utils/roleHelpers.jsx';
import { toast } from 'react-hot-toast';

/**
 * Protected Button - Only renders if user has permission
 * Shows tooltip on hover if permission denied
 */
export const ProtectedButton = ({ 
  currentUser, 
  requiredPermission, 
  onClick, 
  children, 
  className = '',
  showTooltip = true,
  disabled = false,
  ...props 
}) => {
  const hasAccess = hasPermission(currentUser, requiredPermission);
  
  const handleClick = (e) => {
    if (!hasAccess) {
      e.preventDefault();
      if (showTooltip) {
        toast.error(getPermissionDeniedMessage(requiredPermission));
      }
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };
  
  if (!hasAccess) {
    return null; // Don't render button if no permission
  }
  
  return (
    <button
      onClick={handleClick}
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Protected Input - Becomes read-only if user lacks permission
 */
export const ProtectedInput = ({ 
  currentUser, 
  requiredPermission, 
  value,
  onChange,
  className = '',
  readOnlyClassName = '',
  ...props 
}) => {
  const hasAccess = hasPermission(currentUser, requiredPermission);
  
  if (!hasAccess) {
    return (
      <input
        value={value}
        readOnly
        className={`${className} ${readOnlyClassName} cursor-not-allowed bg-gray-100 dark:bg-gray-700`}
        {...props}
      />
    );
  }
  
  return (
    <input
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    />
  );
};

/**
 * Protected Select - Becomes disabled if user lacks permission
 */
export const ProtectedSelect = ({ 
  currentUser, 
  requiredPermission, 
  value,
  onChange,
  children,
  className = '',
  ...props 
}) => {
  const hasAccess = hasPermission(currentUser, requiredPermission);
  
  const handleChange = (e) => {
    if (!hasAccess) {
      toast.error(getPermissionDeniedMessage(requiredPermission));
      return;
    }
    if (onChange) {
      onChange(e);
    }
  };
  
  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={!hasAccess}
      className={`${className} ${!hasAccess ? 'cursor-not-allowed opacity-60' : ''}`}
      {...props}
    >
      {children}
    </select>
  );
};

/**
 * Protected Textarea - Becomes read-only if user lacks permission
 */
export const ProtectedTextarea = ({ 
  currentUser, 
  requiredPermission, 
  value,
  onChange,
  className = '',
  readOnlyClassName = '',
  ...props 
}) => {
  const hasAccess = hasPermission(currentUser, requiredPermission);
  
  if (!hasAccess) {
    return (
      <textarea
        value={value}
        readOnly
        className={`${className} ${readOnlyClassName} cursor-not-allowed bg-gray-100 dark:bg-gray-700`}
        {...props}
      />
    );
  }
  
  return (
    <textarea
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    />
  );
};

/**
 * Protected Link - Only renders if user has permission
 */
export const ProtectedLink = ({ 
  currentUser, 
  requiredPermission, 
  onClick,
  children,
  className = '',
  ...props 
}) => {
  const hasAccess = hasPermission(currentUser, requiredPermission);
  
  if (!hasAccess) {
    return null;
  }
  
  return (
    <a
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
    </a>
  );
};

/**
 * Protected Icon Button - Only renders if user has permission
 */
export const ProtectedIconButton = ({ 
  currentUser, 
  requiredPermission, 
  onClick,
  icon: Icon,
  title = '',
  className = '',
  ...props 
}) => {
  const hasAccess = hasPermission(currentUser, requiredPermission);
  
  const handleClick = (e) => {
    if (!hasAccess) {
      e.preventDefault();
      toast.error(getPermissionDeniedMessage(requiredPermission));
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };
  
  if (!hasAccess) {
    return null;
  }
  
  return (
    <button
      onClick={handleClick}
      title={title}
      className={className}
      {...props}
    >
      {Icon && <Icon />}
    </button>
  );
};

/**
 * Conditional Wrapper - Wraps children with wrapper component only if condition is true
 */
export const ConditionalWrapper = ({ condition, wrapper, children }) => {
  return condition ? wrapper(children) : children;
};

/**
 * Read-Only Badge - Shows when component is in read-only mode
 */
export const ReadOnlyBadge = ({ show = true, className = '' }) => {
  if (!show) return null;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded ${className}`}>
      Read Only
    </span>
  );
};

/**
 * Permission Denied Message - Shows when user tries to access restricted feature
 */
export const PermissionDeniedMessage = ({ permission, className = '' }) => {
  return (
    <div className={`p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg ${className}`}>
      <p className="text-sm text-yellow-800 dark:text-yellow-200">
        {getPermissionDeniedMessage(permission)}
      </p>
    </div>
  );
};

export default {
  ProtectedButton,
  ProtectedInput,
  ProtectedSelect,
  ProtectedTextarea,
  ProtectedLink,
  ProtectedIconButton,
  ConditionalWrapper,
  ReadOnlyBadge,
  PermissionDeniedMessage
};

