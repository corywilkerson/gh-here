/**
 * Symbol Outline - Code structure navigation panel
 * Shows functions, classes, and other symbols in the current file
 * @module symbol-outline
 */

import { escapeHtml, PathUtils } from './utils.js';

// ============================================================================
// Constants (alpha-sorted by key)
// ============================================================================

const SYMBOL_ICONS = {
  class: 'C',
  constant: 'K',
  export: 'E',
  function: 'f',
  import: 'i',
  interface: 'I',
  keyframes: '@',
  media: '@',
  method: 'm',
  mixin: '@',
  selector: '#',
  type: 'T',
  variable: 'v'
};

const SYMBOL_LABELS = {
  class: 'Classes',
  constant: 'Constants',
  function: 'Functions',
  interface: 'Interfaces',
  keyframes: 'Keyframes',
  media: 'Media Queries',
  method: 'Methods',
  mixin: 'Mixins',
  selector: 'Selectors',
  type: 'Types',
  variable: 'Variables'
};

export class SymbolOutline {
  constructor() {
    this.panel = null;
    this.button = null;
    this.isOpen = false;
    this.symbols = [];
    this.grouped = {};
    this.currentPath = null;
    this.selectedIndex = -1;
    this.abortController = null;
  }

  /**
   * Initialize the symbol outline
   */
  init() {
    this.currentPath = PathUtils.getCurrentPath();
    
    // Only initialize on file view pages (not directories)
    if (!this.isFileViewPage()) {
      return;
    }

    this.createButton();
    this.createPanel();
    this.setupKeyboardShortcuts();
    this.loadSymbols();
  }

  /**
   * Check if we're on a file view page
   */
  isFileViewPage() {
    const fileContent = document.querySelector('.file-content');
    const codeBlock = document.querySelector('.file-content pre code');
    return fileContent && codeBlock;
  }

  /**
   * Create the toggle button in the file header
   */
  createButton() {
    const fileHeaderActions = document.querySelector('.file-header-actions');
    if (!fileHeaderActions) return;

    // Check if button already exists
    if (document.querySelector('.symbol-outline-btn')) return;

    this.button = document.createElement('button');
    this.button.className = 'symbol-outline-btn file-action-btn';
    this.button.title = 'Symbol outline (Cmd+Shift+O)';
    this.button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75zm0 5a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1-.75-.75z"/>
      </svg>
    `;
    
    this.button.addEventListener('click', () => this.toggle());
    
    // Insert at the beginning of actions
    fileHeaderActions.insertBefore(this.button, fileHeaderActions.firstChild);
  }

  /**
   * Create the dropdown panel
   */
  createPanel() {
    // Remove existing panel if any
    const existing = document.querySelector('.symbol-outline-panel');
    if (existing) existing.remove();

    this.panel = document.createElement('div');
    this.panel.className = 'symbol-outline-panel';
    this.panel.innerHTML = `
      <div class="symbol-outline-header">
        <span class="symbol-outline-title">Outline</span>
        <span class="symbol-outline-count"></span>
      </div>
      <div class="symbol-outline-search">
        <input type="text" placeholder="Filter symbols..." class="symbol-search-input">
      </div>
      <div class="symbol-outline-content">
        <div class="symbol-outline-loading">Loading symbols...</div>
      </div>
    `;

    // Append to body to avoid z-index issues with Monaco editor
    document.body.appendChild(this.panel);

    // Setup search filtering
    const searchInput = this.panel.querySelector('.symbol-search-input');
    searchInput.addEventListener('input', (e) => this.filterSymbols(e.target.value));
    searchInput.addEventListener('keydown', (e) => this.handleSearchKeydown(e));

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.panel.contains(e.target) && !this.button.contains(e.target)) {
        this.close();
      }
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd+Shift+O to toggle outline
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        this.toggle();
      }
      
      // Escape to close
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
      }
    });
  }

  /**
   * Toggle panel open/closed
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open the panel
   */
  open() {
    if (!this.panel) return;
    
    this.isOpen = true;
    this.panel.classList.add('open');
    this.button?.classList.add('active');
    
    // Position panel relative to button
    this.positionPanel();
    
    // Focus search input
    setTimeout(() => {
      const searchInput = this.panel.querySelector('.symbol-search-input');
      searchInput?.focus();
    }, 50);
  }

  /**
   * Position the panel relative to the button
   */
  positionPanel() {
    if (!this.button || !this.panel) return;
    
    const buttonRect = this.button.getBoundingClientRect();
    const panelWidth = 300;
    
    // Position below the button, aligned to the right
    let left = buttonRect.right - panelWidth;
    let top = buttonRect.bottom + 8;
    
    // Make sure it doesn't go off the left edge
    if (left < 8) left = 8;
    
    // Make sure it doesn't go off the right edge
    if (left + panelWidth > window.innerWidth - 8) {
      left = window.innerWidth - panelWidth - 8;
    }
    
    this.panel.style.left = `${left}px`;
    this.panel.style.top = `${top}px`;
  }

  /**
   * Close the panel
   */
  close() {
    if (!this.panel) return;
    
    this.isOpen = false;
    this.panel.classList.remove('open');
    this.button?.classList.remove('active');
    this.selectedIndex = -1;
    
    // Clear search
    const searchInput = this.panel.querySelector('.symbol-search-input');
    if (searchInput) searchInput.value = '';
    this.filterSymbols('');
  }

  /**
   * Load symbols from API
   */
  async loadSymbols() {
    if (!this.currentPath) return;

    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    try {
      const response = await fetch(`/api/symbols?path=${encodeURIComponent(this.currentPath)}`, {
        signal: this.abortController.signal
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.symbols = data.symbols || [];
        this.grouped = data.grouped || {};
        this.renderSymbols();
        this.updateCount();
      } else {
        this.showError('Could not parse symbols');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.showError('Failed to load symbols');
      }
    }
  }

  /**
   * Render symbols in the panel
   */
  renderSymbols() {
    const content = this.panel.querySelector('.symbol-outline-content');
    
    if (this.symbols.length === 0) {
      content.innerHTML = '<div class="symbol-outline-empty">No symbols found</div>';
      return;
    }

    let html = '';
    
    // Render grouped symbols
    const kindOrder = ['class', 'interface', 'type', 'function', 'method', 'constant', 'variable', 'selector', 'keyframes', 'media', 'mixin'];
    
    for (const kind of kindOrder) {
      const symbols = this.grouped[kind];
      if (!symbols || symbols.length === 0) continue;
      
      html += `
        <div class="symbol-group" data-kind="${kind}">
          <div class="symbol-group-header">
            <span class="symbol-group-label">${SYMBOL_LABELS[kind] || kind}</span>
            <span class="symbol-group-count">${symbols.length}</span>
          </div>
          <div class="symbol-group-items">
            ${symbols.map((s, i) => this.renderSymbolItem(s, i)).join('')}
          </div>
        </div>
      `;
    }

    content.innerHTML = html;

    // Add click handlers
    content.querySelectorAll('.symbol-item').forEach(item => {
      item.addEventListener('click', () => {
        const line = parseInt(item.dataset.line, 10);
        this.navigateToLine(line);
      });
    });
  }

  /**
   * Render a single symbol item
   */
  renderSymbolItem(symbol, index) {
    const icon = SYMBOL_ICONS[symbol.kind] || '?';
    return `
      <div class="symbol-item" data-line="${symbol.line}" data-index="${index}" data-name="${symbol.name.toLowerCase()}">
        <span class="symbol-icon symbol-icon-${symbol.kind}">${icon}</span>
        <span class="symbol-name">${escapeHtml(symbol.name)}</span>
        <span class="symbol-line">:${symbol.line}</span>
      </div>
    `;
  }

  /**
   * Update symbol count in header
   */
  updateCount() {
    const countEl = this.panel.querySelector('.symbol-outline-count');
    if (countEl) {
      countEl.textContent = this.symbols.length > 0 ? `(${this.symbols.length})` : '';
    }
    
    // Update button to show count badge if symbols exist
    if (this.button && this.symbols.length > 0) {
      this.button.title = `Symbol outline (${this.symbols.length} symbols) - Cmd+Shift+O`;
    }
  }

  /**
   * Filter symbols by search query
   */
  filterSymbols(query) {
    const items = this.panel.querySelectorAll('.symbol-item');
    const groups = this.panel.querySelectorAll('.symbol-group');
    const lowerQuery = query.toLowerCase();
    
    items.forEach(item => {
      const name = item.dataset.name || '';
      const matches = !query || name.includes(lowerQuery);
      item.style.display = matches ? '' : 'none';
    });
    
    // Hide empty groups
    groups.forEach(group => {
      const visibleItems = group.querySelectorAll('.symbol-item[style=""], .symbol-item:not([style])');
      const hasVisible = Array.from(group.querySelectorAll('.symbol-item')).some(item => item.style.display !== 'none');
      group.style.display = hasVisible ? '' : 'none';
    });
    
    this.selectedIndex = -1;
  }

  /**
   * Handle keyboard navigation in search
   */
  handleSearchKeydown(e) {
    const visibleItems = Array.from(this.panel.querySelectorAll('.symbol-item'))
      .filter(item => item.style.display !== 'none');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, visibleItems.length - 1);
      this.highlightSelected(visibleItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      this.highlightSelected(visibleItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.selectedIndex >= 0 && visibleItems[this.selectedIndex]) {
        const line = parseInt(visibleItems[this.selectedIndex].dataset.line, 10);
        this.navigateToLine(line);
      }
    }
  }

  /**
   * Highlight selected item
   */
  highlightSelected(items) {
    items.forEach((item, i) => {
      item.classList.toggle('selected', i === this.selectedIndex);
    });
    
    // Scroll selected into view
    if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
      items[this.selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Navigate to a specific line
   */
  navigateToLine(line) {
    // Close panel
    this.close();
    
    // Find the line element
    const lineElement = document.querySelector(`#L${line}`) || 
                        document.querySelector(`[data-line="${line}"]`) ||
                        document.querySelector(`.line-container[data-line="${line}"]`);
    
    if (lineElement) {
      // Scroll to line
      lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight the line briefly
      const container = lineElement.closest('.line-container') || lineElement.parentElement;
      if (container) {
        container.classList.add('line-highlight-flash');
        setTimeout(() => {
          container.classList.remove('line-highlight-flash');
        }, 2000);
      }
      
      // Update URL hash
      window.history.replaceState(null, '', `#L${line}`);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const content = this.panel.querySelector('.symbol-outline-content');
    content.innerHTML = `<div class="symbol-outline-error">${escapeHtml(message)}</div>`;
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.panel?.remove();
    this.button?.remove();
  }
}
