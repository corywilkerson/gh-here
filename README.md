# gh-here

A fast, local GitHub-style file browser for exploring codebases. Browse directories with a file tree, view files with syntax highlighting, and explore git diffs - all in your browser.

## Installation

```bash
npx gh-here
```

Or install globally:

```bash
npm install -g gh-here
```

## Usage

```bash
gh-here                           # Start server on available port
gh-here --open                    # Start and open browser (default)
gh-here --port=8080               # Use specific port
gh-here --open --browser=safari   # Open in Safari
```

## Features

### Core
- **File Tree Sidebar** - Navigate your repository structure with an interactive file tree
- **Context-Aware Search** - Global repository search or filter the file tree
- **Client-Side Navigation** - Fast page transitions without full reloads
- **Syntax Highlighting** - Support for 30+ languages via highlight.js
- **Git Integration** - Status indicators and diff viewer with line numbers

### UI/UX
- **Gitignore Toggle** - Show/hide gitignored files (persists in localStorage)
- **Dark/Light Themes** - Toggle between themes
- **README Preview** - Automatic markdown rendering
- **Language Statistics** - See breakdown of languages in your repo
- **File Operations** - Copy file paths, download files, view raw content

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Cmd/Ctrl + K` | Focus search |
| `Escape` | Close search/modals |

## How It Works

gh-here runs a local Express server that serves a read-only view of your codebase. It:

1. Respects your `.gitignore` (optional toggle to show ignored files)
2. Shows git status and diffs for modified files
3. Provides a familiar GitHub-like interface
4. Works entirely offline - no data leaves your machine

## Development

```bash
npm install
npm start
```

## Dependencies

- express - Web server
- highlight.js - Syntax highlighting
- marked - Markdown rendering
- @primer/octicons - GitHub icons

## License

MIT
