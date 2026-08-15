import { Router } from 'express';
import multer from 'multer';
import { askQuestion, streamQuestion } from '../services/ai.js';
import { optimizeImage } from '../services/image.js';
import { extractTextFromUpload, isImageUpload } from '../services/extractUpload.js';
import { buildTextbookContext } from '../services/textbook.js';
import { detectCurriculum } from '../services/detectCurriculum.js';
import { recordQuestion } from '../store/analytics.js';
import { incrementUserQuestions } from '../store/users.js';
import { optionalAuth } from '../middleware/auth.js';
import { askLimiter } from '../middleware/rateLimit.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  // بدون محدودیت نوع فایل؛ سقف حجم خیلی بالا برای PDF/چندصفحه
  limits: { fileSize: 200 * 1024 * 1024, files: 40 },
});

function uploadAskFiles(req, res, next) {
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'exam', maxCount: 1 },
    { name: 'handout', maxCount: 30 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.message || 'خطا در آپلود فایل. لطفاً دوباره تلاش کنید.',
      });
    }
    next();
  });
}

async function readUploadText(file) {
  if (!file?.buffer) return '';
  try {
    const text = await extractTextFromUpload(
      file.buffer,
      file.mimetype || '',
      file.originalname || '',
    );
    if (text && text.replace(/\s+/g, '').length >= 8) return text.trim();
  } catch (error) {
    console.warn('Upload text extract failed:', error.message);
  }
  return '';
}

async function buildParams(req) {
  const userText = (req.body.text || '').trim();
  let text = userText;
  const mode = (req.body.mode || '').trim();
  const files = req.files || {};
  const examFile = files.exam?.[0] || files.image?.[0] || null;
  const handoutFiles = files.handout || [];

  let ocrText = '';
  let usedOcr = false;
  let handoutText = '';
  let handoutPages = 0;

  let imageBase64 = null;
  let imageMimeType = null;

  if (handoutFiles.length) {
    const parts = [];
    for (let i = 0; i < handoutFiles.length; i += 1) {
      const pageText = await readUploadText(handoutFiles[i]);
      if (pageText) {
        parts.push(`=== صفحه ${i + 1} جزوه ===\n${pageText}`);
        handoutPages += 1;
      }
    }
    handoutText = parts.join('\n\n').trim();
  }

  if (examFile) {
    try {
      ocrText = await readUploadText(examFile);
      if (ocrText && ocrText.replace(/\s+/g, '').length >= 8) {
        usedOcr = true;
        text = userText || ocrText;
        if (userText && userText !== ocrText) {
          text = `${userText}\n\n${ocrText}`;
        }
      }
    } catch (error) {
      console.warn('Exam extract failed:', error.message);
    }

    if (isImageUpload(examFile.mimetype || '', examFile.originalname || '')) {
      const optimized = await optimizeImage(examFile.buffer, examFile.mimetype);
      imageBase64 = optimized.base64;
      imageMimeType = optimized.mimeType;
    }
  }

  const isHandoutMode = mode === 'handout' || Boolean(handoutText) || handoutFiles.length > 0;
  if (isHandoutMode && !handoutText) {
    const err = new Error('متن جزوه/فایل خوانده نشد. PDF متنی، عکس واضح، یا فایل متنی بفرستید.');
    err.status = 400;
    throw err;
  }
  if (isHandoutMode && handoutText.replace(/\s+/g, '').length < 25) {
    const err = new Error('متن جزوه خیلی کم خوانده شد. فایل کامل‌تری بفرستید.');
    err.status = 400;
    throw err;
  }

  // تشخیص پایه/درس فقط از سوال (نه متن جزوه) + انتخاب صریح کاربر
  const detectSource = userText || ocrText || '';
  const detected = detectCurriculum({
    text: detectSource,
    subject: (req.body.subject || '').trim(),
    grade: (req.body.grade || '').trim(),
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
    mode: isHandoutMode ? 'handout' : 'exam',
    handoutText: handoutText || null,
    handoutPages,
  };

  if (imageBase64) {
    params.imageBase64 = imageBase64;
    params.imageMimeType = imageMimeType;
  }

  const queryText = detectSource.trim() || text.trim() || 'سوالات برگه امتحان';
  // در حالت جزوه، کتاب درسی را کنار می‌گذاریم تا جواب فقط از جزوه بیاید
  params.textbook = isHandoutMode
    ? null
    : buildTextbookContext(params.grade, params.subject, queryText);
  return params;
}

function validateParams(params) {
  if (params.mode === 'handout') {
    if (!params.handoutText?.trim()) {
      return 'لطفاً حداقل یک عکس از جزوه آپلود کنید.';
    }
    if (!params.text.trim() && !params.imageBase64) {
      return 'لطفاً سوالات امتحان را بنویسید یا عکس برگه را آپلود کنید.';
    }
    return null;
  }
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
    mode: params.mode || 'exam',
    handoutPages: params.handoutPages || 0,
  };
}

function sendSse(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

router.post('/', optionalAuth, askLimiter, uploadAskFiles, async (req, res) => {
  try {
    const params = await buildParams(req);
    const validationError = validateParams(params);
    if (validationError) return res.status(400).json({ error: validationError });

    const { answer, mode, provider } = await askQuestion(params);
    trackUsage(req, params);
    res.json({ answer, mode, provider, ...detectionPayload(params) });
  } catch (error) {
    console.error('Error processing question:', error);
    if (error.status === 400 || error.message?.includes('فرمت تصویر') || error.message?.includes('جزوه')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'خطا در پردازش سوال. لطفاً دوباره تلاش کنید.' });
  }
});

router.post('/stream', optionalAuth, askLimiter, uploadAskFiles, async (req, res) => {
  try {
    const params = await buildParams(req);
    const validationError = validateParams(params);
    if (validationError) return res.status(400).json({ error: validationError });

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const status = params.mode === 'handout'
      ? (params.handoutPages
          ? `جزوه خوانده شد (${params.handoutPages} صفحه) — پاسخ طبق جزوه`
          : 'در حال خواندن جزوه')
      : (params.usedOcr
          ? 'متن برگه خوانده شد — پاسخ به همه سوالات'
          : (params.imageBase64 ? 'در حال تحلیل تصویر' : null));

    sendSse(res, {
      type: 'meta',
      ...detectionPayload(params),
      status,
    });

    const abort = new AbortController();
    const onClose = () => abort.abort();
    req.on('close', onClose);

    let succeeded = false;
    try {
      for await (const event of streamQuestion(params, { signal: abort.signal })) {
        if (abort.signal.aborted || res.writableEnded) break;
        if (event.type === 'done') {
          sendSse(res, { ...event, ...detectionPayload(params) });
          succeeded = true;
          trackUsage(req, params);
          break;
        }
        sendSse(res, event);
        if (event.type === 'error') break;
      }
    } finally {
      req.off('close', onClose);
    }

    if (!succeeded && !res.writableEnded && !abort.signal.aborted) {
      sendSse(res, { type: 'error', error: 'خطا در پردازش سوال.' });
    }
    if (!res.writableEnded) res.end();
  } catch (error) {
    console.error('Stream error:', error);
    if (!res.headersSent) {
      const status = error.status === 400 ? 400 : 500;
      res.status(status).json({ error: error.message || 'خطا در پردازش سوال.' });
    } else if (!res.writableEnded) {
      sendSse(res, { type: 'error', error: error.message || 'خطا در پردازش سوال.' });
      res.end();
    }
  }
});

export default router;
