/** A directory as a list of rows, with its README rendered below. */
import { api } from '../lib/api.js';
import { escapeHtml as esc } from '../lib/dom.js';
import { dateLabel, fileUrl, plural, sizeLabel } from '../lib/format.js';
import { icon } from '../lib/icons.js';

const isReadme = (item) =>
  !item.isDirectory && /^readme(?:\.md|\.markdown)?$/i.test(item.name);

export async function renderDirectory(directory, { main, info, signal }) {
  const readme = directory.items.find(isReadme);
  main.innerHTML =
    listMarkup(directory, info) + (readme ? readmeMarkup(readme) : '');
  if (!readme) return {};
  const [file, markdown] = await Promise.all([
    api('file', { path: readme.path }, signal),
    import('../lib/markdown.js'),
  ]);
  signal.throwIfAborted();
  const container = main.querySelector('#readme-content');
  if (file.kind === 'text')
    markdown.renderMarkdown(container, file.contents, readme.path);
  else container.textContent = 'This README is too large to preview.';
  return {};
}

function listMarkup(directory, info) {
  const folders = directory.items.filter((item) => item.isDirectory).length;
  const files = directory.items.length - folders;
  const counts = [
    folders && plural(folders, 'folder'),
    files && plural(files, 'file'),
  ];
  return `
    <section class="file-list" aria-label="Directory contents">
      <header class="card-header">
        ${icon('folder')}<strong>${esc(directory.path.split('/').pop() || info.name)}</strong>
        <span class="meta">${counts.filter(Boolean).join(' · ')}</span>
      </header>
      ${directory.items.map(rowMarkup).join('')}
      ${directory.items.length ? '' : '<div class="empty">This directory is empty.</div>'}
    </section>`;
}

function rowMarkup(item) {
  return `
    <a class="file-row" href="${fileUrl(item.path)}" data-path="${esc(item.path)}">
      ${icon(item.isDirectory ? 'folder' : 'file', item.isDirectory ? 'folder-icon' : '')}
      <span class="name">${esc(item.name)}${item.isLink ? ' <small>link</small>' : ''}</span>
      <span class="size">${item.isDirectory ? '' : sizeLabel(item.size)}</span>
      <time datetime="${esc(item.modified)}" title="${esc(new Date(item.modified).toLocaleString())}">${dateLabel(item.modified)}</time>
    </a>`;
}

function readmeMarkup(readme) {
  return `
    <section class="readme">
      <header class="card-header">
        ${icon('book')}<a href="${fileUrl(readme.path)}" data-path="${esc(readme.path)}">${esc(readme.name)}</a>
      </header>
      <article class="markdown-body" id="readme-content"></article>
    </section>`;
}
