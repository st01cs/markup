import { open } from '@tauri-apps/plugin-dialog';
import { renderMarkdown } from './lib/renderer.js';
import { applyTheme, detectColorScheme, getCurrentTheme, toggleTheme as toggleThemeFn } from './lib/theme.js';
import { readTextFileSafe, isFileTooLarge, formatFileSize, type FileError } from './lib/file-utils.js';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

const contentEl = document.getElementById('markdown-content')!;
const welcomeEl = document.getElementById('welcome')!;
const fileInfoEl = document.getElementById('file-info')!;
const renderStatsEl = document.getElementById('render-stats')!;
const errorOverlay = document.getElementById('error-overlay')!;
const errorMessage = document.getElementById('error-message')!;
const errorClose = document.getElementById('error-close')!;
const fabWidget = document.getElementById('fab-widget')!;
const fabToggle = document.getElementById('fab-toggle')!;
const fabOpen = document.getElementById('fab-open')!;
const fabTheme = document.getElementById('fab-theme')!;
const fabIconDark = document.getElementById('fab-icon-dark')!;
const fabIconLight = document.getElementById('fab-icon-light')!;

function setupImageErrorHandling(container: HTMLElement) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLImageElement) {
          const img = node;
          img.onerror = () => {
            img.style.display = 'none';
          };
        } else if (node instanceof Element) {
          const imgs = node.querySelectorAll?.('img');
          imgs?.forEach((img) => {
            (img as HTMLImageElement).onerror = () => {
              (img as HTMLImageElement).style.display = 'none';
            };
          });
        }
      }
    }
  });

  observer.observe(container, { childList: true, subtree: true });
  return observer;
}

async function openFile() {
  try {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Markdown',
        extensions: ['md', 'markdown', 'txt'],
      }],
    });

    if (selected) {
      await loadFile(selected as string);
    }
  } catch (err) {
    showError(`Failed to open file dialog: ${err}`);
  }
}

async function loadFile(filePath: string) {
  try {
    const { content, fileName, size } = await readTextFileSafe(filePath);

    if (isFileTooLarge(size)) {
      showError(`File "${fileName}" is too large (${formatFileSize(size)}). Maximum supported size is 5 MB.`);
      return;
    }

    const startTime = performance.now();
    const { html, errors } = renderMarkdown(content);
    const endTime = performance.now();

    if (errors.length > 0) {
      showError(`Render errors: ${errors.join(', ')}`);
      return;
    }

    contentEl.innerHTML = html;
    contentEl.style.display = 'block';
    welcomeEl.style.display = 'none';

    fileInfoEl.textContent = `${fileName} (${formatFileSize(size)})`;
    renderStatsEl.textContent = `Rendered in ${(endTime - startTime).toFixed(1)}ms`;

    setupImageErrorHandling(contentEl);
  } catch (err) {
    const fileError = err as FileError;
    if (fileError.type === 'encoding') {
      showError(fileError.message);
    } else {
      showError(`Failed to read file: ${err}`);
    }
  }
}

function showError(message: string) {
  errorMessage.textContent = message;
  errorOverlay.style.display = 'flex';
}

function hideError() {
  errorOverlay.style.display = 'none';
}

function handleToggleTheme() {
  const current = getCurrentTheme();
  const isDark = current === 'dark';
  const next = toggleThemeFn(isDark);
  applyTheme(next);
  // Update FAB icon
  if (next) {
    fabIconDark.style.display = '';
    fabIconLight.style.display = 'none';
  } else {
    fabIconDark.style.display = 'none';
    fabIconLight.style.display = '';
  }
}

// Floating widget
fabToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  fabWidget.classList.toggle('expanded');
});

fabOpen.addEventListener('click', () => {
  fabWidget.classList.remove('expanded');
  openFile();
});

fabTheme.addEventListener('click', () => {
  fabWidget.classList.remove('expanded');
  handleToggleTheme();
});

document.addEventListener('click', (e) => {
  if (e.target instanceof Element && !e.target.closest('.fab-widget')) {
    fabWidget.classList.remove('expanded');
  }
});

errorClose.addEventListener('click', hideError);

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
    e.preventDefault();
    openFile();
  }
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    handleToggleTheme();
  }
  if (e.key === 'Escape') {
    hideError();
  }
});

const initialDark = detectColorScheme() === 'dark';
applyTheme(initialDark);
if (initialDark) {
  fabIconDark.style.display = '';
  fabIconLight.style.display = 'none';
} else {
  fabIconDark.style.display = 'none';
  fabIconLight.style.display = '';
}

// Listen for file open events from macOS file association
listen<string>('open-file', async (event) => {
  const filePath = event.payload;
  await loadFile(filePath);
});

// Check if app was launched with a file argument (cold start file association)
async function checkPendingFile() {
  const pending = await invoke<string | null>('get_pending_file');
  if (pending) {
    await loadFile(pending);
  }
}
checkPendingFile();
