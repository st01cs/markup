# Stack Research: Heading Extraction and Slug Generation

**Domain:** Tauri/Markdown reader TOC sidebar feature
**Researched:** 2026-03-27
**Confidence:** MEDIUM-HIGH (based on npm package inspection, not web docs due to API restrictions)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `marked` (existing) | v17.x | Markdown parsing | Already in use; heading extraction via custom renderer hook |
| Custom slugify function | -- | Generate heading IDs | GitHub-compatible slugs without external dep |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `slugify` | 1.6.8 | General slug generation | If custom implementation feels too brittle; 16KB, zero dependencies |
| `@sindresorhus/slugify` | 3.0.0 | Sindre Sorhus quality | If you want battle-tested with transliteration support |

**Recommendation for this project:** Custom slugify function. The GitHub slug algorithm is well-known, ~15 lines of code, and avoids adding a dependency for a simple transformation. If the team prefers a library, `slugify@1.6.8` has no dependencies and is MIT licensed.

### Heading Extraction Approach

**Option 1: Custom Renderer Hook (Recommended)**

```typescript
marked.use({
  renderer: {
    heading({ tokens, depth, text }) {
      const id = slugify(text); // GitHub-compatible slug
      return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
    },
  },
});
```

**Option 2: Lexer Walk-Through (Alternative)**

Walk the token stream and extract `Tokens.Heading` objects directly, before rendering. Useful if you need heading data separate from HTML output.

```typescript
const lexer = new Marked().lexer;
const tokens = lexer(raw);
const headings = tokens.filter(t => t.type === 'heading' && t.depth <= 3);
```

## Slug Generation

### GitHub Slug Algorithm

GitHub's algorithm for heading IDs (used by GitHub, GitLab, and most markdown tools):

1. Lowercase the heading
2. Remove accents/diacritics (e.g., "cafe" -> "cafe")
3. Remove punctuation except hyphens and underscores
4. Replace spaces with hyphens
5. Collapse multiple hyphens to one
6. Remove leading/trailing hyphens

### Implementation

```typescript
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '')        // Remove punctuation
    .replace(/\s+/g, '-')            // Spaces to hyphens
    .replace(/-+/g, '-')            // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');       // Trim leading/trailing hyphens
}
```

### Edge Cases to Handle

| Input | Output | Notes |
|-------|--------|-------|
| `Hello World` | `hello-world` | Basic case |
| `Cafe 24/7` | `cafe-247` | Numbers preserved |
| `Wi-Fi` | `wi-fi` | Hyphens preserved |
| `Emojis 🚀` | `emojis` | Emojis stripped |
| `Héllo` | `hello` | Accents removed |
| `  Spaces  ` | `spaces` | Trimmed |
| `a b c` | `a-b-c` | Multiple words |
| `` (empty) | `` (empty string) | Handle gracefully |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Custom slugify | `slugify` library | If you want guaranteed correctness across edge cases |
| Renderer hook | Lexer walk | If you need headings BEFORE HTML is generated |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `marked-highlight` | Syntax highlighting only, no heading IDs | N/A (custom renderer handles both) |
| `marked-heading-id` extension | Does not exist in marked ecosystem | Custom renderer |
| Default marked heading renderer | No IDs generated | Custom renderer |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `marked@17.x` | Any modern browser/Node | Current project uses 17.0.5 |
| `slugify@1.6.x` | Any ES2018+ environment | 16KB, zero dependencies |

## Key Findings

1. **marked v17 default heading renderer does NOT generate IDs** - outputs plain `<h1>text</h1>` without `id` attribute
2. **marked.use({ renderer: { heading } })** is the standard extension point
3. **DOMPurify ALLOWED_ATTR already includes `id`** - heading IDs will survive sanitization (confirmed in PROJECT.md)
4. **GitHub slug algorithm is the de facto standard** - users expect URLs like `#my-heading` not `#my_heading_123`
5. **Custom implementation is viable** - the algorithm is simple and avoids adding a dependency

## Sources

- `marked/lib/marked.d.ts` — Heading token interface: `Tokens.Heading { type, raw, depth, text, tokens }`
- `marked/lib/marked.esm.js` — Default heading renderer (line 57): no ID generation
- npm `slugify@1.6.8` — 16KB, zero dependencies, published 2026-03-13
- npm `@sindresorhus/slugify@3.0.0` — Has `@sindresorhus/transliterate` dependency

---
*Stack research for: Heading extraction and slug generation*
*Researched: 2026-03-27*
