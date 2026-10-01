/**
 * Maps the URL to a view and mounts it into #main.
 *
 * A view module exports `mount(context)`, which resolves to a handle:
 *   { title, actions?, toolbar?(), update?(), destroy?(), summary? }
 *
 * Navigating aborts the previous view's `signal`. Views call
 * `signal.throwIfAborted()` after each await, so stale work never renders.
 */
import { $, escapeHtml as esc } from './lib/dom.js';
import { fileUrl } from './lib/format.js';
import {
  closeDrawer,
  setChangeCount,
  setMode,
  showStats,
} from './shell/sidebar.js';
import { setCrumbs, setViewActions } from './shell/topbar.js';
import { mountFiles } from './views/files.js';

export function createRouter({ info, tree }) {
  const main = $('#main');
  let controller;
  let view = {};

  async function load() {
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;
    view.destroy?.();
    view = {};

    const params = new URLSearchParams(location.search);
    const changes = params.get('view') === 'changes' && info.gitAvailable;
    setMode(changes);
    showStats(null);
    setViewActions();
    setCrumbs(
      info,
      changes ? '' : params.get('path') || '',
      changes ? ['Changes'] : [],
    );
    main.dataset.view = changes ? 'changes' : 'directory';
    main.scrollTop = 0;
    main.setAttribute('aria-busy', 'true');

    try {
      const mount = changes
        ? (await import('./views/changes.js')).mountChanges
        : mountFiles;
      signal.throwIfAborted();
      view = await mount({
        main,
        params,
        signal,
        info,
        tree,
        closeDrawer,
        reload: load,
      });
      document.title = `${view.title} · gh-here`;
      refreshChrome();
    } catch (error) {
      if (signal.aborted) return;
      main.innerHTML = `
        <div class="empty error">
          <h1>Could not open this ${changes ? 'review' : 'path'}</h1>
          <p>${esc(error.message)}</p>
          <a class="button" href="/" data-path="">Back to files</a>
        </div>`;
    } finally {
      if (!signal.aborted) main.setAttribute('aria-busy', 'false');
    }
  }

  /** Re-renders the parts of the shell that reflect the current view. */
  function refreshChrome() {
    setViewActions(view.toolbar?.());
    if (view.summary) {
      showStats(view.summary);
      setChangeCount(view.summary.files);
    }
  }

  return {
    load,
    refreshChrome,
    get view() {
      return view;
    },
    open(path, hash = '') {
      history.pushState(null, '', fileUrl(path) + hash);
      load();
    },
    openChanges() {
      history.pushState(null, '', '/?view=changes');
      load();
    },
  };
}
