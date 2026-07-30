import { useApp } from '../../context/AppContext';
import { MEMBER_BENEFITS } from '../../utils/plans';

export default function ProfilePanel() {
  const { user, history, userStats, logout, openPanel, plan } = useApp();

  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">برای مشاهده پروفایل وارد شوید.</p>
        <button type="button" onClick={() => openPanel('login')} className="btn-primary text-sm py-3 max-w-xs mx-auto">
          ورود به حساب
        </button>
      </div>
    );
  }

  const initial = user.name?.charAt(0) || user.email.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-brand-600 text-white text-3xl font-bold flex items-center justify-center shadow-lg shadow-brand-600/30">
          {initial}
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{user.name}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-center">
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{userStats?.totalQuestions || 0}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">سوال پاسخ‌داده</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-center">
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{history.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">برگه ذخیره‌شده</p>
        </div>
      </div>

      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4">
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">عضویت فعال — {plan.label}</p>
        <ul className="space-y-1">
          {MEMBER_BENEFITS.map((b) => (
            <li key={b} className="text-xs text-emerald-700/80 dark:text-emerald-400/80 flex items-center gap-1.5">
              <span>✓</span> {b}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => openPanel('history')}
          className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-right"
        >
          مشاهده تاریخچه
        </button>
        <button
          type="button"
          onClick={() => openPanel('settings')}
          className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-right"
        >
          تنظیمات حساب
        </button>
        <button
          type="button"
          onClick={logout}
          className="w-full py-3 px-4 rounded-xl border border-red-200 dark:border-red-900 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-right"
        >
          خروج از حساب
        </button>
      </div>
    </div>
  );
}
