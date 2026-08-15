import { useState } from 'react';

const FAQS = [
  {
    q: 'ماکان چطور کار می‌کند؟',
    a: 'عکس برگه امتحان یا متن سوالات را آپلود می‌کنی. ماکان سوالات را می‌خواند و به هر کدام جداگانه، گام‌به‌گام و به فارسی پاسخ می‌دهد.',
  },
  {
    q: 'رایگان است؟',
    a: 'بله؛ به‌عنوان مهمان هر روز ۳ سوال رایگان دارید. برای سوالات بیشتر باید ثبت‌نام کنید و اشتراک بخرید.',
  },
  {
    q: 'اگر معلم گفته طبق جزوه جواب بدهیم؟',
    a: 'عکس برگه امتحان را بفرستید؛ بعد از شما می‌پرسیم جزوه هم می‌فرستید یا نه. اگر جزوه بفرستید، پاسخ فقط طبق همان جزوه است.',
  },
  {
    q: 'کدام دروس پشتیبانی می‌شوند؟',
    a: 'تمام دروس: ریاضی، فارسی، علوم، مطالعات اجتماعی، قرآن، نگارش، هدیه‌های آسمان، انگلیسی، عربی، فیزیک، شیمی، زیست، هنر، تفکر و بیشتر — از اول ابتدایی تا دوازدهم.',
  },
  {
    q: 'تفاوت «پاسخ کامل» و «راهنمای حل» چیست؟',
    a: 'پاسخ کامل: توضیح + جواب نهایی. راهنمای حل: فقط مراحل حل — خودت به جواب می‌رسی. برای یادگیری بهتر، راهنما را انتخاب کن.',
  },
  {
    q: 'اطلاعاتم امن است؟',
    a: 'عکس‌ها فقط برای پردازش استفاده می‌شوند و ذخیره نمی‌شوند. تاریخچه فقط در مرورگر خودت نگهداری می‌شود.',
  },
  {
    q: 'روی موبایل کار می‌کند؟',
    a: 'بله — سایت PWA است و می‌توانی آن را روی صفحه اصلی گوشی نصب کنی، مثل یک اپ واقعی.',
  },
];

function FAQItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-4 text-right"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{q}</span>
        <span className={`shrink-0 w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && (
        <p className="text-sm text-slate-500 dark:text-slate-400 pb-4 leading-relaxed animate-fade-in">
          {a}
        </p>
      )}
    </div>
  );
}

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section id="faq" className="relative max-w-4xl mx-auto px-5 py-16 print-hide">
      <div className="text-center mb-10">
        <span className="section-label mb-4">سوالات متداول</span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          سوالی داری؟
        </h2>
      </div>
      <div className="glass-card px-6 py-2">
        {FAQS.map((faq, i) => (
          <FAQItem
            key={faq.q}
            q={faq.q}
            a={faq.a}
            open={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
          />
        ))}
      </div>
    </section>
  );
}
