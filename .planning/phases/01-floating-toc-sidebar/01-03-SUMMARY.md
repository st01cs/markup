---
phase: "01-floating-toc-sidebar"
plan: "03"
subsystem: "testing"
tags:
  - "toc"
  - "unit-tests"
  - "e2e-tests"
  - "vitest"
  - "playwright"
dependency_graph:
  requires:
    - "01-01"
    - "01-02"
  provides:
    - "TEST-01"
    - "TEST-02"
  affects:
    - "markup-reader/src/lib/renderer.test.ts"
    - "markup-reader/e2e/app.test.ts"
tech_stack:
  added:
    - "Vitest test suite for heading extraction"
    - "Playwright E2E test suite for TOC interactions"
  patterns:
    - "Unit tests verify H1-H3 extraction, H4+ ignore, slug IDs, duplicates, special chars"
    - "E2E tests verify FAB show/hide, panel open/close, keyboard, scroll, dark/light mode"
key_files:
  created:
    - "markup-reader/src/lib/renderer.test.ts (tests added)"
    - "markup-reader/e2e/app.test.ts (tests added)"
decisions:
  - "Unit tests use existing Vitest patterns from renderer.test.ts"
  - "E2E tests use page.evaluate() for state setup since Tauri dialog requires user interaction"
  - "E2E tests verify selectors and behavior, not implementation details"
metrics:
  duration: "task-level commits"
  completed: "2026-03-28"
---

# Phase 1 Plan 3: Unit and E2E Tests Summary

## Objective

Add unit tests for heading extraction (TEST-01) and E2E tests for TOC interactions (TEST-02).

## What Was Built

### Task 1: Heading Extraction Unit Tests (renderer.test.ts)

Added `describe('heading extraction')` suite with sub-suites:

- **H1-H3 extraction**: Verifies H1, H2, H3 headings are captured with correct level, text, and slug ID
- **H4+ ignored**: Verifies H4, H5, H6 headings are not included in headings array
- **Slug ID generation**: Verifies lowercase hyphenated IDs (hello-world)
- **Duplicate heading handling**: Verifies unique IDs for duplicates (title, title-1, title-2), case-insensitive detection
- **Special characters**: Verifies special chars stripped, fallback to 'heading' when slug empty
- **Empty document handling**: Verifies empty array returned for no headings, empty input, whitespace-only

**Test count**: 24 new tests (55 total now pass)

### Task 2: TOC E2E Tests (app.test.ts)

Added `test.describe('Table of Contents (TOC)')` with sub-suites:

- **FAB TOC button visibility**: Hidden when no headings, visible when headings exist
- **TOC panel open/close**: Opens on FAB click, closes on Escape key, closes on content click, toggles correctly
- **TOC panel content**: Heading items with correct indentation, buttons with type attribute
- **TOC scroll navigation**: Verifies heading target exists for scroll navigation
- **TOC dark/light mode**: Panel visible in both themes using CSS variables
- **TOC accessibility**: role="dialog", aria-label="Table of contents", focusable buttons, Tab navigation

**Test count**: 14 new tests

## Verification

### Unit Tests

```
npm test -- --run src/lib/renderer.test.ts
# 55 passed (previously 31, now 55 with 24 new heading extraction tests)
```

### E2E Tests

```
npm run test:e2e
# Tests run via Playwright with concurrently + wait-on
# TOC tests verify: FAB show/hide, panel open/close, keyboard, scroll, dark/light mode, accessibility
```

## Deviations from Plan

None - plan executed exactly as written.

## Auth Gates

None.

## Self-Check

- [x] `markup-reader/src/lib/renderer.test.ts` contains heading extraction tests
- [x] `markup-reader/e2e/app.test.ts` contains TOC E2E tests
- [x] Unit tests pass (55 passed)
- [x] All acceptance criteria verified via grep

## Self-Check: PASSED
