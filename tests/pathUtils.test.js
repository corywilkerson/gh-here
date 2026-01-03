// Tests for Path Utilities
// Run with: node tests/pathUtils.test.js

// Path utility functions extracted for testability
const PathUtils = {
  // Extract current path from URL parameters
  getCurrentPath() {
    const currentUrl = new URL(window.location.href);
    return currentUrl.searchParams.get('path') || '';
  },

  // Navigate to parent directory
  getParentPath(currentPath) {
    if (!currentPath || currentPath === '') {
      return null; // Already at root
    }
    
    const pathParts = currentPath.split('/').filter(p => p);
    if (pathParts.length === 0) {
      return null; // Already at root
    }
    
    pathParts.pop();
    return pathParts.join('/');
  },

  // Build file path from directory and filename
  buildFilePath(currentPath, filename) {
    return currentPath ? `${currentPath}/${filename}` : filename;
  },

  // Get filename from full path
  getFileName(filePath) {
    return filePath.split('/').pop() || 'file.txt';
  },

  // Build URL with encoded path parameter
  buildPathUrl(basePath, targetPath) {
    return targetPath ? `${basePath}?path=${encodeURIComponent(targetPath)}` : basePath;
  },

  // Extract directory path from file path
  getDirectoryPath(filePath) {
    const parts = filePath.split('/').filter(p => p);
    if (parts.length <= 1) return '';
    return parts.slice(0, -1).join('/');
  }
};

// Simple test framework
function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`Expected "${expected}" but got "${actual}". ${message}`);
  }
}

function assertNull(actual, message = '') {
  if (actual !== null) {
    throw new Error(`Expected null but got "${actual}". ${message}`);
  }
}

// Test cases
console.log('🧪 Testing Path Utilities\n');

test('gets parent path correctly', () => {
  assertEqual(PathUtils.getParentPath('src/components/App.js'), 'src/components');
  assertEqual(PathUtils.getParentPath('src/App.js'), 'src');
  assertEqual(PathUtils.getParentPath('App.js'), '');
  assertNull(PathUtils.getParentPath(''));
  assertNull(PathUtils.getParentPath(null));
});

test('builds file paths correctly', () => {
  assertEqual(PathUtils.buildFilePath('src/components', 'App.js'), 'src/components/App.js');
  assertEqual(PathUtils.buildFilePath('src', 'App.js'), 'src/App.js');
  assertEqual(PathUtils.buildFilePath('', 'App.js'), 'App.js');
  assertEqual(PathUtils.buildFilePath(null, 'App.js'), 'App.js');
});

test('gets filename from path correctly', () => {
  assertEqual(PathUtils.getFileName('src/components/App.js'), 'App.js');
  assertEqual(PathUtils.getFileName('App.js'), 'App.js');
  assertEqual(PathUtils.getFileName(''), 'file.txt');
  assertEqual(PathUtils.getFileName('src/components/'), 'file.txt');
});

test('builds URLs with path parameters', () => {
  assertEqual(PathUtils.buildPathUrl('/', 'src/components'), '/?path=src%2Fcomponents');
  assertEqual(PathUtils.buildPathUrl('/new', 'src'), '/new?path=src');
  assertEqual(PathUtils.buildPathUrl('/', ''), '/');
  assertEqual(PathUtils.buildPathUrl('/new', null), '/new');
});

test('gets directory path from file path', () => {
  assertEqual(PathUtils.getDirectoryPath('src/components/App.js'), 'src/components');
  assertEqual(PathUtils.getDirectoryPath('src/App.js'), 'src');
  assertEqual(PathUtils.getDirectoryPath('App.js'), '');
  assertEqual(PathUtils.getDirectoryPath(''), '');
});

test('handles edge cases in parent path', () => {
  assertEqual(PathUtils.getParentPath('a/b/c/d/e'), 'a/b/c/d');
  assertEqual(PathUtils.getParentPath('single'), '');
  assertNull(PathUtils.getParentPath(''));
});

test('handles edge cases in file path building', () => {
  assertEqual(PathUtils.buildFilePath('a/b/c', 'file.txt'), 'a/b/c/file.txt');
  assertEqual(PathUtils.buildFilePath('', 'README.md'), 'README.md');
});

console.log('\n🎉 Path utilities tests complete!');