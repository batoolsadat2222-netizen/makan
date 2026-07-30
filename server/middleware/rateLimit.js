import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'درخواست‌های خیلی زیاد. لطفاً چند دقیقه بعد تلاش کنید.' },
});

/** بدون سهمیه سوال — فقط سقف خیلی بالا برای جلوگیری از حمله */
export const askLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'درخواست‌های خیلی زیاد. لطفاً کمی بعد دوباره تلاش کنید.' },
});
