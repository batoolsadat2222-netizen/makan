const TESTIMONIALS = [
  {
    name: 'سارا — پایه نهم',
    text: 'عکس برگه را می‌فرستم و تو چند ثانیه جواب می‌گیرم. خیلی راحت‌تر از جستجو در اینترنت.',
    stars: 5,
  },
  {
    name: 'امیر — پایه یازدهم',
    text: 'حالت «راهنمای حل» عالیه — فقط جواب نمی‌ده، یادم می‌ده چطور حل کنم.',
    stars: 5,
  },
  {
    name: 'نازنین — پایه هشتم',
    text: 'روی گوشیم نصب کردم. دیگه لازم نیست هر بار سایت را باز کنم.',
    stars: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="relative max-w-4xl mx-auto px-5 py-16 print-hide">
      <div className="text-center mb-10">
        <span className="section-label mb-4">نظر کاربران</span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          دانش‌آموزان چی می‌گن؟
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="glass-card p-6 flex flex-col">
            <div className="text-amber-400 text-sm mb-3" aria-label={`${t.stars} ستاره`}>
              {'★'.repeat(t.stars)}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
              «{t.text}»
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-4">{t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
