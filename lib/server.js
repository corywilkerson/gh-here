/**
 * The HTTP surface: a locked-down Express app serving the client and a
 * small read-only JSON API. Routes stay thin; the work lives in
 * workspace.js (files), local-git.js (Git) and review.js (diffs).
 */
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const { version } = require('../package.json');
const { httpError } = require('./http-error');
const { createLocalGit } = require('./local-git');
const { createReview } = require('./review');
const { createWorkspace, isImage, isWithin } = require('./workspace');

const PUBLIC = path.join(__dirname, '..', 'public');
const CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'";

/** Only this machine's browser, through this app's own origin, may read files. */
function localOnly(req, res, next) {
  const host = (req.headers.host || '').split(':')[0];
  if (!['127.0.0.1', 'localhost'].includes(host)) return res.sendStatus(403);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  return next();
}

/** Lets async handlers throw; errors reach the error middleware below. */
const route = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res)).catch(next);

const home = (directory) =>
  directory.startsWith(os.homedir() + path.sep)
    ? `~${directory.slice(os.homedir().length)}`
    : directory;

function setupRoutes(app, workingDir) {
  const workspace = createWorkspace(workingDir);
  const git = createLocalGit(workingDir);
  const review = createReview({ workspace, git });
  const showIgnored = (req) => req.query.ignored === 'true';

  app.disable('x-powered-by');
  app.set('query parser', 'simple');
  app.use(localOnly);
  app.use('/static', express.static(PUBLIC));
  app.get('/', (req, res) => res.sendFile(path.join(PUBLIC, 'index.html')));

  app.get(
    '/api/info',
    route(async (req, res) => {
      const root = await workspace.root();
      res.json({
        name: path.basename(root),
        directory: root,
        displayDirectory: home(root),
        gitAvailable: Boolean(await git.detect()),
        version,
      });
    }),
  );

  app.get(
    '/api/directory',
    route(async (req, res) => {
      const { relative } = await workspace.resolve(req.query.path);
      res.json({
        path: relative,
        items: await workspace.list(relative, showIgnored(req)),
      });
    }),
  );

  app.get(
    '/api/entry',
    route(async (req, res) =>
      res.json(await workspace.entry(req.query.path, showIgnored(req))),
    ),
  );

  app.get(
    '/api/file',
    route(async (req, res) => res.json(await workspace.read(req.query.path))),
  );

  app.get(
    '/api/search',
    route(async (req, res) => {
      const query =
        typeof req.query.q === 'string'
          ? req.query.q.toLowerCase().trim().slice(0, 200)
          : '';
      if (!query) return res.json({ results: [], truncated: false });
      return res.json(
        await workspace.search(query, {
          showIgnored: showIgnored(req),
          cancelled: () => res.destroyed,
        }),
      );
    }),
  );

  app.get(
    '/api/changes',
    route(async (req, res) => {
      const result = await git.changes();
      // Git's own paths are internal; the client only needs scoped ones.
      const changes = result.changes.map(
        ({ gitPath: _git, originalGitPath: _original, ...change }) => change,
      );
      res.json({ ...result, changes, stamp: await review.stamp(changes) });
    }),
  );
  app.get(
    '/api/change',
    route(async (req, res) => res.json(await review.file(req.query.path))),
  );
  app.get(
    '/api/diff',
    route(async (req, res) => res.json(await review.all())),
  );

  app.get(
    '/raw',
    route(async (req, res) => {
      const file = await workspace.read(req.query.path);
      if (file.kind !== 'text')
        throw httpError(400, 'Raw preview is available for text files.');
      res.type('text/plain').send(file.contents);
    }),
  );
  app.get(
    '/image',
    route(async (req, res) => {
      const { fullPath } = await workspace.resolve(req.query.path);
      if (!isImage(fullPath)) throw httpError(400, 'Unsupported image.');
      res.sendFile(fullPath);
    }),
  );
  app.get(
    '/download',
    route(async (req, res) =>
      res.download((await workspace.file(req.query.path)).fullPath),
    ),
  );

  // Express recognizes error middleware by its four parameters.
  // eslint-disable-next-line max-params
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status =
      error.status || (['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500);
    return res.status(status).json({
      error:
        status === 500
          ? 'Could not read this directory or file.'
          : error.message,
    });
  });
}

module.exports = { setupRoutes, isWithin };
