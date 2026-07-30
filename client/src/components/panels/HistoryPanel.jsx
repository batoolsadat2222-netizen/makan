import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import MarkdownAnswer from '../MarkdownAnswer';

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function HistoryPanel() {
  const { history, removeFromHistory, clearAllHistory } = useApp();
  const [selected, setSelected] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      (item) =>
        item.question?.toLowerCase().includes(q) ||
        item.answer?.toLowerCase().includes(q) ||
        item.subjectLabel?.includes(q) ||
        item.gradeLabel?.includes(q),
    );
  }, [history, search]);

  if (selected) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="text-sm text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1 hover:underline"
        >
          ← بازگشت به لیست
        </button>
        <div className="text-xs text-slate-400">{formatDate(selected.date)}</div>
        {selected.thumbnail && (
          <img src={selected.thumbnail} alt="برگه" className="w-full max-h-40 object-contain rounded-xl border border-slate-200 dark:border-slate-700" />
        )}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">سوال / برگه</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {selected.question || 'برگه تصویری'}
          </p>
        </div>
        <div className="rounded-xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 p-4">
          <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-2">پاسخ</p>
          <MarkdownAnswer content={selected.answer} className="text-sm" />
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">هنوز برگه‌ای ثبت نشده</p>
        <p className="text-xs text-slate-400 mt-1">بعد از دریافت پاسخ، اینجا ذخیره می‌شود</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="جستجو در تاریخچه..."
        className="input-field text-sm py-2.5"
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">{filtered.length} مورد</p>
        {!confirmClear ? (
          <button type="button" onClick={() => setConfirmClear(true)} className="text-xs text-red-500 hover:text-red-600 font-medium">
            پاک کردن همه
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">مطمئنید؟</span>
            <button type="button" onClick={() => { clearAllHistory(); setConfirmClear(false); }} className="text-xs text-red-600 font-bold">
              بله
            </button>
            <button type="button" onClick={() => setConfirmClear(false)} className="text-xs text-slate-500">
              خیر
            </button>
          </div>
        )}
      </div>

      <ul className="space-y-2 max-h-[420px] overflow-y-auto">
        {filtered.map((item) => (
          <li
            key={item.id}
            className="group flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-brand-200 dark:hover:border-brand-800 transition-colors"
          >
            {item.thumbnail && (
              <img src={item.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-100 dark:border-slate-700" />
            )}
            <button type="button" onClick={() => setSelected(item)} className="flex-1 text-right min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {item.question || 'برگه تصویری'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.date)}</p>
              {(item.subjectLabel || item.gradeLabel) && (
                <p className="text-[10px] text-brand-500 mt-0.5">{[item.subjectLabel, item.gradeLabel].filter(Boolean).join(' · ')}</p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.answer}</p>
            </button>
            <button
              type="button"
              onClick={() => removeFromHistory(item.id)}
              className="shrink-0 w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
              aria-label="حذف"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
