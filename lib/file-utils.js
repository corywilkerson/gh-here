/**
 * File utilities module
 * Handles file icons, language detection, formatting, and type classification
 * 
 * @module file-utils
 */

const path = require('path');
const octicons = require('@primer/octicons');

// ============================================================================
// Constants
// ============================================================================

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'];
const BYTE_BASE = 1024;

// File type categories
const IMAGE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'ico'
]);

const BINARY_EXTENSIONS = new Set([
  // Archives
  'zip', 'tar', 'gz', 'rar', '7z',
  // Executables
  'exe', 'bin', 'app', 'deb', 'rpm',
  // Documents
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  // Media
  'mp4', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'flac',
  // Compiled
  'class', 'so', 'dll', 'dylib',
  // Images (also binary)
  ...IMAGE_EXTENSIONS
]);

// Language mapping for Monaco/editor support
const LANGUAGE_MAP = {
  // JavaScript family
  'js': 'javascript',
  'mjs': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  
  // Web
  'html': 'html',
  'htm': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  
  // Data / config
  'json': 'json',
  'xml': 'xml',
  'yaml': 'yaml',
  'yml': 'yaml',
  
  // Shell & scripts
  'sh': 'bash',
  'bash': 'bash',
  'zsh': 'bash',
  'fish': 'bash',
  'ps1': 'powershell',
  
  // Compiled / systems
  'c': 'c',
  'h': 'c',
  'cpp': 'cpp',
  'cc': 'cpp',
  'cxx': 'cpp',
  'hpp': 'cpp',
  'rs': 'rust',
  'go': 'go',
  'java': 'java',
  'kt': 'kotlin',
  'swift': 'swift',
  
  // Scripting
  'py': 'python',
  'php': 'php',
  'rb': 'ruby',
  'dart': 'dart',
  'r': 'r',
  'sql': 'sql',
  'scala': 'scala',
  'clj': 'clojure',
  'lua': 'lua',
  'pl': 'perl',
  'groovy': 'groovy',
  
  // Markup / frameworks
  'md': 'markdown',
  'markdown': 'markdown',
  'vue': 'vue',
  'svelte': 'svelte',
  
  // Misc text
  'txt': 'plaintext',
  'log': 'plaintext',
  
  // Special filename-style extensions
  'dockerfile': 'dockerfile'
};

// Language colors for stats
const LANGUAGE_COLORS = {
  javascript: '#f1e05a',
  typescript: '#2b7489',
  python: '#3572A5',
  java: '#b07219',
  html: '#e34c26',
  css: '#563d7c',
  json: '#292929',
  markdown: '#083fa1',
  go: '#00ADD8',
  rust: '#dea584',
  php: '#4F5D95',
  ruby: '#701516',
  other: '#cccccc'
};

// ============================================================================
// File Icon Configuration
// ============================================================================

/**
 * Icon configuration for special files by exact name match
 */
const SPECIAL_FILE_ICONS = {
  // Package managers
  'package.json': { icon: 'file-code', color: 'text-green' },
  'composer.json': { icon: 'file-code', color: 'text-green' },
  
  // TypeScript config
  'tsconfig.json': { icon: 'file-code', color: 'text-blue' },
  'jsconfig.json': { icon: 'file-code', color: 'text-blue' },
  
  // Linters & formatters
  '.eslintrc': { icon: 'gear', color: 'text-purple' },
  '.eslintrc.json': { icon: 'gear', color: 'text-purple' },
  '.eslintrc.js': { icon: 'gear', color: 'text-purple' },
  '.eslintrc.yml': { icon: 'gear', color: 'text-purple' },
  '.prettierrc': { icon: 'gear', color: 'text-blue' },
  'prettier.config.js': { icon: 'gear', color: 'text-blue' },
  '.prettierrc.json': { icon: 'gear', color: 'text-blue' },
  
  // Build tools
  'webpack.config.js': { icon: 'gear', color: 'text-orange' },
  'vite.config.js': { icon: 'gear', color: 'text-orange' },
  'rollup.config.js': { icon: 'gear', color: 'text-orange' },
  'next.config.js': { icon: 'gear', color: 'text-orange' },
  'nuxt.config.js': { icon: 'gear', color: 'text-orange' },
  'svelte.config.js': { icon: 'gear', color: 'text-orange' },
  'tailwind.config.js': { icon: 'gear', color: 'text-purple' },
  'postcss.config.js': { icon: 'gear', color: 'text-purple' },
  'babel.config.js': { icon: 'gear', color: 'text-purple' },
  '.babelrc': { icon: 'gear', color: 'text-purple' },
  
  // Docker
  'dockerfile': { icon: 'container', color: 'text-blue' },
  'dockerfile.dev': { icon: 'container', color: 'text-blue' },
  '.dockerignore': { icon: 'container', color: 'text-blue' },
  'docker-compose.yml': { icon: 'container', color: 'text-blue' },
  'docker-compose.yaml': { icon: 'container', color: 'text-blue' },
  
  // Git
  '.gitignore': { icon: 'git-branch', color: 'text-orange' },
  '.gitattributes': { icon: 'git-branch', color: 'text-orange' },
  '.gitmodules': { icon: 'git-branch', color: 'text-orange' },
  
  // Documentation
  'readme.md': { icon: 'book', color: 'text-blue' },
  'readme.txt': { icon: 'book', color: 'text-blue' },
  'changelog.md': { icon: 'book', color: 'text-blue' },
  'history.md': { icon: 'book', color: 'text-blue' },
  'license': { icon: 'law', color: 'text-yellow' },
  'license.txt': { icon: 'law', color: 'text-yellow' },
  'license.md': { icon: 'law', color: 'text-yellow' },
  
  // Build
  'makefile': { icon: 'tools', color: 'text-gray' },
  'makefile.am': { icon: 'tools', color: 'text-gray' },
  'cmakelists.txt': { icon: 'tools', color: 'text-gray' },
  
  // Locks
  'yarn.lock': { icon: 'lock', color: 'text-yellow' },
  'package-lock.json': { icon: 'lock', color: 'text-yellow' },
  'pipfile.lock': { icon: 'lock', color: 'text-yellow' },
  
  // CI/CD
  '.travis.yml': { icon: 'gear', color: 'text-green' },
  '.circleci': { icon: 'gear', color: 'text-green' },
  
  // Environment
  '.env': { icon: 'key', color: 'text-yellow' },
  '.env.local': { icon: 'key', color: 'text-yellow' }
};

/**
 * Icon configuration for files by extension
 */
const EXTENSION_ICONS = {
  // JavaScript family
  '.js': { icon: 'file-code', color: 'text-yellow' },
  '.mjs': { icon: 'file-code', color: 'text-yellow' },
  '.jsx': { icon: 'file-code', color: 'text-blue' },
  '.ts': { icon: 'file-code', color: 'text-blue' },
  '.tsx': { icon: 'file-code', color: 'text-blue' },
  
  // Frameworks
  '.vue': { icon: 'file-code', color: 'text-green' },
  '.svelte': { icon: 'file-code', color: 'text-orange' },
  
  // Languages
  '.py': { icon: 'file-code', color: 'text-blue' },
  '.pyx': { icon: 'file-code', color: 'text-blue' },
  '.pyi': { icon: 'file-code', color: 'text-blue' },
  '.java': { icon: 'file-code', color: 'text-red' },
  '.class': { icon: 'file-code', color: 'text-red' },
  '.c': { icon: 'file-code', color: 'text-blue' },
  '.h': { icon: 'file-code', color: 'text-blue' },
  '.cpp': { icon: 'file-code', color: 'text-blue' },
  '.cxx': { icon: 'file-code', color: 'text-blue' },
  '.cc': { icon: 'file-code', color: 'text-blue' },
  '.hpp': { icon: 'file-code', color: 'text-blue' },
  '.cs': { icon: 'file-code', color: 'text-purple' },
  '.go': { icon: 'file-code', color: 'text-blue' },
  '.rs': { icon: 'file-code', color: 'text-orange' },
  '.php': { icon: 'file-code', color: 'text-purple' },
  '.rb': { icon: 'file-code', color: 'text-red' },
  '.swift': { icon: 'file-code', color: 'text-orange' },
  '.kt': { icon: 'file-code', color: 'text-purple' },
  '.kts': { icon: 'file-code', color: 'text-purple' },
  '.dart': { icon: 'file-code', color: 'text-blue' },
  '.scala': { icon: 'file-code', color: 'text-red' },
  '.clj': { icon: 'file-code', color: 'text-green' },
  '.cljs': { icon: 'file-code', color: 'text-green' },
  '.hs': { icon: 'file-code', color: 'text-purple' },
  '.elm': { icon: 'file-code', color: 'text-blue' },
  '.r': { icon: 'file-code', color: 'text-blue' },
  
  // Web
  '.html': { icon: 'file-code', color: 'text-orange' },
  '.css': { icon: 'paintbrush', color: 'text-purple' },
  '.scss': { icon: 'paintbrush', color: 'text-purple' },
  '.sass': { icon: 'paintbrush', color: 'text-purple' },
  '.less': { icon: 'paintbrush', color: 'text-purple' },
  
  // Data
  '.json': { icon: 'file-code', color: 'text-yellow' },
  '.xml': { icon: 'file-code', color: 'text-orange' },
  '.yml': { icon: 'file-code', color: 'text-purple' },
  '.yaml': { icon: 'file-code', color: 'text-purple' },
  
  // Documentation
  '.md': { icon: 'book', color: 'text-blue' },
  '.markdown': { icon: 'book', color: 'text-blue' },
  '.txt': { icon: 'file', color: 'text-gray' },
  
  // Media
  '.png': { icon: 'file-media', color: 'text-purple' },
  '.jpg': { icon: 'file-media', color: 'text-purple' },
  '.jpeg': { icon: 'file-media', color: 'text-purple' },
  '.gif': { icon: 'file-media', color: 'text-purple' },
  '.svg': { icon: 'file-media', color: 'text-purple' },
  '.webp': { icon: 'file-media', color: 'text-purple' },
  '.mp4': { icon: 'device-camera-video', color: 'text-red' },
  '.mov': { icon: 'device-camera-video', color: 'text-red' },
  '.avi': { icon: 'device-camera-video', color: 'text-red' },
  '.mkv': { icon: 'device-camera-video', color: 'text-red' },
  '.mp3': { icon: 'unmute', color: 'text-purple' },
  '.wav': { icon: 'unmute', color: 'text-purple' },
  '.flac': { icon: 'unmute', color: 'text-purple' },
  
  // Archives
  '.zip': { icon: 'file-zip', color: 'text-yellow' },
  '.tar': { icon: 'file-zip', color: 'text-yellow' },
  '.gz': { icon: 'file-zip', color: 'text-yellow' },
  '.rar': { icon: 'file-zip', color: 'text-yellow' },
  '.7z': { icon: 'file-zip', color: 'text-yellow' },
  
  // Shell
  '.sh': { icon: 'terminal', color: 'text-green' },
  '.bash': { icon: 'terminal', color: 'text-green' },
  '.zsh': { icon: 'terminal', color: 'text-green' },
  '.fish': { icon: 'terminal', color: 'text-green' },
  
  // Other
  '.sql': { icon: 'file-code', color: 'text-orange' },
  '.pdf': { icon: 'file-binary', color: 'text-red' }
};

// ============================================================================
// Utilities
// ============================================================================

/**
 * Extract extension from file path or extension string
 * @param {string} filePathOrExt - File path or extension
 * @returns {string} Normalized extension (lowercase, no dot)
 */
function getExtension(filePathOrExt) {
  // If it's already just an extension (no dots, slashes), return as-is
  if (!filePathOrExt.includes('.') && 
      !filePathOrExt.includes('/') && 
      !filePathOrExt.includes('\\')) {
    return filePathOrExt.toLowerCase();
  }
  
  // Extract extension from file path
  return path.extname(filePathOrExt).toLowerCase().slice(1);
}

/**
 * Get icon configuration for a special file by name
 * @param {string} filename - Lowercase filename
 * @returns {Object|null} Icon config or null
 */
function getSpecialFileIcon(filename) {
  // Check exact matches
  if (SPECIAL_FILE_ICONS[filename]) {
    return SPECIAL_FILE_ICONS[filename];
  }
  
  // Check prefix matches (e.g., .env.*, .github/*, README*)
  if (filename.startsWith('.env.')) {
    return { icon: 'key', color: 'text-yellow' };
  }
  
  if (filename.startsWith('.github')) {
    return { icon: 'gear', color: 'text-green' };
  }
  
  if (filename.startsWith('readme')) {
    return { icon: 'book', color: 'text-blue' };
  }
  
  // Check suffix matches (e.g., *.lock)
  if (filename.endsWith('.lock')) {
    return { icon: 'lock', color: 'text-yellow' };
  }
  
  return null;
}

/**
 * Get icon configuration for a file by extension
 * @param {string} ext - File extension (with or without dot)
 * @returns {Object|null} Icon config or null
 */
function getExtensionIcon(ext) {
  const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
  return EXTENSION_ICONS[normalizedExt] || null;
}

/**
 * Render icon SVG with fallback
 * @param {string} iconName - Octicon name
 * @param {string} colorClass - CSS color class
 * @returns {string} SVG string
 */
function renderIcon(iconName, colorClass) {
  const icon = octicons[iconName];
  const fallback = octicons.file;
  
  const iconToUse = icon || fallback;
  const classes = `octicon-file ${colorClass}`;
  
  // Render SVG with proper classes
  return iconToUse.toSVG({ class: classes });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get file icon SVG for a given filename
 * @param {string} filename - File name
 * @returns {string} SVG icon string
 */
function getFileIcon(filename) {
  if (!filename) {
    return renderIcon('file', 'text-gray');
  }
  
  const normalizedName = filename.toLowerCase();
  const ext = path.extname(filename).toLowerCase();
  
  try {
    // Check special files first (exact name matches, prefixes, suffixes)
    const specialIcon = getSpecialFileIcon(normalizedName);
    if (specialIcon) {
      return renderIcon(specialIcon.icon, specialIcon.color);
    }
    
    // Check extension-based icons
    const extIcon = getExtensionIcon(ext);
    if (extIcon) {
      return renderIcon(extIcon.icon, extIcon.color);
    }
    
    // Default fallback
    return renderIcon('file', 'text-gray');
  } catch (error) {
    console.warn('Error generating file icon:', error);
    return renderIcon('file', 'text-gray');
  }
}

/**
 * Get language identifier from file extension
 * @param {string} ext - File extension (with or without dot)
 * @returns {string|undefined} Language identifier or undefined
 */
function getLanguageFromExtension(ext) {
  if (!ext) return undefined;
  
  const normalized = getExtension(ext);
  return LANGUAGE_MAP[normalized];
}

/**
 * Get color for a programming language (for stats display)
 * @param {string} language - Language identifier
 * @returns {string} Hex color code
 */
function getLanguageColor(language) {
  return LANGUAGE_COLORS[language] || LANGUAGE_COLORS.other;
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(BYTE_BASE));
  const size = parseFloat((bytes / Math.pow(BYTE_BASE, i)).toFixed(2));
  
  return `${size} ${BYTE_UNITS[i]}`;
}

/**
 * Check if file is an image based on extension
 * @param {string} filePathOrExt - File path or extension
 * @returns {boolean} True if image file
 */
function isImageFile(filePathOrExt) {
  const ext = getExtension(filePathOrExt);
  return IMAGE_EXTENSIONS.has(ext);
}

/**
 * Check if file is binary based on extension
 * @param {string} filePathOrExt - File path or extension
 * @returns {boolean} True if binary file
 */
function isBinaryFile(filePathOrExt) {
  const ext = getExtension(filePathOrExt);
  return BINARY_EXTENSIONS.has(ext);
}

/**
 * Check if file is text-based (not binary)
 * @param {string} filePathOrExt - File path or extension
 * @returns {boolean} True if text file
 */
function isTextFile(filePathOrExt) {
  return !isBinaryFile(filePathOrExt);
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  getFileIcon,
  getLanguageFromExtension,
  getLanguageColor,
  formatBytes,
  isImageFile,
  isBinaryFile,
  isTextFile
};
