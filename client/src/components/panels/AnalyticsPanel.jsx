import { useEffect, useState } from 'react';
import { fetchStats } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import { SUBJECTS } from '../../utils/subjects';

const subjectLabel = (id) => SUBJECTS.find((s) => s.id === id)?.label || id;

export default function AnalyticsPanel() {
  const { userStats } = useApp();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setError('آمار در دسترس نیست — سرور را بررسی کنید.'));
  }, []);

  if (error) {
    return <p className="text-sm text-slate-500 text-center py-6">{error}</p>;
  }

  if (!stats) {
    return <p className="text-sm text-slate-400 text-center py-6">در حال بارگذاری...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="کل سوالات" value={stats.totalQuestions} />
        <StatCard
          label="رضایت"
          value={stats.satisfaction != null ? `${stats.satisfaction}%` : '—'}
        />
      </div>

      {userStats && (
        <div className="rounded-xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 p-4">
          <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-1">سوالات شما</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{userStats.totalQuestions}</p>
        </div>
      )}

      {stats.topSubjects?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">پرکاربردترین دروس</p>
          <ul className="space-y-2">
            {stats.topSubjects.map(({ name, count }) => (
              <li key={name} className="flex justify-between text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                <span>{subjectLabel(name)}</span>
                <span className="font-bold text-brand-600">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
    </div>
  );
}
