import { askDemo } from './demo.js';
import { trySolveMath } from './localSolver.js';
import { askLocalTutor } from './localTutor.js';
import { askGroq, streamGroq, isValidGroqKey } from './groq.js';
import { askGemini, streamGemini, isValidGeminiKey } from './gemini.js';
import { askOllama, streamOllama, isOllamaAvailable } from './ollama.js';

let cachedOllamaAvailable = null;
let cachedOllamaAt = 0;
let ollamaBlockedUntil = 0;
let groqBlocked = false;
let geminiBlockedUntil = 0;

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

async function checkOllamaVision() {
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
  if (shouldTryGemini()) providers.push('gemini');
  if (shouldTryGroq()) providers.push('groq');
  // moondream برای برگه فارسی اغلب ناقص/غلط است — فقط وقتی OCR متن نداده
  if (params.imageBase64 && !params.usedOcr && (await checkOllamaVision())) {
    providers.push('ollama');
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

async function tryProvider(provider, params, stream = false) {
  const normalized = normalizeParams(params);

  if (stream) {
    switch (provider) {
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
  console.error(`${provider} failed:`, error.message);
  if (provider === 'gemini' && /403|blocked|fetch failed|timeout|Deadline|UNAVAILABLE|Forbidden/i.test(error.message || '')) {
    geminiBlockedUntil = Date.now() + 10 * 60_000;
    console.error('Gemini موقتاً غیرفعال شد (مسدود یا قطع شبکه)');
  }
  if (provider === 'groq' && (error.message?.includes('403') || error.status === 403)) {
    groqBlocked = true;
    console.error('Groq مسدود — از این به بعد رد می‌شود');
  }
  if (provider === 'ollama' && /500|out of memory|OOM|allocate/i.test(error.message || '')) {
    ollamaBlockedUntil = Date.now() + 5 * 60_000;
    cachedOllamaAvailable = false;
    console.error('Ollama موقتاً غیرفعال شد (کمبود حافظه یا خطای سرور)');
  }
}

function localFallback(params) {
  if (params.usedOcr || params.imageBase64) return null;

  const solved = trySolveMath(params.text || '');
  if (solved) {
    return { answer: solved.answer, mode: 'ai', provider: 'local' };
  }

  const tutor = askLocalTutor({
    text: params.text || '',
    subject: params.subject,
    grade: params.grade,
    usedOcr: false,
  });
  // دانش محلی درست را قبل از AI مسدود برگردان تا جواب غلط/تأخیر نیاید
  if (tutor) {
    return { answer: tutor.answer, mode: 'ai', provider: tutor.provider };
  }
  return null;
}

function offlineFallback(params) {
  // برگه عکس/OCR: همه سوالات را یکی‌یکی جواب بده
  if (params.usedOcr || params.imageBase64) {
    const sheet = askLocalTutor({
      text: params.text || '',
      subject: params.subject,
      grade: params.grade,
      usedOcr: true,
    });
    if (sheet) {
      return { answer: sheet.answer, mode: 'ai', provider: sheet.provider || 'local-exam' };
    }
  }

  const tutor = askLocalTutor({
    text: params.text || '',
    subject: params.subject,
    grade: params.grade,
    usedOcr: false,
  });
  if (tutor) {
    return { answer: tutor.answer, mode: 'ai', provider: tutor.provider };
  }
  return null;
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
  yield { type: 'done', mode: result.mode || 'ai', provider: result.provider };
}

export async function askQuestion(params) {
  const local = localFallback(params);
  if (local && !params.imageBase64 && !params.usedOcr) {
    return local;
  }

  const providers = await getProviderList(params);

  for (const provider of providers) {
    try {
      const { answer } = await tryProvider(provider, params, false);
      // اگر مدل فقط یک پاسخ کوتاه کلی داد ولی OCR چند سوال دارد، پاسخ محلی چندسوالی را ترجیح بده
      if (params.usedOcr && looksIncompleteForExam(answer, params.text)) {
        const sheet = offlineFallback(params);
        if (sheet && sheet.provider === 'local-exam') return sheet;
      }
      return { answer, mode: 'ai', provider };
    } catch (error) {
      markProviderFailure(provider, error);
    }
  }

  const offline = offlineFallback(params);
  if (offline) return offline;

  const answer = await askDemo(params);
  return {
    answer,
    mode: params.usedOcr ? 'ai' : 'demo',
    provider: params.usedOcr ? 'ocr-local' : 'demo',
  };
}

function looksIncompleteForExam(answer, ocrText) {
  const questions = (ocrText || '').match(/(?:^|\n)\s*(?:\d{1,2}|[۰-۹]{1,2})\s*[.)\-–:،]/gm) || [];
  if (questions.length < 2) return false;
  const answeredHeaders = (answer || '').match(/###\s*سوال|سوال\s*[۰-۹\d]+/g) || [];
  return answeredHeaders.length < Math.min(questions.length, 2);
}

export async function* streamQuestion(params) {
  const local = localFallback(params);
  if (local && !params.imageBase64 && !params.usedOcr) {
    yield* yieldLocal(local);
    return;
  }

  const providers = await getProviderList(params);

  for (const provider of providers) {
    try {
      const { stream } = await tryProvider(provider, params, true);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const answer = chunks.join('');
      if (params.usedOcr && looksIncompleteForExam(answer, params.text)) {
        const sheet = offlineFallback(params);
        if (sheet && sheet.provider === 'local-exam') {
          yield* yieldLocal(sheet);
          return;
        }
      }
      for (const chunk of chunks) {
        yield { type: 'chunk', text: chunk };
      }
      yield { type: 'done', mode: 'ai', provider };
      return;
    } catch (error) {
      markProviderFailure(provider, error);
    }
  }

  const offline = offlineFallback(params);
  if (offline) {
    yield* yieldLocal(offline);
    return;
  }

  const answer = await askDemo(params);
  for await (const chunk of streamDemo(answer)) {
    yield { type: 'chunk', text: chunk };
  }
  yield {
    type: 'done',
    mode: params.usedOcr ? 'ai' : 'demo',
    provider: params.usedOcr ? 'ocr-local' : 'demo',
  };
}
