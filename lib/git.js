/**
 * Git operations module
 * Handles git status, commits, diffs, and branch operations
 * @module git
 */

const { exec } = require('child_process');
const fs = require('fs');
const octicons = require('@primer/octicons');
const path = require('path');

// Check if current directory or any parent is a git repository
function findGitRepo(dir) {
  if (fs.existsSync(path.join(dir, '.git'))) {
    return dir;
  }
  const parentDir = path.dirname(dir);
  if (parentDir === dir) {
    return null; // Reached root directory
  }
  return findGitRepo(parentDir);
}

// Git status icon helpers
function getGitStatusIcon(status) {
  switch (status.trim()) {
    case 'M': return octicons['dot-fill'].toSVG({ class: 'git-status-icon' });
    case 'A': return octicons['plus'].toSVG({ class: 'git-status-icon' });
    case 'D': return octicons['dash'].toSVG({ class: 'git-status-icon' });
    case 'R': return octicons['arrow-right'].toSVG({ class: 'git-status-icon' });
    case '??': return octicons['dot-fill'].toSVG({ class: 'git-status-icon' });
    case 'MM': 
    case 'AM': 
    case 'AD': return octicons['dot-fill'].toSVG({ class: 'git-status-icon' });
    default: return octicons['dot-fill'].toSVG({ class: 'git-status-icon' });
  }
}

function getGitStatusDescription(status) {
  switch (status.trim()) {
    case 'M': return 'Modified';
    case 'A': return 'Added';
    case 'D': return 'Deleted';
    case 'R': return 'Renamed';
    case '??': return 'Untracked';
    case 'MM': return 'Modified (staged and unstaged)';
    case 'AM': return 'Added (modified)';
    case 'AD': return 'Added (deleted)';
    default: return `Git status: ${status}`;
  }
}

// Get git status for files
function getGitStatus(gitRepoRoot) {
  return new Promise((resolve) => {
    if (!gitRepoRoot) {
      resolve({});
      return;
    }
    
    exec('git status --porcelain', { cwd: gitRepoRoot }, (error, stdout) => {
      if (error) {
        resolve({});
        return;
      }
      
      const statusMap = {};
      const lines = stdout.trim().split('\n').filter(line => line);
      
      for (const line of lines) {
        const status = line.substring(0, 2);
        // Git status format: XY filename - find first non-space character after position 2
        const filePath = line.substring(2).replace(/^\s+/, '');
        const absolutePath = path.resolve(gitRepoRoot, filePath);
        statusMap[absolutePath] = {
          status: status.trim(),
          staged: status[0] !== ' ' && status[0] !== '?',
          modified: status[1] !== ' ',
          untracked: status === '??'
        };
        
        // If this is an untracked directory, mark all files within it as untracked too
        if (status === '??' && fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
          try {
            const markFilesInDirectory = (dirPath) => {
              const entries = fs.readdirSync(dirPath);
              for (const entry of entries) {
                const entryPath = path.join(dirPath, entry);
                const entryStat = fs.statSync(entryPath);
                
                statusMap[entryPath] = {
                  status: '??',
                  staged: false,
                  modified: false,
                  untracked: true
                };
                
                // Recursively handle subdirectories
                if (entryStat.isDirectory()) {
                  markFilesInDirectory(entryPath);
                }
              }
            };
            markFilesInDirectory(absolutePath);
          } catch (err) {
            // Ignore errors reading directory contents
          }
        }
      }
      
      resolve(statusMap);
    });
  });
}

// Get git branch info
function getGitBranch(gitRepoRoot) {
  return new Promise((resolve) => {
    if (!gitRepoRoot) {
      resolve(null);
      return;
    }
    
    exec('git branch --show-current', { cwd: gitRepoRoot }, (error, stdout) => {
      if (error) {
        resolve('main');
        return;
      }
      resolve(stdout.trim() || 'main');
    });
  });
}

// Get git diff for a specific file
function getGitDiff(gitRepoRoot, filePath, staged = false) {
  return new Promise((resolve, reject) => {
    const diffCommand = staged ? 
      `git diff --cached "${filePath}"` : 
      `git diff "${filePath}"`;
    
    exec(diffCommand, { cwd: gitRepoRoot }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(error.message));
      }
      
      resolve({
        success: true,
        diff: stdout,
        staged: staged,
        filePath: filePath
      });
    });
  });
}

module.exports = {
  findGitRepo,
  getGitBranch,
  getGitDiff,
  getGitStatus,
  getGitStatusDescription,
  getGitStatusIcon
};