/**
 * File tree navigation sidebar
 */

import { PathUtils } from './utils.js';

export class FileTreeNavigator {
  constructor() {
    this.treeContainer = document.getElementById('file-tree');
    this.expandedFolders = new Set(this.loadExpandedState());
    this.currentPath = PathUtils.getCurrentPath();
    this.abortController = null;
    this.isInitialized = false;

    // Only initialize if container exists (sidebar is only shown when not at root)
    if (this.treeContainer) {
      this.init();
    }
    // Silently skip if container doesn't exist (expected at root directory)
  }

  async init() {
    if (this.isInitialized) {
      // Prevent double initialization
      return;
    }

    this.isInitialized = true;
    
    if (!this.treeContainer) {
      this.isInitialized = false;
      return;
    }

    this.showLoadingSkeleton();
    
    try {
      await this.loadFileTree();
      this.hideLoadingSkeleton();
      this.setupEventListeners();
      this.highlightCurrentPath();
    } catch (error) {
      console.error('FileTreeNavigator init failed:', error);
      this.hideLoadingSkeleton();
      this.isInitialized = false;
    }
  }

  showLoadingSkeleton() {
    this.treeContainer.innerHTML = `
      <div class="tree-skeleton">
        <div class="skeleton-item"></div>
        <div class="skeleton-item"></div>
        <div class="skeleton-item skeleton-indent"></div>
        <div class="skeleton-item skeleton-indent"></div>
        <div class="skeleton-item"></div>
        <div class="skeleton-item skeleton-indent"></div>
        <div class="skeleton-item"></div>
      </div>
    `;
  }

  hideLoadingSkeleton() {
    const skeleton = this.treeContainer.querySelector('.tree-skeleton');
    if (skeleton) {
      skeleton.remove();
    }
  }

  async loadFileTree() {
    // Cancel any in-flight request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    try {
      // Check cache first
      const cached = this.getCachedTree();
      if (cached) {
        this.renderTree(cached, this.treeContainer);
        this.restoreExpandedState();
        this.notifySearchHandler();
      }

      // Get gitignore state from localStorage
      const showGitignored = localStorage.getItem('gh-here-show-gitignored') === 'true';
      const apiUrl = showGitignored ? '/api/file-tree?showGitignored=true' : '/api/file-tree';

      // Fetch fresh data with abort signal
      const response = await fetch(apiUrl, {
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        this.cacheTree(data.tree);
        if (!cached) {
          this.renderTree(data.tree, this.treeContainer);
          this.restoreExpandedState();
          this.notifySearchHandler();
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // Request was cancelled, expected behavior
        return;
      }
      console.error('Failed to load file tree:', error);
      this.hideLoadingSkeleton();
    } finally {
      this.abortController = null;
    }
  }

  notifySearchHandler() {
    // Dispatch a custom event so the search handler can update its tree items
    const event = new CustomEvent('filetree-loaded');
    document.dispatchEvent(event);
  }

  getCachedTree() {
    try {
      const cached = sessionStorage.getItem('gh-here-file-tree');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      return null;
    }
    return null;
  }

  cacheTree(tree) {
    try {
      sessionStorage.setItem('gh-here-file-tree', JSON.stringify(tree));
    } catch {
      // Ignore storage errors
    }
  }

  renderTree(items, container, level = 0) {
    items.forEach(item => {
      const itemEl = this.createTreeItem(item, level);
      container.appendChild(itemEl);

      if (item.isDirectory && item.children) {
        const childContainer = document.createElement('div');
        childContainer.className = 'tree-children';
        childContainer.dataset.path = item.path;

        if (!this.expandedFolders.has(item.path)) {
          childContainer.style.display = 'none';
        }

        this.renderTree(item.children, childContainer, level + 1);
        container.appendChild(childContainer);
      }
    });
  }

  createTreeItem(item, level) {
    const itemEl = document.createElement('div');
    itemEl.className = 'tree-item';
    itemEl.dataset.path = item.path;
    itemEl.dataset.isDirectory = item.isDirectory;
    itemEl.style.paddingLeft = `${level * 12 + 8}px`;

    if (item.isDirectory) {
      const isExpanded = this.expandedFolders.has(item.path);
      itemEl.innerHTML = `
        <span class="tree-toggle">${isExpanded ? '▼' : '▶'}</span>
        <svg class="tree-icon" viewBox="0 0 16 16" width="16" height="16">
          <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path>
        </svg>
        <span class="tree-label">${item.name}</span>
      `;
    } else {
      itemEl.innerHTML = `
        <span class="tree-spacer"></span>
        <svg class="tree-icon file-icon" viewBox="0 0 16 16" width="16" height="16">
          <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path>
        </svg>
        <span class="tree-label">${item.name}</span>
      `;
    }

    return itemEl;
  }

  setupEventListeners() {
    // Remove existing listener to prevent duplicates
    if (this.treeClickHandler) {
      this.treeContainer.removeEventListener('click', this.treeClickHandler);
    }

    this.treeClickHandler = (e) => {
      const treeItem = e.target.closest('.tree-item');
      if (!treeItem) {
        return;
      }

      const isDirectory = treeItem.dataset.isDirectory === 'true';
      const path = treeItem.dataset.path;

      if (e.target.closest('.tree-toggle') && isDirectory) {
        e.preventDefault();
        e.stopPropagation();
        this.toggleFolder(path);
      } else {
        e.preventDefault();
        e.stopPropagation();
        const detail = { path, isDirectory };
        document.dispatchEvent(new CustomEvent('navigate', { detail }));
      }
    };

    this.treeContainer.addEventListener('click', this.treeClickHandler);
  }

  toggleFolder(path) {
    const childContainer = this.treeContainer.querySelector(
      `.tree-children[data-path="${path}"]`
    );
    const toggleIcon = this.treeContainer.querySelector(
      `.tree-item[data-path="${path}"] .tree-toggle`
    );

    if (!childContainer || !toggleIcon) {
      return;
    }

    const isExpanded = childContainer.style.display !== 'none';

    if (isExpanded) {
      childContainer.style.display = 'none';
      toggleIcon.textContent = '▶';
      this.expandedFolders.delete(path);
    } else {
      childContainer.style.display = 'block';
      toggleIcon.textContent = '▼';
      this.expandedFolders.add(path);
    }

    this.saveExpandedState();
  }

  highlightCurrentPath() {
    const currentItems = this.treeContainer.querySelectorAll('.tree-item');
    currentItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.path === this.currentPath) {
        item.classList.add('active');
        this.expandParentFolders(this.currentPath);
      }
    });
  }

  expandParentFolders(path) {
    const parts = path.split('/').filter(p => p);
    let currentPath = '';

    parts.forEach((part, index) => {
      if (index < parts.length - 1) {
        currentPath += (currentPath ? '/' : '') + part;
        const childContainer = this.treeContainer.querySelector(
          `.tree-children[data-path="${currentPath}"]`
        );
        const toggleIcon = this.treeContainer.querySelector(
          `.tree-item[data-path="${currentPath}"] .tree-toggle`
        );

        if (childContainer && toggleIcon) {
          childContainer.style.display = 'block';
          toggleIcon.textContent = '▼';
          this.expandedFolders.add(currentPath);
        }
      }
    });

    this.saveExpandedState();
  }

  restoreExpandedState() {
    this.expandedFolders.forEach(path => {
      const childContainer = this.treeContainer.querySelector(
        `.tree-children[data-path="${path}"]`
      );
      const toggleIcon = this.treeContainer.querySelector(
        `.tree-item[data-path="${path}"] .tree-toggle`
      );

      if (childContainer && toggleIcon) {
        childContainer.style.display = 'block';
        toggleIcon.textContent = '▼';
      }
    });
  }

  saveExpandedState() {
    localStorage.setItem(
      'gh-here-expanded-folders',
      JSON.stringify([...this.expandedFolders])
    );
  }

  loadExpandedState() {
    try {
      const saved = localStorage.getItem('gh-here-expanded-folders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
}
