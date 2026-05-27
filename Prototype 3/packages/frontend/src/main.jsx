import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { API_BASE } from './config/api';

// Catch global uncaught errors and display them on the screen!
window.addEventListener('error', (event) => {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="padding: 20px; background: #fee2e2; color: #991b1b; font-family: monospace; border: 2px solid #ef4444; border-radius: 8px; margin: 20px; overflow-wrap: break-word; z-index: 999999; position: relative;">
        <h1 style="margin: 0 0 10px 0; font-size: 18px;">🔴 Runtime Error Detected</h1>
        <p style="margin: 0 0 10px 0; font-weight: bold;">${event.message}</p>
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #555;">At: ${event.filename}:${event.lineno}:${event.colno}</p>
        <pre style="margin: 10px 0 0 0; font-size: 11px; white-space: pre-wrap; background: #fef2f2; padding: 10px; border-radius: 4px; border: 1px solid #fee2e2;">${event.error?.stack || 'No stack trace available'}</pre>
      </div>
    `;
  }
  
  // Post error to backend logger
  fetch(`${API_BASE}/api/client-error`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack || ''
    })
  }).catch(() => {});
});

window.addEventListener('unhandledrejection', (event) => {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="padding: 20px; background: #fee2e2; color: #991b1b; font-family: monospace; border: 2px solid #ef4444; border-radius: 8px; margin: 20px; overflow-wrap: break-word; z-index: 999999; position: relative;">
        <h1 style="margin: 0 0 10px 0; font-size: 18px;">🔴 Unhandled Promise Rejection</h1>
        <p style="margin: 0 0 10px 0; font-weight: bold;">${event.reason?.message || event.reason}</p>
        <pre style="margin: 10px 0 0 0; font-size: 11px; white-space: pre-wrap; background: #fef2f2; padding: 10px; border-radius: 4px; border: 1px solid #fee2e2;">${event.reason?.stack || 'No stack trace available'}</pre>
      </div>
    `;
  }
  
  // Post error to backend logger
  fetch(`${API_BASE}/api/client-error`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: event.reason?.message || String(event.reason),
      filename: 'unhandledrejection',
      lineno: 0,
      colno: 0,
      stack: event.reason?.stack || ''
    })
  }).catch(() => {});
});

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

