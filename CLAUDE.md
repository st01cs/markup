<!-- GSD:project-start source:PROJECT.md -->
## Project

**Markup Reader — Floating TOC Sidebar**

Markup Reader is an elegant desktop Markdown reader built with Tauri, TypeScript, and Rust. It renders GitHub-Flavored Markdown with syntax highlighting, dark/light mode support, and minimal UI footprint. This milestone adds a floating table of contents (TOC) sidebar for quick navigation within long documents.

**Core Value:** Distraction-free Markdown reading with instant navigation — open any Markdown file and read it comfortably, with the ability to jump to any section in one click.

### Constraints

- **Minimal UI**: App aesthetic is "distraction-free reading" — no toolbars, all controls floating/overlay
- **FAB consistency**: TOC panel must feel consistent with existing FAB widget
- **No space takeover**: Panel is floating, not persistent sidebar
- **Theme respect**: Must work correctly in both dark and light modes
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
### Heading Extraction Approach
## Slug Generation
### GitHub Slug Algorithm
### Implementation
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
## Sources
- `marked/lib/marked.d.ts` — Heading token interface: `Tokens.Heading { type, raw, depth, text, tokens }`
- `marked/lib/marked.esm.js` — Default heading renderer (line 57): no ID generation
- npm `slugify@1.6.8` — 16KB, zero dependencies, published 2026-03-13
- npm `@sindresorhus/slugify@3.0.0` — Has `@sindresorhus/transliterate` dependency
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
