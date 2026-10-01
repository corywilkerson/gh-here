/** Go to file: a ⌘K dialog that searches paths on the server as you type. */
import { api } from '../lib/api.js';
import { escapeHtml, notify } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { settings } from '../settings.js';

export class FileSearch {
  constructor(navigate) {
    this.navigate = navigate;
    this.dialog = document.querySelector('#search-dialog');
    this.input = document.querySelector('#search-input');
    this.results = document.querySelector('#search-results');
    this.status = document.querySelector('#search-status');
    this.input.addEventListener('input', () => {
      clearTimeout(this.timer);
      this.controller?.abort();
      this.results.replaceChildren();
      this.status.textContent = 'Searching…';
      this.timer = setTimeout(() => this.search(), 120);
    });
    this.dialog.addEventListener('close', () => {
      clearTimeout(this.timer);
      this.controller?.abort();
    });
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.dialog.close();
      const result = event.target.closest('[data-result]');
      if (result) this.choose(result.dataset.result);
    });
    this.dialog.addEventListener('keydown', (event) => {
      const rows = [...this.results.querySelectorAll('button')];
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const index = rows.indexOf(document.activeElement);
        const next =
          event.key === 'ArrowDown'
            ? Math.min(index + 1, rows.length - 1)
            : Math.max(index - 1, 0);
        rows[next]?.focus();
      }
      if (
        event.key === 'Enter' &&
        document.activeElement === this.input &&
        rows.length
      ) {
        event.preventDefault();
        this.choose(rows[0].dataset.result);
      }
    });
    document
      .querySelector('#close-search')
      .addEventListener('click', () => this.dialog.close());
  }

  open() {
    this.input.value = '';
    this.results.innerHTML =
      '<div class="search-empty">Jump straight to a file.<br><span>Type a name or part of its path.</span></div>';
    this.status.textContent = 'Search your working directory';
    this.dialog.showModal();
    this.input.focus();
  }

  choose(path) {
    this.dialog.close();
    this.navigate(path);
  }

  async search() {
    const query = this.input.value.trim();
    if (!query) {
      this.status.textContent = 'Search your working directory';
      return;
    }
    this.controller = new AbortController();
    try {
      const data = await api(
        'search',
        { q: query, ignored: settings.showIgnored },
        this.controller.signal,
      );
      const results = data.results;
      this.results.innerHTML = results.length
        ? results
            .map(
              (item) =>
                `<button class="search-result" data-result="${escapeHtml(item.path)}">${icon(item.isDirectory ? 'folder' : 'file')}<span>${escapeHtml(item.name)}<small>${escapeHtml(item.path)}</small></span>${icon('chevron')}</button>`,
            )
            .join('')
        : '<div class="search-empty">No matching files</div>';
      this.status.textContent = `${results.length} results${data.truncated ? ' · search limited, try a more specific path' : ''}`;
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.status.textContent = error.message;
        notify(error.message);
      }
    }
  }
}
