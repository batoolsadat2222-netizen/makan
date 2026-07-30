import { useEffect } from 'react';

const PANELS = {
  login: { title: 'ورود', subtitle: 'به حساب کاربری خود وارد شوید' },
  register: { title: 'ثبت‌نام', subtitle: 'حساب کاربری جدید بسازید' },
  history: { title: 'تاریخچه', subtitle: 'برگه‌های قبلی شما' },
  analytics: { title: 'آمار', subtitle: 'آمار استفاده از سایت' },
  settings: { title: 'تنظیمات', subtitle: 'تنظیمات برنامه و حساب' },
  help: { title: 'راهنما', subtitle: 'نحوه استفاده از سایت' },
  about: { title: 'درباره ما', subtitle: 'معرفی ماکان' },
  contact: { title: 'تماس با ما', subtitle: 'پشتیبانی و ارسال پیام' },
  profile: { title: 'پروفایل', subtitle: 'اطلاعات حساب کاربری' },
  admin: { title: 'پنل مدیریت', subtitle: 'پیام‌ها و آمار سایت' },
};

export default function PanelShell({ panelId, onClose, children }) {
  const meta = PANELS[panelId] || { title: '', subtitle: '' };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} aria-hidden />
      <div className="relative mr-auto w-full max-w-md h-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl flex flex-col animate-slide-up overflow-hidden border-l border-slate-200/50 dark:border-slate-800/50">
        <div className="shrink-0 px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors shrink-0"
            aria-label="بستن"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l6-6M15 15L9 9" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{meta.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{meta.subtitle}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
