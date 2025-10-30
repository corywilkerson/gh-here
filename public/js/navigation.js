/**
 * Client-side navigation handler for smooth page transitions
 */

export class NavigationHandler {
  constructor() {
    this.mainContentWrapper = document.querySelector('.main-content-wrapper');
    this.isNavigating = false;
    this.setupListeners();
  }

  setupListeners() {
    // Listen for navigation events from file tree and keyboard
    document.addEventListener('navigate', e => {
      const { path } = e.detail;
      this.navigateTo(path);
    });

    // Intercept all internal link clicks
    document.addEventListener('click', e => {
      const link = e.target.closest('a');

      // Only intercept left clicks on same-origin links without modifier keys
      if (!link ||
          e.ctrlKey ||
          e.metaKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0 ||
          link.target === '_blank' ||
          link.download ||
          !this.isSameOrigin(link.href)) {
        return;
      }

      const url = new URL(link.href);

      // Only intercept navigation within our app (same pathname base)
      if (url.origin === window.location.origin &&
          (url.pathname === '/' || url.pathname === window.location.pathname)) {
        e.preventDefault();
        const path = url.searchParams.get('path') || '';
        this.navigateTo(path);
      }
    });

    // Handle back/forward buttons
    window.addEventListener('popstate', e => {
      if (e.state && e.state.path !== undefined) {
        this.navigateTo(e.state.path, false);
      } else {
        const path = new URL(window.location.href).searchParams.get('path') || '';
        this.navigateTo(path, false);
      }
    });
  }

  isSameOrigin(href) {
    try {
      const url = new URL(href, window.location.origin);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  async navigateTo(path, pushState = true) {
    if (this.isNavigating) return;
    this.isNavigating = true;

    const url = path ? `/?path=${encodeURIComponent(path)}` : '/';

    try {
      // Fade out current content
      if (this.mainContentWrapper) {
        this.mainContentWrapper.style.opacity = '0.5';
        this.mainContentWrapper.style.pointerEvents = 'none';
      }

      // Fetch the new content
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract the new content - only update main-content-wrapper, preserve sidebar
      const newMainContent = doc.querySelector('.main-content-wrapper');
      const newBreadcrumb = doc.querySelector('.breadcrumb-section');

      if (newMainContent && this.mainContentWrapper) {
        // Update breadcrumbs if they exist
        if (newBreadcrumb) {
          const oldBreadcrumb = document.querySelector('.breadcrumb-section');
          if (oldBreadcrumb) {
            oldBreadcrumb.replaceWith(newBreadcrumb.cloneNode(true));
          }
        }

        // Update main content wrapper content
        this.mainContentWrapper.innerHTML = newMainContent.innerHTML;
        this.mainContentWrapper.className = newMainContent.className;

        // Update browser URL
        if (pushState) {
          window.history.pushState({ path }, '', url);
        }

        // Fade in new content
        requestAnimationFrame(() => {
          if (this.mainContentWrapper) {
            this.mainContentWrapper.style.opacity = '1';
            this.mainContentWrapper.style.pointerEvents = '';
          }
        });

        // Notify that content has changed
        const event = new CustomEvent('content-loaded');
        document.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Navigation failed:', error);
      // Restore opacity on error
      if (this.mainContentWrapper) {
        this.mainContentWrapper.style.opacity = '1';
        this.mainContentWrapper.style.pointerEvents = '';
      }
      // Fall back to full page load
      window.location.href = url;
    } finally {
      this.isNavigating = false;
    }
  }
}
