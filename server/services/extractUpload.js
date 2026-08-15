import { extractTextFromImage } from './ocr.js';

function isPdf(mimeType = '', filename = '') {
  return mimeType === 'application/pdf' || /\.pdf$/i.test(filename);
}

function isImage(mimeType = '', filename = '') {
  if (mimeType.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|bmp|heic|heif|tif{1,2}|avif)$/i.test(filename);
}

function isPlainText(mimeType = '', filename = '') {
  if (mimeType.startsWith('text/')) return true;
  return /\.(txt|md|csv|json|html?)$/i.test(filename);
}

async function extractPdfText(buffer) {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return String(result?.text || '')
      .replace(/[^\S\n]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } finally {
    try {
      await parser.destroy?.();
    } catch {
      /* ignore */
    }
  }
}

/**
 * استخراج متن از عکس، PDF یا فایل متنی
 */
export async function extractTextFromUpload(buffer, mimeType = '', filename = '') {
  if (!buffer?.length) return '';

  if (isPdf(mimeType, filename)) {
    try {
      return await extractPdfText(buffer);
    } catch (error) {
      console.warn('PDF extract failed:', error.message);
      return '';
    }
  }

  if (isPlainText(mimeType, filename)) {
    try {
      return buffer.toString('utf8').trim();
    } catch {
      return '';
    }
  }

  if (isImage(mimeType, filename) || !mimeType || mimeType === 'application/octet-stream') {
    try {
      const text = await extractTextFromImage(buffer);
      return text?.trim() || '';
    } catch (error) {
      console.warn('OCR failed:', error.message);
      return '';
    }
  }

  // فرمت ناشناخته: اول PDF/متن، بعد OCR به‌عنوان آخرین شانس
  try {
    const asText = buffer.toString('utf8');
    if (/[\u0600-\u06FFa-zA-Z]{20,}/.test(asText) && !asText.includes('\u0000')) {
      return asText.trim();
    }
  } catch {
    /* ignore */
  }

  try {
    return (await extractTextFromImage(buffer))?.trim() || '';
  } catch {
    return '';
  }
}

export function isImageUpload(mimeType = '', filename = '') {
  return isImage(mimeType, filename);
}

export function isPdfUpload(mimeType = '', filename = '') {
  return isPdf(mimeType, filename);
}
