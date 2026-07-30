# ماکان — سامانه پاسخ‌دهی به سوالات درسی

وب‌اپلیکیشن PWA برای دانش‌آموزان: ارسال سوال (متن یا عکس) و دریافت پاسخ فارسی با AI.

## ویژگی‌ها

- آپلود عکس برگه یا نوشتن متن سوال
- انتخاب **درس** و **پایه** برای دقت بهتر
- دو حالت: **پاسخ کامل** / **راهنمای حل**
- پاسخ **استریم** (کلمه‌به‌کلمه)
- نمایش **Markdown**، کپی، چاپ/PDF
- تاریخچه با جستجو و thumbnail عکس
- ثبت‌نام/ورود (سرور + fallback آفلاین)
- محدودیت مهمان (۳ سوال/روز) + rate limit سرور
- فیدback 👍/👎 و آمار استفاده
- PWA — قابل نصب روی موبایل
- Dark mode

## پیش‌نیازها

- Node.js 18+
- یکی از: کلید Groq، Gemini، یا Ollama محلی

## راه‌اندازی

### Backend

```bash
cd server
npm install
cp .env.example .env
# کلید API را در .env تنظیم کنید
npm run dev
```

Backend: `http://localhost:3001`

### Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`

## Deploy

```bash
# Frontend
VITE_API_URL=https://your-api.com npm run build

# Backend — متغیرها:
# PORT, GEMINI_API_KEY, GROQ_API_KEY, JWT_SECRET, CORS_ORIGINS
```

## API

| Endpoint | توضیح |
|----------|--------|
| `GET /api/health` | وضعیت سرور |
| `POST /api/ask` | پاسخ (JSON) |
| `POST /api/ask/stream` | پاسخ استریم (SSE) |
| `POST /api/auth/register` | ثبت‌نام |
| `POST /api/auth/login` | ورود |
| `GET /api/analytics/stats` | آمار عمومی |
| `POST /api/analytics/feedback` | ثبت بازخورد |

## ساختار

```
├── client/     React + Vite + Tailwind + PWA
├── server/     Express + Gemini/Groq/Ollama
└── README.md
```
