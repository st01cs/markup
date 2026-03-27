import { open } from '@tauri-apps/plugin-dialog';
import { renderMarkdown } from './lib/renderer.js';
import { applyTheme, detectColorScheme, getCurrentTheme, toggleTheme as toggleThemeFn } from './lib/theme.js';
import { readTextFileSafe, isFileTooLarge, formatFileSize, type FileError } from './lib/file-utils.js';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

const contentEl = document.getElementById('markdown-content')!;
const scrollContainer = document.getElementById('content')!;
const welcomeEl = document.getElementById('welcome')!;
const fileInfoEl = document.getElementById('file-info')!;
const renderStatsEl = document.getElementById('render-stats')!;
const progressBar = document.getElementById('progress-bar')!;
const progressContainer = document.getElementById('progress-container')!;
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

    // Update window title to show filename
    await appWindow.setTitle(`${fileName} — Markup Reader`);

    // Track current file for duplicate detection
    await invoke('set_current_file', { filePath });

    setupImageErrorHandling(contentEl);

    // Reset and show progress bar when new file is loaded
    updateProgressAfterLayout();
    updateProgressVisibility();
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
  // Save preference to localStorage
  localStorage.setItem('theme', next ? 'dark' : 'light');
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

// Load saved theme preference, or fall back to system preference
function getInitialTheme(): boolean {
  const saved = localStorage.getItem('theme');
  if (saved !== null) {
    return saved === 'dark';
  }
  return detectColorScheme() === 'dark';
}

const initialDark = getInitialTheme();
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
  console.log('[DEBUG] open-file event received:', event.payload);
  const filePath = event.payload;
  await loadFile(filePath);
});

// Listen for focus window events (when file is already open)
listen<string>('focus-window', async (event) => {
  console.log('[DEBUG] focus-window event received:', event.payload);
  await appWindow.setFocus();
});

// Track scroll position for reading progress
function updateProgress() {
  const scrollTop = scrollContainer.scrollTop;
  const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
  // Show 100% if content fits in viewport (scrollHeight <= 0), otherwise calculate progress
  if (scrollHeight <= 0) {
    progressBar.style.width = '100%';
  } else {
    const progress = (scrollTop / scrollHeight) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }
}

// Update progress after browser has laid out the new content
function updateProgressAfterLayout() {
  requestAnimationFrame(() => {
    updateProgress();
  });
}

// Show/hide progress bar based on whether a file is loaded
function updateProgressVisibility() {
  progressContainer.style.display = welcomeEl.style.display === 'none' ? 'block' : 'none';
}

// Add scroll listener to scrollable container
scrollContainer.addEventListener('scroll', updateProgress);

// Check if app was launched with a file argument (cold start file association)
// Poll for pending file since on_open_url may fire after initial check on cold start
async function checkPendingFile(retries = 20) {
  console.log('[DEBUG] checkPendingFile: starting');
  for (let i = 0; i < retries; i++) {
    const pending = await invoke<string | null>('get_pending_file');
    console.log(`[DEBUG] checkPendingFile attempt ${i + 1}:`, pending);
    if (pending) {
      console.log('[DEBUG] checkPendingFile: loading file:', pending);
      await loadFile(pending);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  console.log('[DEBUG] checkPendingFile: no pending file found after retries');
}

// Start polling for pending file (will exit early if already set)
checkPendingFile();
