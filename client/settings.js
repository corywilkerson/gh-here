/**
 * Preferences that survive reloads, and the breakpoint they depend on.
 * This is the only module that touches localStorage.
 */

const STORAGE_KEYS = {
  theme: 'gh-here-theme',
  wrap: 'gh-here-wrap',
  diffStyle: 'gh-here-diff-style',
  showIgnored: 'gh-here-ignored',
  sidebar: 'gh-here-sidebar',
};

const matches = (query) => matchMedia(query).matches;

function read(name, fallback) {
  try {
    return localStorage.getItem(STORAGE_KEYS[name]) ?? fallback;
  } catch {
    return fallback;
  }
}

export const settings = {
  theme: read(
    'theme',
    matches('(prefers-color-scheme: dark)') ? 'dark' : 'light',
  ),
  wrap: read('wrap', 'false') === 'true',
  // Split diffs need room, so tablets and phones start unified.
  diffStyle: read(
    'diffStyle',
    matches('(max-width: 1100px)') ? 'unified' : 'split',
  ),
  showIgnored: read('showIgnored', 'false') === 'true',
  sidebar: read('sidebar', 'shown'),
};

export function save(name, value) {
  settings[name] = value;
  try {
    localStorage.setItem(STORAGE_KEYS[name], String(value));
  } catch {
    // Private windows can refuse storage; the setting still applies this session.
  }
}

/** Phones: the sidebar becomes a drawer, diffs are unified, code is tighter. */
export const narrow = matchMedia('(max-width: 720px)');

/** Must match --diffs-line-height in styles/views.css. */
export const lineHeight = () => (narrow.matches ? 21 : 22);

export const diffStyle = () =>
  narrow.matches ? 'unified' : settings.diffStyle;

/** Options every Pierre viewer shares. */
export const viewerOptions = () => ({
  theme: { light: 'pierre-light', dark: 'pierre-dark' },
  themeType: settings.theme,
  overflow: settings.wrap ? 'wrap' : 'scroll',
});
