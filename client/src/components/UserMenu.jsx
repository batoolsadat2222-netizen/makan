import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import UserPanels from './panels/UserPanels';

const MENU_ITEMS = [
  { id: 'login', label: 'ورود', desc: 'ورود به حساب کاربری', section: 'account', guestOnly: true },
  { id: 'register', label: 'ثبت‌نام', desc: 'ذخیره تاریخچه در حساب', section: 'account', guestOnly: true },
  { id: 'profile', label: 'پروفایل', desc: 'اطلاعات حساب شما', section: 'account', authOnly: true },
  { id: 'history', label: 'تاریخچه', desc: 'برگه‌های قبلی', section: 'main' },
  { id: 'analytics', label: 'آمار', desc: 'آمار استفاده', section: 'main' },
  { id: 'settings', label: 'تنظیمات', desc: 'تنظیمات حساب و برنامه', section: 'main' },
  { id: 'help', label: 'راهنما', desc: 'نحوه استفاده از سایت', section: 'main' },
  { id: 'about', label: 'درباره ما', desc: 'معرفی سامانه', section: 'info' },
  { id: 'contact', label: 'تماس با ما', desc: 'پشتیبانی و ارتباط', section: 'info' },
];

function MenuIcon({ name, className = 'w-5 h-5' }) {
  const icons = {
    login: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    ),
    register: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    ),
    profile: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    ),
    history: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    analytics: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    ),
    settings: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    ),
    help: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    ),
    about: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    ),
    contact: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    ),
    user: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    ),
  };

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {icons[name]}
    </svg>
  );
}

function filterItems(items, user) {
  return items.filter((item) => {
    if (item.guestOnly && user) return false;
    if (item.authOnly && !user) return false;
    return true;
  });
}

export default function UserMenu() {
  const { user, openPanel } = useApp();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleItemClick(id) {
    openPanel(id);
    setOpen(false);
  }

  const accountItems = filterItems(MENU_ITEMS.filter((i) => i.section === 'account'), user);
  const mainItems = filterItems(MENU_ITEMS.filter((i) => i.section === 'main'), user);
  const infoItems = filterItems(MENU_ITEMS.filter((i) => i.section === 'info'), user);

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 text-white ${
            open
              ? 'shadow-glow scale-105'
              : 'hover:-translate-y-0.5 shadow-btn'
          }`}
          style={{ background: open ? 'linear-gradient(135deg, #4338ca, #0d9488)' : 'linear-gradient(135deg, #0d9488, #4f46e5)' }}
          aria-label="منوی کاربری"
          aria-expanded={open}
        >
          {user ? (
            <span className="text-sm font-bold">{user.name?.charAt(0) || '?'}</span>
          ) : (
            <MenuIcon name="user" className="w-5 h-5" />
          )}
        </button>

        {open && (
          <div className="absolute top-full right-0 mt-3 w-80 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-elevated backdrop-blur-xl overflow-hidden animate-slide-up z-50">
            <div className="px-5 py-4 bg-gradient-to-l from-makan-50/50 via-white to-brand-50/30 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
              {user ? (
                <>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{user.email}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">منوی کاربری</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">گزینه مورد نظر را انتخاب کنید</p>
                </>
              )}
            </div>

            <div className="p-2">
              {accountItems.length > 0 && (
                <>
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">حساب کاربری</p>
                  {accountItems.map((item) => (
                    <MenuButton key={item.id} item={item} onClick={handleItemClick} variant="brand" />
                  ))}
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                </>
              )}

              {mainItems.map((item) => (
                <MenuButton key={item.id} item={item} onClick={handleItemClick} variant="default" />
              ))}

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              {infoItems.map((item) => (
                <MenuButton key={item.id} item={item} onClick={handleItemClick} variant="default" />
              ))}
            </div>
          </div>
        )}
      </div>

      <UserPanels />
    </>
  );
}

function MenuButton({ item, onClick, variant }) {
  const isBrand = variant === 'brand';
  return (
    <button
      type="button"
      onClick={() => onClick(item.id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-colors group ${
        isBrand ? 'hover:bg-brand-50 dark:hover:bg-brand-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <span
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
          isBrand
            ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
        }`}
      >
        <MenuIcon name={item.id} className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
        <p className="text-xs text-slate-400 truncate">{item.desc}</p>
      </div>
    </button>
  );
}
