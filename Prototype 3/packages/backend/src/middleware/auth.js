import User from '../models/User.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { hasAllPermissions } from '../config/permissions.js';

/**
 * Authenticate middleware.
 * Extracts JWT from the `accessToken` cookie, verifies it,
 * looks up the user, and attaches `req.user`.
 *
 * Returns 401 if token is missing/invalid.
 * Returns 403 if account is suspended.
 */
export const authenticate = async (req, _res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      const error = new Error('Authentication required. Please log in.');
      error.statusCode = 401;
      return next(error);
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      const error = new Error('Invalid or expired token. Please log in again.');
      error.statusCode = 401;
      return next(error);
    }

    // Look up user (exclude password but include isSuspended)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      const error = new Error('User no longer exists.');
      error.statusCode = 401;
      return next(error);
    }

    // Check suspension
    if (user.isSuspended) {
      const error = new Error('Account suspended. Contact an administrator.');
      error.statusCode = 403;
      return next(error);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Require specific permissions.
 * Must be used AFTER `authenticate` middleware.
 *
 * Usage: requirePermission('manage:users', 'delete:users')
 *
 * Returns 403 if the user's role doesn't have ALL specified permissions.
 *
 * @param {...string} permissions - Required permission strings
 * @returns {Function} Express middleware
 */
export const requirePermission = (...permissions) => {
  return (req, _res, next) => {
    if (!req.user) {
      const error = new Error('Authentication required.');
      error.statusCode = 401;
      return next(error);
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      const error = new Error(
        `Forbidden. Required permissions: ${permissions.join(', ')}`
      );
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

/**
 * Require one of the specified roles.
 * Must be used AFTER `authenticate` middleware.
 *
 * Usage: requireRole('admin', 'educator')
 *
 * Returns 403 if the user's role is not in the list.
 *
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
export const requireRole = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      const error = new Error('Authentication required.');
      error.statusCode = 401;
      return next(error);
    }

    if (!roles.includes(req.user.role)) {
      const error = new Error(
        `Forbidden. This action requires one of the following roles: ${roles.join(', ')}`
      );
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};
