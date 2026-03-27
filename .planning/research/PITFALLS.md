# Pitfalls Research

**Domain:** Floating TOC Sidebar for Tauri/Markdown Desktop Reader
**Researched:** 2026-03-27
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Duplicate Heading IDs

**What goes wrong:**
Multiple headings generate identical slugified IDs, creating invalid HTML (duplicate `id` attributes) and broken navigation links. Clicking a TOC entry may jump to the wrong section or always the first match.

**Why it happens:**
Naive slug generation: "My Heading" and "My heading" both become `my-heading`. Heading text without unique distinguishing words compounds this. No collision detection or suffix mechanism exists.

**How to avoid:**
1. Implement collision detection during heading extraction
2. When a duplicate ID would be created, append a numeric suffix (e.g., `my-heading-2`)
3. Test with documents containing similarly-named headings (e.g., multiple "Introduction" sections)
4. Verify via DOM inspection that all heading IDs are unique

**Warning signs:**
- Browser console shows "Duplicate ID" warnings
- Clicking TOC entries sometimes jumps to wrong section
- DevTools reveal multiple elements with same `id` attribute

**Phase to address:**
Phase 1 (Heading Extraction) - TEST-01 should cover duplicate edge cases

---

### Pitfall 2: Special Characters Break TOC Links

**What goes wrong:**
Accented characters (e.g., "caracteres accentues" vs "caractères accentués"), Unicode symbols, or special markdown characters in headings produce malformed or broken anchor links.

**Why it happens:**
Legacy slugify implementations fail to properly normalize non-ASCII characters. HTML entity encoding issues. URL encoding mismatches between how IDs are generated vs. how browsers decode them.

**How to avoid:**
1. Use a robust slugification function that:
   - Converts accented characters to ASCII equivalents (e.g., é -> e)
   - Preserves only alphanumeric characters and hyphens
   - Handles emoji and special symbols by stripping or converting
2. Verify links work with headings containing: accent marks, CJK characters, emoji, parentheses, brackets, code fences

**Warning signs:**
- TOC links with accented headings don't navigate on click
- Browser shows "Page not found" or no-op on link click
- `href="#...#something"` shows encoded characters differently than `id` attribute

**Phase to address:**
Phase 1 (Heading Extraction) - DOMPurify preserves IDs but IDs must be URL-safe

---

### Pitfall 3: Sticky Header Obscures Heading Target

**What goes wrong:**
Clicking a TOC entry scrolls the page, but the target heading appears behind the floating panel or beneath the window chrome, making it partially invisible.

**Why it happens:**
Scroll target calculation does not account for floating overlay height. The heading is positioned at the viewport top rather than below the panel. Markup Reader uses FAB positioning, not a persistent header, but the TOC panel itself covers content when open.

**How to avoid:**
1. Calculate scroll position accounting for panel height when open
2. Use `scroll-margin-top` CSS on heading targets or calculate equivalent offset in JS
3. After scroll, verify heading is visible: `element.getBoundingClientRect().top > panelHeight`
4. Consider using `behavior: 'smooth'` with a slight delay to let panel close first

**Warning signs:**
- Clicking TOC entry scrolls but heading is hidden behind panel
- User sees wrong content, must scroll manually
- Smooth scroll animation ends with heading off-screen

**Phase to address:**
Phase 2 (Panel Interaction) - affects TOC-05 smooth scroll requirement

---

### Pitfall 4: Keyboard Trap in Floating Panel

**What goes wrong:**
User tabs into TOC panel but cannot tab out. Escape key fails to close panel in all contexts. Focus remains trapped or moves unexpectedly outside the panel.

**Why it happens:**
No focus management implementation. Missing `aria-modal="true"`, `role="dialog"`, or improper `tabindex` handling. Escape key listener missing or scoped incorrectly.

**How to avoid:**
1. Implement proper focus management:
   - When panel opens, move focus to first focusable element
   - Trap focus within panel while open
   - Return focus to trigger element when panel closes
2. Add Escape key handler at document level, not just panel level
3. Add click-outside-to-close for content area
4. Test with keyboard-only navigation before release

**Warning signs:**
- Tab key navigation goes to elements behind the panel (inaccessible)
- Escape key does nothing or only works when panel has focus
- Screen reader announces content behind panel as reachable

**Phase to address:**
Phase 2 (Accessibility) - TOC-06 and TOC-07

---

### Pitfall 5: Scroll Position Not Saved on Panel Close

**What goes wrong:**
User scrolls to a section via TOC, then closes the panel. When reopening, they are back at the top of the document, disorienting.

**Why it happens:**
Panel open/close is purely visibility toggle with no state persistence. Per-session state was explicitly chosen as out-of-scope, but the UX impact of losing scroll position frustrates users navigating long documents.

**How to avoid:**
1. Accept the per-session limitation but document it
2. Alternatively, save scroll position to sessionStorage keyed by document path
3. Restore scroll position when panel reopens to same document

**Warning signs:**
- Users on long documents constantly lose their place
- Feature feels incomplete despite meeting requirements

**Phase to address:**
Phase 2 (UX Polish) - Consider if worth the complexity for per-session persistence

---

### Pitfall 6: Mobile Panel Covers Full Content

**What goes wrong:**
On screens < 600px, full-width panel covers all content with no way to dismiss except by clicking a heading or pressing Escape, but users may not realize they can dismiss it.

**Why it happens:**
Full-width behavior implemented without considering mobile interaction patterns. Missing swipe gestures, tap-outside-to-close, or visual affordance that panel is dismissible.

**How to avoid:**
1. Implement swipe-down-to-dismiss or tap-outside-to-close
2. Add visible close button (X) in top-right corner
3. Ensure panel is dismissible by tapping the content area behind it
4. Test on actual mobile devices or responsive mode, not just resize

**Warning signs:**
- Mobile users report panel is "stuck"
- No way to dismiss without selecting a heading
- Panel scroll competes with background content scroll

**Phase to address:**
Phase 2 (Responsiveness) - TOC-09 requirement

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip unique ID generation, trust `marked` default | Faster initial implementation | Broken links when duplicates occur | Never |
| Use `scrollIntoView()` without offset | Simple API | Heading hidden behind floating panel | Never |
| Skip focus trapping | Keyboard nav seems to "work" | Accessibility violations, legal risk | Never |
| Hardcode panel height | Simpler CSS | Breaks on different themes/zoom | MVP only |
| No mobile touch handling | Works on desktop | unusable on mobile | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| marked renderer | Custom heading IDs get overwritten by marked's default | Use `marked.use({ renderer: { heading(text, level) {...} } })` to control ID generation |
| DOMPurify | Default config strips `id` attributes | Already confirmed: `id` in ALLOWED_ATTR preserves heading IDs |
| Tauri window | Click events propagate unexpectedly | Use `window.listen` for Escape key, stop propagation on panel |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-render headings on every scroll | High CPU, janky animation | Cache heading list, only re-render on document change | Documents with 50+ headings |
| Scroll listener on every frame | Battery drain | Throttle/debounce scroll handlers, use Intersection Observer for scroll-spy | Long reading sessions |
| Large DOM for TOC | Slow panel open animation | Virtualize if > 50 headings, otherwise render all | Documents with 100+ headings |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Allow arbitrary HTML in heading text | XSS if headings contain `<script>` | DOMPurify sanitizes output; verify ALLOWED_ATTR includes `id` but not event handlers |
| Use `innerHTML` for heading text | XSS via malicious heading content | Always use `textContent` or `innerText` when inserting heading titles into TOC |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual feedback on active heading | User doesn't know where they are | Add scroll-spy highlighting (deferred, but plan for it) |
| Panel auto-closes on click but user wanted to read TOC | Annoying interruption | Consider auto-close only on navigation, not on any click |
| Indentation too subtle | Hierarchy unclear on H1/H2/H3 | Use not just indentation but also font size/weight differentiation |
| No scroll-to-top in panel | Long documents require scrolling panel manually | Add implicit "document start" behavior or small scroll indicator |

---

## "Looks Done But Isn't" Checklist

- [ ] **Heading IDs:** Verify all IDs are URL-safe (no spaces, special chars, unicode issues)
- [ ] **Heading IDs:** Inspect DOM for duplicate `id` attributes on documents with similar headings
- [ ] **Navigation:** Click every TOC entry and verify heading is visible and not covered by panel
- [ ] **Accessibility:** Tab through panel, verify focus doesn't escape; verify Escape closes panel
- [ ] **Mobile:** Test on small viewport, verify panel is dismissible without navigation
- [ ] **Smooth scroll:** Verify scroll animation completes without heading jumping/clipping

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Duplicate heading IDs | MEDIUM | Add suffix logic, regenerate IDs, update TOC links |
| Special char breaks links | MEDIUM | Replace slugify with robust implementation, re-test all headings |
| Scroll offset wrong | LOW | Add `scroll-margin-top` to headings or offset calculation in JS |
| Keyboard trap | MEDIUM | Implement proper focus management with `focus-trap` library or manual tabindex handling |
| Mobile usability | LOW | Add touch handlers and close affordances |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Duplicate heading IDs | Phase 1: Heading Extraction | TEST-01 with duplicate/edge case documents |
| Special characters in IDs | Phase 1: Heading Extraction | Test with accented, CJK, emoji headings |
| Scroll offset with panel | Phase 2: Panel UI | Manual test each TOC click with open panel |
| Keyboard trap | Phase 2: Accessibility | Keyboard-only testing, screen reader verification |
| Mobile panel usability | Phase 2: Responsive | Physical mobile device or responsive mode testing |
| Scroll position loss | Phase 2: UX Polish | User testing on long documents |

---

## Sources

- [simonhaenisch/md-to-pdf #46](https://github.com/simonhaenisch/md-to-pdf/issues/46) - Special characters in heading IDs
- [avalonmediasystem/avalon #2552](https://github.com/avalonmediasystem/avalon/issues/2552) - Duplicate heading ID attributes bug
- [mawenbao/niu-x2-sidebar #7](https://github.com/mawenbao/niu-x2-sidebar/issues/7) - Duplicated heading id warning
- [maranto-sws/maranto-sws.github.io #59](https://github.com/maranto-sws/maranto-sws.github.io/issues/59) - Sticky header scroll offset issue

---
*Pitfalls research for: Floating TOC Sidebar*
*Researched: 2026-03-27*
