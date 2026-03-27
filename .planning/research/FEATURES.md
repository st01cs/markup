# Feature Research

**Domain:** TOC/Navigation Sidebar for Markdown Readers
**Researched:** 2026-03-27
**Confidence:** MEDIUM (based on domain knowledge of Obsidian, Typora, Marktext, Notion, VS Code Markdown, Bear; external search unavailable)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Heading extraction (H1-H3) | Core navigation need; documents without nav feel un navigable | LOW | Already validated in PROJECT.md via `RenderResult.headings` |
| Hierarchical indentation | Visual hierarchy is essential for scanning nested structure | LOW | H1=8px, H2=24px, H3=40px (per PROJECT.md spec) |
| Click to scroll | Fundamental expectation from any outline/TOC | LOW | Smooth scroll is preferred over instant jump |
| Show/hide toggle (FAB) | Users need explicit control to dismiss the panel | LOW | FAB is existing pattern in the app |
| Close on Escape key | Standard UX pattern; power users rely on it | LOW | Error overlay pattern already exists in app |
| Close on content-area click | Reduces friction; user can tap outside to dismiss | LOW | Standard overlay behavior |
| Dark/light mode styling | Any modern app must handle both themes | LOW | Must be verified against existing theme system |
| Responsive panel width | Usable on smaller screens and narrow windows | LOW | Full-width on <600px per PROJECT.md spec |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but meaningfully valued by users.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Scroll-linked active heading highlight | Shows where user is in document; reduces cognitive load | MEDIUM | Common in Obsidian, Notion; "scrollspy" pattern. Explicitly deferred in PROJECT.md but worth noting as differentiator |
| Collapse/expand for nested sections | Reduces clutter when viewing long documents | LOW | Not in current spec; would require expand/collapse toggle UI |
| Keyboard navigation (arrow keys, j/k) | Power users never touch the mouse; standard in Vim/Emacs workflows | MEDIUM | Would complement existing keyboard patterns |
| Search/filter within TOC | Fast section lookup in long documents (100+ headings) | MEDIUM | Adds search input and filtering logic |
| Panel position persistence across sessions | Remembers last state; reduces friction on reopen | LOW | PROJECT.md explicitly defers this, but users find it valuable |
| Drag-to-reposition panel | Some users prefer panel on right, not left | MEDIUM | Significant complexity; conflicts with "minimal UI" constraint |
| Breadcrumb at panel top | Shows current H1 section context | LOW | Small addition but meaningful for orientation |
| Copy link to heading | Shareable URLs for specific sections | MEDIUM | Requires URL state management; common in documentation readers |
| Progress indicator (scroll %) | Shows document completion; useful for long docs | LOW | Minor but appreciated (Seen in的小说 readers, some VS Code extensions) |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| H4-H6 support | "More complete heading coverage" | Clutters the panel; H4+ are rare (<5% of docs); creates visual noise | Keep H1-H3 only; add H4/H5 toggle as opt-in future feature |
| Persistent sidebar (always visible) | "Never have to click to show it" | Violates "minimal UI" / "distraction-free" constraint; takes reading space permanently | Floating panel with show/hide FAB is the right tradeoff |
| Auto-expand to show current section on open | "See where I am immediately" | Annoying if user is browsing; interrupts flow | Let user control via last-state memory (deferred) |
| Real-time collaborative TOC | "Team can navigate together" | Dramatically increases complexity; security concerns | Not in scope for a reading app |
| Table of figures / cross-references | "Complete documentation experience" | Complex to parse and link; out of scope for markdown reading | Defer to documentation-specific tools |
| Full-text search within TOC | "Find text that isn't a heading" | TOC is for headings only; full search is a separate feature | Provide document search as separate FAB/action |
| Nested bullet points in TOC | "Show lists under headings" | Lists are not headings; clutters TOC; breaks hierarchical model | Show only headings, not content structure |

---

## Feature Dependencies

```
Heading Extraction (H1-H3)
    └──requires──> RenderResult.headings (already in renderer.ts)
                       └──requires──> marked heading ID preservation (DOMPurify config)

FAB Toggle Button
    └──requires──> Heading presence check (hide when no headings)

Floating Panel
    └──requires──> FAB Toggle Button
                       └──requires──> Escape key handler
                       └──requires──> Content-area click handler

Click-to-Scroll
    └──requires──> Heading IDs in DOM (slugified)
                       └──requires──> DOMPurify ALLOWED_ATTR includes 'id'

Active Heading Highlight (deferred)
    └──conflicts──> Simple scroll implementation
                       └──requires──> Intersection Observer
                       └──requires──> Scroll position tracking

Collapse/Expand (future)
    └──enhances──> Hierarchical indentation
                       └──requires──> Expand state management (per heading)
```

### Dependency Notes

- **Heading extraction requires `RenderResult.headings`:** Already specified in PROJECT.md; this is the foundation of the entire feature.
- **Panel close handlers require FAB pattern:** Uses existing error overlay pattern (Escape) and existing click-outside logic.
- **Click-to-scroll requires heading IDs:** DOMPurify must preserve `id` attributes (confirmed in PROJECT.md).
- **Active highlight conflicts with simple scroll:** Adding scrollspy changes the scroll implementation significantly; keep separate.

---

## MVP Definition

### Launch With (v1)

Minimum viable product to validate the TOC concept.

- [ ] **H1-H3 heading extraction** — Foundation of entire feature; without it, nothing else works
- [ ] **FAB show/hide toggle** — Core interaction model; reuse existing FAB CSS
- [ ] **Floating panel with indentation** — Visual hierarchy is essential; 200ms slide-in animation
- [ ] **Click-to-scroll** — Core value proposition: jump to any section in one click
- [ ] **Escape and click-outside close** — Standard UX; close must be frictionless
- [ ] **Dark/light mode styling** — Non-negotiable for modern macOS apps
- [ ] **Responsive full-width on <600px** — Usable on smaller screens

### Add After Validation (v1.x)

Features to add once core is validated.

- [ ] **Active heading highlight (scrollspy)** — High value, medium complexity; validates as differentiator
- [ ] **Keyboard navigation (j/k/Enter)** — Power user workflow; low risk addition after MVP
- [ ] **Panel state memory** — Remember position/state across sessions; low complexity, high satisfaction

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Collapse/expand nested sections** — Nice but not essential; adds state complexity
- [ ] **Search/filter within TOC** — Only matters for very long documents (100+ headings)
- [ ] **Breadcrumb context** — Small value add; defer until other features done
- [ ] **Copy link to heading** — Niche use case; URL state management overhead

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| H1-H3 heading extraction | HIGH | LOW | P1 |
| FAB show/hide toggle | HIGH | LOW | P1 |
| Floating panel with indentation | HIGH | LOW | P1 |
| Click-to-scroll | HIGH | LOW | P1 |
| Escape/click-outside close | HIGH | LOW | P1 |
| Dark/light mode | HIGH | LOW | P1 |
| Responsive full-width | MEDIUM | LOW | P1 |
| Active heading highlight | MEDIUM | MEDIUM | P2 |
| Keyboard navigation | MEDIUM | MEDIUM | P2 |
| Panel state memory | LOW | LOW | P2 |
| Collapse/expand | LOW | MEDIUM | P3 |
| Search/filter TOC | LOW | MEDIUM | P3 |
| Breadcrumb context | LOW | LOW | P3 |
| Copy link to heading | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Obsidian | Typora | Marktext | VS Code Markdown Preview | Our Approach |
|---------|----------|--------|----------|--------------------------|---------------|
| Heading extraction H1-H3 | YES | YES | YES | YES (outline) | YES |
| H4-H6 extraction | YES | NO | NO | YES | NO (clutter) |
| Hierarchical indentation | YES | YES | YES | YES | YES |
| Click-to-scroll | YES | YES | YES | YES | YES |
| Scroll-linked highlight | YES | YES | YES | NO | Deferred |
| Collapse/expand | YES | YES | YES | NO | Deferred |
| Search/filter in TOC | YES | NO | NO | YES | Deferred |
| FAB show/hide | NO (icon in left gutter) | YES (floating button) | YES | NO (always visible) | YES (FAB) |
| Persistent sidebar | YES (can pin) | NO (floating) | NO | YES (always visible) | NO (floating only) |
| Keyboard navigation | YES | YES | YES | YES | Deferred (v1.x) |
| Panel position memory | YES | YES | YES | N/A | Deferred |
| Dark/light mode | YES | YES | YES | YES (VS Code theme) | YES |

**Key observations:**
- Typora and Marktext are closest to our approach: floating panel, no persistent sidebar
- Obsidian has the richest feature set but is a full knowledge base, not a "distraction-free reader"
- VS Code Markdown Preview has the best outline but is always visible (not floating)
- Our FAB-integrated floating panel aligns with Typora/Marktext philosophy while respecting the "minimal UI" constraint

---

## Sources

- **Obsidian** (https://obsidian.md) — Feature-rich knowledge base with docked/outline panels
- **Typora** (https://typora.io) — Minimal floating TOC, distraction-free philosophy
- **Marktext** (https://marktext.app) — Open source, Typora-like floating TOC
- **VS Code Markdown Preview** — Built-in outline with always-visible panel
- **Notion** (https://notion.so) — Outline panel with scroll-linked highlighting
- **ia Writer** (https://ia.net/writer) — Focus mode, minimal navigation
- **Bear** (https://bear.app) — Simple sidebar outline
- **Confidence note:** External web search was unavailable during research; analysis based on domain expertise and product familiarity. Verify competitor feature details before making implementation decisions.
