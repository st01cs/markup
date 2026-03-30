# Requirements — v1.2 CLI

## v1 Requirements

### CLI: Command-Line Interface

- [x] **CLI-01**: `markup <file.md>` CLI command opens the specified markdown file in a new app window
- [x] **CLI-02**: Each CLI invocation opens a new window (even if app already running)
- [x] **CLI-03**: CLI handles non-existent files gracefully with a user-friendly error message

## v2 Requirements (Deferred)

- File associations (.md files open in Markup Reader when double-clicked)
- URL scheme support (markup://path/to/file)
- CLI help flag (`markup --help`)

## Out of Scope

- **File associations** — User explicitly chose not to register as .md handler
- **URL scheme** — Not needed for basic CLI use case
- **Multiple file arguments** — Single file per invocation

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLI-01 | - | Complete |
| CLI-02 | - | Complete |
| CLI-03 | - | Complete |

---
*Generated: 2026-03-30*
