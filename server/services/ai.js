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

  if (shouldTryCompatSyncGate() && (await isCompatConfigured())) {
    providers.push('compat');
  }

  // Gemini مستقیم از ایران معمولاً 403 — فقط اگر صریح فعال باشد
  if (!envFlag('GEMINI_DISABLED') && shouldTryGemini()) providers.push('gemini');
  if (shouldTryGroq()) providers.push('groq');

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

function localFallback(params) {
  const tutor = askLocalTutor({
    text: params.text || '',
    subject: params.subject,
    grade: params.grade,
    usedOcr: Boolean(params.usedOcr || params.imageBase64),
    handoutText: params.handoutText || '',
  });
  if (tutor?.answer?.trim()) {
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

export async function askQuestion(params) {
  // ریاضی خالص: سریع و دقیق
  const math = mathOnlyFallback(params);
  if (math) return math;

  // اول AI واقعی (AvalAI/Ollama) — بعد دانش محلی
  const providers = await getProviderList(params);
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

  const offline = offlineFallback(params);
  if (offline) return offline;

  const answer = await askDemo(params);
  return { answer, mode: 'demo', provider: 'demo' };
}

export async function* streamQuestion(params, { signal } = {}) {
  assertNotAborted(signal);

  const math = mathOnlyFallback(params);
  if (math) {
    yield* yieldLocal(math);
    return;
  }

  const providers = await getProviderList(params);
  for (const provider of providers) {
    assertNotAborted(signal);
    try {
      const { stream } = await tryProvider(provider, params, true);
      let gotChunk = false;
      for await (const chunk of stream) {
        assertNotAborted(signal);
        if (!chunk) continue;
        gotChunk = true;
        yield { type: 'chunk', text: chunk };
      }
      if (gotChunk) {
        yield { type: 'done', mode: 'ai', provider };
        return;
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      markProviderFailure(provider, error);
    }
  }

  assertNotAborted(signal);

  const offline = offlineFallback(params);
  if (offline) {
    yield* yieldLocal(offline);
    return;
  }

  const answer = await askDemo(params);
  for await (const chunk of streamDemo(answer)) {
    assertNotAborted(signal);
    yield { type: 'chunk', text: chunk };
  }
  yield { type: 'done', mode: 'demo', provider: 'demo' };
}
