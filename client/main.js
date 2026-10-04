/**
 * Entry point. Builds the shell, starts the router, and routes every
 * interaction: links carry `data-path`, buttons carry `data-action`.
 */
import './styles/index.css';

import { api } from './lib/api.js';
import { $, escapeHtml as esc, notify } from './lib/dom.js';
import { createRouter } from './router.js';
import { narrow, save, settings } from './settings.js';
import { FileSearch } from './shell/search.js';
import {
  closeDrawer,
  initSidebar,
  setChangeCount,
  toggleSidebar,
} from './shell/sidebar.js';
import { applyTheme, initTopbar } from './shell/topbar.js';
import { DirectoryTree } from './shell/tree.js';
import { watchChanges } from './watch.js';

let info;
let router;
const tree = new DirectoryTree({
  container: $('#tree'),
  navigate: (path) => router.open(path),
});
const search = new FileSearch((path) => router.open(path));

/** App-wide actions. Views add their own through `view.actions`. */
const actions = {
  async refresh() {
    await refresh();
    notify('Refreshed');
  },
  theme() {
    save('theme', settings.theme === 'light' ? 'dark' : 'light');
    applyTheme();
    router.view.update?.();
  },
  wrap() {
    save('wrap', !settings.wrap);
    router.view.update?.();
  },
  split: () => setDiffStyle('split'),
  unified: () => setDiffStyle('unified'),
  'toggle-sidebar': toggleSidebar,
  'close-drawer': closeDrawer,
  'go-to-file': () => search.open(),
};

function setDiffStyle(style) {
  save('diffStyle', style);
  router.view.update?.();
}

async function refresh() {
  $('#filter').value = '';
  await tree.reset();
  await Promise.all([router.load(), refreshChangeCount()]);
}

/** Updates the Changes tab's badge, and returns what it counted. */
async function refreshChangeCount() {
  if (!info.gitAvailable) return { changes: [] };
  const data = await api('changes');
  setChangeCount(data.changes.length);
  return data;
}

async function runAction(name, element) {
  const action = actions[name] ?? router.view.actions?.[name];
  if (!action) return;
  try {
    await action(element);
  } catch (error) {
    notify(error.message);
  }
  router.refreshChrome();
}

document.addEventListener('click', (event) => {
  const modified =
    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  if (modified || event.button !== 0) return;
  const link = event.target.closest('a[data-path]');
  if (link) {
    event.preventDefault();
    router.open(link.dataset.path, new URL(link.href).hash);
  } else if (event.target.closest('#changes-tab')) {
    event.preventDefault();
    router.openChanges();
  } else {
    const control = event.target.closest('[data-action]');
    if (control) runAction(control.dataset.action, control);
  }
});

const KEYS = { j: 'next', k: 'previous', Escape: 'close-drawer' };

document.addEventListener('keydown', (event) => {
  const typing = event.target.matches('input, textarea, [contenteditable]');
  const command = event.metaKey || event.ctrlKey;
  if ((event.key === 'k' && command) || (event.key === '/' && !typing)) {
    event.preventDefault();
    if (!search.dialog.open) search.open();
  } else if (KEYS[event.key] && !typing && !command) {
    runAction(KEYS[event.key]);
  }
});

window.addEventListener('popstate', () => router.load());
narrow.addEventListener('change', () => {
  router.view.update?.();
  router.refreshChrome();
});

async function start() {
  initTopbar();
  initSidebar({
    tree,
    onShowIgnored: () => refresh().catch((error) => notify(error.message)),
  });
  info = await api('info');
  router = createRouter({ info, tree });
  $('#changes-tab').hidden = !info.gitAvailable;
  $('#version').textContent = `v${info.version}`;
  const [, changed] = await Promise.all([tree.reset(), refreshChangeCount()]);
  // Work in progress is usually what you came to see.
  if (!location.search && changed.changes.length)
    history.replaceState(null, '', '/?view=changes');
  await router.load();
  if (info.gitAvailable) watchChanges(changed.stamp, onChangesMoved);
}

/** Keeps the count, and an open review, in step with the working tree. */
async function onChangesMoved(data) {
  setChangeCount(data.changes.length);
  await router.view.refresh?.();
  router.refreshChrome();
}

start().catch((error) => {
  $('#main').innerHTML = `<div class="empty error">${esc(error.message)}</div>`;
});
