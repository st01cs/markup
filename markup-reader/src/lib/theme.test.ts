import { describe, it, expect, beforeEach } from 'vitest';
import { detectColorScheme, applyTheme, getCurrentTheme, toggleTheme } from './theme.js';

describe('theme', () => {
  beforeEach(() => {
    document.body.classList.remove('dark');
    document.body.innerHTML = `
      <div id="theme-icon-dark" style="display:block"></div>
      <div id="theme-icon-light" style="display:none"></div>
    `;
  });

  describe('detectColorScheme', () => {
    it('returns light when no matchMedia', () => {
      const result = detectColorScheme();
      expect(result).toBe('light');
    });
  });

  describe('applyTheme', () => {
    it('adds dark class when dark is true', () => {
      applyTheme(true);
      expect(document.body.classList.contains('dark')).toBe(true);
    });

    it('removes dark class when dark is false', () => {
      document.body.classList.add('dark');
      applyTheme(false);
      expect(document.body.classList.contains('dark')).toBe(false);
    });

    it('shows dark icon and hides light icon when dark mode', () => {
      applyTheme(true);
      const darkIcon = document.getElementById('theme-icon-dark')!;
      const lightIcon = document.getElementById('theme-icon-light')!;
      expect(darkIcon.style.display).toBe('block');
      expect(lightIcon.style.display).toBe('none');
    });

    it('shows light icon and hides dark icon when light mode', () => {
      applyTheme(false);
      const darkIcon = document.getElementById('theme-icon-dark')!;
      const lightIcon = document.getElementById('theme-icon-light')!;
      expect(darkIcon.style.display).toBe('none');
      expect(lightIcon.style.display).toBe('block');
    });
  });

  describe('getCurrentTheme', () => {
    it('returns dark when body has dark class', () => {
      document.body.classList.add('dark');
      expect(getCurrentTheme()).toBe('dark');
    });

    it('returns light when body does not have dark class', () => {
      document.body.classList.remove('dark');
      expect(getCurrentTheme()).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('returns false when input is true (toggle dark to light)', () => {
      expect(toggleTheme(true)).toBe(false);
    });

    it('returns true when input is false (toggle light to dark)', () => {
      expect(toggleTheme(false)).toBe(true);
    });
  });
});
