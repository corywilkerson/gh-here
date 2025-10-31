# gh-here

Local GitHub-style file browser for viewing codebases. Browse directories, view files with syntax highlighting, and explore git diffs.

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
gh-here --open                    # Start and open browser
gh-here --port=8080               # Use specific port
gh-here --open --browser=safari   # Open in Safari
```

## Features

- Directory browsing with file icons
- Syntax highlighting for 30+ languages
- README preview with markdown rendering
- Language statistics
- Git status indicators
- Diff viewer with line numbers
- Search files
- Copy/download files
- Rename/delete files and folders
- .gitignore filtering
- Dark/light themes
- Keyboard navigation

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j`/`k` or arrows | Navigate files |
| `Enter` or `o` | Open file/folder |
| `h` | Go up directory |
| `/` or `s` | Focus search |
| `t` | Toggle theme |
| `i` | Toggle .gitignore |
| `d` | Show diff (if git changes) |
| `r` | Refresh |
| `?` | Show shortcuts |

## Development

```bash
npm install
npm start
```

## Dependencies

- express
- highlight.js
- marked
- @primer/octicons