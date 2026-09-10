const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err.stack || err);
  
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // PostgreSQL 23503 foreign key constraint violation on user_id indicates stale user session
  if (err.code === '23503' || (err.message && err.message.includes('bookings_user_id_fkey'))) {
    statusCode = 401;
    message = 'User session invalid or user account no longer exists. Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
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
