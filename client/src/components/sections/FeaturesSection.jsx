import {
  IconUpload,
  IconBook,
  IconZap,
  IconDocument,
  IconTarget,
  IconPhone,
} from '../Icons';

const FEATURES = [
  {
    Icon: IconUpload,
    title: 'آپلود عکس برگه',
    desc: 'عکس برگه امتحان را بفرست — بعد انتخاب کن جزوه داری یا ماکان جواب بدهد.',
  },
  {
    Icon: IconBook,
    title: 'پاسخ طبق جزوه',
    desc: 'اگر معلم گفته طبق جزوه، بعد از آپلود برگه جزوه را هم بفرست.',
  },
  {
    Icon: IconZap,
    title: 'پاسخ لحظه‌ای',
    desc: 'جواب به‌صورت استریم و کلمه‌به‌کلمه نمایش داده می‌شود — بدون انتظار طولانی.',
  },
  {
    Icon: IconDocument,
    title: 'همه دروس',
    desc: 'ریاضی، علوم، فارسی، فیزیک و بیشتر — با انتخاب پایه تحصیلی.',
  },
  {
    Icon: IconTarget,
    title: 'دو حالت پاسخ',
    desc: '«پاسخ کامل» برای مرور سریع یا «راهنمای حل» برای یادگیری واقعی.',
  },
  {
    Icon: IconPhone,
    title: '۳ سوال رایگان',
    desc: 'مهمان هر روز ۳ سوال رایگان دارد؛ برای نامحدود، اشتراک بگیرید.',
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
          سامانه ماکان برای دانش‌آموزان — ۳ سوال رایگان، بعد اشتراک
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map(({ Icon, title, desc }) => (
          <div
            key={title}
            className="glass-card p-6 hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5 group"
          >
            <div className="w-11 h-11 mb-4 rounded-2xl bg-gradient-to-br from-makan-50 to-brand-50 dark:from-makan-950/60 dark:to-brand-950/40 border border-makan-100/80 dark:border-makan-900/40 flex items-center justify-center text-makan-600 dark:text-makan-400 group-hover:scale-105 transition-transform">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
