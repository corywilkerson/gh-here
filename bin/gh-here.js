#!/usr/bin/env node

const express = require('express');
const { exec } = require('child_process');

// Import our modularized components
const { findGitRepo } = require('../lib/git');
const { setupRoutes } = require('../lib/server');

// Parse command line arguments
const args = process.argv.slice(2);
const openBrowser = args.includes('--open') || args.includes('-o');
const helpRequested = args.includes('--help') || args.includes('-h');

// Check for port specification
let specifiedPort = null;
const portArg = args.find(arg => arg.startsWith('--port='));
if (portArg) {
  specifiedPort = parseInt(portArg.split('=')[1]);
  if (isNaN(specifiedPort) || specifiedPort < 1 || specifiedPort > 65535) {
    console.error('❌ Invalid port number. Port must be between 1 and 65535.');
    process.exit(1);
  }
}

// Check for browser specification
let specificBrowser = null;
const browserArg = args.find(arg => arg.startsWith('--browser='));
if (browserArg) {
  specificBrowser = browserArg.split('=')[1];
}

if (helpRequested) {
  console.log(`
gh-here - GitHub-like local file browser

Usage: npx gh-here [options]

Options:
  --open, -o              Open browser automatically
  --browser=<name>        Specify browser (safari, chrome, firefox, arc)
  --port=<number>         Specify port number (default: 5555)
  --help, -h              Show this help message

Examples:
  npx gh-here                           Start server on port 5555 (or next available)
  npx gh-here --open                    Start server and open browser
  npx gh-here --port=8080               Start server on port 8080
  npx gh-here --open --browser=safari   Start server and open in Safari
  npx gh-here --open --browser=arc      Start server and open in Arc
`);
  process.exit(0);
}

const app = express();
const workingDir = process.cwd();

// Git repository detection
const gitRepoRoot = findGitRepo(workingDir);
const isGitRepo = !!gitRepoRoot;

// Setup all routes
setupRoutes(app, workingDir, isGitRepo, gitRepoRoot);

// Function to find an available port
async function findAvailablePort(startPort = 5555) {
  const net = require('net');
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try next one
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

// Function to open browser
function openBrowserToUrl(url) {
  let command;
  
  if (process.platform === 'win32') {
    if (specificBrowser) {
      // On Windows, try to use specific browser
      const browserMap = {
        'chrome': 'chrome.exe',
        'firefox': 'firefox.exe',
        'edge': 'msedge.exe',
        'safari': 'safari.exe'
      };
      const browserExe = browserMap[specificBrowser.toLowerCase()] || `${specificBrowser}.exe`;
      command = `start ${browserExe} ${url}`;
    } else {
      command = `start ${url}`;
    }
  } else if (process.platform === 'darwin') {
    if (specificBrowser) {
      // On macOS, use specific browser application
      const browserMap = {
        'safari': 'Safari',
        'chrome': 'Google Chrome', 
        'firefox': 'Firefox',
        'arc': 'Arc',
        'edge': 'Microsoft Edge'
      };
      const browserApp = browserMap[specificBrowser.toLowerCase()] || specificBrowser;
      command = `open -a "${browserApp}" "${url}"`;
      console.log(`🔗 Opening in ${browserApp}: ${url}`);
    } else {
      // Use default browser
      command = `open "${url}"`;
      console.log(`🔗 Opening in default browser: ${url}`);
    }
  } else {
    // Linux
    if (specificBrowser) {
      command = `${specificBrowser} ${url}`;
    } else {
      command = `xdg-open ${url}`;
    }
  }
  
  exec(command, (error) => {
    if (error) {
      console.log(`⚠️  Could not open browser automatically: ${error.message}`);
      if (specificBrowser) {
        console.log(`   Make sure ${specificBrowser} is installed and accessible`);
      }
      console.log(`   Please open ${url} manually`);
    } else {
      console.log(`✅ Browser opened successfully`);
    }
  });
}

// Start server with automatic port selection
async function startServer() {
  try {
    let port;
    if (specifiedPort) {
      // If user specified a port, try only that port
      const net = require('net');
      const server = net.createServer();
      
      try {
        await new Promise((resolve, reject) => {
          server.listen(specifiedPort, () => {
            server.close(() => resolve());
          });
          server.on('error', reject);
        });
        port = specifiedPort;
      } catch (error) {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${specifiedPort} is already in use. Please choose a different port.`);
          process.exit(1);
        } else {
          throw error;
        }
      }
    } else {
      // Find available port starting from 5555
      port = await findAvailablePort(5555);
    }
    const url = `http://localhost:${port}`;
    
    app.listen(port, () => {
      console.log(`🚀 gh-here is running at ${url}`);
      console.log(`📂 Serving files from: ${workingDir}`);
      
      if (openBrowser) {
        console.log(`🌍 Opening browser...`);
        setTimeout(() => openBrowserToUrl(url), 1000);
      } else {
        console.log(`💡 Tip: Use --open flag to launch browser automatically`);
      }
    });
  } catch (error) {
    console.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();