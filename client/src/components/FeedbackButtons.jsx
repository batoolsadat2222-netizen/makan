import { useState } from 'react';
import { sendFeedback } from '../utils/api';

export default function FeedbackButtons({ subject, grade, onFeedback }) {
  const [sent, setSent] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handle(helpful) {
    if (sent !== null || loading) return;
    setLoading(true);
    try {
      await sendFeedback({ helpful, subject, grade });
      setSent(helpful);
      onFeedback?.(helpful);
    } finally {
      setLoading(false);
    }
  }

  if (sent !== null) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
        {sent ? 'ممنون از بازخورد مثبت شما 🙏' : 'ممنون — سعی می‌کنیم بهتر شویم'}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
      <span className="text-xs text-slate-500 dark:text-slate-400">این پاسخ مفید بود؟</span>
      <button
        type="button"
        disabled={loading}
        onClick={() => handle(true)}
        className="text-sm px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
      >
        👍 بله
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => handle(false)}
        className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        👎 نه
      </button>
    </div>
  );
}
