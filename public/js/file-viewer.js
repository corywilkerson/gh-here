/**
 * Monaco-based file viewer for read-only code display
 * Elite code browsing with advanced Monaco Editor features
 * 
 * @class FileViewer
 */

import { CONFIG } from './constants.js';
import { getLanguageFromExtension } from './utils.js';

export class FileViewer {
  constructor() {
    this.viewer = null;
    this.ready = false;
    this.minimapEnabled = false;
    this.init();
  }

  /**
   * Initialize Monaco Editor for file viewing
   */
  init() {
    // If Monaco is already loaded, initialize immediately
    if (window.monacoReady && typeof monaco !== 'undefined') {
      this.ready = true;
      this.setupTheme();
      this.initializeViewer();
      return;
    }

    if (typeof require === 'undefined') {
      // Wait for Monaco to be loaded by editor-manager
      const checkMonaco = setInterval(() => {
        if (window.monacoReady && typeof monaco !== 'undefined') {
          clearInterval(checkMonaco);
          this.ready = true;
          this.setupTheme();
          this.initializeViewer();
        }
      }, 100);
      return;
    }

    require.config({ paths: { vs: CONFIG.MONACO_CDN } });

    require(['vs/editor/editor.main'], () => {
      // Configure Monaco to work without web workers (avoids CORS issues)
      self.MonacoEnvironment = {
        getWorker: function(workerId, label) {
          return undefined; // Disable workers, use main thread
        }
      };

      window.monacoReady = true;
      this.ready = true;
      this.setupTheme();
      this.initializeViewer();
    });
  }

  /**
   * Setup Monaco theme based on current page theme
   */
  setupTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const monacoTheme = currentTheme === 'dark' ? 'vs-dark' : 'vs';
    
    if (typeof monaco !== 'undefined') {
      monaco.editor.setTheme(monacoTheme);
    }
  }

  /**
   * Initialize the file viewer with elite features
   */
  initializeViewer() {
    const container = document.querySelector('.file-content');
    if (!container) return;

    // Check if Monaco is already initialized in this container
    if (container.querySelector('.monaco-editor')) {
      return;
    }

    // Get file content from existing highlight.js code
    const codeElement = container.querySelector('pre code.hljs.with-line-numbers');
    if (!codeElement) return;

    // Extract content and language
    const content = this.extractContentFromHighlighted(codeElement);
    const filePath = this.getCurrentFilePath();
    const language = this.detectLanguage(filePath, codeElement);

    // Create Monaco container
    const monacoContainer = document.createElement('div');
    monacoContainer.className = 'monaco-file-viewer';
    monacoContainer.style.height = '100%';
    monacoContainer.style.minHeight = '400px';

    // Replace the highlight.js content with Monaco container
    const preElement = codeElement.closest('pre');
    if (preElement) {
      preElement.replaceWith(monacoContainer);
    } else {
      container.innerHTML = '';
      container.appendChild(monacoContainer);
    }

    // Create Monaco editor in read-only mode with elite features
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const monacoTheme = currentTheme === 'dark' ? 'vs-dark' : 'vs';

    this.viewer = monaco.editor.create(monacoContainer, {
      value: content,
      language: language,
      theme: monacoTheme,
      readOnly: true,
      
      // Layout
      minimap: { enabled: this.minimapEnabled, side: 'right' },
      lineNumbers: 'on',
      lineNumbersMinChars: 3,
      wordWrap: 'off',
      scrollBeyondLastLine: false,
      fontSize: 12,
      lineHeight: 20,
      fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
      padding: { top: 16, bottom: 16 },
      
      // Visual enhancements
      renderLineHighlight: 'line',
      renderWhitespace: 'selection',
      selectOnLineNumbers: true,
      automaticLayout: true,
      
      // Code folding
      folding: true,
      foldingHighlight: true,
      foldingStrategy: 'auto',
      showFoldingControls: 'mouseover',
      unfoldOnClickAfterEndOfLine: true,
      
      // Bracket matching
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        bracketPairsHorizontal: true,
        indentation: true,
        highlightActiveIndentation: true
      },
      matchBrackets: 'always',
      
      // Navigation features
      links: true,
      colorDecorators: true,
      occurrencesHighlight: true,
      selectionHighlight: true,
      
      // Smooth animations
      smoothScrolling: true,
      cursorSmoothCaretAnimation: 'on',
      cursorBlinking: 'smooth',
      
      // Elite features
      codeLens: false, // Can enable if we add language server
      hover: {
        enabled: true,
        delay: 300
      },
      quickSuggestions: false, // Disable for read-only
      parameterHints: {
        enabled: false
      },
      suggestOnTriggerCharacters: false,
      acceptSuggestionOnEnter: 'off',
      
      // Breadcrumbs (elite navigation)
      breadcrumbs: {
        enabled: true
      },
      
      // Inlay hints (elite feature)
      inlayHints: {
        enabled: 'on'
      },
      
      // Semantic tokens (better highlighting)
      'semanticHighlighting.enabled': true,
      
      // Scrollbar
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        arrowSize: 11
      },
      
      // Accessibility
      accessibilitySupport: 'auto',
      
      // Multi-cursor (useful even in read-only for selection)
      multiCursorModifier: 'ctrlCmd',
      
      // Find widget (elite search)
      find: {
        addExtraSpaceOnTop: false,
        autoFindInSelection: 'never',
        seedSearchStringFromSelection: 'always'
      }
    });

    // Setup elite keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Handle line number clicks for hash navigation
    this.viewer.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
        const lineNumber = e.target.position.lineNumber;
        window.location.hash = `L${lineNumber}`;
        const url = new URL(window.location);
        url.hash = `L${lineNumber}`;
        window.history.replaceState({}, '', url);
      }
    });

    // Handle hash changes to scroll to line
    this.handleHashNavigation();

    // Setup context menu with elite actions
    this.setupContextMenu();

    // Layout after a short delay to ensure container is sized
    setTimeout(() => {
      if (this.viewer) {
        this.viewer.layout();
      }
    }, 100);

    // Listen for theme changes
    this.setupThemeListener();
  }

  /**
   * Setup elite keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    if (!this.viewer) return;

    // Go to Symbol (Cmd/Ctrl+Shift+O) - elite navigation
    this.viewer.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyO, () => {
      this.viewer.getAction('editor.action.gotoSymbol').run();
    });

    // Toggle Minimap (Cmd/Ctrl+K M)
    this.viewer.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      // This is a chord, need to handle differently
    });

    // Go to Line (Cmd/Ctrl+G)
    this.viewer.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
      this.viewer.getAction('editor.action.gotoLine').run();
    });

    // Toggle Word Wrap (Alt+Z)
    this.viewer.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, () => {
      const currentWrap = this.viewer.getOption(monaco.editor.EditorOption.wordWrap);
      this.viewer.updateOptions({ wordWrap: currentWrap === 'off' ? 'on' : 'off' });
    });

    // Fold All (Cmd/Ctrl+K Cmd/Ctrl+0)
    this.viewer.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      // Chord command - handled by Monaco natively
    });

    // Unfold All (Cmd/Ctrl+K Cmd/Ctrl+J)
    // Also handled natively

    // Toggle Minimap with simpler shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        this.toggleMinimap();
      }
    });
  }

  /**
   * Toggle minimap
   */
  toggleMinimap() {
    if (!this.viewer) return;
    this.minimapEnabled = !this.minimapEnabled;
    this.viewer.updateOptions({ minimap: { enabled: this.minimapEnabled } });
  }

  /**
   * Setup context menu with elite actions
   */
  setupContextMenu() {
    if (!this.viewer) return;

    // Monaco handles context menu natively, but we can add custom actions
    // The native context menu already includes:
    // - Cut/Copy/Paste (though paste disabled in read-only)
    // - Find/Replace
    // - Go to Symbol
    // - etc.
  }

  /**
   * Setup listener for theme changes
   */
  setupThemeListener() {
    // Listen for theme attribute changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
          this.updateTheme(newTheme);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  /**
   * Extract plain text content from highlighted HTML
   */
  extractContentFromHighlighted(codeElement) {
    // Clone to avoid modifying original
    const clone = codeElement.cloneNode(true);
    
    // Remove line numbers and containers
    const lineContainers = clone.querySelectorAll('.line-container');
    if (lineContainers.length > 0) {
      const lines = Array.from(lineContainers).map(container => {
        const content = container.querySelector('.line-content');
        return content ? content.textContent : '';
      });
      return lines.join('\n');
    }

    // Fallback: just get text content
    return clone.textContent || '';
  }

  /**
   * Detect language from file path or code element
   */
  detectLanguage(filePath, codeElement) {
    if (filePath) {
      const language = getLanguageFromExtension(filePath);
      if (language && language !== 'plaintext') {
        return language;
      }
    }

    // Try to detect from code element class
    const classList = codeElement.className.split(' ');
    const langClass = classList.find(cls => cls.startsWith('language-'));
    if (langClass) {
      return langClass.replace('language-', '');
    }

    return 'plaintext';
  }

  /**
   * Get current file path from URL
   */
  getCurrentFilePath() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('path') || '';
    } catch {
      return '';
    }
  }

  /**
   * Handle hash navigation to scroll to specific line
   */
  handleHashNavigation() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#L')) {
      const lineNumber = parseInt(hash.substring(2), 10);
      if (lineNumber && this.viewer) {
        this.viewer.revealLineInCenter(lineNumber);
        this.viewer.setPosition({ lineNumber, column: 1 });
      }
    }

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash;
      if (newHash && newHash.startsWith('#L')) {
        const lineNumber = parseInt(newHash.substring(2), 10);
        if (lineNumber && this.viewer) {
          this.viewer.revealLineInCenter(lineNumber);
          this.viewer.setPosition({ lineNumber, column: 1 });
        }
      }
    });
  }

  /**
   * Update theme when theme changes
   */
  updateTheme(theme) {
    if (!this.viewer) return;
    
    const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';
    if (typeof monaco !== 'undefined') {
      monaco.editor.setTheme(monacoTheme);
    }
  }

  /**
   * Cleanup: Dispose of Monaco editor
   */
  destroy() {
    if (this.viewer) {
      this.viewer.dispose();
      this.viewer = null;
    }
  }
}
