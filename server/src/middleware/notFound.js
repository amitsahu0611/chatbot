const notFound = (req, res, next) => {
  // For common static files that don't exist, return 404 directly
  if (req.originalUrl === '/favicon.ico' || req.originalUrl === '/robots.txt') {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `Resource not found: ${req.originalUrl}`
    });
  }
  
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = notFound;
