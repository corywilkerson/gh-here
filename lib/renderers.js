const fs = require('fs');
const path = require('path');
const hljs = require('highlight.js');
const marked = require('marked');
const octicons = require('@primer/octicons');
const { exec } = require('child_process');

const { getFileIcon, getLanguageFromExtension, getLanguageColor, formatBytes, isImageFile, isBinaryFile, isTextFile } = require('./file-utils');
const { getGitStatusIcon, getGitStatusDescription } = require('./git');

// Configure marked to use highlight.js for syntax highlighting
marked.use({
  renderer: {
    code(code, language) {
      if (language && hljs.getLanguage(language)) {
        try {
          return `<pre><code class="hljs language-${language}">${hljs.highlight(code, { language }).value}</code></pre>`;
        } catch (err) {
          // Fall back to auto-detection if language-specific highlighting fails
        }
      }
      // Auto-detect language if not specified or language not found
      return `<pre><code class="hljs">${hljs.highlightAuto(code).value}</code></pre>`;
    }
  }
});

/**
 * HTML rendering module
 * Handles all HTML template generation for different views
 */

function renderDirectory(currentPath, items, showGitignored = false, gitBranch = null, gitStatus = {}, workingDir = null) {
  const workingDirName = workingDir ? path.basename(workingDir) : null;
  const breadcrumbs = generateBreadcrumbs(currentPath, gitBranch, workingDirName);
  const readmeFile = findReadmeFile(items);
  const readmePreview = readmeFile ? generateReadmePreview(currentPath, readmeFile) : '';
  // Only show language stats on root/top-level directory
  const languageStats = (!currentPath || currentPath === '.') ? generateLanguageStats(items) : '';
  
  const itemsHtml = items.map(item => {
    const statusMap = {
      'A': 'added',
      'M': 'modified',
      'D': 'deleted',
      'R': 'renamed',
      '??': 'untracked',
      'MM': 'mixed',
      'AM': 'mixed',
      'AD': 'mixed'
    };
    const statusKey = item.gitStatus ? statusMap[item.gitStatus.status] || '' : '';
    const rowStatusClass = statusKey ? ` file-row--${statusKey}` : '';
    return `
    <tr class="file-row${rowStatusClass}" data-name="${item.name.toLowerCase()}" data-type="${item.isDirectory ? 'dir' : 'file'}" data-path="${item.path}">
      <td class="col-icon">
        ${item.isDirectory ? octicons['file-directory-fill'].toSVG({ class: 'octicon-directory' }) : getFileIcon(item.name)}
        ${item.gitStatus ? (item.gitStatus.status === '??' ? `<span class="git-status git-status-untracked" title="Untracked file">${require('./git').getGitStatusIcon('??')}</span>` : `<span class="git-status git-status-${item.gitStatus.status.replace(' ', '')}" title="Git Status: ${getGitStatusDescription(item.gitStatus.status)}">${getGitStatusIcon(item.gitStatus.status)}</span>`) : ''}
      </td>
      <td class="col-name">
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
      <td class="col-size">
        ${item.isDirectory ? '-' : formatBytes(item.size)}
      </td>
      <td class="col-modified">
        ${item.modified.toLocaleDateString()}
      </td>
    </tr>
  `}).join('');

  return `
    <!DOCTYPE html>
    <html data-theme="dark">
    <head>
      <title>gh-here: ${currentPath || 'Root'}</title>
      <link rel="stylesheet" href="/static/styles.css?v=3.0.6">
      <script>
        // Check localStorage and add showGitignored param if needed (before page renders)
        (function() {
          const showGitignored = localStorage.getItem('gh-here-show-gitignored') === 'true';
          const url = new URL(window.location.href);
          const hasParam = url.searchParams.has('showGitignored');

          if (showGitignored && !hasParam) {
            url.searchParams.set('showGitignored', 'true');
            window.location.replace(url.toString());
          } else if (!showGitignored && hasParam) {
            url.searchParams.delete('showGitignored');
            window.location.replace(url.toString());
          }
        })();
      </script>
      <script type="module" src="/static/app.js"></script>
    </head>
    <body>
      <header>
        <div class="header-content">
          <div class="header-left">
            <h1>gh-here</h1>
          </div>
          <div class="header-right">
            <button id="gitignore-toggle" class="gitignore-toggle" aria-label="Toggle .gitignore filtering" title="Toggle gitignored files">
              ${octicons.eye.toSVG({ class: 'gitignore-icon' })}
            </button>
            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">
              ${octicons.moon.toSVG({ class: 'theme-icon' })}
            </button>
          </div>
        </div>
      </header>

      <main>
        <aside class="file-tree-sidebar ${!currentPath || currentPath === '' ? 'hidden' : ''}">
          <div class="file-tree-header">
            <svg class="files-icon" viewBox="0 0 16 16" width="16" height="16">
              <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path>
            </svg>
            <span>Files</span>
          </div>
          <div class="sidebar-controls">
            ${gitBranch ? `
              <button class="branch-button sidebar-branch">
                ${octicons['git-branch'].toSVG({ class: 'octicon-branch' })}
                <span class="branch-name">${gitBranch}</span>
                ${octicons['chevron-down'].toSVG({ class: 'octicon-chevron' })}
              </button>
            ` : ''}
            <div class="search-container sidebar-search">
              ${octicons.search.toSVG({ class: 'search-icon' })}
              <input type="text" id="file-search" placeholder="Go to file" class="search-input">
              <kbd class="search-hotkey">t</kbd>
            </div>
          </div>
          <div id="file-tree" class="file-tree-container"></div>
        </aside>
        <div class="main-content-wrapper ${!currentPath || currentPath === '' ? 'no-sidebar' : ''}">
          <div class="repo-canvas">
            <div class="repo-canvas-content">
              <div class="breadcrumb-section">${breadcrumbs}</div>
              ${(!currentPath || currentPath === '.') ? `
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
                    ${languageStats}
                  </div>
                  <div class="repo-controls-right">
                    <div class="search-container">
                      ${octicons.search.toSVG({ class: 'search-icon' })}
                      <input type="text" id="root-file-search" placeholder="Go to file" class="search-input">
                      <kbd class="search-hotkey">/</kbd>
                    </div>
                  </div>
                </div>
              ` : ''}

              <div class="file-table-container">
              <table class="file-table" id="file-table">
            <thead>
              <tr>
                <th class="col-icon"></th>
                <th class="col-name">Name</th>
                <th class="col-size">Size</th>
                <th class="col-modified">Modified</th>
              </tr>
            </thead>
            <tbody>
              ${currentPath && currentPath !== '.' ? `
                <tr class="file-row" data-name=".." data-type="dir">
                  <td class="col-icon">${octicons['arrow-up'].toSVG({ class: 'octicon-directory' })}</td>
                  <td class="col-name">
                    <a href="/?path=${encodeURIComponent(path.dirname(currentPath))}">.</a>
                  </td>
                  <td class="col-size">-</td>
                  <td class="col-modified">-</td>
                </tr>
              ` : ''}
              ${itemsHtml}
            </tbody>
          </table>
            </div>
              ${readmePreview}
            </div>
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

async function renderFileDiff(filePath, ext, gitInfo, gitRepoRoot, workingDir = null, gitBranch = null) {
  const workingDirName = workingDir ? path.basename(workingDir) : null;
  const breadcrumbs = generateBreadcrumbs(filePath, null, workingDirName);

  // Get git diff for the file
  return new Promise((resolve, reject) => {
    const diffCommand = gitInfo.staged ?
      `git diff --cached "${filePath}"` :
      `git diff "${filePath}"`;

    exec(diffCommand, { cwd: gitRepoRoot }, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }

      const diffContent = renderRawDiff(stdout, ext);
      const currentParams = new URLSearchParams({ path: filePath });
      const viewUrl = `/?${currentParams.toString()}`;
      const diffUrl = `/?${currentParams.toString()}&view=diff`;

      // Get file stats for header
      const fullPath = path.join(workingDir, filePath);
      let fileSize = '';
      let lineCount = 0;
      let locCount = 0;
      try {
        const stats = fs.statSync(fullPath);
        fileSize = formatBytes(stats.size);
        if (isTextFile(ext)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          lineCount = content.split('\n').length;
          locCount = content.split('\n').filter(line => line.trim().length > 0).length;
        }
      } catch {
        // File stats optional
      }

      const rawUrlApi = `/api/file-content?path=${encodeURIComponent(filePath)}`;
      const downloadUrl = `/download?path=${encodeURIComponent(filePath)}`;

      // Clean file header with separated view toggle and action buttons
      const fileHeader = `
        <div class="file-header">
          <div class="file-header-main">
            <div class="file-path-info">
              <span class="file-path-text">${filePath}</span>
              <button class="file-path-copy-btn" data-path="${filePath}" title="Copy file path">
                ${octicons.copy.toSVG({ class: 'octicon-copy', width: 16, height: 16 })}
              </button>
            </div>
            ${isTextFile(ext) && lineCount > 0 ? `
              <div class="file-stats">
                <span class="file-stat">${lineCount} line${lineCount !== 1 ? 's' : ''}</span>
                <span class="file-stat-separator">·</span>
                <span class="file-stat">${locCount} loc</span>
                <span class="file-stat-separator">·</span>
                <span class="file-stat">${fileSize}</span>
              </div>
            ` : fileSize ? `
              <div class="file-stats">
                <span class="file-stat">${fileSize}</span>
              </div>
            ` : ''}
          </div>
          <div class="file-header-actions">
            <div class="view-toggle">
              <a href="${viewUrl}" class="view-btn">
                ${octicons.eye.toSVG({ class: 'view-icon' })}
                <span>View</span>
              </a>
              <a href="${diffUrl}" class="view-btn active">
                ${octicons.diff.toSVG({ class: 'view-icon' })}
                <span>Diff</span>
              </a>
            </div>
            ${isTextFile(ext) ? `
              <div class="file-action-group">
                <a href="${rawUrlApi}" class="file-action-btn" target="_blank" title="View raw file">
                  ${octicons['file-code'].toSVG({ class: 'file-action-icon', width: 16, height: 16 })}
                </a>
                <button class="file-action-btn copy-raw-btn" data-path="${filePath}" title="Copy raw content">
                  ${octicons.copy.toSVG({ class: 'file-action-icon', width: 16, height: 16 })}
                </button>
                <a href="${downloadUrl}" class="file-action-btn" download="${path.basename(filePath)}" title="Download file">
                  ${octicons.download.toSVG({ class: 'file-action-icon', width: 16, height: 16 })}
                </a>
              </div>
            ` : `
              <div class="file-action-group">
                <a href="${downloadUrl}" class="file-action-btn" download="${path.basename(filePath)}" title="Download file">
                  ${octicons.download.toSVG({ class: 'file-action-icon', width: 16, height: 16 })}
                </a>
              </div>
            `}
          </div>
        </div>
      `;
      
      // Use same structure as renderFile - with sidebar
      const html = `
        <!DOCTYPE html>
        <html data-theme="dark">
        <head>
          <title>gh-here: ${path.basename(filePath)} (diff)</title>
          <link rel="stylesheet" href="/static/styles.css?v=3.0.6">
          <link rel="stylesheet" href="/static/highlight.css?v=${Date.now()}">
          <script>
            // Check localStorage and add showGitignored param if needed (before page renders)
            (function() {
              const showGitignored = localStorage.getItem('gh-here-show-gitignored') === 'true';
              const url = new URL(window.location.href);
              const hasParam = url.searchParams.has('showGitignored');

              if (showGitignored && !hasParam) {
                url.searchParams.set('showGitignored', 'true');
                window.location.replace(url.toString());
              } else if (!showGitignored && hasParam) {
                url.searchParams.delete('showGitignored');
                window.location.replace(url.toString());
              }
            })();
          </script>
          <script type="module" src="/static/app.js"></script>
        </head>
        <body>
          <header>
            <div class="header-content">
              <div class="header-left">
                <h1>gh-here</h1>
              </div>
              <div class="header-right">
                <button id="gitignore-toggle" class="gitignore-toggle" aria-label="Toggle .gitignore filtering" title="Toggle gitignored files">
                  ${octicons.eye.toSVG({ class: 'gitignore-icon' })}
                </button>
                <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">
                  ${octicons.moon.toSVG({ class: 'theme-icon' })}
                </button>
              </div>
            </div>
          </header>
          <main>
            <aside class="file-tree-sidebar">
              <div class="file-tree-header">
                <svg class="files-icon" viewBox="0 0 16 16" width="16" height="16">
                  <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path>
                </svg>
                <span>Files</span>
              </div>
              <div class="sidebar-controls">
                <div class="search-container sidebar-search">
                  ${octicons.search.toSVG({ class: 'search-icon' })}
                  <input type="text" id="file-search" placeholder="Go to file" class="search-input">
                  <kbd class="search-hotkey">t</kbd>
                </div>
              </div>
              <div id="file-tree" class="file-tree-container"></div>
            </aside>
            <div class="main-content-wrapper">
              <div class="main-content">
                <div class="breadcrumb-section">${breadcrumbs}</div>
                ${fileHeader}
                <div class="file-content">
                  <div class="diff-container">
                    <div class="diff-content">
                      ${diffContent}
                    </div>
                  </div>
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

  // Parse diff to extract line numbers and render properly
  const lines = diffOutput.split('\n');
  let oldLineNum = 0;
  let newLineNum = 0;
  let inHunk = false;

  const linesHtml = lines.map(line => {
    // Detect hunk header: @@ -oldStart,oldCount +newStart,newCount @@
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLineNum = parseInt(match[1], 10);
        newLineNum = parseInt(match[2], 10);
        inHunk = true;
      }
      // Hunk headers get no line numbers, just styling
      const escapedLine = escapeHtml(line);
      return `<div class="diff-line diff-line-hunk">
        <span class="diff-line-number old"></span>
        <span class="diff-line-number new"></span>
        <span class="diff-line-content">${escapedLine}</span>
      </div>`;
    }

    // File headers (diff --git, index, ---, +++)
    if (line.startsWith('diff --git') || line.startsWith('index ') ||
        line.startsWith('---') || line.startsWith('+++')) {
      const escapedLine = escapeHtml(line);
      return `<div class="diff-line diff-line-header">
        <span class="diff-line-number old"></span>
        <span class="diff-line-number new"></span>
        <span class="diff-line-content">${escapedLine}</span>
      </div>`;
    }

    if (!inHunk || line.length === 0) {
      // Empty lines or lines before first hunk
      const escapedLine = escapeHtml(line);
      return `<div class="diff-line diff-line-context">
        <span class="diff-line-number old"></span>
        <span class="diff-line-number new"></span>
        <span class="diff-line-content">${escapedLine}</span>
      </div>`;
    }

    const firstChar = line.charAt(0);
    let lineType = 'context';
    let oldNum = '';
    let newNum = '';
    let content = line;

    if (firstChar === '-') {
      // Removed line: show old number, blank new number
      lineType = 'removed';
      oldNum = oldLineNum.toString();
      newNum = '';
      oldLineNum++;
      // Keep the - prefix in content for visual consistency
      content = line;
    } else if (firstChar === '+') {
      // Added line: blank old number, show new number
      lineType = 'added';
      oldNum = '';
      newNum = newLineNum.toString();
      newLineNum++;
      // Keep the + prefix in content
      content = line;
    } else {
      // Context line: show both numbers
      lineType = 'context';
      oldNum = oldLineNum.toString();
      newNum = newLineNum.toString();
      oldLineNum++;
      newLineNum++;
      content = line;
    }

    // Apply syntax highlighting to the content
    let highlightedContent;
    try {
      highlightedContent = hljs.highlight(content, { language: 'diff' }).value;
    } catch {
      highlightedContent = escapeHtml(content);
    }

    return `<div class="diff-line diff-line-${lineType}">
      <span class="diff-line-number old">${oldNum}</span>
      <span class="diff-line-number new">${newNum}</span>
      <span class="diff-line-content">${highlightedContent}</span>
    </div>`;
  }).join('');

  return `<div class="raw-diff-container">${linesHtml}</div>`;
}

// Helper function to escape HTML
function escapeHtml(text) {
  return text.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#039;');
}


async function renderFile(filePath, content, ext, viewMode = 'rendered', gitStatus = null, workingDir = null) {
  const workingDirName = workingDir ? path.basename(workingDir) : null;
  const breadcrumbs = generateBreadcrumbs(filePath, null, workingDirName);
  let displayContent;
  let viewToggle = '';
  
  // Get file stats
  const fullPath = path.join(workingDir, filePath);
  const stats = fs.statSync(fullPath);
  const fileSize = formatBytes(stats.size);
  const lineCount = isTextFile(ext) ? content.split('\n').length : 0;
  const locCount = isTextFile(ext) ? content.split('\n').filter(line => line.trim().length > 0).length : 0;
  
  // Check if file has git changes
  const absolutePath = path.resolve(path.join(workingDir, filePath));
  const hasGitChanges = gitStatus && gitStatus[absolutePath];
  
  // URLs for file actions (will be used in fileHeader after viewToggle is set)
  const rawUrl = `/api/file-content?path=${encodeURIComponent(filePath)}`;
  const downloadUrl = `/download?path=${encodeURIComponent(filePath)}`;
  
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
            ${octicons.eye.toSVG({ class: 'view-icon' })}
            <span>View</span>
          </a>
          <a href="${diffUrl}" class="view-btn">
            ${octicons.diff.toSVG({ class: 'view-icon' })}
            <span>Diff</span>
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
    const rawUrlView = `/?${currentParams.toString()}&view=raw`;
    const renderedUrl = `/?${currentParams.toString()}&view=rendered`;
    const diffUrl = `/?${currentParams.toString()}&view=diff`;

    viewToggle = `
      <div class="view-toggle">
        <a href="${renderedUrl}" class="view-btn ${viewMode === 'rendered' ? 'active' : ''}">
          ${octicons.eye.toSVG({ class: 'view-icon' })}
          <span>View</span>
        </a>
        <a href="${rawUrlView}" class="view-btn ${viewMode === 'raw' ? 'active' : ''}">
          ${octicons['file-code'].toSVG({ class: 'view-icon' })}
          <span>Raw</span>
        </a>
        ${hasGitChanges ? `
          <a href="${diffUrl}" class="view-btn ${viewMode === 'diff' ? 'active' : ''}">
            ${octicons.diff.toSVG({ class: 'view-icon' })}
            <span>Diff</span>
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
            ${octicons.eye.toSVG({ class: 'view-icon' })}
            <span>View</span>
          </a>
          <a href="${diffUrl}" class="view-btn ${viewMode === 'diff' ? 'active' : ''}">
            ${octicons.diff.toSVG({ class: 'view-icon' })}
            <span>Diff</span>
          </a>
        </div>
      `;
    }
  }

  // Build file header after viewToggle is set (so it includes diff button if applicable)
  const fileHeader = `
    <div class="file-header">
      <div class="file-header-main">
        <div class="file-path-info">
          <span class="file-path-text">${filePath}</span>
          <button class="file-path-copy-btn" data-path="${filePath}" title="Copy file path">
            ${octicons.copy.toSVG({ class: 'octicon-copy', width: 16, height: 16 })}
          </button>
        </div>
        ${isTextFile(ext) ? `
          <div class="file-stats">
            <span class="file-stat">${lineCount} line${lineCount !== 1 ? 's' : ''}</span>
            <span class="file-stat-separator">·</span>
            <span class="file-stat">${locCount} loc</span>
            <span class="file-stat-separator">·</span>
            <span class="file-stat">${fileSize}</span>
          </div>
        ` : `
          <div class="file-stats">
            <span class="file-stat">${fileSize}</span>
          </div>
        `}
      </div>
      <div class="file-header-actions">
        ${viewToggle}
        ${isTextFile(ext) ? `
          <div class="file-action-group">
            <a href="${rawUrl}" class="file-action-btn" target="_blank" title="View raw file">
              ${octicons['file-code'].toSVG({ class: 'file-action-icon', width: 16, height: 16 })}
            </a>
            <button class="file-action-btn copy-raw-btn" data-path="${filePath}" title="Copy raw content">
              ${octicons.copy.toSVG({ class: 'file-action-icon', width: 16, height: 16 })}
            </button>
            <a href="${downloadUrl}" class="file-action-btn" download="${path.basename(filePath)}" title="Download file">
              ${octicons.download.toSVG({ class: 'file-action-icon', width: 16, height: 16 })}
            </a>
          </div>
        ` : `
          <div class="file-action-group">
            <a href="${downloadUrl}" class="file-action-btn" download="${path.basename(filePath)}" title="Download file">
              ${octicons.download.toSVG({ class: 'file-action-icon', width: 16, height: 16 })}
            </a>
          </div>
        `}
      </div>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html data-theme="dark">
    <head>
      <title>gh-here: ${path.basename(filePath)}</title>
      <link rel="stylesheet" href="/static/styles.css?v=3.0.6">
      <link rel="stylesheet" href="/static/highlight.css?v=${Date.now()}">
      <script>
        // Check localStorage and add showGitignored param if needed (before page renders)
        (function() {
          const showGitignored = localStorage.getItem('gh-here-show-gitignored') === 'true';
          const url = new URL(window.location.href);
          const hasParam = url.searchParams.has('showGitignored');

          if (showGitignored && !hasParam) {
            url.searchParams.set('showGitignored', 'true');
            window.location.replace(url.toString());
          } else if (!showGitignored && hasParam) {
            url.searchParams.delete('showGitignored');
            window.location.replace(url.toString());
          }
        })();
      </script>
      <script type="module" src="/static/app.js"></script>
    </head>
    <body>
      <header>
        <div class="header-content">
          <div class="header-left">
            <h1>gh-here</h1>
          </div>
          <div class="header-right">
            <button id="gitignore-toggle" class="gitignore-toggle" aria-label="Toggle .gitignore filtering" title="Toggle gitignored files">
              ${octicons.eye.toSVG({ class: 'gitignore-icon' })}
            </button>
            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">
              ${octicons.moon.toSVG({ class: 'theme-icon' })}
            </button>
          </div>
        </div>
      </header>
      <main>
        <aside class="file-tree-sidebar">
          <div class="file-tree-header">
            <svg class="files-icon" viewBox="0 0 16 16" width="16" height="16">
              <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path>
            </svg>
            <span>Files</span>
          </div>
          <div class="sidebar-controls">
            <div class="search-container sidebar-search">
              ${octicons.search.toSVG({ class: 'search-icon' })}
              <input type="text" id="file-search" placeholder="Go to file" class="search-input">
              <kbd class="search-hotkey">t</kbd>
            </div>
          </div>
          <div id="file-tree" class="file-tree-container"></div>
        </aside>
        <div class="main-content-wrapper">
          <div class="main-content">
            <div class="breadcrumb-section">${breadcrumbs}</div>
            ${fileHeader}
            <div class="file-content">
              ${displayContent}
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
  generateBreadcrumbs,
  findReadmeFile,
  generateReadmePreview,
  generateLanguageStats,
  renderRawDiff
};