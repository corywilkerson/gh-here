/**
 * Context-aware file search
 * - Directory pages: Global repository search
 * - File view pages: Filter sidebar tree
 */

export class SearchHandler {
  constructor() {
    this.fileTree = document.getElementById('file-tree');
    this.fileTable = document.getElementById('file-table');
    this.debounceTimer = null;
    this.searchOverlay = null;
    this.treeItems = [];

    // Determine context based on page elements
    this.isFileViewContext = !!this.fileTree && !this.fileTable;

    // Use correct search input for context
    const searchId = this.isFileViewContext ? 'file-search' : 'root-file-search';
    this.searchInput = document.getElementById(searchId);

    this.init();
  }

  init() {
    if (!this.searchInput) return;

    if (this.isFileViewContext) {
      this.updateTreeItems();
      document.addEventListener('filetree-loaded', () => this.updateTreeItems());
    }

    this.setupListeners();
  }

  setupListeners() {
    if (!this.searchInput) return;

    this.searchInput.addEventListener('input', () => this.handleSearchInput());

    if (!this.isFileViewContext) {
      // Global search: show results on focus
      this.searchInput.addEventListener('focus', () => this.handleSearchFocus());

      // Close results on click outside
      document.addEventListener('click', (e) => {
        if (this.searchOverlay &&
            !e.target.closest('.search-container') &&
            !e.target.closest('.search-results-overlay')) {
          this.hideResults();
        }
      });
    }
  }

  updateTreeItems() {
    if (this.fileTree) {
      this.treeItems = Array.from(this.fileTree.querySelectorAll('.tree-item'));
    }
  }

  handleSearchFocus() {
    if (this.isFileViewContext) return;

    const query = this.searchInput.value.trim();
    if (query) {
      this.performGlobalSearch(query);
    }
  }

  handleSearchInput() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    const query = this.searchInput.value.trim();

    if (!query) {
      if (this.isFileViewContext) {
        this.clearTreeFilter();
      } else {
        this.hideResults();
      }
      return;
    }

    this.debounceTimer = setTimeout(() => {
      if (this.isFileViewContext) {
        this.filterTree(query);
      } else {
        this.performGlobalSearch(query);
      }
    }, 200);
  }

  // File view context: Filter sidebar tree
  filterTree(query) {
    if (!this.fileTree || this.treeItems.length === 0) return;

    const queryLower = query.toLowerCase();
    const containers = this.fileTree.querySelectorAll('.tree-children');

    // Hide all items first
    this.treeItems.forEach(item => item.style.display = 'none');
    containers.forEach(container => container.style.display = 'none');

    // Show matching items and their parent folders
    this.treeItems.forEach(item => {
      const label = item.querySelector('.tree-label');
      const fileName = label?.textContent?.toLowerCase() || '';

      if (fileName.includes(queryLower)) {
        item.style.display = '';

        // Show all parent folders
        let parent = item.parentElement;
        while (parent && parent !== this.fileTree) {
          if (parent.classList.contains('tree-children')) {
            parent.style.display = '';
          }
          const parentItem = parent.previousElementSibling;
          if (parentItem?.classList.contains('tree-item')) {
            parentItem.style.display = '';
          }
          parent = parent.parentElement;
        }
      }
    });
  }

  clearTreeFilter() {
    if (!this.fileTree) return;

    this.treeItems.forEach(item => item.style.display = '');
    this.fileTree.querySelectorAll('.tree-children').forEach(container => {
      container.style.display = '';
    });
  }

  // Directory context: Global repository search
  async performGlobalSearch(query) {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        this.showResults(data.results, query);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  }

  showResults(results, query) {
    this.hideResults();

    this.searchOverlay = document.createElement('div');
    this.searchOverlay.className = 'search-results-overlay';

    if (results.length === 0) {
      this.searchOverlay.innerHTML = `
        <div class="search-results-container">
          <div class="search-results-header">
            <span class="search-results-count">No results for "${query}"</span>
          </div>
        </div>
      `;
    } else {
      const resultsList = results.map(result => {
        const icon = result.isDirectory
          ? '<svg class="result-icon" viewBox="0 0 16 16" width="16" height="16"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path></svg>'
          : '<svg class="result-icon file-icon" viewBox="0 0 16 16" width="16" height="16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path></svg>';

        return `
          <a href="/?path=${encodeURIComponent(result.path)}" class="search-result-item" data-path="${result.path}">
            ${icon}
            <div class="search-result-content">
              <div class="search-result-path">${this.highlightMatch(result.path, query)}</div>
            </div>
          </a>
        `;
      }).join('');

      this.searchOverlay.innerHTML = `
        <div class="search-results-container">
          <div class="search-results-header">
            <span class="search-results-count">${results.length} result${results.length === 1 ? '' : 's'}</span>
          </div>
          <div class="search-results-list">
            ${resultsList}
          </div>
        </div>
      `;
    }

    const searchContainer = this.searchInput.closest('.search-container');
    if (searchContainer) {
      searchContainer.appendChild(this.searchOverlay);
    }

    this.searchOverlay.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = item.getAttribute('href');
      });
    });
  }

  highlightMatch(text, query) {
    if (!query) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return `${before}<mark class="search-highlight">${match}</mark>${after}`;
  }

  hideResults() {
    if (this.searchOverlay) {
      this.searchOverlay.remove();
      this.searchOverlay = null;
    }
  }

  focusSearch() {
    if (this.searchInput) {
      this.searchInput.focus();
      this.searchInput.select();
    }
  }
}
