# gh-here

A local GitHub-like file browser for viewing code in your terminal. Launch it in any folder to get a beautiful web-based directory browser with syntax highlighting and powerful navigation features.

## Installation

```bash
npm install -g .
```

## Usage

Navigate to any directory and run:

```bash
npx gh-here
```

The app will start a local server at `http://localhost:3000` and serve your current directory with a GitHub-like interface.

## Features

### 📁 File Browsing
- Beautiful directory browsing with specific file type icons
- README preview with beautiful markdown rendering
- Language statistics for project overview
- Quick actions (copy path, download files)
- Responsive design for mobile and desktop

### 🎨 Code Viewing
- GitHub-accurate syntax highlighting for 25+ languages
- Line numbers with GitHub-style selection (click, shift-click, ctrl-click)
- Raw and rendered markdown views
- Shareable URLs with line selections (`#L10-L20`)

### ⌨️ Keyboard Navigation
- `j`/`k` or arrow keys to navigate files
- `Enter` or `o` to open files/folders
- `/` or `s` to focus search
- `h` to go up directory
- `t` to toggle theme
- `r` to refresh
- `?` to show keyboard shortcuts

### 🌙 Themes & UI
- GitHub dark and light themes
- Smart header path (shows "gh-here" at root, path when browsing)
- Search functionality with keyboard shortcuts
- Breadcrumb navigation

## Supported File Types

### Programming Languages
- JavaScript (.js, .mjs, .jsx) - React, Node.js
- TypeScript (.ts, .tsx)
- Python (.py)
- Java (.java)
- Go (.go)
- Rust (.rs)
- PHP (.php)
- Ruby (.rb)
- Swift (.swift)
- Kotlin (.kt)
- Dart (.dart)

### Web Technologies
- HTML (.html)
- CSS (.css, .scss, .sass, .less)
- JSON (.json)
- XML (.xml)
- YAML (.yml, .yaml)

### Documentation & Config
- Markdown (.md) - with beautiful rendering
- Text files (.txt)
- Configuration files (ESLint, Prettier, Webpack, etc.)
- Docker files (Dockerfile, docker-compose.yml)
- Environment files (.env)

### Media & Archives
- Images (.png, .jpg, .gif, .svg, .webp)
- Videos (.mp4, .mov, .avi)
- Audio (.mp3, .wav, .flac)
- Archives (.zip, .tar, .gz, .rar)

### Shell & Database
- Shell scripts (.sh, .bash, .zsh)
- SQL (.sql)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `j` / `↓` | Move down |
| `k` / `↑` | Move up |
| `Enter` / `o` | Open file/folder |
| `h` | Go up directory |
| `/` / `s` | Focus search |
| `Ctrl/Cmd + K` | Focus search |
| `Ctrl/Cmd + G` | Go to top |
| `Shift + G` | Go to bottom |
| `t` | Toggle theme |
| `r` | Refresh page |
| `?` | Show keyboard shortcuts |

## Line Selection (Code Files)

- **Click line number**: Select single line
- **Shift + Click**: Select range
- **Ctrl/Cmd + Click**: Multi-select lines
- **URLs**: Automatically updated (`#L5`, `#L10-L20`, `#L1,L5-L10`)

## Development

```bash
npm install
npm start
```

Navigate to `http://localhost:3000` to view the interface.

## Dependencies

- **express** - Web server
- **highlight.js** - Syntax highlighting  
- **marked** - Markdown rendering
- **@primer/octicons** - GitHub icons