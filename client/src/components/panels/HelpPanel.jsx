const STEPS = [
  {
    num: '۱',
    title: 'عکس واضح بگیرید',
    desc: 'برگه را در نور کافی قرار دهید تا متن سوالات خوانا باشد.',
  },
  {
    num: '۲',
    title: 'عکس را آپلود کنید',
    desc: 'در تب «عکس برگه»، تصویر را انتخاب یا بکشید و رها کنید.',
  },
  {
    num: '۳',
    title: 'دریافت پاسخ',
    desc: 'دکمه «دریافت پاسخ» را بزنید و چند لحظه صبر کنید.',
  },
  {
    num: '۴',
    title: 'مشاهده نتیجه',
    desc: 'پاسخ تمام سوالات در پایین صفحه نمایش داده می‌شود.',
  },
];

const FAQ = [
  {
    q: 'آیا ثبت‌نام لازم است؟',
    a: 'خیر. همه می‌توانند بدون محدودیت سوال بپرسند. ثبت‌نام فقط برای ذخیره تاریخچه و پروفایل است.',
  },
  {
    q: 'عکس تار است، چه کنم؟',
    a: 'عکس واضح‌تر بگیرید یا از تب «نوشتن سوالات» متن سوالات را تایپ کنید.',
  },
  {
    q: 'پاسخ اشتباه است',
    a: 'کیفیت عکس و خوانایی متن برگه تأثیر زیادی دارد. دوباره با عکس بهتر امتحان کنید.',
  },
];

export default function HelpPanel() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">مراحل استفاده</h3>
        <div className="space-y-3">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
            >
              <span className="w-7 h-7 shrink-0 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center justify-center">
                {step.num}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{step.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">سوالات متداول</h3>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <div key={item.q} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.q}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
