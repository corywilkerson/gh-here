/**
 * File search and navigation
 */

import { KEYBOARD_SHORTCUTS } from './constants.js';

export class SearchHandler {
  constructor() {
    this.searchInput = document.getElementById('file-search');
    this.fileTable = document.getElementById('file-table');
    this.fileRows = [];
    this.currentFocusIndex = -1;
    this.init();
  }

  init() {
    if (!this.searchInput || !this.fileTable) {
      return;
    }

    this.updateFileRows();
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
  }

  updateFileRows() {
    if (this.fileTable) {
      this.fileRows = Array.from(this.fileTable.querySelectorAll('.file-row'));
    }
  }

  filterFiles(query) {
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
