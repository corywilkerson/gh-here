const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { after, before, describe, test } = require('node:test');
const {
  createProject,
  removeProject,
  serve,
  writeFiles,
} = require('./helpers');

const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7RwAAAAASUVORK5CYII=',
  'base64',
);

const FILES = {
  '.gitignore': '*.log\n!keep.log\n',
  'hide.log': 'hidden',
  'keep.log': 'visible',
  'src/.gitignore': '*.tmp\n',
  'src/hide.tmp': 'hidden',
  'src/main.js': 'const greeting = "hello";\n',
  'node_modules/package/index.js': '',
  'README.md': '# Local project',
  '<script>.txt': 'plain text',
  'binary.bin': Buffer.from([0, 1, 2]),
  'large.txt': 'x'.repeat(2 * 1024 * 1024 + 1),
  'many-lines.txt': '\n'.repeat(20001),
  'pixel.png': PIXEL,
};

describe('a directory without Git', () => {
  let outside;
  let root;
  let server;
  const names = (items) => items.map((item) => item.name);

  before(async () => {
    outside = await createProject({ 'secret.txt': 'outside' });
    root = path.join(outside, 'project');
    await fs.mkdir(path.join(root, 'empty'), { recursive: true });
    await writeFiles(root, FILES);
    await fs.symlink(
      path.join(outside, 'secret.txt'),
      path.join(root, 'external-link'),
    );
    await fs.symlink(
      path.join(root, 'src/main.js'),
      path.join(root, 'internal-link'),
    );
    await fs.symlink(root, path.join(root, 'loop'));
    server = await serve(root);
  });

  after(async () => {
    await server.close();
    await removeProject(outside);
  });

  test('lists direct children, hiding ignored files and external links', async () => {
    const { data } = await server.get('api/entry');
    assert.equal(data.kind, 'directory');
    assert.ok(
      data.items.some((item) => item.name === 'src' && item.isDirectory),
    );
    assert.ok(names(data.items).includes('keep.log'));
    assert.ok(names(data.items).includes('<script>.txt'));
    for (const hidden of [
      'node_modules',
      'hide.log',
      'external-link',
      'main.js',
    ])
      assert.ok(!names(data.items).includes(hidden), hidden);
    assert.equal(
      (await server.get('api/info')).data.directory,
      await fs.realpath(root),
    );
  });

  test('respects nested .gitignore files, and shows ignored files on request', async () => {
    const nested = await server.get('api/directory', { path: 'src' });
    assert.ok(!names(nested.data.items).includes('hide.tmp'));
    const all = await server.get('api/directory', { ignored: 'true' });
    assert.ok(names(all.data.items).includes('hide.log'));
    assert.ok(names(all.data.items).includes('node_modules'));
  });

  test('reads fresh contents and lists empty directories', async () => {
    const read = async () =>
      (await server.get('api/file', { path: 'src/main.js' })).data.contents;
    assert.equal(await read(), 'const greeting = "hello";\n');
    await writeFiles(root, { 'src/main.js': 'updated' });
    assert.equal(await read(), 'updated');
    assert.deepEqual(
      (await server.get('api/directory', { path: 'empty' })).data.items,
      [],
    );
  });

  test('classifies images, binary and large files without sending contents', async () => {
    const kinds = {
      'pixel.png': 'image',
      'binary.bin': 'binary',
      'large.txt': 'large',
      'many-lines.txt': 'large',
    };
    for (const [file, kind] of Object.entries(kinds)) {
      const { data } = await server.get('api/file', { path: file });
      assert.equal(data.kind, kind, file);
      assert.equal(data.contents, undefined, file);
    }
  });

  test('blocks traversal and external symlinks on every file route', async () => {
    const routes = [
      'api/file',
      'api/entry',
      'api/directory',
      'raw',
      'image',
      'download',
    ];
    const escapes = [
      '../secret.txt',
      'external-link',
      path.join(outside, 'secret.txt'),
    ];
    for (const route of routes)
      for (const target of escapes) {
        const response = await fetch(
          `${server.url}/${route}?path=${encodeURIComponent(target)}`,
        );
        assert.equal(response.status, 403, `${route} ${target}`);
      }
    assert.equal(
      (await server.get('api/file', { path: 'internal-link' })).data.kind,
      'text',
    );
  });

  test('searches paths without following symlink loops or ignored folders', async () => {
    const { data } = await server.get('api/search', { q: 'main.js' });
    assert.deepEqual(
      data.results.map((item) => item.path),
      ['src/main.js'],
    );
    assert.equal(data.truncated, false);
    assert.deepEqual(
      (await server.get('api/search', { q: 'hide.tmp' })).data.results,
      [],
    );
  });

  test('serves raw text and downloads', async () => {
    const raw = await fetch(`${server.url}/raw?path=README.md`);
    assert.equal(await raw.text(), '# Local project');
    assert.match(raw.headers.get('content-type'), /^text\/plain/);
    const download = await fetch(`${server.url}/download?path=README.md`);
    assert.match(download.headers.get('content-disposition'), /^attachment/);
    assert.equal(
      (await server.get('api/file', { path: 'missing' })).status,
      404,
    );
  });

  test('refuses requests addressed to any other host', async () => {
    const status = await new Promise((resolve, reject) => {
      http
        .get(
          `${server.url}/api/info`,
          { headers: { Host: 'unexpected.example' } },
          (response) => {
            response.resume();
            resolve(response.statusCode);
          },
        )
        .once('error', reject);
    });
    assert.equal(status, 403);
  });
});
