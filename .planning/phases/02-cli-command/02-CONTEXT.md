# Phase 2: CLI Command - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can open markdown files from the command line using `markup <file.md>`. Each invocation opens a new window. Handles non-existent files gracefully.

</domain>

<decisions>
## Implementation Decisions

### Path handling
- **D-01:** Support relative paths (`markup README.md`, `markup ./docs/intro.md`)
- **D-02:** Expand tilde paths (`markup ~/Documents/notes.md`)
- **D-03:** Existing code handles absolute paths (starting with `/`) already

### Error handling
- **D-04:** Print error to stderr: `markup: File not found: /path/to/file.md`
- **D-05:** Exit with non-zero code (standard CLI convention)
- **D-06:** Do NOT show a dialog for CLI errors — stderr only

### Path validation
- **D-07:** Accept files with extension: `.md`, `.markdown`, `.txt`
- **D-08:** Reject other file types with "Not a markdown file: /path/to/file.ext"

### CLI installation
- **D-09:** Binary named `markup` (from Cargo.toml `name = "markup-reader"`)
- **D-10:** Bundler creates symlink at `/usr/local/bin/markup` on macOS install

### Multiple instances
- **D-11:** Each CLI invocation opens a new window (even if app already running)
- **D-12:** No focus-existing-window behavior — always create new window

### Claude's Discretion
- Exact tilde expansion implementation (Rust's `dirs` crate or manual)
- How to create new windows via Tauri API
- Error message formatting (colors? plain text?)

</decisions>

<specifics>
## Specific Ideas

- "Should work like `open` command — familiar macOS CLI pattern"
- Standard CLI exit codes: 0 for success, 1 for general error, 2 for usage error

</specifics>

<canonical_refs>
## Canonical References

### CLI patterns
- `markup-reader/src-tauri/src/lib.rs` — Existing `extract_file_path_from_args()` function (partial CLI support, only absolute paths)
- `markup-reader/src-tauri/Cargo.toml` — Binary name `markup-reader`, needs bundler config for symlink

### Requirements
- `.planning/REQUIREMENTS.md` — CLI-01, CLI-02, CLI-03
- `.planning/ROADMAP.md` — Phase 2 success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `extract_file_path_from_args()` in `lib.rs`: Already parses CLI args looking for `.md`, `.markdown`, `.txt` — needs extension for relative paths and tilde expansion

### Established Patterns
- AppState tracks `pending_file` and `current_file` for file loading
- Deep link handler already emits `open-file` event to frontend

### Integration Points
- Rust backend handles CLI args → passes to frontend via existing `open-file` event
- Frontend `main.ts` already handles `open-file` event to load files

</code_context>

<deferred>
## Deferred Ideas

- File associations (.md handler) — v2 requirements
- URL scheme (`markup://`) — v2 requirements
- `--help` flag — v2 requirements

</deferred>

---

*Phase: 02-cli-command*
*Context gathered: 2026-03-30*
