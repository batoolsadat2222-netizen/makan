import sharp from 'sharp';
import Tesseract from 'tesseract.js';

/**
 * خواندن متن برگه از روی عکس با OCR (فارسی + انگلیسی)
 */
export async function extractTextFromImage(buffer) {
  let prepared = buffer;
  try {
    prepared = await sharp(buffer)
      .rotate()
      .resize(2200, 2200, { fit: 'inside', withoutEnlargement: false })
      .grayscale()
      .normalize()
      .sharpen({ sigma: 1.2 })
      .png()
      .toBuffer();
  } catch (error) {
    console.warn('OCR preprocess failed:', error.message);
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
