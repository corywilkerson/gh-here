// Tests for DraftManager utility
// Run with: node tests/draftManager.test.js

// Mock localStorage for testing
class MockLocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store.hasOwnProperty(key) ? this.store[key] : null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  get length() {
    return Object.keys(this.store).length;
  }
}

// Create testable version of DraftManager with injected storage
function createDraftManager(storage) {
  return {
    STORAGE_PREFIX: 'gh-here-draft-',
    
    saveDraft(filePath, content) {
      storage.setItem(`${this.STORAGE_PREFIX}${filePath}`, content);
    },
    
    loadDraft(filePath) {
      return storage.getItem(`${this.STORAGE_PREFIX}${filePath}`);
    },
    
    clearDraft(filePath) {
      storage.removeItem(`${this.STORAGE_PREFIX}${filePath}`);
    },
    
    hasDraftChanges(filePath, originalContent) {
      const draft = this.loadDraft(filePath);
      return draft !== null && draft !== originalContent;
    },
    
    getAllDrafts() {
      const drafts = {};
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const filePath = key.replace(this.STORAGE_PREFIX, '');
          drafts[filePath] = storage.getItem(key);
        }
      }
      return drafts;
    }
  };
}

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

function assertTrue(actual, message = '') {
  if (!actual) {
    throw new Error(`Expected truthy but got "${actual}". ${message}`);
  }
}

function assertFalse(actual, message = '') {
  if (actual) {
    throw new Error(`Expected falsy but got "${actual}". ${message}`);
  }
}

// Test cases
console.log('🧪 Testing Draft Manager\n');

test('saves and loads drafts correctly', () => {
  const storage = new MockLocalStorage();
  const draftManager = createDraftManager(storage);
  
  const filePath = '/src/app.js';
  const content = 'console.log("hello world");';
  
  // Initially no draft
  assertNull(draftManager.loadDraft(filePath));
  
  // Save draft
  draftManager.saveDraft(filePath, content);
  
  // Load draft
  assertEqual(draftManager.loadDraft(filePath), content);
});

test('clears drafts correctly', () => {
  const storage = new MockLocalStorage();
  const draftManager = createDraftManager(storage);
  
  const filePath = '/src/app.js';
  const content = 'console.log("test");';
  
  // Save and verify
  draftManager.saveDraft(filePath, content);
  assertEqual(draftManager.loadDraft(filePath), content);
  
  // Clear and verify
  draftManager.clearDraft(filePath);
  assertNull(draftManager.loadDraft(filePath));
});

test('detects draft changes correctly', () => {
  const storage = new MockLocalStorage();
  const draftManager = createDraftManager(storage);
  
  const filePath = '/src/app.js';
  const originalContent = 'const x = 1;';
  const draftContent = 'const x = 2;';
  
  // No draft initially
  assertFalse(draftManager.hasDraftChanges(filePath, originalContent));
  
  // Save draft with different content
  draftManager.saveDraft(filePath, draftContent);
  assertTrue(draftManager.hasDraftChanges(filePath, originalContent));
  
  // Save draft with same content
  draftManager.saveDraft(filePath, originalContent);
  assertFalse(draftManager.hasDraftChanges(filePath, originalContent));
});

test('gets all drafts correctly', () => {
  const storage = new MockLocalStorage();
  const draftManager = createDraftManager(storage);
  
  // Add some non-draft items to storage
  storage.setItem('other-key', 'other-value');
  
  // Add drafts
  draftManager.saveDraft('/src/app.js', 'app content');
  draftManager.saveDraft('/src/utils.js', 'utils content');
  draftManager.saveDraft('/README.md', 'readme content');
  
  const allDrafts = draftManager.getAllDrafts();
  
  // Should only return draft items
  assertEqual(Object.keys(allDrafts).length, 3);
  assertEqual(allDrafts['/src/app.js'], 'app content');
  assertEqual(allDrafts['/src/utils.js'], 'utils content');
  assertEqual(allDrafts['/README.md'], 'readme content');
  
  // Should not include non-draft items
  assertEqual(allDrafts['other-key'], undefined);
});

test('handles multiple drafts independently', () => {
  const storage = new MockLocalStorage();
  const draftManager = createDraftManager(storage);
  
  const file1 = '/src/app.js';
  const file2 = '/src/utils.js';
  const content1 = 'app content';
  const content2 = 'utils content';
  
  // Save drafts for different files
  draftManager.saveDraft(file1, content1);
  draftManager.saveDraft(file2, content2);
  
  // Each file has its own draft
  assertEqual(draftManager.loadDraft(file1), content1);
  assertEqual(draftManager.loadDraft(file2), content2);
  
  // Clear one draft, other remains
  draftManager.clearDraft(file1);
  assertNull(draftManager.loadDraft(file1));
  assertEqual(draftManager.loadDraft(file2), content2);
});

test('uses correct storage prefix', () => {
  const storage = new MockLocalStorage();
  const draftManager = createDraftManager(storage);
  
  const filePath = '/src/app.js';
  const content = 'test content';
  
  draftManager.saveDraft(filePath, content);
  
  // Check that correct key is used in storage
  const expectedKey = 'gh-here-draft-/src/app.js';
  assertEqual(storage.getItem(expectedKey), content);
  
  // Verify storage length
  assertEqual(storage.length, 1);
});

test('handles empty content correctly', () => {
  const storage = new MockLocalStorage();
  const draftManager = createDraftManager(storage);
  
  const filePath = '/empty.js';
  const emptyContent = '';
  
  draftManager.saveDraft(filePath, emptyContent);
  assertEqual(draftManager.loadDraft(filePath), ''); // localStorage stores empty string as empty string
  
  // Empty content should be detected as different from non-empty
  assertTrue(draftManager.hasDraftChanges(filePath, 'non-empty'), 'Empty draft should be different from non-empty original');
  assertFalse(draftManager.hasDraftChanges(filePath, ''));
});

console.log('\n🎉 Draft Manager tests complete!');