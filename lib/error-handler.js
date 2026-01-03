/**
 * Centralized error handling utilities
 * @module error-handler
 */

const { HTTP_STATUS } = require('./constants');

/**
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
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
 * Formats an error into a standard response object
 * @param {Error|string} error - Error object or message
 * @param {number} [statusCode=500] - HTTP status code
 * @returns {{success: boolean, error: string, statusCode: number}}
 */
function formatErrorResponse(error, statusCode = HTTP_STATUS.INTERNAL_ERROR) {
  return {
    success: false,
    error: error.message || error,
    statusCode
  };
}

/**
 * Logs error with context information
 * @param {string} context - Context identifier for the error
 * @param {Error|string} error - Error object or message
 */
function logError(context, error) {
  console.error(`[${context}] Error:`, error.message || error);
  if (error.stack) {
    console.error(error.stack);
  }
}

/**
 * Sends a JSON error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} [statusCode=500] - HTTP status code
 */
function sendError(res, message, statusCode = HTTP_STATUS.INTERNAL_ERROR) {
  res.status(statusCode).json({
    success: false,
    error: message
  });
}

module.exports = {
  asyncHandler,
  formatErrorResponse,
  logError,
  sendError
};
