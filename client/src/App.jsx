import { useState, useEffect } from 'react';

import QuestionForm from './components/QuestionForm';

import AnswerDisplay from './components/AnswerDisplay';

import UserMenu from './components/UserMenu';

import UsageBanner from './components/UsageBanner';

import Toast from './components/Toast';

import MakanLogo, { MakanIcon } from './components/MakanLogo';

import { AppProvider, useApp } from './context/AppContext';

import { IconDocument, IconPen, IconCheck } from './components/Icons';

import FeaturesSection from './components/sections/FeaturesSection';

import FAQSection from './components/sections/FAQSection';

import StatsSection from './components/sections/StatsSection';

import TestimonialsSection from './components/sections/TestimonialsSection';

import SiteFooter from './components/sections/SiteFooter';

import ScrollToTop from './components/ScrollToTop';

import OfflineBanner from './components/OfflineBanner';

import { API } from './config';



const STEPS = [

  { num: '۱', title: 'آپلود برگه', desc: 'عکس واضح از برگه', icon: IconDocument },

  { num: '۲', title: 'تحلیل ماکان', desc: 'خواندن سوالات', icon: IconPen },

  { num: '۳', title: 'دریافت پاسخ', desc: 'پاسخ کامل', icon: IconCheck },

];



const TRUST = ['رایگان', 'بدون نصب', 'فارسی', 'PWA'];



const NAV = [

  { href: '#start', label: 'شروع' },

  { href: '#features', label: 'امکانات' },

  { href: '#faq', label: 'سوالات' },

];



function AppContent() {

  const { addToHistory, user, toast, hideToast } = useApp();

  const [answer, setAnswer] = useState(null);

  const [answerMeta, setAnswerMeta] = useState(null);

  const [error, setError] = useState(null);

  const [loading, setLoading] = useState(false);

  const [streaming, setStreaming] = useState(false);

  const [serverMode, setServerMode] = useState(null);

  const [serverOnline, setServerOnline] = useState(null);

  const [retryKey, setRetryKey] = useState(0);



  useEffect(() => {
    let cancelled = false;

    function checkHealth() {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      fetch(API.health, { signal: controller.signal })
        .then((res) => {
          clearTimeout(timeout);
          if (!res.ok) throw new Error('offline');
          return res.json();
        })
        .then((data) => {
          if (cancelled) return;
          setServerMode(data.mode);
          setServerOnline(true);
        })
        .catch(() => {
          clearTimeout(timeout);
          if (cancelled) return;
          setServerMode(null);
          setServerOnline(false);
        });
    }

    checkHealth();
    const interval = setInterval(checkHealth, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [retryKey]);



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



  return (

    <div className="min-h-screen bg-mesh relative overflow-x-hidden">

      <div className="hero-glow top-0 left-1/2 -translate-x-1/2 -translate-y-1/3" />



      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}



      <OfflineBanner serverOnline={serverOnline} onRetry={() => setRetryKey((k) => k + 1)} />



      {serverMode === 'demo' && serverOnline && (

        <div className="relative z-20 bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-300 text-sm text-center py-2 px-4 backdrop-blur-sm">

          پاسخ‌های نمونه — برای پاسخ واقعی AI، Ollama یا کلید API را در تنظیمات سرور فعال کنید

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



      <section className="relative max-w-4xl mx-auto px-5 pt-14 pb-10 text-center animate-fade-in print-hide">

        <span className="section-label mb-5">سامانه ماکان</span>

        <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-slate-900 dark:text-white leading-[1.2] tracking-tight">

          برگه امتحانت را بفرست،

          <br />

          <span className="text-gradient">پاسخ بگیر</span>

        </h1>

        <p className="text-slate-500 dark:text-slate-400 mt-5 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">

          عکس برگه را آپلود کن — ماکان سوالات را می‌خواند و پاسخ کامل می‌دهد

        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-7">

          {TRUST.map((t) => (

            <span

              key={t}

              className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 px-3 py-1.5 rounded-full backdrop-blur-sm"

            >

              {t}

            </span>

          ))}

        </div>

        <a

          href="#start"

          className="inline-flex mt-8 btn-primary text-sm py-3.5 px-10 w-auto max-w-xs mx-auto"

        >

          همین الان شروع کن ←

        </a>

      </section>



      <main className="relative max-w-4xl mx-auto px-5 pb-8 space-y-8">

        <div id="start" className="scroll-mt-24 space-y-8">

          <UsageBanner />



          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up print-hide">

            {STEPS.map((step, i) => {

              const Icon = step.icon;

              return (

                <div key={i} className="group relative glass-card p-5 hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5">

                  <div className="flex items-start gap-4">

                    <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-makan-50 to-brand-50 dark:from-makan-950/60 dark:to-brand-950/40 border border-makan-100/80 dark:border-makan-900/40 flex items-center justify-center text-makan-600 dark:text-makan-400 group-hover:scale-105 transition-transform">

                      <Icon className="w-5 h-5" />

                    </div>

                    <div className="text-right flex-1 min-w-0">

                      <span className="text-[10px] font-bold text-brand-500 dark:text-brand-400">مرحله {step.num}</span>

                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{step.title}</p>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{step.desc}</p>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>



          <div className="glass-card-highlight p-7 sm:p-9 shadow-glow animate-slide-up print-hide">

            <div className="flex items-center gap-3 mb-7 pb-5 border-b border-slate-100 dark:border-slate-800">

              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-makan-500 to-brand-600 flex items-center justify-center shadow-btn">

                <IconDocument className="w-5 h-5 text-white" />

              </div>

              <div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">ارسال برگه امتحان</h2>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">عکس یا متن سوالات را وارد کنید</p>

              </div>

            </div>

            <QuestionForm

              key={retryKey}

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

                  onClick={() => { setError(null); setRetryKey((k) => k + 1); }}

                  className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 hover:underline"

                >

                  تلاش مجدد

                </button>

              </div>

            </div>

          )}



          {loading && !answer && (

            <div className="glass-card p-12 text-center animate-fade-in print-hide" role="status" aria-live="polite">

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

            <div className="animate-slide-up" aria-live="polite" aria-atomic="true">

              <AnswerDisplay answer={answer} meta={answerMeta || {}} streaming={streaming && loading} />

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


