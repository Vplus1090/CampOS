/**
 * 404 catch-all middleware.
 * Mounted after all route handlers to catch undefined routes.
 */
const notFound = (req, _res, next) => {
  const error = new Error(`Not Found — ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export default notFound;
