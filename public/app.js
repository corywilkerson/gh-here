/**
 * Main application entry point
 * Coordinates all modules and initializes the application
 */

import { ThemeManager } from './js/theme-manager.js';
import { SearchHandler } from './js/search-handler.js';
import { KeyboardHandler } from './js/keyboard-handler.js';
import { FileTreeNavigator } from './js/file-tree.js';
import { NavigationHandler } from './js/navigation.js';
import { PathUtils } from './js/utils.js';
import { showNotification } from './js/notification.js';
import { copyToClipboard } from './js/clipboard-utils.js';

class Application {
  constructor() {
    this.themeManager = null;
    this.searchHandler = null;
    this.keyboardHandler = null;
    this.fileTree = null;
    this.navigationHandler = null;
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      // Initialize navigation first so listeners are ready
      this.navigation = new NavigationHandler();
      this.initializeComponents();
    });

    // Re-initialize components after client-side navigation
    document.addEventListener('content-loaded', () => {
      try {
        // Re-initialize theme manager listeners (button might be re-rendered)
        if (this.themeManager) {
          this.themeManager.setupListeners();
        }
        
        // Re-initialize components that need fresh DOM references
        this.searchHandler = new SearchHandler();
        this.keyboardHandler = new KeyboardHandler(this.searchHandler);
        
        // Re-initialize file tree when sidebar becomes visible
        const sidebar = document.querySelector('.file-tree-sidebar');
        const treeContainer = document.getElementById('file-tree');
        
        if (sidebar && treeContainer && !sidebar.classList.contains('hidden')) {
          // Sidebar is visible - initialize or re-initialize file tree
          if (!this.fileTree || !this.fileTree.isInitialized || this.fileTree.treeContainer !== treeContainer) {
            this.fileTree = new FileTreeNavigator();
          }
        } else if (this.fileTree) {
          // Sidebar is hidden - don't initialize but keep reference for when it becomes visible
          this.fileTree = null;
        }
        
        this.setupGlobalEventListeners();
        this.setupGitignoreToggle();
        this.setupFileOperations();
      } catch (error) {
        console.error('Error re-initializing components:', error);
      }
    });
  }

  initializeComponents() {
    // Theme manager persists across navigations
    if (!this.themeManager) {
      this.themeManager = new ThemeManager();
    }

    // Initialize components
    this.searchHandler = new SearchHandler();
    this.keyboardHandler = new KeyboardHandler(this.searchHandler);
    
    // Initialize file tree if sidebar is visible (not hidden)
    const sidebar = document.querySelector('.file-tree-sidebar');
    const treeContainer = document.getElementById('file-tree');
    if (sidebar && treeContainer && !sidebar.classList.contains('hidden')) {
      this.fileTree = new FileTreeNavigator();
    }

    this.setupGlobalEventListeners();
    this.setupGitignoreToggle();
    this.setupFileOperations();
  }

  setupGlobalEventListeners() {
    // Use event delegation - single listener for all clicks (no duplicates)
    // This method can be called multiple times safely
    if (!this.globalClickHandler) {
      this.globalClickHandler = this.handleGlobalClick.bind(this);
      document.addEventListener('click', this.globalClickHandler);
    }

    // Setup file row clicks (event delegation on table)
    if (!this.fileRowClickHandler) {
      this.fileRowClickHandler = this.handleFileRowClick.bind(this);
      const fileTable = document.getElementById('file-table');
      if (fileTable) {
        fileTable.addEventListener('click', this.fileRowClickHandler);
      }
    }
  }

  handleGlobalClick(e) {
    // Copy path button
    const copyPathBtn = e.target.closest('.copy-path-btn, .file-path-copy-btn');
    if (copyPathBtn) {
      e.preventDefault();
      e.stopPropagation();
      copyToClipboard(copyPathBtn.dataset.path, copyPathBtn);
      return;
    }

    // Copy raw button
    const copyRawBtn = e.target.closest('.copy-raw-btn');
    if (copyRawBtn) {
      e.preventDefault();
      e.stopPropagation();
      this.copyRawContent(copyRawBtn.dataset.path, copyRawBtn);
      return;
    }

    // Diff button
    const diffBtn = e.target.closest('.diff-btn');
    if (diffBtn) {
      e.preventDefault();
      e.stopPropagation();
      this.showDiffViewer(diffBtn.dataset.path);
    }
  }

  handleFileRowClick(e) {
    const fileRow = e.target.closest('.file-row');
    if (!fileRow || e.target.closest('.quick-actions')) {
      return;
    }

    // Get the path from the row and navigate directly
    const path = fileRow.dataset.path;
    if (path !== undefined) {
      e.preventDefault();
      e.stopPropagation();
      // Dispatch navigate event which navigation handler will catch
      document.dispatchEvent(new CustomEvent('navigate', {
        detail: { path, isDirectory: fileRow.dataset.type === 'dir' }
      }));
    }
  }

  setupGitignoreToggle() {
    const toggle = document.getElementById('gitignore-toggle');
    if (!toggle) return;

    // Only setup if not already configured (check for data attribute)
    if (toggle.dataset.configured) return;
    toggle.dataset.configured = 'true';

    // Set initial state from localStorage
    const showGitignored = localStorage.getItem('gh-here-show-gitignored') === 'true';
    if (showGitignored) {
      toggle.classList.add('showing-ignored');
    } else {
      toggle.classList.remove('showing-ignored');
    }

    toggle.addEventListener('click', () => {
      // Toggle state in localStorage
      const current = localStorage.getItem('gh-here-show-gitignored') === 'true';
      const newState = !current;
      localStorage.setItem('gh-here-show-gitignored', newState.toString());

      // Clear file tree cache since gitignore state is changing
      sessionStorage.removeItem('gh-here-file-tree');

      // Reload page to apply new filter
      window.location.reload();
    });
  }


  setupFileOperations() {
    document.addEventListener('click', async e => {
      if (e.target.closest('.delete-btn')) {
        const btn = e.target.closest('.delete-btn');
        const itemPath = btn.dataset.path;
        const itemName = btn.dataset.name;
        const isDirectory = btn.dataset.isDirectory === 'true';

        const message = `Are you sure you want to delete ${isDirectory ? 'folder' : 'file'} "${itemName}"?`;
        if (!confirm(message)) {
          return;
        }

        try {
          const response = await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: itemPath })
          });

          if (!response.ok) {
            throw new Error('Delete failed');
          }

          showNotification(`${isDirectory ? 'Folder' : 'File'} deleted successfully`, 'success');
          setTimeout(() => window.location.reload(), 600);
        } catch (error) {
          showNotification('Failed to delete item', 'error');
        }
      }

      if (e.target.closest('.rename-btn')) {
        const btn = e.target.closest('.rename-btn');
        const itemPath = btn.dataset.path;
        const currentName = btn.dataset.name;
        const isDirectory = btn.dataset.isDirectory === 'true';

        const newName = prompt(`Rename ${isDirectory ? 'folder' : 'file'}:`, currentName);
        if (!newName || newName.trim() === currentName) {
          return;
        }

        try {
          const response = await fetch('/api/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: itemPath, newName: newName.trim() })
          });

          if (!response.ok) {
            throw new Error('Rename failed');
          }

          showNotification(`Renamed to "${newName.trim()}"`, 'success');
          setTimeout(() => window.location.reload(), 600);
        } catch (error) {
          showNotification('Failed to rename item', 'error');
        }
      }
    });
  }

  showDiffViewer(filePath) {
    // Simplified - redirect to diff view
    const url = new URL(window.location.href);
    url.searchParams.set('path', filePath);
    url.searchParams.set('view', 'diff');
    window.location.href = url.toString();
  }

  async copyRawContent(filePath, button) {
    try {
      const response = await fetch(`/api/file-content?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const content = await response.text();
      await copyToClipboard(content, button);
      showNotification('Raw content copied to clipboard', 'success');
    } catch (error) {
      console.error('Failed to copy raw content:', error);
      showNotification('Failed to copy raw content', 'error');
    }
  }
}

const app = new Application();
app.init();
