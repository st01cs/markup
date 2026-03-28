---
phase: 01-floating-toc-sidebar
plan: "01"
subsystem: renderer
tags: [toc, headings, markdown]
dependency_graph:
  requires: []
  provides:
    - "markup-reader/src/lib/renderer.ts: Heading interface, slugify(), headings array in RenderResult"
  affects:
    - "markup-reader/src/main.ts (TOC panel rendering)"
tech_stack:
  added: []
  patterns:
    - "walkTokens hook for heading extraction during parse"
    - "Custom heading renderer for ID injection"
    - "Slugify with collision detection via numeric suffix"
key_files:
  created: []
  modified:
    - "markup-reader/src/lib/renderer.ts"
decisions:
  - "Use walkTokens + custom heading renderer to extract headings and inject IDs in single pass"
  - "slugify() with while loop for duplicate detection (appends -1, -2, etc.)"
metrics:
  duration: "~5 minutes"
  completed: "2026-03-28T10:19:52Z"
---

# Phase 01 Plan 01: Heading Extraction Summary

## One-liner

H1-H3 heading extraction with unique ID injection via marked walkTokens and custom renderer.

## What Was Built

Extended the markdown renderer to extract H1-H3 headings during the render pass and inject unique IDs into heading elements for scroll navigation.

### Changes Made

1. **Heading interface** - `level: 1|2|3`, `text: string`, `id: string`
2. **slugify() function** - GitHub-style slug generation with duplicate detection
3. **RenderResult extended** - Added `headings: Heading[]`
4. **walkTokens hook** - Collects H1-H3 headings during token walk
5. **Custom heading renderer** - Injects `id="${id}"` into `<hN>` elements
6. **renderMarkdown() updated** - Returns headings array alongside html/errors

## Deviations

None - plan executed exactly as written.

## Verification

- `renderMarkdown('# Hello\n\n## World')` returns `headings: [{level: 1, text: 'Hello', id: 'hello'}, {level: 2, text: 'World', id: 'world'}]`
- Duplicate headings get unique IDs (`duplicate`, `duplicate-1`)
- Heading HTML contains `id="..."` attributes for scroll navigation
- DOMPurify preserves `id` attribute (confirmed in ALLOWED_ATTR)

## Commits

- `f4c1e69`: feat(01-floating-toc-sidebar): add heading extraction and ID injection

## Self-Check: PASSED

All acceptance criteria met. Heading extraction complete.
