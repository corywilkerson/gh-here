# gh-here

Your working directory, beautifully browsable.

A fast, local file browser. Familiar navigation. Beautiful code, powered by [Pierre Diffs](https://diffs.com) and [Pierre Trees](https://trees.software).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/corywilkerson/gh-here/main/docs/screenshots/review-dark.png">
  <img alt="gh-here reviewing uncommitted changes on a feature branch: a file tree with change badges, diff stats, and a split diff" src="https://raw.githubusercontent.com/corywilkerson/gh-here/main/docs/screenshots/review-light.png">
</picture>

## Usage

```bash
gh-here
```

Run from any directory. gh-here opens a read-only browser for that directory; no repository, account, or Git installation is needed.

```bash
npx gh-here                      # Open the current directory
npx gh-here --no-open            # Start without opening a browser
npx gh-here --port=8080          # Use a particular port
npx gh-here --browser=safari     # Choose a browser (macOS / Linux)
```

Or install globally with `npm install -g gh-here`.

## A small, focused workspace

- **Review changes** like a pull request. Every file you've changed since the last commit stacks in one scrolling review, in split or unified view, with diff stats in the sidebar. Staged and unstaged edits, new files, deletions and renames all appear. When there's work in progress, gh-here opens straight to it.
- **Watch it update live.** Edit a file, or let an agent edit it, and the review refreshes in place within a couple of seconds, keeping your scroll position and collapsed files.
- **Move fast with the keyboard.** `j` / `k` step through changed files; `⌘K`, `Ctrl K` or `/` jumps to any file by name or path.
- **Browse** folders in a virtualized file tree that loads subfolders on demand, and read syntax-highlighted code, Markdown previews and images. Select line numbers to create a line link.
- **Make it yours:** light and dark themes, wrapped lines, collapsible files, and a sidebar you can hide. On a phone the sidebar becomes a drawer and diffs go unified.

<p>
  <img alt="Reading a file in dark mode, with a selected line range" src="https://raw.githubusercontent.com/corywilkerson/gh-here/main/docs/screenshots/code-dark.png" width="74%">
  <img alt="The review on a phone, with unified diffs" src="https://raw.githubusercontent.com/corywilkerson/gh-here/main/docs/screenshots/phone-dark.png" width="21%">
</p>

Changes is hidden when Git is unavailable or the directory is outside a repository.

By default, `.git`, dependencies, build output, and files matched by `.gitignore` are hidden. Nested ignore files are supported. **Show ignored** reveals them. **Filter files** filters the loaded tree; **Go to file** searches across the working directory. Search is bounded to keep very large directories responsive.

Refresh reads the latest contents from disk. gh-here never writes to your files or changes Git state. Git commands only read local repository information; no remotes or accounts are involved. The server binds only to `127.0.0.1`; local fonts, syntax grammars, and application assets are bundled, with no CDN or telemetry. External README images are replaced by their alt text. Links to external sites open only when clicked.

Text previews and comparisons support files up to 2 MB and 20,000 lines. Larger files and binary files can be downloaded. Symlinks that leave the working directory are excluded.

## Development

```bash
npm install
npm run build
npm start -- --no-open
npm run check
npm test
npm run test:ui
```

Rebuild after changing `client/`; esbuild bundles the JavaScript and the stylesheets in `client/styles/` into `public/build/`. The frontend is vanilla JavaScript, with lazy loading for Markdown, code rendering, and individual syntax grammars. `npm pack` builds and includes the assets so installed users need no build step.

`npm test` checks filesystem behavior and local Git comparisons with temporary directories and repositories. `npm run test:ui` builds, then runs the main browser workflows with Playwright Chromium; install the test browser with `npx playwright install chromium` if needed. `npm run check` runs Prettier and ESLint.

## License

MIT. Pierre Diffs and Trees are Apache-2.0; Geist fonts are SIL Open Font License. Font licenses are included alongside the bundled fonts; bundled library licenses and notices are included in `public/licenses/`.
