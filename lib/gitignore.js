/**
 * Gitignore handling module
 * Parses .gitignore files and filters files/directories
 * @module gitignore
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Cache
// ============================================================================

let gitignoreCache = null;
let gitignoreCacheTime = 0;
const CACHE_TTL_MS = 5000;

// ============================================================================
// Functions
// ============================================================================

/**
 * Gets cached gitignore rules or parses fresh from disk
 * @param {string} workingDir - Working directory path
 * @returns {Array<{pattern: string, isDirectory: boolean}>} Parsed rules
 */
function getGitignoreRules(workingDir) {
  const gitignorePath = path.join(workingDir, '.gitignore');
  const now = Date.now();
  
  if (gitignoreCache && (now - gitignoreCacheTime) < CACHE_TTL_MS) {
    return gitignoreCache;
  }
  
  gitignoreCache = parseGitignore(gitignorePath);
  gitignoreCacheTime = now;
  return gitignoreCache;
}

/**
 * Checks if a file path matches any gitignore rules
 * @param {string} filePath - File path to check
 * @param {Array} gitignoreRules - Parsed gitignore rules
 * @param {string} workingDir - Working directory for relative path calculation
 * @param {boolean} [isDirectory=false] - Whether the path is a directory
 * @returns {boolean} True if path should be ignored
 */
function isIgnoredByGitignore(filePath, gitignoreRules, workingDir, isDirectory = false) {
  if (!gitignoreRules?.length) {
    return false;
  }
  
  const relativePath = path.relative(workingDir, filePath).replace(/\\/g, '/');
  const pathParts = relativePath.split('/');
  
  for (const rule of gitignoreRules) {
    const { pattern, isDirectory: ruleIsDirectory } = rule;
    
    // Skip directory rules for files
    if (ruleIsDirectory && !isDirectory) {
      continue;
    }
    
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

/**
 * Parses a .gitignore file into structured rules
 * @param {string} gitignorePath - Path to .gitignore file
 * @returns {Array<{pattern: string, isDirectory: boolean}>} Parsed rules
 */
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

// ============================================================================
// Exports (alpha-sorted)
// ============================================================================

module.exports = {
  getGitignoreRules,
  isIgnoredByGitignore,
  parseGitignore
};