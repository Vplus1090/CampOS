/** True when the request targets the JIIT webportal reverse proxy. */
export function isWebportalProxyRequest(req) {
  const path = `${req.originalUrl || ''}${req.url || ''}${req.path || ''}`;
  return path.includes('/webportal/proxy');
}

/** Path suffix after /webportal/proxy (e.g. /token/pretoken-check). */
export function getWebportalSubpath(req) {
  const full = (req.originalUrl || req.url || req.path || '').split('?')[0];
  const match = full.match(/\/webportal\/proxy(\/.*)?$/);
  if (match) return match[1] || '';
  return (req.path || '').replace(/^\/proxy/, '') || '';
}

/**
 * Build the upstream body buffer. Handles raw buffers (correct path) and
 * bodies already parsed by express.json (common on Vercel serverless).
 */
export function getWebportalProxyBody(req) {
  const { body } = req;
  if (body === undefined || body === null) return undefined;

  if (Buffer.isBuffer(body)) {
    return body.length > 0 ? body : undefined;
  }

  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (!trimmed) return undefined;
    // Re-wrap as JSON string when the client sent `"encrypted..."`.
    const payload = trimmed.startsWith('"') ? trimmed : JSON.stringify(body);
    return Buffer.from(payload, 'utf8');
  }

  if (typeof body === 'object') {
    return Buffer.from(JSON.stringify(body), 'utf8');
  }

  return undefined;
}
