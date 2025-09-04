#!/usr/bin/env node

const express = require('express');
const path = require('path');
const fs = require('fs');
const hljs = require('highlight.js');
const marked = require('marked');
const octicons = require('@primer/octicons');

const app = express();
const port = 3000;

const workingDir = process.cwd();

app.use('/static', express.static(path.join(__dirname, '..', 'public')));
app.use('/octicons', express.static(path.join(__dirname, '..', 'node_modules', '@primer', 'octicons', 'build')));

// Download route
app.get('/download', (req, res) => {
  const filePath = req.query.path || '';
  const fullPath = path.join(workingDir, filePath);
  
  try {
    const stats = fs.statSync(fullPath);
    if (stats.isFile()) {
      const fileName = path.basename(fullPath);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.sendFile(fullPath);
    } else {
      res.status(400).send('Cannot download directories');
    }
  } catch (error) {
    res.status(404).send('File not found');
  }
});

app.get('/', (req, res) => {
  const currentPath = req.query.path || '';
  const fullPath = path.join(workingDir, currentPath);
  
  try {
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      const items = fs.readdirSync(fullPath).map(item => {
        const itemPath = path.join(fullPath, item);
        const itemStats = fs.statSync(itemPath);
        return {
          name: item,
          path: path.join(currentPath, item).replace(/\\/g, '/'),
          isDirectory: itemStats.isDirectory(),
          size: itemStats.size,
          modified: itemStats.mtime
        };
      }).sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      
      res.send(renderDirectory(currentPath, items));
    } else {
      const content = fs.readFileSync(fullPath, 'utf8');
      const ext = path.extname(fullPath).slice(1);
      const viewMode = req.query.view || 'rendered';
      res.send(renderFile(currentPath, content, ext, viewMode));
    }
  } catch (error) {
    res.status(404).send(`<h1>File not found</h1><p>${error.message}</p>`);
  }
});

function renderDirectory(currentPath, items) {
  const breadcrumbs = generateBreadcrumbs(currentPath);
  const readmeFile = findReadmeFile(items);
  const readmePreview = readmeFile ? generateReadmePreview(currentPath, readmeFile) : '';
  const languageStats = generateLanguageStats(items);
  
  const itemsHtml = items.map(item => `
    <tr class="file-row" data-name="${item.name.toLowerCase()}" data-type="${item.isDirectory ? 'dir' : 'file'}" data-path="${item.path}">
      <td class="icon">
        ${item.isDirectory ? octicons['file-directory'].toSVG({ class: 'octicon-directory' }) : getFileIcon(item.name)}
      </td>
      <td class="name">
        <a href="/?path=${encodeURIComponent(item.path)}">${item.name}</a>
        <div class="quick-actions">
          <button class="quick-btn copy-path-btn" title="Copy path" data-path="${item.path}">
            ${octicons.copy.toSVG({ class: 'quick-icon' })}
          </button>
          ${!item.isDirectory ? `
            <a class="quick-btn download-btn" href="/download?path=${encodeURIComponent(item.path)}" title="Download" download="${item.name}">
              ${octicons.download.toSVG({ class: 'quick-icon' })}
            </a>
          ` : ''}
        </div>
      </td>
      <td class="size">
        ${item.isDirectory ? '-' : formatBytes(item.size)}
      </td>
      <td class="modified">
        ${item.modified.toLocaleDateString()}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html data-theme="dark">
    <head>
      <title>gh-here: ${currentPath || 'Root'}</title>
      <link rel="stylesheet" href="/static/styles.css?v=${Date.now()}">
      <script src="/static/app.js"></script>
    </head>
    <body>
      <header>
        <div class="header-content">
          <div class="header-left">
            <h1 class="header-path">${breadcrumbs}</h1>
          </div>
          <div class="header-right">
            <div class="search-container">
              ${octicons.search.toSVG({ class: 'search-icon' })}
              <input type="text" id="file-search" placeholder="Find files..." class="search-input">
            </div>
            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">
              ${octicons.moon.toSVG({ class: 'theme-icon' })}
            </button>
          </div>
        </div>
      </header>
      <main>
        ${languageStats}
        <div class="file-table-container">
          <table class="file-table" id="file-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Size</th>
                <th>Modified</th>
              </tr>
            </thead>
            <tbody>
              ${currentPath && currentPath !== '.' ? `
                <tr class="file-row" data-name=".." data-type="dir">
                  <td class="icon">${octicons['arrow-up'].toSVG({ class: 'octicon-directory' })}</td>
                  <td class="name">
                    <a href="/?path=${encodeURIComponent(path.dirname(currentPath))}">..</a>
                  </td>
                  <td class="size">-</td>
                  <td class="modified">-</td>
                </tr>
              ` : ''}
              ${itemsHtml}
            </tbody>
          </table>
        </div>
        ${readmePreview}
      </main>
    </body>
    </html>
  `;
}

function findReadmeFile(items) {
  const readmeNames = ['README.md', 'readme.md', 'README.rst', 'readme.rst', 'README.txt', 'readme.txt', 'README'];
  return items.find(item => !item.isDirectory && readmeNames.includes(item.name));
}

function generateReadmePreview(currentPath, readmeFile) {
  try {
    const readmePath = path.join(workingDir, currentPath, readmeFile.name);
    const content = fs.readFileSync(readmePath, 'utf8');
    const ext = path.extname(readmeFile.name).slice(1).toLowerCase();
    
    let renderedContent;
    if (ext === 'md' || ext === '') {
      renderedContent = `<div class="markdown">${marked.parse(content)}</div>`;
    } else {
      const highlighted = hljs.highlightAuto(content).value;
      renderedContent = `<pre><code class="hljs">${highlighted}</code></pre>`;
    }
    
    return `
      <div class="readme-section">
        <div class="readme-header">
          <h2>
            ${octicons.book.toSVG({ class: 'readme-icon' })}
            ${readmeFile.name}
          </h2>
        </div>
        <div class="readme-content">
          ${renderedContent}
        </div>
      </div>
    `;
  } catch (error) {
    return '';
  }
}

function generateLanguageStats(items) {
  const languages = {};
  let totalFiles = 0;
  
  items.forEach(item => {
    if (!item.isDirectory) {
      const ext = path.extname(item.name).slice(1).toLowerCase();
      const lang = getLanguageFromExtension(ext) || 'other';
      languages[lang] = (languages[lang] || 0) + 1;
      totalFiles++;
    }
  });
  
  if (totalFiles === 0) return '';
  
  const sortedLangs = Object.entries(languages)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  const statsHtml = sortedLangs.map(([lang, count]) => {
    const percentage = ((count / totalFiles) * 100).toFixed(1);
    const color = getLanguageColor(lang);
    return `
      <div class="lang-stat">
        <span class="lang-dot" style="background-color: ${color}"></span>
        <span class="lang-name">${lang}</span>
        <span class="lang-percent">${percentage}%</span>
      </div>
    `;
  }).join('');
  
  return `
    <div class="language-stats">
      ${statsHtml}
    </div>
  `;
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

function renderFile(filePath, content, ext, viewMode = 'rendered') {
  const breadcrumbs = generateBreadcrumbs(filePath);
  let displayContent;
  let viewToggle = '';
  
  if (ext === 'md') {
    if (viewMode === 'raw') {
      const highlighted = hljs.highlight(content, { language: 'markdown' }).value;
      
      // Add line numbers for raw markdown view
      const lines = highlighted.split('\n');
      const numberedLines = lines.map((line, index) => {
        const lineNum = index + 1;
        return `<span class="line-container" data-line="${lineNum}"><a class="line-number" href="#L${lineNum}" id="L${lineNum}">${lineNum}</a><span class="line-content">${line}</span></span>`;
      }).join('');
      
      displayContent = `<pre><code class="hljs with-line-numbers">${numberedLines}</code></pre>`;
    } else {
      displayContent = `<div class="markdown">${marked.parse(content)}</div>`;
    }
    
    const currentParams = new URLSearchParams({ path: filePath });
    const rawUrl = `/?${currentParams.toString()}&view=raw`;
    const renderedUrl = `/?${currentParams.toString()}&view=rendered`;
    
    viewToggle = `
      <div class="view-toggle">
        <a href="${renderedUrl}" class="view-btn ${viewMode === 'rendered' ? 'active' : ''}">
          ${octicons.eye.toSVG({ class: 'view-icon' })} Rendered
        </a>
        <a href="${rawUrl}" class="view-btn ${viewMode === 'raw' ? 'active' : ''}">
          ${octicons['file-code'].toSVG({ class: 'view-icon' })} Raw
        </a>
      </div>
    `;
  } else {
    const language = getLanguageFromExtension(ext);
    const highlighted = language ? 
      hljs.highlight(content, { language }).value : 
      hljs.highlightAuto(content).value;
    
    // Add line numbers with clickable links
    const lines = highlighted.split('\n');
    const numberedLines = lines.map((line, index) => {
      const lineNum = index + 1;
      return `<span class="line-container" data-line="${lineNum}"><a class="line-number" href="#L${lineNum}" id="L${lineNum}">${lineNum}</a><span class="line-content">${line}</span></span>`;
    }).join('');
    
    displayContent = `<pre><code class="hljs with-line-numbers">${numberedLines}</code></pre>`;
  }

  return `
    <!DOCTYPE html>
    <html data-theme="dark">
    <head>
      <title>gh-here: ${path.basename(filePath)}</title>
      <link rel="stylesheet" href="/static/styles.css?v=${Date.now()}">
      <link rel="stylesheet" href="/static/highlight.css?v=${Date.now()}">
      <script src="/static/app.js"></script>
    </head>
    <body>
      <header>
        <div class="header-content">
          <div class="header-left">
            <h1 class="header-path">${breadcrumbs}</h1>
          </div>
          <div class="header-right">
            ${viewToggle}
            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">
              ${octicons.moon.toSVG({ class: 'theme-icon' })}
            </button>
          </div>
        </div>
      </header>
      <main>
        <div class="file-content">
          ${displayContent}
        </div>
      </main>
    </body>
    </html>
  `;
}

function generateBreadcrumbs(currentPath) {
  // At root, show gh-here branding
  if (!currentPath || currentPath === '.') {
    return `${octicons.home.toSVG({ class: 'octicon-home' })} gh-here`;
  }
  
  // In subdirectories, show clickable path
  const parts = currentPath.split('/').filter(p => p && p !== '.');
  let breadcrumbs = `
    <div class="breadcrumb-item">
      <a href="/">${octicons.home.toSVG({ class: 'octicon-home' })}</a>
    </div>
  `;
  let buildPath = '';
  
  parts.forEach((part, index) => {
    buildPath += (buildPath ? '/' : '') + part;
    breadcrumbs += `
      <span class="breadcrumb-separator">/</span>
      <div class="breadcrumb-item">
        <a href="/?path=${encodeURIComponent(buildPath)}">
          <span>${part}</span>
        </a>
      </div>
    `;
  });
  
  return breadcrumbs;
}

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
    if (name === '.eslintrc' || name === '.eslintrc.json' || name === '.eslintrc.js') {
      return octicons.gear?.toSVG({ class: 'octicon-file text-purple' }) || octicons.file.toSVG({ class: 'octicon-file text-purple' });
    }
    if (name === '.prettierrc' || name === 'prettier.config.js') {
      return octicons.gear?.toSVG({ class: 'octicon-file text-blue' }) || octicons.file.toSVG({ class: 'octicon-file text-blue' });
    }
    if (name === 'webpack.config.js' || name === 'vite.config.js' || name === 'rollup.config.js') {
      return octicons.gear?.toSVG({ class: 'octicon-file text-orange' }) || octicons.file.toSVG({ class: 'octicon-file text-orange' });
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
      case '.py':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-blue' });
      case '.java':
        return octicons['file-code'].toSVG({ class: 'octicon-file text-red' });
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
        return octicons['file-code'].toSVG({ class: 'octicon-file text-purple' });
      case '.dart':
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

function getColorForExtension(ext) {
  const colorMap = {
    '.js': 'yellow', '.jsx': 'yellow', '.ts': 'blue', '.tsx': 'blue',
    '.py': 'green', '.java': 'red', '.go': 'blue', '.rs': 'orange',
    '.html': 'orange', '.css': 'purple', '.json': 'yellow',
    '.md': 'blue', '.txt': 'gray', '.sh': 'green'
  };
  return colorMap[ext] || 'gray';
}

function getLanguageFromExtension(ext) {
  const langMap = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'go': 'go',
    'rs': 'rust',
    'cpp': 'cpp',
    'cxx': 'cpp',
    'cc': 'cpp',
    'c': 'c',
    'h': 'c',
    'hpp': 'cpp',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'dart': 'dart',
    'r': 'r',
    'sql': 'sql',
    'dockerfile': 'dockerfile',
    'md': 'markdown',
    'markdown': 'markdown',
    'vue': 'vue',
    'svelte': 'svelte'
  };
  return langMap[ext];
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

app.listen(port, () => {
  console.log(`🚀 gh-here is running at http://localhost:${port}`);
  console.log(`📂 Serving files from: ${workingDir}`);
});