import sharp from 'sharp';

const MAX_SIZE = 1400;
const JPEG_QUALITY = 82;

export async function optimizeImage(buffer, mimeType) {
  try {
    const optimized = await sharp(buffer)
      .rotate()
      .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    return {
      base64: optimized.toString('base64'),
      mimeType: 'image/jpeg',
    };
  } catch (error) {
    console.warn('Image optimize failed, using original:', error.message);
    return {
      base64: buffer.toString('base64'),
      mimeType: mimeType,
    };
  }
}
