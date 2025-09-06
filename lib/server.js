const express = require('express');
const fs = require('fs');
const path = require('path');

const { getGitStatus, getGitBranch, commitAllChanges, commitSelectedFiles, getGitDiff } = require('./git');
const { isIgnoredByGitignore, getGitignoreRules } = require('./gitignore');
const { renderDirectory, renderFileDiff, renderFile, renderNewFile } = require('./renderers');
const { isImageFile, isBinaryFile } = require('./file-utils');

/**
 * Express server setup and route handlers
 */

function setupRoutes(app, workingDir, isGitRepo, gitRepoRoot) {
  
  // Serve static files
  app.use('/static', express.static(path.join(__dirname, '..', 'public')));
  app.use('/octicons', express.static(path.join(__dirname, '..', 'node_modules', '@primer', 'octicons', 'build')));


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
    const showGitignored = req.query.gitignore === 'false';
    const fullPath = path.join(workingDir, currentPath);
    
    // Get git status and branch info
    const gitStatus = await getGitStatus(gitRepoRoot);
    const gitBranch = await getGitBranch(gitRepoRoot);
    
    try {
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        const gitignoreRules = getGitignoreRules(workingDir);
        
        let items = fs.readdirSync(fullPath).map(item => {
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
            gitStatus: gitInfo
          };
        });
        
        // Filter out gitignored files unless explicitly requested to show them
        if (!showGitignored) {
          items = items.filter(item => {
            const itemFullPath = path.join(fullPath, item.name);
            return !isIgnoredByGitignore(itemFullPath, gitignoreRules, workingDir, item.isDirectory);
          });
        }
        
        // Sort items (directories first, then alphabetically)
        items.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
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
            const diffHtml = await renderFileDiff(currentPath, ext, gitInfo, gitRepoRoot);
            return res.send(diffHtml);
          }
        }
        
        res.send(await renderFile(currentPath, content, ext, viewMode, gitStatus, workingDir));
      }
    } catch (error) {
      res.status(404).send(`<h1>File not found</h1><p>${error.message}</p>`);
    }
  });

  // Route for creating new files
  app.get('/new', (req, res) => {
    const currentPath = req.query.path || '';
    res.send(renderNewFile(currentPath));
  });

  // API endpoint to get file content for editing
  app.get('/api/file-content', (req, res) => {
    try {
      const currentPath = req.query.path || '';
      const fullPath = path.join(workingDir, currentPath);
      
      // Security check - ensure we're not accessing files outside the current directory
      if (!fullPath.startsWith(workingDir)) {
        return res.status(403).send('Access denied');
      }
      
      // Check if it's a binary file - prevent editing
      if (isBinaryFile(fullPath)) {
        return res.status(400).json({ error: 'Cannot edit binary files' });
      }
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      res.send(content);
    } catch (error) {
      res.status(404).send(`File not found: ${error.message}`);
    }
  });

  // API endpoint to save file changes
  app.post('/api/save-file', express.json(), (req, res) => {
    try {
      const { path: filePath, content } = req.body;
      const fullPath = path.join(workingDir, filePath || '');
      
      // Security check - ensure we're not accessing files outside the current directory
      if (!fullPath.startsWith(workingDir)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      
      fs.writeFileSync(fullPath, content, 'utf-8');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API endpoint to create new file
  app.post('/api/create-file', express.json(), (req, res) => {
    try {
      const { path: dirPath, filename } = req.body;
      const fullDirPath = path.join(workingDir, dirPath || '');
      const fullFilePath = path.join(fullDirPath, filename);
      
      // Security checks
      if (!fullDirPath.startsWith(workingDir) || !fullFilePath.startsWith(workingDir)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      
      // Check if file already exists
      if (fs.existsSync(fullFilePath)) {
        return res.status(400).json({ success: false, error: 'File already exists' });
      }
      
      // Create the file with empty content
      fs.writeFileSync(fullFilePath, '', 'utf-8');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API endpoint to create new folder
  app.post('/api/create-folder', express.json(), (req, res) => {
    try {
      const { path: dirPath, foldername } = req.body;
      const fullDirPath = path.join(workingDir, dirPath || '');
      const fullFolderPath = path.join(fullDirPath, foldername);
      
      // Security checks
      if (!fullDirPath.startsWith(workingDir) || !fullFolderPath.startsWith(workingDir)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      
      // Check if folder already exists
      if (fs.existsSync(fullFolderPath)) {
        return res.status(400).json({ success: false, error: 'Folder already exists' });
      }
      
      // Create the folder
      fs.mkdirSync(fullFolderPath);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API endpoint to delete file or folder
  app.post('/api/delete', express.json(), (req, res) => {
    try {
      const { path: itemPath } = req.body;
      const fullPath = path.join(workingDir, itemPath);
      
      // Security check
      if (!fullPath.startsWith(workingDir)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      
      // Check if item exists
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }
      
      // Delete the item
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API endpoint to rename file or folder
  app.post('/api/rename', express.json(), (req, res) => {
    try {
      const { path: oldPath, newName } = req.body;
      const fullOldPath = path.join(workingDir, oldPath);
      const dirPath = path.dirname(fullOldPath);
      const fullNewPath = path.join(dirPath, newName);
      
      // Security checks
      if (!fullOldPath.startsWith(workingDir) || !fullNewPath.startsWith(workingDir)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      
      // Check if old item exists
      if (!fs.existsSync(fullOldPath)) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }
      
      // Check if new name already exists
      if (fs.existsSync(fullNewPath)) {
        return res.status(400).json({ success: false, error: 'Name already exists' });
      }
      
      // Rename the item
      fs.renameSync(fullOldPath, fullNewPath);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Git commit all endpoint
  app.post('/api/git-commit-all', express.json(), async (req, res) => {
    try {
      if (!isGitRepo) {
        return res.status(404).json({ success: false, error: 'Not a git repository' });
      }
      
      const { message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Commit message is required' });
      }
      
      try {
        const result = await commitAllChanges(gitRepoRoot, message);
        res.json(result);
      } catch (gitError) {
        console.error('Git commit error:', gitError);
        res.status(500).json({ success: false, error: gitError.message });
      }
    } catch (error) {
      console.error('Commit endpoint error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Git commit selected files endpoint
  app.post('/api/git-commit-selected', express.json(), async (req, res) => {
    try {
      if (!isGitRepo) {
        return res.status(404).json({ success: false, error: 'Not a git repository' });
      }
      
      const { message, files } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Commit message is required' });
      }
      
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, error: 'No files selected' });
      }
      
      try {
        const result = await commitSelectedFiles(gitRepoRoot, message, files);
        res.json(result);
      } catch (gitError) {
        console.error('Git commit error:', gitError);
        res.status(500).json({ success: false, error: gitError.message });
      }
    } catch (error) {
      console.error('Commit selected endpoint error:', error);
      res.status(500).json({ success: false, error: error.message });
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