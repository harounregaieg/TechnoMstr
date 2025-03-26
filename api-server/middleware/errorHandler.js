// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.stack);
    
    // Log the error but send a generic message to the client
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred';
    
    res.status(statusCode).json({
      error: message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  };
  
  module.exports = errorHandler;