/**
 * API base URL for fetch calls.
 * - Dev: "" → Vite proxies /api to localhost:5001
 * - Production default: Render backend (Vercel frontend + Render API split deploy)
 * - Override: set VITE_API_BASE at build time (use "" for Vercel serverless /api on same host)
 */
const RENDER_API = 'https://campos-fmjh.onrender.com';

export const API_BASE =
  import.meta.env.VITE_API_BASE !== undefined
    ? import.meta.env.VITE_API_BASE
    : import.meta.env.DEV
      ? ''
      : RENDER_API;
