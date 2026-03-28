# Phase 1: Floating TOC Sidebar - Research

**Researched:** 2026-03-27
**Domain:** Tauri desktop app with TypeScript, marked v17 markdown rendering, DOMPurify sanitization
**Confidence:** HIGH

## Summary

Phase 1 adds a floating Table of Contents sidebar to the Markup Reader app. The implementation requires three main changes: (1) extend the `renderMarkdown()` function in `renderer.ts` to extract H1-H3 headings with unique IDs and return them via a `headings` array, (2) add a TOC FAB button and slide-in panel to `index.html` and `styles.css`, and (3) wire up click/keyboard handlers in `main.ts` for panel open/close and heading navigation. The heading extraction uses marked v17's `walkTokens` extension to collect heading tokens before rendering, then overrides the heading renderer to inject `id` attributes that DOMPurify preserves (confirmed `id` in ALLOWED_ATTR at line 38 of renderer.ts). All decisions are locked per CONTEXT.md; only the specific SVG icon for the TOC FAB is left to implementation discretion.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Heading Extraction:**
- D-01: Use `marked` heading renderer hook to extract headings during render pass -- returns `{level, text, id}` array alongside HTML
- D-02: H1-H3 only captured; H4+ ignored
- D-03: ID generation: slugified text (`text.toLowerCase().replace(/[^\w]+/g, '-')`), duplicate detection with numeric suffix
- D-04: DOMPurify preserves `id` attribute (confirmed `id` in ALLOWED_ATTR) -- headings will have anchor IDs after sanitization

**FAB Integration:**
- D-05: Add "Contents" button to FAB menu alongside "Open File" and "Toggle Theme"
- D-06: FAB TOC button uses a **list icon** -- standard for navigation menus
- D-07: Show FAB TOC button when `headings.length > 0`; hide when document has no headings
- D-08: Per-session state only -- no localStorage persistence

**Panel Behavior:**
- D-09: Panel slides in from left edge: `transform: translateX(-100%)` → `translateX(0)`, 200ms ease-out
- D-10: Click heading item → smooth scroll via `scrollIntoView({ behavior: 'smooth', block: 'start' })`
- D-11: Escape key closes panel
- D-12: Clicking outside panel (on `#content` area) closes panel
- D-13: Clicking FAB toggle while panel is open closes panel (same as other FAB items)

**Panel Styling:**
- D-14: Width: 260px fixed (desktop), full-width on screens < 600px
- D-15: Background: `var(--bg-secondary)`, border-right: `1px solid var(--border-color)`
- D-16: Z-index: 50 (above content, below FAB at z-index: 100)
- D-17: Indentation: H1=8px padding-left (bold), H2=24px, H3=40px (font-size 12px)
- D-18: Header text: "Contents" in uppercase, 13px, weight 600, `var(--text-secondary)`
- D-19: Dark/light mode via CSS variables (existing --bg-secondary, --border-color, --text-primary already adapt)

**Accessibility:**
- D-20: Panel has `role="dialog"` and `aria-label="Table of contents"`
- D-21: Heading items are `<button>` elements (not links or divs)
- D-22: Tab cycles through heading items; Enter activates
- D-23: Focus goes to first heading item when panel opens
- D-24: Escape closes panel AND returns focus to FAB toggle
- D-25: Mobile: full-width panel, still closes on tap-outside

**Edge Cases:**
- D-26: Duplicate heading text: append `-1`, `-2`, etc. to make IDs unique
- D-27: Empty document: TOC FAB hidden (no headings → no button)
- D-28: Scroll offset: heading should be scrolled into view with some top padding consideration

**Testing:**
- D-29: Unit tests for heading extraction (H1-H3, H4+, duplicates, special chars, empty)
- D-30: E2E tests for TOC interactions (show/hide FAB, open/close panel, scroll, dark/light mode)

### Claude's Discretion (Free to Decide)
- Exact icon SVG for the TOC FAB button (standard list/bookmark icon)
- Specific animation easing curve details (ease-out specified, exact cubic-bezier not specified)
- Scroll offset amount for heading visibility

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TOC-01 | Extract H1-H3 headings from markdown during render pass and return via `RenderResult.headings: Heading[]` | marked v17 `walkTokens` + custom `heading` renderer; `Tokens.Heading { depth, text }` API confirmed |
| TOC-02 | Show "Contents" FAB button when `headings.length > 0`; hide when document has no headings | Conditional render in `loadFile()` after calling `renderMarkdown()` |
| TOC-03 | Panel slides in from left edge on TOC FAB click (200ms ease-out transition) | CSS `transform: translateX(-100%)` → `translateX(0)` with `transition: transform 200ms ease-out` |
| TOC-04 | Headings displayed in hierarchy with indentation (H1=8px padding-left, H2=24px, H3=40px) | `.toc-item[data-level]` CSS classes per UI-SPEC |
| TOC-05 | Click any heading item → smooth scroll to that section using `scrollIntoView({behavior: 'smooth'})` | Standard DOM API, no library needed |
| TOC-06 | Escape key closes the panel (reuse existing keyboard handler pattern) | Extend existing `keydown` listener in main.ts |
| TOC-07 | Clicking outside panel (on content area) closes panel | Adapt existing `.fab-widget` click-outside pattern |
| TOC-08 | Panel styled with `var(--bg-secondary)` background and `var(--border-color)` border | Confirmed from `styles.css` lines 11-12 and 34-35 |
| TOC-09 | Dark/light mode fully supported via CSS variables | Existing CSS variables `--bg-secondary`, `--border-color`, `--text-secondary`, `--text-muted` already support both themes |
| TOC-10 | Responsive: full-width panel on screens < 600px | Media query for `.toc-panel` width: 100vw below 600px |
| TOC-11 | Panel has `role="dialog"` and `aria-label="Table of contents"` | ARIA pattern already used by error overlay |
| TOC-12 | Heading items are `<button>` elements for keyboard focus | `<button class="toc-item">` per UI-SPEC |
| TOC-13 | Tab cycles through heading items; Enter activates | Native `<button>` tab behavior + `keydown` handler for Enter |
| TOC-14 | Focus management: Escape returns focus to FAB toggle | `focus()` on `#fab-toc` after panel closes |
| TEST-01 | Unit tests for heading extraction | Vitest already configured; `src/lib/renderer.test.ts` pattern to follow |
| TEST-02 | E2E tests for TOC interactions | Playwright already configured; `e2e/app.test.ts` pattern to follow |

## Standard Stack

### Core (Already in use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `marked` | ^17.0.5 | Markdown parsing | Already in use; heading extraction via `walkTokens` + custom `heading` renderer |
| `DOMPurify` | ^3.3.3 | HTML sanitization | Already in use; `id` already in `ALLOWED_ATTR` (renderer.ts line 38) |
| `highlight.js` | ^11.11.1 | Syntax highlighting | Already in use |
| `vitest` | ^4.1.1 | Unit testing | Already in use, configured in `vitest.config.ts` |
| `@playwright/test` | ^1.58.2 | E2E testing | Already in use, configured in `playwright.config.ts` |
| `jsdom` | ^29.0.1 | Vitest DOM environment | Already in use for unit tests |

### No New Dependencies Required
No new npm packages are needed. All functionality is achievable with:
- Custom `slugify` function (D-03 locked: `text.toLowerCase().replace(/[^\w]+/g, '-')`)
- CSS-only animations for panel slide
- Native DOM APIs for scrollIntoView, focus management

## Architecture Patterns

### Recommended Project Structure
No structural changes to the project layout are needed. Changes are confined to:
- `markup-reader/src/lib/renderer.ts` -- add heading extraction to `renderMarkdown()`
- `markup-reader/src/main.ts` -- add FAB TOC button listener and panel state management
- `markup-reader/src/styles.css` -- add `.toc-panel`, `.toc-header`, `.toc-item` CSS classes
- `markup-reader/index.html` -- add `#toc-panel` DOM element and `#fab-toc` button inside `.fab-expanded`
- `markup-reader/src/lib/renderer.test.ts` -- add heading extraction unit tests
- `markup-reader/e2e/app.test.ts` -- add TOC E2E tests

### Pattern 1: Marked v17 Heading Extraction with ID Injection

**What:** Use `walkTokens` to collect H1-H3 heading data, then override `heading` renderer to inject `id` attributes.

**When to use:** Every time a markdown document is rendered (in `renderMarkdown()`).

**Example:**
```typescript
// In renderer.ts -- extend Marked instance with walkTokens + heading renderer
marked.use({
  walkTokens(token) {
    if (token.type === 'heading' && token.depth <= 3) {
      // Collect headings during token walk
      const id = slugify(getHeadingText(token));
      // Store on token for renderer to use
      token.headingId = id;
    }
  },
  renderer: {
    heading(token) {
      const id = (token as any).headingId || slugify(getHeadingText(token));
      return `<h${token.depth} id="${id}">${renderInlineTokens(token.tokens)}</h${token.depth}>`;
    }
  }
});

function getHeadingText(token: Tokens.Heading): string {
  // Use token.text directly (already parsed by marked)
  return token.text;
}
```

**Source:** marked v17 type definitions confirm `Tokens.Heading { type: "heading", depth: number, text: string, tokens: Token[] }`

### Pattern 2: FAB-Integrated Slide Panel

**What:** Panel is a fixed-position `<div>` initially translated off-screen (`translateX(-100%)`), animated to `translateX(0)` on open.

**When to use:** When implementing floating panels that slide in from an edge.

**Example CSS:**
```css
/* styles.css */
.toc-panel {
  position: fixed;
  left: 0;
  top: 0;
  height: 100%;
  width: 260px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  z-index: 50;
  transform: translateX(-100%);
  transition: transform 200ms ease-out;
  overflow-y: auto;
}

.toc-panel.open {
  transform: translateX(0);
}

@media (max-width: 599px) {
  .toc-panel {
    width: 100vw;
  }
}
```

### Pattern 3: Focus Management for Modal-like Panels

**What:** When panel opens, focus first item; when panel closes, return focus to trigger element.

**When to use:** For any panel/dialog that traps focus temporarily.

**Example (main.ts):**
```typescript
// Open panel: move focus to first toc-item button
function openTocPanel() {
  tocPanel.classList.add('open');
  const firstItem = tocPanel.querySelector('.toc-item');
  if (firstItem instanceof HTMLElement) {
    firstItem.focus();
  }
}

// Close panel: return focus to FAB toggle
function closeTocPanel() {
  tocPanel.classList.remove('open');
  fabToc.focus(); // Return focus to trigger
}
```

### Anti-Patterns to Avoid

- **Do not use `slugify` library for such a simple transformation** -- D-03 locks in a specific regex-based approach; adding a library would be unnecessary weight
- **Do not generate IDs in a separate pass after HTML generation** -- Must inject IDs during rendering so DOMPurify preserves them
- **Do not use `scrollIntoView` without `block: 'start'`** -- Default centers the element, which would place the heading behind the toolbar at the top
- **Do not use `position: absolute` for the panel** -- It must be `position: fixed` to cover the full viewport height

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth scrolling animation | CSS `scroll-behavior: smooth` on html | `scrollIntoView({ behavior: 'smooth', block: 'start' })` | Better browser support, precise control per-call |
| Focus trap (panel focus) | Full focus trap with Tab cycling | Native `<button>` tab order + Escape to close | Simple panel, limited items; focus trap complexity unnecessary |
| Icon SVG for FAB TOC | Design custom icon | Standard list icon (three horizontal lines, or hamburger style) | Recognizable, matches OS conventions |

**Key insight:** The heading ID slug algorithm is intentionally simple per D-03 -- `text.toLowerCase().replace(/[^\w]+/g, '-')` is sufficient for Latin text and handles the documented edge cases without external dependencies.

## Common Pitfalls

### Pitfall 1: Duplicate Heading ID Collision
**What goes wrong:** Two headings with the same text produce the same ID, making navigation unreliable.
**Why it happens:** Simple slugify doesn't account for duplicates.
**How to avoid:** Maintain a `Map<string, number>` during token walk; append `-1`, `-2` suffixes for collisions.
**Warning signs:** Navigation jumps to wrong section when two headings share text.

### Pitfall 2: Heading Text Contains Only Special Characters
**What goes wrong:** `### !!!` slugifies to an empty string or just `-`.
**Why it happens:** `replace(/[^\w]+/g, '-')` strips all non-word characters.
**How to avoid:** Handle empty slug case with a fallback like `heading-${index}`.
**Warning signs:** `getElementById('')` or `querySelector('#')` failures.

### Pitfall 3: Focus Not Returning After Escape Close
**What goes wrong:** After pressing Escape, focus stays inside the (now invisible) panel.
**Why it happens:** Forgetting to call `fabToc.focus()` in the Escape handler.
**How to avoid:** Always return focus to the trigger element when closing.
**Warning signs:** Tab key focuses invisible panel elements.

### Pitfall 4: Mobile Panel Obscures Content Behind It
**What goes wrong:** On small screens, panel takes full width but content area still scrolls underneath.
**Why it happens:** Panel is overlay but no backdrop or content shift.
**How to avoid:** Panel is a floating overlay -- content is NOT intended to shift. Mobile tap-outside on the content area closes panel. No content shift needed per UI-SPEC (D-25).
**Warning signs:** N/A -- this is the intended behavior.

### Pitfall 5: Heading IDs Stripped by DOMPurify
**What goes wrong:** Custom heading renderer injects `id="my-heading"` but DOMPurify removes it.
**Why it happens:** `id` not in `ALLOWED_ATTR`.
**How to avoid:** Confirmed in renderer.ts line 38 that `id` IS in `ALLOWED_ATTR`. No action needed.
**Warning signs:** Navigation links (`#my-heading`) 404 in the document.

## Code Examples

### Extracting Headings via walkTokens (marked v17)

```typescript
// Source: marked v17 type definitions (Tokens.Heading interface)
// heading renderer receives: { tokens, depth }
// token.text is already the parsed heading text string

interface Heading {
  level: 1 | 2 | 3;
  text: string;
  id: string;
}

let headings: Heading[] = [];

marked.use({
  walkTokens(token) {
    if (token.type === 'heading' && token.depth <= 3) {
      const t = token as Tokens.Heading;
      const text = t.text; // already parsed, no innerHTML needed
      const id = slugify(text, headings.map(h => h.id));
      headings.push({ level: t.depth, text, id });
    }
  }
});
```

### Slugify with Duplicate Detection

```typescript
// Source: D-03 locked implementation
function slugify(text: string, existingIds: string[] = []): string {
  let slug = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) slug = 'heading';

  let uniqueId = slug;
  let counter = 1;
  while (existingIds.includes(uniqueId)) {
    uniqueId = `${slug}-${counter++}`;
  }
  return uniqueId;
}
```

### Panel HTML Structure (index.html)

```html
<!-- Inside #fab-widget > .fab-expanded, after #fab-theme -->
<div class="fab-item" id="fab-toc" style="display: none;">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
  <span>Contents</span>
</div>

<!-- Outside #fab-widget, as sibling to #content -->
<div id="toc-panel" class="toc-panel" role="dialog" aria-label="Table of contents" style="display: none;">
  <div class="toc-header">Contents</div>
  <div class="toc-list"></div>
</div>
```

### TOC Item Click + Scroll Navigation

```typescript
// Source: D-10 -- scrollIntoView with block: 'start'
function scrollToHeading(id: string) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Heading IDs via anchor tags | IDs injected directly into heading elements via custom renderer | This phase | Enables in-page navigation without extra markup |
| No TOC panel | FAB-triggered slide panel | This phase | Enables quick section navigation |
| Click-outside pattern for FAB only | Extended to include TOC panel | This phase | Consistent dismiss behavior across all overlays |

**Deprecated/outdated:**
- N/A -- this is a net-new feature, not replacing an existing approach.

## Open Questions

1. **Scroll offset amount for heading visibility**
   - What we know: D-28 mentions "heading should be scrolled into view with some top padding consideration"
   - What's unclear: How many pixels of top padding (if any) is needed given the toolbar is not present in this app
   - Recommendation: Start with `block: 'start'` (default browser behavior). If the status bar or OS window controls obscure the heading, add CSS `scroll-margin-top` to headings. Do NOT add JS offset calculation unless CSS alone fails.

2. **Exact icon SVG for TOC FAB button**
   - What we know: D-06 says "list icon (standard for navigation menus)"
   - What's unclear: The specific SVG path data
   - Recommendation: Use the three-horizontal-lines pattern (hamburger-style) -- it is universally recognized as "menu/contents" and matches the app's minimal aesthetic.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies beyond project's existing npm packages and toolchain).

All dependencies are already in `package.json`:
- `marked@^17.0.5` -- already installed
- `vitest@^4.1.1` -- already installed
- `@playwright/test@^1.58.2` -- already installed

No new tools, runtimes, or CLI utilities are required beyond what the project already uses.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 (unit), Playwright 1.58.2 (E2E) |
| Config file | `vitest.config.ts` (unit), `playwright.config.ts` (E2E) |
| Quick run command | `npm test` (vitest run) |
| Full suite command | `npm run test:e2e` (dev server + playwright) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOC-01 | Extract H1-H3 headings with correct level, text, id | unit | `vitest run src/lib/renderer.test.ts` | Partially (existing tests in file) |
| TOC-02 | FAB hidden when no headings, shown when headings exist | e2e | `npx playwright test e2e/app.test.ts` | Partially (FAB tests exist) |
| TOC-03 | Panel slides in on FAB click | e2e | `npx playwright test e2e/app.test.ts` | No -- new tests needed |
| TOC-04 | Correct indentation per level | unit (CSS) / e2e | `vitest run` + visual check | No -- new tests needed |
| TOC-05 | Smooth scroll to heading on click | e2e | `npx playwright test e2e/app.test.ts` | No -- new tests needed |
| TOC-06 | Escape key closes panel | e2e | `npx playwright test e2e/app.test.ts` | Partially (Escape tests exist for error overlay) |
| TOC-07 | Click-outside closes panel | e2e | `npx playwright test e2e/app.test.ts` | No -- new tests needed |
| TOC-08/09 | Panel styled correctly in dark/light | e2e | `npx playwright test e2e/app.test.ts` | Partially (theme tests exist) |
| TOC-10 | Full-width on < 600px | e2e (viewport test) | `npx playwright test e2e/app.test.ts` | No -- new tests needed |
| TOC-11 | role="dialog" and aria-label present | e2e (a11y check) | `npx playwright test e2e/app.test.ts` | No -- new tests needed |
| TOC-12 | Heading items are `<button>` | e2e (locator check) | `npx playwright test e2e/app.test.ts` | No -- new tests needed |
| TOC-13 | Tab cycles, Enter activates | e2e (keyboard test) | `npx playwright test e2e/app.test.ts` | No -- new tests needed |
| TOC-14 | Escape returns focus to FAB | e2e (focus check) | `npx playwright test e2e/app.test.ts` | No -- new tests needed |
| TEST-01 | Full heading extraction suite | unit | `vitest run src/lib/renderer.test.ts` | No -- new tests needed |
| TEST-02 | Full TOC interaction suite | e2e | `npx playwright test e2e/app.test.ts` | No -- new tests needed |

### Sampling Rate
- **Per task commit:** `npm test` (unit tests only, < 5 seconds)
- **Per wave merge:** `npm run test:e2e` (full suite including Playwright, < 60 seconds)
- **Phase gate:** All unit + E2E tests green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/renderer.test.ts` -- add heading extraction tests (TOC-01, TEST-01)
- [ ] `e2e/app.test.ts` -- add TOC interaction tests (TOC-02 through TOC-14, TEST-02)
- [ ] Framework install: None needed -- vitest and playwright already in `package.json`

*(All test infrastructure already exists -- only new test cases need to be authored.)*

## Sources

### Primary (HIGH confidence)
- `markup-reader/src/lib/renderer.ts` -- ALLOWED_ATTR includes `id` (line 38); existing markdown rendering pipeline
- `markup-reader/src/main.ts` -- FAB event handlers, Escape key handling, click-outside pattern, `loadFile()` function
- `markup-reader/src/styles.css` -- FAB widget CSS, CSS variables for theming
- `markup-reader/node_modules/marked/lib/marked.d.ts` -- `Tokens.Heading { type, depth, text, tokens }`, `Renderer.heading()` signature, `MarkedExtension` with `walkTokens` and `renderer`
- `markup-reader/package.json` -- confirmed marked ^17.0.5, vitest ^4.1.1, playwright ^1.58.2
- `markup-reader/vitest.config.ts` -- jsdom environment, globals: true, includes: ['src/**/*.test.ts']
- `markup-reader/playwright.config.ts` -- testDir: './e2e', chromium only

### Secondary (MEDIUM confidence)
- UI-SPEC dimensions verified against `styles.css` color values and FAB widget CSS patterns

### Tertiary (LOW confidence)
- Slugify algorithm (D-03) based on standard GitHub-style slug but simplified per locked decision -- not verified against a spec

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use and confirmed via package.json
- Architecture: HIGH -- all patterns based on existing codebase patterns
- Pitfalls: MEDIUM -- duplicate ID collision and DOMPurify preservation are well understood; scroll offset is slightly uncertain

**Research date:** 2026-03-27
**Valid until:** 2026-04-26 (30 days -- stable stack, no fast-moving libraries)
