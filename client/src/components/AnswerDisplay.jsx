import { useState } from 'react';
import MarkdownAnswer from './MarkdownAnswer';
import FeedbackButtons from './FeedbackButtons';
import { IconCheck, IconCopy } from './Icons';
import { MakanIcon } from './MakanLogo';
import { useApp } from '../context/AppContext';

export default function AnswerDisplay({
  answer,
  meta = {},
  streaming = false,
  onNewQuestion,
}) {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('کپی کردن پاسخ ممکن نشد.', 'error');
    }
  }

  function handlePrint() {
    window.print();
  }

  const subjectLine = meta.subjectLabel && meta.gradeLabel
    ? `${meta.subjectLabel} · ${meta.gradeLabel}`
    : (meta.provider && meta.provider !== 'demo'
      ? `منبع: ${meta.provider}`
      : 'پاسخ درسی');

  return (
    <div id="answer-print-area" className="glass-card-highlight overflow-hidden shadow-glow print-answer">
      <div className="flex items-center justify-between gap-3 px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-l from-makan-50/40 via-white to-brand-50/30 dark:from-makan-950/20 dark:via-slate-900 dark:to-brand-950/20 print-hide">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
            {streaming ? (
              <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
            ) : (
              <IconCheck className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {streaming ? 'در حال نوشتن پاسخ...' : 'پاسخ آماده است'}
              <MakanIcon className="w-5 h-5 inline-block opacity-80 shrink-0" />
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {subjectLine}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 print-hide shrink-0">
          {!streaming && onNewQuestion && (
            <button
              type="button"
              onClick={onNewQuestion}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-makan-300 hover:text-makan-600 transition-all"
            >
              سوال جدید
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-300 transition-all"
            title="چاپ / PDF"
          >
            <span className="sm:hidden" aria-hidden="true">🖨️</span>
            <span className="hidden sm:inline">🖨️ چاپ</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={streaming}
            className={`flex items-center gap-2 text-xs font-semibold px-3 sm:px-4 py-2.5 rounded-xl border transition-all duration-200 ${
              copied
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600'
            }`}
          >
            <IconCopy />
            <span className="hidden sm:inline">{copied ? 'کپی شد ✓' : 'کپی'}</span>
          </button>
        </div>
      </div>
      <div className="px-6 sm:px-8 py-6 sm:py-7">
        <MarkdownAnswer content={answer} className="prose-answer" />
        {streaming && (
          <span className="inline-block w-2 h-4 bg-brand-500 animate-pulse mr-1 align-middle" />
        )}
      </div>
      {!streaming && answer && (
        <div className="px-6 sm:px-8 pb-6 print-hide space-y-4">
          {onNewQuestion && (
            <button
              type="button"
              onClick={onNewQuestion}
              className="sm:hidden w-full btn-primary text-sm py-3"
            >
              سوال جدید
            </button>
          )}
          <FeedbackButtons subject={meta.subject} grade={meta.grade} />
        </div>
      )}
    </div>
  );
}
