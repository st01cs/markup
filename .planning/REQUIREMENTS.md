# Requirements — Floating TOC Sidebar

## v1 Requirements

### TOC-NAV: Navigation

- [ ] **TOC-01**: Extract H1-H3 headings from markdown during render pass and return via `RenderResult.headings: Heading[]`
- [ ] **TOC-02**: Show "Contents" FAB button when `headings.length > 0`; hide when document has no headings
- [ ] **TOC-03**: Panel slides in from left edge on TOC FAB click (200ms ease-out transition)
- [ ] **TOC-04**: Headings displayed in hierarchy with indentation (H1=8px padding-left, H2=24px, H3=40px)
- [ ] **TOC-05**: Click any heading item → smooth scroll to that section using `scrollIntoView({behavior: 'smooth'})`
- [ ] **TOC-06**: Escape key closes the panel (reuse existing keyboard handler pattern)
- [ ] **TOC-07**: Clicking outside panel (on content area) closes panel

### TOC-STYLE: Styling

- [ ] **TOC-08**: Panel styled with `var(--bg-secondary)` background and `var(--border-color)` border
- [ ] **TOC-09**: Dark/light mode fully supported via CSS variables
- [ ] **TOC-10**: Responsive: full-width panel on screens < 600px

### TOC-A11Y: Accessibility

- [ ] **TOC-11**: Panel has `role="dialog"` and `aria-label="Table of contents"`
- [ ] **TOC-12**: Heading items are `<button>` elements for keyboard focus
- [ ] **TOC-13**: Tab cycles through heading items; Enter activates
- [ ] **TOC-14**: Focus management: Escape returns focus to FAB toggle

### TOC-TEST: Testing

- [x] **TEST-01**: Unit tests for heading extraction:
  - Extracts H1, H2, H3 headings
  - Ignores H4 and deeper headings
  - Generates correct slug IDs (lowercase, hyphenated)
  - Handles duplicate heading text with unique suffixes
  - Returns empty array for no headings
  - Handles headings with special characters
- [x] **TEST-02**: E2E tests for TOC interactions:
  - Shows TOC button when document has headings
  - Hides TOC button when document has no headings
  - Opens TOC panel on FAB click
  - Closes TOC panel on Escape key
  - Closes TOC panel on content click
  - Scrolls to heading on click
  - Panel styled correctly in dark/light mode

## v2 Requirements (Deferred)

- Scroll-linked highlighting (highlight current section while scrolling)
- Panel state persistence across sessions

## Out of Scope

- **H4+ heading support** — Rare in practice, would clutter the panel UI
- **Nested TOC for H4+** — Related to above; same reasoning
- **TOC item tooltips** — Nice-to-have, not table stakes

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOC-01 | 1 | Pending |
| TOC-02 | 1 | Pending |
| TOC-03 | 1 | Pending |
| TOC-04 | 1 | Pending |
| TOC-05 | 1 | Pending |
| TOC-06 | 1 | Pending |
| TOC-07 | 1 | Pending |
| TOC-08 | 1 | Pending |
| TOC-09 | 1 | Pending |
| TOC-10 | 1 | Pending |
| TOC-11 | 1 | Pending |
| TOC-12 | 1 | Pending |
| TOC-13 | 1 | Pending |
| TOC-14 | 1 | Pending |
| TEST-01 | 1 | Complete |
| TEST-02 | 1 | Complete |

---
*Generated: 2026-03-27*
