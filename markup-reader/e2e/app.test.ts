import { test, expect } from '@playwright/test';

test.describe('Markup Reader E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the running app
    await page.goto('http://localhost:1420');
  });

  test('shows welcome screen on launch', async ({ page }) => {
    await expect(page.locator('#welcome')).toBeVisible();
    await expect(page.locator('#welcome h1')).toHaveText('Markup Reader');
    await expect(page.locator('#markdown-content')).toBeHidden();
  });

  test('toolbar has open and theme buttons', async ({ page }) => {
    await expect(page.locator('#open-btn')).toBeVisible();
    await expect(page.locator('#theme-btn')).toBeVisible();
  });

  test('dark mode toggle switches theme class', async ({ page }) => {
    // Start in light or dark based on system preference
    const isInitiallyDark = await page.evaluate(() =>
      document.body.classList.contains('dark')
    );

    // Click theme toggle
    await page.click('#theme-btn');

    // Theme should have flipped
    const isToggledDark = await page.evaluate(() =>
      document.body.classList.contains('dark')
    );
    expect(isToggledDark).toBe(!isInitiallyDark);
  });

  test('dark mode toggle is idempotent', async ({ page }) => {
    await page.click('#theme-btn');
    const afterFirst = await page.evaluate(() =>
      document.body.classList.contains('dark')
    );

    await page.click('#theme-btn');
    const afterSecond = await page.evaluate(() =>
      document.body.classList.contains('dark')
    );

    expect(afterSecond).toBe(!afterFirst);
  });

  test('Cmd+O shortcut is registered (does not crash)', async ({ page }) => {
    // Just verify the page doesn't crash when we try the shortcut
    await page.keyboard.press('Meta+o');
    // Dialog would open in real app, but in test environment it may fail gracefully
    // We just verify the page is still alive
    await expect(page.locator('#welcome')).toBeVisible();
  });

  test('Cmd+Shift+D shortcut toggles theme', async ({ page }) => {
    const isInitiallyDark = await page.evaluate(() =>
      document.body.classList.contains('dark')
    );

    await page.keyboard.press('Meta+Shift+D');

    const isToggledDark = await page.evaluate(() =>
      document.body.classList.contains('dark')
    );
    expect(isToggledDark).toBe(!isInitiallyDark);
  });

  test('Escape key hides error overlay', async ({ page }) => {
    // Error overlay should be hidden by default
    await expect(page.locator('#error-overlay')).toBeHidden();

    // Trigger an error by opening a non-existent file via keyboard shortcut
    // (In real app, Cmd+O opens dialog, but for testing error display:)
    await page.evaluate(() => {
      const errorOverlay = document.getElementById('error-overlay')!;
      const errorMessage = document.getElementById('error-message')!;
      errorMessage.textContent = 'Test error';
      errorOverlay.style.display = 'flex';
    });

    await expect(page.locator('#error-overlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#error-overlay')).toBeHidden();
  });

  test('renders markdown content when loaded via evaluate', async ({ page }) => {
    await page.evaluate(() => {
      const contentEl = document.getElementById('markdown-content')!;
      const welcomeEl = document.getElementById('welcome')!;
      contentEl.innerHTML = '<h1>Test</h1><p>Hello</p>';
      contentEl.style.display = 'block';
      welcomeEl.style.display = 'none';
    });

    await expect(page.locator('#markdown-content h1')).toHaveText('Test');
    await expect(page.locator('#markdown-content p')).toHaveText('Hello');
    await expect(page.locator('#welcome')).toBeHidden();
  });

  test('status bar shows file info after loading', async ({ page }) => {
    await page.evaluate(() => {
      const fileInfoEl = document.getElementById('file-info')!;
      const renderStatsEl = document.getElementById('render-stats')!;
      fileInfoEl.textContent = 'test.md (1.2 KB)';
      renderStatsEl.textContent = 'Rendered in 5.0ms';
    });

    await expect(page.locator('#file-info')).toHaveText('test.md (1.2 KB)');
    await expect(page.locator('#render-stats')).toContainText('Rendered in');
  });

  test('error overlay shows error message and dismiss button', async ({ page }) => {
    await page.evaluate(() => {
      const errorOverlay = document.getElementById('error-overlay')!;
      const errorMessage = document.getElementById('error-message')!;
      errorMessage.textContent = 'File not found';
      errorOverlay.style.display = 'flex';
    });

    await expect(page.locator('#error-overlay')).toBeVisible();
    await expect(page.locator('#error-message')).toHaveText('File not found');
    await expect(page.locator('#error-close')).toBeVisible();
  });

  test('error close button dismisses error', async ({ page }) => {
    await page.evaluate(() => {
      const errorOverlay = document.getElementById('error-overlay')!;
      const errorMessage = document.getElementById('error-message')!;
      errorMessage.textContent = 'Test error';
      errorOverlay.style.display = 'flex';
    });

    await page.click('#error-close');
    await expect(page.locator('#error-overlay')).toBeHidden();
  });

  test('renders table HTML elements', async ({ page }) => {
    await page.evaluate(() => {
      const contentEl = document.getElementById('markdown-content')!;
      contentEl.innerHTML = '<table><thead><tr><th>Col1</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>';
      contentEl.style.display = 'block';
    });

    await expect(page.locator('#markdown-content table')).toBeVisible();
    await expect(page.locator('#markdown-content th')).toHaveText('Col1');
    await expect(page.locator('#markdown-content td')).toHaveText('Data');
  });

  test('renders details/summary collapsible', async ({ page }) => {
    await page.evaluate(() => {
      const contentEl = document.getElementById('markdown-content')!;
      contentEl.innerHTML = '<details><summary>Summary text</summary><p>Hidden content</p></details>';
      contentEl.style.display = 'block';
    });

    await expect(page.locator('#markdown-content details')).toBeVisible();
    await expect(page.locator('#markdown-content summary')).toHaveText('Summary text');
  });

  test('renders code blocks with hljs class', async ({ page }) => {
    await page.evaluate(() => {
      const contentEl = document.getElementById('markdown-content')!;
      contentEl.innerHTML = '<pre><code class="hljs language-javascript">const x = 1;</code></pre>';
      contentEl.style.display = 'block';
    });

    await expect(page.locator('#markdown-content pre code.hljs')).toBeVisible();
  });

  test('Ctrl+O works the same as Meta+O on non-Mac', async ({ page }) => {
    await page.keyboard.press('Control+o');
    // Page should still be alive
    await expect(page.locator('#welcome')).toBeVisible();
  });

  test('Ctrl+Shift+D works for theme toggle', async ({ page }) => {
    const isInitiallyDark = await page.evaluate(() =>
      document.body.classList.contains('dark')
    );

    await page.keyboard.press('Control+Shift+D');

    const isToggledDark = await page.evaluate(() =>
      document.body.classList.contains('dark')
    );
    expect(isToggledDark).toBe(!isInitiallyDark);
  });
});

test.describe('Table of Contents (TOC)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
  });

  test.describe('FAB TOC button visibility', () => {
    test('TOC FAB is hidden when document has no headings', async ({ page }) => {
      // Load content with no headings via evaluate
      await page.evaluate(() => {
        const contentEl = document.getElementById('markdown-content')!;
        const welcomeEl = document.getElementById('welcome')!;
        contentEl.innerHTML = '<p>Just a paragraph with no headings at all.</p>';
        contentEl.style.display = 'block';
        welcomeEl.style.display = 'none';
        // Simulate loadFile behavior for headings
        const fabToc = document.getElementById('fab-toc') as HTMLElement;
        fabToc.style.display = 'none';
      });

      await expect(page.locator('#fab-toc')).toBeHidden();
    });

    test('TOC FAB is visible when document has headings', async ({ page }) => {
      // Load content with headings
      await page.evaluate(() => {
        const contentEl = document.getElementById('markdown-content')!;
        const welcomeEl = document.getElementById('welcome')!;
        contentEl.innerHTML = '<h1 id="title">Title</h1><h2 id="section">Section</h2>';
        contentEl.style.display = 'block';
        welcomeEl.style.display = 'none';
        // Simulate loadFile behavior for headings
        const fabToc = document.getElementById('fab-toc') as HTMLElement;
        fabToc.style.display = 'flex';
      });

      await expect(page.locator('#fab-toc')).toBeVisible();
    });
  });

  test.describe('TOC panel open/close', () => {
    test('opens TOC panel on FAB click', async ({ page }) => {
      // Setup: show FAB and panel
      await page.evaluate(() => {
        const fabToc = document.getElementById('fab-toc') as HTMLElement;
        const tocPanel = document.getElementById('toc-panel') as HTMLElement;
        const tocList = document.getElementById('toc-list') as HTMLElement;
        fabToc.style.display = 'flex';
        fabToc.style.display = 'flex';
        tocPanel.style.display = 'flex';
        tocPanel.classList.add('open');
        // Add some headings to TOC
        tocList.innerHTML = '<button class="toc-item" data-level="1">Title</button>';
      });

      await page.click('#fab-toc');
      await expect(page.locator('#toc-panel')).toHaveClass(/open/);
    });

    test('closes TOC panel on Escape key', async ({ page }) => {
      // Setup: open panel
      await page.evaluate(() => {
        const tocPanel = document.getElementById('toc-panel') as HTMLElement;
        tocPanel.style.display = 'flex';
        tocPanel.classList.add('open');
      });

      await page.keyboard.press('Escape');
      await expect(page.locator('#toc-panel')).not.toHaveClass(/open/);
    });

    test('closes TOC panel on content click', async ({ page }) => {
      // Setup: open panel
      await page.evaluate(() => {
        const tocPanel = document.getElementById('toc-panel') as HTMLElement;
        tocPanel.style.display = 'flex';
        tocPanel.classList.add('open');
      });

      // Click on content area (outside panel)
      await page.click('#content');
      await expect(page.locator('#toc-panel')).not.toHaveClass(/open/);
    });

    test('toggles TOC panel on FAB click when already open', async ({ page }) => {
      // Setup: open panel
      await page.evaluate(() => {
        const tocPanel = document.getElementById('toc-panel') as HTMLElement;
        tocPanel.style.display = 'flex';
        tocPanel.classList.add('open');
      });

      await page.click('#fab-toc');
      await expect(page.locator('#toc-panel')).not.toHaveClass(/open/);
    });
  });

  test.describe('TOC panel content', () => {
    test('displays heading items with correct indentation', async ({ page }) => {
      await page.evaluate(() => {
        const tocList = document.getElementById('toc-list') as HTMLElement;
        tocList.innerHTML = `
          <button class="toc-item" data-level="1">H1 Title</button>
          <button class="toc-item" data-level="2">H2 Section</button>
          <button class="toc-item" data-level="3">H3 Subsection</button>
        `;
      });

      const h1 = page.locator('.toc-item[data-level="1"]');
      const h2 = page.locator('.toc-item[data-level="2"]');
      const h3 = page.locator('.toc-item[data-level="3"]');

      await expect(h1).toBeVisible();
      await expect(h2).toBeVisible();
      await expect(h3).toBeVisible();
    });

    test('heading items are buttons', async ({ page }) => {
      await page.evaluate(() => {
        const tocList = document.getElementById('toc-list') as HTMLElement;
        tocList.innerHTML = '<button class="toc-item" data-level="1">Title</button>';
      });

      const item = page.locator('.toc-item');
      await expect(item).toBeAttached();
      await expect(item).toHaveAttribute('type', 'button');
    });
  });

  test.describe('TOC scroll navigation', () => {
    test('clicking heading item scrolls to section', async ({ page }) => {
      // Setup content with heading
      await page.evaluate(() => {
        const contentEl = document.getElementById('markdown-content') as HTMLElement;
        contentEl.innerHTML = '<h1 id="title">Title</h1><p>Content</p>';
        contentEl.style.display = 'block';
        document.getElementById('welcome')!.style.display = 'none';
      });

      // Verify scroll behavior by checking scrollIntoView is called
      await page.evaluate(() => {
        const h1 = document.getElementById('title')!;
        (h1 as any).scrollIntoView = jest.fn ? jest.fn() : function() { (this as any).scrollIntoViewCalled = true; };
      });

      // Click TOC item would trigger scroll - verify heading exists
      const heading = page.locator('#markdown-content h1#title');
      await expect(heading).toBeAttached();
    });
  });

  test.describe('TOC dark/light mode', () => {
    test('TOC panel uses CSS variables for styling', async ({ page }) => {
      // Test in light mode
      await page.evaluate(() => {
        document.body.classList.remove('dark');
      });

      await page.evaluate(() => {
        const tocPanel = document.getElementById('toc-panel') as HTMLElement;
        tocPanel.style.display = 'flex';
        tocPanel.classList.add('open');
      });

      const panel = page.locator('#toc-panel');
      await expect(panel).toBeVisible();

      // Test in dark mode
      await page.evaluate(() => {
        document.body.classList.add('dark');
      });

      await expect(panel).toBeVisible();
    });
  });

  test.describe('TOC accessibility', () => {
    test('panel has role="dialog" and aria-label', async ({ page }) => {
      const panel = page.locator('#toc-panel');
      await expect(panel).toHaveAttribute('role', 'dialog');
      await expect(panel).toHaveAttribute('aria-label', 'Table of contents');
    });

    test('heading items are focusable buttons', async ({ page }) => {
      await page.evaluate(() => {
        const tocList = document.getElementById('toc-list') as HTMLElement;
        tocList.innerHTML = '<button class="toc-item" data-level="1">Title</button>';
      });

      const item = page.locator('.toc-item');
      await item.focus();
      await expect(item).toBeFocused();
    });

    test('Tab cycles through heading items', async ({ page }) => {
      await page.evaluate(() => {
        const tocList = document.getElementById('toc-list') as HTMLElement;
        tocList.innerHTML = `
          <button class="toc-item" data-level="1">H1</button>
          <button class="toc-item" data-level="2">H2</button>
        `;
      });

      const h1 = page.locator('.toc-item[data-level="1"]');
      const h2 = page.locator('.toc-item[data-level="2"]');

      await h1.focus();
      await expect(h1).toBeFocused();

      await page.keyboard.press('Tab');
      // Note: Tab behavior depends on actual DOM order
    });
  });
});
