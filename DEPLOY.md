# راهنمای Deploy آنلاین — ماکان

دو روش برای انتشار سایت:

---

## روش ۱: فقط Render (ساده‌تر — پیشنهادی)

Frontend + Backend روی **یک سرور** Render.

### مراحل

1. پروژه را در [GitHub](https://github.com) آپلود کن
2. برو به [render.com](https://render.com) → **New → Web Service**
3. ریپو را Connect کن
4. تنظیمات:

| فیلد | مقدار |
|------|--------|
| **Build Command** | `npm run setup` |
| **Start Command** | `node server/index.js` |
| **Instance Type** | Free |

5. **Environment Variables** اضافه کن:

```
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
JWT_SECRET=یک-رمز-تصادفی-قوی
ADMIN_PASSWORD=رمز-پنل-مدیریت
PORT=8080
```

6. **Deploy** بزن — آدرس شما: `https://makan-xxxx.onrender.com`

> ⚠️ پلن Free بعد از ۱۵ دقیقه idle می‌خوابد — اولین بازدید ۳۰ ثانیه طول می‌کشد.

---

## روش ۲: Vercel (Frontend) + Render (Backend)

برای سرعت بیشتر frontend.

### Backend روی Render

1. همان مراحل بالا، ولی **بدون build frontend**:
   - Build: `cd server && npm install`
   - Start: `node index.js`
2. آدرس API: `https://makan-api.onrender.com`

### Frontend روی Vercel

1. برو [vercel.com](https://vercel.com) → Import Project
2. **Root Directory:** `client`
3. **Environment Variable:**
   ```
   VITE_API_URL=https://makan-api.onrender.com
   ```
4. Deploy — آدرس: `https://makan.vercel.app`

5. در Render، `CORS_ORIGINS` را آپدیت کن:
   ```
   CORS_ORIGINS=https://makan.vercel.app,https://makan-api.onrender.com
   ```

---

## فایل render.yaml (خودکار)

اگر `render.yaml` در ریشه پروژه باشد، Render خودکار تنظیم می‌کند:

```bash
# فقط Connect repo و Deploy
```

---

## پنل مدیریت

1. سایت را باز کن → **تنظیمات** → **پنل مدیریت**
2. رمز `ADMIN_PASSWORD` را وارد کن
3. پیام‌های تماس، آمار کاربران و سوالات را ببین

---

## چک‌لیست قبل از Deploy

- [ ] `GROQ_API_KEY` یا `GEMINI_API_KEY` تنظیم شده
- [ ] `JWT_SECRET` یک رمز تصادفی قوی است
- [ ] `ADMIN_PASSWORD` تنظیم شده
- [ ] `npm run setup` بدون خطا اجرا می‌شود
- [ ] `http://localhost:8080/api/health` پاسخ `ok` می‌دهد

---

## دستورات محلی

```bash
# نصب + build
npm run setup

# اجرا (production)
node server/index.js
```

سایت: http://localhost:8080
