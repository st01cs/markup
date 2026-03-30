# Roadmap — Markup Reader v1.2 CLI

## Milestones

- ✅ **v1.0 Floating TOC Sidebar** — Phase 1 (3/3 plans) — shipped 2026-03-28
- 🚧 **v1.2 CLI** — Phase 2 (in progress)

## Phases

### 🚧 Phase 2: CLI Command

**Goal**: Users can open markdown files from the command line using `markup <file.md>`

**Depends on**: Nothing

**Requirements**: CLI-01, CLI-02, CLI-03

**Success Criteria** (what must be TRUE):
1. `markup /path/to/file.md` opens the file in a new app window
2. Running `markup` while app is already open still creates a new window
3. `markup /nonexistent/file.md` shows a clear error: "File not found: /nonexistent/file.md"
4. CLI binary is named `markup` and installed correctly

**Plans**: 1 plan

Plans:
- [x] 02-01-PLAN.md — CLI argument parsing, file validation, and window creation

**UI hint**: no

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Floating TOC Sidebar | 3/3 | Complete | 2026-03-28 |
| 2. CLI Command | 0/1 | Planned | - |

---
*Generated: 2026-03-30*
