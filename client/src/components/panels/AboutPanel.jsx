import { MakanIcon } from '../MakanLogo';

const FEATURES = [
  { title: 'آپلود عکس برگه', desc: 'عکس برگه امتحان را مستقیم آپلود کنید' },
  { title: 'نوشتن متن', desc: 'اگر عکس ندارید، سوالات را تایپ کنید' },
  { title: 'پاسخ سریع', desc: 'پاسخ تمام سوالات در چند لحظه' },
  { title: 'رایگان', desc: 'بدون هزینه و بدون نیاز به ثبت‌نام' },
];

export default function AboutPanel() {
  return (
    <div className="space-y-6">
      <div className="text-center py-2">
        <MakanIcon className="w-16 h-16 mx-auto mb-3 drop-shadow-lg" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">ماکان</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">نسخه ۱.۰</p>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        «ماکان» سامانه‌ای برای دریافت پاسخ سوالات برگه امتحان است. کافیست عکس برگه را
        آپلود کنید یا متن سوالات را بنویسید تا پاسخ همه سوالات را دریافت کنید.
      </p>

      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">امکانات</h4>
        <div className="grid grid-cols-2 gap-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
            >
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{f.title}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">
        ساخته شده برای کمک به دانش‌آموزان در یادگیری بهتر
      </p>
    </div>
  );
}
