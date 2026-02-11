/**
 * File validation utilities for document uploads
 */

// Allowed file types and their MIME types
export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  // Documents
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.txt': ['text/plain'],
  // Images
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
};

// Max file size: 25MB
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Max message attachment size: 10MB
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a file for upload
 */
export function validateFile(file: File, maxSize: number = MAX_FILE_SIZE): FileValidationResult {
  // Check file size
  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File "${file.name}" terlalu besar. Maksimal ${maxMB}MB.`,
    };
  }

  // Check file extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_FILE_TYPES[ext]) {
    return {
      valid: false,
      error: `Tipe file "${ext}" tidak diizinkan. Tipe yang diterima: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`,
    };
  }

  // Check MIME type matches extension
  const allowedMimes = ALLOWED_FILE_TYPES[ext];
  if (allowedMimes && !allowedMimes.includes(file.type) && file.type !== '') {
    return {
      valid: false,
      error: `MIME type "${file.type}" tidak sesuai dengan ekstensi "${ext}".`,
    };
  }

  return { valid: true };
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: File[],
  maxSize: number = MAX_FILE_SIZE,
  maxCount: number = 10
): FileValidationResult {
  if (files.length > maxCount) {
    return {
      valid: false,
      error: `Maksimal ${maxCount} file yang bisa diupload sekaligus.`,
    };
  }

  for (const file of files) {
    const result = validateFile(file, maxSize);
    if (!result.valid) return result;
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get human-readable list of allowed extensions
 */
export function getAllowedExtensions(): string {
  return Object.keys(ALLOWED_FILE_TYPES).join(', ');
}

/**
 * Get accept string for file input
 */
export function getAcceptString(): string {
  return Object.keys(ALLOWED_FILE_TYPES).join(',');
}
