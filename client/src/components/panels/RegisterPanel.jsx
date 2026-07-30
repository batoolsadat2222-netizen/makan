import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import PlanBenefits from './PlanBenefits';

export default function RegisterPanel() {
  const { register, openPanel, closePanel } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('نام و نام خانوادگی را وارد کنید.');
      return;
    }
    if (!email.trim()) {
      setError('ایمیل را وارد کنید.');
      return;
    }
    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    if (password !== confirm) {
      setError('رمز عبور و تکرار آن یکسان نیست.');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password });
      closePanel();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PlanBenefits title="با ثبت‌نام رایگان دریافت می‌کنید" />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="reg-name" className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
          نام و نام خانوادگی
        </label>
        <input
          id="reg-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثلاً: علی محمدی"
          className="input-field text-sm"
          autoComplete="name"
          required
        />
      </div>

      <div>
        <label htmlFor="reg-email" className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
          ایمیل
        </label>
        <input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          className="input-field text-sm"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label htmlFor="reg-password" className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
          رمز عبور
        </label>
        <input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="حداقل ۶ کاراکتر"
          className="input-field text-sm"
          autoComplete="new-password"
          required
          minLength={6}
        />
      </div>

      <div>
        <label htmlFor="reg-confirm" className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
          تکرار رمز عبور
        </label>
        <input
          id="reg-confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="رمز عبور را دوباره وارد کنید"
          className="input-field text-sm"
          autoComplete="new-password"
          required
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary text-sm py-3">
        {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام و شروع'}
      </button>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        قبلاً ثبت‌نام کرده‌اید؟{' '}
        <button
          type="button"
          onClick={() => openPanel('login')}
          className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
        >
          وارد شوید
        </button>
      </p>
    </form>
  );
}
