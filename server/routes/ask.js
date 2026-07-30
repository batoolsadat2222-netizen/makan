import { Router } from 'express';
import multer from 'multer';
import { askQuestion, streamQuestion } from '../services/ai.js';
import { optimizeImage } from '../services/image.js';
import { extractTextFromImage } from '../services/ocr.js';
import { buildTextbookContext } from '../services/textbook.js';
import { detectCurriculum } from '../services/detectCurriculum.js';
import { recordQuestion } from '../store/analytics.js';
import { incrementUserQuestions } from '../store/users.js';
import { optionalAuth } from '../middleware/auth.js';
import { askLimiter } from '../middleware/rateLimit.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('فرمت تصویر پشتیبانی نمی‌شود. فقط JPG، PNG و WebP مجاز است.'));
  },
});

function uploadImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.message || 'خطا در آپلود تصویر. حداکثر حجم ۱۰ مگابایت.',
      });
    }
    next();
  });
}

async function buildParams(req) {
  let text = (req.body.text || '').trim();
  const image = req.file;
  let ocrText = '';
  let usedOcr = false;

  let imageBase64 = null;
  let imageMimeType = null;

  if (image) {
    // اول OCR تا متن برگه خوانده شود (کار می‌کند حتی بدون Gemini)
    try {
      ocrText = await extractTextFromImage(image.buffer);
      // متن خیلی کوتاه/خراب را OCR موفق حساب نکن
      if (ocrText && ocrText.replace(/\s+/g, '').length >= 8) {
        usedOcr = true;
        text = text ? `${text}\n\n${ocrText}` : ocrText;
      }
    } catch (error) {
      console.warn('OCR failed:', error.message);
    }

    const optimized = await optimizeImage(image.buffer, image.mimetype);
    // OCR فقط کمکی است؛ عکس را برای vision نگه می‌داریم تا جواب غلط از متن خراب نیاید
    imageBase64 = optimized.base64;
    imageMimeType = optimized.mimeType;
  }

  const detected = detectCurriculum({
    text,
    subject: req.body.subject || '',
    grade: req.body.grade || '',
  });

  const params = {
    text,
    subject: detected.subject,
    grade: detected.grade,
    subjectLabel: detected.subjectLabel,
    gradeLabel: detected.gradeLabel,
    autoDetected: detected.autoSubject || detected.autoGrade,
    answerMode: req.body.answerMode || 'full',
    usedOcr,
    ocrPreview: usedOcr ? ocrText.slice(0, 200) : null,
  };

  if (imageBase64) {
    params.imageBase64 = imageBase64;
    params.imageMimeType = imageMimeType;
  }

  const queryText = text.trim() || 'سوالات برگه امتحان';
  params.textbook = buildTextbookContext(params.grade, params.subject, queryText);
  return params;
}

function validateParams(params) {
  if (!params.text.trim() && !params.imageBase64) {
    return 'لطفاً سوال خود را به صورت متن بنویسید یا عکس آپلود کنید.';
  }
  return null;
}

function trackUsage(req, params) {
  recordQuestion({ subject: params.subject, grade: params.grade });
  if (req.user?.id) incrementUserQuestions(req.user.id);
}

function detectionPayload(params) {
  return {
    subject: params.subject,
    grade: params.grade,
    subjectLabel: params.subjectLabel,
    gradeLabel: params.gradeLabel,
    autoDetected: Boolean(params.autoDetected),
    textbook: params.textbook?.citationHint || null,
    usedOcr: Boolean(params.usedOcr),
  };
}

function sendSse(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

router.post('/', optionalAuth, askLimiter, uploadImage, async (req, res) => {
  try {
    const params = await buildParams(req);
    const validationError = validateParams(params);
    if (validationError) return res.status(400).json({ error: validationError });

    const { answer, mode, provider } = await askQuestion(params);
    trackUsage(req, params);
    res.json({ answer, mode, provider, ...detectionPayload(params) });
  } catch (error) {
    console.error('Error processing question:', error);
    if (error.message?.includes('فرمت تصویر')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'خطا در پردازش سوال. لطفاً دوباره تلاش کنید.' });
  }
});

router.post('/stream', optionalAuth, askLimiter, uploadImage, async (req, res) => {
  try {
    const params = await buildParams(req);
    const validationError = validateParams(params);
    if (validationError) return res.status(400).json({ error: validationError });

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sendSse(res, {
      type: 'meta',
      ...detectionPayload(params),
      status: params.usedOcr
        ? 'متن برگه خوانده شد — پاسخ به همه سوالات'
        : (params.imageBase64 ? 'در حال تحلیل تصویر' : null),
    });

    let succeeded = false;
    for await (const event of streamQuestion(params)) {
      if (event.type === 'done') {
        sendSse(res, { ...event, ...detectionPayload(params) });
        succeeded = true;
        trackUsage(req, params);
        break;
      }
      sendSse(res, event);
      if (event.type === 'error') break;
    }

    if (!succeeded && !res.writableEnded) {
      sendSse(res, { type: 'error', error: 'خطا در پردازش سوال.' });
    }
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'خطا در پردازش سوال.' });
    } else {
      sendSse(res, { type: 'error', error: 'خطا در پردازش سوال.' });
      res.end();
    }
  }
});

export default router;
