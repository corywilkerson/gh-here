/** Inline SVG icons (24px grid, stroked) and the icon button built from them. */

const paths = {
  terminal: '<path d="m5 6 5 6-5 6m8 0h6"/>',
  folder:
    '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/>',
  tree: '<path d="M21 6H8m13 6h-8m8 6h-8M3 6v4a2 2 0 0 0 2 2h3m-5-2v6a2 2 0 0 0 2 2h3"/>',
  diff: '<circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7M11 18H8a2 2 0 0 1-2-2V9"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon: '<path d="M20.5 13A9 9 0 0 1 11 3.5 9 9 0 1 0 20.5 13Z"/>',
  refresh:
    '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1"/>',
  book: '<path d="M12 5v16M12 5C8 2 3 3 2 4v16c3-2 6-2 10 1 4-3 7-3 10-1V4c-1-1-6-2-10 1Z"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  unfold: '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
  fold: '<path d="m7 20 5-5 5 5M7 4l5 5 5-5"/>',
  split:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>',
  unified:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 12h18"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  sidebar:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  wrap: '<path d="M3 6h18M3 12h14a4 4 0 0 1 0 8h-4m3-3-3 3 3 3M3 18h5"/>',
};

export function icon(name, className = '') {
  return `<svg class="icon ${className}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
}

/** A button that dispatches `action` through the app's click handler. */
export function iconButton(
  action,
  label,
  { icon: name = action, pressed } = {},
) {
  const toggle = pressed === undefined ? '' : ` aria-pressed="${pressed}"`;
  return `<button class="icon-button" data-action="${action}" aria-label="${label}" title="${label}"${toggle}>${icon(name)}</button>`;
}
