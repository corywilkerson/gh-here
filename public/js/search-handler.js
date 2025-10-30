/**
 * File search and navigation
 */

import { KEYBOARD_SHORTCUTS } from './constants.js';

export class SearchHandler {
  constructor() {
    this.searchInput = document.getElementById('file-search');
    this.fileTable = document.getElementById('file-table');
    this.fileTree = document.getElementById('file-tree');
    this.fileRows = [];
    this.treeItems = [];
    this.currentFocusIndex = -1;
    this.init();
  }

  init() {
    if (!this.searchInput) {
      return;
    }

    this.updateFileRows();
    this.updateTreeItems();
    this.setupListeners();
  }

  setupListeners() {
    this.searchInput.addEventListener('input', () => {
      const query = this.searchInput.value.toLowerCase().trim();
      this.filterFiles(query);
    });

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.focusSearch();
      }
    });

    // Listen for file tree loaded event
    document.addEventListener('filetree-loaded', () => {
      this.updateTreeItems();
    });
  }

  updateFileRows() {
    if (this.fileTable) {
      this.fileRows = Array.from(this.fileTable.querySelectorAll('.file-row'));
    }
  }

  updateTreeItems() {
    if (this.fileTree) {
      this.treeItems = Array.from(this.fileTree.querySelectorAll('.tree-item'));
    }
  }

  filterFiles(query) {
    // Filter file table if it exists
    if (this.fileTable && this.fileRows.length > 0) {
      if (!query) {
        this.fileRows.forEach(row => row.classList.remove('hidden'));
        return;
      }

      this.fileRows.forEach(row => {
        const fileName = row.dataset.name;
        const isVisible = fileName.includes(query);
        row.classList.toggle('hidden', !isVisible);
      });

      this.clearFocus();
      this.currentFocusIndex = -1;
    }

    // Filter file tree if it exists
    if (this.fileTree && this.treeItems.length > 0) {
      if (!query) {
        this.treeItems.forEach(item => item.style.display = '');
        // Show all parent containers too
        const containers = this.fileTree.querySelectorAll('.tree-children');
        containers.forEach(container => container.style.display = '');
        return;
      }

      // First hide everything
      this.treeItems.forEach(item => item.style.display = 'none');
      const containers = this.fileTree.querySelectorAll('.tree-children');
      containers.forEach(container => container.style.display = 'none');

      // Then show matching items and their parents
      this.treeItems.forEach(item => {
        const label = item.querySelector('.tree-label');
        const fileName = label ? label.textContent.toLowerCase() : '';
        const isVisible = fileName.includes(query);

        if (isVisible) {
          // Show this item
          item.style.display = '';

          // Show all parent folders and containers
          let parent = item.parentElement;
          while (parent && parent !== this.fileTree) {
            if (parent.classList.contains('tree-children')) {
              parent.style.display = '';
            }
            const parentItem = parent.previousElementSibling;
            if (parentItem && parentItem.classList.contains('tree-item')) {
              parentItem.style.display = '';
            }
            parent = parent.parentElement;
          }
        }
      });
    }
  }

  focusSearch() {
    if (this.searchInput) {
      this.searchInput.focus();
      this.searchInput.select();
    }
  }

  navigateDown() {
    const visibleRows = this.getVisibleRows();
    if (visibleRows.length === 0) {
      return;
    }

    this.currentFocusIndex++;
    if (this.currentFocusIndex >= visibleRows.length) {
      this.currentFocusIndex = 0;
    }
    this.updateFocus(visibleRows);
  }

  navigateUp() {
    const visibleRows = this.getVisibleRows();
    if (visibleRows.length === 0) {
      return;
    }

    this.currentFocusIndex--;
    if (this.currentFocusIndex < 0) {
      this.currentFocusIndex = visibleRows.length - 1;
    }
    this.updateFocus(visibleRows);
  }

  openFocused() {
    const visibleRows = this.getVisibleRows();
    if (this.currentFocusIndex >= 0 && visibleRows[this.currentFocusIndex]) {
      const link = visibleRows[this.currentFocusIndex].querySelector('a');
      if (link) {
        link.click();
      }
    }
  }

  getVisibleRows() {
    return this.fileRows.filter(row => !row.classList.contains('hidden'));
  }

  updateFocus(visibleRows) {
    this.clearFocus();
    if (this.currentFocusIndex >= 0 && visibleRows[this.currentFocusIndex]) {
      visibleRows[this.currentFocusIndex].classList.add('focused');
      visibleRows[this.currentFocusIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }

  clearFocus() {
    this.fileRows.forEach(row => row.classList.remove('focused'));
  }
}
