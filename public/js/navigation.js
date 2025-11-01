/**
 * Client-side navigation handler for smooth page transitions
 * Optimized with request cancellation and efficient DOM updates
 */

export class NavigationHandler {
  constructor() {
    this.mainContentWrapper = document.querySelector('.main-content-wrapper');
    this.isNavigating = false;
    this.abortController = null;
    
    // Clear any stuck navigation state on initialization
    this.removeNavigatingClass();
    
    this.setupListeners();
  }

  setupListeners() {
    // Listen for navigation events from file tree and keyboard
    document.addEventListener('navigate', this.handleNavigateEvent.bind(this));

    // Intercept all internal link clicks (event delegation - no duplicates)
    document.addEventListener('click', this.handleLinkClick.bind(this));

    // Handle back/forward buttons
    window.addEventListener('popstate', this.handlePopState.bind(this));
  }

  handleNavigateEvent(e) {
    const { path } = e.detail;
    this.navigateTo(path);
  }

  handleLinkClick(e) {
    const link = e.target.closest('a');
    if (!link) return;

    // Skip line number links (hash-only navigation like #L10)
    if (link.classList.contains('line-number')) {
      return;
    }

    // Skip if clicking inside quick actions or other interactive elements
    if (e.target.closest('.quick-actions, button, .file-action-btn')) {
      return;
    }

    // Only intercept left clicks on same-origin links without modifier keys
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey ||
        e.button !== 0 || link.target === '_blank' || link.download) {
      return;
    }

    if (!this.isSameOrigin(link.href)) return;

    const url = new URL(link.href);
    // Only intercept navigation within our app
    if (url.origin === window.location.origin &&
        (url.pathname === '/' || url.pathname === window.location.pathname)) {
      e.preventDefault();
      e.stopPropagation();
      const path = url.searchParams.get('path') || '';
      const view = url.searchParams.get('view') || '';
      this.navigateTo(path, true, view);
    }
  }

  handlePopState(e) {
    const url = new URL(window.location.href);
    const path = e.state?.path ?? (url.searchParams.get('path') || '');
    const view = e.state?.view ?? (url.searchParams.get('view') || '');
    this.navigateTo(path, false, view);
  }

  isSameOrigin(href) {
    try {
      return new URL(href, window.location.origin).origin === window.location.origin;
    } catch {
      return false;
    }
  }

  // Helper to safely remove navigating class
  removeNavigatingClass() {
    // Re-find the element in case reference is stale
    const wrapper = document.querySelector('.main-content-wrapper');
    if (wrapper) {
      wrapper.classList.remove('navigating');
    }
  }

  async navigateTo(path, pushState = true, view = '') {
    // Cancel any in-flight request
    if (this.abortController) {
      this.abortController.abort();
    }

    if (this.isNavigating) return;
    this.isNavigating = true;

    // Preserve existing query parameters (like showGitignored) while updating path and view
    let url = '/';
    const currentParams = new URLSearchParams(window.location.search);
    const params = new URLSearchParams(currentParams); // Start with existing params

    // Update path parameter
    if (path) {
      params.set('path', path);
    } else {
      params.delete('path');
    }

    // Update view parameter
    if (view) {
      params.set('view', view);
    } else {
      params.delete('view');
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    this.abortController = new AbortController();

    try {
      // Re-find element in case reference is stale
      this.mainContentWrapper = document.querySelector('.main-content-wrapper');
      
      // Optimize: Use class instead of inline style
      if (this.mainContentWrapper) {
        this.mainContentWrapper.classList.add('navigating');
      }

      // Fetch with abort signal
      const response = await fetch(url, { signal: this.abortController.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract the new content - update main-content-wrapper and sidebar if needed
      const newMainContent = doc.querySelector('.main-content-wrapper');
      const newBreadcrumb = doc.querySelector('.breadcrumb-section');
      const newSidebar = doc.querySelector('.file-tree-sidebar');

      if (!newMainContent) {
        throw new Error('Content not found: missing .main-content-wrapper in response');
      }

      // If current wrapper doesn't exist, create it (shouldn't happen, but handle gracefully)
      if (!this.mainContentWrapper) {
        const main = document.querySelector('main');
        if (!main) {
          throw new Error('Content not found: missing <main> element');
        }
        // Create wrapper if it doesn't exist (edge case)
        const wrapper = document.createElement('div');
        wrapper.className = 'main-content-wrapper';
        main.appendChild(wrapper);
        this.mainContentWrapper = wrapper;
      }

      // Batch DOM updates
      requestAnimationFrame(() => {
        // Re-find in case reference changed
        const wrapper = document.querySelector('.main-content-wrapper');
        const main = document.querySelector('main');
        
        if (!wrapper) {
          this.removeNavigatingClass();
          return;
        }

        // Update sidebar visibility based on path (always check, even if not in new content)
        if (main) {
          const currentSidebar = main.querySelector('.file-tree-sidebar');
          const hasPath = path && path !== '';
          
          if (currentSidebar) {
            // Always update visibility based on path
            if (hasPath) {
              currentSidebar.classList.remove('hidden');
              // Update sidebar content if new sidebar exists and structure changed
              if (newSidebar) {
                const newSidebarContent = newSidebar.innerHTML;
                if (newSidebarContent !== currentSidebar.innerHTML) {
                  currentSidebar.innerHTML = newSidebarContent;
                }
              }
            } else {
              // Hide sidebar when navigating to root
              currentSidebar.classList.add('hidden');
            }
          } else if (hasPath && newSidebar) {
            // Sidebar doesn't exist but should - insert it before main-content-wrapper
            const sidebarClone = newSidebar.cloneNode(true);
            sidebarClone.classList.remove('hidden');
            main.insertBefore(sidebarClone, wrapper);
          }
        }

        // Update breadcrumbs if they exist
        if (newBreadcrumb) {
          const oldBreadcrumb = wrapper.parentElement?.querySelector('.breadcrumb-section');
          if (oldBreadcrumb) {
            oldBreadcrumb.replaceWith(newBreadcrumb.cloneNode(true));
          }
        }

        // Update main content wrapper content
        wrapper.innerHTML = newMainContent.innerHTML;
        wrapper.className = newMainContent.className;

        // Update browser URL
        if (pushState) {
          window.history.pushState({ path, view }, '', url);
        }

        // Fade in new content - always remove navigating class
        wrapper.classList.remove('navigating');
        this.mainContentWrapper = wrapper; // Update reference

        // Notify that content has changed
        document.dispatchEvent(new CustomEvent('content-loaded'));
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        // Request was cancelled - still need to clean up
        this.removeNavigatingClass();
        this.isNavigating = false;
        this.abortController = null;
        return;
      }
      
      // Log more detailed error info
      console.error('Navigation failed:', {
        error: error.message,
        url,
        path,
        view,
        hasWrapper: !!this.mainContentWrapper,
        timestamp: new Date().toISOString()
      });
      
      // Always restore state on error
      this.removeNavigatingClass();
      
      // Fall back to full page load
      window.location.href = url;
    } finally {
      this.isNavigating = false;
      this.abortController = null;
    }
  }
}
