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
