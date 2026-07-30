import { useState } from 'react';

import { useApp } from '../../context/AppContext';



export default function ContactPanel() {

  const { sendContact, user } = useApp();

  const [email, setEmail] = useState(user?.email || '');

  const [subject, setSubject] = useState('');

  const [message, setMessage] = useState('');

  const [sent, setSent] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);



  async function handleSubmit(e) {

    e.preventDefault();

    setError('');



    if (!email.trim()) {

      setError('ایمیل خود را وارد کنید.');

      return;

    }

    if (!message.trim()) {

      setError('متن پیام را بنویسید.');

      return;

    }



    setLoading(true);

    try {

      const result = await sendContact({

        email: email.trim(),

        subject: subject.trim() || 'پیام پشتیبانی',

        message: message.trim(),

      });

      setSuccessMsg(result.message || 'پیام شما ثبت شد.');

      setSent(true);

      setSubject('');

      setMessage('');

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  }



  if (sent) {

    return (

      <div className="text-center py-10">

        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">

          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>

            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />

          </svg>

        </div>

        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">پیام شما ثبت شد</p>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{successMsg}</p>

        <button

          type="button"

          onClick={() => setSent(false)}

          className="mt-4 text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline"

        >

          ارسال پیام جدید

        </button>

      </div>

    );

  }



  return (

    <form onSubmit={handleSubmit} className="space-y-4">

      <p className="text-sm text-slate-600 dark:text-slate-400">

        برای پشتیبانی، پیشنهاد یا گزارش مشکل، فرم زیر را پر کنید.

      </p>



      {error && (

        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3">

          {error}

        </div>

      )}



      <div>

        <label htmlFor="contact-email" className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">

          ایمیل شما

        </label>

        <input

          id="contact-email"

          type="email"

          value={email}

          onChange={(e) => setEmail(e.target.value)}

          placeholder="example@email.com"

          className="input-field text-sm"

        />

      </div>



      <div>

        <label htmlFor="contact-subject" className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">

          موضوع (اختیاری)

        </label>

        <input

          id="contact-subject"

          type="text"

          value={subject}

          onChange={(e) => setSubject(e.target.value)}

          placeholder="مثلاً: مشکل در آپلود عکس"

          className="input-field text-sm"

        />

      </div>



      <div>

        <label htmlFor="contact-message" className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">

          پیام

        </label>

        <textarea

          id="contact-message"

          value={message}

          onChange={(e) => setMessage(e.target.value)}

          placeholder="پیام خود را بنویسید..."

          rows={5}

          className="input-field text-sm"

        />

      </div>



      <button type="submit" disabled={loading} className="btn-primary text-sm py-3">

        {loading ? 'در حال ارسال...' : 'ارسال پیام'}

      </button>

    </form>

  );

}


