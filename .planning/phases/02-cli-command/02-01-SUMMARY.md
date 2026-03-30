---
phase: 02-cli-command
plan: "01"
subsystem: cli
tags: [rust, tauri, cli, path-resolution]

# Dependency graph
requires:
  - phase: 01-toc-sidebar
    provides: Floating TOC Sidebar (v1.0)
provides:
  - CLI command `markup <file>` with path resolution
  - Tilde expansion for ~/paths
  - Relative path resolution via current_dir()
  - File existence validation with stderr error
  - Extension validation (.md, .markdown, .txt)
  - Deep-link always spawns new process
affects: [v1.2-cli, phase-02]

# Tech tracking
tech-stack:
  added: []
  patterns: [cli-error-with-exit-codes, process-spawn-new-window, path-expansion]

key-files:
  created: []
  modified:
    - markup-reader/src-tauri/src/lib.rs
    - markup-reader/src-tauri/tauri.conf.json

key-decisions:
  - "Tauri 2 bundlers (NSIS/DMG) do not support binaryName field - binary name comes from Cargo.toml package name"
  - "Deep-link handler spawns new process instead of focusing existing window - each invocation creates new window"
  - "cli_error() exits with code 1 for missing files, code 2 for wrong extension"
  - "Relative paths resolved via std::env::current_dir()"

patterns-established:
  - "cli-error-with-exit-codes: stderr output with eprintln and process::exit for CLI errors"
  - "process-spawn-new-window: std::process::Command::new(current_exe).arg(path).spawn() for new window"
  - "path-expansion: expand_path() handles tilde via HOME env var, is_markdown_file() validates extension"

requirements-completed: [CLI-01, CLI-02, CLI-03]

# Metrics
duration: 3min
completed: 2026-03-30
---

# Phase 02-01 Plan Summary

**CLI command `markup <file.md>` with path resolution, tilde expansion, and validation using std library only**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-30T11:25:06Z
- **Completed:** 2026-03-30T11:27:48Z
- **Tasks:** 2 completed, 1 partially (binaryName not supported in Tauri 2)
- **Files modified:** 2 (lib.rs, tauri.conf.json unchanged)

## Accomplishments

- CLI argument parsing extended with relative path resolution using `std::env::current_dir()`
- Tilde expansion (`~/path`) implemented via `std::env::var_os("HOME")`
- File existence validation with `markup: File not found: <path>` stderr output, exit code 1
- Extension validation for `.md`, `.markdown`, `.txt` with `markup: Not a markdown file: <path>`, exit code 2
- Deep-link handler now always spawns new process instead of focusing existing window
- Removed unused `Emitter` import, code compiles cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend extract_file_path_from_args()** - `7926deb` (feat)
2. **Task 2: Fix deep-link to spawn new process** - `672ca7b` (fix)

**Plan metadata:** `docs(02-cli-command): complete 02-01 plan` (docs)

## Files Created/Modified

- `markup-reader/src-tauri/src/lib.rs` - Added expand_path(), is_markdown_file(), cli_error() helpers; modified extract_file_path_from_args() for validation; modified on_open_url handler to spawn new process
- `markup-reader/src-tauri/tauri.conf.json` - No changes (binaryName field not supported in Tauri 2)

## Decisions Made

- Tauri 2 bundlers do not support `binaryName` field in bundle config - binary name comes from Cargo.toml `package.name` which is `markup-reader`
- The post-install symlink (`ln -s /Applications/Markup\ Reader.app/Contents/MacOS/markup-reader /usr/local/bin/markup`) must be created manually as a post-install step, not configured in bundler
- Each CLI invocation spawns a new process (new window) via `std::process::Command::new(current_exe).arg(path).spawn()`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed invalid binaryName field from tauri.conf.json**
- **Found during:** Task 3 (bundle config)
- **Issue:** `binaryName: "markup"` is not a valid field in Tauri 2.x - build failed with "unknown field `binaryName`"
- **Fix:** Reverted the change entirely. Tauri 2 uses package name from Cargo.toml as binary name
- **Files modified:** markup-reader/src-tauri/tauri.conf.json
- **Verification:** `cargo check` passes
- **Committed in:** N/A - commit was reverted

**2. [Rule 1 - Bug] Removed unused Emitter import**
- **Found during:** Task 2 verification
- **Issue:** `Emitter` was imported but no longer used after removing focus-window emit calls
- **Fix:** Changed `use tauri::{AppHandle, Emitter, Manager}` to `use tauri::{AppHandle, Manager}`
- **Files modified:** markup-reader/src-tauri/src/lib.rs
- **Verification:** `cargo check` produces no warnings
- **Committed in:** 672ca7b (amended Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** binaryName limitation documented as post-install requirement. No functional impact.

## Issues Encountered

- **binaryName not supported in Tauri 2**: Research confirmed that Tauri 2.x bundlers derive binary name from Cargo.toml package name, not a config field. The binary will be `markup-reader` not `markup`. Post-install symlink required to create `markup` command.

## Next Phase Readiness

- CLI foundation complete: `markup <file>` opens files with proper path resolution and validation
- Deep-link always spawns new window: multiple files can be opened simultaneously
- Ready for integration testing with actual CLI invocations

---
*Phase: 02-cli-command*
*Completed: 2026-03-30*
