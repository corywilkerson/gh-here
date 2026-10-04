/**
 * End-to-end checks in a real browser. Run `npm run build` first.
 * Every test also asserts the page logged no errors and made no requests
 * off this machine.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {
  after,
  afterEach,
  before,
  beforeEach,
  describe,
  test,
} = require('node:test');
const { chromium } = require('playwright');
const {
  createProject,
  createRepository,
  removeProject,
  serve,
  writeFiles,
} = require('./helpers');

const DESKTOP = { width: 1536, height: 1024 };
const PHONE = { width: 390, height: 844 };

const GREETING =
  'export function greet(name) {\n  return `Hello, ${name}`;\n}\n';
const WELCOME =
  'export function greet(name) {\n  return `Welcome, ${name}!`;\n}\n';
const LONG = Array.from(
  { length: 500 },
  (_, i) => `export const line${i + 1} = ${i + 1};`,
).join('\n');

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(() => browser.close());

/** A fresh page on `url`, recording errors and any request that leaves it. */
async function openPage(url) {
  const page = await browser.newPage({ viewport: DESKTOP });
  const problems = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on(
    'console',
    (message) => message.type() === 'error' && problems.push(message.text()),
  );
  page.on('request', (request) => {
    if (!request.url().startsWith(url))
      problems.push(`external request: ${request.url()}`);
  });
  page.problems = problems;
  return page;
}

/** Text rendered by every Pierre viewer on the page (they live in shadow roots). */
const codeText = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('diffs-container')]
      .map((viewer) => viewer.shadowRoot?.textContent ?? '')
      .join('\n'),
  );

const waitForCode = (page, text) =>
  page.waitForFunction(
    (expected) =>
      [...document.querySelectorAll('diffs-container')].some((viewer) =>
        viewer.shadowRoot?.textContent.includes(expected),
      ),
    text,
  );

const sidebarState = (page) =>
  page.locator('body').getAttribute('data-sidebar');

const scrollsSideways = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth > innerWidth);

const treeItem = (page, name) =>
  page.getByRole('treeitem', { name, exact: true });

const button = (page, name) => page.getByRole('button', { name, exact: true });

/** Shared lifecycle: one server per suite, one page per test, no problems allowed. */
function usePage(createRoot) {
  const context = {};
  before(async () => {
    context.root = await createRoot();
    context.server = await serve(context.root);
  });
  after(async () => {
    await context.server.close();
    await removeProject(context.root);
  });
  beforeEach(async () => {
    context.page = await openPage(context.server.url);
  });
  afterEach(async () => {
    assert.deepEqual(context.page.problems, []);
    await context.page.close();
  });
  return context;
}

describe('browsing files', () => {
  const ctx = usePage(() =>
    createProject({
      'client/original.js': GREETING,
      'client/updated.js': WELCOME,
      'client/long.js': LONG,
      'README.md':
        '# Local project\n\n[Original](client/original.js)\n\n![External](https://example.com/tracker.png)\n\n<script>window.injected=true</script>',
      '.gitignore': '*.log\n',
      'hidden.log': 'ignored',
      'binary.bin': Buffer.from([0, 1, 2]),
      'large.txt': 'x'.repeat(2 * 1024 * 1024 + 1),
      'empty/.keep': '',
    }).then(async (root) => {
      await fs.rm(path.join(root, 'empty/.keep'));
      return root;
    }),
  );

  test('renders the README without scripts or remote images', async () => {
    const { page, server, root } = ctx;
    await page.goto(server.url);
    await page.locator('#readme-content h1').waitFor();
    assert.equal(await page.title(), `${path.basename(root)} · gh-here`);
    assert.equal(await page.locator('script:not([src])').count(), 0);
    assert.equal(await page.evaluate(() => window.injected), undefined);
  });

  test('opens a file from the tree with highlighted code', async () => {
    const { page, server } = ctx;
    await page.goto(server.url);
    await treeItem(page, 'client').click();
    await treeItem(page, 'original.js').click();
    await waitForCode(page, 'Hello');
    assert.equal(
      await page
        .locator('[role=treeitem][aria-selected=true]')
        .getAttribute('aria-label'),
      'original.js',
    );
  });

  test('wraps lines and switches themes', async () => {
    const { page, server } = ctx;
    await page.goto(`${server.url}/?path=client/original.js`);
    await waitForCode(page, 'Hello');
    await button(page, 'Wrap lines').click();
    await page
      .locator('diffs-container')
      .locator('pre[data-overflow=wrap]')
      .waitFor();
    await button(page, 'Wrap lines').click();
    await button(page, 'Switch to dark theme').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await button(page, 'Switch to light theme').click();
  });

  test('goes to a file with ⌘K', async () => {
    const { page, server } = ctx;
    await page.goto(server.url);
    await page.locator('#readme-content h1').waitFor();
    await page.keyboard.press('Control+k');
    await page
      .getByRole('searchbox', { name: 'Find a file' })
      .fill('updated.js');
    await page.locator('.search-result').waitFor();
    await page.keyboard.press('Enter');
    await page
      .locator('.file-identity h1')
      .filter({ hasText: 'updated.js' })
      .waitFor();
    await waitForCode(page, 'Welcome');
  });

  test('hides ignored files until asked, and filters the tree', async () => {
    const { page, server } = ctx;
    const hiddenRow = page.locator('.file-list a[data-path="hidden.log"]');
    await page.goto(server.url);
    await page.locator('#readme-content h1').waitFor();
    assert.equal(await hiddenRow.count(), 0);
    assert.equal(
      await page.getByRole('link', { name: 'Changes', exact: true }).count(),
      0,
    );
    await page.getByRole('checkbox', { name: 'Show ignored' }).check();
    await hiddenRow.waitFor();
    await page.getByRole('checkbox', { name: 'Show ignored' }).uncheck();
    await hiddenRow.waitFor({ state: 'detached' });
    await page.locator('#filter').fill('README');
    await treeItem(page, 'README.md').waitFor();
    assert.equal(await treeItem(page, 'client').count(), 0);
  });

  test('explains binary, oversized and empty entries', async () => {
    const { page, server } = ctx;
    const expectations = {
      'binary.bin': 'Binary file',
      'large.txt': 'A little too large to preview',
    };
    for (const [file, heading] of Object.entries(expectations)) {
      await page.goto(`${server.url}/?path=${file}`);
      await page.getByRole('heading', { name: heading, exact: true }).waitFor();
    }
    await page.goto(`${server.url}/?path=empty`);
    await page.getByText('This directory is empty.', { exact: true }).waitFor();
  });

  test('picks up changes on disk when refreshed', async () => {
    const { page, server, root } = ctx;
    await page.goto(`${server.url}/?path=client/updated.js`);
    await waitForCode(page, 'Welcome');
    await writeFiles(root, {
      'client/updated.js': 'export const refreshed = true;\n',
    });
    await button(page, 'Refresh directory').click();
    await waitForCode(page, 'refreshed');
    await writeFiles(root, { 'client/updated.js': WELCOME });
  });

  test('scrolls to a linked line', async () => {
    const { page, server } = ctx;
    await page.goto(`${server.url}/?path=client/long.js#L400`);
    await waitForCode(page, 'line400');
    assert.ok(
      (await page.locator('#main').evaluate((main) => main.scrollTop)) > 5000,
    );
  });

  test('fits a phone, with a drawer that closes on pick or backdrop tap', async () => {
    const { page, server } = ctx;
    await page.setViewportSize(PHONE);
    await page.goto(server.url);
    await page.locator('#readme-content h1').waitFor();
    assert.equal(await scrollsSideways(page), false);
    assert.equal(await sidebarState(page), 'closed');

    await button(page, 'Toggle files').click();
    assert.equal(await sidebarState(page), 'open');
    await page
      .locator('#scrim')
      .click({ position: { x: PHONE.width - 20, y: 400 } });
    assert.equal(await sidebarState(page), 'closed');

    await button(page, 'Toggle files').click();
    await treeItem(page, 'README.md').click();
    await page.locator('#file-body h1').waitFor();
    assert.equal(await sidebarState(page), 'closed');
  });
});

describe('reviewing changes', () => {
  const ctx = usePage(async () => {
    const { root, git } = await createRepository({
      'client/original.js': GREETING,
      'client/updated.js': 'export const unchanged = true;\n',
      'README.md': '# Local project',
    });
    await git('add', 'client/original.js');
    await writeFiles(root, {
      'client/original.js': WELCOME,
      'client/updated.js': 'export const secondChange = true;\n',
    });
    ctx.git = git;
    return root;
  });

  const openReview = async ({ page, server }) => {
    await page.goto(server.url);
    await page.getByRole('link', { name: 'Changes', exact: true }).click();
    await waitForCode(page, 'secondChange');
  };

  test('opens on Changes when there is work in progress', async () => {
    const { page, server } = ctx;
    await page.goto(server.url);
    await waitForCode(page, 'secondChange');
    assert.equal(new URL(page.url()).searchParams.get('view'), 'changes');
  });

  test('shows every changed file in one review', async () => {
    await openReview(ctx);
    const text = await codeText(ctx.page);
    for (const expected of ['Hello', 'Welcome', 'unchanged', 'secondChange'])
      assert.ok(text.includes(expected), expected);
    assert.equal(await ctx.page.locator('#main input').count(), 0);
    assert.equal(await ctx.page.locator('#stats').isVisible(), true);
  });

  test('switches between split and unified', async () => {
    const { page } = ctx;
    await openReview(ctx);
    await button(page, 'Unified').click();
    await page
      .locator('diffs-container pre[data-diff-type=single]')
      .first()
      .waitFor();
    await button(page, 'Split').click();
    await page
      .locator('diffs-container pre[data-diff-type=split]')
      .first()
      .waitFor();
  });

  test('moves between files from the tree and with j and k', async () => {
    const { page } = ctx;
    const currentPath = () => new URL(page.url()).searchParams.get('path');
    await openReview(ctx);
    await treeItem(page, 'updated.js').click();
    assert.equal(currentPath(), 'client/updated.js');
    await page.locator('#main').click({ position: { x: 600, y: 300 } });
    await page.keyboard.press('k');
    await page.waitForURL(() => currentPath() === 'client/original.js');
    await page.keyboard.press('j');
    await page.waitForURL(() => currentPath() === 'client/updated.js');
  });

  test('collapses and expands every file', async () => {
    const { page } = ctx;
    await openReview(ctx);
    await button(page, 'Collapse all files').click();
    await button(page, 'Expand all files').click();
    await button(page, 'Collapse all files').waitFor();
  });

  test('closes the phone drawer after picking a file', async () => {
    const { page } = ctx;
    await openReview(ctx);
    await page.setViewportSize({ width: 320, height: 720 });
    await button(page, 'Toggle files').click();
    await treeItem(page, 'original.js').click();
    await page.waitForURL(
      (url) => url.searchParams.get('path') === 'client/original.js',
    );
    assert.equal(await sidebarState(page), 'closed');
    assert.equal(await scrollsSideways(page), false);
  });

  test('remembers a hidden sidebar on desktop', async () => {
    const { page } = ctx;
    await openReview(ctx);
    assert.equal(await sidebarState(page), 'open');
    await button(page, 'Toggle files').click();
    await page.reload();
    await waitForCode(page, 'secondChange');
    assert.equal(await page.locator('#sidebar').isVisible(), false);
    await button(page, 'Toggle files').click();
    await treeItem(page, 'updated.js').waitFor();
  });

  test('updates live as files change, keeping collapsed files collapsed', async () => {
    const { page, root } = ctx;
    await openReview(ctx);
    await button(page, 'Collapse client/original.js').click();
    await writeFiles(root, {
      'client/updated.js': 'export const liveEdit = true;\n',
    });
    await waitForCode(page, 'liveEdit');
    await button(page, 'Expand client/original.js').waitFor();
    await writeFiles(root, {
      'client/updated.js': 'export const secondChange = true;\n',
    });
    await waitForCode(page, 'secondChange');
  });

  test('is all caught up once everything is committed', async () => {
    const { page, server } = ctx;
    await page.goto(`${server.url}/?view=changes`);
    await waitForCode(page, 'secondChange');
    await ctx.git.commitAll('Changes');
    await button(page, 'Refresh directory').click();
    await page
      .getByRole('heading', { name: 'All caught up.', exact: true })
      .waitFor();
    await page.getByRole('link', { name: 'Files', exact: true }).click();
    await page.locator('.file-list').waitFor();
  });
});
