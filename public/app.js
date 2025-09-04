document.addEventListener('DOMContentLoaded', function() {
  
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const searchInput = document.getElementById('file-search');
  const fileTable = document.getElementById('file-table');
  const fileEditor = document.getElementById('file-editor');
  
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
  
  // Loading state utilities
  function showLoadingState(element, originalText) {
    element.disabled = true;
    element.textContent = originalText + '...';
    element.classList.add('loading');
  }
  
  function hideLoadingState(element, originalText) {
    element.disabled = false;
    element.textContent = originalText;
    element.classList.remove('loading');
  }
  
  // Initialize
  updateFileRows();
  
  // Load saved theme or default to dark
  const savedTheme = localStorage.getItem('gh-here-theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  
  // Theme toggle functionality
  themeToggle.addEventListener('click', function() {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('gh-here-theme', newTheme);
    updateThemeIcon(newTheme);
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
    if (e.key === '?' && document.activeElement !== searchInput && document.activeElement !== fileEditor) {
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
        (document.activeElement === fileEditor || editorContainer.contains(document.activeElement))) {
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

  // Line numbers functionality
  function updateLineNumbers(textarea, lineNumbersDiv) {
    if (!textarea || !lineNumbersDiv) return;
    
    const lines = textarea.value.split('\n');
    const lineNumbers = lines.map((_, index) => index + 1).join('\n');
    lineNumbersDiv.textContent = lineNumbers || '1';
  }

  // Initialize and handle line numbers for both editors
  const editorLineNumbers = document.getElementById('editor-line-numbers');
  const newFileContent = document.getElementById('new-file-content');
  const newFileLineNumbers = document.getElementById('new-file-line-numbers');

  // Get fileEditor reference (declared earlier in the file)
  if (document.getElementById('file-editor') && editorLineNumbers) {
    const fileEditorElement = document.getElementById('file-editor');
    fileEditorElement.addEventListener('input', () => updateLineNumbers(fileEditorElement, editorLineNumbers));
    fileEditorElement.addEventListener('scroll', () => {
      editorLineNumbers.scrollTop = fileEditorElement.scrollTop;
    });
  }

  if (newFileContent && newFileLineNumbers) {
    newFileContent.addEventListener('input', () => updateLineNumbers(newFileContent, newFileLineNumbers));
    newFileContent.addEventListener('scroll', () => {
      newFileLineNumbers.scrollTop = newFileContent.scrollTop;
    });
  }

  // Auto-open editor if hash is #edit
  if (window.location.hash === '#edit' && editBtn) {
    // Remove hash and trigger edit
    window.location.hash = '';
    setTimeout(() => editBtn.click(), 100);
  }

  if (editBtn && editorContainer && fileEditor) {
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
      
      showLoadingState(editBtn, 'Edit');
      
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
          if (draft && draft !== content) {
            if (confirm('You have unsaved changes for this file. Load draft?')) {
              fileEditor.value = draft;
            } else {
              fileEditor.value = content;
              clearDraft(filePath);
            }
          } else {
            fileEditor.value = content;
          }
          
          fileContent.style.display = 'none';
          editorContainer.style.display = 'block';
          fileEditor.focus();
          
          // Set up auto-save and update line numbers
          fileEditor.addEventListener('input', function() {
            saveDraft(filePath, fileEditor.value);
          });
          
          // Update line numbers for loaded content
          updateLineNumbers(fileEditor, editorLineNumbers);
          hideLoadingState(editBtn, 'Edit');
        })
        .catch(error => {
          console.error('Error fetching file content:', error);
          hideLoadingState(editBtn, 'Edit');
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
      
      showLoadingState(saveBtn, 'Save');
      
      fetch('/api/save-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: filePath,
          content: fileEditor.value
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
          hideLoadingState(saveBtn, 'Save');
          showNotification('File saved successfully', 'success');
          // Refresh the page to show updated content
          setTimeout(() => window.location.reload(), 800);
        } else {
          hideLoadingState(saveBtn, 'Save');
          showNotification('Failed to save file: ' + data.error, 'error');
        }
      })
      .catch(error => {
        console.error('Error saving file:', error);
        hideLoadingState(saveBtn, 'Save');
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
          <div class="loading" style="padding: 40px; text-align: center;">Loading diff...</div>
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
        showLoadingState(btn, '');
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
            hideLoadingState(btn, '');
            showNotification('Failed to delete: ' + data.error, 'error');
          }
        })
        .catch(error => {
          console.error('Error deleting item:', error);
          btn.style.opacity = '1';
          hideLoadingState(btn, '');
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
        showLoadingState(btn, '');
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
            hideLoadingState(btn, '');
            showNotification('Failed to rename: ' + data.error, 'error');
          }
        })
        .catch(error => {
          console.error('Error renaming item:', error);
          btn.style.opacity = '1';
          hideLoadingState(btn, '');
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
  const createNewFileBtn = document.getElementById('create-new-file');
  const cancelNewFileBtn = document.getElementById('cancel-new-file');

  if (createNewFileBtn) {
    createNewFileBtn.addEventListener('click', function() {
      const filename = newFilenameInput.value.trim();
      const content = newFileContent.value;
      
      if (!filename) {
        showNotification('Please enter a filename', 'error');
        newFilenameInput.focus();
        return;
      }
      
      showLoadingState(createNewFileBtn, 'Create file');
      
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
          hideLoadingState(createNewFileBtn, 'Create file');
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
        hideLoadingState(createNewFileBtn, 'Create file');
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