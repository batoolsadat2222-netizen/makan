import { askDemo } from './demo.js';
import { trySolveMath } from './localSolver.js';
import { askLocalTutor } from './localTutor.js';
import { askGroq, streamGroq, isValidGroqKey } from './groq.js';
import { askGemini, streamGemini, isValidGeminiKey } from './gemini.js';
import { askOllama, streamOllama, isOllamaAvailable, hasGoodPersianModel } from './ollama.js';
import { askCompat, streamCompat, isCompatConfigured } from './openaiCompat.js';

let cachedOllamaAvailable = null;
let cachedOllamaAt = 0;
let ollamaBlockedUntil = 0;
let groqBlocked = false;
let geminiBlockedUntil = 0;
let compatBlockedUntil = 0;

function envFlag(name) {
  return /^(1|true|yes)$/i.test((process.env[name] || '').trim());
}

function cleanKey(key) {
  return (key || '').trim().replace(/^["']|["']$/g, '');
}

function shouldTryGroq() {
  if (groqBlocked || envFlag('GROQ_DISABLED')) return false;
  return isValidGroqKey(cleanKey(process.env.GROQ_API_KEY));
}

function shouldTryGemini() {
  if (Date.now() < geminiBlockedUntil) return false;
  return isValidGeminiKey(cleanKey(process.env.GEMINI_API_KEY));
}

function shouldTryCompatSyncGate() {
  if (Date.now() < compatBlockedUntil) return false;
  if (envFlag('OPENAI_COMPAT_DISABLED')) return false;
  return true;
}

async function checkOllama() {
  if (envFlag('OLLAMA_DISABLED')) return false;
  if (Date.now() < ollamaBlockedUntil) return false;
  const now = Date.now();
  if (cachedOllamaAvailable !== null && now - cachedOllamaAt < 60_000) {
    return cachedOllamaAvailable;
  }
  cachedOllamaAvailable = await isOllamaAvailable();
  cachedOllamaAt = now;
  return cachedOllamaAvailable;
}

async function getProviderList(params = {}) {
  const providers = [];

  // Groq از ایران معمولاً در دسترس است — قبل از پروکسی ناپایدار
  if (shouldTryGroq()) providers.push('groq');

  if (shouldTryCompatSyncGate() && (await isCompatConfigured())) {
    providers.push('compat');
  }

  // Gemini مستقیم از ایران معمولاً 403 — فقط اگر صریح فعال باشد
  if (!envFlag('GEMINI_DISABLED') && shouldTryGemini()) providers.push('gemini');

  const ollamaOk = await checkOllama();
  if (ollamaOk) {
    if (params.imageBase64 && !params.usedOcr) {
      providers.push('ollama');
    } else if (await hasGoodPersianModel()) {
      providers.push('ollama');
    }
  }
  return providers;
}

export async function getActiveProvider() {
  const providers = await getProviderList();
  if (providers[0]) return providers[0];
  return 'local';
}

export function isDemoMode() {
  return false;
}

function normalizeParams(params) {
  return {
    ...params,
    subject: params.subject || '',
    grade: params.grade || '',
    answerMode: params.answerMode || 'full',
  };
}

function assertNotAborted(signal) {
  if (signal?.aborted) {
    const err = new Error('Request aborted');
    err.name = 'AbortError';
    throw err;
  }
}

async function tryProvider(provider, params, stream = false) {
  const normalized = normalizeParams(params);

  if (stream) {
    switch (provider) {
      case 'compat':
        return { stream: streamCompat(normalized), provider: 'compat' };
      case 'groq':
        return { stream: streamGroq(normalized), provider: 'groq' };
      case 'gemini':
        return { stream: streamGemini(normalized), provider: 'gemini' };
      case 'ollama':
        return { stream: streamOllama(normalized), provider: 'ollama' };
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  switch (provider) {
    case 'compat':
      return { answer: await askCompat(normalized), provider: 'compat' };
    case 'groq':
      return { answer: await askGroq(normalized), provider: 'groq' };
    case 'gemini':
      return { answer: await askGemini(normalized), provider: 'gemini' };
    case 'ollama':
      return { answer: await askOllama(normalized), provider: 'ollama' };
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function markProviderFailure(provider, error) {
  if (error?.name === 'AbortError') return;
  console.error(`${provider} failed:`, error.message);
  // timeout را مسدود نکن — فقط مسدودسازی واقعی/403
  if (provider === 'gemini' && /403|blocked|Forbidden|UNAVAILABLE/i.test(error.message || '')) {
    geminiBlockedUntil = Date.now() + 5 * 60_000;
    console.error('Gemini موقتاً غیرفعال شد (مسدود یا قطع شبکه)');
  }
  if (provider === 'groq' && (error.message?.includes('403') || error.status === 403)) {
    groqBlocked = true;
    console.error('Groq مسدود — از این به بعد رد می‌شود');
  }
  if (provider === 'compat' && /401|402|403|invalid_api_key|insufficient/i.test(error.message || '')) {
    compatBlockedUntil = Date.now() + 10 * 60_000;
    console.error('درگاه سازگار موقتاً غیرفعال شد');
  }
  if (provider === 'ollama' && /500|out of memory|OOM|allocate/i.test(error.message || '')) {
    ollamaBlockedUntil = Date.now() + 5 * 60_000;
    cachedOllamaAvailable = false;
    console.error('Ollama موقتاً غیرفعال شد (کمبود حافظه یا خطای سرور)');
  }
}

function mathOnlyFallback(params) {
  if (params.usedOcr || params.imageBase64 || params.handoutText?.trim()) return null;
  const solved = trySolveMath(params.text || '');
  if (solved) {
    return { answer: solved.answer, mode: 'local', provider: 'local-math' };
  }
  return null;
}

function isWeakLocalAnswer(answer = '') {
  return /پاسخ قطعی محلی پیدا نشد|الان پاسخ کامل ابری در دسترس نیست|VPN روشن|متن عکس خوانده نشد/i.test(answer);
}

function localFallback(params) {
  const tutor = askLocalTutor({
    text: params.text || '',
    subject: params.subject,
    grade: params.grade,
    usedOcr: Boolean(params.usedOcr || params.imageBase64),
    handoutText: params.handoutText || '',
  });
  if (tutor?.answer?.trim() && !isWeakLocalAnswer(tutor.answer)) {
    // برگه ناقص را به‌عنوان جواب نهایی نپذیر
    if (tutor.total > 0 && tutor.answered < tutor.total) return null;
    return { answer: tutor.answer, mode: 'local', provider: tutor.provider || 'local' };
  }
  return mathOnlyFallback(params);
}

function offlineFallback(params) {
  return localFallback(params);
}

async function* streamDemo(text) {
  const words = text.split(/(\s+)/);
  for (const word of words) {
    yield word;
    await new Promise((r) => setTimeout(r, 12));
  }
}

async function* yieldLocal(result) {
  for await (const chunk of streamDemo(result.answer)) {
    yield { type: 'chunk', text: chunk };
  }
  yield { type: 'done', mode: result.mode || 'local', provider: result.provider };
}

function handoutLocalFirst(params) {
  if (!params.handoutText?.trim() || !(params.text || '').trim()) return null;
  const tutor = askLocalTutor({
    text: params.text || '',
    subject: params.subject,
    grade: params.grade,
    usedOcr: Boolean(params.usedOcr || params.imageBase64),
    handoutText: params.handoutText,
  });
  if (!tutor?.answer?.trim()) return null;
  // اگر هیچ بخش مرتبطی پیدا نشد، به AI فرصت بده
  if (tutor.total > 0 && tutor.answered === 0) return null;
  return {
    answer: tutor.answer,
    mode: 'handout',
    provider: tutor.provider || 'local-handout',
  };
}

export async function askQuestion(params) {
  const isHandout = Boolean(params.handoutText?.trim()) || params.mode === 'handout';

  // ریاضی خالص فقط وقتی جزوه نیست
  if (!isHandout) {
    const math = mathOnlyFallback(params);
    if (math) return math;
  }

  // جزوه: اول استخراج مستقیم از متن جزوه (وفادارتر از دانش عمومی AI)
  if (isHandout) {
    const fromHandout = handoutLocalFirst(params);
    if (fromHandout) return fromHandout;
  }

  // همیشه اول AI — جواب واقعی سوال
  const providers = await getProviderList(params);
  let lastAiError = null;
  for (const provider of providers) {
    try {
      const { answer } = await tryProvider(provider, params, false);
      if (answer?.trim() && !isWeakLocalAnswer(answer)) {
        return { answer, mode: isHandout ? 'handout' : 'ai', provider };
      }
    } catch (error) {
      lastAiError = error;
      markProviderFailure(provider, error);
    }
  }

  // اگر AI قطع شد، یک‌بار دیگر فقط compat را بعد از پاک‌کردن بلاک کوتاه امتحان کن
  if (!isHandout && lastAiError && providers.includes('compat')) {
    try {
      compatBlockedUntil = 0;
      const { answer } = await tryProvider('compat', params, false);
      if (answer?.trim() && !isWeakLocalAnswer(answer)) {
        return { answer, mode: 'ai', provider: 'compat' };
      }
    } catch (error) {
      markProviderFailure('compat', error);
    }
  }

  const offline = offlineFallback(params);
  if (offline && !isWeakLocalAnswer(offline.answer || '')) {
    if (isHandout) return { ...offline, mode: 'handout' };
    return offline;
  }

  if (isHandout) {
    return {
      answer: 'متن جزوه خوانده شد، ولی پاسخ مطمئنی از روی آن ساخته نشد. عکس واضح‌تری از جزوه بفرستید.',
      mode: 'handout',
      provider: 'local-handout',
    };
  }

  // آخرین شانس: دوباره AI بدون فیلتر محلی ضعیف
  for (const provider of providers) {
    try {
      const { answer } = await tryProvider(provider, params, false);
      if (answer?.trim()) {
        return { answer, mode: 'ai', provider };
      }
    } catch (error) {
      markProviderFailure(provider, error);
    }
  }

  const answer = await askDemo(params);
  if (answer?.trim() && !isWeakLocalAnswer(answer)) {
    return { answer, mode: 'demo', provider: 'demo' };
  }

  return {
    answer: 'الان نتوانستیم پاسخ کامل بسازیم. لطفاً چند ثانیه بعد دوباره «دریافت پاسخ» را بزنید.',
    mode: 'error',
    provider: 'none',
  };
}

export async function* streamQuestion(params, { signal } = {}) {
  assertNotAborted(signal);
  const isHandout = Boolean(params.handoutText?.trim()) || params.mode === 'handout';

  if (!isHandout) {
    const math = mathOnlyFallback(params);
    if (math) {
      yield* yieldLocal(math);
      return;
    }
  }

  if (isHandout) {
    const fromHandout = handoutLocalFirst(params);
    if (fromHandout) {
      yield* yieldLocal(fromHandout);
      return;
    }
  }

  const providers = await getProviderList(params);
  for (const provider of providers) {
    assertNotAborted(signal);
    try {
      const { stream } = await tryProvider(provider, params, true);
      let gotChunk = false;
      let full = '';
      for await (const chunk of stream) {
        assertNotAborted(signal);
        if (!chunk) continue;
        gotChunk = true;
        full += chunk;
        yield { type: 'chunk', text: chunk };
      }
      if (gotChunk && full.trim() && !isWeakLocalAnswer(full)) {
        yield { type: 'done', mode: isHandout ? 'handout' : 'ai', provider };
        return;
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      markProviderFailure(provider, error);
    }
  }

  assertNotAborted(signal);

  // استریم شکست → پاسخ کامل غیر استریم از AI
  const full = await askQuestion(params);
  if (full?.answer?.trim()) {
    yield* yieldLocal(full);
    return;
  }

  yield* yieldLocal({
    answer: 'الان نتوانستیم پاسخ کامل بسازیم. لطفاً چند ثانیه بعد دوباره «دریافت پاسخ» را بزنید.',
    mode: 'error',
    provider: 'none',
  });
}
