const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { test } = require('node:test');
const { createLocalGit } = require('../lib/local-git');
const { createProject, createRepository, git, serve } = require('./helpers');

/** Starts a server for `root` and returns a JSON getter that expects success. */
async function api(t, root) {
  const server = await serve(root, t);
  return async (route, parameters) => {
    const { status, data } = await server.get(`api/${route}`, parameters);
    assert.equal(status, 200, `${route}: ${data.error}`);
    return data;
  };
}

const paths = (data) => data.changes.map((change) => change.path);

test('compares HEAD with the working tree, across staged and unstaged edits', async (t) => {
  const { root, git: run } = await createRepository(
    { 'hello.js': 'baseline\n' },
    t,
  );
  await fs.writeFile(path.join(root, 'hello.js'), 'staged\n');
  await run('add', 'hello.js');
  await fs.writeFile(path.join(root, 'hello.js'), 'working\n');
  const get = await api(t, root);

  assert.equal((await get('info')).gitAvailable, true);
  const { changes } = await get('changes');
  assert.deepEqual(
    changes.map((change) => change.status),
    ['M'],
  );
  const change = await get('change', { path: 'hello.js' });
  assert.equal(change.oldFile.contents, 'baseline\n');
  assert.equal(change.newFile.contents, 'working\n');
  assert.equal(
    await run('show', ':hello.js'),
    'staged\n',
    'the index is untouched',
  );
  assert.deepEqual((await get('diff')).files, [change]);
});

test('handles additions, deletions, staged renames and binary files', async (t) => {
  const { root, git: run } = await createRepository(
    {
      'old name.js': 'original\n',
      'deleted.js': 'removed\n',
      'binary.bin': Buffer.from([0, 1]),
    },
    t,
  );
  await run('mv', 'old name.js', 'new name.js');
  await fs.unlink(path.join(root, 'deleted.js'));
  await fs.writeFile(path.join(root, 'new\n☀.js'), 'added\n');
  await fs.writeFile(path.join(root, 'binary.bin'), Buffer.from([0, 2]));
  const get = await api(t, root);

  const status = Object.fromEntries(
    (await get('changes')).changes.map((change) => [
      change.path,
      change.status,
    ]),
  );
  assert.equal(status['new name.js'], 'R');
  assert.equal(status['deleted.js'], 'D');
  assert.equal(status['new\n☀.js'], 'A');

  const renamed = await get('change', { path: 'new name.js' });
  assert.equal(renamed.oldFile.path, 'old name.js');
  assert.equal(renamed.oldFile.contents, 'original\n');
  const deleted = await get('change', { path: 'deleted.js' });
  assert.equal(deleted.oldFile.contents, 'removed\n');
  assert.equal(deleted.newFile.contents, '');
  const added = await get('change', { path: 'new\n☀.js' });
  assert.equal(added.oldFile.contents, '');
  assert.equal(added.newFile.contents, 'added\n');
  assert.equal(
    (await get('change', { path: 'binary.bin' })).oldFile.kind,
    'binary',
  );
});

test('fingerprints changes so clients can tell when to refresh', async (t) => {
  const { root } = await createRepository({ 'hello.js': 'one\n' }, t);
  const get = await api(t, root);
  const stamp = async () => (await get('changes')).stamp;

  const clean = await stamp();
  await fs.writeFile(path.join(root, 'hello.js'), 'two\n');
  const edited = await stamp();
  assert.notEqual(edited, clean);
  assert.equal(await stamp(), edited, 'stable while nothing changes');
  await fs.writeFile(path.join(root, 'hello.js'), 'three, longer\n');
  assert.notEqual(await stamp(), edited);
});

test('scopes changes to the served subdirectory', async (t) => {
  const { root } = await createRepository(
    { 'src/file.js': 'before', 'src-other/file.js': 'before' },
    t,
  );
  await fs.writeFile(path.join(root, 'src/file.js'), 'after');
  await fs.writeFile(path.join(root, 'src-other/file.js'), 'after');
  const get = await api(t, path.join(root, 'src'));

  assert.deepEqual(paths(await get('changes')), ['file.js']);
  assert.equal(
    (await get('change', { path: 'file.js' })).oldFile.contents,
    'before',
  );
});

test('works before the first commit, skipping staged files deleted since', async (t) => {
  const root = await createProject({ 'new.js': 'first', 'gone.js': 'gone' }, t);
  const run = git(root);
  await run('init', '-q');
  await run('add', '.');
  await fs.unlink(path.join(root, 'gone.js'));
  const get = await api(t, root);

  assert.deepEqual(paths(await get('changes')), ['new.js']);
  assert.equal((await get('change', { path: 'new.js' })).oldFile.contents, '');
});

test('reviews a staged deletion that was recreated on disk once, against HEAD', async (t) => {
  const { root, git: run } = await createRepository(
    { 'recreated.js': 'before' },
    t,
  );
  await run('rm', '-q', 'recreated.js');
  await fs.writeFile(path.join(root, 'recreated.js'), 'after');
  const get = await api(t, root);

  assert.deepEqual(paths(await get('changes')), ['recreated.js']);
  const change = await get('change', { path: 'recreated.js' });
  assert.equal(change.oldFile.contents, 'before');
  assert.equal(change.newFile.contents, 'after');
});

test('has no Git behavior outside a repository or without Git installed', async (t) => {
  const root = await createProject({}, t);
  const local = createLocalGit(root);
  assert.equal(await local.detect(), null);
  assert.deepEqual(await local.changes(), { available: false, changes: [] });

  const originalPath = process.env.PATH;
  t.after(() => {
    process.env.PATH = originalPath;
  });
  process.env.PATH = '';
  assert.equal(await createLocalGit(root).detect(), null);
});
