import { Router } from 'express';
import { checkAdminPassword } from '../middleware/admin.js';
import { getAiStatus, saveAiConfig, AI_PRESETS } from '../store/aiConfig.js';

const router = Router();

router.get('/ai-status', (_req, res) => {
  res.json({ ...getAiStatus(), presets: AI_PRESETS });
});

router.post('/ai-key', (req, res) => {
  const { password, apiKey, baseURL, model, providerName } = req.body || {};

  const adminPass = (process.env.ADMIN_PASSWORD || '').trim();
  // اگر رمز مدیر ست شده باید درست باشد؛ اگر ست نشده (لوکال) اجازه ذخیره بده
  if (adminPass) {
    if (!password || !checkAdminPassword(password)) {
      return res.status(401).json({ error: 'رمز مدیر اشتباه است.' });
    }
  }

  if (!apiKey || String(apiKey).trim().length < 8) {
    return res.status(400).json({ error: 'کلید API معتبر نیست.' });
  }

  const status = saveAiConfig({
    apiKey: String(apiKey).trim(),
    baseURL: baseURL || undefined,
    model: model || undefined,
    providerName: providerName || undefined,
  });

  res.json({ ok: true, ...status });
});

export default router;
