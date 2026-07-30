import { useEffect, useState } from 'react';
import { fetchStats } from '../../utils/api';

export default function StatsSection() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
  }, []);

  const items = [
    { value: stats?.totalQuestions ?? '—', label: 'سوال پاسخ‌داده‌شده' },
    { value: stats?.satisfaction != null ? `${stats.satisfaction}%` : '—', label: 'رضایت کاربران' },
    { value: stats?.totalFeedback ?? '—', label: 'بازخورد دریافتی' },
    { value: '۶+', label: 'درس پشتیبانی‌شده' },
  ];

  return (
    <section className="relative max-w-4xl mx-auto px-5 py-12 print-hide">
      <div className="glass-card-highlight p-8 sm:p-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {items.map((item) => (
            <div key={item.label}>
              <p className="text-3xl sm:text-4xl font-extrabold text-gradient">{item.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
