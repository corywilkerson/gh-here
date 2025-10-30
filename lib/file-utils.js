const path = require('path');
const octicons = require('@primer/octicons');

/**
 * File utilities module
 * Handles file icons, language detection, and formatting
 */

function getFileIcon(filename) {
  const ext = path.extname(filename).toLowerCase();
  const name = filename.toLowerCase();
  
  try {
    // Configuration files
    if (name === 'package.json' || name === 'composer.json') {
      return octicons['file-code'].toSVG({ class: 'octicon-file text-green' });
    }
    if (name === 'tsconfig.json' || name === 'jsconfig.json') {
      return octicons['file-code'].toSVG({ class: 'octicon-file text-blue' });
    }
    if (name === '.eslintrc' || name === '.eslintrc.json' || name === '.eslintrc.js' || name === '.eslintrc.yml') {
      return octicons.gear?.toSVG({ class: 'octicon-file text-purple' }) || octicons.file.toSVG({ class: 'octicon-file text-purple' });
    }
    if (name === '.prettierrc' || name === 'prettier.config.js' || name === '.prettierrc.json') {
      return octicons.gear?.toSVG({ class: 'octicon-file text-blue' }) || octicons.file.toSVG({ class: 'octicon-file text-blue' });
    }
    if (name === 'webpack.config.js' || name === 'vite.config.js' || name === 'rollup.config.js' || name === 'next.config.js' || name === 'nuxt.config.js' || name === 'svelte.config.js') {
      return octicons.gear?.toSVG({ class: 'octicon-file text-orange' }) || octicons.file.toSVG({ class: 'octicon-file text-orange' });
    }
    if (name === 'tailwind.config.js' || name === 'postcss.config.js' || name === 'babel.config.js' || name === '.babelrc') {
      return octicons.gear?.toSVG({ class: 'octicon-file text-purple' }) || octicons.file.toSVG({ class: 'octicon-file text-purple' });
    }
    
    // Docker files
    if (name === 'dockerfile' || name === 'dockerfile.dev' || name === '.dockerignore') {
      return octicons.container?.toSVG({ class: 'octicon-file text-blue' }) || octicons.file.toSVG({ class: 'octicon-file text-blue' });
    }
    if (name === 'docker-compose.yml' || name === 'docker-compose.yaml') {
      return octicons.container?.toSVG({ class: 'octicon-file text-blue' }) || octicons.file.toSVG({ class: 'octicon-file text-blue' });
    }
    
    // Git files
    if (name === '.gitignore' || name === '.gitattributes' || name === '.gitmodules') {
      return octicons['git-branch']?.toSVG({ class: 'octicon-file text-orange' }) || octicons.file.toSVG({ class: 'octicon-file text-orange' });
    }
    
    // Documentation
    if (name.startsWith('readme') || name === 'changelog.md' || name === 'history.md') {
      return octicons.book.toSVG({ class: 'octicon-file text-blue' });
    }
    if (name === 'license' || name === 'license.txt' || name === 'license.md') {
      return octicons.law?.toSVG({ class: 'octicon-file text-yellow' }) || octicons.file.toSVG({ class: 'octicon-file text-yellow' });
    }
    
    // Build files
    if (name === 'makefile' || name === 'makefile.am' || name === 'cmakelists.txt') {
      return octicons.tools?.toSVG({ class: 'octicon-file text-gray' }) || octicons.file.toSVG({ class: 'octicon-file text-gray' });
    }
    if (name.endsWith('.lock') || name === 'yarn.lock' || name === 'package-lock.json' || name === 'pipfile.lock') {
      return octicons.lock?.toSVG({ class: 'octicon-file text-yellow' }) || octicons.file.toSVG({ class: 'octicon-file text-yellow' });
    }
    
    // CI/CD files
    if (name === '.travis.yml' || name === '.circleci' || name.startsWith('.github')) {
      return octicons.gear?.toSVG({ class: 'octicon-file text-green' }) || octicons.file.toSVG({ class: 'octicon-file text-green' });
    }
    
    // Environment files
    if (name === '.env' || name === '.env.local' || name.startsWith('.env.')) {
      return octicons.key?.toSVG({ class: 'octicon-file text-yellow' }) || octicons.file.toSVG({ class: 'octicon-file text-yellow' });
    }
    
    // Extension-based icons
    switch (ext) {
      case '.js':
      case '.mjs':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-yellow' });
      case '.jsx':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-blue' });
      case '.ts':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-blue' });
      case '.tsx':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-blue' });
      case '.vue':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-green' });
      case '.svelte':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-orange' });
      case '.py':
      case '.pyx':
      case '.pyi':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-blue' });
      case '.java':
      case '.class':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-red' });
      case '.c':
      case '.h':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-blue' });
      case '.cpp':
      case '.cxx':
      case '.cc':
      case '.hpp':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-blue' });
      case '.cs':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-purple' });
      case '.go':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-blue' });
      case '.rs':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-orange' });
      case '.php':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-purple' });
      case '.rb':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-red' });
      case '.swift':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-orange' });
      case '.kt':
      case '.kts':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-purple' });
      case '.dart':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-blue' });
      case '.scala':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-red' });
      case '.clj':
      case '.cljs':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-green' });
      case '.hs':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-purple' });
      case '.elm':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-blue' });
      case '.r':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-blue' });
      case '.html':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-orange' });
      case '.css':
      case '.scss':
      case '.sass':
      case '.less':
        return octicons.paintbrush?.toSVG({ class: 'octicon-file text-purple' }) || octicons.file.toSVG({ class: 'octicon-file text-purple' });
      case '.json':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-yellow' });
      case '.xml':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-orange' });
      case '.yml':
      case '.yaml':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-purple' });
      case '.md':
      case '.markdown':
        return octicons.book.toSVG({ class: 'octicon-file text-blue' });
      case '.txt':
        return octicons['file-text']?.toSVG({ class: 'octicon-file text-gray' }) || octicons.file.toSVG({ class: 'octicon-file text-gray' });
      case '.pdf':
        return octicons['file-binary']?.toSVG({ class: 'octicon-file text-red' }) || octicons.file.toSVG({ class: 'octicon-file text-red' });
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.gif':
      case '.svg':
      case '.webp':
        return octicons['file-media']?.toSVG({ class: 'octicon-file text-purple' }) || octicons.file.toSVG({ class: 'octicon-file text-purple' });
      case '.mp4':
      case '.mov':
      case '.avi':
      case '.mkv':
        return octicons['device-camera-video']?.toSVG({ class: 'octicon-file text-red' }) || octicons.file.toSVG({ class: 'octicon-file text-red' });
      case '.mp3':
      case '.wav':
      case '.flac':
        return octicons.unmute?.toSVG({ class: 'octicon-file text-purple' }) || octicons.file.toSVG({ class: 'octicon-file text-purple' });
      case '.zip':
      case '.tar':
      case '.gz':
      case '.rar':
      case '.7z':
        return octicons['file-zip']?.toSVG({ class: 'octicon-file text-yellow' }) || octicons.file.toSVG({ class: 'octicon-file text-yellow' });
      case '.sh':
      case '.bash':
      case '.zsh':
      case '.fish':
        return octicons.terminal?.toSVG({ class: 'octicon-file text-green' }) || octicons.file.toSVG({ class: 'octicon-file text-green' });
      case '.sql':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-orange' });
      default:
        return octicons.file.toSVG({ class: 'octicon-file text-gray' });
    }
  } catch (error) {
    return octicons.file.toSVG({ class: 'octicon-file text-gray' });
  }
}

function getLanguageFromExtension(ext) {
  if (!ext) return undefined;
  const normalized = String(ext).toLowerCase();
  const langMap = {
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
  return langMap[normalized];
}

function getLanguageColor(language) {
  const colors = {
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
  return colors[language] || colors.other;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * File type detection functions
 */
function isImageFile(filePathOrExt) {
  const ext = getExtension(filePathOrExt);
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'ico'];
  return imageExtensions.includes(ext);
}

function isBinaryFile(filePathOrExt) {
  const ext = getExtension(filePathOrExt);
  const binaryExtensions = [
    // Images (handled separately)
    'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'ico',
    // Archives
    'zip', 'tar', 'gz', 'rar', '7z', 
    // Executables
    'exe', 'bin', 'app', 'deb', 'rpm',
    // Documents
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    // Media
    'mp4', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'flac',
    // Other
    'class', 'so', 'dll', 'dylib'
  ];
  return binaryExtensions.includes(ext);
}

function isTextFile(filePathOrExt) {
  return !isBinaryFile(filePathOrExt);
}

function getExtension(filePathOrExt) {
  // If it's already just an extension (no dots), return as-is
  if (!filePathOrExt.includes('.') && !filePathOrExt.includes('/') && !filePathOrExt.includes('\\')) {
    return filePathOrExt.toLowerCase();
  }
  // Extract extension from file path
  return path.extname(filePathOrExt).toLowerCase().slice(1);
}

module.exports = {
  getFileIcon,
  getLanguageFromExtension,
  getLanguageColor,
  formatBytes,
  isImageFile,
  isBinaryFile,
  isTextFile
};