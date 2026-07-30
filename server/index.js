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
import { getActiveProvider } from './services/ai.js';
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

const allowedOrigins = (process.env.CORS_ORIGINS ||
  'http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((o) => o.trim());

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
// در production (سایت واحد روی Render) origin خود سایت + لیست env
const corsOrigin = process.env.NODE_ENV === 'production'
  ? true
  : (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    };
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

let healthProvider = 'demo';

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: healthProvider === 'demo' ? 'demo' : 'ai',
    provider: healthProvider,
    frontend: hasFrontend,
  });
});

app.use(generalLimiter);

app.use('/api/auth', authRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/curriculum', curriculumRouter);
app.use('/api/admin', adminRouter);
app.use('/api/contact', contactRouter);
app.use('/api/ask', askRouter);

if (hasFrontend) {
  app.use(express.static(clientDist, { maxAge: '1d', index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
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
