import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, '..', 'data', 'ai-config.json');

const DEFAULTS = {
  baseURL: 'https://api.avalai.ir/v1',
  model: 'gpt-4o-mini',
  providerName: 'avalai',
};

export function loadAiConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return { ...DEFAULTS, apiKey: '' };
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return {
      ...DEFAULTS,
      ...raw,
      apiKey: String(raw.apiKey || '').trim(),
      baseURL: String(raw.baseURL || DEFAULTS.baseURL).trim().replace(/\/$/, ''),
      model: String(raw.model || DEFAULTS.model).trim(),
      providerName: String(raw.providerName || DEFAULTS.providerName).trim(),
    };
  } catch {
    return { ...DEFAULTS, apiKey: '' };
  }
}

export function saveAiConfig(partial = {}) {
  const current = loadAiConfig();
  const next = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  next.apiKey = String(next.apiKey || '').trim();
  next.baseURL = String(next.baseURL || DEFAULTS.baseURL).trim().replace(/\/$/, '');
  next.model = String(next.model || DEFAULTS.model).trim();
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf8');
  return {
    configured: Boolean(next.apiKey),
    baseURL: next.baseURL,
    model: next.model,
    providerName: next.providerName,
    updatedAt: next.updatedAt,
  };
}

export function getAiStatus() {
  const cfg = loadAiConfig();
  const envKey = (
    process.env.OPENAI_COMPAT_API_KEY
    || process.env.AVALAI_API_KEY
    || process.env.HAMIRAN_API_KEY
    || ''
  ).trim();
  const configured = Boolean(cfg.apiKey || envKey);
  return {
    configured,
    baseURL: cfg.baseURL || process.env.OPENAI_COMPAT_BASE_URL || DEFAULTS.baseURL,
    model: cfg.model || process.env.OPENAI_COMPAT_MODEL || DEFAULTS.model,
    providerName: cfg.providerName || 'avalai',
    source: cfg.apiKey ? 'file' : (envKey ? 'env' : 'none'),
  };
}

export const AI_PRESETS = [
  {
    id: 'avalai',
    label: 'AvalAI (ChatGPT)',
    baseURL: 'https://api.avalai.ir/v1',
    model: 'gpt-4o-mini',
    signup: 'https://avalai.ir',
    hint: 'ثبت‌نام رایگان با موبایل — اعتبار هدیه دارد',
  },
  {
    id: 'hamiran',
    label: 'Hamiran (رایگان)',
    baseURL: 'https://ham-iran.ir/v1',
    model: 'gemini-3.1-flash-lite-preview',
    signup: 'https://ham-iran.ir',
    hint: 'ثبت‌نام با موبایل — پلن رایگان',
  },
  {
    id: '1xai',
    label: '1xAi',
    baseURL: 'https://1xai.ir/v1',
    model: 'gpt-4o-mini',
    signup: 'https://1xai.ir',
    hint: 'درگاه ایرانی سازگار با OpenAI',
  },
];
