import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] max-w-md w-[calc(100%-2rem)] animate-slide-up"
      role="alert"
    >
      <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-elevated ${
        isSuccess
          ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200/80 dark:border-emerald-800/60'
          : 'bg-red-50/95 dark:bg-red-950/90 border-red-200/80 dark:border-red-800/60'
      }`}>
        <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
          isSuccess ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {isSuccess ? '✓' : '!'}
        </span>
        <p className={`text-sm font-semibold flex-1 pt-0.5 ${
          isSuccess ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'
        }`}>
          {message}
        </p>
        <button type="button" onClick={onClose} className="shrink-0 w-6 h-6 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 flex items-center justify-center">
          ×
        </button>
      </div>
    </div>
  );
}
