/** لوگوی اختصاصی ماکان */

export function MakanIcon({ className = 'w-10 h-10' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="url(#makanBg)" />
      <path
        d="M13 28c0-7.2 4.5-12 11-12s11 4.8 11 12"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="13" cy="28" r="3.2" fill="white" />
      <circle cx="24" cy="37" r="3" fill="#fbbf24" />
      <circle cx="24" cy="37" r="1.2" fill="#fef3c7" />
      <defs>
        <linearGradient id="makanBg" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0d9488" />
          <stop offset="0.55" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#3730a3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function MakanLogo({ iconClass = 'w-11 h-11', showTagline = true, compact = false }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'min-w-0'}`}>
      <div className="relative shrink-0">
        <MakanIcon className={`${iconClass} drop-shadow-md`} />
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-makan-500/20 to-brand-500/20 blur-md -z-10" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="text-xl font-extrabold leading-none tracking-tight text-gradient">ماکان</p>
          {showTagline && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium tracking-wide">
              جایی برای پاسخ برگه
            </p>
          )}
        </div>
      )}
    </div>
  );
}
