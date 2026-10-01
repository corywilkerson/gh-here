/** The top bar: the address bar's breadcrumbs, view controls, and theme. */
import { $, escapeHtml as esc } from '../lib/dom.js';
import { fileUrl } from '../lib/format.js';
import { icon } from '../lib/icons.js';
import { settings } from '../settings.js';

export function initTopbar() {
  $('#mark').innerHTML = icon('terminal');
  $('#menu').innerHTML = icon('sidebar');
  $('#refresh').innerHTML = icon('refresh');
  if (!/Mac|iPhone|iPad/.test(navigator.platform))
    $('.search-trigger kbd').textContent = 'Ctrl K';
  applyTheme();
}

export function applyTheme() {
  const next = settings.theme === 'light' ? 'dark' : 'light';
  const button = $('#theme');
  document.documentElement.dataset.theme = settings.theme;
  button.innerHTML = icon(settings.theme === 'light' ? 'moon' : 'sun');
  button.setAttribute('aria-label', `Switch to ${next} theme`);
  button.title = `Switch to ${next} theme`;
}

/**
 * Breadcrumbs read like a path: `~/code/project / lib / server.js`.
 * `trail` appends plain labels after the path, like "Changes".
 */
export function setCrumbs(info, path, trail = []) {
  const parts = path.split('/').filter(Boolean);
  const parent = info.displayDirectory.split('/').slice(0, -1).join('/');
  const links = parts.map((part, index) => {
    const target = parts.slice(0, index + 1).join('/');
    const current = index === parts.length - 1 && !trail.length;
    return `<span class="sep">/</span><a href="${fileUrl(target)}" data-path="${esc(target)}"${current ? ' aria-current="page"' : ''}>${esc(part)}</a>`;
  });
  const labels = trail.map(
    (text) => `<span class="sep">/</span><span>${esc(text)}</span>`,
  );
  $('#crumbs').innerHTML = [
    `<a class="root" href="/" data-path="" title="${esc(info.directory)}"><span class="parent">${esc(parent)}/</span>${esc(info.name)}</a>`,
    ...links,
    ...labels,
  ].join('');
}

/** Controls the current view adds to the top bar, as markup. */
export function setViewActions(markup = '') {
  $('#view-actions').innerHTML = markup;
}
