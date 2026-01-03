const express = require('express');
const fs = require('fs');
const path = require('path');

const { buildFileTree } = require('./file-tree-builder');
const { getGitBranch, getGitDiff, getGitStatus } = require('./git');
const { getGitignoreRules, isIgnoredByGitignore } = require('./gitignore');
const { groupSymbolsByKind, parseSymbols } = require('./symbol-parser');
const { isBinaryFile, isImageFile } = require('./file-utils');
const { renderDirectory, renderFile, renderFileDiff } = require('./renderers');
const { searchContent } = require('./content-search');

/**
 * Express server setup and route handlers
 */

function setupRoutes(app, workingDir, isGitRepo, gitRepoRoot) {
  
  // Serve static files
  app.use('/static', express.static(path.join(__dirname, '..', 'public')));
  app.use('/octicons', express.static(path.join(__dirname, '..', 'node_modules', '@primer', 'octicons', 'build')));


  // API endpoint for file tree
  app.get('/api/file-tree', (req, res) => {
    try {
      const showGitignored = req.query.showGitignored === 'true';
      const gitignoreRules = getGitignoreRules(workingDir);
      const tree = buildFileTree(workingDir, '', gitignoreRules, workingDir, showGitignored);
      res.json({ success: true, tree });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API endpoint for global file search
  app.get('/api/search', (req, res) => {
    try {
      const query = req.query.q || '';
      if (!query.trim()) {
        return res.json({ success: true, results: [] });
      }

      const gitignoreRules = getGitignoreRules(workingDir);
      const results = [];
      const lowerQuery = query.toLowerCase();

      function searchDirectory(dir, relativePath = '') {
        const entries = fs.readdirSync(dir);

        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const relPath = path.join(relativePath, entry).replace(/\\/g, '/');

          try {
            const stats = fs.statSync(fullPath);

            // Skip gitignored files
            if (!isIgnoredByGitignore(fullPath, gitignoreRules, workingDir, stats.isDirectory())) {
              // Check if filename matches
              if (entry.toLowerCase().includes(lowerQuery)) {
                results.push({
                  path: relPath,
                  name: entry,
                  isDirectory: stats.isDirectory(),
                  modified: stats.mtime
                });
              }

              // Recurse into directories
              if (stats.isDirectory()) {
                searchDirectory(fullPath, relPath);
              }
            }
          } catch (err) {
            // Skip files we can't access
            continue;
          }
        }
      }

      searchDirectory(workingDir);

      // Sort results: exact matches first, then directories, then alphabetically
      results.sort((a, b) => {
        const aExact = a.name.toLowerCase() === lowerQuery ? 1 : 0;
        const bExact = b.name.toLowerCase() === lowerQuery ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;

        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.path.localeCompare(b.path);
      });

      res.json({ success: true, results, query });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API endpoint for full-text content search
  app.get('/api/search-content', (req, res) => {
    try {
      const query = req.query.q || '';
      if (!query.trim()) {
        return res.json({ success: true, results: [], total: 0, query: '' });
      }

      const regex = req.query.regex === 'true';
      const caseSensitive = req.query.caseSensitive === 'true';
      const maxResults = parseInt(req.query.maxResults || '1000', 10);
      const fileTypes = req.query.fileTypes ? req.query.fileTypes.split(',') : null;

      const result = searchContent(workingDir, query, {
        regex,
        caseSensitive,
        maxResults,
        fileTypes
      });

      res.json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // API endpoint for code symbols (functions, classes, etc.)
  app.get('/api/symbols', (req, res) => {
    try {
      const filePath = req.query.path;
      if (!filePath) {
        return res.status(400).json({ success: false, error: 'Path is required' });
      }

      // Validate path is within working directory
      const fullPath = path.resolve(path.join(workingDir, filePath));
      if (!fullPath.startsWith(workingDir)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      // Check file exists
      if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }

      // Read file content
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Parse symbols
      const symbols = parseSymbols(content, filePath);
      const grouped = groupSymbolsByKind(symbols);

      res.json({ 
        success: true, 
        symbols, 
        grouped,
        total: symbols.length,
        path: filePath
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Download route
  app.get('/download', (req, res) => {
    const filePath = req.query.path || '';
    const fullPath = path.join(workingDir, filePath);
    
    try {
      const stats = fs.statSync(fullPath);
      if (stats.isFile()) {
        const fileName = path.basename(fullPath);
        
        // For images, serve inline for viewing, otherwise force download
        if (isImageFile(fullPath)) {
          // Serve image inline
          res.sendFile(fullPath);
        } else {
          // Force download for non-images
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.sendFile(fullPath);
        }
      } else {
        res.status(400).send('Cannot download directories');
      }
    } catch (error) {
      res.status(404).send('File not found');
    }
  });

  // Main route - directory or file view
  app.get('/', async (req, res) => {
    const currentPath = req.query.path || '';
    const showGitignored = req.query.showGitignored === 'true';
    const fullPath = path.join(workingDir, currentPath);
    
    // Get git status and branch info
    const gitStatus = await getGitStatus(gitRepoRoot);
    const gitBranch = await getGitBranch(gitRepoRoot);
    
    try {
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        const gitignoreRules = getGitignoreRules(workingDir);
        
        // Optimize: Batch file system operations
        const dirEntries = fs.readdirSync(fullPath);
        const items = dirEntries
          .map(item => {
            const itemPath = path.join(fullPath, item);
            const itemStats = fs.statSync(itemPath);
            const absoluteItemPath = path.resolve(itemPath);
            const gitInfo = gitStatus[absoluteItemPath] || null;
            
            return {
              name: item,
              path: path.join(currentPath, item).replace(/\\/g, '/'),
              isDirectory: itemStats.isDirectory(),
              size: itemStats.size,
              modified: itemStats.mtime,
              gitStatus: gitInfo,
              fullPath: itemPath
            };
          })
          .filter(item => {
            // Filter gitignored files unless explicitly requested
            if (!showGitignored) {
              return !isIgnoredByGitignore(item.fullPath, gitignoreRules, workingDir, item.isDirectory);
            }
            return true;
          })
          .sort((a, b) => {
            // Sort: directories first, then alphabetically
            if (a.isDirectory !== b.isDirectory) {
              return a.isDirectory ? -1 : 1;
            }
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
          });
        
        res.send(renderDirectory(currentPath, items, showGitignored, gitBranch, gitStatus, workingDir));
      } else {
        const ext = path.extname(fullPath).slice(1);
        const viewMode = req.query.view || 'rendered';
        
        // For image files, don't try to read as text
        let content = '';
        if (!isImageFile(fullPath)) {
          content = fs.readFileSync(fullPath, 'utf8');
        }
        
        if (viewMode === 'diff' && isGitRepo) {
          // Check if file has git status
          const absolutePath = path.resolve(fullPath);
          const gitInfo = gitStatus[absolutePath];
          if (gitInfo) {
            const diffHtml = await renderFileDiff(currentPath, ext, gitInfo, gitRepoRoot, workingDir, gitBranch);
            return res.send(diffHtml);
          }
        }

        res.send(await renderFile(currentPath, content, ext, viewMode, gitStatus, workingDir));
      }
    } catch (error) {
      res.status(404).send(`<h1>File not found</h1><p>${error.message}</p>`);
    }
  });

  // API endpoint to get raw file content (for copy raw feature)
  app.get('/api/file-content', (req, res) => {
    try {
      const currentPath = req.query.path || '';
      const fullPath = path.join(workingDir, currentPath);
      
      // Security check - ensure we're not accessing files outside the current directory
      if (!fullPath.startsWith(workingDir)) {
        return res.status(403).send('Access denied');
      }
      
      // Skip binary files
      if (isBinaryFile(fullPath)) {
        return res.status(400).json({ error: 'Cannot read binary files as text' });
      }
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Set proper headers for raw file view (like GitHub)
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(fullPath)}"`);
      
      res.send(content);
    } catch (error) {
      res.status(404).send(`File not found: ${error.message}`);
    }
  });

  // Get git changes endpoint (with directory filtering)
  app.get('/api/git-status', async (req, res) => {
    try {
      if (!isGitRepo) {
        return res.status(404).json({ success: false, error: 'Not a git repository' });
      }
      
      const currentPath = req.query.currentPath || '';
      const currentDir = currentPath ? path.resolve(workingDir, currentPath) : workingDir;
      
      const gitStatus = await getGitStatus(gitRepoRoot);
      let changes = Object.entries(gitStatus).map(([filePath, info]) => {
        // Convert absolute path to relative path from repo root
        const relativePath = path.relative(gitRepoRoot, filePath);
        return {
          name: relativePath,
          status: require('./git').getGitStatusDescription(info.status),
          fullPath: filePath
        };
      });
      
      // Filter to only show files in current directory and subdirectories
      if (currentPath) {
        const currentRelativePath = path.relative(gitRepoRoot, currentDir);
        changes = changes.filter(change => {
          // Include files that are in the current directory or its subdirectories
          return change.name.startsWith(currentRelativePath + path.sep) || change.name === currentRelativePath;
        });
      } else {
        // If at root, show files in working directory and below
        const workingRelativePath = path.relative(gitRepoRoot, workingDir);
        if (workingRelativePath && workingRelativePath !== '.') {
          changes = changes.filter(change => {
            return change.name.startsWith(workingRelativePath + path.sep) || change.name === workingRelativePath;
          });
        }
      }
      
      // Sort changes alphabetically
      changes.sort((a, b) => a.name.localeCompare(b.name));
      
      res.json({ success: true, changes });
    } catch (error) {
      console.error('Git status endpoint error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Git diff endpoint
  app.get('/api/git-diff', async (req, res) => {
    try {
      if (!isGitRepo) {
        return res.status(404).json({ success: false, error: 'Not a git repository' });
      }
      
      const filePath = req.query.path;
      const staged = req.query.staged === 'true';
      
      if (!filePath) {
        return res.status(400).json({ success: false, error: 'File path is required' });
      }
      
      try {
        const result = await getGitDiff(gitRepoRoot, filePath, staged);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

module.exports = {
  setupRoutes
};