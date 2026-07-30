import MakanLogo from '../MakanLogo';
import { useApp } from '../../context/AppContext';

const LINKS = [
  { id: 'features', label: 'امکانات', href: '#features' },
  { id: 'faq', label: 'سوالات متداول', href: '#faq' },
  { id: 'start', label: 'شروع', href: '#start' },
];

export default function SiteFooter() {
  const { user, openPanel } = useApp();

  return (
    <footer className="border-t border-slate-200/50 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl print-hide">
      <div className="max-w-4xl mx-auto px-5 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <MakanLogo iconClass="w-8 h-8" showTagline={false} />
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              سامانه ماکان برای پاسخ‌دهی به سوالات درسی — فارسی، رایگان، و سریع.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">لینک‌ها</p>
            <ul className="space-y-2">
              {LINKS.map((l) => (
                <li key={l.id}>
                  <a href={l.href} className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">پشتیبانی</p>
            <ul className="space-y-2">
              <li>
                <button type="button" onClick={() => openPanel('help')} className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 transition-colors">
                  راهنما
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openPanel('contact')} className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 transition-colors">
                  تماس با ما
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openPanel('about')} className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 transition-colors">
                  درباره ماکان
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-400 text-xs">
            {user ? 'عضو فعال · سوالات نامحدود' : 'سوالات نامحدود · بدون نیاز به ثبت‌نام'}
          </p>
          <p className="text-slate-400 text-xs">© {new Date().getFullYear()} ماکان — تمامی حقوق محفوظ است</p>
        </div>
      </div>
    </footer>
  );
}
