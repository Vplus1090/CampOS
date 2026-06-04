/**
 * Role → Permission mapping for CampOS RBAC.
 *
 * Each role has a set of permission strings. Middleware checks
 * if the user's role grants the required permission(s).
 *
 * Admin has a wildcard '*' that grants all permissions.
 */

const PERMISSIONS = {
  super_admin: [
    '*',                   // wildcard — super admins can do everything
  ],

  admin: [
    '*',                   // wildcard — admins can do everything
    'manage:users',
    'assign:roles',
    'suspend:users',
    'delete:users',
    'view:analytics',
    'manage:content',
  ],

  canteen_admin: [
    'manage:canteen',
    'edit:own-profile',
  ],

  educator: [
    'create:course',
    'edit:course',
    'delete:own-course',
    'grade:student',
    'view:own-students',
    'upload:material',
    'view:analytics',
    'edit:own-profile',
  ],

  student: [
    'view:course',
    'enroll:course',
    'view:grades',
    'view:material',
    'edit:own-profile',
  ],
};

/**
 * Check if a role has a specific permission.
 * Admin wildcard '*' matches any permission.
 *
 * @param {string} role - User's role
 * @param {string} permission - Permission string to check
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;

  return rolePermissions.includes('*') || rolePermissions.includes(permission);
};

/**
 * Check if a role has ALL of the specified permissions.
 *
 * @param {string} role - User's role
 * @param {string[]} permissions - Array of permission strings
 * @returns {boolean}
 */
export const hasAllPermissions = (role, permissions) => {
  return permissions.every((perm) => hasPermission(role, perm));
};

/**
 * Get all permissions for a role.
 *
 * @param {string} role - User's role
 * @returns {string[]}
 */
export const getPermissions = (role) => {
  return PERMISSIONS[role] || [];
};

export default PERMISSIONS;
