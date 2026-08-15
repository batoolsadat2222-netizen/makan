import rateLimit from 'express-rate-limit';

/** برای مسیرهای عمومی سبک — سقف خیلی بالا */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'درخواست‌های خیلی زیاد. لطفاً چند دقیقه بعد تلاش کنید.' },
  skip: (req) => {
    const p = req.path || '';
    // health و ask نباید محدود شوند — دانش‌آموز آزادانه سوال بپرسد
    return p === '/api/health' || p.startsWith('/api/ask') || p === '/health';
  },
});

/** سوالات: بدون محدودیت عملی — همه دانش‌آموزان پشت یک تونل یک IP دیده می‌شوند */
export function askLimiter(_req, _res, next) {
  next();
}
