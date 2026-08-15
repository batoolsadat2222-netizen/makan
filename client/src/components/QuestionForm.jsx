import { useMemo, useState } from 'react';
import ImageUpload from './ImageUpload';
import { IconDocument, IconPen } from './Icons';
import { useApp } from '../context/AppContext';
import { ANSWER_MODES, GRADE_GROUPS, getSubjectsForGrade } from '../utils/subjects';
import { askStream } from '../utils/api';
import { createThumbnail } from '../utils/thumbnail';

export default function QuestionForm({
  onAnswer,
  onError,
  onLoading,
  onStreamUpdate,
  serverOnline = true,
}) {
  const { canAskQuestion, recordQuestion, openPanel, guestRemaining, user } = useApp();
  const [activeTab, setActiveTab] = useState('image');
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [handouts, setHandouts] = useState([]);
  const [answerMode, setAnswerMode] = useState('full');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  /** null | 'ask' | 'handout-upload' */
  const [dialog, setDialog] = useState(null);

  const subjectOptions = useMemo(
    () => (grade ? getSubjectsForGrade(grade) : []),
    [grade]
  );

  const offline = serverOnline === false;
  const askGate = canAskQuestion();
  const limitReached = !askGate.allowed;

  function validateReady() {
    const gate = canAskQuestion();
    if (!gate.allowed) {
      onError(gate.message || 'سوال رایگان تمام شد. برای ادامه اشتراک بخرید.');
      openPanel('register');
      return false;
    }
    if (activeTab === 'image' && !image) {
      onError('لطفاً عکس برگه امتحان را آپلود کنید.');
      return false;
    }
    if (activeTab === 'text' && !text.trim()) {
      onError('لطفاً سوالات برگه را بنویسید.');
      return false;
    }
    return true;
  }

  function handleGetAnswerClick(e) {
    e.preventDefault();
    if (limitReached) {
      openPanel('register');
      return;
    }
    if (!validateReady()) return;
    setHandouts([]);
    setDialog('ask');
  }

  async function sendRequest({ withHandout }) {
    if (withHandout && !handouts.length) {
      onError('لطفاً حداقل یک فایل از جزوه آپلود کنید (عکس یا PDF).');
      return;
    }

    setDialog(null);
    setLoading(true);
    onLoading(true);
    onError(null);
    onStreamUpdate?.('');

    requestAnimationFrame(() => {
      document.getElementById('answer-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const thumbSource = image || handouts[0];
    let thumbnail = null;
    if (thumbSource) {
      try {
        thumbnail = await createThumbnail(thumbSource);
      } catch {
        /* optional */
      }
    }

    const meta = {
      subject: subject || '',
      grade: grade || '',
      subjectLabel: '',
      gradeLabel: '',
      answerMode,
      thumbnail,
      textbookTitle: null,
    };

    try {
      const formData = new FormData();
      formData.append('answerMode', answerMode);
      if (grade) formData.append('grade', grade);
      if (subject) formData.append('subject', subject);

      if (withHandout) {
        formData.append('mode', 'handout');
        handouts.forEach((file) => formData.append('handout', file));
        if (text.trim()) formData.append('text', text.trim());
        if (image) formData.append('exam', image);
      } else {
        if (text.trim()) formData.append('text', text.trim());
        if (activeTab === 'image' && image) formData.append('image', image);
      }

      let finalAnswer = '';
      let finalMode = 'unknown';
      let finalProvider = null;
      let finalTextbook = null;
      let streamFailed = false;

      await askStream(formData, {
        onChunk: (partial) => {
          finalAnswer = partial;
          onStreamUpdate?.(partial, meta);
        },
        onDone: ({ answer, mode, provider, textbook, subject: s, grade: g, subjectLabel, gradeLabel }) => {
          finalAnswer = answer;
          finalMode = mode;
          finalProvider = provider;
          if (textbook) finalTextbook = textbook;
          if (s) meta.subject = s;
          if (g) meta.grade = g;
          if (subjectLabel) meta.subjectLabel = subjectLabel;
          if (gradeLabel) meta.gradeLabel = gradeLabel;
        },
        onMeta: (info) => {
          if (info.subject) meta.subject = info.subject;
          if (info.grade) meta.grade = info.grade;
          if (info.subjectLabel) meta.subjectLabel = info.subjectLabel;
          if (info.gradeLabel) meta.gradeLabel = info.gradeLabel;
          if (info.textbook) finalTextbook = info.textbook;
          onStreamUpdate?.(finalAnswer || '', { ...meta });
        },
        onError: (msg) => {
          streamFailed = true;
          throw new Error(msg);
        },
      });

      if (streamFailed || !finalAnswer?.trim()) {
        throw new Error('پاسخی دریافت نشد. لطفاً دوباره تلاش کنید.');
      }

      recordQuestion();
      const questionText = withHandout
        ? (text.trim() || 'امتحان طبق جزوه')
        : (activeTab === 'text' ? text.trim() : text.trim() || 'برگه تصویری');
      onAnswer(finalAnswer, finalMode, questionText, {
        ...meta,
        provider: finalProvider,
        textbookTitle: finalTextbook,
      });
    } catch (err) {
      onError(err.message || 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
      onStreamUpdate?.(null);
    } finally {
      setLoading(false);
      onLoading(false);
    }
  }

  const tabs = [
    { id: 'image', label: 'عکس برگه', icon: IconDocument },
    { id: 'text', label: 'نوشتن سوالات', icon: IconPen },
  ];

  return (
    <form onSubmit={handleGetAnswerClick} className="space-y-6">
      {!user && Number.isFinite(guestRemaining) && (
        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
          {guestRemaining > 0
            ? `${guestRemaining} سوال رایگان امروز باقی مانده`
            : 'سهمیه رایگان امروز تمام شده — برای ادامه اشتراک لازم است'}
        </p>
      )}

      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">پایه و درس</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">پایه تحصیلی</label>
            <select
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                setSubject('');
              }}
              disabled={loading || offline || limitReached}
              className="input-field text-sm disabled:opacity-50"
            >
              <option value="">تشخیص خودکار</option>
              {GRADE_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.grades.map((g) => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">درس</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!grade || loading || offline || limitReached}
              className="input-field text-sm disabled:opacity-50"
            >
              <option value="">{grade ? 'تشخیص خودکار' : 'اول پایه را انتخاب کنید'}</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 leading-5">
          برای جواب درست، پایه و درس را انتخاب کنید. اگر خالی بگذارید ماکان از روی سوال حدس می‌زند.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">نوع پاسخ</p>
        <div className="flex rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 p-1.5 gap-1.5">
          {ANSWER_MODES.map(({ id, label, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => setAnswerMode(id)}
              disabled={loading || offline || limitReached}
              className={`flex-1 py-3 px-3 rounded-xl text-right transition-all duration-200 disabled:opacity-50 ${
                answerMode === id
                  ? 'bg-white dark:bg-slate-700 shadow-md ring-1 ring-slate-200/60 dark:ring-slate-600'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span className="text-sm font-semibold text-slate-800 dark:text-white block">{label}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">روش ارسال</p>
        <div className="flex rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 p-1.5 gap-1.5">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              disabled={loading || offline || limitReached}
              onClick={() => {
                setActiveTab(id);
                setHandouts([]);
                setDialog(null);
                if (id === 'text') setImage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${
                activeTab === id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-200/60 dark:ring-slate-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${activeTab === id ? 'text-makan-600 dark:text-makan-400' : ''}`} />
              <span className="leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'image' && (
        <div className="space-y-4">
          <ImageUpload image={image} onImageChange={setImage} />
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">توضیح اضافی (اختیاری)</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="مثلاً: فقط سوال ۳ و ۴ را پاسخ بده"
              rows={2}
              disabled={loading || offline || limitReached}
              className="input-field text-sm disabled:opacity-50"
            />
          </div>
        </div>
      )}

      {activeTab === 'text' && (
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">متن سوالات</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="سوالات برگه امتحان را اینجا بنویسید..."
            rows={7}
            disabled={loading || offline || limitReached}
            className="input-field disabled:opacity-50"
          />
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        {offline
          ? 'تا برقراری اتصال، ارسال غیرفعال است'
          : limitReached
            ? 'برای سوال بیشتر، اشتراک بخرید'
            : grade && subject
              ? 'پاسخ مطابق پایه و درس انتخاب‌شده داده می‌شود'
              : 'اگر پایه/درس را انتخاب نکنید، ماکان از روی سوال تشخیص می‌دهد'}
      </p>

      <button
        type={limitReached ? 'button' : 'submit'}
        disabled={loading}
        onClick={limitReached ? () => openPanel('register') : undefined}
        className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            در حال بررسی...
          </>
        ) : limitReached ? (
          'سوال رایگان تمام شد — خرید اشتراک'
        ) : (
          'دریافت پاسخ'
        )}
      </button>

      {dialog && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => !loading && setDialog(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="handout-dialog-title"
          >
            {dialog === 'ask' && (
              <>
                <div>
                  <h3 id="handout-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
                    جزوه می‌فرستی یا ماکان جواب بده؟
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-6">
                    اگر معلم گفته «طبق جزوه»، جزوه را بفرست. وگرنه ماکان خودش پاسخ می‌دهد.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setDialog('handout-upload')}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-makan-400 transition-colors"
                  >
                    بله، جزوه می‌فرستم
                  </button>
                  <button
                    type="button"
                    onClick={() => sendRequest({ withHandout: false })}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #0d9488, #4f46e5)' }}
                  >
                    نه، ماکان جواب بده
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog(null)}
                    className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-600"
                  >
                    انصراف
                  </button>
                </div>
              </>
            )}

            {dialog === 'handout-upload' && (
              <>
                <div>
                  <h3 id="handout-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
                    فایل جزوه را بفرست
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-6">
                    پاسخ فقط طبق همین جزوه داده می‌شود.
                  </p>
                </div>
                <ImageUpload
                  multiple
                  images={handouts}
                  onImagesChange={setHandouts}
                  title="عکس یا PDF جزوه"
                  subtitle="می‌توانید چند صفحه اضافه کنید"
                  showTips={false}
                  allowCamera
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDialog('ask')}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    بازگشت
                  </button>
                  <button
                    type="button"
                    disabled={!handouts.length}
                    onClick={() => sendRequest({ withHandout: true })}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #0d9488, #4f46e5)' }}
                  >
                    ارسال و پاسخ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
