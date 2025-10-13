/**
 * TBTC Permission System
 * Centralized permission logic for role-based access control
 */

/**
 * User roles in the system
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  VOLUNTEER: 'volunteer',
  STUDENT: 'student'
};

/**
 * Permission definitions
 * Each permission function takes a user object and returns a boolean
 */
export const permissions = {
  // Lot Management Permissions
  canViewLots: (user) => {
    // All users can view lots
    return true;
  },

  canEditLotStatus: (user) => {
    // Only admins can change lot status
    return user?.role === USER_ROLES.ADMIN;
  },

  canEditLotDetails: (user) => {
    // Only admins can edit lot details (comments, student counts, photos)
    return user?.role === USER_ROLES.ADMIN;
  },

  canBulkUpdateLots: (user) => {
    // Only admins can perform bulk status updates
    return user?.role === USER_ROLES.ADMIN;
  },

  canUploadPhotos: (user) => {
    // Only admins can upload photos
    return user?.role === USER_ROLES.ADMIN;
  },

  canUploadSignInSheets: (user) => {
    // Admins and volunteers can upload sign-in sheets with AI analysis
    return user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.VOLUNTEER;
  },

  // Student Management Permissions
  canViewStudentRoster: (user) => {
    // Admins and volunteers can view student roster
    return user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.VOLUNTEER;
  },

  canCheckInStudents: (user) => {
    // Only admins can check students in/out manually
    return user?.role === USER_ROLES.ADMIN;
  },

  canControlCheckOuts: (user) => {
    // Admins and volunteers can control check-out toggle
    return user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.VOLUNTEER;
  },

  canAssignStudentsToLots: (user) => {
    // Only admins can assign students to lots
    return user?.role === USER_ROLES.ADMIN;
  },

  canEditStudentDetails: (user) => {
    // Only admins can edit student information
    return user?.role === USER_ROLES.ADMIN;
  },

  // Communication Permissions
  canSendNotifications: (user) => {
    // Only admins can send notifications
    return user?.role === USER_ROLES.ADMIN;
  },

  canViewNotifications: (user) => {
    // All users can view notifications
    return true;
  },

  // Reporting Permissions
  canExportReports: (user) => {
    // Only admins can export reports
    return user?.role === USER_ROLES.ADMIN;
  },

  canViewReports: (user) => {
    // Admins and volunteers can view reports
    return user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.VOLUNTEER;
  },

  // Dashboard Permissions
  canViewAdminDashboard: (user) => {
    // Only admins can view admin dashboard
    return user?.role === USER_ROLES.ADMIN;
  },

  canViewVolunteerDashboard: (user) => {
    // Volunteers can view volunteer dashboard
    return user?.role === USER_ROLES.VOLUNTEER;
  },

  canViewStudentDashboard: (user) => {
    // Students can view student dashboard
    return user?.role === USER_ROLES.STUDENT;
  },

  // Command Center Permissions
  canAccessCommandCenter: (user) => {
    // Only admins can access command center features
    return user?.role === USER_ROLES.ADMIN;
  },

  // General Permissions
  canViewDashboard: (user) => {
    // All users can view dashboard (role-adaptive)
    return true;
  },

  canViewParkingLots: (user) => {
    // All users can view parking lots screen (role-adaptive)
    return true;
  },

  canViewStudents: (user) => {
    // Admins and volunteers can view students screen
    return user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.VOLUNTEER;
  }
};

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with role property
 * @param {string} permissionName - Name of the permission to check
 * @returns {boolean} - True if user has permission, false otherwise
 */
export const hasPermission = (user, permissionName) => {
  if (!user) return false;
  
  const permissionFn = permissions[permissionName];
  if (!permissionFn) {
    console.warn(`Permission "${permissionName}" not found`);
    return false;
  }
  
  return permissionFn(user);
};

/**
 * Check if user has all of the specified permissions
 * @param {Object} user - User object with role property
 * @param {string[]} permissionNames - Array of permission names to check
 * @returns {boolean} - True if user has all permissions, false otherwise
 */
export const hasAllPermissions = (user, permissionNames) => {
  return permissionNames.every(permissionName => hasPermission(user, permissionName));
};

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object with role property
 * @param {string[]} permissionNames - Array of permission names to check
 * @returns {boolean} - True if user has at least one permission, false otherwise
 */
export const hasAnyPermission = (user, permissionNames) => {
  return permissionNames.some(permissionName => hasPermission(user, permissionName));
};

/**
 * Get user role display name
 * @param {Object} user - User object with role property
 * @returns {string} - Display name for the role
 */
export const getRoleDisplayName = (user) => {
  if (!user?.role) return 'Unknown';
  
  const roleNames = {
    [USER_ROLES.ADMIN]: 'Director',
    [USER_ROLES.VOLUNTEER]: 'Volunteer',
    [USER_ROLES.STUDENT]: 'Student'
  };
  
  return roleNames[user.role] || 'Unknown';
};

/**
 * Check if user is admin
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (user) => {
  return user?.role === USER_ROLES.ADMIN;
};

/**
 * Check if user is volunteer
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user is volunteer
 */
export const isVolunteer = (user) => {
  return user?.role === USER_ROLES.VOLUNTEER;
};

/**
 * Check if user is student
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user is student
 */
export const isStudent = (user) => {
  return user?.role === USER_ROLES.STUDENT;
};

/**
 * Get permissions summary for a user
 * @param {Object} user - User object with role property
 * @returns {Object} - Object with permission names as keys and boolean values
 */
export const getUserPermissions = (user) => {
  const permissionSummary = {};
  
  Object.keys(permissions).forEach(permissionName => {
    permissionSummary[permissionName] = hasPermission(user, permissionName);
  });
  
  return permissionSummary;
};

export default permissions;

