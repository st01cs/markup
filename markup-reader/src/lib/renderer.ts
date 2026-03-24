import { Marked } from 'marked';
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

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'details', 'summary', 'span', 'div',
  'strong', 'em', 'del', 'ins',
  'sup', 'sub',
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id',
  'target', 'rel', 'width', 'height',
  'open', 'collapsed',
];

export interface RenderResult {
  html: string;
  errors: string[];
}

export function renderMarkdown(raw: string): RenderResult {
  const errors: string[] = [];

  if (!raw || raw.trim() === '') {
    return { html: '', errors: [] };
  }

  let html: string;
  try {
    html = marked.parse(raw) as string;
  } catch (e) {
    errors.push(`Parse error: ${e}`);
    html = '';
  }

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });

  return { html: clean, errors };
}

export function renderMarkdownWithDOMPurify(raw: string): string {
  const { html } = renderMarkdown(raw);
  return html;
}
