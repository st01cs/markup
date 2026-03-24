# Markup Reader

An elegant Markdown reader built with Tauri, TypeScript, and Rust.

## Features

- **GitHub-Flavored Markdown** — Tables, strikethrough, task lists, autolinks
- **Syntax Highlighting** — 16 programming languages with highlight.js
- **Dark Mode** — Automatic via `prefers-color-scheme`, manual toggle with `Cmd+Shift+D`
- **HTML Embedding** — Safely renders `<details>`, `<table>`, badge images
- **XSS Protection** — DOMPurify sanitizes all HTML output
- **UTF-8 Validation** — Warns on invalid encoding
- **File Size Check** — Warns on files > 5 MB
- **Keyboard Shortcuts**
  - `Cmd/Ctrl+O` — Open file
  - `Cmd/Ctrl+Shift+D` — Toggle dark/light mode
  - `Escape` — Dismiss error overlay

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Build for production
npm run tauri build
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+O` | Open file dialog |
| `Cmd/Ctrl+Shift+D` | Toggle dark/light mode |
| `Escape` | Dismiss error overlay |

## Tech Stack

- **Frontend**: TypeScript, Vite, marked, highlight.js, DOMPurify
- **Backend**: Rust, Tauri 2
- **Testing**: Vitest (unit), Playwright (E2E)

## Architecture

```
src/
├── main.ts           # App entry, event handlers, theme management
├── lib/
│   ├── renderer.ts   # Markdown → HTML with DOMPurify sanitization
│   ├── highlight.ts # highlight.js with 16 registered languages
│   ├── theme.ts     # Dark/light mode utilities
│   └── file-utils.ts # File reading with UTF-8 & size validation
src-tauri/
├── src/lib.rs       # Rust entry (plugins: dialog, fs, opener)
└── tauri.conf.json  # Window config, bundler settings
```
