/**
 * The Changes route: every changed file in one scrolling review, like a
 * pull request. Pierre's CodeView virtualizes it; the tree and URL follow
 * whichever file is at the top.
 */
import { CodeView } from '@pierre/diffs';

import { api } from '../lib/api.js';
import { icon, iconButton } from '../lib/icons.js';
import { diffStyle, lineHeight, settings, viewerOptions } from '../settings.js';
import { buildReview, sameChange } from './changes-model.js';

export async function mountChanges(context) {
  const review = new Review(context);
  await review.load(context.params.get('path'));
  return review;
}

class Review {
  title = 'Changes';

  constructor({ main, tree, signal, closeDrawer, reload }) {
    this.main = main;
    this.reload = reload;
    this.tree = tree;
    this.signal = signal;
    this.closeDrawer = closeDrawer;
    this.actions = {
      'toggle-file': (button) => this.toggle(button.dataset.file),
      'toggle-all': () => this.setCollapsed(this.ids, !this.allCollapsed),
      next: () => this.step(1),
      previous: () => this.step(-1),
    };
  }

  async load(selectedPath) {
    this.main.innerHTML = '<div class="empty">Reading local changes…</div>';
    const data = await api('diff', {}, this.signal);
    this.signal.throwIfAborted();
    const { items } = this.apply(buildReview(data));
    if (!items.length) {
      this.main.innerHTML =
        '<div class="empty"><h2>All caught up.</h2><p>No local changes in this directory.</p></div>';
      return;
    }
    this.main.innerHTML = '<div id="change-content" class="review"></div>';
    this.root = this.main.querySelector('#change-content');
    this.view = new CodeView(this.options());
    this.view.setup(this.root);
    this.view.setItems(items);
    this.view.subscribeToScroll((top) => this.follow(top));
    if (this.ids.includes(selectedPath)) this.reveal(selectedPath);
  }

  /** Adopts a freshly built review: notes, totals, order and the tree. */
  apply(review) {
    const ids = review.items.map((item) => item.id);
    if (ids.join('\0') !== this.ids?.join('\0'))
      this.tree.showChanges(review.changes, (path) => this.reveal(path));
    this.ids = ids;
    this.notes = review.notes;
    this.summary = review.summary;
    this.changes = new Map(
      review.changes.map((change) => [change.path, change]),
    );
    return review;
  }

  /**
   * Picks up edits made since the review opened, in place: the scroll position
   * and collapsed files stay, and only files that changed re-render.
   */
  async refresh() {
    const data = await api('diff', {}, this.signal);
    this.signal.throwIfAborted();
    const previous = this.changes;
    const review = buildReview(data);
    // Appearing from or disappearing into "All caught up" needs a fresh render.
    if (!this.view || !review.items.length) return this.reload();
    this.apply(review);
    this.view.setItems(
      review.items.map((item) => {
        const shown = this.view.getItem(item.id);
        if (!shown) return item;
        if (sameChange(previous.get(item.id), this.changes.get(item.id)))
          return shown;
        return {
          ...item,
          collapsed: shown.collapsed,
          version: shown.version + 1,
        };
      }),
    );
    return undefined;
  }

  options() {
    return {
      ...viewerOptions(),
      diffStyle: diffStyle(),
      diffIndicators: 'bars',
      lineDiffType: 'word-alt',
      stickyHeaders: true,
      // A 1px gap, drawn as a divider in CSS, separates files like a list.
      layout: { paddingTop: 0, paddingBottom: 0, gap: 1 },
      itemMetrics: { lineHeight: lineHeight() },
      renderHeaderPrefix: (fileDiff, { item }) => chevron(item),
      renderHeaderFilenameSuffix: (fileDiff, { item }) =>
        this.notes.get(item.id),
    };
  }

  /** Controls for the top bar. */
  toolbar() {
    if (!this.view) return '';
    const collapsed = this.allCollapsed;
    const style = diffStyle();
    return `
      <div class="segmented" role="group" aria-label="Diff layout">
        ${iconButton('split', 'Split', { pressed: style === 'split' })}
        ${iconButton('unified', 'Unified', { pressed: style === 'unified' })}
      </div>
      ${iconButton('wrap', 'Wrap lines', { pressed: settings.wrap })}
      ${iconButton('toggle-all', collapsed ? 'Expand all files' : 'Collapse all files', { icon: collapsed ? 'unfold' : 'fold' })}`;
  }

  get allCollapsed() {
    return Boolean(
      this.view && this.ids.every((id) => this.view.getItem(id).collapsed),
    );
  }

  toggle(id) {
    this.setCollapsed([id], !this.view.getItem(id).collapsed);
  }

  setCollapsed(ids, collapsed) {
    if (!this.view) return;
    for (const id of ids) {
      const item = this.view.getItem(id);
      this.view.updateItem({ ...item, collapsed, version: item.version + 1 });
    }
  }

  /** Scrolls to a file picked in the tree or with j/k. */
  reveal(path) {
    this.current = path;
    this.setUrl(path);
    this.view?.scrollTo({ type: 'item', id: path, align: 'start' });
    this.closeDrawer();
  }

  step(delta) {
    if (!this.view) return;
    const index = this.ids.indexOf(this.current) + delta;
    const path = this.ids[Math.max(0, Math.min(index, this.ids.length - 1))];
    this.reveal(path);
    this.tree.select(path);
  }

  /** Keeps the tree and URL on whichever file is at the top of the review. */
  follow(top) {
    const { scrollTop, clientHeight, scrollHeight } = this.root;
    // At the very bottom the last files can't reach the top; keep the reader's pick.
    if (scrollTop + clientHeight >= scrollHeight - 2) return;
    const path =
      this.ids.findLast((id) => this.view.getTopForItem(id) <= top + 1) ??
      this.ids[0];
    if (path === this.current) return;
    this.current = path;
    this.setUrl(path);
    this.tree.select(path);
  }

  setUrl(path) {
    history.replaceState(
      null,
      '',
      `/?${new URLSearchParams({ view: 'changes', path })}`,
    );
  }

  update() {
    this.view?.setOptions(this.options());
  }

  destroy() {
    this.view?.cleanUp();
  }
}

/** The collapse toggle that sits before each file's name. */
function chevron(item) {
  const button = document.createElement('button');
  button.className = 'collapse-toggle';
  button.innerHTML = icon('down');
  button.dataset.action = 'toggle-file';
  button.dataset.file = item.id;
  button.setAttribute('aria-expanded', String(!item.collapsed));
  button.setAttribute(
    'aria-label',
    `${item.collapsed ? 'Expand' : 'Collapse'} ${item.id}`,
  );
  return button;
}
