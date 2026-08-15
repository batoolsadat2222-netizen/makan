import { useState, useEffect } from 'react';
import QuestionForm from './components/QuestionForm';
import AnswerDisplay from './components/AnswerDisplay';
import UserMenu from './components/UserMenu';
import UsageBanner from './components/UsageBanner';
import Toast from './components/Toast';
import MakanLogo, { MakanIcon } from './components/MakanLogo';
import { AppProvider, useApp } from './context/AppContext';
import { IconDocument } from './components/Icons';
import FeaturesSection from './components/sections/FeaturesSection';
import FAQSection from './components/sections/FAQSection';
import StatsSection from './components/sections/StatsSection';
import TestimonialsSection from './components/sections/TestimonialsSection';
import SiteFooter from './components/sections/SiteFooter';
import ScrollToTop from './components/ScrollToTop';
import OfflineBanner from './components/OfflineBanner';
import AiSetupBanner from './components/AiSetupBanner';
import { API } from './config';

const NAV = [
  { href: '#start', label: 'ارسال برگه' },
  { href: '#features', label: 'امکانات' },
  { href: '#faq', label: 'سوالات' },
];

function AppContent() {
  const { addToHistory, toast, hideToast } = useApp();
  const [answer, setAnswer] = useState(null);
  const [answerMeta, setAnswerMeta] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [serverMode, setServerMode] = useState(null);
  const [serverOnline, setServerOnline] = useState(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [healthKey, setHealthKey] = useState(0);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let fails = 0;

    function checkHealth() {
      if (typeof document !== 'undefined' && document.hidden) return;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      fetch(API.health, { signal: controller.signal, cache: 'no-store' })
        .then((res) => {
          clearTimeout(timeout);
          if (!res.ok) throw new Error('offline');
          return res.json();
        })
        .then((data) => {
          if (cancelled) return;
          fails = 0;
          setServerMode(data.mode);
          setServerOnline(true);
          setCloudReady(Boolean(data.cloudReady));
        })
        .catch(() => {
          clearTimeout(timeout);
          if (cancelled) return;
          fails += 1;
          if (fails >= 3) {
            setServerMode(null);
            setServerOnline(false);
          }
        });
    }

    checkHealth();
    const interval = setInterval(checkHealth, 20000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [healthKey]);

  function handleAnswer(ans, mode, questionText, meta = {}) {
    setAnswer(ans);
    setAnswerMeta(meta);
    setStreaming(false);
    setError(null);
    addToHistory({
      question: questionText || 'برگه تصویری',
      answer: ans,
      mode: mode || 'unknown',
      subject: meta.subject,
      grade: meta.grade,
      subjectLabel: meta.subjectLabel,
      gradeLabel: meta.gradeLabel,
      thumbnail: meta.thumbnail,
    });
  }

  function handleStreamUpdate(partial, meta) {
    if (partial === null) {
      setAnswer(null);
      setStreaming(false);
      return;
    }
    setAnswer(partial);
    setAnswerMeta(meta || null);
    setStreaming(true);
  }

  function handleNewQuestion() {
    setAnswer(null);
    setAnswerMeta(null);
    setError(null);
    setStreaming(false);
    setLoading(false);
    setFormKey((k) => k + 1);
    requestAnimationFrame(() => {
      document.getElementById('start')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return (
    <div className="min-h-screen bg-mesh relative overflow-x-hidden">
      <div className="hero-glow top-0 left-1/2 -translate-x-1/2 -translate-y-1/3" />

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <OfflineBanner serverOnline={serverOnline} onRetry={() => setHealthKey((k) => k + 1)} />

      <AiSetupBanner
        cloudReady={cloudReady}
        onConfigured={() => {
          setCloudReady(true);
          setServerMode('ai');
          setHealthKey((k) => k + 1);
        }}
      />

      {serverMode === 'demo' && serverOnline && cloudReady === false && (
        <div className="relative z-20 bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-300 text-sm text-center py-2 px-4 backdrop-blur-sm">
          هنوز کلید هوش مصنوعی ست نشده — از نوار بالا فعال کن
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-slate-200/50 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl print-hide">
        <div className="max-w-4xl mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <UserMenu />
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <MakanLogo />
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {n.label}
              </a>
            ))}
          </nav>

          {serverMode === 'ai' && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 px-3.5 py-2 rounded-full backdrop-blur-sm shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              آنلاین
            </div>
          )}
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-5 pt-6 pb-8 space-y-6">
        <div id="start" className="scroll-mt-24 space-y-5 animate-fade-in">
          <div className="text-center print-hide">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              <span className="text-gradient">ماکان</span>
              {' '}
              — برگه بفرست، پاسخ بگیر
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base">
              عکس برگه یا متن سوالات را همین‌جا بفرست
            </p>
          </div>

          <UsageBanner />

          <div className="glass-card-highlight p-6 sm:p-8 shadow-glow animate-slide-up print-hide">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-makan-500 to-brand-600 flex items-center justify-center shadow-btn">
                <IconDocument className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">ارسال برگه امتحان</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">عکس برگه یا نوشتن سوالات</p>
              </div>
            </div>
            <QuestionForm
              key={formKey}
              serverOnline={serverOnline}
              onAnswer={handleAnswer}
              onError={setError}
              onLoading={setLoading}
              onStreamUpdate={handleStreamUpdate}
            />
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50/90 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 text-red-700 dark:text-red-400 rounded-2xl p-4 text-sm animate-fade-in backdrop-blur-sm print-hide">
              <span className="shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 flex items-center justify-center text-xs font-bold">!</span>
              <div className="flex-1">
                <p className="leading-relaxed">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setHealthKey((k) => k + 1);
                  }}
                  className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
                >
                  تلاش مجدد
                </button>
              </div>
            </div>
          )}

          {loading && !answer && (
            <div id="answer-area" className="glass-card p-12 text-center animate-fade-in print-hide scroll-mt-24" role="status" aria-live="polite">
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border-[3px] border-slate-100 dark:border-slate-800" />
                <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-makan-500 border-r-brand-500 animate-spin" />
                <MakanIcon className="absolute inset-2 w-auto h-auto animate-float opacity-80" />
              </div>
              <p className="text-slate-800 dark:text-slate-200 font-bold">در حال بررسی برگه</p>
              <p className="text-slate-400 text-sm mt-1.5">ماکان در حال خواندن سوالات است...</p>
            </div>
          )}

          {answer && (
            <div id="answer-area" className="animate-slide-up scroll-mt-24" aria-live="polite" aria-atomic="true">
              <AnswerDisplay
                answer={answer}
                meta={answerMeta || {}}
                streaming={streaming && loading}
                onNewQuestion={handleNewQuestion}
              />
            </div>
          )}
        </div>
      </main>

      <StatsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <FAQSection />
      <SiteFooter />
      <ScrollToTop />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
