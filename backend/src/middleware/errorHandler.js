const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err.stack || err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
