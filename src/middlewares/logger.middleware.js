/**
 * Custom request logger middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request details
  console.log(`[Request] ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
  
  if (Object.keys(req.query).length > 0) {
    console.log(`[Request] Query parameters:`, JSON.stringify(req.query));
  }
  
  if (req.body && Object.keys(req.body).length > 0 && req.headers['content-type']?.includes('application/json')) {
    console.log(`[Request] Request body:`, JSON.stringify(req.body, null, 2));
  }
  
  if (req.files) {
    console.log(`[Request] Files included: ${req.files.length} file(s)`);
  }
  
  // Log response details when response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[Response] ${req.method} ${req.originalUrl} completed with status ${res.statusCode} in ${duration}ms`);
  });
  
  next();
};

export default requestLogger; 