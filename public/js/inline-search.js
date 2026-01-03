/**
 * In-file search functionality
 * Search within the current file with match highlighting
 * 
 * @class InlineSearch
 */

import { escapeHtml } from './utils.js';

// ============================================================================
// Constants (alpha-sorted)
// ============================================================================

const CODE_BLOCK_SELECTOR = '.file-content pre code.hljs.with-line-numbers';
const DEBOUNCE_DELAY = 200;
const SEARCH_OVERLAY_CLASS = 'inline-search-overlay';

// ============================================================================
// InlineSearch Class
// ============================================================================

export class InlineSearch {
  constructor() {
    this.isActive = false;
    this.searchOverlay = null;
    this.searchInput = null;
    this.currentMatchIndex = -1;
    this.matches = [];
    this.caseSensitive = false;
    this.regexMode = false;
    this.originalContent = new Map();
    this.eventHandlers = new Map();
    this.debounceTimer = null;
  }

  // ========================================================================
  // Public API
  // ========================================================================

  /**
   * Initialize inline search
   */
  init() {
    if (!this.isFileViewPage()) return;
    
    // Skip if Monaco viewer is active (Monaco has built-in search)
    if (document.querySelector('.monaco-file-viewer')) {
      return;
    }

    this.storeOriginalContent();
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
   * Hide search overlay and restore original content
   */
  hide() {
    if (!this.isActive) return;

    this.clearHighlights();
    this.cleanupDebounce();
    this.removeSearchOverlay();
    this.resetState();
  }

  /**
   * Cleanup: Remove event listeners and restore content
   */
  destroy() {
    this.hide();
    this.removeEventListeners();
    this.originalContent.clear();
    this.matches = [];
  }

  // ========================================================================
  // Search Operations
  // ========================================================================

  /**
   * Perform search and highlight matches
   */
  performSearch() {
    if (!this.searchInput) return;

    const query = this.searchInput.value.trim();
    
    if (!query) {
      this.clearHighlights();
      this.updateMatchCount(0);
      return;
    }

    this.clearHighlights();
    this.resetMatches();

    const codeBlock = this.findCodeBlock();
    if (!codeBlock) return;

    const pattern = this.createSearchPattern(query);
    if (!pattern) return;

    this.findMatches(codeBlock, pattern);
    this.displayMatches();
  }

  /**
   * Create search pattern from query
   */
  createSearchPattern(query) {
    try {
      if (this.regexMode) {
        return new RegExp(query, this.caseSensitive ? 'g' : 'gi');
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(escaped, this.caseSensitive ? 'g' : 'gi');
      }
    } catch (error) {
      this.updateMatchCount(0, 'Invalid regular expression');
      return null;
    }
  }

  /**
   * Find all matches in code block
   */
  findMatches(codeBlock, pattern) {
    const lines = codeBlock.querySelectorAll('.line-container');

    lines.forEach((line, lineIndex) => {
      const lineContent = line.querySelector('.line-content');
      if (!lineContent) return;

      const text = lineContent.textContent;
      const lineMatches = this.findLineMatches(text, pattern, lineIndex + 1, line, lineContent);
      this.matches.push(...lineMatches);
    });
  }

  /**
   * Find matches in a single line
   */
  findLineMatches(text, pattern, lineNum, lineElement, contentElement) {
    const matches = [];
    
    try {
      const patternMatches = [...text.matchAll(pattern)];
      
      patternMatches.forEach(match => {
        if (match.index !== undefined && match[0]) {
          matches.push({
            line: lineNum,
            lineElement,
            contentElement,
            index: match.index,
            length: match[0].length
          });
        }
      });
    } catch (error) {
      // Handle regex errors gracefully
    }

    return matches;
  }

  /**
   * Display matches with highlighting
   */
  displayMatches() {
    if (this.matches.length > 0) {
      this.highlightMatches();
      this.currentMatchIndex = 0;
      this.scrollToMatch(0);
      this.updateMatchCount(this.matches.length, null, 1);
    } else {
      this.updateMatchCount(0);
    }
  }

  /**
   * Highlight all matches in the code
   */
  highlightMatches() {
    const matchesByLine = this.groupMatchesByLine();

    matchesByLine.forEach((lineMatches, lineNum) => {
      const match = this.matches.find(m => m.line === lineNum);
      if (!match?.contentElement) return;

      const highlighted = this.buildHighlightedHTML(match.contentElement.textContent, lineMatches);
      match.contentElement.innerHTML = highlighted;
    });
  }

  /**
   * Group matches by line number
   */
  groupMatchesByLine() {
    const matchesByLine = new Map();
    
    this.matches.forEach((match, index) => {
      if (!matchesByLine.has(match.line)) {
        matchesByLine.set(match.line, []);
      }
      matchesByLine.get(match.line).push({ ...match, globalIndex: index });
    });

    return matchesByLine;
  }

  /**
   * Build highlighted HTML for a line
   */
  buildHighlightedHTML(text, lineMatches) {
    let highlighted = '';
    let lastIndex = 0;
    
    const sortedMatches = lineMatches.sort((a, b) => a.index - b.index);
    
    sortedMatches.forEach((m) => {
      highlighted += escapeHtml(text.substring(lastIndex, m.index));
      
      const isActive = m.globalIndex === this.currentMatchIndex;
      const matchText = text.substring(m.index, m.index + m.length);
      highlighted += `<mark class="inline-search-match ${isActive ? 'active' : ''}" data-match-index="${m.globalIndex}">${escapeHtml(matchText)}</mark>`;
      
      lastIndex = m.index + m.length;
    });
    
    highlighted += escapeHtml(text.substring(lastIndex));
    return highlighted;
  }

  /**
   * Clear highlights and restore original content
   */
  clearHighlights() {
    const codeBlock = this.findCodeBlock();
    if (!codeBlock) return;

    const lines = codeBlock.querySelectorAll('.line-container');
    lines.forEach((line, index) => {
      const lineContent = line.querySelector('.line-content');
      if (!lineContent) return;

      const original = this.originalContent.get(index + 1);
      if (original !== undefined) {
        lineContent.innerHTML = original;
      } else {
        lineContent.textContent = lineContent.textContent;
      }
    });
  }

  // ========================================================================
  // Navigation
  // ========================================================================

  /**
   * Navigate to next match
   */
  nextMatch() {
    if (this.matches.length === 0) return;

    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matches.length;
    this.navigateToMatch(this.currentMatchIndex);
  }

  /**
   * Navigate to previous match
   */
  previousMatch() {
    if (this.matches.length === 0) return;

    this.currentMatchIndex = this.currentMatchIndex <= 0 
      ? this.matches.length - 1 
      : this.currentMatchIndex - 1;
    this.navigateToMatch(this.currentMatchIndex);
  }

  /**
   * Navigate to a specific match
   */
  navigateToMatch(index) {
    this.scrollToMatch(index);
    this.updateActiveMatch();
    this.updateMatchCount(this.matches.length, null, index + 1);
  }

  /**
   * Scroll to a specific match
   */
  scrollToMatch(index) {
    if (index < 0 || index >= this.matches.length) return;

    const match = this.matches[index];
    if (match?.lineElement) {
      match.lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Update active match highlighting
   */
  updateActiveMatch() {
    document.querySelectorAll('.inline-search-match').forEach(m => {
      m.classList.remove('active');
    });

    const activeMatch = document.querySelector(
      `.inline-search-match[data-match-index="${this.currentMatchIndex}"]`
    );
    if (activeMatch) {
      activeMatch.classList.add('active');
      this.highlightMatches(); // Re-highlight to update active state
    }
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
    this.searchOverlay.setAttribute('aria-label', 'Search in file');
    this.searchOverlay.innerHTML = this.getSearchOverlayHTML();

    this.attachSearchOverlayHandlers();
  }

  /**
   * Get search overlay HTML template
   */
  getSearchOverlayHTML() {
    return `
      <div class="inline-search-container">
        <div class="inline-search-input-wrapper">
          <input 
            type="text" 
            class="inline-search-input" 
            placeholder="Search in file..."
            autocomplete="off"
            aria-label="Search query"
          />
          <div class="inline-search-options">
            <button class="inline-search-option" data-option="case" title="Case sensitive" aria-pressed="false">
              <span class="option-label">Aa</span>
            </button>
            <button class="inline-search-option" data-option="regex" title="Use regular expression" aria-pressed="false">
              <span class="option-label">.*</span>
            </button>
          </div>
        </div>
        <div class="inline-search-info">
          <span class="inline-search-count">No matches</span>
          <button class="inline-search-close" aria-label="Close search">×</button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event handlers to search overlay elements
   */
  attachSearchOverlayHandlers() {
    this.searchInput = this.searchOverlay.querySelector('.inline-search-input');
    const closeBtn = this.searchOverlay.querySelector('.inline-search-close');
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

  /**
   * Update match count display
   */
  updateMatchCount(total, error = null, current = null) {
    const countEl = this.searchOverlay?.querySelector('.inline-search-count');
    if (!countEl) return;

    if (error) {
      countEl.textContent = error;
      countEl.classList.add('error');
    } else if (total === 0) {
      countEl.textContent = 'No matches';
      countEl.classList.remove('error');
    } else if (current !== null) {
      countEl.textContent = `${current} of ${total}`;
      countEl.classList.remove('error');
    } else {
      countEl.textContent = `${total} match${total !== 1 ? 'es' : ''}`;
      countEl.classList.remove('error');
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
    // Allow Cmd/Ctrl+F in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        this.show();
      }
      return;
    }

    // Cmd/Ctrl+F: Show search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
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

    // Cmd/Ctrl+G: Next match
    if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
      e.preventDefault();
      this.nextMatch();
      return;
    }

    // Cmd/Ctrl+Shift+G: Previous match
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
      e.preventDefault();
      this.previousMatch();
      return;
    }

    // Enter: Next match
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.nextMatch();
      return;
    }

    // Shift+Enter: Previous match
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      this.previousMatch();
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
   * Store original line content for restoration
   */
  storeOriginalContent() {
    const codeBlock = this.findCodeBlock();
    if (!codeBlock) return;

    const lines = codeBlock.querySelectorAll('.line-container');
    lines.forEach((line, index) => {
      const lineContent = line.querySelector('.line-content');
      if (lineContent) {
        this.originalContent.set(index + 1, lineContent.innerHTML);
      }
    });
  }

  /**
   * Reset search state
   */
  resetState() {
    this.isActive = false;
    this.matches = [];
    this.currentMatchIndex = -1;
    this.searchInput = null;
  }

  /**
   * Reset matches array
   */
  resetMatches() {
    this.matches = [];
    this.currentMatchIndex = -1;
  }

  // ========================================================================
  // Utilities
  // ========================================================================

  /**
   * Check if current page is a file view page
   */
  isFileViewPage() {
    const fileContent = document.querySelector('.file-content');
    return fileContent?.querySelector(CODE_BLOCK_SELECTOR) !== null;
  }

  /**
   * Find the code block element
   */
  findCodeBlock() {
    return document.querySelector(CODE_BLOCK_SELECTOR);
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
   * Cleanup debounce timer
   */
  cleanupDebounce() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
