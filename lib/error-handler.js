/**
 * Centralized error handling
 */

const { HTTP_STATUS, ERROR_MESSAGES } = require('./constants');

/**
 * Formats error response
 */
function formatErrorResponse(error, statusCode = HTTP_STATUS.INTERNAL_ERROR) {
  return {
    success: false,
    error: error.message || error,
    statusCode
  };
}

/**
 * Sends error response
 */
function sendError(res, message, statusCode = HTTP_STATUS.INTERNAL_ERROR) {
  res.status(statusCode).json({
    success: false,
    error: message
  });
}

/**
 * Handles async route errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(error => {
      console.error('Route error:', error);
      sendError(res, 'Internal server error', HTTP_STATUS.INTERNAL_ERROR);
    });
  };
}

/**
 * Logs error with context
 */
function logError(context, error) {
  console.error(`[${context}] Error:`, error.message || error);
  if (error.stack) {
    console.error(error.stack);
  }
}

module.exports = {
  formatErrorResponse,
  sendError,
  asyncHandler,
  logError
};
