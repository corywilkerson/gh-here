/**
 * Builds file tree structure for navigation
 */

const fs = require('fs');
const path = require('path');
const { isIgnoredByGitignore } = require('./gitignore');

function buildFileTree(dirPath, relativePath = '', gitignoreRules, workingDir, showGitignored = false, maxDepth = 5, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    const items = fs.readdirSync(dirPath);
    const tree = [];

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;

      // Always skip .git directory and node_modules
      if (item === '.git' || item === 'node_modules') {
        continue;
      }

      // Skip other hidden files/folders unless showing gitignored
      if (!showGitignored && item.startsWith('.')) {
        continue;
      }

      // Skip gitignored items unless explicitly showing them
      if (!showGitignored && isIgnoredByGitignore(fullPath, gitignoreRules, workingDir, false)) {
        continue;
      }

      const stats = fs.statSync(fullPath);
      const isDirectory = stats.isDirectory();

      const treeItem = {
        name: item,
        path: itemRelativePath,
        isDirectory
      };

      if (isDirectory) {
        treeItem.children = buildFileTree(
          fullPath,
          itemRelativePath,
          gitignoreRules,
          workingDir,
          showGitignored,
          maxDepth,
          currentDepth + 1
        );
      }

      tree.push(treeItem);
    }

    // Sort: directories first, then alphabetically
    tree.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) {
        return -1;
      }
      if (!a.isDirectory && b.isDirectory) {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });

    return tree;
  } catch (error) {
    console.error('Error building file tree:', error);
    return [];
  }
}

module.exports = {
  buildFileTree
};
