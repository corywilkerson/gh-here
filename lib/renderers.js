const fs = require('fs');
const path = require('path');
const hljs = require('highlight.js');
const marked = require('marked');
const octicons = require('@primer/octicons');
const { exec } = require('child_process');

const { getFileIcon, getLanguageFromExtension, getLanguageColor, formatBytes, isImageFile, isBinaryFile, isTextFile } = require('./file-utils');
const { getGitStatusIcon, getGitStatusDescription } = require('./git');

/**
 * HTML rendering module
 * Handles all HTML template generation for different views
 */

function renderDirectory(currentPath, items, showGitignored = false, gitBranch = null, gitStatus = {}, workingDir = null) {
  const workingDirName = workingDir ? path.basename(workingDir) : null;
  const breadcrumbs = generateBreadcrumbs(currentPath, gitBranch, workingDirName);
  const readmeFile = findReadmeFile(items);
  const readmePreview = readmeFile ? generateReadmePreview(currentPath, readmeFile) : '';
  const languageStats = generateLanguageStats(items);
  
  const itemsHtml = items.map(item => `
    <tr class="file-row" data-name="${item.name.toLowerCase()}" data-type="${item.isDirectory ? 'dir' : 'file'}" data-path="${item.path}">
      <td class="icon">
        ${item.isDirectory ? octicons['file-directory-fill'].toSVG({ class: 'octicon-directory' }) : getFileIcon(item.name)}
      </td>
      <td class="git-status-col">
        ${item.gitStatus ? (item.gitStatus.status === '??' ? `<span class="git-status git-status-untracked" title="Untracked file">${require('./git').getGitStatusIcon('??')}</span>` : `<span class="git-status git-status-${item.gitStatus.status.replace(' ', '')}" title="Git Status: ${getGitStatusDescription(item.gitStatus.status)}">${getGitStatusIcon(item.gitStatus.status)}</span>`) : ''}
      </td>
      <td class="name">
        <a href="/?path=${encodeURIComponent(item.path)}">${item.name}</a>
        <div class="quick-actions">
          <button class="quick-btn copy-path-btn" title="Copy path" data-path="${item.path}">
            ${octicons.copy.toSVG({ class: 'quick-icon' })}
          </button>
          ${!item.isDirectory && item.gitStatus ? `
            <button class="quick-btn diff-btn" title="Show diff" data-path="${item.path}">
              ${octicons.diff.toSVG({ class: 'quick-icon' })}
            </button>
          ` : ''}
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
            <h1>gh-here</h1>
          </div>
          <div class="header-right">
            ${Object.keys(gitStatus).length > 0 ? `
              <button id="commit-btn" class="commit-btn" title="Commit changes">
                ${octicons['git-commit'].toSVG({ class: 'commit-icon' })}
                <span class="commit-text">Commit</span>
              </button>
            ` : ''}
            <button id="gitignore-toggle" class="gitignore-toggle ${showGitignored ? 'showing-ignored' : ''}" aria-label="Toggle .gitignore filtering" title="${showGitignored ? 'Hide' : 'Show'} gitignored files">
              ${octicons.eye.toSVG({ class: 'gitignore-icon' })}
            </button>
            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">
              ${octicons.moon.toSVG({ class: 'theme-icon' })}
            </button>
          </div>
        </div>
      </header>
      
      <!-- White canvas section like GitHub -->
      <div class="repo-canvas">
        <div class="repo-canvas-content">
          <div class="breadcrumb-section">${breadcrumbs}</div>
          <hr class="repo-divider">
          
          <div class="repo-controls">
            <div class="repo-controls-left">
              ${gitBranch ? `
                <button class="branch-button">
                  ${octicons['git-branch'].toSVG({ class: 'octicon-branch' })} 
                  <span class="branch-name">${gitBranch}</span>
                  ${octicons['chevron-down'].toSVG({ class: 'octicon-chevron' })}
                </button>
              ` : ''}
            </div>
            <div class="repo-controls-right">
              <div class="search-container">
                ${octicons.search.toSVG({ class: 'search-icon' })}
                <input type="text" id="file-search" placeholder="Go to file" class="search-input">
                <kbd class="search-hotkey">t</kbd>
              </div>
              <button id="new-file-btn" class="btn btn-outline">
                <span class="btn-text">New file</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <main>
        <div class="repo-canvas">
          <div class="repo-canvas-content">
            ${languageStats}
            <div class="file-table-container">
              <table class="file-table" id="file-table">
            <thead>
              <tr>
                <th></th>
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
                  <td class="git-status-col"></td>
                  <td class="name">
                    <a href="/?path=${encodeURIComponent(path.dirname(currentPath))}">.</a>
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
          </div>
        </div>
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
    const readmePath = path.join(process.cwd(), currentPath, readmeFile.name);
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

async function renderFileDiff(filePath, ext, gitInfo, gitRepoRoot) {
  const breadcrumbs = generateBreadcrumbs(filePath);
  
  // Get git diff for the file
  return new Promise((resolve, reject) => {
    const diffCommand = gitInfo.staged ? 
      `git diff --cached "${filePath}"` : 
      `git diff "${filePath}"`;
    
    exec(diffCommand, { cwd: gitRepoRoot }, (error, stdout) => {
      if (error) {
        return reject(error);
      }
      
      const diffContent = renderRawDiff(stdout, ext);
      const currentParams = new URLSearchParams({ path: filePath });
      const viewUrl = `/?${currentParams.toString()}&view=rendered`;
      const rawUrl = `/?${currentParams.toString()}&view=raw`;
      const diffUrl = `/?${currentParams.toString()}&view=diff`;
      
      const viewToggle = `
        <div class="view-toggle">
          <a href="${viewUrl}" class="view-btn">
            ${octicons.eye.toSVG({ class: 'view-icon' })} View
          </a>
          ${ext === 'md' ? `
            <a href="${rawUrl}" class="view-btn">
              ${octicons['file-code'].toSVG({ class: 'view-icon' })} Raw
            </a>
          ` : ''}
          <a href="${diffUrl}" class="view-btn active">
            ${octicons.diff.toSVG({ class: 'view-icon' })} Diff
          </a>
        </div>
      `;
      
      const html = `
        <!DOCTYPE html>
        <html data-theme="dark">
        <head>
          <title>gh-here: ${path.basename(filePath)} (diff)</title>
          <link rel="stylesheet" href="/static/styles.css?v=${Date.now()}">
          <link rel="stylesheet" href="/static/highlight.css?v=${Date.now()}">
          <script src="/static/app.js"></script>
        </head>
        <body>
          <header>
            <div class="header-content">
              <div class="header-left">
                <h1>gh-here</h1>
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
            <div class="main-content">
              <div class="breadcrumb-section">${breadcrumbs}</div>
              <div class="diff-container">
                <div class="diff-content">
                  ${diffContent}
                </div>
              </div>
            </div>
          </main>
        </body>
        </html>
      `;
      
      resolve(html);
    });
  });
}

function renderRawDiff(diffOutput, ext) {
  if (!diffOutput.trim()) {
    return '<div class="no-changes">No changes to display</div>';
  }
  
  const language = getLanguageFromExtension(ext);
  
  // Apply syntax highlighting to the entire diff
  let highlighted;
  try {
    // Use diff language for syntax highlighting if available, otherwise use the file's language
    highlighted = hljs.highlight(diffOutput, { language: 'diff' }).value;
  } catch {
    // Fallback to plain text if diff highlighting fails
    highlighted = diffOutput.replace(/&/g, '&amp;')
                             .replace(/</g, '&lt;')
                             .replace(/>/g, '&gt;');
  }
  
  // Split into lines and add line numbers
  const lines = highlighted.split('\n');
  let lineNumber = 1;
  
  const linesHtml = lines.map(line => {
    // Determine line type based on first character
    let lineType = 'context';
    let displayLine = line;
    
    if (line.startsWith('<span class="hljs-deletion">-') || line.startsWith('-')) {
      lineType = 'removed';
    } else if (line.startsWith('<span class="hljs-addition">+') || line.startsWith('+')) {
      lineType = 'added';
    } else if (line.startsWith('@@') || line.includes('hljs-meta')) {
      lineType = 'hunk';
    } else if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('---') || line.startsWith('+++')) {
      lineType = 'header';
    }
    
    const currentLineNumber = (lineType === 'context' || lineType === 'removed' || lineType === 'added') ? lineNumber++ : '';
    
    return `<div class="diff-line diff-line-${lineType}">
      <span class="diff-line-number">${currentLineNumber}</span>
      <span class="diff-line-content">${displayLine}</span>
    </div>`;
  }).join('');
  
  return `<div class="raw-diff-container">${linesHtml}</div>`;
}


async function renderFile(filePath, content, ext, viewMode = 'rendered', gitStatus = null, workingDir) {
  const breadcrumbs = generateBreadcrumbs(filePath);
  let displayContent;
  let viewToggle = '';
  
  // Check if file has git changes
  const absolutePath = path.resolve(path.join(workingDir, filePath));
  const hasGitChanges = gitStatus && gitStatus[absolutePath];
  
  // Determine file category and handle accordingly
  if (isImageFile(ext)) {
    // Handle image files
    const imageUrl = `/download?path=${encodeURIComponent(filePath)}`;
    displayContent = `
      <div class="image-container">
        <img src="${imageUrl}" alt="${path.basename(filePath)}" class="image-display">
        <div class="image-info">
          <span class="image-filename">${path.basename(filePath)}</span>
        </div>
      </div>
    `;
    
    // Add diff view for images with git changes
    if (hasGitChanges) {
      const currentParams = new URLSearchParams({ path: filePath });
      const diffUrl = `/?${currentParams.toString()}&view=diff`;
      
      viewToggle = `
        <div class="view-toggle">
          <a href="/?path=${encodeURIComponent(filePath)}" class="view-btn active">
            ${octicons.eye.toSVG({ class: 'view-icon' })} View
          </a>
          <a href="${diffUrl}" class="view-btn">
            ${octicons.diff.toSVG({ class: 'view-icon' })} Diff
          </a>
        </div>
      `;
    }
  } else if (isBinaryFile(ext) && !isImageFile(ext)) {
    // Handle other binary files - download only
    displayContent = `
      <div class="binary-file-container">
        <div class="binary-file-info">
          <h3>Binary File</h3>
          <p>This is a binary file that cannot be displayed in the browser.</p>
          <a href="/download?path=${encodeURIComponent(filePath)}" class="btn btn-primary" download="${path.basename(filePath)}">
            ${octicons.download.toSVG({ class: 'download-icon' })} Download File
          </a>
        </div>
      </div>
    `;
  } else if (ext === 'md') {
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
    const diffUrl = `/?${currentParams.toString()}&view=diff`;
    
    viewToggle = `
      <div class="view-toggle">
        <a href="${renderedUrl}" class="view-btn ${viewMode === 'rendered' ? 'active' : ''}">
          ${octicons.eye.toSVG({ class: 'view-icon' })} View
        </a>
        <a href="${rawUrl}" class="view-btn ${viewMode === 'raw' ? 'active' : ''}">
          ${octicons['file-code'].toSVG({ class: 'view-icon' })} Raw
        </a>
        ${hasGitChanges ? `
          <a href="${diffUrl}" class="view-btn ${viewMode === 'diff' ? 'active' : ''}">
            ${octicons.diff.toSVG({ class: 'view-icon' })} Diff
          </a>
        ` : ''}
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
    
    // Add view toggle for non-markdown files with git changes
    if (hasGitChanges) {
      const currentParams = new URLSearchParams({ path: filePath });
      const viewUrl = `/?${currentParams.toString()}&view=rendered`;
      const diffUrl = `/?${currentParams.toString()}&view=diff`;
      
      viewToggle = `
        <div class="view-toggle">
          <a href="${viewUrl}" class="view-btn ${viewMode === 'rendered' ? 'active' : ''}">
            ${octicons.eye.toSVG({ class: 'view-icon' })} View
          </a>
          <a href="${diffUrl}" class="view-btn ${viewMode === 'diff' ? 'active' : ''}">
            ${octicons.diff.toSVG({ class: 'view-icon' })} Diff
          </a>
        </div>
      `;
    }
  }

  return `
    <!DOCTYPE html>
    <html data-theme="dark">
    <head>
      <title>gh-here: ${path.basename(filePath)}</title>
      <link rel="stylesheet" href="/static/styles.css?v=${Date.now()}">
      <link rel="stylesheet" href="/static/highlight.css?v=${Date.now()}">
      <script src="/static/app.js"></script>
      <script src="https://unpkg.com/monaco-editor@0.45.0/min/vs/loader.js"></script>
    </head>
    <body>
      <header>
        <div class="header-content">
          <div class="header-left">
            <h1>gh-here</h1>
          </div>
          <div class="header-right">
            <div id="filename-input-container" class="filename-input-container" style="display: none;">
              <input type="text" id="filename-input" class="filename-input" placeholder="Name your file...">
            </div>
            ${isTextFile(ext) ? `
              <button id="edit-btn" class="edit-btn" aria-label="Edit file">
                ${octicons.pencil.toSVG({ class: 'edit-icon' })}
              </button>
            ` : ''}
            ${viewToggle}
            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">
              ${octicons.moon.toSVG({ class: 'theme-icon' })}
            </button>
          </div>
        </div>
      </header>
      <main>
        <div class="main-content">
          <div class="breadcrumb-section">${breadcrumbs}</div>
          <div class="file-content">
            ${displayContent}
          </div>
        ${isTextFile(ext) ? `
        <div id="editor-container" class="editor-container" style="display: none;">
          <div class="editor-header">
            <div class="editor-title">Edit ${path.basename(filePath)}</div>
            <div class="editor-actions">
              <button id="word-wrap-btn" class="btn btn-secondary" title="Toggle word wrap (Alt+Z)">↩ Wrap</button>
              <button id="cancel-btn" class="btn btn-secondary">Cancel</button>
              <button id="save-btn" class="btn btn-primary">Save</button>
            </div>
          </div>
          <div class="monaco-editor-container">
            <div id="file-editor" class="monaco-editor"></div>
          </div>
        </div>
        ` : ''}
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
      <script src="https://unpkg.com/monaco-editor@0.45.0/min/vs/loader.js"></script>
    </head>
    <body>
      <header>
        <div class="header-content">
          <div class="header-left">
            <h1>gh-here</h1>
          </div>
          <div class="header-right">
            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">
              ${octicons.moon.toSVG({ class: 'theme-icon' })}
            </button>
          </div>
        </div>
      </header>
      <main>
        <div class="main-content">
          <div class="breadcrumb-section">${breadcrumbs}</div>
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
            <div class="monaco-editor-container">
              <div id="new-file-content" class="monaco-editor"></div>
            </div>
          </div>
        </div>
        </div>
      </main>
    </body>
    </html>
  `;
}

function generateBreadcrumbs(currentPath, gitBranch = null, workingDirName = null) {
  const rootDisplayName = workingDirName || 'repository';
  
  // At root, show working directory name
  if (!currentPath || currentPath === '.') {
    return `${octicons.home.toSVG({ class: 'octicon-home' })} ${rootDisplayName}`;
  }
  
  // In subdirectories, show clickable path
  const parts = currentPath.split('/').filter(p => p && p !== '.');
  let breadcrumbs = `
    <div class="breadcrumb-item">
      <a href="/">${octicons.home.toSVG({ class: 'octicon-home' })} ${rootDisplayName}</a>
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

module.exports = {
  renderDirectory,
  renderFileDiff,
  renderFile,
  renderNewFile,
  generateBreadcrumbs,
  findReadmeFile,
  generateReadmePreview,
  generateLanguageStats,
  renderRawDiff
};