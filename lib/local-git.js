const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const fs = require('node:fs/promises');
const path = require('node:path');
const { MAX_FILE_BYTES, classifyBuffer } = require('./file-content');

const execute = promisify(execFile);

const pathExists = (file) =>
  fs.lstat(file).then(
    () => true,
    () => false,
  );

/** One letter per change, as the tree shows it: D, A, R, U or M. */
function statusFor(code, exists, renamed) {
  if (!exists) return 'D';
  if (code === '??' || code.includes('A')) return 'A';
  if (renamed) return 'R';
  return code.includes('U') ? 'U' : 'M';
}

/** A staged deletion recreated on disk appears twice; review it once, as a modification. */
function mergeRecreated(changes) {
  const byPath = new Map();
  for (const change of changes) {
    const prior = byPath.get(change.path);
    if (prior && !prior.untracked && change.untracked)
      Object.assign(change, { status: 'M', untracked: false });
    byPath.set(change.path, change);
  }
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

/** Read-only Git queries for the served directory. Every command is bounded. */
function createLocalGit(workingDir) {
  let repository;

  async function run(args, options = {}) {
    const { stdout } = await execute('git', ['--no-optional-locks', ...args], {
      cwd: workingDir,
      encoding: 'utf8',
      timeout: 5000,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
      ...options,
    });
    return stdout;
  }

  async function detect() {
    if (!repository) {
      repository = run(['rev-parse', '--show-toplevel'])
        .then(async (output) => {
          const root = await fs.realpath(output.trim());
          const directory = await fs.realpath(workingDir);
          return {
            root,
            prefix: path.relative(root, directory).split(path.sep).join('/'),
          };
        })
        .catch(() => null);
    }
    return repository;
  }

  function scopedPath(repo, gitPath) {
    if (!repo.prefix) return gitPath;
    return gitPath.startsWith(`${repo.prefix}/`)
      ? gitPath.slice(repo.prefix.length + 1)
      : null;
  }

  /** Local changes against HEAD (staged and unstaged), scoped to the served directory. */
  async function changes() {
    const repo = await detect();
    if (!repo) return { available: false, changes: [] };
    const [porcelain, branch] = await Promise.all([
      run(['status', '--porcelain=v1', '-z', '--untracked-files=all']),
      run(['symbolic-ref', '--short', '-q', 'HEAD']).catch(
        () => 'Detached HEAD',
      ),
    ]);
    const records = porcelain.split('\0');
    const found = [];
    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      if (!record) continue;
      const code = record.slice(0, 2);
      const gitPath = record.slice(3);
      const renamed = /[RC]/.test(code);
      // Renames and copies carry their original path as the next record.
      const originalGitPath = renamed ? records[++index] : gitPath;
      const relative = scopedPath(repo, gitPath);
      const previous = scopedPath(repo, originalGitPath);
      if (relative === null && previous === null) continue;
      const exists =
        relative !== null &&
        (!code.includes('D') ||
          (await pathExists(path.join(workingDir, relative))));
      // Staged, then deleted before ever being committed: nothing to review.
      if (code.includes('A') && !exists) continue;
      found.push({
        path: exists ? relative : previous || relative,
        originalPath: previous,
        gitPath,
        originalGitPath,
        status: statusFor(code, exists, renamed),
        untracked: code === '??',
      });
    }
    return {
      available: true,
      branch: branch.trim(),
      changes: mergeRecreated(found),
    };
  }

  async function original(change) {
    const name = change.originalPath || change.path;
    if (change.untracked || change.status === 'A')
      return { path: name, kind: 'text', contents: '' };
    try {
      const buffer = await run(['show', `HEAD:${change.originalGitPath}`], {
        encoding: 'buffer',
        maxBuffer: MAX_FILE_BYTES + 1,
      });
      return { path: name, ...classifyBuffer(buffer) };
    } catch (error) {
      if (error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER')
        return { path: name, kind: 'large' };
      throw new Error(
        'Could not read the last committed version of this file.',
        { cause: error },
      );
    }
  }

  return { detect, changes, original };
}

module.exports = { createLocalGit };
