/**
 * TBTC Role Helper Utilities
 * Helper functions and components for role-based UI rendering
 */

import React from 'react';
import { hasPermission, isAdmin, isVolunteer, isStudent } from './permissions.js';

/**
 * Higher-order component that wraps a component with permission check
 * Only renders the component if user has the required permission
 * 
 * @param {React.Component} Component - Component to wrap
 * @param {string} requiredPermission - Permission name required to render
 * @param {React.Component} FallbackComponent - Optional component to render if permission denied
 * @returns {React.Component} - Wrapped component
 */
export const withPermission = (Component, requiredPermission, FallbackComponent = null) => {
  return ({ currentUser, ...props }) => {
    if (!hasPermission(currentUser, requiredPermission)) {
      return FallbackComponent ? <FallbackComponent {...props} /> : null;
    }
    return <Component currentUser={currentUser} {...props} />;
  };
};

/**
 * Component that conditionally renders children based on permission
 * 
 * Usage:
 * <ProtectedSection currentUser={user} requiredPermission="canEditLots">
 *   <EditButton />
 * </ProtectedSection>
 */
export const ProtectedSection = ({ currentUser, requiredPermission, children, fallback = null }) => {
  if (!hasPermission(currentUser, requiredPermission)) {
    return fallback;
  }
  return <>{children}</>;
};

/**
 * Component that conditionally renders children based on user role
 * 
 * Usage:
 * <RoleBasedRender currentUser={user} allowedRoles={['admin', 'volunteer']}>
 *   <SomeComponent />
 * </RoleBasedRender>
 */
export const RoleBasedRender = ({ currentUser, allowedRoles, children, fallback = null }) => {
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return fallback;
  }
  return <>{children}</>;
};

/**
 * Component that renders different content based on user role
 * 
 * Usage:
 * <RoleSwitch currentUser={user}>
 *   <RoleCase role="admin"><AdminView /></RoleCase>
 *   <RoleCase role="volunteer"><VolunteerView /></RoleCase>
 *   <RoleCase role="student"><StudentView /></RoleCase>
 *   <RoleDefault><DefaultView /></RoleDefault>
 * </RoleSwitch>
 */
export const RoleSwitch = ({ currentUser, children }) => {
  const childArray = React.Children.toArray(children);
  
  // Find matching role case
  const matchingCase = childArray.find(child => {
    if (child.type === RoleCase) {
      return child.props.role === currentUser?.role;
    }
    return false;
  });
  
  if (matchingCase) {
    return matchingCase;
  }
  
  // Find default case
  const defaultCase = childArray.find(child => child.type === RoleDefault);
  return defaultCase || null;
};

export const RoleCase = ({ children }) => <>{children}</>;
export const RoleDefault = ({ children }) => <>{children}</>;

/**
 * Hook to get current user's permissions
 * 
 * Usage:
 * const { canEdit, canDelete } = usePermissions(currentUser, ['canEditLots', 'canDeleteLots']);
 */
export const usePermissions = (currentUser, permissionNames) => {
  const permissions = {};
  
  permissionNames.forEach(permissionName => {
    permissions[permissionName] = hasPermission(currentUser, permissionName);
  });
  
  return permissions;
};

/**
 * Get appropriate view component based on user role
 * 
 * @param {Object} currentUser - User object with role property
 * @param {Object} components - Object with role keys and component values
 * @returns {React.Component} - Component for user's role
 */
export const getRoleComponent = (currentUser, components) => {
  if (!currentUser?.role) {
    return components.default || null;
  }
  
  return components[currentUser.role] || components.default || null;
};

/**
 * Filter data based on user role and permissions
 * 
 * @param {Array} data - Array of data items
 * @param {Object} currentUser - User object with role property
 * @param {Function} filterFn - Filter function that takes (item, user) and returns boolean
 * @returns {Array} - Filtered data
 */
export const filterByRole = (data, currentUser, filterFn) => {
  if (!data || !Array.isArray(data)) return [];
  return data.filter(item => filterFn(item, currentUser));
};

/**
 * Get UI mode based on user permissions
 * 
 * @param {Object} currentUser - User object with role property
 * @param {string} permission - Permission to check
 * @returns {string} - 'edit' or 'readonly'
 */
export const getUIMode = (currentUser, permission) => {
  return hasPermission(currentUser, permission) ? 'edit' : 'readonly';
};

/**
 * Check if UI should be in read-only mode
 * 
 * @param {Object} currentUser - User object with role property
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if read-only mode
 */
export const isReadOnly = (currentUser, permission) => {
  return !hasPermission(currentUser, permission);
};

/**
 * Get filtered navigation items based on user role
 * 
 * @param {Object} currentUser - User object with role property
 * @param {Array} allNavItems - All possible navigation items
 * @returns {Array} - Filtered navigation items
 */
export const getNavigationItems = (currentUser, allNavItems) => {
  return allNavItems.filter(item => {
    if (!item.requiredPermission) return true;
    return hasPermission(currentUser, item.requiredPermission);
  });
};

/**
 * Get appropriate default tab based on user role
 * 
 * @param {Object} currentUser - User object with role property
 * @returns {string} - Default tab ID
 */
export const getDefaultTab = (currentUser) => {
  if (isAdmin(currentUser)) {
    return 'dashboard';
  } else if (isVolunteer(currentUser)) {
    return 'dashboard';
  } else if (isStudent(currentUser)) {
    return 'dashboard';
  }
  return 'dashboard';
};

/**
 * Get CSS classes based on user role
 * 
 * @param {Object} currentUser - User object with role property
 * @param {Object} classMap - Object with role keys and class string values
 * @returns {string} - CSS classes
 */
export const getRoleClasses = (currentUser, classMap) => {
  if (!currentUser?.role) {
    return classMap.default || '';
  }
  
  return classMap[currentUser.role] || classMap.default || '';
};

/**
 * Determine if a feature should be visible based on role
 * 
 * @param {Object} currentUser - User object with role property
 * @param {string} feature - Feature name
 * @returns {boolean} - True if feature should be visible
 */
export const isFeatureVisible = (currentUser, feature) => {
  const featurePermissions = {
    'bulkActions': 'canBulkUpdateLots',
    'notifications': 'canSendNotifications',
    'reports': 'canExportReports',
    'editLots': 'canEditLotStatus',
    'checkInStudents': 'canCheckInStudents',
    'commandCenter': 'canAccessCommandCenter',
    'photoUpload': 'canUploadPhotos'
  };
  
  const permission = featurePermissions[feature];
  if (!permission) return true;
  
  return hasPermission(currentUser, permission);
};

/**
 * Get appropriate placeholder text based on user role
 * 
 * @param {Object} currentUser - User object with role property
 * @param {Object} placeholders - Object with role keys and placeholder text values
 * @returns {string} - Placeholder text
 */
export const getRolePlaceholder = (currentUser, placeholders) => {
  if (!currentUser?.role) {
    return placeholders.default || '';
  }
  
  return placeholders[currentUser.role] || placeholders.default || '';
};

/**
 * Validate action based on user permissions
 * Throws error if user doesn't have permission
 * 
 * @param {Object} currentUser - User object with role property
 * @param {string} permission - Permission required for action
 * @param {string} actionName - Name of action for error message
 * @throws {Error} - If user doesn't have permission
 */
export const validateAction = (currentUser, permission, actionName) => {
  if (!hasPermission(currentUser, permission)) {
    throw new Error(`You don't have permission to ${actionName}. This action requires ${permission}.`);
  }
};

/**
 * Get user-friendly error message for permission denial
 * 
 * @param {string} permission - Permission that was denied
 * @returns {string} - User-friendly error message
 */
export const getPermissionDeniedMessage = (permission) => {
  const messages = {
    'canEditLotStatus': 'Only directors can change lot status.',
    'canEditLotDetails': 'Only directors can edit lot details.',
    'canCheckInStudents': 'Only directors can check students in or out.',
    'canSendNotifications': 'Only directors can send notifications.',
    'canExportReports': 'Only directors can export reports.',
    'canBulkUpdateLots': 'Only directors can perform bulk updates.',
    'canUploadPhotos': 'Only directors can upload photos.'
  };
  
  return messages[permission] || 'You do not have permission to perform this action.';
};

export default {
  withPermission,
  ProtectedSection,
  RoleBasedRender,
  RoleSwitch,
  RoleCase,
  RoleDefault,
  usePermissions,
  getRoleComponent,
  filterByRole,
  getUIMode,
  isReadOnly,
  getNavigationItems,
  getDefaultTab,
  getRoleClasses,
  isFeatureVisible,
  getRolePlaceholder,
  validateAction,
  getPermissionDeniedMessage
};

