/**
 * Backend constants and configuration
 * @module constants
 */

module.exports = {
  /**
   * Standard HTTP status codes
   */
  HTTP_STATUS: {
    BAD_REQUEST: 400,
    CONFLICT: 409,
    FORBIDDEN: 403,
    INTERNAL_ERROR: 500,
    NOT_FOUND: 404,
    OK: 200
  },

  /**
   * User-facing error messages (alpha-sorted)
   */
  ERROR_MESSAGES: {
    ACCESS_DENIED: 'Access denied',
    CANNOT_DOWNLOAD_DIRECTORIES: 'Cannot download directories',
    CANNOT_EDIT_BINARY: 'Cannot edit binary files',
    COMMIT_MESSAGE_REQUIRED: 'Commit message is required',
    FILE_NOT_FOUND: 'File not found',
    FILE_PATH_REQUIRED: 'File path is required',
    ITEM_ALREADY_EXISTS: 'Item already exists',
    ITEM_NOT_FOUND: 'Item not found',
    NO_FILES_SELECTED: 'No files selected',
    NOT_GIT_REPO: 'Not a git repository'
  },

  /**
   * Git status code to human-readable status mapping
   */
  GIT_STATUS_MAP: {
    '??': 'untracked',
    'A': 'added',
    'AD': 'mixed',
    'AM': 'mixed',
    'D': 'deleted',
    'M': 'modified',
    'MM': 'mixed',
    'R': 'renamed'
  }
};
