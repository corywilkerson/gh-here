/**
 * Main application entry point
 * Coordinates all modules and initializes the application
 * @module app
 */

// ============================================================================
// Imports (alpha-sorted)
// ============================================================================

import { ContentSearchHandler } from './js/content-search-handler.js';
import { copyToClipboard } from './js/clipboard-utils.js';
import { FileTreeNavigator } from './js/file-tree.js';
import { FileViewer } from './js/file-viewer.js';
import { FocusMode } from './js/focus-mode.js';
import { InlineSearch } from './js/inline-search.js';
import { KeyboardHandler } from './js/keyboard-handler.js';
import { NavigationHandler } from './js/navigation.js';
import { PathUtils } from './js/utils.js';
import { SearchHandler } from './js/search-handler.js';
import { showNotification } from './js/notification.js';
import { SymbolOutline } from './js/symbol-outline.js';
import { ThemeManager } from './js/theme-manager.js';

// ============================================================================
// Application Class
// ============================================================================

class Application {
  constructor() {
    this.themeManager = null;
    this.searchHandler = null;
    this.keyboardHandler = null;
    this.fileTree = null;
    this.navigationHandler = null;
    this.lastSelectedLine = null;
    this.fileViewer = null;
    this.inlineSearch = null;
    this.focusMode = null;
    this.contentSearch = null;
    this.symbolOutline = null;
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
        // Cleanup existing components before re-initializing
        this.cleanupComponents();

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
        this.highlightLinesFromHash();
        this.initializeFileViewer();
        this.initializeInlineSearch();
        this.initializeFocusMode();
        this.initializeContentSearch();
        this.initializeSymbolOutline();
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
    this.highlightLinesFromHash();
    this.initializeFileViewer();
    this.initializeInlineSearch();
    this.initializeFocusMode();
    this.initializeContentSearch();
    this.initializeSymbolOutline();
  }

  // ========================================================================
  // Component Initialization
  // ========================================================================

  /**
   * Check if current page is a file view page
   */
  isFileViewPage() {
    const fileContent = document.querySelector('.file-content');
    return fileContent?.querySelector('pre code.hljs.with-line-numbers') !== null;
  }

  /**
   * Initialize Monaco-based file viewer
   */
  initializeFileViewer() {
    if (!this.isFileViewPage()) return;

    // Wait for Monaco to be ready
    if (typeof require === 'undefined' || !window.monacoReady) {
      // Wait a bit and try again
      setTimeout(() => this.initializeFileViewer(), 100);
      return;
    }

    if (!this.fileViewer) {
      this.fileViewer = new FileViewer();
    }
  }

  /**
   * Initialize inline search component
   * Note: Skipped when Monaco viewer is active (Monaco has built-in search)
   */
  initializeInlineSearch() {
    if (!this.isFileViewPage()) return;
    
    // Skip if Monaco viewer is active
    if (document.querySelector('.monaco-file-viewer')) {
      return;
    }

    if (!this.inlineSearch) {
      this.inlineSearch = new InlineSearch();
    }
    this.inlineSearch.init();
  }

  initializeFocusMode() {
    if (!this.focusMode) {
      this.focusMode = new FocusMode();
    }
    this.focusMode.init();
  }

  /**
   * Initialize symbol outline panel
   */
  initializeSymbolOutline() {
    // Cleanup previous instance
    if (this.symbolOutline) {
      this.symbolOutline.destroy();
      this.symbolOutline = null;
    }

    // Only initialize on file view pages
    if (!this.isFileViewPage()) return;

    this.symbolOutline = new SymbolOutline();
    this.symbolOutline.init();
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
    // Line number selection (like GitHub)
    const lineNumber = e.target.closest('.line-number');
    if (lineNumber) {
      e.preventDefault();
      e.stopPropagation();
      const lineNum = parseInt(lineNumber.textContent.trim(), 10);
      this.handleLineSelection(lineNum, e.shiftKey);
      return;
    }

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

  handleLineSelection(lineNum, shiftKey) {
    // If shift is held and we have a previous selection, select range
    if (shiftKey && this.lastSelectedLine) {
      const start = Math.min(this.lastSelectedLine, lineNum);
      const end = Math.max(this.lastSelectedLine, lineNum);
      this.highlightLines(start, end);
      this.updateUrlHash(start, end);
    } else {
      // Single line selection
      this.highlightLines(lineNum, lineNum);
      this.updateUrlHash(lineNum, lineNum);
      this.lastSelectedLine = lineNum;
    }
  }

  highlightLines(start, end) {
    // Clear all existing selections and highlight new range in one pass
    document.querySelectorAll('.line-container').forEach(el => {
      const lineNum = parseInt(el.dataset.line, 10);
      if (lineNum >= start && lineNum <= end) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  updateUrlHash(start, end) {
    const hash = start === end ? `L${start}` : `L${start}-L${end}`;
    // Use history API to update URL without scrolling - preserve path and query params
    const url = new URL(window.location);
    url.hash = hash;
    history.replaceState(null, null, url);
  }

  highlightLinesFromHash() {
    const hash = window.location.hash.slice(1); // Remove #
    if (!hash.startsWith('L')) return;

    const match = hash.match(/^L(\d+)(?:-L(\d+))?$/);
    if (!match) return;

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : start;

    this.highlightLines(start, end);
    this.lastSelectedLine = start;

    // Scroll to the first selected line
    const firstLine = document.querySelector(`.line-container[data-line="${start}"]`);
    if (firstLine) {
      firstLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  initializeContentSearch() {
    if (!this.contentSearch) {
      this.contentSearch = new ContentSearchHandler();
    }
    this.contentSearch.init();
  }

  /**
   * Cleanup components before navigation/re-initialization
   */
  cleanupComponents() {
    // Cleanup file viewer
    if (this.fileViewer && typeof this.fileViewer.destroy === 'function') {
      this.fileViewer.destroy();
      this.fileViewer = null;
    }

    // Cleanup inline search
    if (this.inlineSearch && typeof this.inlineSearch.destroy === 'function') {
      this.inlineSearch.destroy();
      this.inlineSearch = null;
    }

    // Focus mode persists across navigations, no cleanup needed
    // Content search persists across navigations, no cleanup needed
  }
}

const app = new Application();
app.init();
