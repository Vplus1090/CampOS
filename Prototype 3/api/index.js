/**
 * Vercel Serverless Function entry point.
 *
 * This wraps the existing Express app from packages/backend so that
 * every /api/* request is handled by the same Express stack used locally.
 *
 * Environment variables (MONGODB_URI, JWT_ACCESS_SECRET, etc.) must be
 * configured in the Vercel project settings — they're read by env.js at
 * cold-start time via process.env (no .env file on Vercel).
 */

import app from './app.js';

export default app;
