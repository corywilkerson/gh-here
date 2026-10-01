/** Shared fixtures: throwaway projects, a running server, and Git. */
const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');
const express = require('express');
const { setupRoutes } = require('../lib/server');

const execute = promisify(execFile);

/** Writes `{ 'dir/name.js': contents }` under root, creating folders as needed. */
async function writeFiles(root, files) {
  for (const [name, contents] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await fs.writeFile(path.join(root, name), contents);
  }
}

/** A temp directory holding `files`. Pass the test context to delete it afterwards. */
async function createProject(files = {}, t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'gh-here-test-'));
  await writeFiles(root, files);
  t?.after(() => removeProject(root));
  return root;
}

const removeProject = (root) => fs.rm(root, { recursive: true, force: true });

/** Serves `root` on a free local port. */
async function serve(root, t) {
  const app = express();
  setupRoutes(app, root);
  const server = await new Promise((resolve, reject) => {
    const running = app.listen(0, '127.0.0.1', () => resolve(running));
    running.once('error', reject);
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  const close = () => new Promise((resolve) => server.close(resolve));
  t?.after(close);

  /** GETs a route and returns its status with the parsed JSON body. */
  async function get(route, parameters = {}) {
    const response = await fetch(
      `${url}/${route}?${new URLSearchParams(parameters)}`,
    );
    return { status: response.status, data: await response.json() };
  }

  return { url, close, get };
}

/** Runs Git in `root` as a fixed test identity. */
function git(root) {
  const run = (...args) =>
    execute(
      'git',
      ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args],
      {
        cwd: root,
      },
    ).then(({ stdout }) => stdout);
  run.commitAll = async (message = 'Commit') => {
    await run('add', '.');
    await run('commit', '-qm', message);
  };
  return run;
}

/** A Git repository holding `files`, committed as its baseline. */
async function createRepository(files, t) {
  const root = await createProject(files, t);
  const run = git(root);
  await run('init', '-q');
  await run.commitAll('Baseline');
  return { root, git: run };
}

module.exports = {
  createProject,
  createRepository,
  git,
  removeProject,
  serve,
  writeFiles,
};
