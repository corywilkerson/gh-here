/**
 * Backend constants and configuration
 */

module.exports = {
  HTTP_STATUS: {
    OK: 200,
    BAD_REQUEST: 400,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500
  },

  ERROR_MESSAGES: {
    NOT_GIT_REPO: 'Not a git repository',
    COMMIT_MESSAGE_REQUIRED: 'Commit message is required',
    NO_FILES_SELECTED: 'No files selected',
    FILE_PATH_REQUIRED: 'File path is required',
    ACCESS_DENIED: 'Access denied',
    FILE_NOT_FOUND: 'File not found',
    ITEM_NOT_FOUND: 'Item not found',
    ITEM_ALREADY_EXISTS: 'Item already exists',
    CANNOT_EDIT_BINARY: 'Cannot edit binary files',
    CANNOT_DOWNLOAD_DIRECTORIES: 'Cannot download directories'
  },

  GIT_STATUS_MAP: {
    'A': 'added',
    'M': 'modified',
    'D': 'deleted',
    'R': 'renamed',
    '??': 'untracked',
    'MM': 'mixed',
    'AM': 'mixed',
    'AD': 'mixed'
  }
};
