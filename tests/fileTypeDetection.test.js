// Simple unit tests for file type detection
// Run with: node tests/fileTypeDetection.test.js

// Import the functions from our file-utils module
const { isImageFile, isBinaryFile, isTextFile } = require('../lib/file-utils');

function test(description, testFn) {
  try {
    testFn();
    console.log(`✅ ${description}`);
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test isImageFile function
test('should detect PNG files as images', () => {
  assert(isImageFile('photo.png'), 'PNG should be detected as image');
  assert(isImageFile('PNG'), 'Extension-only PNG should work');
});

test('should detect common image formats', () => {
  const imageFiles = ['test.jpg', 'test.jpeg', 'test.gif', 'test.svg', 'test.webp', 'test.bmp', 'test.tiff', 'test.ico'];
  imageFiles.forEach(file => {
    assert(isImageFile(file), `${file} should be detected as image`);
  });
});

test('should not detect text files as images', () => {
  const textFiles = ['readme.md', 'script.js', 'style.css', 'config.json'];
  textFiles.forEach(file => {
    assert(!isImageFile(file), `${file} should not be detected as image`);
  });
});

// Test isBinaryFile function
test('should detect images as binary files', () => {
  assert(isBinaryFile('photo.png'), 'Images should be binary');
  assert(isBinaryFile('animation.gif'), 'GIFs should be binary');
});

test('should detect archives as binary files', () => {
  const archives = ['file.zip', 'backup.tar', 'compressed.gz', 'archive.rar', 'package.7z'];
  archives.forEach(file => {
    assert(isBinaryFile(file), `${file} should be detected as binary`);
  });
});

test('should detect executables as binary files', () => {
  const executables = ['program.exe', 'binary.bin', 'application.app'];
  executables.forEach(file => {
    assert(isBinaryFile(file), `${file} should be detected as binary`);
  });
});

test('should detect documents as binary files', () => {
  const docs = ['document.pdf', 'spreadsheet.xlsx', 'presentation.pptx'];
  docs.forEach(file => {
    assert(isBinaryFile(file), `${file} should be detected as binary`);
  });
});

test('should not detect text files as binary', () => {
  const textFiles = ['readme.md', 'script.js', 'style.css', 'data.json', 'config.yml', 'index.html'];
  textFiles.forEach(file => {
    assert(!isBinaryFile(file), `${file} should not be detected as binary`);
  });
});

// Test isTextFile function
test('should detect common text files', () => {
  const textFiles = ['readme.md', 'script.js', 'style.css', 'data.json', 'config.yml', 'index.html', 'app.py', 'main.go'];
  textFiles.forEach(file => {
    assert(isTextFile(file), `${file} should be detected as text`);
  });
});

test('should not detect binary files as text', () => {
  const binaryFiles = ['photo.png', 'archive.zip', 'program.exe', 'document.pdf'];
  binaryFiles.forEach(file => {
    assert(!isTextFile(file), `${file} should not be detected as text`);
  });
});

// Test edge cases
test('should handle files without extensions', () => {
  assert(isTextFile('README'), 'Files without extensions should default to text');
  assert(isTextFile('Makefile'), 'Common text files without extensions should be text');
});

test('should handle extension-only input', () => {
  assert(isImageFile('png'), 'Should handle bare extensions');
  assert(isBinaryFile('exe'), 'Should handle bare extensions for binary');
  assert(isTextFile('js'), 'Should handle bare extensions for text');
});

test('should be case insensitive', () => {
  assert(isImageFile('PHOTO.PNG'), 'Should handle uppercase extensions');
  assert(isBinaryFile('ARCHIVE.ZIP'), 'Should handle uppercase extensions');
  assert(isTextFile('SCRIPT.JS'), 'Should handle uppercase extensions');
});

// Run all tests
console.log('Running file type detection tests...\n');