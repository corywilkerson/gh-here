/** One file: highlighted code, a Markdown preview, an image, or a download. */
import { copy, escapeHtml as esc } from '../lib/dom.js';
import { plural, sizeLabel } from '../lib/format.js';
import { icon, iconButton } from '../lib/icons.js';
import { settings } from '../settings.js';

export async function renderFile(file, { main, params, signal, reload }) {
  const isMarkdown = /\.(md|markdown)$/i.test(file.path);
  const preview = isMarkdown && params.get('mode') !== 'code';
  main.innerHTML = headerMarkup(file, { isMarkdown, preview });
  const body = main.querySelector('#file-body');
  const actions = {
    'copy-path': () => copy(file.path),
    'copy-content': () => copy(file.contents),
    preview: () => setMode('preview', reload),
    code: () => setMode('code', reload),
  };

  if (file.kind === 'image') body.innerHTML = imageMarkup(file);
  else if (file.kind !== 'text') body.innerHTML = unsupportedMarkup(file);
  else if (preview) {
    const markdown = await import('../lib/markdown.js');
    signal.throwIfAborted();
    markdown.renderMarkdown(body, file.contents, file.path);
  } else {
    const { renderCode } = await import('../lib/code-viewer.js');
    signal.throwIfAborted();
    const viewer = renderCode(body, file, {
      scrollRoot: main,
      selected: selectionFromHash(),
      onSelect: (range) =>
        history.replaceState(
          null,
          '',
          location.pathname + location.search + hashFor(range),
        ),
    });
    return {
      actions,
      update() {
        viewer.update();
        main
          .querySelector('[data-action="wrap"]')
          ?.setAttribute('aria-pressed', String(settings.wrap));
      },
      destroy: viewer.destroy,
    };
  }
  return { actions };
}

function setMode(mode, reload) {
  const url = new URL(location.href);
  url.searchParams.set('mode', mode);
  history.replaceState(null, '', url);
  reload();
}

/** `#L12` or `#L12-L20`, as GitHub links lines. */
function selectionFromHash() {
  const match = location.hash.match(/^#L(\d+)(?:-L(\d+))?$/);
  return match
    ? { start: Number(match[1]), end: Number(match[2] || match[1]) }
    : null;
}

function hashFor(range) {
  if (!range) return '';
  return `#L${range.start}${range.end !== range.start ? `-L${range.end}` : ''}`;
}

function headerMarkup(file, { isMarkdown, preview }) {
  const text = file.kind === 'text';
  const lines = text
    ? file.contents.split('\n').length - Number(file.contents.endsWith('\n'))
    : 0;
  const query = encodeURIComponent(file.path);
  return `
    <section class="file-panel">
      <header class="file-toolbar">
        <div class="file-identity">
          <h1 title="${esc(file.path)}">${esc(file.name)}</h1>
          <span class="meta">${text ? `${plural(lines, 'line')} · ` : ''}${sizeLabel(file.size)}</span>
        </div>
        <div class="actions">
          ${
            isMarkdown
              ? `<div class="segmented">
                  <button data-action="preview" class="${preview ? 'selected' : ''}">Preview</button>
                  <button data-action="code" class="${preview ? '' : 'selected'}">Code</button>
                </div>`
              : ''
          }
          ${text && !preview ? iconButton('wrap', 'Wrap lines', { pressed: settings.wrap }) : ''}
          ${iconButton('copy-path', 'Copy relative path', { icon: 'folder' })}
          ${text ? iconButton('copy-content', 'Copy file contents', { icon: 'copy' }) : ''}
          ${text ? `<a class="text-button" href="/raw?path=${query}" target="_blank" rel="noopener">Raw</a>` : ''}
          <a class="icon-button" href="/download?path=${query}" aria-label="Download file" title="Download file">${icon('download')}</a>
        </div>
      </header>
      <div id="file-body" class="${preview ? 'markdown-body' : 'code-body'}"></div>
    </section>`;
}

function imageMarkup(file) {
  return `<div class="image-preview"><img src="/image?path=${encodeURIComponent(file.path)}" alt="${esc(file.name)}"></div>`;
}

function unsupportedMarkup(file) {
  const binary = file.kind === 'binary';
  return `
    <div class="empty">
      ${icon(binary ? 'file' : 'book')}
      <h2>${binary ? 'Binary file' : 'A little too large to preview'}</h2>
      <p>${binary ? 'Download this file to open it in its native application.' : 'Previews support text files up to 2 MB and 20,000 lines.'}</p>
      <a class="button" href="/download?path=${encodeURIComponent(file.path)}">${icon('download')}Download file</a>
    </div>`;
}
