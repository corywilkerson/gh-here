/**
 * Application constants and configuration
 * @module constants
 */

// ============================================================================
// Configuration
// ============================================================================

export const CONFIG = {
  DEFAULT_PORT: 5555,
  MONACO_CDN: 'https://unpkg.com/monaco-editor@0.45.0/min/vs',
  NOTIFICATION_DURATION: 4000
};

// ============================================================================
// Enums
// ============================================================================

export const THEME = {
  DARK: 'dark',
  LIGHT: 'light'
};

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  THEME: 'gh-here-theme'
};

// ============================================================================
// Keyboard Shortcuts (alpha-sorted)
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  ESCAPE: 'Escape',
  GO_UP: 'h',
  HELP: '?',
  NAV_DOWN: 'j',
  NAV_UP: 'k',
  OPEN: 'o',
  REFRESH: 'r',
  SEARCH: ['/', 's'],
  SHOW_DIFF: 'd',
  THEME_TOGGLE: 't',
  TOGGLE_GITIGNORE: 'i'
};

// ============================================================================
// Monaco Editor Options (for FileViewer read-only mode)
// ============================================================================

export const EDITOR_OPTIONS = {
  automaticLayout: true,
  bracketPairColorization: { enabled: true },
  folding: true,
  foldingHighlight: true,
  foldingStrategy: 'auto',
  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  fontSize: 12,
  guides: {
    bracketPairs: true,
    indentation: true
  },
  lineHeight: 20,
  lineNumbers: 'on',
  minimap: { enabled: false },
  padding: { top: 16, bottom: 16 },
  renderLineHighlight: 'line',
  scrollBeyondLastLine: false,
  selectOnLineNumbers: true,
  showFoldingControls: 'mouseover',
  wordWrap: 'off'
};
