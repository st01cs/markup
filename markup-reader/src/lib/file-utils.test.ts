import { describe, it, expect } from 'vitest';
import { isFileTooLarge, formatFileSize } from './file-utils.js';

describe('file-utils', () => {
  describe('isFileTooLarge', () => {
    it('returns false for files under 5MB', () => {
      expect(isFileTooLarge(1024)).toBe(false); // 1KB
      expect(isFileTooLarge(1024 * 1024)).toBe(false); // 1MB
      expect(isFileTooLarge(4 * 1024 * 1024)).toBe(false); // 4MB
    });

    it('returns true for files over 5MB', () => {
      expect(isFileTooLarge(5 * 1024 * 1024)).toBe(false); // exactly 5MB is OK
      expect(isFileTooLarge(6 * 1024 * 1024)).toBe(true); // 6MB
      expect(isFileTooLarge(10 * 1024 * 1024)).toBe(true); // 10MB
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('formats kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 100)).toBe('100.0 KB');
    });

    it('formats megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
      expect(formatFileSize(1024 * 1024 * 10)).toBe('10.0 MB');
    });
  });
});
