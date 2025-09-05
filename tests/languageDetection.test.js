// Simple unit tests for language detection
// Run with: node tests/languageDetection.test.js

// Import the function (in a real setup, you'd use proper modules)
// For now, we'll copy the function to test it standalone

function getLanguageFromExtension(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const languageMap = {
    // JavaScript family
    'js': 'javascript',
    'mjs': 'javascript', 
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    
    // Web languages
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    
    // Data formats
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    
    // Programming languages
    'py': 'python',
    'java': 'java',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'dart': 'dart',
    
    // Systems languages
    'c': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    
    // Shell and scripts
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    'ps1': 'powershell',
    
    // Other languages
    'sql': 'sql',
    'r': 'r',
    'scala': 'scala',
    'clj': 'clojure',
    'lua': 'lua',
    'pl': 'perl',
    'groovy': 'groovy',
    
    // Config and text
    'md': 'markdown',
    'txt': 'plaintext',
    'log': 'plaintext'
  };
  
  // Special filename handling
  const basename = filename.toLowerCase();
  if (basename === 'dockerfile' || basename.startsWith('dockerfile.')) return 'dockerfile';
  if (basename === 'makefile') return 'makefile';
  if (basename.startsWith('.env')) return 'dotenv';
  if (basename === 'package.json' || basename === 'composer.json') return 'json';
  
  return languageMap[ext] || 'plaintext';
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

// Test cases
console.log('🧪 Testing Language Detection Function\n');

test('detects JavaScript files', () => {
  assertEqual(getLanguageFromExtension('app.js'), 'javascript');
  assertEqual(getLanguageFromExtension('module.mjs'), 'javascript');
  assertEqual(getLanguageFromExtension('Component.jsx'), 'javascript');
});

test('detects TypeScript files', () => {
  assertEqual(getLanguageFromExtension('main.ts'), 'typescript');
  assertEqual(getLanguageFromExtension('Component.tsx'), 'typescript');
});

test('detects web languages', () => {
  assertEqual(getLanguageFromExtension('index.html'), 'html');
  assertEqual(getLanguageFromExtension('styles.css'), 'css');
  assertEqual(getLanguageFromExtension('styles.scss'), 'scss');
});

test('detects programming languages', () => {
  assertEqual(getLanguageFromExtension('script.py'), 'python');
  assertEqual(getLanguageFromExtension('Main.java'), 'java');
  assertEqual(getLanguageFromExtension('main.go'), 'go');
  assertEqual(getLanguageFromExtension('lib.rs'), 'rust');
});

test('detects special filenames', () => {
  assertEqual(getLanguageFromExtension('Dockerfile'), 'dockerfile');
  assertEqual(getLanguageFromExtension('dockerfile.prod'), 'dockerfile');
  assertEqual(getLanguageFromExtension('Makefile'), 'makefile');
  assertEqual(getLanguageFromExtension('.env'), 'dotenv');
  assertEqual(getLanguageFromExtension('.env.local'), 'dotenv');
  assertEqual(getLanguageFromExtension('package.json'), 'json');
});

test('defaults to plaintext for unknown extensions', () => {
  assertEqual(getLanguageFromExtension('file.unknown'), 'plaintext');
  assertEqual(getLanguageFromExtension('README'), 'plaintext');
  assertEqual(getLanguageFromExtension('file.xyz'), 'plaintext');
});

test('handles files without extensions', () => {
  assertEqual(getLanguageFromExtension('README'), 'plaintext');
  assertEqual(getLanguageFromExtension('LICENSE'), 'plaintext');
});

console.log('\n🎉 Language detection tests complete!');