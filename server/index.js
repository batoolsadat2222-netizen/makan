import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import askRouter from './routes/ask.js';
import authRouter from './routes/auth.js';
import contactRouter from './routes/contact.js';
import analyticsRouter from './routes/analytics.js';
import adminRouter from './routes/admin.js';
import curriculumRouter from './routes/curriculum.js';
import setupRouter from './routes/setup.js';
import { getActiveProvider } from './services/ai.js';
import { isCompatConfigured } from './services/openaiCompat.js';
import { prewarmOllama } from './services/ollama.js';
import { generalLimiter } from './middleware/rateLimit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const clientDist = path.join(__dirname, '..', 'client', 'dist');
const hasFrontend = fs.existsSync(path.join(clientDist, 'index.html'));

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// allowedOrigins دیگر برای CORS سخت‌گیرانه استفاده نمی‌شود (تونل عمومی)
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
// لینک عمومی (تونل) هم باید کار کند — همان‌origin یا هر origin مجاز
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

let healthProvider = 'demo';

app.get('/api/health', async (_req, res) => {
  let cloudReady = false;
  try {
    cloudReady = Boolean(await isCompatConfigured());
  } catch {
    cloudReady = false;
  }
  res.json({
    status: 'ok',
    mode: cloudReady || healthProvider !== 'demo' ? 'ai' : 'demo',
    provider: cloudReady ? 'compat' : healthProvider,
    cloudReady,
    frontend: hasFrontend,
  });
});

app.use(generalLimiter);

app.use('/api/auth', authRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/curriculum', curriculumRouter);
app.use('/api/admin', adminRouter);
app.use('/api/setup', setupRouter);
app.use('/api/contact', contactRouter);
app.use('/api/ask', askRouter);

if (hasFrontend) {
  // صفحه اصلی و SW هرگز کش بلندمدت نگیرند
  app.get(['/', '/index.html', '/sw.js', '/registerSW.js', '/manifest.webmanifest'], (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    next();
  });

  app.use(express.static(clientDist, {
    index: false,
    etag: true,
    setHeaders(res, filePath) {
      if (/index\.html$|sw\.js$|registerSW\.js$|manifest\.webmanifest$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      } else if (/[\\/]assets[\\/]/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.status(503).send(
      'Frontend not built. Run: cd client && npm run build — then restart server.'
    );
  });
}

app.listen(PORT, HOST, async () => {
  const provider = await getActiveProvider();
  healthProvider = provider;
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║           ماکان — آماده است          ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log(`  🌐  http://localhost:${PORT}`);
  console.log(`  🌐  http://127.0.0.1:${PORT}`);
  if (hasFrontend) console.log('  ✓  Frontend + API روی یک پورت');
  else console.log('  ⚠  Frontend ساخته نشده — فقط API');
  console.log(`  ⚙  Mode: ${provider === 'demo' ? 'demo' : `ai (${provider})`}`);
  console.log(
    `  🔑  Keys: gemini=${Boolean((process.env.GEMINI_API_KEY || '').trim())} groq=${Boolean((process.env.GROQ_API_KEY || '').trim())} groqDisabled=${/^(1|true|yes)$/i.test((process.env.GROQ_DISABLED || '').trim())}`
  );
  console.log('');
  prewarmOllama();
});
