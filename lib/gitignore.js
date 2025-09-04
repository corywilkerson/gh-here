const fs = require('fs');
const path = require('path');

/**
 * Gitignore handling module
 * Parses .gitignore files and filters files/directories
 */

// Cache for gitignore rules
let gitignoreCache = null;
let gitignoreCacheTime = 0;

function parseGitignore(gitignorePath) {
  try {
    if (!fs.existsSync(gitignorePath)) {
      return [];
    }
    
    const content = fs.readFileSync(gitignorePath, 'utf8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(pattern => {
        // Convert gitignore patterns to regex-like matching
        if (pattern.endsWith('/')) {
          // Directory pattern
          return { pattern: pattern.slice(0, -1), isDirectory: true };
        }
        return { pattern, isDirectory: false };
      });
  } catch (error) {
    return [];
  }
}

function isIgnoredByGitignore(filePath, gitignoreRules, workingDir, isDirectory = false) {
  if (!gitignoreRules || gitignoreRules.length === 0) {
    return false;
  }
  
  const relativePath = path.relative(workingDir, filePath).replace(/\\/g, '/');
  const pathParts = relativePath.split('/');
  
  for (const rule of gitignoreRules) {
    const { pattern, isDirectory: ruleIsDirectory } = rule;
    
    // Skip directory rules for files and vice versa (unless rule applies to both)
    if (ruleIsDirectory && !isDirectory) {
      continue;
    }
    
    // Simple pattern matching (this is a basic implementation)
    if (pattern.includes('*')) {
      // Wildcard matching
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(relativePath) || pathParts.some(part => regex.test(part))) {
        return true;
      }
    } else {
      // Exact matching
      if (relativePath === pattern || 
          relativePath.startsWith(pattern + '/') ||
          pathParts.includes(pattern)) {
        return true;
      }
    }
  }
  
  return false;
}

function getGitignoreRules(workingDir) {
  const gitignorePath = path.join(workingDir, '.gitignore');
  const now = Date.now();
  
  // Cache for 5 seconds to avoid excessive file reads
  if (gitignoreCache && (now - gitignoreCacheTime) < 5000) {
    return gitignoreCache;
  }
  
  gitignoreCache = parseGitignore(gitignorePath);
  gitignoreCacheTime = now;
  return gitignoreCache;
}

module.exports = {
  parseGitignore,
  isIgnoredByGitignore,
  getGitignoreRules
};