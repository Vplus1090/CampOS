import express, { Router } from 'express';
import { getWebportalProxyBody, getWebportalSubpath } from '../utils/webportalRequest.js';

const router = Router();

// Express raw body parser middleware for webkiosk API proxy requests.
// Reads the raw body stream into req.body as a Buffer BEFORE the router handler executes.
// This completely avoids the Node.js event-loss race condition.
router.use('/proxy*', express.raw({ type: '*/*', limit: '10mb' }));

router.all('/proxy*', async (req, res, next) => {
  try {
    const subpath = getWebportalSubpath(req);
    const targetUrl = `https://webportal.jiit.ac.in:6011/StudentPortalAPI${subpath}`;
    console.log(`[webportal] ${req.method} ${subpath} | body type=${typeof req.body} | isBuffer=${Buffer.isBuffer(req.body)} | len=${req.body?.length ?? 0}`);

    const SKIP_HEADERS = new Set([
      'host', 'origin', 'referer', 'content-length',
      'connection', 'accept-encoding', 'transfer-encoding',
      // Strip Render/Vercel proxy headers that confuse JIIT
      'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto',
      'x-real-ip', 'x-vercel-forwarded-for', 'x-vercel-id',
      'cdn-loop', 'cf-connecting-ip', 'cf-ray',
    ]);

    const headers = {
      'host': 'webportal.jiit.ac.in:6011',
      'origin': 'https://webportal.jiit.ac.in:6011',
      'referer': 'https://webportal.jiit.ac.in:6011/',
      'accept': 'application/json, text/plain, */*',
    };

    // Forward only safe, JIIT-relevant headers from the client
    for (const [key, value] of Object.entries(req.headers)) {
      const lowerKey = key.toLowerCase();
      if (!SKIP_HEADERS.has(lowerKey) && !lowerKey.startsWith('x-')) {
        headers[lowerKey] = value;
      }
    }

    const proxyBody = getWebportalProxyBody(req);

    const fetchOptions = {
      method: req.method,
      headers: {
        ...headers,
        // Set accurate content-length from the actual body we're sending
        ...(proxyBody ? { 'content-length': String(proxyBody.length) } : {}),
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && proxyBody) {
      fetchOptions.body = proxyBody;
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    res.status(response.status);
    
    // Copy select response headers
    if (contentType) {
      res.setHeader('content-type', contentType);
    }
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      res.setHeader('content-disposition', contentDisposition);
    }

    // Read the full response body as an ArrayBuffer first
    const arrayBuffer = await response.arrayBuffer();
    const bodyBuffer = Buffer.from(arrayBuffer);

    if (bodyBuffer.length === 0) {
      // JIIT API returned empty body — send back an error JSON so the frontend gets a clear message
      res.setHeader('content-type', 'application/json');
      res.json({
        status: {
          responseCode: response.status,
          responseStatus: 'Error',
          responseMessage: 'JIIT Web Portal returned empty response',
        },
      });
      return;
    }

    if (contentType.includes('application/json')) {
      // Parse and re-send as JSON 
      try {
        const data = JSON.parse(bodyBuffer.toString('utf-8'));
        res.json(data);
      } catch (parseErr) {
        // If it claims to be JSON but isn't parseable, forward raw
        res.send(bodyBuffer);
      }
    } else {
      res.send(bodyBuffer);
    }
  } catch (error) {
    console.error('Error in WebPortal Proxy:', error.message);
    res.status(502).json({
      status: {
        responseCode: 502,
        responseStatus: 'Error',
        responseMessage: `CORS Proxy Error: ${error.message}`,
      },
    });
  }
});

export default router;
