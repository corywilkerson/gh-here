/**
 * Pairs each local change with its two versions: HEAD (from Git) and the
 * working tree (from disk). This is everything the Changes view renders.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const { httpError } = require('./http-error');

// One review loads at most this much file content; later files are skipped.
const BUDGET_BYTES = 32 * 1024 * 1024;
const CONCURRENCY = 8;

async function mapLimit(items, limit, map) {
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await map(items[index]);
    }
  };
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

function createReview({ workspace, git }) {
  async function changes() {
    const result = await git.changes();
    if (!result.available)
      throw httpError(404, 'Git changes are unavailable in this directory.');
    return result;
  }

  async function read(change) {
    const { path: name, status, untracked } = change;
    let newFile = { path: name, kind: 'text', contents: '' };
    if (status !== 'D') {
      await workspace.resolve(name);
      const stats = await fs.lstat(path.join(await workspace.root(), name));
      if (stats.isDirectory() || stats.isSymbolicLink())
        return { path: name, status, untracked, unsupported: true };
      newFile = await workspace.read(name);
    }
    const oldFile = await git.original(change);
    return { path: name, status, untracked, oldFile, newFile };
  }

  /** One changed file with both versions. */
  async function file(filePath) {
    const change = (await changes()).changes.find(
      (item) => item.path === filePath,
    );
    if (!change)
      throw httpError(
        404,
        'This file has no local changes. Refresh to see the latest files.',
      );
    return read(change);
  }

  /** Every changed file with both versions, within the byte budget. */
  async function all() {
    const result = await changes();
    let budget = BUDGET_BYTES;
    const files = await mapLimit(
      result.changes,
      CONCURRENCY,
      async (change) => {
        if (budget <= 0) {
          const { path: name, status, untracked } = change;
          return { path: name, status, untracked, tooLarge: true };
        }
        const loaded = await read(change);
        budget -=
          (loaded.oldFile?.contents?.length ?? 0) +
          (loaded.newFile?.contents?.length ?? 0);
        return loaded;
      },
    );
    return { branch: result.branch, files };
  }

  return { file, all };
}

module.exports = { createReview };
