/**
 * Utility functions for path and URL manipulation
 */

export const PathUtils = {
  getCurrentPath() {
    const currentUrl = new URL(window.location.href);
    return currentUrl.searchParams.get('path') || '';
  },

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
  },

  buildFilePath(currentPath, filename) {
    return currentPath ? `${currentPath}/${filename}` : filename;
  },

  getFileName(filePath) {
    return filePath.split('/').pop() || 'file.txt';
  },

  buildPathUrl(basePath, targetPath) {
    return targetPath ? `${basePath}?path=${encodeURIComponent(targetPath)}` : basePath;
  },

  getDirectoryPath(filePath) {
    const parts = filePath.split('/').filter(p => p);
    if (parts.length <= 1) {
      return '';
    }
    return parts.slice(0, -1).join('/');
  }
};

/**
 * Language detection utility
 */
export function getLanguageFromExtension(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const languageMap = {
    js: 'javascript',
    mjs: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    py: 'python',
    java: 'java',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    swift: 'swift',
    kt: 'kotlin',
    dart: 'dart',
    c: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    h: 'c',
    hpp: 'cpp',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    fish: 'shell',
    ps1: 'powershell',
    sql: 'sql',
    r: 'r',
    scala: 'scala',
    clj: 'clojure',
    lua: 'lua',
    pl: 'perl',
    groovy: 'groovy',
    md: 'markdown',
    txt: 'plaintext',
    log: 'plaintext'
  };

  const basename = filename.toLowerCase();
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

  return languageMap[ext] || 'plaintext';
}

/**
 * HTML escaping utility
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
