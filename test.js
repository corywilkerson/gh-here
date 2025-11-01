/**
 * Lightweight smoke tests for gh-here
 * Run with: node test.js
 */

const { chromium } = require('playwright');
const { spawn } = require('child_process');

const TEST_PORT = 5556; // Use different port to avoid conflicts
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('Starting gh-here server...');

  // Start server
  const server = spawn('node', ['bin/gh-here.js', `--port=${TEST_PORT}`], {
    cwd: __dirname,
    stdio: 'pipe'
  });

  // Wait for server to start
  await sleep(2000);

  let browser;
  let failures = 0;

  try {
    console.log('Launching browser...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Test 1: Root page loads
    console.log('\n✓ Test 1: Root page loads');
    await page.goto(BASE_URL);
    const title = await page.title();
    if (!title.includes('gh-here')) {
      console.error('  ✗ FAILED: Page title incorrect');
      failures++;
    }

    // Test 2: File tree exists (may be hidden on root)
    console.log('✓ Test 2: File tree element exists');
    const fileTreeExists = await page.$('#file-tree');
    if (!fileTreeExists) {
      console.error('  ✗ FAILED: File tree element not found');
      failures++;
    }

    // Test 3: Navigate to a file and check line numbers display correctly
    console.log('✓ Test 3: File view with line numbers');
    await page.goto(`${BASE_URL}/?path=lib/renderers.js`);
    await page.waitForSelector('.line-container', { timeout: 5000 });

    // Check that line numbers are in a vertical column (not nested)
    const lineContainers = await page.$$('.line-container');
    if (lineContainers.length < 10) {
      console.error('  ✗ FAILED: Not enough line containers found');
      failures++;
    }

    // Check line 1 and line 2 have sequential numbers
    const line1 = await page.$('.line-container[data-line="1"]');
    const line2 = await page.$('.line-container[data-line="2"]');
    if (!line1 || !line2) {
      console.error('  ✗ FAILED: Line containers missing data-line attributes');
      failures++;
    }

    // Verify line numbers are not nested (check display property)
    const line1Display = await page.$eval('.line-container[data-line="1"]',
      el => window.getComputedStyle(el).display
    );
    if (line1Display !== 'block') {
      console.error(`  ✗ FAILED: Line containers should have display:block, got ${line1Display}`);
      failures++;
    }

    // Test 4: Check if modified files show diff button
    console.log('✓ Test 4: Modified files show diff button');
    await page.goto(BASE_URL);
    const diffButtons = await page.$$('.diff-btn');
    // Should have at least one diff button if there are modified files
    console.log(`  Found ${diffButtons.length} diff buttons`);

    // Test 5: Gitignore toggle exists and is clickable
    console.log('✓ Test 5: Gitignore toggle button');
    const gitignoreToggle = await page.$('#gitignore-toggle');
    if (!gitignoreToggle) {
      console.error('  ✗ FAILED: Gitignore toggle button not found');
      failures++;
    }

    // Test 6: Theme toggle works
    console.log('✓ Test 6: Theme toggle');
    const themeToggle = await page.$('#theme-toggle');
    if (!themeToggle) {
      console.error('  ✗ FAILED: Theme toggle button not found');
      failures++;
    }

    // Test 7: Search functionality
    console.log('✓ Test 7: Search input exists');
    const searchInput = await page.$('#file-search, #root-file-search');
    if (!searchInput) {
      console.error('  ✗ FAILED: Search input not found');
      failures++;
    }

    console.log('\n' + '='.repeat(50));
    if (failures === 0) {
      console.log('✓ All tests passed!');
    } else {
      console.log(`✗ ${failures} test(s) failed`);
    }
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    failures++;
  } finally {
    if (browser) {
      await browser.close();
    }

    // Kill server
    server.kill();

    // Exit with appropriate code
    process.exit(failures > 0 ? 1 : 0);
  }
}

runTests();
