/** The Files route: a directory listing or a single file, from `?path=`. */
import { api } from '../lib/api.js';
import { notify } from '../lib/dom.js';
import { settings } from '../settings.js';
import { renderDirectory } from './directory.js';
import { renderFile } from './file.js';

export async function mountFiles(context) {
  const { main, params, signal, tree, info } = context;
  if (tree.changesMode) await tree.reset();
  const entry = await api(
    'entry',
    { path: params.get('path') || '', ignored: settings.showIgnored },
    signal,
  );
  signal.throwIfAborted();
  const directory = entry.kind === 'directory';
  main.dataset.view = directory ? 'directory' : 'file';
  tree.select(entry.path).catch((error) => notify(error.message));
  const view = directory
    ? await renderDirectory(entry, context)
    : await renderFile(entry, context);
  return { title: entry.path || info.name, ...view };
}
