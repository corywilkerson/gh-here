const fs = require('fs');
const path = require('path');
const { isIgnoredByGitignore, getGitignoreRules } = require('./gitignore');
const { isTextFile } = require('./file-utils');

/**
 * Full-text content search across codebase
 * 
 * @param {string} workingDir - Root directory to search
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {boolean} options.regex - Use regex pattern
 * @param {boolean} options.caseSensitive - Case sensitive search
 * @param {number} options.maxResults - Maximum number of results
 * @param {string[]} options.fileTypes - Filter by file extensions
 * @returns {Object} Search results
 */

const DEFAULT_MAX_RESULTS = 1000;
const MAX_MATCHES_PER_FILE = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function searchContent(workingDir, query, options = {}) {
  const {
    regex = false,
    caseSensitive = false,
    maxResults = DEFAULT_MAX_RESULTS,
    fileTypes = null
  } = options;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return {
      results: [],
      total: 0,
      query: ''
    };
  }

  const gitignoreRules = getGitignoreRules(workingDir);
  const results = [];
  let searchPattern;

  // Validate and create search pattern
  try {
    if (regex) {
      searchPattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
    } else {
      // Escape special regex characters for literal search
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      searchPattern = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
    }
  } catch (error) {
    throw new Error(`Invalid regular expression: ${error.message}`);
  }

  /**
   * Search a single file for matches
   */
  function searchFile(filePath, relativePath) {
    // Early return if we've reached max results
    if (results.length >= maxResults) {
      return false; // Signal to stop searching
    }

    try {
      const stats = fs.statSync(filePath);
      
      // Skip files that are too large
      if (stats.size > MAX_FILE_SIZE) {
        return true; // Continue searching other files
      }
      
      // Skip binary files
      const ext = path.extname(filePath).slice(1);
      if (!isTextFile(ext)) {
        return true;
      }

      // Skip gitignored files
      if (isIgnoredByGitignore(filePath, gitignoreRules, workingDir, false)) {
        return true;
      }

      // Filter by file type if specified
      if (fileTypes && Array.isArray(fileTypes) && fileTypes.length > 0) {
        const extLower = ext.toLowerCase();
        if (!fileTypes.some(type => type.toLowerCase() === extLower)) {
          return true;
        }
      }

      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const fileMatches = [];

      // Search each line
      lines.forEach((line, lineIndex) => {
        if (results.length >= maxResults) {
          return;
        }

        let matches;
        try {
          matches = [...line.matchAll(searchPattern)];
        } catch (error) {
          // Skip lines with regex errors
          return;
        }
        
        if (matches.length > 0) {
          matches.forEach(match => {
            if (match.index !== undefined && match[0]) {
              fileMatches.push({
                line: lineIndex + 1,
                column: match.index + 1,
                text: line.trim().substring(0, 200), // Limit preview length
                match: match[0]
              });
            }
          });
        }
      });

      // Add file to results if it has matches
      if (fileMatches.length > 0) {
        results.push({
          path: relativePath,
          matches: fileMatches.slice(0, MAX_MATCHES_PER_FILE),
          matchCount: fileMatches.length
        });
      }

      return true; // Continue searching
    } catch (error) {
      // Skip files we can't read (permissions, etc.)
      return true;
    }
  }

  /**
   * Recursively search a directory
   */
  function searchDirectory(dir, relativePath = '') {
    // Early return if we've reached max results
    if (results.length >= maxResults) {
      return;
    }

    let entries;
    try {
      entries = fs.readdirSync(dir);
    } catch (error) {
      // Skip directories we can't access
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxResults) {
        break;
      }

      const fullPath = path.join(dir, entry);
      const relPath = path.join(relativePath, entry).replace(/\\/g, '/');

      try {
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          // Skip gitignored directories
          if (!isIgnoredByGitignore(fullPath, gitignoreRules, workingDir, true)) {
            searchDirectory(fullPath, relPath);
          }
        } else if (stats.isFile()) {
          const shouldContinue = searchFile(fullPath, relPath);
          if (!shouldContinue) {
            // Reached max results, stop searching
            break;
          }
        }
      } catch (error) {
        // Skip files/dirs we can't access
        continue;
      }
    }
  }

  // Start search
  try {
    searchDirectory(workingDir);
  } catch (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  // Sort results by match count (descending), then by path (ascending)
  results.sort((a, b) => {
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount;
    }
    return a.path.localeCompare(b.path);
  });

  return {
    results: results.slice(0, maxResults),
    total: results.length,
    query: query.trim()
  };
}

module.exports = {
  searchContent
};
