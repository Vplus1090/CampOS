import env from '../config/env.js';

/**
 * Global error-handling middleware for Express.
 * Returns structured JSON errors with stack traces in development.
 */
const errorHandler = (err, _req, res, _next) => {
  // Default to 500 if no status was set
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  console.error(`❌ [${statusCode}] ${err.message}`);
  if (env.isDev) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(env.isDev && { stack: err.stack }),
  });
};

export default errorHandler;
