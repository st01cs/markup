import { readTextFile } from '@tauri-apps/plugin-fs';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface FileLoadResult {
  content: string;
  fileName: string;
  size: number;
  encoding: string;
}

export interface FileError {
  type: 'not-found' | 'too-large' | 'encoding' | 'unknown';
  message: string;
}

/**
 * Reads a text file with UTF-8 validation and size checks.
 */
export async function readTextFileSafe(filePath: string): Promise<FileLoadResult> {
  // readTextFile returns string - Tauri plugin reads as UTF-8 text
  const content = await readTextFile(filePath);
  const size = new TextEncoder().encode(content).length;
  const fileName = filePath.split('/').pop() || filePath;

  // Validate UTF-8: check for replacement characters that indicate encoding issues
  if (containsInvalidUTF8(content)) {
    throw {
      type: 'encoding' as const,
      message: `File "${fileName}" contains invalid UTF-8 characters. Please save the file as UTF-8 encoding.`,
    };
  }

  return {
    content,
    fileName,
    size,
    encoding: 'UTF-8',
  };
}

export function isFileTooLarge(size: number): boolean {
  return size > MAX_FILE_SIZE;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Checks if a string contains invalid UTF-8 sequences.
 * Looks for replacement characters (U+FFFD) which indicate decoding errors.
 */
function containsInvalidUTF8(str: string): boolean {
  // U+FFFD is the Unicode replacement character, used by decoders when they encounter invalid sequences
  return str.includes('\uFFFD');
}
