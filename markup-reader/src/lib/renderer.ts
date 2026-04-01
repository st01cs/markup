import { Marked, Token, Tokens } from 'marked';
import { hljs } from './highlight.js';
import DOMPurify from 'dompurify';

const marked = new Marked({
  gfm: true,
  breaks: true,
});

marked.use({
  renderer: {
    code(token) {
      const lang = token.lang || '';
      const code = token.text;
      if (lang && hljs.getLanguage(lang)) {
        const highlighted = hljs.highlight(code, { language: lang }).value;
        return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
      }
      const escaped = hljs.highlightAuto(code).value;
      return `<pre><code class="hljs">${escaped}</code></pre>`;
    },
  },
});

// Track headings during token walk for TOC extraction
const headings: Heading[] = [];

marked.use({
  walkTokens(token) {
    if (token.type === 'heading' && token.depth <= 3) {
      const t = token as Tokens.Heading;
      const id = slugify(t.text, headings.map(h => h.id));
      headings.push({ level: t.depth as 1 | 2 | 3, text: t.text, id });
      // Store id on token for renderer to use
      (token as any).headingId = id;
    }
  },
  renderer: {
    heading(token) {
      const id = (token as any).headingId || slugify(token.text);
      const text = renderInlineTokens(token.tokens);
      return `<h${token.depth} id="${id}">${text}</h${token.depth}>`;
    }
  }
});

function renderInlineTokens(tokens: Token[]): string {
  if (!tokens || tokens.length === 0) return '';
  return tokens.map(token => {
    if (token.type === 'text') {
      return token.text;
    }
    return token.raw;
  }).join('');
}

export interface Heading {
  level: 1 | 2 | 3;
  text: string;
  id: string;
}

/**
 * Slugifies heading text for use as an ID attribute.
 * Handles duplicates by appending -1, -2, etc.
 * D-03: text.toLowerCase().replace(/[^\w]+/g, '-'), duplicate detection with numeric suffix
 */
export function slugify(text: string, existingIds: string[] = []): string {
  let slug = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) {
    slug = 'heading';
  }

  let uniqueId = slug;
  let counter = 1;
  while (existingIds.includes(uniqueId)) {
    uniqueId = `${slug}-${counter++}`;
  }
  return uniqueId;
}

// Blocklist of dangerous tags that should never be allowed
const FORBID_TAGS = [
  'script',    // JavaScript execution
  'iframe',    // Embedded content / clickjacking
  'form',      // Phishing / form hijacking
  'style',     // CSS-based data exfiltration / keylogging
  'object',    // Plugin-based attacks
  'embed',     // Plugin-based attacks
  'applet',    // Java applet attacks
  'link',      // CSS / tracking
  'noscript',  // Inconsistent behavior
  'noframes',  // Frame-based attacks
  'plaintext', // Legacy behavior
];

// Blocklist of dangerous attributes
const FORBID_ATTR = [
  // Event handlers (on* attributes)
  'onabort', 'onanimationcancel', 'onanimationend', 'onanimationiteration',
  'onanimationstart', 'onauxclick', 'onbeforeinput', 'onbeforematch',
  'onbeforepaste', 'onbeforeprint', 'onbeforeunload', 'onblur', 'oncanplay',
  'oncanplaythrough', 'onchange', 'onclick', 'onclose', 'oncontextlost',
  'oncontextmenu', 'oncontextrestored', 'oncopy', 'oncuechange', 'oncut',
  'ondblclick', 'ondrag', 'ondragend', 'ondragenter', 'ondragleave',
  'ondragover', 'ondragstart', 'ondrop', 'ondurationchange', 'onemptied',
  'onended', 'onerror', 'onfocus', 'onformdata', 'oninput', 'oninvalid',
  'onkeydown', 'onkeypress', 'onkeyup', 'onload', 'onloadeddata',
  'onloadedmetadata', 'onloadstart', 'onmousedown', 'onmouseenter',
  'onmouseleave', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup',
  'onpaste', 'onpause', 'onplay', 'onplaying', 'onprogress', 'onratechange',
  'onreset', 'onresize', 'onscroll', 'onscrollend', 'onsecuritypolicyviolation',
  'onseeked', 'onseeking', 'onselect', 'onslotchange', 'onstalled',
  'onsubmit', 'onsuspend', 'ontimeupdate', 'ontoggle', 'ontransitioncancel',
  'ontransitionend', 'ontransitionrun', 'ontransitionstart', 'onunload',
  'onvolumechange', 'onwaiting', 'onwheel',
];

// Allowlist of safe attributes (extends DOMPurify defaults)
const ADD_ATTR = [
  'class', 'id', 'title', 'lang', 'dir',
  'accesskey', 'autocapitalize', 'inert', 'popover',
  'shadowroot', 'shadowrootmode',
  'Part', 'exportparts',
  'for', 'rel',
];

export interface RenderResult {
  html: string;
  errors: string[];
  headings: Heading[];
}

export function renderMarkdown(raw: string): RenderResult {
  const errors: string[] = [];
  headings.length = 0; // Reset headings array before each parse (D-08)

  if (!raw || raw.trim() === '') {
    return { html: '', errors: [], headings: [] };
  }

  let html: string;
  try {
    html = marked.parse(raw) as string;
  } catch (e) {
    errors.push(`Parse error: ${e}`);
    html = '';
  }

  const clean = DOMPurify.sanitize(html, {
    FORBID_TAGS,
    FORBID_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR,
  });

  return { html: clean, errors, headings }; // Return headings array (TOC-01)
}

export function renderMarkdownWithDOMPurify(raw: string): string {
  const { html } = renderMarkdown(raw);
  return html;
}
