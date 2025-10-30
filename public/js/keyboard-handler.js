/**
 * Keyboard shortcuts and navigation
 */

import { KEYBOARD_SHORTCUTS } from './constants.js';
import { PathUtils } from './utils.js';

export class KeyboardHandler {
  constructor(searchHandler) {
    this.searchHandler = searchHandler;
    this.setupListeners();
  }

  setupListeners() {
    document.addEventListener('keydown', e => this.handleGlobalKeydown(e));
  }

  handleGlobalKeydown(e) {
    const editorVisible = this.isEditorVisible();
    const searchActive = document.activeElement === this.searchHandler?.searchInput;
    const helpVisible = document.getElementById('keyboard-help');

    if (helpVisible && e.key === KEYBOARD_SHORTCUTS.ESCAPE) {
      helpVisible.remove();
      return;
    }

    if (e.key === '?' && !searchActive) {
      e.preventDefault();
      this.showKeyboardHelp();
      return;
    }

    if (editorVisible) {
      return;
    }

    if (searchActive) {
      this.handleSearchKeydown(e);
      return;
    }

    this.handleNavigationKeys(e);
  }

  handleSearchKeydown(e) {
    switch (e.key) {
      case KEYBOARD_SHORTCUTS.ESCAPE:
        this.searchHandler.searchInput.blur();
        this.searchHandler.searchInput.value = '';
        this.searchHandler.filterFiles('');
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.searchHandler.searchInput.blur();
        this.searchHandler.navigateDown();
        break;
      case 'Enter':
        if (this.searchHandler.searchInput.value.trim()) {
          const visibleRows = this.searchHandler.getVisibleRows();
          if (visibleRows[0]) {
            const link = visibleRows[0].querySelector('a');
            if (link) {
              link.click();
            }
          }
        }
        break;
    }
  }

  handleNavigationKeys(e) {
    switch (e.key.toLowerCase()) {
      case KEYBOARD_SHORTCUTS.NAV_DOWN:
      case 'arrowdown':
        e.preventDefault();
        this.searchHandler.navigateDown();
        break;
      case KEYBOARD_SHORTCUTS.NAV_UP:
      case 'arrowup':
        e.preventDefault();
        this.searchHandler.navigateUp();
        break;
      case KEYBOARD_SHORTCUTS.OPEN:
      case 'enter':
        this.searchHandler.openFocused();
        break;
      case KEYBOARD_SHORTCUTS.SEARCH[0]:
      case KEYBOARD_SHORTCUTS.SEARCH[1]:
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.searchHandler.focusSearch();
        }
        break;
      case KEYBOARD_SHORTCUTS.GO_UP:
        e.preventDefault();
        this.goUpDirectory();
        break;
      case KEYBOARD_SHORTCUTS.REFRESH:
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          location.reload();
        }
        break;
      case KEYBOARD_SHORTCUTS.THEME_TOGGLE:
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          document.getElementById('theme-toggle')?.click();
        }
        break;
      case KEYBOARD_SHORTCUTS.CREATE_FILE:
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          document.getElementById('new-file-btn')?.click();
        }
        break;
      case KEYBOARD_SHORTCUTS.TOGGLE_GITIGNORE:
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          document.getElementById('gitignore-toggle')?.click();
        }
        break;
    }
  }

  goUpDirectory() {
    const currentPath = PathUtils.getCurrentPath();
    const newPath = PathUtils.getParentPath(currentPath);

    if (newPath === null) {
      return;
    }

    window.location.href = PathUtils.buildPathUrl('/', newPath);
  }

  isEditorVisible() {
    const editorContainer = document.getElementById('editor-container');
    return editorContainer && editorContainer.style.display !== 'none';
  }

  showKeyboardHelp() {
    const existing = document.getElementById('keyboard-help');
    if (existing) {
      existing.remove();
      return;
    }

    const helpOverlay = document.createElement('div');
    helpOverlay.id = 'keyboard-help';
    helpOverlay.className = 'keyboard-help-overlay';

    helpOverlay.innerHTML = `
      <div class="keyboard-help-content">
        <div class="keyboard-help-header">
          <h2>Keyboard shortcuts</h2>
          <button class="keyboard-help-close" aria-label="Close help">&times;</button>
        </div>
        <div class="keyboard-help-body">
          <div class="shortcuts-container">
            <div class="shortcut-section">
              <h3>Navigation</h3>
              <div class="shortcut-list">
                ${this.createShortcut('Go to parent directory', 'H')}
                ${this.createShortcut('Move selection down', 'J')}
                ${this.createShortcut('Move selection up', 'K')}
                ${this.createShortcut('Open selection', 'O or ↵')}
                ${this.createShortcut('Refresh page', 'R')}
              </div>
            </div>
            <div class="shortcut-section">
              <h3>Actions</h3>
              <div class="shortcut-list">
                ${this.createShortcut('Focus search', 'S or /')}
                ${this.createShortcut('Toggle theme', 'T')}
                ${this.createShortcut('Create new file', 'C')}
                ${this.createShortcut('Toggle .gitignore', 'I')}
                ${this.createShortcut('Show help', '?')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(helpOverlay);

    helpOverlay.addEventListener('click', e => {
      if (e.target === helpOverlay) {
        helpOverlay.remove();
      }
    });

    helpOverlay.querySelector('.keyboard-help-close').addEventListener('click', () => {
      helpOverlay.remove();
    });
  }

  createShortcut(desc, keys) {
    const keyHtml = keys.split(' or ').map(k => `<kbd>${k}</kbd>`).join(' or ');
    return `
      <div class="shortcut-item">
        <span class="shortcut-desc">${desc}</span>
        <div class="shortcut-keys">${keyHtml}</div>
      </div>
    `;
  }
}
