/**
 * Builds file tree structure for navigation
 */

const fs = require('fs');
const path = require('path');
const { isIgnoredByGitignore } = require('./gitignore');

function buildFileTree(dirPath, relativePath = '', gitignoreRules, workingDir, maxDepth = 5, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    const items = fs.readdirSync(dirPath);
    const tree = [];

    for (const item of items) {
      // Skip hidden files/folders and node_modules
      if (item.startsWith('.') || item === 'node_modules') {
        continue;
      }

      const fullPath = path.join(dirPath, item);
      const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;

      // Skip gitignored items
      if (isIgnoredByGitignore(fullPath, gitignoreRules, workingDir, false)) {
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
