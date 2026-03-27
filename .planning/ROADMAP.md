# Roadmap — Floating TOC Sidebar

## Phases

- [ ] **Phase 1: Floating TOC Sidebar** — Users can view document structure and navigate to any H1-H3 heading via a floating panel

## Phase Details

### Phase 1: Floating TOC Sidebar

**Goal**: Users can view document structure and navigate to any H1-H3 heading via a floating panel

**Depends on**: Nothing (first phase)

**Requirements**: TOC-01, TOC-02, TOC-03, TOC-04, TOC-05, TOC-06, TOC-07, TOC-08, TOC-09, TOC-10, TOC-11, TOC-12, TOC-13, TOC-14, TEST-01, TEST-02

**Success Criteria** (what must be TRUE):
1. User sees a "Contents" FAB button when the markdown document contains H1-H3 headings; button is hidden when document has no headings
2. User clicks the FAB and a panel slides in from the left edge with a smooth 200ms ease-out transition
3. Headings are displayed in a clear hierarchy with indentation (H1 indented 8px, H2 indented 24px, H3 indented 40px)
4. User clicks any heading item and the view smoothly scrolls to that section
5. User can close the panel by pressing Escape key or by clicking anywhere on the content area
6. Panel styling uses the app's theme variables and adapts correctly to dark/light mode
7. On screens narrower than 600px, the panel takes full width of the screen
8. Panel is fully accessible: has proper dialog role and label, heading items are keyboard-focusable buttons, Tab navigates through items, Enter activates, and Escape returns focus to the FAB toggle
9. All unit tests pass for heading extraction edge cases (H1-H3 only, ignores H4+, duplicate headings, special characters, empty documents)
10. All E2E tests pass for TOC interactions (show/hide FAB, open/close panel, scroll-to-heading, dark/light mode)

**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Extend renderer with heading extraction (TOC-01, TOC-03, TOC-05)
- [ ] 01-02-PLAN.md — Add TOC FAB button, panel HTML/CSS, and handlers (TOC-02, TOC-03, TOC-04, TOC-06, TOC-07, TOC-08, TOC-09, TOC-10, TOC-11, TOC-12, TOC-13, TOC-14)
- [ ] 01-03-PLAN.md — Add unit and E2E tests (TEST-01, TEST-02)

**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Floating TOC Sidebar | 0/3 | In progress | - |

---

*Generated: 2026-03-27*
