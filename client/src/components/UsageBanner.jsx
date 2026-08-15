import { useApp } from '../context/AppContext';
import { GUEST_DAILY_LIMIT } from '../utils/plans';

export default function UsageBanner() {
  const { user, openPanel, guestRemaining, plan } = useApp();

  if (user) {
    return (
      <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-gradient-to-l from-emerald-50/90 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/40 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            ∞
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              سلام {user.name.split(' ')[0]}!
            </p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
              {plan.label} — سوالات نامحدود
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openPanel('profile')}
          className="btn-secondary text-xs py-2 px-3 shrink-0 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
        >
          پروفایل
        </button>
      </div>
    );
  }

  const remaining = Number.isFinite(guestRemaining) ? guestRemaining : GUEST_DAILY_LIMIT;
  const exhausted = remaining <= 0;

  return (
    <div className={`flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border backdrop-blur-sm ${
      exhausted
        ? 'bg-gradient-to-l from-amber-50/90 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200/60 dark:border-amber-800/40'
        : 'bg-gradient-to-l from-teal-50/90 to-sky-50/50 dark:from-teal-950/30 dark:to-sky-950/20 border-teal-200/60 dark:border-teal-800/40'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0 ${
          exhausted
            ? 'bg-gradient-to-br from-amber-400 to-orange-500'
            : 'bg-gradient-to-br from-teal-400 to-indigo-500'
        }`}>
          {exhausted ? '!' : remaining}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {exhausted ? 'سوال رایگان تمام شد' : `حالت مهمان — ${remaining} سوال رایگان مانده`}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {exhausted
              ? 'برای ادامه باید اشتراک بخرید یا ثبت‌نام کنید'
              : `هر روز ${GUEST_DAILY_LIMIT} سوال رایگان؛ بعد از آن نیاز به اشتراک دارید`}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => openPanel('register')}
        className="shrink-0 text-xs font-bold text-white px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5"
        style={{ background: 'linear-gradient(135deg, #0d9488, #4f46e5)', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}
      >
        {exhausted ? 'خرید اشتراک' : 'ثبت‌نام / اشتراک'}
      </button>
    </div>
  );
}
