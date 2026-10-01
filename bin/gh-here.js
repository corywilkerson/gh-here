#!/usr/bin/env node

const express = require('express');
const { execFile } = require('node:child_process');
const { setupRoutes } = require('../lib/server');

const args = process.argv.slice(2);
const portArg = args.find((arg) => arg.startsWith('--port='));
const browser = args.find((arg) => arg.startsWith('--browser='))?.slice(10);
const port = portArg ? Number(portArg.slice(7)) : 5555;

if (args.includes('--help') || args.includes('-h')) {
  console.log(`gh-here — your working directory, beautifully browsable.

Usage: gh-here [options]

  --no-open          Start without opening your browser
  --port=<number>    Listen on a specific port (default: first available from 5555)
  --browser=<name>   Open in a particular browser
  --help, -h         Show help

Run from any directory. No Git repository required.`);
  process.exit(0);
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Port must be an integer between 1 and 65535.');
  process.exit(1);
}

function openBrowser(url) {
  const names = {
    safari: 'Safari',
    chrome: 'Google Chrome',
    firefox: 'Firefox',
    arc: 'Arc',
    edge: 'Microsoft Edge',
  };
  let command;
  let parameters;
  if (process.platform === 'darwin') {
    command = 'open';
    parameters = browser
      ? ['-a', names[browser.toLowerCase()] || browser, url]
      : [url];
  } else if (process.platform === 'win32') {
    command = 'rundll32.exe';
    parameters = ['url.dll,FileProtocolHandler', url];
  } else {
    command = browser || 'xdg-open';
    parameters = [url];
  }
  execFile(command, parameters, (error) => {
    if (error) console.log(`Open ${url} in your browser.`);
  });
}

const app = express();
setupRoutes(app, process.cwd());

function listen(candidate) {
  const server = app.listen(candidate, '127.0.0.1');
  server.once('listening', () => {
    const url = `http://127.0.0.1:${candidate}`;
    console.log(`gh-here  ${url}\n${process.cwd()}\nPress Ctrl+C to stop.`);
    if (!args.includes('--no-open')) openBrowser(url);
  });
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && !portArg && candidate < 65535)
      return listen(candidate + 1);
    console.error(`Could not start gh-here: ${error.message}`);
    process.exitCode = 1;
  });
}

listen(port);
