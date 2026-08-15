export default function OfflineBanner({ serverOnline, onRetry }) {
  if (serverOnline === null) {
    return (
      <div className="relative z-20 bg-slate-500/10 border-b border-slate-300/30 text-slate-600 dark:text-slate-400 text-sm text-center py-2.5 px-4 backdrop-blur-sm">
        <p className="inline-flex items-center justify-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
          در حال اتصال به سرور...
        </p>
      </div>
    );
  }

  if (serverOnline !== false) return null;

  return (
    <div className="relative z-20 bg-red-500/10 border-b border-red-500/20 text-red-700 dark:text-red-400 text-sm text-center py-3 px-4 backdrop-blur-sm">
      <p className="font-semibold">اتصال به سرور برقرار نیست</p>
      <p className="text-xs mt-1.5 opacity-90 max-w-md mx-auto leading-relaxed">
        لطفاً اتصال اینترنت را بررسی کنید و کمی بعد دوباره تلاش کنید.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-5 py-2 rounded-xl transition-colors shadow-sm"
        >
          تلاش مجدد
        </button>
      )}
    </div>
  );
}
