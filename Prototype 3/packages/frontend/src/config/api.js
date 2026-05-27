/**
 * API base URL for fetch calls.
 * - Dev: "" so Vite proxies /api → localhost backend
 * - Production: "" (same-origin) unless VITE_API_BASE is set at build time
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE !== undefined
    ? import.meta.env.VITE_API_BASE
    : '';
