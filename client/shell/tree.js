/**
 * The sidebar tree, built on Pierre Trees. Browsing loads folders lazily as
 * they open; reviewing shows only changed files with their Git status.
 */
import { FileTree } from '@pierre/trees';

import { api } from '../lib/api.js';
import { notify } from '../lib/dom.js';
import { settings } from '../settings.js';

/** Roomier rows for fingers. */
const ROW_HEIGHT = matchMedia('(pointer: coarse)').matches ? 36 : 28;

export class DirectoryTree {
  constructor({ container, navigate }) {
    this.container = container;
    this.navigate = navigate;
    this.loaded = new Set();
    this.loading = new Map();
    this.selectionId = 0;
    this.generation = 0;
    this.synchronizing = false;
  }

  async reset() {
    this.changesMode = false;
    const generation = ++this.generation;
    this.model?.cleanUp();
    this.container.replaceChildren();
    this.loaded.clear();
    this.loading.clear();
    const data = await api('directory', { ignored: settings.showIgnored });
    if (generation !== this.generation) return;
    this.model = new FileTree({
      paths: data.items.map(
        (item) => item.path + (item.isDirectory ? '/' : ''),
      ),
      initialExpansion: 'closed',
      flattenEmptyDirectories: false,
      itemHeight: ROW_HEIGHT,
      icons: { set: 'complete', colored: true },
      fileTreeSearchMode: 'hide-non-matches',
      onSelectionChange: (paths) => {
        if (this.synchronizing || !paths.length) return;
        const selected = paths[paths.length - 1];
        this.navigate(selected);
      },
    });
    this.model.render({ containerWrapper: this.container });
    this.model.subscribe(() => {
      for (const row of this.model.getVisibleRows(
        0,
        this.model.getVisibleCount(),
      )) {
        if (row.kind === 'directory' && row.isExpanded) this.load(row.path);
      }
    });
    this.loaded.add('');
  }

  load(path) {
    if (this.changesMode) return Promise.resolve();
    if (this.loaded.has(path)) return Promise.resolve();
    if (this.loading.has(path)) return this.loading.get(path);
    const generation = this.generation;
    const loading = api('directory', { path, ignored: settings.showIgnored })
      .then((data) => {
        if (generation !== this.generation) return;
        this.loaded.add(path);
        this.model.batch(
          data.items.map((item) => ({
            type: 'add',
            path: item.path + (item.isDirectory ? '/' : ''),
          })),
        );
      })
      .catch((error) => {
        if (generation === this.generation) notify(error.message);
      })
      .finally(() => {
        if (generation === this.generation) this.loading.delete(path);
      });
    this.loading.set(path, loading);
    return loading;
  }

  async select(path) {
    const generation = this.generation;
    const selection = ++this.selectionId;
    const parts = path.split('/').filter(Boolean);
    this.synchronizing = true;
    try {
      for (let i = 1; i < parts.length; i++) {
        const parent = `${parts.slice(0, i).join('/')}/`;
        await this.load(parent);
        if (generation !== this.generation || selection !== this.selectionId)
          return;
        this.model.getItem(parent)?.expand();
      }
      for (const selected of this.model.getSelectedPaths())
        this.model.getItem(selected)?.deselect();
      const item = this.model.getItem(path) || this.model.getItem(`${path}/`);
      if (item) {
        item.select();
        this.model.scrollToPath(item.getPath(), { focus: false });
      }
    } finally {
      if (selection === this.selectionId) this.synchronizing = false;
    }
  }

  showChanges(changes, navigate) {
    this.changesMode = true;
    ++this.generation;
    this.model?.cleanUp();
    this.container.replaceChildren();
    this.loaded.clear();
    this.loading.clear();
    const statuses = {
      A: 'added',
      D: 'deleted',
      M: 'modified',
      R: 'renamed',
      U: 'modified',
    };
    this.model = new FileTree({
      paths: changes.map((change) => change.path),
      gitStatus: changes.map((change) => ({
        path: change.path,
        status: statuses[change.status],
      })),
      initialExpansion: 'open',
      flattenEmptyDirectories: true,
      itemHeight: ROW_HEIGHT,
      icons: { set: 'complete', colored: true },
      fileTreeSearchMode: 'hide-non-matches',
      onSelectionChange: (paths) => {
        if (this.synchronizing || !paths.length) return;
        const selected = paths[paths.length - 1];
        if (changes.some((change) => change.path === selected))
          navigate(selected);
      },
    });
    this.model.render({ containerWrapper: this.container });
  }

  filter(query) {
    this.model?.setSearch(query || null);
  }
}
