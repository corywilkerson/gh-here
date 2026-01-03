/**
 * Utility functions for path manipulation, language detection, and HTML escaping
 * @module utils
 */

// ============================================================================
// Language Map (alpha-sorted by key)
// ============================================================================

const LANGUAGE_MAP = {
  bash: 'shell',
  c: 'c',
  cc: 'cpp',
  clj: 'clojure',
  cpp: 'cpp',
  css: 'css',
  cxx: 'cpp',
  dart: 'dart',
  fish: 'shell',
  go: 'go',
  groovy: 'groovy',
  h: 'c',
  hpp: 'cpp',
  htm: 'html',
  html: 'html',
  java: 'java',
  js: 'javascript',
  json: 'json',
  jsx: 'javascript',
  kt: 'kotlin',
  less: 'less',
  log: 'plaintext',
  lua: 'lua',
  md: 'markdown',
  mjs: 'javascript',
  php: 'php',
  pl: 'perl',
  ps1: 'powershell',
  py: 'python',
  r: 'r',
  rb: 'ruby',
  rs: 'rust',
  sass: 'sass',
  scala: 'scala',
  scss: 'scss',
  sh: 'shell',
  sql: 'sql',
  swift: 'swift',
  ts: 'typescript',
  tsx: 'typescript',
  txt: 'plaintext',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  zsh: 'shell'
};

// ============================================================================
// HTML Utilities
// ============================================================================

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================================
// Language Detection
// ============================================================================

/**
 * Detects programming language from filename extension
 * @param {string} filename - Filename to analyze
 * @returns {string} Language identifier for syntax highlighting
 */
export function getLanguageFromExtension(filename) {
  if (!filename) return 'plaintext';
  
  const basename = filename.toLowerCase();
  const ext = filename.split('.').pop()?.toLowerCase();
  
  // Special filenames
  if (basename === 'dockerfile' || basename.startsWith('dockerfile.')) {
    return 'dockerfile';
  }
  if (basename === 'makefile') {
    return 'makefile';
  }
  if (basename.startsWith('.env')) {
    return 'dotenv';
  }
  if (basename === 'package.json' || basename === 'composer.json') {
    return 'json';
  }

  return LANGUAGE_MAP[ext] || 'plaintext';
}

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Path manipulation utilities
 */
export const PathUtils = {
  /**
   * Builds a file path from directory and filename
   * @param {string} currentPath - Current directory path
   * @param {string} filename - Filename to append
   * @returns {string} Combined file path
   */
  buildFilePath(currentPath, filename) {
    return currentPath ? `${currentPath}/${filename}` : filename;
  },

  /**
   * Builds a URL with path query parameter
   * @param {string} basePath - Base URL path
   * @param {string} targetPath - Target file/directory path
   * @returns {string} URL with encoded path parameter
   */
  buildPathUrl(basePath, targetPath) {
    return targetPath ? `${basePath}?path=${encodeURIComponent(targetPath)}` : basePath;
  },

  /**
   * Gets the current path from URL query parameters
   * @returns {string} Current path or empty string
   */
  getCurrentPath() {
    const currentUrl = new URL(window.location.href);
    return currentUrl.searchParams.get('path') || '';
  },

  /**
   * Gets the directory portion of a file path
   * @param {string} filePath - Full file path
   * @returns {string} Directory path
   */
  getDirectoryPath(filePath) {
    const parts = filePath.split('/').filter(p => p);
    if (parts.length <= 1) {
      return '';
    }
    return parts.slice(0, -1).join('/');
  },

  /**
   * Gets the filename from a full path
   * @param {string} filePath - Full file path
   * @returns {string} Filename
   */
  getFileName(filePath) {
    return filePath.split('/').pop() || 'file.txt';
  },

  /**
   * Gets the parent directory path
   * @param {string} currentPath - Current path
   * @returns {string|null} Parent path or null if at root
   */
  getParentPath(currentPath) {
    if (!currentPath || currentPath === '') {
      return null;
    }
    const pathParts = currentPath.split('/').filter(p => p);
    if (pathParts.length === 0) {
      return null;
    }
    pathParts.pop();
    return pathParts.join('/');
  }
};
