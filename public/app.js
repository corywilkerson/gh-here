document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const searchInput = document.getElementById('file-search');
  const fileTable = document.getElementById('file-table');
  
  let currentFocusIndex = -1;
  let fileRows = [];
  
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
  
  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (searchInput && document.activeElement === searchInput) {
      handleSearchKeydown(e);
    } else {
      handleGlobalKeydown(e);
    }
  });
  
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
  
  function showKeyboardHelp() {
    const helpModal = document.createElement('div');
    helpModal.className = 'keyboard-help-modal';
    helpModal.innerHTML = `
      <div class="keyboard-help-overlay"></div>
      <div class="keyboard-help-content">
        <div class="keyboard-help-header">
          <h2>Keyboard Shortcuts</h2>
          <button class="keyboard-help-close">&times;</button>
        </div>
        <div class="keyboard-help-body">
          <div class="keyboard-shortcuts-grid">
            <div class="shortcut-section">
              <h3>Navigation</h3>
              <div class="shortcut"><kbd>j</kbd> or <kbd>↓</kbd><span>Move down</span></div>
              <div class="shortcut"><kbd>k</kbd> or <kbd>↑</kbd><span>Move up</span></div>
              <div class="shortcut"><kbd>Enter</kbd> or <kbd>o</kbd><span>Open file/folder</span></div>
              <div class="shortcut"><kbd>h</kbd><span>Go up directory</span></div>
              <div class="shortcut"><kbd>Ctrl/Cmd + g</kbd><span>Go to top</span></div>
              <div class="shortcut"><kbd>Shift + G</kbd><span>Go to bottom</span></div>
            </div>
            <div class="shortcut-section">
              <h3>Search & Actions</h3>
              <div class="shortcut"><kbd>/</kbd> or <kbd>s</kbd><span>Focus search</span></div>
              <div class="shortcut"><kbd>Ctrl/Cmd + k</kbd><span>Focus search</span></div>
              <div class="shortcut"><kbd>Esc</kbd><span>Clear search</span></div>
              <div class="shortcut"><kbd>t</kbd><span>Toggle theme</span></div>
              <div class="shortcut"><kbd>r</kbd><span>Refresh page</span></div>
              <div class="shortcut"><kbd>?</kbd><span>Show this help</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(helpModal);
    
    // Close modal handlers
    const closeBtn = helpModal.querySelector('.keyboard-help-close');
    const overlay = helpModal.querySelector('.keyboard-help-overlay');
    
    function closeModal() {
      document.body.removeChild(helpModal);
    }
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    // Close with Escape key
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });
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