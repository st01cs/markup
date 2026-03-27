# Project Research Summary

**Project:** Markup Reader - Floating TOC Sidebar
**Domain:** Tauri 2 Desktop Markdown Reader with Floating Table of Contents Sidebar
**Researched:** 2026-03-27
**Confidence:** MEDIUM-HIGH

## Executive Summary

This project adds a floating Table of Contents (TOC) sidebar to an existing Tauri 2 Markdown reader application. The feature extracts headings from rendered markdown, displays them in a hierarchical slide-in panel, and enables click-to-navigate to any section. Experts build this using `marked` v17's custom renderer hook to inject GitHub-compatible heading IDs, combined with a pure-function heading extraction layer that queries the already-rendered DOM. The recommended implementation adds `lib/toc.ts` for extraction logic and `components/toc-panel.ts` for panel UI, keeping the Rust backend untouched since all logic is frontend-only.

The biggest risks are duplicate heading IDs (documents with similarly-named sections produce identical slugs, breaking navigation) and accessibility violations (floating panels are notorious for keyboard traps). Both are preventable with standard patterns: collision-detection suffix logic and focus-trap implementation. The MVP delivers core navigation value in Phase 1, with Phase 2 adding polish and accessibility compliance.

## Key Findings

### Recommended Stack

The existing stack (`marked` v17, DOMPurify, vanilla TypeScript) is sufficient and no new runtime dependencies are required. Heading ID generation uses a custom GitHub-compatible slugify function (~15 lines) rather than adding a library. The `marked.use({ renderer: { heading } })` hook is the standard extension point for injecting IDs during render; the default heading renderer produces no IDs. DOMPurify's ALLOWED_ATTR already includes `id`, so heading IDs survive sanitization.

**Core technologies:**
- `marked` v17: Markdown parsing with custom renderer hook for heading ID injection
- Custom `slugify()` function: GitHub-compatible IDs without external dependency
- CSS transform for panel animation: Hardware-accelerated slide-in at 60fps
- Intersection Observer (future): For scroll-linked active heading highlight

### Expected Features

**Must have (table stakes):**
- H1-H3 heading extraction and display with hierarchical indentation
- FAB show/hide toggle for the floating panel
- Click-to-scroll navigation to target heading
- Escape key and click-outside-to-close handlers
- Dark/light mode styling
- Responsive full-width panel on <600px viewports

**Should have (competitive differentiators):**
- Scroll-linked active heading highlight (scrollspy) - common in Obsidian, Notion; validates as competitive feature
- Keyboard navigation (j/k/Enter) for power users
- Panel state memory across sessions

**Defer (v2+):**
- Collapse/expand for nested sections
- Search/filter within TOC (only matters for 100+ headings)
- H4-H6 support (clutters panel; rare in practice)
- Persistent sidebar (violates minimal UI constraint)

### Architecture Approach

The TOC feature follows a layered architecture: `lib/toc.ts` handles pure heading extraction logic (unit-testable without DOM), `components/toc-panel.ts` manages panel show/hide and scroll-to-heading (DOM-dependent), and `main.ts` wires event handlers. The panel stays permanently in the DOM with visibility toggled via CSS class, avoiding creation/destruction layout thrashing. Slide-in animation uses CSS `transform: translateX()` for hardware acceleration. The build order is: toc.ts first (pure functions), toc-panel.ts second (DOM logic), CSS third, main.ts integration last.

**Major components:**
1. `#toc-panel` - Slide-in panel container with CSS transform visibility toggle
2. `lib/toc.ts` - Pure heading extraction, slugify, and TOC state management
3. `components/toc-panel.ts` - Panel DOM manipulation, scroll-to-heading, keyboard handling
4. `main.ts` - Event handlers orchestrating the above

### Critical Pitfalls

1. **Duplicate heading IDs** - "My Heading" and "My heading" both slugify to `my-heading`. Documents with multiple "Introduction" sections produce identical IDs, breaking navigation. Prevention: Implement collision detection with numeric suffix (e.g., `my-heading-2`).

2. **Special characters break TOC links** - Accented characters, emoji, or special markdown in headings produce malformed anchor links if slugification is incomplete. Prevention: Robust slugify with Unicode normalization and diacritic stripping.

3. **Floating panel obscures target heading** - Clicking a TOC entry scrolls the heading to viewport top, but the heading appears behind the open panel. Prevention: `scroll-margin-top` on headings or equivalent JS offset calculation.

4. **Keyboard trap in floating panel** - Tab key navigation escapes the panel, and Escape key fails when panel lacks focus. Prevention: Implement focus trap, add Escape handler at document level, add click-outside-to-close.

5. **Mobile panel covers full content with no dismiss** - On <600px, full-width panel is unusable without tap-outside-to-close or swipe gestures. Prevention: Add close button, tap-outside handler, and test on physical devices.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Heading Extraction Foundation
**Rationale:** All other TOC features depend on having valid, unique heading IDs. This must be built first and tested thoroughly. The marked custom renderer hook is the standard approach and well-documented.

**Delivers:** Custom heading renderer with GitHub-compatible slug generation, collision detection for duplicate IDs, `lib/toc.ts` with pure heading extraction functions.

**Addresses:** H1-H3 heading extraction (FEATURES.md P1), heading ID preservation through DOMPurify

**Avoids:** Duplicate heading IDs pitfall (PITFALLS.md) - TEST-01 must cover duplicate edge cases

### Phase 2: Panel UI and Core Interactions
**Rationale:** Panel show/hide, click-to-scroll, and close handlers are the core user experience. These are independent of heading extraction and can be built once the extraction layer exists. Accessibility must be addressed here, not bolted on later.

**Delivers:** Floating panel with CSS slide-in animation, FAB toggle integration, click-to-scroll with offset for panel height, Escape/click-outside close, dark/light mode styling, mobile responsive behavior.

**Uses:** CSS transform pattern (ARCHITECTURE.md), focus trap pattern (ARCHITECTURE.md)

**Avoids:** Keyboard trap pitfall, scroll offset pitfall, mobile dismiss pitfall

### Phase 3: Polish and Differentiators
**Rationale:** Scroll-linked active heading highlight requires Intersection Observer and scroll position tracking - significantly more complex than basic scroll-to-heading. Panel state memory requires sessionStorage. These enhance the experience but aren't blocking.

**Delivers:** Active heading highlight (scrollspy), keyboard navigation (j/k/Enter), panel state persistence across sessions

**Research flag:** Intersection Observer scrollspy is well-documented; no deep research needed. Panel state memory is simple sessionStorage - skip research-phase.

### Phase Ordering Rationale

- **Phase 1 first:** Heading extraction is the foundation. Without unique IDs, nothing else works.
- **Phase 2 second:** Core interactions are independent of extraction logic and must be accessible.
- **Phase 3 last:** Differentiators enhance but don't block; defer until core is validated.
- **Avoids parallel work on same files:** Each phase touches distinct components (toc.ts -> toc-panel.ts -> main.ts integration)

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** No research needed - marked renderer hook and GitHub slug algorithm are well-documented
- **Phase 2:** No research needed - CSS transform panel and focus trap are standard patterns with abundant documentation

Phases with standard patterns (skip research-phase):
- **Phase 1:** Stack and extraction approach confirmed in STACK.md with marked type definitions
- **Phase 2:** Architecture patterns confirmed in ARCHITECTURE.md with MDN references

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on marked v17 type definitions and source inspection; npm package inspection confirms zero-dependency slugify alternatives |
| Features | MEDIUM | Based on domain expertise with competitor analysis (Obsidian, Typora, Marktext, VS Code); external search unavailable to verify latest feature sets |
| Architecture | HIGH | Tauri 2 patterns confirmed via official docs; CSS/JS patterns confirmed via MDN |
| Pitfalls | MEDIUM | Based on GitHub issue analysis and common patterns; some edge cases (emoji handling, CJK characters) not fully validated |

**Overall confidence:** MEDIUM-HIGH

The stack and architecture confidence is high because they rely on verified source code inspection and official documentation. Features and pitfalls confidence is medium because external web search was unavailable, requiring inference from domain expertise and GitHub issue analysis rather than direct competitor feature verification.

### Gaps to Address

- **CJK and emoji heading handling:** Slugify edge cases with Chinese/Japanese/Korean characters and emoji need actual testing with real documents. Test with sample documents containing these characters before Phase 1 close.
- **DOMPurify ID preservation:** ALLOWED_ATTR includes `id` was confirmed in PROJECT.md but should be verified against current DOMPurify version to ensure no regression.
- **Physical mobile testing:** Responsive behavior at <600px must be tested on physical devices, not just DevTools responsive mode, due to touch handling differences.

## Sources

### Primary (HIGH confidence)
- `marked/lib/marked.d.ts` — Heading token interface and renderer types
- `marked/lib/marked.esm.js` — Default heading renderer implementation (no ID generation)
- npm `slugify@1.6.8` — Package inspection confirms 16KB, zero dependencies
- [MDN: CSS Transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/transform) — Panel animation patterns
- [MDN: scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView) — Navigation scroll behavior
- [Tauri 2 Dialog Plugin](https://v2.tauri.app/reference/javascript/api/namespacedialog/) — Window integration patterns

### Secondary (MEDIUM confidence)
- [simonhaenisch/md-to-pdf #46](https://github.com/simonhaenisch/md-to-pdf/issues/46) — Special characters in heading IDs
- [avalonmediasystem/avalon #2552](https://github.com/avalonmediasystem/avalon/issues/2552) — Duplicate heading ID bug
- [mawenbao/niu-x2-sidebar #7](https://github.com/mawenbao/niu-x2-sidebar/issues/7) — Duplicated heading ID warning
- [maranto-sws/maranto-sws.github.io #59](https://github.com/maranto-sws/maranto-sws.github.io/issues/59) — Sticky header scroll offset

### Tertiary (LOW confidence)
- Competitor feature analysis (Obsidian, Typora, Marktext, VS Code, Notion, Bear) — Based on product familiarity; external search unavailable to verify current feature sets. Validate before implementation.

---
*Research completed: 2026-03-27*
*Ready for roadmap: yes*
