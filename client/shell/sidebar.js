/**
 * The sidebar: view tabs, the filter, the tree, and diff stats.
 * On phones it is a drawer over the page; elsewhere a panel you can hide.
 */
import { $, escapeHtml as esc } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { narrow, save, settings } from '../settings.js';

let drawerOpen = false;

export function initSidebar({ tree, onShowIgnored }) {
  $('#files-tab').innerHTML = `${icon('tree')}<span>Files</span>`;
  $('#changes-tab').innerHTML = `${icon('diff')}<span>Changes</span>`;
  $('#ignored-icon').innerHTML = icon('eye');
  $('#filter-icon').innerHTML = icon('search');

  const ignored = $('#ignored');
  ignored.checked = settings.showIgnored;
  ignored.addEventListener('change', () => {
    save('showIgnored', ignored.checked);
    onShowIgnored();
  });
  $('#filter').addEventListener('input', (event) =>
    tree.filter(event.target.value),
  );
  narrow.addEventListener('change', closeDrawer);
  sync();
}

function sync() {
  const open = narrow.matches ? drawerOpen : settings.sidebar !== 'hidden';
  document.body.dataset.sidebar = open ? 'open' : 'closed';
  $('#menu').setAttribute('aria-expanded', String(open));
}

export function toggleSidebar() {
  if (narrow.matches) drawerOpen = !drawerOpen;
  else save('sidebar', settings.sidebar === 'hidden' ? 'shown' : 'hidden');
  sync();
}

export function closeDrawer() {
  drawerOpen = false;
  sync();
}

/** Switches the tabs and controls between browsing files and reviewing changes. */
export function setMode(changes) {
  const filter = $('#filter');
  if (filter.dataset.mode !== String(changes)) filter.value = '';
  filter.dataset.mode = String(changes);
  $('.ignored-toggle').hidden = changes;
  for (const [tab, active] of [
    [$('#files-tab'), !changes],
    [$('#changes-tab'), changes],
  ]) {
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-current', active ? 'page' : 'false');
  }
  closeDrawer();
}

export function setChangeCount(count) {
  const tab = $('#changes-tab');
  tab.querySelector('.count')?.remove();
  if (count)
    tab.insertAdjacentHTML(
      'beforeend',
      `<span class="count">${count.toLocaleString()}</span>`,
    );
}

/** Shows the review's totals, or hides the panel when `summary` is null. */
export function showStats(summary) {
  $('#stats').hidden = !summary;
  if (!summary) return;
  const rows = [
    ['Branch', esc(summary.branch)],
    ['Files', summary.files.toLocaleString()],
    [
      'Additions',
      `<span class="added">+${summary.additions.toLocaleString()}</span>`,
    ],
    [
      'Deletions',
      `<span class="deleted">−${summary.deletions.toLocaleString()}</span>`,
    ],
  ];
  $('#stats-list').innerHTML = rows
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join('');
}
