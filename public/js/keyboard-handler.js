/**
 * Minimal keyboard shortcuts
 * - Escape: Close/clear search
 * - Ctrl/Cmd + K: Focus search
 */

export class KeyboardHandler {
  constructor(searchHandler) {
    this.searchHandler = searchHandler;
    this.setupListeners();
  }

  setupListeners() {
    document.addEventListener('keydown', e => this.handleGlobalKeydown(e));
  }

  handleGlobalKeydown(e) {
    const searchActive = this.searchHandler?.searchInput &&
                        document.activeElement === this.searchHandler.searchInput;

    // Escape: Clear and close search
    if (e.key === 'Escape' && searchActive && this.searchHandler.searchInput) {
      this.searchHandler.searchInput.blur();
      this.searchHandler.searchInput.value = '';
      this.searchHandler.hideResults();
      if (this.searchHandler.isFileViewContext) {
        this.searchHandler.clearTreeFilter();
      }
      return;
    }

    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (this.searchHandler) {
        this.searchHandler.focusSearch();
      }
      return;
    }
  }
}
