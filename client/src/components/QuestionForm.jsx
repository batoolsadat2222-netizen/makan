import { useState } from 'react';
import ImageUpload from './ImageUpload';
import { IconDocument, IconPen } from './Icons';
import { useApp } from '../context/AppContext';
import { ANSWER_MODES } from '../utils/subjects';
import { askStream } from '../utils/api';
import { createThumbnail } from '../utils/thumbnail';

export default function QuestionForm({ onAnswer, onError, onLoading, onStreamUpdate }) {
  const { recordQuestion } = useApp();
  const [activeTab, setActiveTab] = useState('image');
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [answerMode, setAnswerMode] = useState('full');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (activeTab === 'image' && !image) {
      onError('لطفاً عکس برگه امتحان را آپلود کنید.');
      return;
    }

    if (activeTab === 'text' && !text.trim()) {
      onError('لطفاً سوالات برگه را بنویسید.');
      return;
    }

    setLoading(true);
    onLoading(true);
    onError(null);
    onStreamUpdate?.('');

    let thumbnail = null;
    if (image) {
      try {
        thumbnail = await createThumbnail(image);
      } catch {
        /* optional */
      }
    }

    const meta = {
      subject: '',
      grade: '',
      subjectLabel: '',
      gradeLabel: '',
      answerMode,
      thumbnail,
      textbookTitle: null,
    };

    try {
      const formData = new FormData();
      if (text.trim()) formData.append('text', text.trim());
      if (activeTab === 'image' && image) formData.append('image', image);
      formData.append('answerMode', answerMode);

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
        onDone: ({ answer, mode, provider, textbook, subject, grade, subjectLabel, gradeLabel }) => {
          finalAnswer = answer;
          finalMode = mode;
          finalProvider = provider;
          if (textbook) finalTextbook = textbook;
          if (subject) meta.subject = subject;
          if (grade) meta.grade = grade;
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
      const questionText = activeTab === 'text' ? text.trim() : text.trim() || 'برگه تصویری';
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">نوع پاسخ</p>
        <div className="flex rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 p-1.5 gap-1.5">
          {ANSWER_MODES.map(({ id, label, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => setAnswerMode(id)}
              className={`flex-1 py-3 px-3 rounded-xl text-right transition-all duration-200 ${
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
              onClick={() => {
                setActiveTab(id);
                if (id === 'text') setImage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-200/60 dark:ring-slate-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${activeTab === id ? 'text-makan-600 dark:text-makan-400' : ''}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'image' ? (
        <div className="space-y-4">
          <ImageUpload image={image} onImageChange={setImage} />
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">توضیح اضافی (اختیاری)</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="مثلاً: فقط سوال ۳ و ۴ را پاسخ بده"
              rows={2}
              className="input-field text-sm"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">متن سوالات</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="سوالات برگه امتحان را اینجا بنویسید..."
            rows={7}
            className="input-field"
          />
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        درس و پایه را خود ماکان از روی سوال تشخیص می‌دهد
      </p>

      <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
        {loading ? (
          <>
            <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            در حال بررسی...
          </>
        ) : (
          'دریافت پاسخ'
        )}
      </button>
    </form>
  );
}
