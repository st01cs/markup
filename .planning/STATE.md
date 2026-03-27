# State — Floating TOC Sidebar

## Project Reference

**Project**: Markup Reader — Floating TOC Sidebar
**Core value**: Distraction-free Markdown reading with instant navigation — open any Markdown file and read it comfortably, with the ability to jump to any section in one click.
**Current phase**: Phase 1: Floating TOC Sidebar
**Current focus**: Awaiting roadmap approval

## Current Position

- **Phase**: Phase 1: Floating TOC Sidebar
- **Plan**: None (not started)
- **Status**: Not started
- **Progress**: 0%

## Performance Metrics

- **Requirements completed**: 0/16
- **Plans completed**: 0/1
- **Tests passing**: 0/2

## Accumulated Context

### Key Decisions
- Use `marked` heading renderer hook for ID injection
- H1-H3 only (H4+ rare, would clutter panel)
- FAB-integrated panel (reuses existing patterns)
- Per-session panel state (no persistence)
- Hide TOC FAB when document has no headings

### Technical Notes
- Stack: TypeScript, Vite, marked v17, highlight.js, DOMPurify, Vitest, Playwright
- Existing patterns: FAB widget (bottom-right, z-index: 100), error overlay (Escape to close)
- Heading IDs preserved through DOMPurify (confirmed `id` in ALLOWED_ATTR)

### Edge Cases to Handle
- Duplicate heading IDs (collision detection with numeric suffix)
- Special characters in headings (robust slugify with Unicode normalization)
- Scroll offset (panel height should not obscure target heading)
- Keyboard trap prevention (focus trap + Escape at document level)
- Mobile dismiss (<600px needs close button and tap-outside handler)

## Session Continuity

- Phase 1 planning: `/gsd:plan-phase 1`
- After phase 1 complete: `/gsd:transition 1`

---

*Last updated: 2026-03-27*
