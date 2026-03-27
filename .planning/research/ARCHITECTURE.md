# Architecture Research

**Domain:** Tauri 2 Desktop Markdown Reader with Floating TOC Sidebar
**Researched:** 2026-03-27
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Tauri 2 (Rust Backend)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Window    │  │    File     │  │   Events    │          │
│  │  Manager    │  │   Dialog    │  │   Bridge    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│                    WebView (Frontend)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   #app Container                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │    │
│  │  │   #content  │  │  #fab-widget │  │  #toc-panel  │   │    │
│  │  │ (main area) │  │ (FAB button) │  │  (NEW)       │   │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                      State (module-level)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  headings[] │  │tocOpen:bool │  │ activeId?    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `#toc-panel` | Slide-in panel container, visibility toggle | CSS transform/transition, visibility class |
| `#fab-widget` | Existing FAB with TOC button | Extends existing FAB pattern |
| `lib/toc.ts` | Heading extraction and TOC state | Pure functions, module state |
| `lib/renderer.ts` | Existing markdown rendering | Marked + DOMPurify (no changes needed) |
| `main.ts` | Event handlers, orchestration | Click handlers, keyboard shortcuts |

## Recommended Project Structure

```
src/
├── lib/
│   ├── renderer.ts      # Existing markdown rendering
│   ├── theme.ts         # Existing theme handling
│   ├── file-utils.ts    # Existing file utilities
│   └── toc.ts           # NEW: TOC extraction and state
├── components/
│   └── toc-panel.ts     # NEW: Panel DOM manipulation
├── main.ts              # Existing entry point (extend)
└── styles.css           # Existing styles (extend)
```

### Structure Rationale

- **`lib/toc.ts`:** Pure heading extraction logic. No DOM side effects. Unit testable without DOM.
- **`components/toc-panel.ts`:** Panel show/hide logic, scroll-to-heading, keyboard handling. Keeps main.ts clean.
- **`styles.css`:** TOC panel styles alongside existing FAB styles.

## Architectural Patterns

### Pattern 1: Slide-In Panel (CSS Transform)

**What:** A floating panel that slides in from the edge using CSS transforms.

**When to use:** Overlay controls that appear on demand, don't take permanent space, feel lightweight.

**Trade-offs:**
- **Pros:** Smooth 60fps animation, hardware accelerated, no JS animation loops
- **Cons:** Only works for edge-of-screen positioning; complex choreography requires more CSS

**Example:**
```css
/* Panel sits off-screen by default */
#toc-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100%;
  transform: translateX(-100%);
  transition: transform 200ms ease-out;
  z-index: 200;
}

/* Panel slides in when open class is added */
#toc-panel.open {
  transform: translateX(0);
}
```

```typescript
function openPanel() {
  document.getElementById('toc-panel')!.classList.add('open');
}

function closePanel() {
  document.getElementById('toc-panel')!.classList.remove('open');
}
```

### Pattern 2: FAB-Integrated Toggle

**What:** The existing FAB widget pattern. Single toggle button that expands to reveal actions.

**When to use:** When the trigger is already a FAB and space is at a premium.

**Trade-offs:**
- **Pros:** Reuses existing pattern, consistent UX
- **Cons:** Limited to small action sets; TOC list is not a FAB action

**Decision:** TOC panel is separate from FAB, not nested inside it. The FAB triggers the panel via `fab-toc` button.

### Pattern 3: Heading Extraction (Pure Function)

**What:** Extract headings from rendered HTML as structured data.

**When to use:** When building navigation from document structure.

**Trade-offs:**
- **Pros:** Unit testable, no DOM required for extraction
- **Cons:** Requires consistent ID generation on headings

**Example:**
```typescript
// lib/toc.ts
export interface Heading {
  level: 1 | 2 | 3;
  text: string;
  id: string;
}

export function extractHeadings(html: string): Heading[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3');

  return Array.from(headings).map(h => ({
    level: parseInt(h.tagName[1]) as 1 | 2 | 3,
    text: h.textContent ?? '',
    id: h.id,
  }));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}
```

### Pattern 4: Keyboard Navigation with Focus Trap

**What:** Panel captures keyboard focus and Escape closes it.

**When to use:** Accessible overlay panels.

**Trade-offs:**
- **Pros:** Full keyboard accessibility, WCAG compliance
- **Cons:** Requires explicit focus management

## Data Flow

### TOC Open Flow

```
[User clicks TOC FAB]
    ↓
[fab-toc click handler]
    ↓
[tocPanel.open()] → adds .open class → CSS transition slides panel
    ↓
[focus moves to panel] → first heading receives focus
```

### Heading Extraction Flow

```
[Markdown file loaded]
    ↓
[renderMarkdown(content)] → { html, errors }
    ↓
[extractHeadings(html)] → Heading[]
    ↓
[If headings.length > 0: show TOC FAB] → [else: hide TOC FAB]
    ↓
[User clicks TOC heading]
    ↓
[scrollIntoView with smooth behavior]
```

### Escape Key Close Flow

```
[User presses Escape]
    ↓
[main.ts keydown handler]
    ↓
[if tocOpen: tocPanel.close()] → removes .open class
    ↓
[focus returns to triggering element]
```

### Key Data Flows

1. **Render flow:** `loadFile()` → `renderMarkdown()` → `extractHeadings()` → update FAB visibility
2. **Navigation flow:** heading click → `element.scrollIntoView({ behavior: 'smooth' })` → panel closes
3. **Lifecycle flow:** panel mounts hidden → user action shows → user action hides → panel stays in DOM

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k headings | No changes; DOM querySelectorAll is fast enough |
| 1k-10k headings | Virtualize TOC list (deferred, out of scope) |
| 10k+ headings | Paginate or use virtual scrolling |

### Scaling Priorities

1. **First bottleneck:** Heading extraction on very large documents. Mitigation: extract headings during render, cache result.
2. **Second bottleneck:** TOC list rendering with many headings. Mitigation: virtualization (out of scope for this milestone).

## Anti-Patterns

### Anti-Pattern 1: Nested FAB Toggle

**What people do:** Put TOC panel toggle inside the existing FAB menu (`.fab-expanded`).

**Why it's wrong:** FAB menu is designed for small action sets. A TOC list is navigation, not an action. Mixing navigation into action menu confuses UX.

**Do this instead:** Add a separate `fab-toc` button at the same level as `fab-widget`, or as the first item in the FAB menu with a clear "Table of Contents" label.

### Anti-Pattern 2: Re-rendering Markdown for Heading Extraction

**What people do:** Parse markdown string directly to extract headings.

**Why it's wrong:** Markdown parsing is expensive. The HTML is already rendered and contains heading elements with IDs.

**Do this instead:** Query the rendered HTML DOM for `h1, h2, h3` elements. This uses the existing render pipeline and DOMPurify's already-sanitized output.

### Anti-Pattern 3: Permanent DOM Presence for Hidden Panel

**What people do:** Create/destroy panel DOM on open/close.

**Why it's wrong:** Creation/destruction causes layout thrashing and accessibility issues (focus loss, screen reader confusion).

**Do this instead:** Keep panel in DOM, toggle visibility via CSS class. Use `visibility` for accessibility alongside `transform` for animation.

## Integration Points

### With Existing Components

| Boundary | Communication | Notes |
|----------|---------------|-------|
| FAB widget ↔ TOC panel | Click event | FAB triggers panel open |
| Content area ↔ TOC panel | Click-to-close | Content click closes panel (like error overlay) |
| main.ts ↔ toc.ts | Module functions | `extractHeadings()` called after render |

### With Tauri Backend

| Integration | Pattern | Notes |
|-------------|---------|-------|
| File open | `open()` dialog plugin | No backend changes for TOC |
| Window title | `appWindow.setTitle()` | Already in use |
| File events | `listen('open-file')` | Already in use |

**Rust backend involvement:** None required for TOC feature. All logic is frontend-only.

## Build Order Implications

1. **`lib/toc.ts` first:** Pure functions, unit testable without DOM
2. **`components/toc-panel.ts` second:** DOM logic, depends on toc.ts types
3. **CSS additions third:** Styles, depends on knowing panel structure
4. **Integration in main.ts last:** Event handlers, wire everything together
5. **Tests last:** Unit tests for toc.ts, E2E for interactions

## Sources

- [Tauri 2 Dialog Plugin](https://v2.tauri.app/reference/javascript/api/namespacedialog/)
- [MDN: CSS Transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
- [MDN: scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)
- [marked v17 Heading Renderer](https://marked.js.org/using_pro#renderer)
- [DOMPurify](https://github.com/cure53/DOMPurify)

---
*Architecture research for: Floating TOC Sidebar in Tauri/WebView app*
*Researched: 2026-03-27*
