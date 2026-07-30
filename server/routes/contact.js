import { Router } from 'express';
import { saveContactMessage } from '../store/messages.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', optionalAuth, (req, res) => {
  const { email, subject, message } = req.body || {};

  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'ایمیل معتبر وارد کنید.' });
  }
  if (!message?.trim()) {
    return res.status(400).json({ error: 'متن پیام الزامی است.' });
  }

  saveContactMessage({
    email: email.trim(),
    subject: subject?.trim(),
    message: message.trim(),
    userId: req.user?.id,
  });

  res.json({ ok: true, message: 'پیام شما ثبت شد. به زودی پاسخ می‌دهیم.' });
});

export default router;
