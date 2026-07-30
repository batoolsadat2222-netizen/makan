import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import PlanBenefits from './PlanBenefits';

export default function LoginPanel() {
  const { login, openPanel, closePanel } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('ایمیل را وارد کنید.');
      return;
    }
    if (!password) {
      setError('رمز عبور را وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      closePanel();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PlanBenefits title="با ورود این امکانات را دریافت می‌کنید" />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="login-email" className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
          ایمیل
        </label>
        <input
          id="login-email"
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
        <label htmlFor="login-password" className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
          رمز عبور
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="رمز عبور خود را وارد کنید"
          className="input-field text-sm"
          autoComplete="current-password"
          required
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary text-sm py-3">
        {loading ? 'در حال ورود...' : 'ورود به حساب'}
      </button>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        حساب ندارید؟{' '}
        <button
          type="button"
          onClick={() => openPanel('register')}
          className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
        >
          ثبت‌نام رایگان
        </button>
      </p>
    </form>
  );
}
