# gh-here

A local GitHub-like file browser for viewing and exploring codebases in your browser. Launch it in any folder to get a beautiful web-based directory browser with syntax highlighting and powerful navigation features.

## Why?

TUIs (Terminal User Interfaces) like Claude Code, Google Gemini CLI, and Cursor are becoming very popular tools for working on codebases, but they don't provide a visual view into the directories and files themselves. gh-here exists to fill that gap, so you can easily explore your project files in a familiar GitHub-esque browser GUI.

<!-- Test change for commit interface -->

## Installation

Run gh-here directly with npx (no installation required):

```bash
npx gh-here
```

Or install it globally:

```bash
npm install -g gh-here
```

## Usage

Navigate to any directory and run:

```bash
gh-here                           # Start server on available port
gh-here --open                    # Start server and open browser
gh-here --open --browser=safari   # Start server and open in Safari
gh-here --open --browser=arc      # Start server and open in Arc
```

The app will automatically find an available port starting from 3000 and serve your current directory with a GitHub-like interface.

## Features

### 📁 File Browsing
- Beautiful directory browsing with specific file type icons
- README preview with beautiful markdown rendering
- Language statistics for project overview
- Quick actions (copy path, download files, edit, rename, delete)
- .gitignore support with toggle functionality
- File and folder creation, editing, renaming, and deletion

### 🎨 Code Viewing & Editing
- GitHub-accurate syntax highlighting for 25+ languages
- Line numbers with GitHub-style selection (click, shift-click, ctrl-click)
- In-browser file editing with auto-save to localStorage
- Raw and rendered markdown views
- Shareable URLs with line selections (`#L10-L20`)
- Syntax highlighting and line numbers in editor

### 🔀 Git Integration
- Automatic git repository detection
- Clean git status indicators with colored dots in dedicated column
- Smart status detection for files within untracked directories
- Professional inline diff viewer with syntax highlighting
- View/Diff/Edit mode toggle for files with changes
- Beautiful raw git diff display with color coding
- Git branch display in navigation header
- Visual status indicators: modified (dot), untracked (purple dot), added, deleted

### ⌨️ Keyboard Navigation
- `j`/`k` or arrow keys to navigate files
- `Enter` or `o` to open files/folders
- `e` to edit focused file
- `c` to create new file
- `/` or `s` to focus search
- `h` to go up directory
- `t` to toggle theme
- `i` to toggle .gitignore filter
- `d` to show diff for focused file (if git changes)
- `r` to refresh
- `?` to show keyboard shortcuts
- `Ctrl/Cmd + S` to save file (in editor)
- `Esc` to close editor/dialogs

### 🌙 Themes & UI
- GitHub dark and light themes
- Smart header path (shows "gh-here" at root, path when browsing)
- Search functionality with keyboard shortcuts
- Breadcrumb navigation
- Error handling and loading states
- Notification system for user feedback

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
| `e` | Edit focused file |
| `c` | Create new file |
| `h` | Go up directory |
| `/` / `s` | Focus search |
| `Ctrl/Cmd + K` | Focus search |
| `Ctrl/Cmd + G` | Go to top |
| `Shift + G` | Go to bottom |
| `t` | Toggle theme |
| `i` | Toggle .gitignore filter |
| `d` | Show diff for focused file |
| `r` | Refresh page |
| `?` | Show keyboard shortcuts |
| `Ctrl/Cmd + S` | Save file (in editor) |
| `Esc` | Close editor/dialogs |

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