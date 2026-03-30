# Phase 2: CLI Command - Research

**Researched:** 2026-03-30
**Domain:** Tauri 2 CLI argument handling, multi-instance window spawning, tilde expansion, bundler symlink configuration
**Confidence:** MEDIUM-HIGH

## Summary

This phase extends the existing `extract_file_path_from_args()` function in `lib.rs` to handle relative paths (D-01), tilde expansion (D-02), file extension validation (D-07, D-08), and proper error reporting (D-04, D-05, D-06). The key architectural decision is that each CLI invocation spawns a **new Tauri process** rather than a new WebViewWindow in the same process -- this is the correct approach for D-11/D-12 (always create new window, never focus existing). The `markup` symlink for `/usr/local/bin` must be created via a **post-install step** since Tauri 2's NSIS/DMG bundlers do not support custom symlink creation.

**Primary recommendation:** Use `std::env::args()` for parsing, manual tilde expansion via `std::env::var_os("HOME")`, and `std::process::Command::new("markup-reader")` for spawning new instances from within the app.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Support relative paths (`markup README.md`, `markup ./docs/intro.md`)
- **D-02:** Expand tilde paths (`markup ~/Documents/notes.md`)
- **D-03:** Existing code handles absolute paths (starting with `/`) already
- **D-04:** Print error to stderr: `markup: File not found: /path/to/file.md`
- **D-05:** Exit with non-zero code (standard CLI convention)
- **D-06:** Do NOT show a dialog for CLI errors -- stderr only
- **D-07:** Accept files with extension: `.md`, `.markdown`, `.txt`
- **D-08:** Reject other file types with "Not a markdown file: /path/to/file.ext"
- **D-09:** Binary named `markup` (from Cargo.toml `name = "markup-reader"`)
- **D-10:** Bundler creates symlink at `/usr/local/bin/markup` on macOS install
- **D-11:** Each CLI invocation opens a new window (even if app already running)
- **D-12:** No focus-existing-window behavior -- always create new window

### Claude's Discretion

- Exact tilde expansion implementation (Rust's `dirs` crate or manual)
- How to create new windows via Tauri API
- Error message formatting (colors? plain text?)

### Deferred Ideas (OUT OF SCOPE)

- File associations (.md handler) -- v2 requirements
- URL scheme (`markup://`) -- v2 requirements
- `--help` flag -- v2 requirements

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLI-01 | `markup <file.md>` CLI command opens the specified markdown file in a new app window | `extract_file_path_from_args()` extended; new instance spawned via `std::process::Command` |
| CLI-02 | Each CLI invocation opens a new window (even if app already running) | `tauri://cli-argv` deep-link + existing `open-file` event to frontend; new process spawn for in-app invocation |
| CLI-03 | CLI handles non-existent files gracefully with user-friendly error message | `std::fs::exists()` check; `eprintln!` + `std::process::exit(1)` |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `std::env::args()` | Built-in | CLI argument parsing | No external crate needed for single positional arg |
| `std::fs` | Built-in | File existence check | Built-in Rust, no deps |
| `std::process::Command` | Built-in | Spawn new process for new window | Standard Rust for cross-platform process spawning |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dirs` (transitive) | 6.0.0 | Home directory for tilde expansion | Already in Cargo.lock as transitive dep -- use `std::env::var_os("HOME")` instead, no new dep needed |
| `tauri-plugin-deep-link` (existing) | 2.4.7 | Handles `file://` URLs passed to running app | Already in use; will be extended to also handle CLI argv |

**No new Rust dependencies required.** All needed functionality is in std library or already present.

---

## Architecture Patterns

### Recommended Project Structure

No new files needed. Changes confined to:
```
markup-reader/src-tauri/src/lib.rs       -- extend extract_file_path_from_args(), add error helpers
markup-reader/src-tauri/tauri.conf.json  -- bundle binaryName for symlink on macOS
```

### Pattern 1: CLI Argument Parsing (extend existing)

**What:** Extend `extract_file_path_from_args()` to handle relative paths, tilde expansion, and extension validation.

**When to use:** On app startup (cold) and when receiving CLI args via deep-link (hot).

**Implementation approach:**
```rust
fn extract_file_path_from_args() -> Option<String> {
    let args: Vec<String> = std::env::args().collect();
    for arg in args.iter().skip(1) { // skip binary path
        if let Some(path) = expand_tilde(arg) {
            if is_markdown_file(&path) {
                return Some(path);
            }
        }
    }
    None
}

fn expand_tilde(path: &str) -> Option<String> {
    if path.starts_with("~/") {
        std::env::var_os("HOME")
            .map(|home| format!("{}{}", home.to_string_lossy(), &path[1..]))
    } else {
        Some(path.to_string())
    }
}

fn is_markdown_file(path: &str) -> bool {
    let p = std::path::Path::new(path);
    p.exists()
        && p.is_file()
        && matches!(
            p.extension().and_then(|e| e.to_str()),
            Some("md") | Some("markdown") | Some("txt")
        )
}
```

**Source:** Existing `extract_file_path_from_args()` in `lib.rs` (lines 30-61) -- only handles absolute paths; new code extends it.

### Pattern 2: Error Reporting (D-04, D-05, D-06)

**What:** Print error to stderr with `eprintln!` and exit with non-zero code. No dialogs.

**When to use:** File not found, file not markdown, or any CLI argument validation failure.

**Implementation approach:**
```rust
fn cli_error(msg: &str) -> ! {
    eprintln!("markup: {}", msg);
    std::process::exit(1);
}
```

**Exit code convention:** 1 for runtime errors (file not found), 2 for usage errors (wrong file type) -- standard CLI convention.

**Source:** D-04, D-05, D-06 from CONTEXT.md.

### Pattern 3: New Window / New Instance (D-11, D-12)

**What:** For CLI invocation from within the already-running app (e.g., when user right-clicks a .md in Finder and selects "Open with Markup Reader"), spawn a fresh Tauri process.

**When to use:** When handling a file-open request that should always create a new window regardless of app state.

**Implementation approach:**
```rust
// In Rust backend when receiving a file-open event
use std::process::Command;

fn open_in_new_window(file_path: &str) {
    // Spawn new instance; the new instance will handle its own window
    let exe = std::env::current_exe().expect("failed to get exe path");
    let _ = Command::new(exe).arg(file_path).spawn();
}
```

**Key insight:** D-11 says "always create new window even if app already running" and D-12 says "no focus-existing-window behavior". The correct implementation is to spawn a new process, not use Tauri's `WebviewWindowBuilder` within the same process. Tauri 2's deep-link handler will handle the case where the app is already running -- it will receive the event and spawn a new process.

**Source:** D-11, D-12 from CONTEXT.md.

### Anti-Patterns to Avoid

- **Using `clap` crate:** Overkill for a single positional argument. `std::env::args()` suffices.
- **Using `dirs` crate for tilde expansion:** `std::env::var_os("HOME")` is sufficient. Adding `dirs` as a direct dep is unnecessary weight.
- **Showing a dialog for CLI errors:** D-06 explicitly forbids this. Use stderr only.
- **Creating a WebViewWindow in the same process for new instance:** This is the wrong architecture for "always new window." The OS-level process separation is correct.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CLI argument parsing | Custom arg parser with `clap` | `std::env::args()` | Single positional arg; no flags, no subcommands; std is enough |
| Tilde expansion | `dirs` crate dependency | `std::env::var_os("HOME")` | One line of code; avoids adding a dep |
| File existence check | URL parsing, regex | `std::path::Path::exists()` | Built-in, zero deps |
| New window creation | `WebviewWindowBuilder` in same process | Spawn new process via `std::process::Command` | D-11/D-12 require OS-level process separation |

---

## Common Pitfalls

### Pitfall 1: Relative path not resolved to absolute
**What goes wrong:** `markup README.md` fails because the relative path is passed as-is to the frontend which can't find the file.
**Why it happens:** `std::env::args()` returns the raw CLI argument string. Relative paths need to be resolved relative to current working directory.
**How to avoid:** Call `std::fs::canonicalize()` or `std::env::current_dir()` to resolve relative paths to absolute before storing.
**Warning signs:** `pending_file` contains `README.md` instead of `/Users/jbi/.../README.md`.

### Pitfall 2: Tilde not expanded before file existence check
**What goes wrong:** `markup ~/notes.md` looks for a file literally named `~/notes.md` which doesn't exist.
**Why it happens:** The tilde prefix is shell-expanded only in bash/zsh, not always passed through.
**How to avoid:** Call `expand_tilde()` before `Path::exists()`.
**Warning signs:** Error message shows `~/` literally.

### Pitfall 3: Wrong extension rejection
**What goes wrong:** File `document.md.txt` is accepted because it ends with `.txt`.
**Why it happens:** Extension check uses `ends_with()` rather than checking the actual extension components.
**How to avoid:** Use `Path::extension()` to get the actual last extension and compare against known extensions.
**Warning signs:** Wrong file types being accepted.

### Pitfall 4: NSIS/DMG bundler cannot create symlinks
**What goes wrong:** Assuming bundler can be configured to create `/usr/local/bin/markup` symlink automatically.
**Why it happens:** Tauri 2's NSIS and DMG bundlers do not expose a `symlink` configuration option.
**How to avoid:** Document that `ln -s /Applications/Markup\ Reader.app/Contents/MacOS/markup-reader /usr/local/bin/markup` must be run as a post-install step.
**Warning signs:** Searching tauri.conf.json for `symlink` field returns nothing.

---

## Code Examples

### Validate and resolve a CLI path (D-01, D-02, D-07)

```rust
fn resolve_cli_path(arg: &str) -> Result<String, CliError> {
    // D-02: Expand tilde
    let path_str = if arg.starts_with("~/") {
        let home = std::env::var_os("HOME")
            .ok_or_else(|| CliError::new("Cannot expand tilde: HOME not set", 1))?;
        format!("{}{}", path_to_string(&home), &arg[1..])
    } else {
        arg.to_string()
    };

    // D-01: Resolve relative paths to absolute
    let path = std::path::Path::new(&path_str);
    let absolute = if path.is_relative() {
        std::env::current_dir()
            .map(|cwd| cwd.join(&path_str))
            .map(|p| p.to_string_lossy().to_string())
            .map_err(|e| CliError::new(&format!("Cannot resolve path: {}", e), 1))?
    } else {
        path_str.clone()
    };

    // D-07: Check file exists
    let p = std::path::Path::new(&absolute);
    if !p.exists() {
        return Err(CliError::new(&format!("File not found: {}", absolute), 1));
    }
    if !p.is_file() {
        return Err(CliError::new(&format!("Not a file: {}", absolute), 1));
    }

    // D-08: Check markdown extension
    match p.extension().and_then(|e| e.to_str()) {
        Some("md") | Some("markdown") | Some("txt") => Ok(absolute),
        Some(ext) => Err(CliError::new(&format!("Not a markdown file: {} (.{})", absolute, ext), 2)),
        None => Err(CliError::new(&format!("Not a markdown file: {} (no extension)", absolute), 2)),
    }
}
```

### Emit open-file event to frontend (existing pattern)

```rust
// In setup(), extend existing deep_link handler:
app.deep_link().on_open_url(move |event| {
    for url in event.urls() {
        if let Some(path) = url.to_string().strip_prefix("file://") {
            let path = path.replace("%20", " ");
            if let Some(state) = app_handle.try_state::<AppState>() {
                let mut pending = state.pending_file.lock().unwrap();
                *pending = Some(path.clone());
            }
            let _ = app_handle.emit("open-file", &path);
        }
    }
});
```

**Source:** Existing `deep_link().on_open_url()` in `lib.rs` lines 106-142.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Absolute path only in `extract_file_path_from_args()` | Extended to handle relative + tilde | Phase 2 | CLI works from any directory |
| No extension validation in CLI path parsing | D-07/D-08 extension check | Phase 2 | Wrong file types rejected gracefully |
| NSIS/DMG default bundle naming | Bundle creates `markup` symlink via post-install | Phase 2 | CLI `markup` command available globally |

**Deprecated/outdated:**
- None in scope for this phase.

---

## Open Questions

1. **How to create the `/usr/local/bin/markup` symlink on macOS?**
   - What we know: Tauri 2's NSIS and DMG bundlers do not support custom symlink creation. The `tauri.conf.json` has no `symlink` or `alias` bundle field.
   - What's unclear: Whether there's an NSIS `customScript` option or DMG `symlink` post-install hook that can be configured.
   - Recommendation: Provide a post-install script snippet for users to run manually. Alternatively, add a `ln -s` step to the project's README installation instructions. For a homebrew-style install, this is standard.

2. **Should the symlink be created during `cargo tauri build` via a post-build script?**
   - What we know: The bundler runs as part of `cargo tauri build`.
   - What's unclear: Whether there's a Tauri 2 hook for post-bundle script execution.
   - Recommendation: Keep it simple -- document the symlink creation as a manual step in README. This is standard for developer tools.

---

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies beyond existing Tauri 2 + Rust toolchain already in use).

- All Rust standard library features used (`std::env`, `std::fs`, `std::path`, `std::process`) -- no external tool dependencies.
- Tauri 2 CLI (`cargo tauri`) already used in project.
- No new package managers, databases, or services required.

---

## Validation Architecture

> Skipped -- CLI phase has no testable validation framework beyond `std::env::args()` behavior. Integration testing via the existing Playwright test suite (app-Table-of-Contents-*) covers frontend behavior but not CLI cold-start path. Consider adding a shell-based smoke test as a Wave 0 gap if `/gsd:verify-work` is used.

---

## Sources

### Primary (HIGH confidence -- from existing codebase)
- `markup-reader/src-tauri/src/lib.rs` lines 30-61 -- existing `extract_file_path_from_args()` pattern; confirmed only handles absolute paths
- `markup-reader/src-tauri/Cargo.toml` -- Tauri 2, no CLI plugin dependency
- `markup-reader/src-tauri/tauri.conf.json` -- bundle config, fileAssociations, window config
- `markup-reader/src-tauri/gen/schemas/desktop-schema.json` -- schema search confirms no `symlink` bundle field

### Secondary (MEDIUM confidence -- from Rust stdlib docs)
- `std::env::var_os("HOME")` -- correct approach for tilde expansion without `dirs` crate
- `std::process::Command` -- standard approach for spawning new process
- Rust exit code convention (0=success, 1=runtime error, 2=usage error) -- standard CLI practice

### Tertiary (LOW confidence -- not verified, needs validation)
- Tauri 2 NSIS/DMG bundler lack of symlink support -- confirmed by schema search but not tested; validate with `cargo tauri build --debug` inspect of generated NSIS script

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all built-in Rust std, no new deps
- Architecture: HIGH -- existing code patterns extended, D-11/D-12 architectural decision clear (new process not new window)
- Pitfalls: MEDIUM -- relative path and tilde expansion pitfalls well understood; bundler symlink needs validation

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (Tauri 2 API stable, Rust stdlib stable)
