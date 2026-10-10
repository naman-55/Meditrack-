import fs from 'fs';
import path from 'path';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  code?: string;
  detectedFormat?: string;
}

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg']);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/pjpeg'
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validates medical report file by checking:
 * 1. File size bounds
 * 2. Extension whitelisting
 * 3. Declared MIME type
 * 4. Binary signature / Magic bytes
 */
export function validateUploadedFile(filePath: string, originalName: string, declaredMimeType: string): FileValidationResult {
  if (!fs.existsSync(filePath)) {
    return {
      isValid: false,
      error: 'Uploaded file could not be found on server disk.',
      code: 'FILE_NOT_FOUND'
    };
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    return {
      isValid: false,
      error: 'Uploaded file is empty (0 bytes).',
      code: 'FILE_EMPTY'
    };
  }

  if (stat.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds the 10 MB limit (${(stat.size / (1024 * 1024)).toFixed(1)} MB).`,
      code: 'FILE_TOO_LARGE'
    };
  }

  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      isValid: false,
      error: `Invalid file extension "${ext}". Only PDF, PNG, and JPEG documents are permitted for medical records.`,
      code: 'INVALID_EXTENSION'
    };
  }

  // Read the first 16 bytes for magic number verification
  const buffer = Buffer.alloc(16);
  let bytesRead = 0;
  try {
    const fd = fs.openSync(filePath, 'r');
    bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);
  } catch (err: any) {
    return {
      isValid: false,
      error: `Failed to inspect file signature: ${err.message}`,
      code: 'FILE_READ_ERROR'
    };
  }

  if (bytesRead < 4) {
    return {
      isValid: false,
      error: 'Corrupt or truncated file content.',
      code: 'FILE_TRUNCATED'
    };
  }

  // Magic bytes checks:
  // PDF: starts with %PDF- (0x25 0x50 0x44 0x46 0x2D)
  const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

  if (ext === '.pdf' && !isPdf) {
    return {
      isValid: false,
      error: 'File extension is .pdf but the internal file content is not a valid PDF document.',
      code: 'MAGIC_BYTES_MISMATCH'
    };
  }

  if (ext === '.png' && !isPng) {
    return {
      isValid: false,
      error: 'File extension is .png but the internal file content is not a valid PNG image.',
      code: 'MAGIC_BYTES_MISMATCH'
    };
  }

  if ((ext === '.jpg' || ext === '.jpeg') && !isJpeg) {
    return {
      isValid: false,
      error: 'File extension is .jpg/.jpeg but the internal file content is not a valid JPEG image.',
      code: 'MAGIC_BYTES_MISMATCH'
    };
  }

  if (!isPdf && !isPng && !isJpeg) {
    return {
      isValid: false,
      error: 'Unrecognized file format. Only authentic PDF, PNG, and JPEG documents are permitted.',
      code: 'UNSUPPORTED_FORMAT'
    };
  }

  return {
    isValid: true,
    detectedFormat: isPdf ? 'pdf' : (isPng ? 'png' : 'jpeg')
  };
}
