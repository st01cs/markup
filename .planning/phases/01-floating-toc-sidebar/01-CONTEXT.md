# Phase 1: Floating TOC Sidebar - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view document structure (H1-H3 headings) and navigate to any section via a floating panel triggered from the FAB menu.
</domain>

<decisions>
## Implementation Decisions

### Heading Extraction
- **D-01:** Use `marked` heading renderer hook to extract headings during render pass — returns `{level, text, id}` array alongside HTML
- **D-02:** H1-H3 only captured; H4+ ignored
- **D-03:** ID generation: slugified text (`text.toLowerCase().replace(/[^\w]+/g, '-')`), duplicate detection with numeric suffix
- **D-04:** DOMPurify preserves `id` attribute (confirmed `id` in ALLOWED_ATTR) — headings will have anchor IDs after sanitization

### FAB Integration
- **D-05:** Add "Contents" button to FAB menu alongside "Open File" and "Toggle Theme"
- **D-06:** FAB TOC button uses a **list icon (☰)** — standard for navigation menus
- **D-07:** Show FAB TOC button when `headings.length > 0`; hide when document has no headings
- **D-08:** Per-session state only — no localStorage persistence

### Panel Behavior
- **D-09:** Panel slides in from left edge: `transform: translateX(-100%)` → `translateX(0)`, 200ms ease-out
- **D-10:** Click heading item → smooth scroll via `scrollIntoView({ behavior: 'smooth', block: 'start' })`
- **D-11:** Escape key closes panel
- **D-12:** Clicking outside panel (on `#content` area) closes panel
- **D-13:** Clicking FAB toggle while panel is open closes panel (same as other FAB items)

### Panel Styling
- **D-14:** Width: 260px fixed (desktop), full-width on screens < 600px
- **D-15:** Background: `var(--bg-secondary)`, border-right: `1px solid var(--border-color)`
- **D-16:** Z-index: 50 (above content, below FAB at z-index: 100)
- **D-17:** Indentation: H1=8px padding-left (bold), H2=24px, H3=40px (font-size 12px)
- **D-18:** Header text: "Contents" in uppercase, 13px, weight 600, `var(--text-secondary)`
- **D-19:** Dark/light mode via CSS variables (existing --bg-secondary, --border-color, --text-primary already adapt)

### Accessibility
- **D-20:** Panel has `role="dialog"` and `aria-label="Table of contents"`
- **D-21:** Heading items are `<button>` elements (not links or divs)
- **D-22:** Tab cycles through heading items; Enter activates
- **D-23:** Focus goes to first heading item when panel opens
- **D-24:** Escape closes panel AND returns focus to FAB toggle
- **D-25:** Mobile: full-width panel, still closes on tap-outside

### Edge Cases
- **D-26:** Duplicate heading text: append `-1`, `-2`, etc. to make IDs unique
- **D-27:** Empty document: TOC FAB hidden (no headings → no button)
- **D-28:** Scroll offset: heading should be scrolled into view with some top padding consideration

### Testing
- **D-29:** Unit tests for heading extraction (H1-H3, H4+, duplicates, special chars, empty)
- **D-30:** E2E tests for TOC interactions (show/hide FAB, open/close panel, scroll, dark/light mode)

### Claude's Discretion
- Exact icon SVG for the TOC FAB button (standard list/bookmark icon)
- Specific animation easing curve details (ease-out specified, exact cubic-bezier not specified)
- Scroll offset amount for heading visibility

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design
- `~/.gstack/projects/st01cs-markup/jbi-main-design-20260327-143000.md` — Full design spec with constraints, approaches considered, technical decisions

### Requirements
- `.planning/REQUIREMENTS.md` — All TOC requirements (TOC-01 through TOC-14, TEST-01, TEST-02)

### Existing Code
- `markup-reader/src/lib/renderer.ts` — Markdown renderer with marked, DOMPurify sanitization
- `markup-reader/src/main.ts` — App entry, FAB event handlers, Escape key handling, click-outside pattern
- `markup-reader/index.html` — HTML structure with FAB widget
- `markup-reader/src/styles.css` — FAB widget CSS, CSS variables for theming
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- FAB widget CSS (`.fab-widget`, `.fab-expanded`, `.fab-item`) — TOC panel can mirror these patterns
- Error overlay for `role="dialog"` pattern with `position: fixed` and backdrop
- Existing CSS variables (`--bg-secondary`, `--border-color`, `--text-primary`, `--text-secondary`) already support dark/light mode
- Click-outside handler pattern: `!e.target.closest('.fab-widget')` — reuse for panel dismiss
- Escape key handler in `keydown` listener — extend to close panel

### Established Patterns
- FAB items: `display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px`
- FAB hover: `background: var(--bg-tertiary)`
- `position: fixed; z-index: 100` for FAB widget
- Panel close animation timing: `200ms ease-out` for consistency

### Integration Points
- `renderMarkdown()` in `renderer.ts` → add `headings` to return type
- FAB menu in `index.html` → add TOC button
- `main.ts` → add `fab-toc` listener, `loadFile()` → conditionally show TOC FAB
- `styles.css` → add `.toc-panel` styles
</code_context>

<specifics>
## Specific Ideas

- Panel header: just text "Contents" with uppercase styling
- TOC FAB button: list icon (☰) with text "Contents"
- No close button on panel itself (Escape + click-outside is sufficient for desktop)
- Mobile: full-width panel with tap-outside-to-close

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-floating-toc-sidebar*
*Context gathered: 2026-03-27*
