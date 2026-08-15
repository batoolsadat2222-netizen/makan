import sharp from 'sharp';
import Tesseract from 'tesseract.js';

/**
 * خواندن متن برگه/جزوه از روی عکس با OCR (فارسی + انگلیسی)
 */
export async function extractTextFromImage(buffer) {
  let prepared = buffer;
  try {
    prepared = await sharp(buffer)
      .rotate()
      .resize(2800, 2800, { fit: 'inside', withoutEnlargement: false })
      .grayscale()
      .normalize()
      .linear(1.12, -8)
      .sharpen({ sigma: 1.3 })
      .png()
      .toBuffer();
  } catch (error) {
    console.warn('OCR preprocess failed:', error.message);
    try {
      prepared = await sharp(buffer)
        .rotate()
        .resize(2400, 2400, { fit: 'inside', withoutEnlargement: false })
        .grayscale()
        .normalize()
        .sharpen()
        .png()
        .toBuffer();
    } catch {
      prepared = buffer;
    }
  }

  const { data } = await Tesseract.recognize(prepared, 'fas+eng', {
    logger: () => {},
  });

  const text = (data?.text || '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}
