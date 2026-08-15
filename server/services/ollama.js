import { getSystemPrompt, getImagePrompt, getTextPrompt } from './prompts.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b';
const KEEP_ALIVE = process.env.OLLAMA_KEEP_ALIVE || '0';
const VISION_PREFIXES = ['moondream', 'llava', 'bakllava', 'minicpm-v'];

const FAST_OPTIONS = {
  temperature: 0.15,
  num_predict: Number(process.env.OLLAMA_NUM_PREDICT || 1024),
  num_ctx: Number(process.env.OLLAMA_NUM_CTX || 4096),
  top_k: 20,
  top_p: 0.85,
};

let cachedModels = null;
let cachedModelsAt = 0;
let cachedVisionModel = null;

function isVisionName(name) {
  const lower = name.toLowerCase();
  return VISION_PREFIXES.some((p) => lower.startsWith(p));
}

async function getModels() {
  const now = Date.now();
  if (cachedModels && now - cachedModelsAt < 30_000) return cachedModels;
  const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(1500) });
  if (!response.ok) return [];
  const data = await response.json();
  cachedModels = data.models?.map((m) => m.name) || [];
  cachedModelsAt = now;
  return cachedModels;
}

async function getVisionModel() {
  if (cachedVisionModel) return cachedVisionModel;
  const models = await getModels();
  const preferred = ['moondream', 'llava-phi3', 'llava'];
  for (const name of preferred) {
    const found = models.find((m) => m.toLowerCase().startsWith(name));
    if (found) {
      cachedVisionModel = found;
      return cachedVisionModel;
    }
  }
  return null;
}

export async function isOllamaAvailable() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

export async function hasGoodPersianModel() {
  try {
    const models = await getModels();
    return models.some((m) =>
      /qwen2\.5:(0\.5b|1\.5b|3b|7b|14b)|qwen2\.5:latest|aya|gemma2:9b|llama3\.1:8b/i.test(m)
    );
  } catch {
    return false;
  }
}

export async function prewarmOllama() {
  // روی سیستم‌های کم‌حافظه prewarm باعث OOM می‌شود — فقط در صورت فعال‌سازی صریح
  if (process.env.OLLAMA_PREWARM !== 'true') return;
  if (!(await isOllamaAvailable())) return;

  const model = await resolveModel(false).catch(() => null);
  if (!model) return;

  try {
    await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: 'hi',
        stream: false,
        keep_alive: KEEP_ALIVE,
        options: { num_predict: 1, num_ctx: 256 },
      }),
    });
    console.log(`Ollama prewarmed: ${model}`);
  } catch (error) {
    console.warn('Ollama prewarm skipped:', error.message);
  }
}

function buildMessages(params) {
  const system = getSystemPrompt(params);
  const { text, imageBase64 } = params;

  if (imageBase64) {
    return {
      vision: true,
      messages: [
        {
          role: 'user',
          content: getImagePrompt(params, text),
          images: [imageBase64],
        },
      ],
    };
  }

  return {
    vision: false,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: getTextPrompt(params, text.trim()) },
    ],
  };
}

async function resolveModel(vision) {
  const models = await getModels();

  if (vision) {
    const visionModel = await getVisionModel();
    if (!visionModel) throw new Error('مدل vision نصب نیست. دستور: ollama pull moondream');
    return visionModel;
  }

  const preferredOrder = [
    OLLAMA_MODEL,
    'qwen2.5:3b',
    'qwen2.5:1.5b',
    'qwen2.5:0.5b',
    'llama3.2:1b',
    'tinyllama',
  ];

  for (const name of preferredOrder) {
    const base = name.split(':')[0];
    const found = models.find(
      (m) => m === name || m === base || m.startsWith(`${base}:`)
    );
    if (found && !isVisionName(found)) return found;
  }

  const textModel = models.find((m) => !isVisionName(m));
  if (textModel) return textModel;

  throw new Error(
    `مدل متن سبک نصب نیست. دستور پیشنهادی: ollama pull qwen2.5:0.5b`
  );
}

export async function askOllama(params) {
  const { vision, messages } = buildMessages(params);
  const model = await resolveModel(vision);

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      keep_alive: KEEP_ALIVE,
      options: FAST_OPTIONS,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Ollama HTTP ${response.status}${errText ? `: ${errText.slice(0, 160)}` : ''}`);
  }
  const data = await response.json();
  const content = data.message?.content || '';
  if (!content.trim()) throw new Error('Ollama پاسخ خالی برگرداند');
  return content;
}

export async function* streamOllama(params) {
  const { vision, messages } = buildMessages(params);
  const model = await resolveModel(vision);

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      keep_alive: KEEP_ALIVE,
      options: FAST_OPTIONS,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Ollama HTTP ${response.status}${errText ? `: ${errText.slice(0, 160)}` : ''}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        const text = json.message?.content;
        if (text) yield text;
      } catch {
        /* skip malformed */
      }
    }
  }
}
