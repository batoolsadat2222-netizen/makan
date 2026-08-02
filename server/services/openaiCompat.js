import { getSystemPrompt, getImagePrompt, getTextPrompt } from './prompts.js';
import { loadAiConfig } from '../store/aiConfig.js';

/**
 * درگاه OpenAI-compatible:
 * - AvalAI / Hamiran (کلید ایرانی)
 * - یا پروکسی Gemini روی GitHub Actions (trycloudflare)
 */

let cachedRemoteBase = null;
let cachedRemoteAt = 0;

function clean(key) {
  return (key || '').trim().replace(/^["']|["']$/g, '');
}

async function resolveRemoteProxyBase() {
  const now = Date.now();
  if (cachedRemoteBase && now - cachedRemoteAt < 60_000) return cachedRemoteBase;

  const envBase = clean(process.env.GEMINI_PROXY_BASE_URL || process.env.OPENAI_COMPAT_BASE_URL);
  if (envBase && !/avalai|ham-iran|1xai/i.test(envBase)) {
    cachedRemoteBase = envBase.replace(/\/$/, '');
    cachedRemoteAt = now;
    return cachedRemoteBase;
  }

  const rawUrl = 'https://raw.githubusercontent.com/batoolsadat2222-netizen/makan/gemini-proxy-url/public-proxy/OPENAI_BASE_URL.txt';
  try {
    const res = await fetch(rawUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const text = (await res.text()).trim().replace(/\/$/, '');
      if (text.startsWith('https://')) {
        cachedRemoteBase = text;
        cachedRemoteAt = now;
        return cachedRemoteBase;
      }
    }
  } catch {
    /* ignore */
  }

  if (envBase) {
    cachedRemoteBase = envBase.replace(/\/$/, '');
    cachedRemoteAt = now;
    return cachedRemoteBase;
  }
  return '';
}

export async function getCompatConfig() {
  const fileCfg = loadAiConfig();
  const apiKey = clean(
    fileCfg.apiKey
    || process.env.OPENAI_COMPAT_API_KEY
    || process.env.AVALAI_API_KEY
    || process.env.HAMIRAN_API_KEY
    || process.env.GEMINI_API_KEY
  );

  let baseURL = clean(fileCfg.baseURL || '').replace(/\/$/, '');
  const remote = await resolveRemoteProxyBase();
  if (remote) baseURL = remote;
  if (!baseURL) baseURL = 'https://api.avalai.ir/v1';

  const model = clean(
    process.env.OPENAI_COMPAT_MODEL
    || fileCfg.model
    || 'gpt-4o-mini'
  );
  return { apiKey, baseURL, model, providerName: fileCfg.providerName || 'compat' };
}

export async function isCompatConfigured() {
  const apiKey = clean(
    loadAiConfig().apiKey
    || process.env.OPENAI_COMPAT_API_KEY
    || process.env.AVALAI_API_KEY
    || process.env.HAMIRAN_API_KEY
    || process.env.GEMINI_API_KEY
  );
  if (!apiKey || apiKey.length < 8) return false;

  // کلید ایرانی مستقیم
  if (loadAiConfig().apiKey || process.env.AVALAI_API_KEY || process.env.HAMIRAN_API_KEY || process.env.OPENAI_COMPAT_API_KEY) {
    return true;
  }

  // Gemini فقط وقتی پروکسی ریموت آماده باشد
  const remote = await resolveRemoteProxyBase();
  return Boolean(remote && /trycloudflare|workers\.dev|vercel|onrender|deno/i.test(remote));
}

function buildMessages(params) {
  const system = getSystemPrompt(params);
  const { text, imageBase64, imageMimeType } = params;

  if (imageBase64) {
    return [
      { role: 'system', content: system },
      {
        role: 'user',
        content: [
          { type: 'text', text: getImagePrompt(params, text) },
          {
            type: 'image_url',
            image_url: { url: `data:${imageMimeType || 'image/jpeg'};base64,${imageBase64}` },
          },
        ],
      },
    ];
  }

  return [
    { role: 'system', content: system },
    { role: 'user', content: getTextPrompt(params, (text || '').trim()) },
  ];
}

async function postChat({ messages, stream }) {
  const { apiKey, baseURL, model } = await getCompatConfig();
  if (!apiKey) throw new Error('کلید درگاه تنظیم نشده');
  if (!baseURL) throw new Error('آدرس درگاه تنظیم نشده');

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.15,
      max_tokens: 4096,
      stream: Boolean(stream),
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Compat HTTP ${response.status}: ${errText.slice(0, 220)}`);
  }
  return response;
}

export async function askCompat(params) {
  const messages = buildMessages(params);
  const response = await postChat({ messages, stream: false });
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  if (!content.trim()) throw new Error('Compat empty response');
  return content;
}

export async function* streamCompat(params) {
  const answer = await askCompat(params);
  const parts = answer.match(/\s+|\S+/g) || [answer];
  for (const part of parts) yield part;
}
