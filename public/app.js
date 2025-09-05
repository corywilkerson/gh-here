// Octicons directly embedded for frontend use
const octicons = {
    'file-directory': '<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-file-directory" aria-hidden="true"><path d="M0 2.75C0 1.784.784 1 1.75 1H5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1h6.75c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H7.5c-.55 0-1.07-.26-1.4-.7l-.9-1.2a.25.25 0 0 0-.2-.1Z"></path></svg>',
    'git-commit': '<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-git-commit" aria-hidden="true"><path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path></svg>',
    'diff': '<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-diff" aria-hidden="true"><path d="M8.75 1.75V5H12a.75.75 0 0 1 0 1.5H8.75v3.25a.75.75 0 0 1-1.5 0V6.5H4A.75.75 0 0 1 4 5h3.25V1.75a.75.75 0 0 1 1.5 0ZM4 13h8a.75.75 0 0 1 0 1.5H4A.75.75 0 0 1 4 13Z"></path></svg>',
    'copy': '<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-copy" aria-hidden="true"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg>',
    'download': '<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-download" aria-hidden="true"><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"></path><path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"></path></svg>',
    'pencil': '<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-pencil" aria-hidden="true"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"></path></svg>',
    'x': '<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-x" aria-hidden="true"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg>',
    'check': '<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-hidden="true"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>',
    
    // Helper to get an icon with optional classes
    get(name, options = {}) {
      const svg = this[name];
      if (!svg) return `<span class="missing-icon">[${name}]</span>`;
      
      if (options.class) {
        return svg.replace('class="octicon', `class="${options.class} octicon`);
      }
      return svg;
    }
  };

document.addEventListener('DOMContentLoaded', function() {
  
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const searchInput = document.getElementById('file-search');
  const fileTable = document.getElementById('file-table');
  
  let currentFocusIndex = -1;
  let fileRows = [];

  // Notification system
  function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }
    }, 4000);
  }
  
  // Removed loading state utilities - not needed for local operations
  
  // Monaco Editor integration
  let monacoFileEditor = null;
  let monacoNewFileEditor = null;
  
  // Enhanced language detection based on file extension and filename
  function getLanguageFromExtension(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const languageMap = {
      // JavaScript family
      'js': 'javascript',
      'mjs': 'javascript', 
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      
      // Web technologies  
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'scss',
      'less': 'less',
      
      // Data formats
      'json': 'json',
      'xml': 'xml',
      'yml': 'yaml',
      'yaml': 'yaml',
      
      // Programming languages
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'kts': 'kotlin',
      'dart': 'dart',
      'r': 'r',
      'scala': 'scala',
      'clj': 'clojure',
      'hs': 'haskell',
      'lua': 'lua',
      'perl': 'perl',
      'pl': 'perl',
      
      // Shell scripts
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'fish': 'shell',
      'ps1': 'powershell',
      
      // Database
      'sql': 'sql',
      
      // Config files
      'dockerfile': 'dockerfile',
      'ini': 'ini',
      'toml': 'toml',
      'cfg': 'ini',
      'conf': 'ini',
      'env': 'shell',
      
      // Documentation
      'md': 'markdown',
      'markdown': 'markdown',
      'rst': 'restructuredtext',
      'txt': 'plaintext',
      
      // Other
      'vim': 'vim',
      'bat': 'bat',
      'cmd': 'bat'
    };
    
    // Special cases for files without extensions or special names
    const basename = filename.toLowerCase();
    const specialFiles = {
      'dockerfile': 'dockerfile',
      'makefile': 'makefile', 
      'cmakelists.txt': 'cmake',
      'package.json': 'json',
      'tsconfig.json': 'jsonc',
      '.gitignore': 'ignore',
      '.env': 'shell',
      '.bashrc': 'shell',
      '.zshrc': 'shell'
    };
    
    if (specialFiles[basename]) {
      return specialFiles[basename];
    }
    
    return languageMap[ext] || 'plaintext';
  }
  
  // Initialize Monaco Editor
  function initializeMonaco() {
    if (typeof require !== 'undefined') {
      require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.45.0/min/vs' }});
      
      require(['vs/editor/editor.main'], function () {
        console.log('Monaco Editor loaded successfully');
        
        // Configure Monaco Editor workers for proper syntax highlighting
        self.MonacoEnvironment = {
          getWorkerUrl: function (moduleId, label) {
            if (label === 'json') {
              return 'https://unpkg.com/monaco-editor@0.45.0/min/vs/language/json/json.worker.js';
            }
            if (label === 'css' || label === 'scss' || label === 'less') {
              return 'https://unpkg.com/monaco-editor@0.45.0/min/vs/language/css/css.worker.js';
            }
            if (label === 'html' || label === 'handlebars' || label === 'razor') {
              return 'https://unpkg.com/monaco-editor@0.45.0/min/vs/language/html/html.worker.js';
            }
            if (label === 'typescript' || label === 'javascript') {
              return 'https://unpkg.com/monaco-editor@0.45.0/min/vs/language/typescript/ts.worker.js';
            }
            return 'https://unpkg.com/monaco-editor@0.45.0/min/vs/editor/editor.worker.js';
          }
        };
        
        // Set Monaco theme based on current theme
        const currentTheme = html.getAttribute('data-theme');
        const monacoTheme = currentTheme === 'dark' ? 'vs-dark' : 'vs';
        monaco.editor.setTheme(monacoTheme);
        
        // Debug: Check what languages are available
        const availableLanguages = monaco.languages.getLanguages();
        console.log('Available Monaco languages:', availableLanguages.map(lang => lang.id).sort());
        
        // Initialize file editor if container exists
        const fileEditorContainer = document.getElementById('file-editor');
        if (fileEditorContainer) {
          const filename = document.querySelector('.header-path a:last-child')?.textContent || 'file.txt';
          const language = getLanguageFromExtension(filename);
          console.log('Monaco initialization - filename:', filename, 'detected language:', language);
          
          // Validate language exists in Monaco  
          const availableLanguages = monaco.languages.getLanguages().map(lang => lang.id);
          const validLanguage = availableLanguages.includes(language) ? language : 'plaintext';
          console.log('Available languages include', language + ':', availableLanguages.includes(language));
          console.log('Using language:', validLanguage);
          
          monacoFileEditor = monaco.editor.create(fileEditorContainer, {
            value: '',
            language: validLanguage,
            theme: monacoTheme,
            minimap: { enabled: false },
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            fontSize: 12,
            lineHeight: 1.5,
            fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
            padding: { top: 20, bottom: 20 },
            renderLineHighlight: 'line',
            selectOnLineNumbers: true,
            automaticLayout: true,
            folding: true,
            foldingHighlight: true,
            foldingStrategy: 'auto',
            showFoldingControls: 'mouseover',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true
            }
          });
          console.log('File editor initialized');
        }
        
        // Initialize new file editor if container exists  
        const newFileEditorContainer = document.getElementById('new-file-content');
        if (newFileEditorContainer) {
          monacoNewFileEditor = monaco.editor.create(newFileEditorContainer, {
            value: '',
            language: 'plaintext',
            theme: monacoTheme,
            minimap: { enabled: false },
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            fontSize: 12,
            lineHeight: 1.5,
            fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
            padding: { top: 20, bottom: 20 },
            renderLineHighlight: 'line',
            selectOnLineNumbers: true,
            automaticLayout: true,
            folding: true,
            foldingHighlight: true,
            foldingStrategy: 'auto',
            showFoldingControls: 'mouseover',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true
            }
          });
          console.log('New file editor initialized');
        }
        
        // Set global flag that Monaco is ready
        window.monacoReady = true;
      });
    }
  }
  
  // Initialize Monaco when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMonaco);
  } else {
    initializeMonaco();
  }
  
  // Initialize
  updateFileRows();
  
  // Detect system theme preference
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const systemTheme = systemPrefersDark ? 'dark' : 'light';
  
  // Load saved theme or default to system preference
  const savedTheme = localStorage.getItem('gh-here-theme') || systemTheme;
  html.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  
  // Listen for system theme changes (only if no manual override is saved)
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addListener(function(e) {
      // Only auto-update if user hasn't manually set a theme
      if (!localStorage.getItem('gh-here-theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        updateThemeIcon(newTheme);
      }
    });
  }
  
  // Theme toggle functionality
  themeToggle.addEventListener('click', function() {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('gh-here-theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Update Monaco editor themes
    if (typeof monaco !== 'undefined') {
      const monacoTheme = newTheme === 'dark' ? 'vs-dark' : 'vs';
      monaco.editor.setTheme(monacoTheme);
    }
  });

  // Gitignore toggle functionality
  const gitignoreToggle = document.getElementById('gitignore-toggle');
  if (gitignoreToggle) {
    gitignoreToggle.addEventListener('click', function() {
      const currentUrl = new URL(window.location.href);
      const currentGitignoreState = currentUrl.searchParams.get('gitignore');
      const newGitignoreState = currentGitignoreState === 'false' ? null : 'false';
      
      if (newGitignoreState) {
        currentUrl.searchParams.set('gitignore', newGitignoreState);
      } else {
        currentUrl.searchParams.delete('gitignore');
      }
      
      // Navigate to the new URL
      window.location.href = currentUrl.toString();
    });
  }
  
  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const query = this.value.toLowerCase().trim();
      filterFiles(query);
    });
    
    // Focus search with Ctrl+K or Cmd+K
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
  }
  
  // Keyboard shortcuts help overlay
  function showKeyboardHelp() {
    // Remove existing help if present
    const existingHelp = document.getElementById('keyboard-help');
    if (existingHelp) {
      existingHelp.remove();
      return;
    }

    const helpOverlay = document.createElement('div');
    helpOverlay.id = 'keyboard-help';
    helpOverlay.className = 'keyboard-help-overlay';
    
    helpOverlay.innerHTML = `
      <div class="keyboard-help-content">
        <div class="keyboard-help-header">
          <h2>Keyboard shortcuts</h2>
          <button class="keyboard-help-close" aria-label="Close help">&times;</button>
        </div>
        <div class="keyboard-help-body">
          <div class="shortcuts-container">
            <div class="shortcut-section">
              <h3>Repositories</h3>
              <div class="shortcut-list">
                <div class="shortcut-item">
                  <span class="shortcut-desc">Go to parent directory</span>
                  <div class="shortcut-keys"><kbd>H</kbd></div>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-desc">Toggle .gitignore filter</span>
                  <div class="shortcut-keys"><kbd>I</kbd></div>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-desc">Create new file</span>
                  <div class="shortcut-keys"><kbd>C</kbd></div>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-desc">Edit focused file</span>
                  <div class="shortcut-keys"><kbd>E</kbd></div>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-desc">Show diff for focused file</span>
                  <div class="shortcut-keys"><kbd>D</kbd></div>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-desc">Refresh page</span>
                  <div class="shortcut-keys"><kbd>R</kbd></div>
                </div>
              </div>
            </div>
            
            <div class="shortcut-section">
              <h3>Site-wide shortcuts</h3>
              <div class="shortcut-list">
                <div class="shortcut-item">
                  <span class="shortcut-desc">Focus search</span>
                  <div class="shortcut-keys"><kbd>S</kbd> or <kbd>/</kbd></div>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-desc">Focus search</span>
                  <div class="shortcut-keys"><kbd>⌘</kbd> <kbd>K</kbd></div>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-desc">Toggle theme</span>
                  <div class="shortcut-keys"><kbd>T</kbd></div>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-desc">Bring up this help dialog</span>
                  <div class="shortcut-keys"><kbd>?</kbd></div>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-desc">Move selection down</span>
                  <div class="shortcut-keys"><kbd>J</kbd></div>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-desc">Move selection up</span>
                  <div class="shortcut-keys"><kbd>K</kbd></div>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-desc">Open selection</span>
                  <div class="shortcut-keys"><kbd>O</kbd> or <kbd>↵</kbd></div>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-desc">Save file (in editor)</span>
                  <div class="shortcut-keys"><kbd>⌘</kbd> <kbd>S</kbd></div>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-desc">Close help/cancel</span>
                  <div class="shortcut-keys"><kbd>Esc</kbd></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(helpOverlay);
    
    // Close on click outside or escape
    helpOverlay.addEventListener('click', function(e) {
      if (e.target === helpOverlay) {
        helpOverlay.remove();
      }
    });
    
    helpOverlay.querySelector('.keyboard-help-close').addEventListener('click', function() {
      helpOverlay.remove();
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    // Handle help overlay first
    if (e.key === '?' && document.activeElement !== searchInput) {
      e.preventDefault();
      showKeyboardHelp();
      return;
    }
    
    // Close help with Escape
    if (e.key === 'Escape') {
      const helpOverlay = document.getElementById('keyboard-help');
      if (helpOverlay) {
        helpOverlay.remove();
        return;
      }
    }
    
    // Don't handle shortcuts when editor is active
    const editorContainer = document.getElementById('editor-container');
    if (editorContainer && editorContainer.style.display !== 'none' && 
        editorContainer.contains(document.activeElement)) {
      return;
    }
    
    if (searchInput && document.activeElement === searchInput) {
      handleSearchKeydown(e);
    } else {
      handleGlobalKeydown(e);
    }
  });

  // New file and folder functionality
  const newFileBtn = document.getElementById('new-file-btn');
  const newFolderBtn = document.getElementById('new-folder-btn');

  if (newFileBtn) {
    newFileBtn.addEventListener('click', function() {
      const currentUrl = new URL(window.location.href);
      const currentPath = currentUrl.searchParams.get('path') || '';
      
      // Navigate to new file creation mode
      const newFileUrl = `/new?path=${encodeURIComponent(currentPath)}`;
      window.location.href = newFileUrl;
    });
  }

  if (newFolderBtn) {
    newFolderBtn.addEventListener('click', function() {
      const foldername = prompt('Enter folder name:');
      if (foldername && foldername.trim()) {
        const currentUrl = new URL(window.location.href);
        const currentPath = currentUrl.searchParams.get('path') || '';
        
        fetch('/api/create-folder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: currentPath,
            foldername: foldername.trim()
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Refresh the current directory view
            window.location.reload();
          } else {
            alert('Failed to create folder: ' + data.error);
          }
        })
        .catch(error => {
          console.error('Error creating folder:', error);
          alert('Failed to create folder');
        });
      }
    });
  }
  
  // File row click navigation
  fileRows.forEach((row, index) => {
    row.addEventListener('click', function(e) {
      // Don't navigate if clicking on quick actions
      if (e.target.closest('.quick-actions')) {
        return;
      }
      
      const link = row.querySelector('a');
      if (link) {
        link.click();
      }
    });
  });
  
  // Quick actions functionality
  document.addEventListener('click', function(e) {
    if (e.target.closest('.copy-path-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const button = e.target.closest('.copy-path-btn');
      const path = button.dataset.path;
      copyToClipboard(path, button);
    }
  });
  
  // Line selection functionality
  let lastClickedLine = null;
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('line-number')) {
      e.preventDefault();
      const lineContainer = e.target.closest('.line-container');
      const lineNum = parseInt(lineContainer.dataset.line);
      
      if (e.shiftKey && lastClickedLine !== null) {
        // Range selection
        selectLineRange(Math.min(lastClickedLine, lineNum), Math.max(lastClickedLine, lineNum));
      } else if (e.ctrlKey || e.metaKey) {
        // Toggle individual line
        toggleLineSelection(lineNum);
      } else {
        // Single line selection
        clearAllSelections();
        selectLine(lineNum);
        lastClickedLine = lineNum;
      }
      
      updateURL();
    }
  });
  
  function updateThemeIcon(theme) {
    const iconSvg = themeToggle.querySelector('.theme-icon');
    if (iconSvg) {
      if (theme === 'dark') {
        iconSvg.innerHTML = '<path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13zM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.061zm9.193 9.193a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061zM16 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8zM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8zm10.657-5.657a.75.75 0 0 1 0 1.061l-1.061 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.061 0zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0z"></path>';
      } else {
        iconSvg.innerHTML = '<path d="M9.598 1.591a.75.75 0 0 1 .785-.175 7 7 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.5 5.5 0 1 0 7.678-7.678z"></path>';
      }
    }
  }
  
  function updateFileRows() {
    if (fileTable) {
      fileRows = Array.from(fileTable.querySelectorAll('.file-row'));
    }
  }
  
  function filterFiles(query) {
    if (!query) {
      fileRows.forEach(row => {
        row.classList.remove('hidden');
      });
      return;
    }
    
    fileRows.forEach(row => {
      const fileName = row.dataset.name;
      const isVisible = fileName.includes(query);
      row.classList.toggle('hidden', !isVisible);
    });
    
    // Reset focus when filtering
    clearFocus();
    currentFocusIndex = -1;
  }
  
  function handleSearchKeydown(e) {
    switch(e.key) {
      case 'Escape':
        searchInput.blur();
        searchInput.value = '';
        filterFiles('');
        break;
      case 'ArrowDown':
        e.preventDefault();
        searchInput.blur();
        focusFirstVisibleRow();
        break;
      case 'Enter':
        if (searchInput.value.trim()) {
          const firstVisible = getVisibleRows()[0];
          if (firstVisible) {
            const link = firstVisible.querySelector('a');
            if (link) link.click();
          }
        }
        break;
    }
  }
  
  function handleGlobalKeydown(e) {
    const visibleRows = getVisibleRows();
    
    switch(e.key) {
      case 'ArrowDown':
      case 'j':
        e.preventDefault();
        navigateDown(visibleRows);
        break;
      case 'ArrowUp':
      case 'k':
        e.preventDefault();
        navigateUp(visibleRows);
        break;
      case 'Enter':
      case 'o':
        if (currentFocusIndex >= 0 && visibleRows[currentFocusIndex]) {
          const link = visibleRows[currentFocusIndex].querySelector('a');
          if (link) link.click();
        }
        break;
      case '/':
      case 's':
        if (searchInput && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          searchInput.focus();
        }
        break;
      case 'g':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (visibleRows.length > 0) {
            currentFocusIndex = 0;
            updateFocus(visibleRows);
          }
        }
        break;
      case 'G':
        if (e.shiftKey) {
          e.preventDefault();
          if (visibleRows.length > 0) {
            currentFocusIndex = visibleRows.length - 1;
            updateFocus(visibleRows);
          }
        }
        break;
      case 'h':
        // Go back/up one directory
        e.preventDefault();
        goUpDirectory();
        break;
      case 'r':
        // Refresh page
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          location.reload();
        }
        break;
      case 't':
        // Toggle theme
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          themeToggle.click();
        }
        break;
      case '?':
        // Show keyboard shortcuts help
        e.preventDefault();
        showKeyboardHelp();
        break;
      case 'c':
        // Create new file
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const newFileBtn = document.getElementById('new-file-btn');
          if (newFileBtn) {
            newFileBtn.click();
          }
        }
        break;
      case 'e':
        // Edit focused file
        if (!e.ctrlKey && !e.metaKey && currentFocusIndex >= 0 && visibleRows[currentFocusIndex]) {
          e.preventDefault();
          const focusedRow = visibleRows[currentFocusIndex];
          const rowType = focusedRow.dataset.type;
          
          // If we're in a directory listing and focused on a file
          if (rowType === 'file') {
            const filePath = focusedRow.dataset.path;
            // Navigate to the file and trigger edit mode
            window.location.href = `/?path=${encodeURIComponent(filePath)}#edit`;
          } else {
            // If we're on a file page, use the edit button
            const editBtn = document.getElementById('edit-btn');
            if (editBtn && editBtn.style.display !== 'none') {
              editBtn.click();
            }
          }
        }
        break;
      case 'i':
        // Toggle gitignore
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const gitignoreToggle = document.getElementById('gitignore-toggle');
          if (gitignoreToggle) {
            gitignoreToggle.click();
          }
        }
        break;
      case 'd':
        // Show diff for focused file (if it has git status)
        if (!e.ctrlKey && !e.metaKey && currentFocusIndex >= 0 && visibleRows[currentFocusIndex]) {
          e.preventDefault();
          const focusedRow = visibleRows[currentFocusIndex];
          const rowType = focusedRow.dataset.type;
          
          if (rowType === 'file') {
            const filePath = focusedRow.dataset.path;
            const diffBtn = focusedRow.querySelector('.diff-btn');
            if (diffBtn) {
              showDiffViewer(filePath);
            }
          }
        }
        break;
    }
  }
  
  function getVisibleRows() {
    return fileRows.filter(row => !row.classList.contains('hidden'));
  }
  
  function focusFirstVisibleRow() {
    const visibleRows = getVisibleRows();
    if (visibleRows.length > 0) {
      currentFocusIndex = 0;
      updateFocus(visibleRows);
    }
  }
  
  function navigateDown(visibleRows) {
    if (visibleRows.length === 0) return;
    
    currentFocusIndex++;
    if (currentFocusIndex >= visibleRows.length) {
      currentFocusIndex = 0;
    }
    updateFocus(visibleRows);
  }
  
  function navigateUp(visibleRows) {
    if (visibleRows.length === 0) return;
    
    currentFocusIndex--;
    if (currentFocusIndex < 0) {
      currentFocusIndex = visibleRows.length - 1;
    }
    updateFocus(visibleRows);
  }
  
  function updateFocus(visibleRows) {
    clearFocus();
    if (currentFocusIndex >= 0 && visibleRows[currentFocusIndex]) {
      visibleRows[currentFocusIndex].classList.add('focused');
      visibleRows[currentFocusIndex].scrollIntoView({ 
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }
  
  function clearFocus() {
    fileRows.forEach(row => row.classList.remove('focused'));
  }
  
  function goUpDirectory() {
    const currentUrl = new URL(window.location.href);
    const currentPath = currentUrl.searchParams.get('path');
    
    if (!currentPath || currentPath === '') {
      // Already at root, do nothing
      return;
    }
    
    const pathParts = currentPath.split('/').filter(p => p);
    if (pathParts.length === 0) {
      // Go to root
      window.location.href = '/';
    } else {
      // Go up one directory
      pathParts.pop();
      const newPath = pathParts.join('/');
      window.location.href = `/?path=${encodeURIComponent(newPath)}`;
    }
  }
  

  function selectLine(lineNum) {
    const lineContainer = document.querySelector(`[data-line="${lineNum}"]`);
    if (lineContainer) {
      lineContainer.classList.add('selected');
    }
  }
  
  function toggleLineSelection(lineNum) {
    const lineContainer = document.querySelector(`[data-line="${lineNum}"]`);
    if (lineContainer) {
      lineContainer.classList.toggle('selected');
    }
  }
  
  function selectLineRange(startLine, endLine) {
    clearAllSelections();
    for (let i = startLine; i <= endLine; i++) {
      selectLine(i);
    }
  }
  
  function clearAllSelections() {
    document.querySelectorAll('.line-container.selected').forEach(line => {
      line.classList.remove('selected');
    });
  }
  
  function updateURL() {
    const selectedLines = Array.from(document.querySelectorAll('.line-container.selected'))
      .map(line => parseInt(line.dataset.line))
      .sort((a, b) => a - b);
    
    const url = new URL(window.location);
    
    if (selectedLines.length === 0) {
      url.hash = '';
    } else if (selectedLines.length === 1) {
      url.hash = `#L${selectedLines[0]}`;
    } else {
      // Find ranges
      const ranges = [];
      let rangeStart = selectedLines[0];
      let rangeEnd = selectedLines[0];
      
      for (let i = 1; i < selectedLines.length; i++) {
        if (selectedLines[i] === rangeEnd + 1) {
          rangeEnd = selectedLines[i];
        } else {
          if (rangeStart === rangeEnd) {
            ranges.push(`L${rangeStart}`);
          } else {
            ranges.push(`L${rangeStart}-L${rangeEnd}`);
          }
          rangeStart = rangeEnd = selectedLines[i];
        }
      }
      
      if (rangeStart === rangeEnd) {
        ranges.push(`L${rangeStart}`);
      } else {
        ranges.push(`L${rangeStart}-L${rangeEnd}`);
      }
      
      url.hash = `#${ranges.join(',')}`;
    }
    
    window.history.replaceState({}, '', url);
  }
  
  // Initialize line selections from URL on page load
  function initLineSelections() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    
    const parts = hash.split(',');
    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(p => parseInt(p.replace('L', '')));
        selectLineRange(start, end);
      } else {
        const lineNum = parseInt(part.replace('L', ''));
        selectLine(lineNum);
      }
    });
  }
  
  // Initialize line selections if we're on a file page
  if (document.querySelector('.with-line-numbers')) {
    initLineSelections();
  }

  // Editor functionality
  const editBtn = document.getElementById('edit-btn');
  const editorContainer = document.getElementById('editor-container');
  const saveBtn = document.getElementById('save-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const fileContent = document.querySelector('.file-content');

  

  // Auto-open editor if hash is #edit
  if (window.location.hash === '#edit' && editBtn) {
    // Remove hash and trigger edit
    window.location.hash = '';
    setTimeout(() => editBtn.click(), 100);
  }

  if (editBtn && editorContainer) {
    let originalContent = '';

    // Editor keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if (editorContainer && editorContainer.style.display !== 'none') {
        // Cmd/Ctrl+S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          saveBtn.click();
        }
        // Escape to cancel
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelBtn.click();
        }
      }
    });

    // Auto-save functionality
    function saveDraft(filePath, content) {
      localStorage.setItem(`gh-here-draft-${filePath}`, content);
    }
    
    function loadDraft(filePath) {
      return localStorage.getItem(`gh-here-draft-${filePath}`);
    }
    
    function clearDraft(filePath) {
      localStorage.removeItem(`gh-here-draft-${filePath}`);
    }

    editBtn.addEventListener('click', function() {
      // Get current file path
      const currentUrl = new URL(window.location.href);
      const filePath = currentUrl.searchParams.get('path') || '';
      
      
      // Fetch original file content
      fetch(`/api/file-content?path=${encodeURIComponent(filePath)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.text();
        })
        .then(content => {
          originalContent = content;
          
          // Check for draft
          const draft = loadDraft(filePath);
          const contentToLoad = (draft && draft !== content && confirm('You have unsaved changes for this file. Load draft?')) ? draft : content;
          
          if (draft && draft === content) {
            clearDraft(filePath);
          }
          
          // Set content in Monaco editor - wait for Monaco to be ready
          const setContentWhenReady = () => {
            console.log('Checking Monaco readiness...', { 
              monacoFileEditor: !!monacoFileEditor, 
              windowMonacoReady: !!window.monacoReady,
              contentLength: contentToLoad.length 
            });
            
            if (monacoFileEditor && window.monacoReady) {
              console.log('Setting Monaco content:', contentToLoad.substring(0, 100) + '...');
              
              // Debug DOM elements
              const editorContainer = document.getElementById('file-editor');
              const parentContainer = editorContainer?.parentElement;
              console.log('Editor container:', editorContainer, 'dimensions:', {
                width: editorContainer?.offsetWidth,
                height: editorContainer?.offsetHeight,
                display: window.getComputedStyle(editorContainer || {}).display
              });
              console.log('Parent container:', parentContainer, 'dimensions:', {
                width: parentContainer?.offsetWidth,
                height: parentContainer?.offsetHeight,
                display: window.getComputedStyle(parentContainer || {}).display
              });
              
              // Make sure the editor is visible and properly sized
              monacoFileEditor.layout();
              monacoFileEditor.setValue(contentToLoad);
              
              // Force another layout after a brief delay to ensure proper sizing
              setTimeout(() => {
                monacoFileEditor.layout();
                console.log('Forced layout refresh completed');
              }, 50);
              
              // Update language based on current file
              const filename = document.querySelector('.header-path a:last-child')?.textContent || '';
              if (filename) {
                const language = getLanguageFromExtension(filename);
                console.log('Detected language for file:', filename, '→', language);
                
                // Validate language exists in Monaco
                const availableLanguages = monaco.languages.getLanguages().map(lang => lang.id);
                const validLanguage = availableLanguages.includes(language) ? language : 'plaintext';
                if (language !== validLanguage) {
                  console.log('Language', language, 'not available in Monaco, using plaintext');
                }
                
                const model = monacoFileEditor.getModel();
                if (model) {
                  console.log('Setting Monaco model language to:', validLanguage);
                  monaco.editor.setModelLanguage(model, validLanguage);
                  console.log('Current model language after setting:', model.getLanguageId());
                } else {
                  console.log('No Monaco model found');
                }
              }
              
              // Set up auto-save
              monacoFileEditor.onDidChangeModelContent(() => {
                saveDraft(filePath, monacoFileEditor.getValue());
              });
              
              console.log('Monaco content set successfully');
            } else {
              // Monaco not ready yet, wait and try again
              console.log('Monaco not ready, retrying in 100ms...');
              
              // If Monaco is available but the editor wasn't created, try to reinitialize
              if (window.monacoReady && !monacoFileEditor && typeof monaco !== 'undefined') {
                console.log('Reinitializing Monaco file editor...');
                const fileEditorContainer = document.getElementById('file-editor');
                if (fileEditorContainer) {
                  const currentTheme = html.getAttribute('data-theme');
                  const monacoTheme = currentTheme === 'dark' ? 'vs-dark' : 'vs';
                  const filename = document.querySelector('.header-path a:last-child')?.textContent || 'file.txt';
                  const language = getLanguageFromExtension(filename);
                  
                  // Validate language exists in Monaco
                  const availableLanguages = monaco.languages.getLanguages().map(lang => lang.id);
                  const validLanguage = availableLanguages.includes(language) ? language : 'plaintext';
                  console.log('Reinit - Available languages include', language + ':', availableLanguages.includes(language));
                  
                  monacoFileEditor = monaco.editor.create(fileEditorContainer, {
                    value: '',
                    language: validLanguage,
                    theme: monacoTheme,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    fontSize: 12,
                    lineHeight: 1.5,
                    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
                    padding: { top: 20, bottom: 20 },
                    renderLineHighlight: 'line',
                    selectOnLineNumbers: true,
                    automaticLayout: true,
                    folding: true,
                    foldingHighlight: true,
                    foldingStrategy: 'auto',
                    showFoldingControls: 'mouseover',
                    bracketPairColorization: { enabled: true },
                    guides: {
                      bracketPairs: true,
                      indentation: true
                    }
                  });
                  console.log('Monaco file editor reinitialized');
                }
              }
              
              setTimeout(setContentWhenReady, 100);
            }
          };
          setContentWhenReady();
          
          fileContent.style.display = 'none';
          editorContainer.style.display = 'block';
          
          // Focus Monaco editor
          if (monacoFileEditor) {
            monacoFileEditor.focus();
          }
        })
        .catch(error => {
          console.error('Error fetching file content:', error);
          let errorMessage = 'Failed to load file content for editing';
          if (error.message.includes('HTTP 403')) {
            errorMessage = 'Access denied: Cannot read this file';
          } else if (error.message.includes('HTTP 404')) {
            errorMessage = 'File not found';
          } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error: Please check your connection';
          }
          showNotification(errorMessage, 'error');
        });
    });

    cancelBtn.addEventListener('click', function() {
      editorContainer.style.display = 'none';
      fileContent.style.display = 'block';
    });

    saveBtn.addEventListener('click', function() {
      const currentUrl = new URL(window.location.href);
      const filePath = currentUrl.searchParams.get('path') || '';
      
      
      fetch('/api/save-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: filePath,
          content: monacoFileEditor ? monacoFileEditor.getValue() : ''
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          // Clear draft on successful save
          clearDraft(filePath);
          showNotification('File saved successfully', 'success');
          // Refresh the page to show updated content
          setTimeout(() => window.location.reload(), 800);
        } else {
          showNotification('Failed to save file: ' + data.error, 'error');
        }
      })
      .catch(error => {
        console.error('Error saving file:', error);
        let errorMessage = 'Failed to save file';
        if (error.message.includes('HTTP 403')) {
          errorMessage = 'Access denied: Cannot write to this file';
        } else if (error.message.includes('HTTP 413')) {
          errorMessage = 'File too large to save';
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Please check your connection';
        }
        showNotification(errorMessage, 'error');
      });
    });
  }

  // Quick edit file functionality
  document.addEventListener('click', function(e) {
    if (e.target.closest('.edit-file-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const button = e.target.closest('.edit-file-btn');
      const filePath = button.dataset.path;
      // Navigate to the file and trigger edit mode
      window.location.href = `/?path=${encodeURIComponent(filePath)}#edit`;
    }
    
    // Git diff viewer functionality
    if (e.target.closest('.diff-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const button = e.target.closest('.diff-btn');
      const filePath = button.dataset.path;
      showDiffViewer(filePath);
    }
  });

  // Git diff viewer functions
  function showDiffViewer(filePath) {
    // Create diff viewer overlay
    const overlay = document.createElement('div');
    overlay.className = 'diff-viewer-overlay';
    overlay.innerHTML = `
      <div class="diff-viewer-modal">
        <div class="diff-viewer-header">
          <h3 class="diff-viewer-title">
            📋 Diff: ${filePath}
          </h3>
          <button class="diff-close-btn" aria-label="Close diff viewer">&times;</button>
        </div>
        <div class="diff-viewer-content">
          <div style="padding: 40px; text-align: center;">Fetching diff...</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Close on overlay click or close button
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay || e.target.classList.contains('diff-close-btn')) {
        document.body.removeChild(overlay);
      }
    });
    
    // Close with Escape key
    const escHandler = function(e) {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    // Load diff content
    loadDiffContent(filePath, overlay);
  }

  function loadDiffContent(filePath, overlay) {
    fetch(`/api/git-diff?path=${encodeURIComponent(filePath)}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          renderDiff(data.diff, data.filePath, overlay);
        } else {
          showDiffError(data.error, overlay);
        }
      })
      .catch(error => {
        console.error('Error loading diff:', error);
        showDiffError('Failed to load diff', overlay);
      });
  }

  function renderDiff(diffText, filePath, overlay) {
    if (!diffText || diffText.trim() === '') {
      const content = overlay.querySelector('.diff-viewer-content');
      content.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--text-secondary);">
          No changes detected for this file
        </div>
      `;
      return;
    }

    const lines = diffText.split('\n');
    const parsedDiff = parseDiff(lines);
    
    const content = overlay.querySelector('.diff-viewer-content');
    content.innerHTML = `
      <div class="diff-container">
        <div class="diff-side">
          <div class="diff-side-header">Original</div>
          <div class="diff-side-content" id="diff-original"></div>
        </div>
        <div class="diff-side">
          <div class="diff-side-header">Modified</div>
          <div class="diff-side-content" id="diff-modified"></div>
        </div>
      </div>
    `;

    const originalSide = content.querySelector('#diff-original');
    const modifiedSide = content.querySelector('#diff-modified');
    
    renderDiffSide(parsedDiff.original, originalSide, 'original');
    renderDiffSide(parsedDiff.modified, modifiedSide, 'modified');
  }

  function parseDiff(lines) {
    const original = [];
    const modified = [];
    let originalLineNum = 1;
    let modifiedLineNum = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('@@')) {
        // Parse hunk header
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          originalLineNum = parseInt(match[1]);
          modifiedLineNum = parseInt(match[2]);
        }
        continue;
      }
      
      if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff ') || line.startsWith('index ')) {
        continue;
      }
      
      if (line.startsWith('-')) {
        original.push({
          lineNum: originalLineNum++,
          content: line.substring(1),
          type: 'removed'
        });
      } else if (line.startsWith('+')) {
        modified.push({
          lineNum: modifiedLineNum++,
          content: line.substring(1),
          type: 'added'
        });
      } else {
        // Context line
        const content = line.startsWith(' ') ? line.substring(1) : line;
        original.push({
          lineNum: originalLineNum++,
          content: content,
          type: 'context'
        });
        modified.push({
          lineNum: modifiedLineNum++,
          content: content,
          type: 'context'
        });
      }
    }
    
    return { original, modified };
  }

  function renderDiffSide(lines, container, side) {
    container.innerHTML = lines.map(line => {
      let content = escapeHtml(line.content);
      
      // Apply syntax highlighting if hljs is available
      if (window.hljs && line.content.trim() !== '') {
        try {
          const highlighted = hljs.highlightAuto(line.content);
          content = highlighted.value;
        } catch (e) {
          // Fall back to escaped HTML if highlighting fails
          content = escapeHtml(line.content);
        }
      }
      
      return `
        <div class="diff-line diff-line-${line.type}">
          <div class="diff-line-number">${line.lineNum}</div>
          <div class="diff-line-content">${content}</div>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showDiffError(error, overlay) {
    const content = overlay.querySelector('.diff-viewer-content');
    content.innerHTML = `
      <div style="padding: 40px; text-align: center; color: var(--text-secondary);">
        <p>Error loading diff:</p>
        <p style="color: #dc3545; margin-top: 8px;">${error}</p>
      </div>
    `;
  }

  // File operations (delete, rename)
  document.addEventListener('click', function(e) {
    if (e.target.closest('.delete-btn')) {
      const btn = e.target.closest('.delete-btn');
      const itemPath = btn.dataset.path;
      const itemName = btn.dataset.name;
      const isDirectory = btn.dataset.isDirectory === 'true';
      
      const confirmMessage = `Are you sure you want to delete ${isDirectory ? 'folder' : 'file'} "${itemName}"?${isDirectory ? ' This will permanently delete the folder and all its contents.' : ''}`;
      
      if (confirm(confirmMessage)) {
        btn.style.opacity = '0.5';
        
        fetch('/api/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: itemPath
          })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            showNotification(`${isDirectory ? 'Folder' : 'File'} "${itemName}" deleted successfully`, 'success');
            setTimeout(() => window.location.reload(), 600);
          } else {
            btn.style.opacity = '1';
            showNotification('Failed to delete: ' + data.error, 'error');
          }
        })
        .catch(error => {
          console.error('Error deleting item:', error);
          btn.style.opacity = '1';
          let errorMessage = 'Failed to delete item';
          if (error.message.includes('HTTP 403')) {
            errorMessage = 'Access denied: Cannot delete this item';
          } else if (error.message.includes('HTTP 404')) {
            errorMessage = 'Item not found';
          } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error: Please check your connection';
          }
          showNotification(errorMessage, 'error');
        });
      }
    }
    
    if (e.target.closest('.rename-btn')) {
      const btn = e.target.closest('.rename-btn');
      const itemPath = btn.dataset.path;
      const currentName = btn.dataset.name;
      const isDirectory = btn.dataset.isDirectory === 'true';
      
      const newName = prompt(`Rename ${isDirectory ? 'folder' : 'file'}:`, currentName);
      if (newName && newName.trim() && newName !== currentName) {
        btn.style.opacity = '0.5';
        
        fetch('/api/rename', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: itemPath,
            newName: newName.trim()
          })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            showNotification(`${isDirectory ? 'Folder' : 'File'} renamed to "${newName.trim()}"`, 'success');
            setTimeout(() => window.location.reload(), 600);
          } else {
            btn.style.opacity = '1';
            showNotification('Failed to rename: ' + data.error, 'error');
          }
        })
        .catch(error => {
          console.error('Error renaming item:', error);
          btn.style.opacity = '1';
          let errorMessage = 'Failed to rename item';
          if (error.message.includes('HTTP 403')) {
            errorMessage = 'Access denied: Cannot rename this item';
          } else if (error.message.includes('HTTP 404')) {
            errorMessage = 'Item not found';
          } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error: Please check your connection';
          }
          showNotification(errorMessage, 'error');
        });
      }
    }
  });

  // New file interface functionality
  const newFilenameInput = document.getElementById('new-filename-input');
  
  // Update Monaco language when filename changes
  if (newFilenameInput) {
    newFilenameInput.addEventListener('input', function() {
      const filename = this.value.trim();
      if (monacoNewFileEditor && filename) {
        const language = getLanguageFromExtension(filename);
        const model = monacoNewFileEditor.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, language);
        }
      }
    });
  }
  const createNewFileBtn = document.getElementById('create-new-file');
  const cancelNewFileBtn = document.getElementById('cancel-new-file');

  if (createNewFileBtn) {
    createNewFileBtn.addEventListener('click', function() {
      const filename = newFilenameInput.value.trim();
      const content = monacoNewFileEditor ? monacoNewFileEditor.getValue() : '';
      
      if (!filename) {
        showNotification('Please enter a filename', 'error');
        newFilenameInput.focus();
        return;
      }
      
      
      const currentUrl = new URL(window.location.href);
      const currentPath = currentUrl.searchParams.get('path') || '';
      
      fetch('/api/create-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: currentPath,
          filename: filename
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          // If there's content, save it
          if (content.trim()) {
            const filePath = currentPath ? `${currentPath}/${filename}` : filename;
            return fetch('/api/save-file', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                path: filePath,
                content: content
              })
            });
          }
          return { json: () => Promise.resolve({ success: true }) };
        } else {
          throw new Error(data.error);
        }
      })
      .then(response => response.json ? response.json() : response)
      .then(data => {
        if (data.success) {
          showNotification(`File "${filename}" created successfully`, 'success');
          // Navigate back to the directory or to the new file
          const redirectPath = currentPath ? `/?path=${encodeURIComponent(currentPath)}` : '/';
          setTimeout(() => window.location.href = redirectPath, 800);
        } else {
          throw new Error(data.error);
        }
      })
      .catch(error => {
        console.error('Error creating file:', error);
        let errorMessage = 'Failed to create file: ' + error.message;
        if (error.message.includes('HTTP 403')) {
          errorMessage = 'Access denied: Cannot create files in this directory';
        } else if (error.message.includes('HTTP 409') || error.message.includes('already exists')) {
          errorMessage = 'File already exists';
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Please check your connection';
        }
        showNotification(errorMessage, 'error');
      });
    });
  }

  if (cancelNewFileBtn) {
    cancelNewFileBtn.addEventListener('click', function() {
      const currentUrl = new URL(window.location.href);
      const currentPath = currentUrl.searchParams.get('path') || '';
      const redirectPath = currentPath ? `/?path=${encodeURIComponent(currentPath)}` : '/';
      window.location.href = redirectPath;
    });
  }

  async function copyToClipboard(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      
      // Show success feedback
      const originalIcon = button.innerHTML;
      const checkIcon = '<svg class="quick-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>';
      
      button.innerHTML = checkIcon;
      button.style.color = '#28a745';
      
      setTimeout(() => {
        button.innerHTML = originalIcon;
        button.style.color = '';
      }, 1000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        // Show success feedback (same as above)
        const originalIcon = button.innerHTML;
        const checkIcon = '<svg class="quick-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>';
        
        button.innerHTML = checkIcon;
        button.style.color = '#28a745';
        
        setTimeout(() => {
          button.innerHTML = originalIcon;
          button.style.color = '';
        }, 1000);
      } catch (fallbackErr) {
        console.error('Could not copy text: ', fallbackErr);
      }
      
      document.body.removeChild(textArea);
    }
  }
});

// Simple commit modal functionality
document.addEventListener('click', (e) => {
  if (e.target.matches('#commit-btn') || e.target.closest('#commit-btn')) {
    e.preventDefault();
    showCommitModal();
  }
});

async function showCommitModal() {
  try {
    // Get current path from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentPath = urlParams.get('path') || '';
    
    // Fetch git changes from current directory and subdirectories only
    const response = await fetch(`/api/git-status?currentPath=${encodeURIComponent(currentPath)}`);
    const data = await response.json();
    
    if (!data.success) {
      showNotification('❌ Failed to load git changes', 'error');
      return;
    }
    
    const changedFiles = data.changes;
    
    if (changedFiles.length === 0) {
      showNotification('ℹ️ No changes to commit', 'info');
      return;
    }
    
    showCommitModalWithFiles(changedFiles);
  } catch (error) {
    console.error('Error fetching git status:', error);
    showNotification('❌ Failed to load git changes', 'error');
  }
}

function groupFilesByDirectory(files) {
  const groups = new Map();
  
  files.forEach(file => {
    const parts = file.name.split('/');
    if (parts.length === 1) {
      // Root level file
      if (!groups.has('')) {
        groups.set('', { directory: null, files: [] });
      }
      groups.get('').files.push(file);
    } else {
      // File in subdirectory
      const directory = parts.slice(0, -1).join('/');
      if (!groups.has(directory)) {
        groups.set(directory, { directory, files: [] });
      }
      groups.get(directory).files.push(file);
    }
  });
  
  // Convert to array and sort
  const result = Array.from(groups.values());
  result.sort((a, b) => {
    if (!a.directory && b.directory) return -1; // Root files first
    if (a.directory && !b.directory) return 1;
    if (!a.directory && !b.directory) return 0;
    return a.directory.localeCompare(b.directory);
  });
  
  return result;
}

async function showCommitModalWithFiles(changedFiles) {
  // Group files by directory for better display
  const groupedFiles = groupFilesByDirectory(changedFiles);
  
  // Get octicons for the modal
  const folderIcon = octicons.get('file-directory', { class: 'folder-icon' });

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'commit-modal-overlay';
  modal.innerHTML = `
    <div class="commit-modal">
      <div class="commit-modal-header">
        <h3>Commit Changes</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="commit-modal-body">
        <div class="changed-files">
          <h4>Changed Files (${changedFiles.length})</h4>
          <ul class="file-list">
            ${groupedFiles.map(group => `
              ${group.directory ? `<li class="directory-group"><strong>${folderIcon} ${group.directory}/</strong></li>` : ''}
              ${group.files.map(file => `
                <li class="file-item ${group.directory ? 'indented' : ''}">
                  <label class="file-checkbox-label">
                    <input type="checkbox" class="file-checkbox" data-file="${file.name}" checked>
                    <span class="file-status">${file.status}</span>
                    <span class="file-name">${group.directory ? file.name.split('/').pop() : file.name}</span>
                  </label>
                </li>
              `).join('')}
            `).join('')}
          </ul>
        </div>
        <div class="commit-message-section">
          <textarea id="modal-commit-message" placeholder="Enter commit message..." rows="4"></textarea>
        </div>
      </div>
      <div class="commit-modal-footer">
        <button class="btn-cancel">Cancel</button>
        <button class="btn-commit" disabled>Commit Changes</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle modal interactions
  const messageInput = modal.querySelector('#modal-commit-message');
  const commitBtn = modal.querySelector('.btn-commit');
  const cancelBtn = modal.querySelector('.btn-cancel');
  const closeBtn = modal.querySelector('.modal-close');

  // Update commit button based on message and selected files
  const updateCommitButton = () => {
    const hasMessage = messageInput.value.trim();
    const selectedFiles = modal.querySelectorAll('.file-checkbox:checked').length;
    commitBtn.disabled = !hasMessage || selectedFiles === 0;
    commitBtn.textContent = selectedFiles > 0 
      ? `Commit ${selectedFiles} file${selectedFiles === 1 ? '' : 's'}` 
      : 'No files selected';
  };

  messageInput.addEventListener('input', updateCommitButton);
  
  // Handle checkbox changes
  modal.querySelectorAll('.file-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateCommitButton);
  });
  
  // Initial button state
  updateCommitButton();

  // Close modal handlers
  const closeModal = () => {
    document.body.removeChild(modal);
  };

  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Prevent keyboard shortcuts from interfering with the modal
  modal.addEventListener('keydown', (e) => {
    e.stopPropagation();
  });

  // Commit handler
  commitBtn.addEventListener('click', async () => {
    const message = messageInput.value.trim();
    const selectedCheckboxes = modal.querySelectorAll('.file-checkbox:checked');
    const selectedFiles = Array.from(selectedCheckboxes).map(cb => cb.dataset.file);
    
    if (!message || selectedFiles.length === 0) return;

    const originalText = commitBtn.textContent;
    commitBtn.textContent = 'Committing...';
    commitBtn.disabled = true;

    try {
      // Commit selected files
      const response = await fetch('/api/git-commit-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, files: selectedFiles })
      });

      if (response.ok) {
        showNotification(`✅ Successfully committed ${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'}!`, 'success');
        closeModal();
        setTimeout(() => location.reload(), 1000);
      } else {
        const error = await response.text();
        showNotification(`❌ Commit failed: ${error}`, 'error');
        commitBtn.textContent = originalText;
        commitBtn.disabled = false;
      }
    } catch (err) {
      showNotification('❌ Commit failed', 'error');
      commitBtn.textContent = originalText;
      commitBtn.disabled = false;
    }
  });

  // Focus the message input
  messageInput.focus();
}