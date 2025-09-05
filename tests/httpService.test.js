// Tests for HTTP Service abstraction
// Run with: node tests/httpService.test.js

// Simple mock implementation for jest.fn()
function jest_fn() {
  const calls = [];
  const mockFn = (...args) => {
    calls.push(args);
    return mockFn._returnValue;
  };
  mockFn.mock = { calls };
  mockFn.mockResolvedValue = (value) => {
    mockFn._returnValue = Promise.resolve(value);
    return mockFn;
  };
  return mockFn;
}

// Replace jest with our simple implementation
const jest = { fn: jest_fn };

// Mock fetch for testing
class MockResponse {
  constructor(data, options = {}) {
    this._data = data;
    this.ok = options.ok !== false;
    this.status = options.status || (this.ok ? 200 : 500);
    this.statusText = options.statusText || (this.ok ? 'OK' : 'Internal Server Error');
  }

  async json() {
    return this._data;
  }

  async text() {
    return typeof this._data === 'string' ? this._data : JSON.stringify(this._data);
  }
}

// Mock fetch implementation
function createMockFetch(responseData, options = {}) {
  return jest.fn().mockResolvedValue(new MockResponse(responseData, options));
}

// HTTP Service abstraction - pure functions, easily testable
function createHttpService(fetchFn = fetch) {
  return {
    // File operations
    async getFileContent(filePath) {
      const response = await fetchFn(`/api/file-content?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.text();
    },

    async saveFile(filePath, content) {
      const response = await fetchFn('/api/save-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content })
      });
      return response.json();
    },

    async createFile(path, filename) {
      const response = await fetchFn('/api/create-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, filename })
      });
      return response.json();
    },

    async deleteFile(path) {
      const response = await fetchFn('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      return response.json();
    },

    async renameFile(oldPath, newPath) {
      const response = await fetchFn('/api/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath })
      });
      return response.json();
    },

    // Folder operations
    async createFolder(path, foldername) {
      const response = await fetchFn('/api/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, foldername })
      });
      return response.json();
    },

    // Git operations
    async getGitStatus(currentPath) {
      const response = await fetchFn(`/api/git-status?currentPath=${encodeURIComponent(currentPath)}`);
      return response.json();
    },

    async getGitDiff(filePath) {
      const response = await fetchFn(`/api/git-diff?path=${encodeURIComponent(filePath)}`);
      return response.json();
    },

    async commitSelectedFiles(files, message) {
      const response = await fetchFn('/api/git-commit-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, message })
      });
      return response.json();
    }
  };
}

// Simple test framework (since we don't have a real test runner)
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

function assertDeepEqual(actual, expected, message = '') {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`Expected ${expectedStr} but got ${actualStr}. ${message}`);
  }
}

// Test cases
console.log('🧪 Testing HTTP Service\n');

test('gets file content correctly', async () => {
  const mockFetch = jest.fn().mockResolvedValue(new MockResponse('file content'));
  const httpService = createHttpService(mockFetch);
  
  const content = await httpService.getFileContent('src/app.js');
  assertEqual(content, 'file content');
  assertEqual(mockFetch.mock.calls[0][0], '/api/file-content?path=src%2Fapp.js');
});

test('saves file with correct parameters', async () => {
  const mockFetch = jest.fn().mockResolvedValue(new MockResponse({ success: true }));
  const httpService = createHttpService(mockFetch);
  
  const result = await httpService.saveFile('src/app.js', 'new content');
  assertDeepEqual(result, { success: true });
  
  const [url, options] = mockFetch.mock.calls[0];
  assertEqual(url, '/api/save-file');
  assertEqual(options.method, 'POST');
  assertDeepEqual(JSON.parse(options.body), { path: 'src/app.js', content: 'new content' });
});

test('creates file with correct parameters', async () => {
  const mockFetch = jest.fn().mockResolvedValue(new MockResponse({ success: true }));
  const httpService = createHttpService(mockFetch);
  
  const result = await httpService.createFile('src', 'newfile.js');
  assertDeepEqual(result, { success: true });
  
  const [url, options] = mockFetch.mock.calls[0];
  assertEqual(url, '/api/create-file');
  assertDeepEqual(JSON.parse(options.body), { path: 'src', filename: 'newfile.js' });
});

test('deletes file with correct parameters', async () => {
  const mockFetch = jest.fn().mockResolvedValue(new MockResponse({ success: true }));
  const httpService = createHttpService(mockFetch);
  
  const result = await httpService.deleteFile('src/oldfile.js');
  assertDeepEqual(result, { success: true });
  
  const [url, options] = mockFetch.mock.calls[0];
  assertEqual(url, '/api/delete');
  assertDeepEqual(JSON.parse(options.body), { path: 'src/oldfile.js' });
});

test('renames file with correct parameters', async () => {
  const mockFetch = jest.fn().mockResolvedValue(new MockResponse({ success: true }));
  const httpService = createHttpService(mockFetch);
  
  const result = await httpService.renameFile('src/old.js', 'src/new.js');
  assertDeepEqual(result, { success: true });
  
  const [url, options] = mockFetch.mock.calls[0];
  assertEqual(url, '/api/rename');
  assertDeepEqual(JSON.parse(options.body), { oldPath: 'src/old.js', newPath: 'src/new.js' });
});

test('creates folder with correct parameters', async () => {
  const mockFetch = jest.fn().mockResolvedValue(new MockResponse({ success: true }));
  const httpService = createHttpService(mockFetch);
  
  const result = await httpService.createFolder('src', 'components');
  assertDeepEqual(result, { success: true });
  
  const [url, options] = mockFetch.mock.calls[0];
  assertEqual(url, '/api/create-folder');
  assertDeepEqual(JSON.parse(options.body), { path: 'src', foldername: 'components' });
});

test('gets git status with correct parameters', async () => {
  const mockFetch = jest.fn().mockResolvedValue(new MockResponse({ files: [] }));
  const httpService = createHttpService(mockFetch);
  
  const result = await httpService.getGitStatus('src');
  assertDeepEqual(result, { files: [] });
  
  assertEqual(mockFetch.mock.calls[0][0], '/api/git-status?currentPath=src');
});

test('gets git diff with correct parameters', async () => {
  const mockFetch = jest.fn().mockResolvedValue(new MockResponse({ diff: 'diff content' }));
  const httpService = createHttpService(mockFetch);
  
  const result = await httpService.getGitDiff('src/app.js');
  assertDeepEqual(result, { diff: 'diff content' });
  
  assertEqual(mockFetch.mock.calls[0][0], '/api/git-diff?path=src%2Fapp.js');
});

test('commits selected files with correct parameters', async () => {
  const mockFetch = jest.fn().mockResolvedValue(new MockResponse({ success: true }));
  const httpService = createHttpService(mockFetch);
  
  const files = ['src/app.js', 'src/utils.js'];
  const message = 'Fix bugs';
  const result = await httpService.commitSelectedFiles(files, message);
  assertDeepEqual(result, { success: true });
  
  const [url, options] = mockFetch.mock.calls[0];
  assertEqual(url, '/api/git-commit-selected');
  assertDeepEqual(JSON.parse(options.body), { files, message });
});

test('handles HTTP errors correctly', async () => {
  const mockFetch = jest.fn().mockResolvedValue(new MockResponse('Not found', { ok: false, status: 404, statusText: 'Not Found' }));
  const httpService = createHttpService(mockFetch);
  
  try {
    await httpService.getFileContent('nonexistent.js');
    throw new Error('Should have thrown an error');
  } catch (error) {
    assertEqual(error.message, 'HTTP 404: Not Found');
  }
});

console.log('\n🎉 HTTP Service tests complete!');