/**
 * Focus mode - hide distractions for better code reading
 * 
 * @class FocusMode
 */

// ============================================================================
// Constants
// ============================================================================

const PREFERENCES_KEY = 'gh-here-focus-preferences';

// ============================================================================
// FocusMode Class
// ============================================================================

export class FocusMode {
  constructor() {
    this.isActive = false;
    this.sidebarVisible = true;
    this.preferences = this.loadPreferences();
    this.eventHandlers = new Map();
  }

  // ========================================================================
  // Public API
  // ========================================================================

  /**
   * Initialize focus mode
   */
  init() {
    this.setupKeyboardShortcuts();
    this.restoreState();
  }

  /**
   * Cleanup: Remove event listeners
   */
  destroy() {
    this.removeEventListeners();
  }

  // ========================================================================
  // Toggle Operations
  // ========================================================================

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
    this.applySidebarState();
    this.savePreferences();
  }

  /**
   * Toggle full focus mode
   */
  toggleFullFocus() {
    this.isActive = !this.isActive;
    this.applyFocusState();
    this.savePreferences();
  }

  // ========================================================================
  // State Application
  // ========================================================================

  /**
   * Apply sidebar visibility state
   */
  applySidebarState() {
    const sidebar = this.getSidebar();
    const mainContent = this.getMainContent();
    
    if (!sidebar) return;

    if (this.sidebarVisible) {
      sidebar.classList.remove('hidden');
      if (mainContent) {
        mainContent.classList.remove('no-sidebar');
      }
    } else {
      sidebar.classList.add('hidden');
      if (mainContent) {
        mainContent.classList.add('no-sidebar');
      }
    }
  }

  /**
   * Apply focus mode state
   */
  applyFocusState() {
    const body = document.body;
    const mainContent = this.getMainContent();
    const header = document.querySelector('header');

    if (this.isActive) {
      this.enableFocusMode(body, mainContent, header);
    } else {
      this.disableFocusMode(body, mainContent, header);
    }

    // In full focus mode, also hide sidebar
    if (this.isActive) {
      this.hideSidebarForFocus();
    } else {
      this.applySidebarState();
    }
  }

  /**
   * Enable focus mode styling
   */
  enableFocusMode(body, mainContent, header) {
    body.classList.add('focus-mode');
    if (mainContent) {
      mainContent.classList.add('focus-mode');
    }
    if (header) {
      header.classList.add('focus-mode');
    }
  }

  /**
   * Disable focus mode styling
   */
  disableFocusMode(body, mainContent, header) {
    body.classList.remove('focus-mode');
    if (mainContent) {
      mainContent.classList.remove('focus-mode');
    }
    if (header) {
      header.classList.remove('focus-mode');
    }
  }

  /**
   * Hide sidebar when entering full focus mode
   */
  hideSidebarForFocus() {
    const sidebar = this.getSidebar();
    const mainContent = this.getMainContent();
    
    if (sidebar) {
      sidebar.classList.add('hidden');
    }
    if (mainContent) {
      mainContent.classList.add('no-sidebar');
    }
  }

  /**
   * Restore state from preferences
   */
  restoreState() {
    if (this.preferences.sidebarVisible !== undefined) {
      this.sidebarVisible = Boolean(this.preferences.sidebarVisible);
      this.applySidebarState();
    }

    if (this.preferences.fullFocus !== undefined) {
      this.isActive = Boolean(this.preferences.fullFocus);
      this.applyFocusState();
    }
  }

  // ========================================================================
  // Event Handling
  // ========================================================================

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    const keyHandler = (e) => this.handleKeydown(e);
    document.addEventListener('keydown', keyHandler);
    this.eventHandlers.set('keydown', keyHandler);
  }

  /**
   * Handle keyboard events
   */
  handleKeydown(e) {
    // Don't interfere if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Cmd/Ctrl+B: Toggle sidebar
    if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !e.shiftKey) {
      e.preventDefault();
      this.toggleSidebar();
      return;
    }

    // F11: Toggle full focus mode
    if (e.key === 'F11') {
      e.preventDefault();
      this.toggleFullFocus();
      return;
    }
  }

  /**
   * Remove all event listeners
   */
  removeEventListeners() {
    this.eventHandlers.forEach((handler, event) => {
      document.removeEventListener(event, handler);
    });
    this.eventHandlers.clear();
  }

  // ========================================================================
  // Preferences Management
  // ========================================================================

  /**
   * Load preferences from localStorage
   */
  loadPreferences() {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (!stored) return {};
      
      const parsed = JSON.parse(stored);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (error) {
      console.warn('Failed to load focus preferences:', error);
      return {};
    }
  }

  /**
   * Save preferences to localStorage
   */
  savePreferences() {
    try {
      const prefs = {
        sidebarVisible: this.sidebarVisible,
        fullFocus: this.isActive
      };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (error) {
      this.handleStorageError(error);
    }
  }

  /**
   * Handle storage errors gracefully
   */
  handleStorageError(error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('Focus preferences storage quota exceeded');
    } else {
      console.error('Failed to save focus preferences:', error);
    }
  }

  // ========================================================================
  // Utilities
  // ========================================================================

  /**
   * Get sidebar element
   */
  getSidebar() {
    return document.querySelector('.file-tree-sidebar');
  }

  /**
   * Get main content wrapper element
   */
  getMainContent() {
    return document.querySelector('.main-content-wrapper');
  }
}
