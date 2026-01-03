/**
 * Symbol Parser - Extracts code symbols from source files
 * Supports JavaScript/TypeScript, Python, CSS, and more
 */

const path = require('path');

/**
 * Symbol types
 */
const SYMBOL_KINDS = {
  FUNCTION: 'function',
  CLASS: 'class',
  METHOD: 'method',
  VARIABLE: 'variable',
  CONSTANT: 'constant',
  INTERFACE: 'interface',
  TYPE: 'type',
  EXPORT: 'export',
  IMPORT: 'import',
  SELECTOR: 'selector',
  MIXIN: 'mixin',
  KEYFRAMES: 'keyframes',
  MEDIA: 'media'
};

/**
 * Parse symbols from file content based on language
 * @param {string} content - File content
 * @param {string} filePath - File path (for language detection)
 * @returns {Array<{name: string, kind: string, line: number, detail?: string}>}
 */
function parseSymbols(content, filePath) {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  const lines = content.split('\n');
  
  switch (ext) {
    case 'js':
    case 'mjs':
    case 'cjs':
    case 'jsx':
      return parseJavaScript(lines);
    case 'ts':
    case 'tsx':
      return parseTypeScript(lines);
    case 'py':
      return parsePython(lines);
    case 'css':
    case 'scss':
    case 'less':
      return parseCSS(lines);
    case 'go':
      return parseGo(lines);
    case 'rb':
      return parseRuby(lines);
    case 'rs':
      return parseRust(lines);
    case 'java':
    case 'kt':
      return parseJavaKotlin(lines);
    case 'php':
      return parsePHP(lines);
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
      return parseCpp(lines);
    default:
      return [];
  }
}

/**
 * Parse JavaScript symbols
 */
function parseJavaScript(lines) {
  const symbols = [];
  let insideClass = false;
  let classIndent = 0;
  
  // Top-level patterns (matched against trimmed line)
  const topLevelPatterns = [
    // Named function declarations
    { regex: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/, kind: SYMBOL_KINDS.FUNCTION },
    // Class declarations
    { regex: /^(?:export\s+)?class\s+(\w+)/, kind: SYMBOL_KINDS.CLASS },
    // Arrow function assigned to const/let/var
    { regex: /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(.*\)\s*=>/, kind: SYMBOL_KINDS.FUNCTION },
    // Arrow function assigned (single param, no parens)
    { regex: /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\w+\s*=>/, kind: SYMBOL_KINDS.FUNCTION },
    // Regular function assigned to variable
    { regex: /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function/, kind: SYMBOL_KINDS.FUNCTION },
    // Exported constants (uppercase)
    { regex: /^(?:export\s+)?const\s+([A-Z][A-Z0-9_]+)\s*=/, kind: SYMBOL_KINDS.CONSTANT },
  ];
  
  // Class method pattern (matches method definitions inside classes)
  const methodPattern = /^(?:async\s+)?(?:static\s+)?(?:get\s+|set\s+)?(\w+)\s*\([^)]*\)\s*\{/;
  
  // Keywords to skip when detecting methods
  const skipKeywords = ['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'throw', 'new'];
  
  lines.forEach((line, index) => {
    const trimmed = line.trimStart();
    const currentIndent = line.length - trimmed.length;
    
    // Skip comments and empty lines
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || !trimmed) {
      return;
    }
    
    // Check for class declaration
    const classMatch = trimmed.match(/^(?:export\s+)?class\s+(\w+)/);
    if (classMatch) {
      insideClass = true;
      classIndent = currentIndent;
      symbols.push({
        name: classMatch[1],
        kind: SYMBOL_KINDS.CLASS,
        line: index + 1
      });
      return;
    }
    
    // Detect when we exit a class (line at same or lower indent level as class declaration)
    if (insideClass && currentIndent <= classIndent && trimmed !== '}' && !trimmed.startsWith('}')) {
      // Check if this is a new top-level declaration
      const isTopLevel = topLevelPatterns.some(p => p.regex.test(trimmed));
      if (isTopLevel) {
        insideClass = false;
      }
    }
    
    // If inside a class, look for methods
    if (insideClass && currentIndent > classIndent) {
      const methodMatch = trimmed.match(methodPattern);
      if (methodMatch && methodMatch[1]) {
        const name = methodMatch[1];
        // Skip keywords and constructor
        if (!skipKeywords.includes(name) && name !== 'constructor') {
          symbols.push({
            name,
            kind: SYMBOL_KINDS.METHOD,
            line: index + 1
          });
        }
        return;
      }
    }
    
    // Check top-level patterns
    for (const { regex, kind } of topLevelPatterns) {
      // Skip class pattern as we already handled it
      if (kind === SYMBOL_KINDS.CLASS) continue;
      
      const match = trimmed.match(regex);
      if (match && match[1]) {
        symbols.push({
          name: match[1],
          kind,
          line: index + 1
        });
        break;
      }
    }
  });
  
  return deduplicateSymbols(symbols);
}

/**
 * Parse TypeScript symbols (extends JavaScript)
 */
function parseTypeScript(lines) {
  const symbols = parseJavaScript(lines);
  
  const tsPatterns = [
    // Interface declarations
    { regex: /^(?:export\s+)?interface\s+(\w+)/, kind: SYMBOL_KINDS.INTERFACE },
    // Type declarations
    { regex: /^(?:export\s+)?type\s+(\w+)\s*=/, kind: SYMBOL_KINDS.TYPE },
    // Enum declarations
    { regex: /^(?:export\s+)?enum\s+(\w+)/, kind: SYMBOL_KINDS.TYPE },
  ];
  
  lines.forEach((line, index) => {
    const trimmed = line.trimStart();
    
    for (const { regex, kind } of tsPatterns) {
      const match = trimmed.match(regex);
      if (match && match[1]) {
        symbols.push({
          name: match[1],
          kind,
          line: index + 1
        });
        break;
      }
    }
  });
  
  return deduplicateSymbols(symbols);
}

/**
 * Parse Python symbols
 */
function parsePython(lines) {
  const symbols = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;
    
    // Function definitions
    const funcMatch = trimmed.match(/^(?:async\s+)?def\s+(\w+)\s*\(/);
    if (funcMatch) {
      symbols.push({
        name: funcMatch[1],
        kind: indent === 0 ? SYMBOL_KINDS.FUNCTION : SYMBOL_KINDS.METHOD,
        line: index + 1
      });
      return;
    }
    
    // Class definitions
    const classMatch = trimmed.match(/^class\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        kind: SYMBOL_KINDS.CLASS,
        line: index + 1
      });
    }
  });
  
  return symbols;
}

/**
 * Parse CSS symbols (selectors, keyframes, media queries)
 */
function parseCSS(lines) {
  const symbols = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trimStart();
    
    // Skip comments
    if (trimmed.startsWith('/*') || trimmed.startsWith('*') || !trimmed) {
      return;
    }
    
    // @keyframes
    const keyframesMatch = trimmed.match(/^@keyframes\s+([\w-]+)/);
    if (keyframesMatch) {
      symbols.push({
        name: keyframesMatch[1],
        kind: SYMBOL_KINDS.KEYFRAMES,
        line: index + 1
      });
      return;
    }
    
    // @media queries
    const mediaMatch = trimmed.match(/^@media\s+(.+?)\s*\{/);
    if (mediaMatch) {
      symbols.push({
        name: mediaMatch[1].slice(0, 40) + (mediaMatch[1].length > 40 ? '...' : ''),
        kind: SYMBOL_KINDS.MEDIA,
        line: index + 1
      });
      return;
    }
    
    // @mixin (SCSS)
    const mixinMatch = trimmed.match(/^@mixin\s+([\w-]+)/);
    if (mixinMatch) {
      symbols.push({
        name: mixinMatch[1],
        kind: SYMBOL_KINDS.MIXIN,
        line: index + 1
      });
      return;
    }
    
    // Class and ID selectors at root level (not nested)
    if (line.charAt(0) !== ' ' && line.charAt(0) !== '\t') {
      const selectorMatch = trimmed.match(/^([.#][\w-]+(?:\s*,\s*[.#][\w-]+)*)\s*\{/);
      if (selectorMatch) {
        symbols.push({
          name: selectorMatch[1].split(',')[0].trim(),
          kind: SYMBOL_KINDS.SELECTOR,
          line: index + 1
        });
      }
    }
  });
  
  return symbols;
}

/**
 * Parse Go symbols
 */
function parseGo(lines) {
  const symbols = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trimStart();
    
    // Function declarations
    const funcMatch = trimmed.match(/^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(/);
    if (funcMatch) {
      symbols.push({
        name: funcMatch[1],
        kind: SYMBOL_KINDS.FUNCTION,
        line: index + 1
      });
      return;
    }
    
    // Type declarations
    const typeMatch = trimmed.match(/^type\s+(\w+)\s+(?:struct|interface)/);
    if (typeMatch) {
      symbols.push({
        name: typeMatch[1],
        kind: SYMBOL_KINDS.CLASS,
        line: index + 1
      });
    }
  });
  
  return symbols;
}

/**
 * Parse Ruby symbols
 */
function parseRuby(lines) {
  const symbols = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trimStart();
    
    // Method definitions
    const defMatch = trimmed.match(/^def\s+(self\.)?(\w+[?!=]?)/);
    if (defMatch) {
      symbols.push({
        name: defMatch[2],
        kind: SYMBOL_KINDS.FUNCTION,
        line: index + 1
      });
      return;
    }
    
    // Class definitions
    const classMatch = trimmed.match(/^class\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        kind: SYMBOL_KINDS.CLASS,
        line: index + 1
      });
      return;
    }
    
    // Module definitions
    const moduleMatch = trimmed.match(/^module\s+(\w+)/);
    if (moduleMatch) {
      symbols.push({
        name: moduleMatch[1],
        kind: SYMBOL_KINDS.CLASS,
        line: index + 1
      });
    }
  });
  
  return symbols;
}

/**
 * Parse Rust symbols
 */
function parseRust(lines) {
  const symbols = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trimStart();
    
    // Function definitions
    const fnMatch = trimmed.match(/^(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/);
    if (fnMatch) {
      symbols.push({
        name: fnMatch[1],
        kind: SYMBOL_KINDS.FUNCTION,
        line: index + 1
      });
      return;
    }
    
    // Struct definitions
    const structMatch = trimmed.match(/^(?:pub\s+)?struct\s+(\w+)/);
    if (structMatch) {
      symbols.push({
        name: structMatch[1],
        kind: SYMBOL_KINDS.CLASS,
        line: index + 1
      });
      return;
    }
    
    // Impl blocks
    const implMatch = trimmed.match(/^impl(?:<[^>]+>)?\s+(\w+)/);
    if (implMatch) {
      symbols.push({
        name: `impl ${implMatch[1]}`,
        kind: SYMBOL_KINDS.CLASS,
        line: index + 1
      });
      return;
    }
    
    // Enum definitions
    const enumMatch = trimmed.match(/^(?:pub\s+)?enum\s+(\w+)/);
    if (enumMatch) {
      symbols.push({
        name: enumMatch[1],
        kind: SYMBOL_KINDS.TYPE,
        line: index + 1
      });
    }
  });
  
  return symbols;
}

/**
 * Parse Java/Kotlin symbols
 */
function parseJavaKotlin(lines) {
  const symbols = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trimStart();
    
    // Class declarations
    const classMatch = trimmed.match(/^(?:public\s+|private\s+|protected\s+)?(?:abstract\s+|final\s+)?(?:data\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        kind: SYMBOL_KINDS.CLASS,
        line: index + 1
      });
      return;
    }
    
    // Interface declarations
    const interfaceMatch = trimmed.match(/^(?:public\s+|private\s+)?interface\s+(\w+)/);
    if (interfaceMatch) {
      symbols.push({
        name: interfaceMatch[1],
        kind: SYMBOL_KINDS.INTERFACE,
        line: index + 1
      });
      return;
    }
    
    // Method declarations (simplified)
    const methodMatch = trimmed.match(/^(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:suspend\s+)?(?:fun\s+)?(?:\w+\s+)?(\w+)\s*\([^)]*\)\s*[:{]/);
    if (methodMatch && !['if', 'for', 'while', 'switch', 'catch', 'class', 'interface'].includes(methodMatch[1])) {
      symbols.push({
        name: methodMatch[1],
        kind: SYMBOL_KINDS.METHOD,
        line: index + 1
      });
    }
  });
  
  return symbols;
}

/**
 * Parse PHP symbols
 */
function parsePHP(lines) {
  const symbols = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trimStart();
    
    // Function declarations
    const funcMatch = trimmed.match(/^(?:public\s+|private\s+|protected\s+)?(?:static\s+)?function\s+(\w+)/);
    if (funcMatch) {
      symbols.push({
        name: funcMatch[1],
        kind: SYMBOL_KINDS.FUNCTION,
        line: index + 1
      });
      return;
    }
    
    // Class declarations
    const classMatch = trimmed.match(/^(?:abstract\s+|final\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        kind: SYMBOL_KINDS.CLASS,
        line: index + 1
      });
      return;
    }
    
    // Interface declarations
    const interfaceMatch = trimmed.match(/^interface\s+(\w+)/);
    if (interfaceMatch) {
      symbols.push({
        name: interfaceMatch[1],
        kind: SYMBOL_KINDS.INTERFACE,
        line: index + 1
      });
    }
  });
  
  return symbols;
}

/**
 * Parse C/C++ symbols
 */
function parseCpp(lines) {
  const symbols = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trimStart();
    
    // Skip preprocessor directives and comments
    if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      return;
    }
    
    // Class/struct declarations
    const classMatch = trimmed.match(/^(?:class|struct)\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        kind: SYMBOL_KINDS.CLASS,
        line: index + 1
      });
      return;
    }
    
    // Function declarations (simplified - looks for return_type function_name(...))
    const funcMatch = trimmed.match(/^(?:\w+\s+)+(\w+)\s*\([^;]*\)\s*(?:const\s*)?(?:\{|$)/);
    if (funcMatch && !['if', 'for', 'while', 'switch', 'return'].includes(funcMatch[1])) {
      symbols.push({
        name: funcMatch[1],
        kind: SYMBOL_KINDS.FUNCTION,
        line: index + 1
      });
    }
  });
  
  return symbols;
}

/**
 * Remove duplicate symbols (same name and line)
 */
function deduplicateSymbols(symbols) {
  const seen = new Set();
  return symbols.filter(s => {
    const key = `${s.name}:${s.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Group symbols by kind
 */
function groupSymbolsByKind(symbols) {
  const groups = {};
  
  symbols.forEach(symbol => {
    if (!groups[symbol.kind]) {
      groups[symbol.kind] = [];
    }
    groups[symbol.kind].push(symbol);
  });
  
  return groups;
}

module.exports = {
  parseSymbols,
  groupSymbolsByKind,
  SYMBOL_KINDS
};
