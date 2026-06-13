import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Generate a short-lived access token.
 *
 * @param {string} userId - MongoDB user _id
 * @param {string} role - User's role
 * @returns {string} Signed JWT
 */
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
  );
};

/**
 * Generate a long-lived refresh token.
 *
 * @param {string} userId - MongoDB user _id
 * @returns {string} Signed JWT
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY }
  );
};

/**
 * Verify and decode an access token.
 *
 * @param {string} token
 * @returns {object} Decoded payload { id, role, iat, exp }
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
};

/**
 * Verify and decode a refresh token.
 *
 * @param {string} token
 * @returns {object} Decoded payload { id, iat, exp }
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

/**
 * Parse the JWT_REFRESH_EXPIRY string (e.g., "30d") into milliseconds.
 */
const parseExpiryToMs = (expiry) => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 30 * 24 * 60 * 60 * 1000; // default 30 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] || multipliers.d);
};

/**
 * Set access and refresh tokens as httpOnly cookies.
 *
 * @param {object} res - Express response object
 * @param {string} accessToken
 * @param {string} refreshToken
 */
export const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = env.isProd;

  // Access token cookie — short-lived
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 60 * 60 * 1000, // 1 hour
    path: '/',
  });

  // Refresh token cookie — long-lived
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: parseExpiryToMs(env.JWT_REFRESH_EXPIRY),
    path: '/api/auth', // only sent to auth endpoints
  });
};

/**
 * Clear both token cookies (logout).
 *
 * @param {object} res - Express response object
 */
export const clearTokenCookies = (res) => {
  const isProduction = env.isProd;
  res.clearCookie('accessToken', {
    path: '/',
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  res.clearCookie('refreshToken', {
    path: '/api/auth',
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
};
