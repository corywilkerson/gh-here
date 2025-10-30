/**
 * Main application entry point
 * Coordinates all modules and initializes the application
 */

import { ThemeManager } from './js/theme-manager.js';
import { EditorManager } from './js/editor-manager.js';
import { SearchHandler } from './js/search-handler.js';
import { KeyboardHandler } from './js/keyboard-handler.js';
import { PathUtils } from './js/utils.js';
import { DraftManager } from './js/draft-manager.js';
import { showNotification } from './js/notification.js';
import { copyToClipboard } from './js/clipboard-utils.js';

class Application {
  constructor() {
    this.themeManager = null;
    this.editorManager = null;
    this.searchHandler = null;
    this.keyboardHandler = null;
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.themeManager = new ThemeManager();
      this.editorManager = new EditorManager(this.themeManager.getCurrentTheme());
      this.searchHandler = new SearchHandler();
      this.keyboardHandler = new KeyboardHandler(this.searchHandler);

      this.setupGlobalEventListeners();
      this.setupGitignoreToggle();
      this.setupFileEditor();
      this.setupNewFileInterface();
      this.setupFileOperations();
      this.setupCommitModal();
      this.handleAutoEdit();
    });
  }

  setupGlobalEventListeners() {
    document.addEventListener('click', e => {
      if (e.target.closest('.copy-path-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const button = e.target.closest('.copy-path-btn');
        copyToClipboard(button.dataset.path, button);
      }

      if (e.target.closest('.diff-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const button = e.target.closest('.diff-btn');
        this.showDiffViewer(button.dataset.path);
      }
    });

    const fileRows = document.querySelectorAll('.file-row');
    fileRows.forEach(row => {
      row.addEventListener('click', e => {
        if (!e.target.closest('.quick-actions')) {
          const link = row.querySelector('a');
          if (link) {
            link.click();
          }
        }
      });
    });
  }

  setupGitignoreToggle() {
    const toggle = document.getElementById('gitignore-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const url = new URL(window.location.href);
        const current = url.searchParams.get('gitignore');
        const newState = current === 'false' ? null : 'false';

        if (newState) {
          url.searchParams.set('gitignore', newState);
        } else {
          url.searchParams.delete('gitignore');
        }

        window.location.href = url.toString();
      });
    }
  }

  async setupFileEditor() {
    const editBtn = document.getElementById('edit-btn');
    const editorContainer = document.getElementById('editor-container');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const wordWrapBtn = document.getElementById('word-wrap-btn');
    const fileContent = document.querySelector('.file-content');

    if (!editBtn || !editorContainer) {
      return;
    }

    let wordWrapEnabled = false;

    if (wordWrapBtn) {
      wordWrapBtn.addEventListener('click', () => {
        wordWrapEnabled = this.editorManager.toggleWordWrap(this.editorManager.fileEditor);
        wordWrapBtn.textContent = wordWrapEnabled ? '↩ Wrap ON' : '↩ Wrap OFF';
        wordWrapBtn.classList.toggle('btn-primary', wordWrapEnabled);
        wordWrapBtn.classList.toggle('btn-secondary', !wordWrapEnabled);
      });
    }

    editBtn.addEventListener('click', async () => {
      const filePath = PathUtils.getCurrentPath();

      try {
        const response = await fetch(`/api/file-content?path=${encodeURIComponent(filePath)}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const content = await response.text();
        const container = document.getElementById('file-editor');

        await this.editorManager.createFileEditor(container, filePath, content);

        fileContent.style.display = 'none';
        editorContainer.style.display = 'block';
        this.editorManager.focus('file');
      } catch (error) {
        showNotification('Failed to load file for editing', 'error');
      }
    });

    cancelBtn.addEventListener('click', () => {
      editorContainer.style.display = 'none';
      fileContent.style.display = 'block';
    });

    saveBtn.addEventListener('click', async () => {
      const filePath = PathUtils.getCurrentPath();
      const content = this.editorManager.getValue('file');

      try {
        const response = await fetch('/api/save-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: filePath, content })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        DraftManager.clearDraft(filePath);
        window.location.reload();
      } catch (error) {
        showNotification('Failed to save file', 'error');
      }
    });

    document.addEventListener('keydown', e => {
      if (editorContainer.style.display !== 'none') {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          saveBtn.click();
        }
        if (e.altKey && e.key === 'z') {
          e.preventDefault();
          wordWrapBtn?.click();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelBtn.click();
        }
      }
    });
  }

  setupNewFileInterface() {
    const filenameInput = document.getElementById('new-filename-input');
    const createBtn = document.getElementById('create-new-file');
    const cancelBtn = document.getElementById('cancel-new-file');

    if (filenameInput) {
      filenameInput.addEventListener('input', () => {
        const filename = filenameInput.value.trim();
        if (filename) {
          this.editorManager.updateLanguage(filename);
        }
      });
    }

    if (createBtn) {
      createBtn.addEventListener('click', async () => {
        const filename = filenameInput.value.trim();

        if (!filename) {
          showNotification('Please enter a filename', 'error');
          filenameInput.focus();
          return;
        }

        const content = this.editorManager.getValue('newFile');
        const currentPath = PathUtils.getCurrentPath();

        try {
          let response = await fetch('/api/create-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: currentPath, filename })
          });

          if (!response.ok) {
            throw new Error('Failed to create file');
          }

          if (content.trim()) {
            const filePath = PathUtils.buildFilePath(currentPath, filename);
            response = await fetch('/api/save-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: filePath, content })
            });
          }

          showNotification(`File "${filename}" created successfully`, 'success');
          setTimeout(() => {
            window.location.href = PathUtils.buildPathUrl('/', currentPath);
          }, 800);
        } catch (error) {
          showNotification('Failed to create file', 'error');
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        const currentPath = PathUtils.getCurrentPath();
        window.location.href = PathUtils.buildPathUrl('/', currentPath);
      });
    }
  }

  setupFileOperations() {
    document.addEventListener('click', async e => {
      if (e.target.closest('.delete-btn')) {
        const btn = e.target.closest('.delete-btn');
        const itemPath = btn.dataset.path;
        const itemName = btn.dataset.name;
        const isDirectory = btn.dataset.isDirectory === 'true';

        const message = `Are you sure you want to delete ${isDirectory ? 'folder' : 'file'} "${itemName}"?`;
        if (!confirm(message)) {
          return;
        }

        try {
          const response = await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: itemPath })
          });

          if (!response.ok) {
            throw new Error('Delete failed');
          }

          showNotification(`${isDirectory ? 'Folder' : 'File'} deleted successfully`, 'success');
          setTimeout(() => window.location.reload(), 600);
        } catch (error) {
          showNotification('Failed to delete item', 'error');
        }
      }

      if (e.target.closest('.rename-btn')) {
        const btn = e.target.closest('.rename-btn');
        const itemPath = btn.dataset.path;
        const currentName = btn.dataset.name;
        const isDirectory = btn.dataset.isDirectory === 'true';

        const newName = prompt(`Rename ${isDirectory ? 'folder' : 'file'}:`, currentName);
        if (!newName || newName.trim() === currentName) {
          return;
        }

        try {
          const response = await fetch('/api/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: itemPath, newName: newName.trim() })
          });

          if (!response.ok) {
            throw new Error('Rename failed');
          }

          showNotification(`Renamed to "${newName.trim()}"`, 'success');
          setTimeout(() => window.location.reload(), 600);
        } catch (error) {
          showNotification('Failed to rename item', 'error');
        }
      }
    });
  }

  setupCommitModal() {
    document.addEventListener('click', e => {
      if (e.target.matches('#commit-btn') || e.target.closest('#commit-btn')) {
        e.preventDefault();
        this.showCommitModal();
      }
    });
  }

  async showCommitModal() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const currentPath = urlParams.get('path') || '';

      const response = await fetch(`/api/git-status?currentPath=${encodeURIComponent(currentPath)}`);
      const data = await response.json();

      if (!data.success || data.changes.length === 0) {
        showNotification('No changes to commit', 'info');
        return;
      }

      this.renderCommitModal(data.changes);
    } catch (error) {
      showNotification('Failed to load git changes', 'error');
    }
  }

  renderCommitModal(changes) {
    const modal = document.createElement('div');
    modal.className = 'commit-modal-overlay';
    modal.innerHTML = `
      <div class="commit-modal">
        <div class="commit-modal-header">
          <h3>Commit Changes</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="commit-modal-body">
          <div class="changed-files">
            <h4>Changed Files (${changes.length})</h4>
            <ul class="file-list">
              ${changes.map(file => `
                <li class="file-item">
                  <label class="file-checkbox-label">
                    <input type="checkbox" class="file-checkbox" data-file="${file.name}" checked>
                    <span class="file-status">${file.status}</span>
                    <span class="file-name">${file.name}</span>
                  </label>
                </li>
              `).join('')}
            </ul>
          </div>
          <div class="commit-message-section">
            <textarea id="modal-commit-message" placeholder="Enter commit message..." rows="4"></textarea>
          </div>
        </div>
        <div class="commit-modal-footer">
          <button class="btn-cancel">Cancel</button>
          <button class="btn-commit" disabled>Commit Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const messageInput = modal.querySelector('#modal-commit-message');
    const commitBtn = modal.querySelector('.btn-commit');
    const cancelBtn = modal.querySelector('.btn-cancel');
    const closeBtn = modal.querySelector('.modal-close');

    const updateButton = () => {
      const hasMessage = messageInput.value.trim();
      const selectedCount = modal.querySelectorAll('.file-checkbox:checked').length;
      commitBtn.disabled = !hasMessage || selectedCount === 0;
      commitBtn.textContent = selectedCount > 0
        ? `Commit ${selectedCount} file${selectedCount === 1 ? '' : 's'}`
        : 'No files selected';
    };

    messageInput.addEventListener('input', updateButton);
    modal.querySelectorAll('.file-checkbox').forEach(cb => {
      cb.addEventListener('change', updateButton);
    });

    const closeModal = () => modal.remove();
    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        closeModal();
      }
    });

    commitBtn.addEventListener('click', async () => {
      const message = messageInput.value.trim();
      const files = Array.from(modal.querySelectorAll('.file-checkbox:checked')).map(
        cb => cb.dataset.file
      );

      if (!message || files.length === 0) {
        return;
      }

      commitBtn.textContent = 'Committing...';
      commitBtn.disabled = true;

      try {
        const response = await fetch('/api/git-commit-selected', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, files })
        });

        if (response.ok) {
          showNotification(`Successfully committed ${files.length} file${files.length === 1 ? '' : 's'}!`, 'success');
          closeModal();
          setTimeout(() => location.reload(), 1000);
        } else {
          throw new Error('Commit failed');
        }
      } catch (error) {
        showNotification('Commit failed', 'error');
        commitBtn.textContent = 'Commit Changes';
        commitBtn.disabled = false;
      }
    });

    messageInput.focus();
  }

  showDiffViewer(filePath) {
    // Simplified - redirect to diff view
    const url = new URL(window.location.href);
    url.searchParams.set('path', filePath);
    url.searchParams.set('view', 'diff');
    window.location.href = url.toString();
  }

  handleAutoEdit() {
    if (window.location.hash === '#edit') {
      const editBtn = document.getElementById('edit-btn');
      if (editBtn) {
        window.location.hash = '';
        setTimeout(() => editBtn.click(), 100);
      }
    }
  }
}

const app = new Application();
app.init();
