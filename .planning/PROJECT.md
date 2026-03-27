# Markup Reader — Floating TOC Sidebar

## What This Is

Markup Reader is an elegant desktop Markdown reader built with Tauri, TypeScript, and Rust. It renders GitHub-Flavored Markdown with syntax highlighting, dark/light mode support, and minimal UI footprint. This milestone adds a floating table of contents (TOC) sidebar for quick navigation within long documents.

## Core Value

Distraction-free Markdown reading with instant navigation — open any Markdown file and read it comfortably, with the ability to jump to any section in one click.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **TOC-01**: Extract H1-H3 headings from markdown and expose via `RenderResult.headings`
- [ ] **TOC-02**: Show TOC FAB button when document has headings, hide when no headings
- [ ] **TOC-03**: Floating panel slides in from left (200ms ease-out) on TOC FAB click
- [ ] **TOC-04**: Headings displayed with hierarchical indentation (H1=8px, H2=24px, H3=40px)
- [ ] **TOC-05**: Click heading → smooth scroll to section
- [ ] **TOC-06**: Escape key or content-area click closes panel
- [ ] **TOC-07**: Panel accessible: keyboard navigable, aria roles, focus management
- [ ] **TOC-08**: Dark/light mode styled correctly
- [ ] **TOC-09**: Responsive: full-width panel on screens < 600px
- [ ] **TEST-01**: Unit tests for heading extraction (edge cases: duplicates, special chars, empty)
- [ ] **TEST-02**: E2E tests for TOC interactions (show/hide, open/close, scroll)

### Out of Scope

- Scroll-linked highlighting (nice-to-have, deferred)
- Panel state persistence (per-session only)
- H4+ heading support (rare, would clutter panel)

## Context

**Existing app:** Markup Reader v0.1.2 — a Tauri desktop app for macOS that opens and renders Markdown files.

**Tech stack:**
- Frontend: TypeScript, Vite, marked v17, highlight.js, DOMPurify
- Backend: Rust, Tauri 2
- Testing: Vitest (unit), Playwright (E2E)

**Existing patterns:**
- FAB widget in bottom-right corner (z-index: 100)
- Error overlay pattern (Escape to close)
- `renderMarkdown()` in `src/lib/renderer.ts` returns `{html, errors}`
- DOMPurify sanitization with `id` attribute in ALLOWED_ATTR (confirmed preserves heading IDs)

**Design doc:** `~/.gstack/projects/st01cs-markup/jbi-main-design-20260327-143000.md`

## Constraints

- **Minimal UI**: App aesthetic is "distraction-free reading" — no toolbars, all controls floating/overlay
- **FAB consistency**: TOC panel must feel consistent with existing FAB widget
- **No space takeover**: Panel is floating, not persistent sidebar
- **Theme respect**: Must work correctly in both dark and light modes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use `marked` heading renderer hook | DOMPurify preserves `id` attributes — confirmed via test | ✓ Proceed |
| H1-H3 only | H4+ are rare and would clutter the panel | ✓ Proceed |
| FAB-integrated panel | Reuses existing FAB CSS and interaction patterns | ✓ Proceed |
| Per-session panel state | No persistence needed; keeps implementation simple | ✓ Proceed |
| Hide TOC button when no headings | Empty panel is worse than hidden button | ✓ Proceed |
| Slugified heading IDs | Standard URL-friendly id generation | ✓ Proceed |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 after initialization*
