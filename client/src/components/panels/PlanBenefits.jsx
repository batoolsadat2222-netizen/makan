import { MEMBER_BENEFITS } from '../../utils/plans';

export default function PlanBenefits({ title = 'امکانات اعضا' }) {
  return (
    <div className="rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 p-4">
      <p className="text-xs font-bold text-brand-700 dark:text-brand-400 mb-2">{title}</p>
      <ul className="space-y-1.5">
        {MEMBER_BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0 text-[10px]">
              ✓
            </span>
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  );
}
