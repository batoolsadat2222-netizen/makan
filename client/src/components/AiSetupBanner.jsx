import { useEffect, useState } from 'react';
import { API } from '../config';

const PRESET_FALLBACK = [
  {
    id: 'avalai',
    label: 'AvalAI (ChatGPT)',
    baseURL: 'https://api.avalai.ir/v1',
    model: 'gpt-4o-mini',
    signup: 'https://avalai.ir',
    hint: 'ثبت‌نام رایگان — اعتبار هدیه دارد',
  },
  {
    id: 'hamiran',
    label: 'Hamiran',
    baseURL: 'https://ham-iran.ir/v1',
    model: 'gemini-3.1-flash-lite-preview',
    signup: 'https://ham-iran.ir',
    hint: 'ثبت‌نام با موبایل — پلن رایگان',
  },
];

export default function AiSetupBanner({ cloudReady, onConfigured }) {
  const [open, setOpen] = useState(false);
  const [presets, setPresets] = useState(PRESET_FALLBACK);
  const [presetId, setPresetId] = useState('avalai');
  const [apiKey, setApiKey] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    fetch(API.setupStatus)
      .then((r) => r.json())
      .then((data) => {
        if (data.presets?.length) setPresets(data.presets);
        if (data.configured) onConfigured?.(true);
      })
      .catch(() => {});
  }, [onConfigured]);

  // روی سایت منتشرشده این بنر را به دانش‌آموز نشان نده
  if (import.meta.env.PROD || cloudReady) return null;

  const preset = presets.find((p) => p.id === presetId) || presets[0];

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setOk('');
    setLoading(true);
    try {
      const res = await fetch(API.setupAiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          apiKey: apiKey.trim(),
          baseURL: preset.baseURL,
          model: preset.model,
          providerName: preset.id,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'ذخیره نشد');
      setOk('کلید ذخیره شد — حالا جواب‌ها با هوش مصنوعی واقعی داده می‌شود.');
      setApiKey('');
      setPassword('');
      onConfigured?.(true);
      setOpen(false);
    } catch (err) {
      setError(err.message || 'خطا در ذخیره کلید');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-20 border-b border-amber-300/40 bg-amber-50/95 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100">
      <div className="max-w-4xl mx-auto px-5 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="text-sm leading-6">
            <strong className="font-bold">برای جواب درست مثل ChatGPT:</strong>
            {' '}
            یک کلید رایگان از درگاه ایرانی بگیر و اینجا وارد کن
            (Gemini/OpenAI مستقیم از ایران مسدود است).
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2"
          >
            {open ? 'بستن' : 'فعال‌سازی هوش مصنوعی'}
          </button>
        </div>

        {open && (
          <form onSubmit={handleSave} className="mt-4 space-y-3 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-amber-200/60 dark:border-amber-800/40 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetId(p.id)}
                  className={`text-right rounded-xl border px-3 py-2 text-xs ${
                    presetId === p.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-800 dark:text-white">{p.label}</div>
                  <div className="text-slate-500 mt-1">{p.hint}</div>
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-6">
              ۱) برو به{' '}
              <a className="text-amber-700 dark:text-amber-300 underline font-semibold" href={preset.signup} target="_blank" rel="noreferrer">
                {preset.signup.replace('https://', '')}
              </a>
              {' '}و ثبت‌نام کن
              <br />
              ۲) از داشبورد یک API Key بساز و اینجا بچسبان
              <br />
              ۳) اگر برای پنل مدیر رمز گذاشتی، همان را وارد کن (وگرنه خالی بگذار)
            </p>

            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="کلید API (مثلاً از AvalAI)"
              className="input-field text-sm"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز مدیر (اختیاری اگر ست نشده)"
              className="input-field text-sm"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}
            {ok && <p className="text-sm text-emerald-600">{ok}</p>}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'در حال ذخیره...' : 'ذخیره و فعال‌سازی'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
