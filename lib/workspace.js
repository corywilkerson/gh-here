/**
 * Read-only access to the served directory. Every path from a request goes
 * through `resolve`, which refuses anything outside the root, including
 * symlinks that point out of it.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const ignore = require('ignore');
const { MAX_FILE_BYTES, classifyBuffer } = require('./file-content');
const { httpError } = require('./http-error');

const IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
]);
const DEFAULT_IGNORES = [
  '.git/',
  'node_modules/',
  '.DS_Store',
  '.next/',
  'dist/',
  'coverage/',
];
const SEARCH_LIMITS = { results: 80, scanned: 10000, milliseconds: 2000 };
const nameOrder = new Intl.Collator(undefined, { numeric: true });

const isImage = (file) =>
  IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase());

function isWithin(root, target) {
  const relative = path.relative(root, target);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== '..' &&
      !path.isAbsolute(relative))
  );
}

function createWorkspace(workingDir) {
  const rootPromise = fs.realpath(workingDir);

  async function resolve(relative = '') {
    if (typeof relative !== 'string' || relative.includes('\0'))
      throw httpError(400, 'Invalid path.');
    const root = await rootPromise;
    const candidate = path.resolve(root, relative);
    if (!isWithin(root, candidate))
      throw httpError(403, 'This path is outside the working directory.');
    const real = await fs.realpath(candidate);
    if (!isWithin(root, real))
      throw httpError(403, 'This link points outside the working directory.');
    return {
      fullPath: real,
      relative: path.relative(root, candidate).split(path.sep).join('/'),
    };
  }

  /** The .gitignore rules that apply inside `relative`, from the root down. */
  async function ignoreRules(relative) {
    const root = await rootPromise;
    const parts = relative.split('/').filter(Boolean);
    const directories = [
      '',
      ...parts.map((_, i) => parts.slice(0, i + 1).join('/')),
    ];
    return Promise.all(
      directories.map(async (directory) => {
        const rules = ignore();
        if (!directory) rules.add(DEFAULT_IGNORES);
        try {
          rules.add(
            await fs.readFile(path.join(root, directory, '.gitignore'), 'utf8'),
          );
        } catch (error) {
          if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
        }
        return { directory, rules };
      }),
    );
  }

  /** Directory entries, folders first, minus ignored files unless asked. */
  async function list(relative, showIgnored) {
    const { fullPath, relative: normalized } = await resolve(relative);
    const rules = showIgnored ? [] : await ignoreRules(normalized);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const ignored = (itemPath, isDirectory) =>
      rules.some(({ directory, rules: matcher }) => {
        const local = directory
          ? itemPath.slice(directory.length + 1)
          : itemPath;
        return matcher.ignores(local + (isDirectory ? '/' : ''));
      });
    const items = await Promise.all(
      entries.map(async (dirent) => {
        const itemPath = path.posix.join(normalized, dirent.name);
        if (ignored(itemPath, dirent.isDirectory())) return null;
        try {
          const stats = await fs.stat((await resolve(itemPath)).fullPath);
          return {
            name: dirent.name,
            path: itemPath,
            isDirectory: stats.isDirectory(),
            isLink: dirent.isSymbolicLink(),
            size: stats.size,
            modified: stats.mtime.toISOString(),
          };
        } catch {
          // Broken or external symlinks and unreadable entries are not browsable.
          return null;
        }
      }),
    );
    return items
      .filter(Boolean)
      .sort(
        (a, b) =>
          Number(b.isDirectory) - Number(a.isDirectory) ||
          nameOrder.compare(a.name, b.name),
      );
  }

  /** Resolves a path that must be a regular file. */
  async function file(relative) {
    const resolved = await resolve(relative);
    const stats = await fs.stat(resolved.fullPath);
    if (!stats.isFile()) throw httpError(400, 'Choose a file.');
    return { ...resolved, stats };
  }

  /** A file's metadata and, for text, its contents. `kind` says which. */
  async function read(relative) {
    const { fullPath, relative: normalized, stats } = await file(relative);
    const metadata = {
      path: normalized,
      name: path.basename(normalized),
      size: stats.size,
      modified: stats.mtime.toISOString(),
    };
    if (isImage(fullPath)) return { ...metadata, kind: 'image' };
    if (stats.size > MAX_FILE_BYTES) return { ...metadata, kind: 'large' };
    return { ...metadata, ...classifyBuffer(await fs.readFile(fullPath)) };
  }

  /** Whatever lives at a path: a directory listing or a read file. */
  async function entry(relative, showIgnored) {
    const resolved = await resolve(relative);
    if (!(await fs.stat(resolved.fullPath)).isDirectory())
      return read(resolved.relative);
    return {
      kind: 'directory',
      path: resolved.relative,
      items: await list(resolved.relative, showIgnored),
    };
  }

  /** Breadth-first path search, bounded so huge trees stay responsive. */
  async function search(query, { showIgnored, cancelled }) {
    const queue = [''];
    const results = [];
    let scanned = 0;
    const deadline = Date.now() + SEARCH_LIMITS.milliseconds;
    const full = () =>
      results.length >= SEARCH_LIMITS.results ||
      scanned >= SEARCH_LIMITS.scanned;
    while (queue.length && !full() && Date.now() < deadline && !cancelled()) {
      const items = await list(queue.shift(), showIgnored).catch(() => []);
      for (const item of items) {
        scanned++;
        if (item.path.toLowerCase().includes(query)) results.push(item);
        if (item.isDirectory && !item.isLink) queue.push(item.path);
        if (full()) break;
      }
    }
    return { results, truncated: queue.length > 0 || full() };
  }

  return { root: () => rootPromise, resolve, list, file, read, entry, search };
}

module.exports = { createWorkspace, isWithin, isImage };
