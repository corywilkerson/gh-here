/**
 * Theme management
 */

import { THEME, STORAGE_KEYS } from './constants.js';

export class ThemeManager {
  constructor() {
    this.html = document.documentElement;
    this.themeToggle = null;
    this.currentTheme = THEME.DARK;
    this.init();
  }

  init() {
    const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const systemTheme = systemPrefersDark ? THEME.DARK : THEME.LIGHT;
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || systemTheme;

    this.currentTheme = savedTheme;
    this.setTheme(savedTheme);

    // Setup listeners - try immediately, then retry after DOM is ready
    this.setupListeners();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupListeners());
    }
    
    // Also re-setup after content changes (navigation)
    document.addEventListener('content-loaded', () => this.setupListeners());
  }

  setupListeners() {
    // Re-find the theme toggle button (it might be replaced after navigation)
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
      // Remove old listener if button was replaced
      if (this.themeToggle && this.themeToggle !== themeToggle && this.themeToggleClickHandler) {
        this.themeToggle.removeEventListener('click', this.themeToggleClickHandler);
      }
      
      // Set up new listener if we don't have one yet or button changed
      if (!this.themeToggle || this.themeToggle !== themeToggle || !this.themeToggleClickHandler) {
        this.themeToggle = themeToggle;
        this.themeToggleClickHandler = () => this.toggleTheme();
        this.themeToggle.addEventListener('click', this.themeToggleClickHandler);
      }
      
      // Update icon for current theme
      this.updateThemeIcon(this.currentTheme);
    }

    // Setup system theme listener (only once)
    if (window.matchMedia && !this.mediaQueryListener) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueryListener = (e) => {
        if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
          const newTheme = e.matches ? THEME.DARK : THEME.LIGHT;
          this.setTheme(newTheme);
        }
      };
      // Use addEventListener if available (modern), fallback to addListener
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', this.mediaQueryListener);
      } else {
        mediaQuery.addListener(this.mediaQueryListener);
      }
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme === THEME.DARK ? THEME.LIGHT : THEME.DARK;

    this.currentTheme = newTheme;
    this.setTheme(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);

    if (typeof monaco !== 'undefined') {
      const monacoTheme = newTheme === THEME.DARK ? 'vs-dark' : 'vs';
      monaco.editor.setTheme(monacoTheme);
    }
  }

  setTheme(theme) {
    this.currentTheme = theme;
    this.html.setAttribute('data-theme', theme);
    this.updateThemeIcon(theme);
  }

  updateThemeIcon(theme) {
    const iconSvg = this.themeToggle?.querySelector('.theme-icon');
    if (!iconSvg) {
      return;
    }

    if (theme === THEME.DARK) {
      iconSvg.innerHTML = '<path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13zM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.061zm9.193 9.193a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061zM16 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8zM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8zm10.657-5.657a.75.75 0 0 1 0 1.061l-1.061 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.061 0zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0z"></path>';
    } else {
      iconSvg.innerHTML = '<path d="M9.598 1.591a.75.75 0 0 1 .785-.175 7 7 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.5 5.5 0 1 0 7.678-7.678z"></path>';
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}
