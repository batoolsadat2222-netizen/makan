const FEATURES = [
  {
    icon: '📷',
    title: 'آپلود عکس برگه',
    desc: 'عکس برگه امتحان را بفرست — ماکان سوالات را می‌خواند و پاسخ می‌دهد.',
  },
  {
    icon: '⚡',
    title: 'پاسخ لحظه‌ای',
    desc: 'جواب به‌صورت استریم و کلمه‌به‌کلمه نمایش داده می‌شود — بدون انتظار طولانی.',
  },
  {
    icon: '📚',
    title: 'همه دروس',
    desc: 'ریاضی، علوم، فارسی، فیزیک و بیشتر — با انتخاب پایه تحصیلی.',
  },
  {
    icon: '🎯',
    title: 'دو حالت پاسخ',
    desc: '«پاسخ کامل» برای مرور سریع یا «راهنمای حل» برای یادگیری واقعی.',
  },
  {
    icon: '📋',
    title: 'تاریخچه و جستجو',
    desc: 'همه برگه‌های قبلی ذخیره می‌شوند — با جستجو و thumbnail عکس.',
  },
  {
    icon: '📱',
    title: 'نصب روی موبایل',
    desc: 'به‌عنوان اپلیکیشن روی گوشی نصب کن — بدون نیاز به فروشگاه.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative max-w-4xl mx-auto px-5 py-16 print-hide">
      <div className="text-center mb-10">
        <span className="section-label mb-4">امکانات</span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          چرا <span className="text-gradient">ماکان</span>؟
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm max-w-md mx-auto">
          سامانه ماکان برای دانش‌آموزان — سریع، فارسی، و رایگان
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="glass-card p-6 hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5 group"
          >
            <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform inline-block">{f.icon}</span>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">{f.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
