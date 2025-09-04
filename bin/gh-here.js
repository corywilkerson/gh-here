#!/usr/bin/env node

const express = require('express');
const path = require('path');
const fs = require('fs');
const hljs = require('highlight.js');
const marked = require('marked');
const octicons = require('@primer/octicons');
const { exec } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const openBrowser = args.includes('--open') || args.includes('-o');
const helpRequested = args.includes('--help') || args.includes('-h');

// Check for browser specification
let specificBrowser = null;
const browserArg = args.find(arg => arg.startsWith('--browser='));
if (browserArg) {
  specificBrowser = browserArg.split('=')[1];
}

if (helpRequested) {
  console.log(`
gh-here - GitHub-like local file browser

Usage: npx gh-here [options]

Options:
  --open, -o              Open browser automatically
  --browser=<name>        Specify browser (safari, chrome, firefox, arc)
  --help, -h              Show this help message

Examples:
  npx gh-here                           Start server on available port
  npx gh-here --open                    Start server and open browser
  npx gh-here --open --browser=safari   Start server and open in Safari
  npx gh-here --open --browser=arc      Start server and open in Arc
`);
  process.exit(0);
}

const app = express();
const workingDir = process.cwd();

// .gitignore parsing functionality
function parseGitignore(gitignorePath) {
  try {
    if (!fs.existsSync(gitignorePath)) {
      return [];
    }
    
    const content = fs.readFileSync(gitignorePath, 'utf8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(pattern => {
        // Convert gitignore patterns to regex-like matching
        if (pattern.endsWith('/')) {
          // Directory pattern
          return { pattern: pattern.slice(0, -1), isDirectory: true };
        }
        return { pattern, isDirectory: false };
      });
  } catch (error) {
    return [];
  }
}

function isIgnoredByGitignore(filePath, gitignoreRules, isDirectory = false) {
  if (!gitignoreRules || gitignoreRules.length === 0) {
    return false;
  }
  
  const relativePath = path.relative(workingDir, filePath).replace(/\\/g, '/');
  const pathParts = relativePath.split('/');
  
  for (const rule of gitignoreRules) {
    const { pattern, isDirectory: ruleIsDirectory } = rule;
    
    // Skip directory rules for files and vice versa (unless rule applies to both)
    if (ruleIsDirectory && !isDirectory) {
      continue;
    }
    
    // Simple pattern matching (this is a basic implementation)
    if (pattern.includes('*')) {
      // Wildcard matching
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(relativePath) || pathParts.some(part => regex.test(part))) {
        return true;
      }
    } else {
      // Exact matching
      if (relativePath === pattern || 
          relativePath.startsWith(pattern + '/') ||
          pathParts.includes(pattern)) {
        return true;
      }
    }
  }
  
  return false;
}

// Cache for gitignore rules
let gitignoreCache = null;
let gitignoreCacheTime = 0;

function getGitignoreRules() {
  const gitignorePath = path.join(workingDir, '.gitignore');
  const now = Date.now();
  
  // Cache for 5 seconds to avoid excessive file reads
  if (gitignoreCache && (now - gitignoreCacheTime) < 5000) {
    return gitignoreCache;
  }
  
  gitignoreCache = parseGitignore(gitignorePath);
  gitignoreCacheTime = now;
  return gitignoreCache;
}

// Function to find an available port
async function findAvailablePort(startPort = 3000) {
  const net = require('net');
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try next one
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

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
  const showGitignored = req.query.gitignore === 'false'; // Default to hiding gitignored files
  const fullPath = path.join(workingDir, currentPath);
  
  try {
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      const gitignoreRules = getGitignoreRules();
      
      let items = fs.readdirSync(fullPath).map(item => {
        const itemPath = path.join(fullPath, item);
        const itemStats = fs.statSync(itemPath);
        return {
          name: item,
          path: path.join(currentPath, item).replace(/\\/g, '/'),
          isDirectory: itemStats.isDirectory(),
          size: itemStats.size,
          modified: itemStats.mtime
        };
      });
      
      // Filter out gitignored files unless explicitly requested to show them
      if (!showGitignored) {
        items = items.filter(item => {
          const itemFullPath = path.join(fullPath, item.name);
          return !isIgnoredByGitignore(itemFullPath, gitignoreRules, item.isDirectory);
        });
      }
      
      // Sort items (directories first, then alphabetically)
      items.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      
      res.send(renderDirectory(currentPath, items, showGitignored));
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

// Route for creating new files
app.get('/new', (req, res) => {
  const currentPath = req.query.path || '';
  res.send(renderNewFile(currentPath));
});

// API endpoint to get file content for editing
app.get('/api/file-content', (req, res) => {
  try {
    const currentPath = req.query.path || '';
    const fullPath = path.join(process.cwd(), currentPath);
    
    // Security check - ensure we're not accessing files outside the current directory
    if (!fullPath.startsWith(process.cwd())) {
      return res.status(403).send('Access denied');
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    res.send(content);
  } catch (error) {
    res.status(404).send(`File not found: ${error.message}`);
  }
});

// API endpoint to save file changes
app.post('/api/save-file', express.json(), (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    const fullPath = path.join(process.cwd(), filePath || '');
    
    // Security check - ensure we're not accessing files outside the current directory
    if (!fullPath.startsWith(process.cwd())) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    fs.writeFileSync(fullPath, content, 'utf-8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to create new file
app.post('/api/create-file', express.json(), (req, res) => {
  try {
    const { path: dirPath, filename } = req.body;
    const fullDirPath = path.join(process.cwd(), dirPath || '');
    const fullFilePath = path.join(fullDirPath, filename);
    
    // Security checks
    if (!fullDirPath.startsWith(process.cwd()) || !fullFilePath.startsWith(process.cwd())) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Check if file already exists
    if (fs.existsSync(fullFilePath)) {
      return res.status(400).json({ success: false, error: 'File already exists' });
    }
    
    // Create the file with empty content
    fs.writeFileSync(fullFilePath, '', 'utf-8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to create new folder
app.post('/api/create-folder', express.json(), (req, res) => {
  try {
    const { path: dirPath, foldername } = req.body;
    const fullDirPath = path.join(process.cwd(), dirPath || '');
    const fullFolderPath = path.join(fullDirPath, foldername);
    
    // Security checks
    if (!fullDirPath.startsWith(process.cwd()) || !fullFolderPath.startsWith(process.cwd())) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Check if folder already exists
    if (fs.existsSync(fullFolderPath)) {
      return res.status(400).json({ success: false, error: 'Folder already exists' });
    }
    
    // Create the folder
    fs.mkdirSync(fullFolderPath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to delete file or folder
app.post('/api/delete', express.json(), (req, res) => {
  try {
    const { path: itemPath } = req.body;
    const fullPath = path.join(process.cwd(), itemPath);
    
    // Security check
    if (!fullPath.startsWith(process.cwd())) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Check if item exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    // Delete the item
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to rename file or folder
app.post('/api/rename', express.json(), (req, res) => {
  try {
    const { path: oldPath, newName } = req.body;
    const fullOldPath = path.join(process.cwd(), oldPath);
    const dirPath = path.dirname(fullOldPath);
    const fullNewPath = path.join(dirPath, newName);
    
    // Security checks
    if (!fullOldPath.startsWith(process.cwd()) || !fullNewPath.startsWith(process.cwd())) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Check if old item exists
    if (!fs.existsSync(fullOldPath)) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    // Check if new name already exists
    if (fs.existsSync(fullNewPath)) {
      return res.status(400).json({ success: false, error: 'Name already exists' });
    }
    
    // Rename the item
    fs.renameSync(fullOldPath, fullNewPath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function renderDirectory(currentPath, items, showGitignored = false) {
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
          ${!item.isDirectory ? `
            <button class="quick-btn edit-file-btn" title="Edit file" data-path="${item.path}">
              ${octicons.pencil.toSVG({ class: 'quick-icon' })}
            </button>
          ` : `
            <button class="quick-btn rename-btn" title="Rename" data-path="${item.path}" data-name="${item.name}" data-is-directory="${item.isDirectory}">
              ${octicons.pencil.toSVG({ class: 'quick-icon' })}
            </button>
          `}
          <button class="quick-btn delete-btn" title="Delete" data-path="${item.path}" data-name="${item.name}" data-is-directory="${item.isDirectory}">
            ${octicons.trash.toSVG({ class: 'quick-icon' })}
          </button>
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
            <button id="gitignore-toggle" class="gitignore-toggle ${showGitignored ? 'showing-ignored' : ''}" aria-label="Toggle .gitignore filtering" title="${showGitignored ? 'Hide' : 'Show'} gitignored files">
              ${octicons.eye.toSVG({ class: 'gitignore-icon' })}
            </button>
            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">
              ${octicons.moon.toSVG({ class: 'theme-icon' })}
            </button>
          </div>
        </div>
      </header>
      <main>
        ${languageStats}
        <div class="directory-actions">
          <button id="new-file-btn" class="btn btn-secondary">
            ${octicons['file-added'].toSVG({ class: 'btn-icon' })} New file
          </button>
        </div>
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
            <div id="filename-input-container" class="filename-input-container" style="display: none;">
              <input type="text" id="filename-input" class="filename-input" placeholder="Name your file...">
            </div>
            <button id="edit-btn" class="edit-btn" aria-label="Edit file">
              ${octicons.pencil.toSVG({ class: 'edit-icon' })}
            </button>
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
        <div id="editor-container" class="editor-container" style="display: none;">
          <div class="editor-header">
            <div class="editor-title">Edit ${path.basename(filePath)}</div>
            <div class="editor-actions">
              <button id="cancel-btn" class="btn btn-secondary">Cancel</button>
              <button id="save-btn" class="btn btn-primary">Save</button>
            </div>
          </div>
          <div class="editor-with-line-numbers">
            <div class="editor-line-numbers" id="editor-line-numbers">1</div>
            <textarea id="file-editor" class="file-editor"></textarea>
          </div>
        </div>
      </main>
    </body>
    </html>
  `;
}

function renderNewFile(currentPath) {
  const breadcrumbs = generateBreadcrumbs(currentPath);
  
  return `
    <!DOCTYPE html>
    <html data-theme="dark">
    <head>
      <title>gh-here: Create new file</title>
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
            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">
              ${octicons.moon.toSVG({ class: 'theme-icon' })}
            </button>
          </div>
        </div>
      </header>
      <main>
        <div class="new-file-container">
          <div class="new-file-header">
            <div class="filename-section">
              <span class="filename-label">Name your file...</span>
              <input type="text" id="new-filename-input" class="new-filename-input" placeholder="README.md" autofocus>
            </div>
            <div class="new-file-actions">
              <button id="cancel-new-file" class="btn btn-secondary">Cancel</button>
              <button id="create-new-file" class="btn btn-primary">Create file</button>
            </div>
          </div>
          <div class="new-file-editor">
            <div class="editor-with-line-numbers">
              <div class="editor-line-numbers" id="new-file-line-numbers">1</div>
              <textarea id="new-file-content" class="file-editor" placeholder="Enter file contents here..."></textarea>
            </div>
          </div>
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

// Function to open browser
function openBrowserToUrl(url) {
  let command;
  
  if (process.platform === 'win32') {
    if (specificBrowser) {
      // On Windows, try to use specific browser
      const browserMap = {
        'chrome': 'chrome.exe',
        'firefox': 'firefox.exe',
        'edge': 'msedge.exe',
        'safari': 'safari.exe'
      };
      const browserExe = browserMap[specificBrowser.toLowerCase()] || `${specificBrowser}.exe`;
      command = `start ${browserExe} ${url}`;
    } else {
      command = `start ${url}`;
    }
  } else if (process.platform === 'darwin') {
    if (specificBrowser) {
      // On macOS, use specific browser application
      const browserMap = {
        'safari': 'Safari',
        'chrome': 'Google Chrome', 
        'firefox': 'Firefox',
        'arc': 'Arc',
        'edge': 'Microsoft Edge'
      };
      const browserApp = browserMap[specificBrowser.toLowerCase()] || specificBrowser;
      command = `open -a "${browserApp}" "${url}"`;
      console.log(`🔗 Opening in ${browserApp}: ${url}`);
    } else {
      // Use default browser
      command = `open "${url}"`;
      console.log(`🔗 Opening in default browser: ${url}`);
    }
  } else {
    // Linux
    if (specificBrowser) {
      command = `${specificBrowser} ${url}`;
    } else {
      command = `xdg-open ${url}`;
    }
  }
  
  exec(command, (error) => {
    if (error) {
      console.log(`⚠️  Could not open browser automatically: ${error.message}`);
      if (specificBrowser) {
        console.log(`   Make sure ${specificBrowser} is installed and accessible`);
      }
      console.log(`   Please open ${url} manually`);
    } else {
      console.log(`✅ Browser opened successfully`);
    }
  });
}

// Start server with automatic port selection
async function startServer() {
  try {
    const port = await findAvailablePort();
    const url = `http://localhost:${port}`;
    
    app.listen(port, () => {
      console.log(`🚀 gh-here is running at ${url}`);
      console.log(`📂 Serving files from: ${workingDir}`);
      
      if (openBrowser) {
        console.log(`🌍 Opening browser...`);
        setTimeout(() => openBrowserToUrl(url), 1000);
      } else {
        console.log(`💡 Tip: Use --open flag to launch browser automatically`);
      }
    });
  } catch (error) {
    console.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();