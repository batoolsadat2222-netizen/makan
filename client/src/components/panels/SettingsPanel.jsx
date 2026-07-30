import { useApp } from '../../context/AppContext';



function Toggle({ checked, onChange, label, desc }) {

  return (

    <label className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer">

      <div className="flex-1 min-w-0">

        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>

        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}

      </div>

      <button

        type="button"

        role="switch"

        aria-checked={checked}

        onClick={() => onChange(!checked)}

        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${

          checked ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'

        }`}

      >

        <span

          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${

            checked ? 'right-1' : 'right-6'

          }`}

        />

      </button>

    </label>

  );

}



const THEME_OPTIONS = [

  { id: 'system', label: 'سیستم' },

  { id: 'light', label: 'روشن' },

  { id: 'dark', label: 'تاریک' },

];



export default function SettingsPanel() {

  const { settings, updateSettings, user, logout, openPanel } = useApp();



  return (

    <div className="space-y-6">

      {user && (

        <div className="rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 p-4">

          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user.name}</p>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>

          <div className="flex gap-2 mt-3">

            <button type="button" onClick={() => openPanel('profile')} className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">

              مشاهده پروفایل

            </button>

            <span className="text-slate-300">|</span>

            <button type="button" onClick={logout} className="text-xs font-medium text-red-500 hover:underline">

              خروج

            </button>

          </div>

        </div>

      )}



      <div>

        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">برنامه</h3>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4">

          <Toggle

            label="ذخیره تاریخچه"

            desc="پاسخ‌های دریافتی در تاریخچه ذخیره شود"

            checked={settings.saveHistory}

            onChange={(v) => updateSettings({ saveHistory: v })}

          />

          <Toggle

            label="اعلان‌ها"

            desc="نمایش پیام‌های موفقیت و خطا"

            checked={settings.notifications}

            onChange={(v) => updateSettings({ notifications: v })}

          />

        </div>

      </div>



      <div>

        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">ظاهر</h3>

        <div className="flex rounded-xl bg-slate-100/70 dark:bg-slate-800/60 p-1 gap-1">

          {THEME_OPTIONS.map(({ id, label }) => (

            <button

              key={id}

              type="button"

              onClick={() => updateSettings({ themeMode: id })}

              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${

                (settings.themeMode || 'system') === id

                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'

                  : 'text-slate-500 hover:text-slate-700'

              }`}

            >

              {label}

            </button>

          ))}

        </div>

      </div>



      <div>

        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">زبان</h3>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">

          <span className="text-sm text-slate-800 dark:text-slate-200">زبان رابط کاربری</span>

          <span className="text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1 rounded-lg">

            فارسی

          </span>

        </div>

      </div>



      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">

        <button

          type="button"

          onClick={() => openPanel('admin')}

          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"

        >

          🔒 پنل مدیریت

        </button>

      </div>

    </div>

  );

}
