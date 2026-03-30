# Retrospective

## Cross-Milestone Trends

*(To be populated across milestones)*

---

## Milestone: v1.0 — Floating TOC Sidebar

**Shipped:** 2026-03-28
**Phases:** 1 | **Plans:** 3

### What Was Built

- H1-H3 heading extraction with unique ID injection via marked walkTokens and custom renderer
- Floating TOC panel with slide-in animation, hierarchical heading display, smooth scroll navigation, and full keyboard/ARIA accessibility
- Unit and E2E tests: 55 passed (31 existing + 24 new heading extraction tests)

### What Worked

- Clear separation of concerns: renderer (heading extraction) → main.ts (panel logic) → styles.css (visual design)
- FAB widget pattern reuse kept UI consistent with existing app aesthetic
- DOMPurify ALLOWED_ATTR confirmation early avoided later surprises
- GitHub-compatible slug algorithm with numeric collision suffix is robust

### What Was Inefficient

- Some re-reading of files across context switches due to mid-session planning artifacts
- UI design contract was generated but integration happened without referencing it closely

### Patterns Established

- `RenderResult` extended with `headings: Heading[]` — single pass extracts both HTML and heading metadata
- walkTokens + custom heading renderer for dual-purpose (extract + inject IDs)
- FAB menu integrated panel (consistent with existing error overlay pattern)
- Per-session panel state (no persistence complexity)

### Key Lessons

- Confirm DOM manipulation assumptions (DOMPurify `id` attribute preservation) before building
- Heading ID collision detection via numeric suffix (-1, -2) is simple and effective
- Single-pass heading extraction during parse is more efficient than post-processing DOM

### Cost Observations

- Sessions: Multiple across 2 days (2026-03-27 to 2026-03-28)
- Model: Claude Sonnet 4 used primarily
- Notable: Fast execution — 3 plans completed in 1 day
