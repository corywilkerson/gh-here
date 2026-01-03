/**
 * Full-text content search handler
 * Search across entire codebase
 * 
 * @class ContentSearchHandler
 */

import { escapeHtml } from './utils.js';

// ============================================================================
// Constants (alpha-sorted)
// ============================================================================

const API_ENDPOINT = '/api/search-content';
const DEBOUNCE_DELAY = 300;
const MAX_RESULTS = 100;
const SEARCH_OVERLAY_CLASS = 'content-search-overlay';

// ============================================================================
// ContentSearchHandler Class
// ============================================================================

export class ContentSearchHandler {
  constructor() {
    this.isActive = false;
    this.searchOverlay = null;
    this.searchInput = null;
    this.results = [];
    this.currentQuery = '';
    this.regexMode = false;
    this.caseSensitive = false;
    this.debounceTimer = null;
    this.abortController = null;
    this.eventHandlers = new Map();
  }

  // ========================================================================
  // Public API
  // ========================================================================

  /**
   * Initialize content search
   */
  init() {
    this.setupKeyboardShortcuts();
  }

  /**
   * Show search overlay
   */
  show() {
    if (this.isActive) {
      this.focusSearchInput();
      return;
    }

    this.isActive = true;
    this.createSearchOverlay();
    document.body.appendChild(this.searchOverlay);
    this.focusSearchInput();
  }

  /**
   * Hide search overlay
   */
  hide() {
    if (!this.isActive) return;

    this.cancelSearch();
    this.cleanupDebounce();
    this.removeSearchOverlay();
    this.resetState();
  }

  /**
   * Cleanup: Remove event listeners and cancel requests
   */
  destroy() {
    this.hide();
    this.removeEventListeners();
    this.results = [];
  }

  // ========================================================================
  // Search Operations
  // ========================================================================

  /**
   * Perform search with debouncing and cancellation
   */
  async performSearch() {
    if (!this.searchInput) return;

    const query = this.searchInput.value.trim();
    this.currentQuery = query;
    
    const statusEl = this.getStatusElement();
    const resultsContainer = this.getResultsContainer();
    
    if (!query) {
      this.clearResults(statusEl, resultsContainer);
      return;
    }

    this.cancelSearch();
    this.abortController = new AbortController();
    this.updateStatus(statusEl, 'Searching...');

    try {
      const data = await this.fetchSearchResults(query);
      
      // Check if query changed during async operation
      if (this.currentQuery !== query) return;

      this.results = data.results || [];
      this.displayResults(data);
    } catch (error) {
      if (error.name === 'AbortError') return;
      this.handleSearchError(error, statusEl, resultsContainer);
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Fetch search results from API
   */
  async fetchSearchResults(query) {
    const params = new URLSearchParams({
      q: query,
      regex: String(this.regexMode),
      caseSensitive: String(this.caseSensitive),
      maxResults: String(MAX_RESULTS)
    });

    const response = await fetch(`${API_ENDPOINT}?${params.toString()}`, {
      signal: this.abortController.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Search failed');
    }

    return data;
  }

  /**
   * Display search results
   */
  displayResults(data) {
    const statusEl = this.getStatusElement();
    const resultsContainer = this.getResultsContainer();
    
    if (!statusEl || !resultsContainer) return;

    statusEl.classList.remove('error');

    if (data.total === 0) {
      statusEl.textContent = 'No results found';
      resultsContainer.innerHTML = '';
      return;
    }

    this.updateStatusWithCounts(statusEl, data);
    this.renderResults(resultsContainer, data.results);
  }

  /**
   * Render search results HTML
   */
  renderResults(container, results) {
    const resultsHtml = results.map(result => this.renderResultItem(result)).join('');
    container.innerHTML = resultsHtml;
    this.attachResultClickHandlers(container);
  }

  /**
   * Render a single result item
   */
  renderResultItem(result) {
    const matchesHtml = result.matches.slice(0, 5).map(match => 
      this.renderMatchLine(match)
    ).join('');

    const moreMatches = result.matchCount > 5 
      ? `<div class="content-search-more">+${result.matchCount - 5} more matches</div>`
      : '';

    const escapedPath = escapeHtml(result.path);

    return `
      <div class="content-search-result" data-path="${escapedPath}">
        <div class="content-search-result-header">
          <span class="result-path">${escapedPath}</span>
          <span class="result-count">${result.matchCount} match${result.matchCount !== 1 ? 'es' : ''}</span>
        </div>
        <div class="content-search-matches">
          ${matchesHtml}
          ${moreMatches}
        </div>
      </div>
    `;
  }

  /**
   * Render a single match line
   */
  renderMatchLine(match) {
    const highlighted = this.highlightMatch(match.text, match.match);
    return `
      <div class="content-search-match">
        <span class="match-line-number">${match.line}</span>
        <span class="match-content">${highlighted}</span>
      </div>
    `;
  }

  /**
   * Attach click handlers to result items
   */
  attachResultClickHandlers(container) {
    container.querySelectorAll('.content-search-result').forEach(resultEl => {
      const clickHandler = () => {
        const path = resultEl.getAttribute('data-path');
        if (path) {
          window.location.href = `/?path=${encodeURIComponent(path)}`;
        }
      };
      resultEl.addEventListener('click', clickHandler);
      resultEl._clickHandler = clickHandler;
    });
  }

  /**
   * Highlight match in text
   */
  highlightMatch(text, match) {
    if (!match || !text) return escapeHtml(text);
    
    const escapedText = escapeHtml(text);
    const escapedMatch = escapeHtml(match);
    const escapedPattern = escapedMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedPattern, 'gi');
    
    return escapedText.replace(regex, `<mark class="content-search-highlight">$&</mark>`);
  }

  // ========================================================================
  // UI Management
  // ========================================================================

  /**
   * Create search overlay UI
   */
  createSearchOverlay() {
    this.searchOverlay = document.createElement('div');
    this.searchOverlay.className = SEARCH_OVERLAY_CLASS;
    this.searchOverlay.setAttribute('role', 'dialog');
    this.searchOverlay.setAttribute('aria-label', 'Search in files');
    this.searchOverlay.innerHTML = this.getSearchOverlayHTML();

    this.attachSearchOverlayHandlers();
  }

  /**
   * Get search overlay HTML template
   */
  getSearchOverlayHTML() {
    return `
      <div class="content-search-container">
        <div class="content-search-header">
          <h3>Search in files</h3>
          <button class="content-search-close" aria-label="Close search">×</button>
        </div>
        <div class="content-search-input-wrapper">
          <input 
            type="text" 
            class="content-search-input" 
            placeholder="Search for text in files..."
            autocomplete="off"
            aria-label="Search query"
          />
          <div class="content-search-options">
            <button class="content-search-option" data-option="case" title="Case sensitive" aria-pressed="false">
              <span class="option-label">Aa</span>
            </button>
            <button class="content-search-option" data-option="regex" title="Use regular expression" aria-pressed="false">
              <span class="option-label">.*</span>
            </button>
          </div>
        </div>
        <div class="content-search-info">
          <span class="content-search-status">Ready to search</span>
        </div>
        <div class="content-search-results"></div>
      </div>
    `;
  }

  /**
   * Attach event handlers to search overlay elements
   */
  attachSearchOverlayHandlers() {
    this.searchInput = this.searchOverlay.querySelector('.content-search-input');
    const closeBtn = this.searchOverlay.querySelector('.content-search-close');
    const caseBtn = this.searchOverlay.querySelector('[data-option="case"]');
    const regexBtn = this.searchOverlay.querySelector('[data-option="regex"]');

    this.attachCloseHandler(closeBtn);
    this.attachCaseHandler(caseBtn);
    this.attachRegexHandler(regexBtn);
    this.attachInputHandler(this.searchInput);
    this.updateButtonStates(caseBtn, regexBtn);
  }

  /**
   * Attach close button handler
   */
  attachCloseHandler(closeBtn) {
    const handler = () => this.hide();
    closeBtn.addEventListener('click', handler);
    this.eventHandlers.set('close', handler);
  }

  /**
   * Attach case sensitive toggle handler
   */
  attachCaseHandler(caseBtn) {
    const handler = () => {
      this.caseSensitive = !this.caseSensitive;
      caseBtn.classList.toggle('active', this.caseSensitive);
      caseBtn.setAttribute('aria-pressed', String(this.caseSensitive));
      this.performSearch();
    };
    caseBtn.addEventListener('click', handler);
    this.eventHandlers.set('case', handler);
  }

  /**
   * Attach regex toggle handler
   */
  attachRegexHandler(regexBtn) {
    const handler = () => {
      this.regexMode = !this.regexMode;
      regexBtn.classList.toggle('active', this.regexMode);
      regexBtn.setAttribute('aria-pressed', String(this.regexMode));
      this.performSearch();
    };
    regexBtn.addEventListener('click', handler);
    this.eventHandlers.set('regex', handler);
  }

  /**
   * Attach input handler with debounce
   */
  attachInputHandler(input) {
    const handler = () => {
      this.cleanupDebounce();
      this.debounceTimer = setTimeout(() => {
        this.performSearch();
      }, DEBOUNCE_DELAY);
    };
    input.addEventListener('input', handler);
    this.eventHandlers.set('input', handler);
  }

  /**
   * Update button states to reflect current settings
   */
  updateButtonStates(caseBtn, regexBtn) {
    if (this.caseSensitive) {
      caseBtn.classList.add('active');
      caseBtn.setAttribute('aria-pressed', 'true');
    }
    if (this.regexMode) {
      regexBtn.classList.add('active');
      regexBtn.setAttribute('aria-pressed', 'true');
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

    // Cmd/Ctrl+Shift+F: Show content search
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      this.show();
      return;
    }

    // Only handle other shortcuts when search is active
    if (!this.isActive) return;

    // Escape: Close search
    if (e.key === 'Escape') {
      e.preventDefault();
      this.hide();
      return;
    }
  }

  /**
   * Remove all event listeners
   */
  removeEventListeners() {
    this.eventHandlers.forEach((handler, event) => {
      if (event === 'keydown') {
        document.removeEventListener(event, handler);
      }
    });
    this.eventHandlers.clear();
  }

  // ========================================================================
  // State Management
  // ========================================================================

  /**
   * Reset search state
   */
  resetState() {
    this.isActive = false;
    this.results = [];
    this.currentQuery = '';
    this.searchInput = null;
  }

  /**
   * Clear search results
   */
  clearResults(statusEl, resultsContainer) {
    if (statusEl) statusEl.textContent = 'Ready to search';
    if (resultsContainer) resultsContainer.innerHTML = '';
    this.results = [];
  }

  /**
   * Handle search errors
   */
  handleSearchError(error, statusEl, resultsContainer) {
    if (statusEl) {
      statusEl.textContent = `Error: ${error.message}`;
      statusEl.classList.add('error');
    }
    if (resultsContainer) resultsContainer.innerHTML = '';
    this.results = [];
  }

  // ========================================================================
  // Utilities
  // ========================================================================

  /**
   * Get status element from overlay
   */
  getStatusElement() {
    return this.searchOverlay?.querySelector('.content-search-status');
  }

  /**
   * Get results container from overlay
   */
  getResultsContainer() {
    return this.searchOverlay?.querySelector('.content-search-results');
  }

  /**
   * Update status text
   */
  updateStatus(statusEl, text) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.remove('error');
  }

  /**
   * Update status with result counts
   */
  updateStatusWithCounts(statusEl, data) {
    const fileCount = data.results.length;
    const resultCount = data.total;
    statusEl.textContent = `Found ${resultCount} result${resultCount !== 1 ? 's' : ''} in ${fileCount} file${fileCount !== 1 ? 's' : ''}`;
  }

  /**
   * Focus search input
   */
  focusSearchInput() {
    if (!this.searchInput) return;
    
    requestAnimationFrame(() => {
      this.searchInput.focus();
      this.searchInput.select();
    });
  }

  /**
   * Remove search overlay from DOM
   */
  removeSearchOverlay() {
    if (this.searchOverlay) {
      this.searchOverlay.remove();
      this.searchOverlay = null;
    }
  }

  /**
   * Cancel in-flight search request
   */
  cancelSearch() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Cleanup debounce timer
   */
  cleanupDebounce() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
