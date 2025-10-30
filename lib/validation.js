/**
 * Input validation and security utilities
 */

const path = require('path');

/**
 * Validates that a path is within the allowed working directory
 * Prevents path traversal attacks
 */
function validatePath(requestPath, workingDir) {
  const fullPath = path.resolve(path.join(workingDir, requestPath || ''));
  return fullPath.startsWith(workingDir);
}

/**
 * Sanitizes file paths to prevent injection
 */
function sanitizePath(filePath) {
  if (!filePath) {
    return '';
  }
  return filePath.replace(/\.\./g, '').replace(/[<>:"|?*]/g, '');
}

/**
 * Validates commit message
 */
function validateCommitMessage(message) {
  if (!message || typeof message !== 'string') {
    return false;
  }
  return message.trim().length > 0 && message.trim().length <= 5000;
}

/**
 * Validates filename
 */
function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return false;
  }

  const sanitized = filename.trim();

  if (sanitized.length === 0 || sanitized.length > 255) {
    return false;
  }

  const invalidChars = /[<>:"|?*\x00-\x1F]/;
  if (invalidChars.test(sanitized)) {
    return false;
  }

  return true;
}

/**
 * Validates an array of file paths
 */
function validateFilePaths(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return false;
  }

  return files.every(file => {
    return typeof file === 'string' && file.trim().length > 0;
  });
}

module.exports = {
  validatePath,
  sanitizePath,
  validateCommitMessage,
  validateFilename,
  validateFilePaths
};
