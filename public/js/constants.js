/**
 * Application constants and configuration
 */

export const CONFIG = {
  MONACO_CDN: 'https://unpkg.com/monaco-editor@0.45.0/min/vs',
  MONACO_VERSION: '0.45.0',
  EDITOR_HEIGHT: 600,
  DEFAULT_PORT: 5555,
  NOTIFICATION_DURATION: 4000
};

export const THEME = {
  DARK: 'dark',
  LIGHT: 'light'
};

export const STORAGE_KEYS = {
  THEME: 'gh-here-theme',
  DRAFT_PREFIX: 'gh-here-draft-'
};

export const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  lineNumbers: 'on',
  wordWrap: 'off',
  scrollBeyondLastLine: false,
  fontSize: 12,
  lineHeight: 20,
  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  padding: { top: 16, bottom: 16 },
  renderLineHighlight: 'line',
  selectOnLineNumbers: true,
  automaticLayout: true,
  folding: true,
  foldingHighlight: true,
  foldingStrategy: 'auto',
  showFoldingControls: 'mouseover',
  bracketPairColorization: { enabled: true },
  guides: {
    bracketPairs: true,
    indentation: true
  }
};

export const KEYBOARD_SHORTCUTS = {
  SEARCH: ['/', 's'],
  THEME_TOGGLE: 't',
  HELP: '?',
  ESCAPE: 'Escape',
  GO_UP: 'h',
  REFRESH: 'r',
  CREATE_FILE: 'c',
  EDIT_FILE: 'e',
  SHOW_DIFF: 'd',
  TOGGLE_GITIGNORE: 'i',
  NAV_DOWN: 'j',
  NAV_UP: 'k',
  OPEN: 'o'
};
