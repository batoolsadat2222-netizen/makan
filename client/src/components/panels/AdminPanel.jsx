import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  adminLogin,
  fetchAdminDashboard,
  fetchAdminMessages,
  markMessageRead,
  deleteAdminMessage,
  getAdminToken,
  clearAdminToken,
} from '../../utils/adminApi';

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function AdminPanel() {
  const { showToast } = useApp();
  const [authed, setAuthed] = useState(Boolean(getAdminToken()));
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);

  async function loadData() {
    const [dash, msgs] = await Promise.all([
      fetchAdminDashboard(),
      fetchAdminMessages(),
    ]);
    setDashboard(dash);
    setMessages(msgs.messages || []);
  }

  useEffect(() => {
    if (authed) {
      loadData().catch(() => {
        clearAdminToken();
        setAuthed(false);
      });
    }
  }, [authed]);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(password);
      setAuthed(true);
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearAdminToken();
    setAuthed(false);
    setDashboard(null);
    setMessages([]);
    setSelected(null);
  }

  async function handleMarkRead(id) {
    await markMessageRead(id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    if (selected?.id === id) setSelected((s) => ({ ...s, read: true }));
    showToast('پیام خوانده شد.');
  }

  async function handleDelete(id) {
    if (!confirm('این پیام حذف شود؟')) return;
    await deleteAdminMessage(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selected?.id === id) setSelected(null);
    showToast('پیام حذف شد.');
  }

  if (!authed) {
    return (
      <form onSubmit={handleLogin} className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          ورود مدیر — فقط برای صاحب سایت
        </p>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">رمز مدیر</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field text-sm"
            placeholder="رمز ADMIN_PASSWORD"
            autoComplete="current-password"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary text-sm py-3">
          {loading ? 'در حال ورود...' : 'ورود به پنل'}
        </button>
      </form>
    );
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setSelected(null)} className="text-sm text-brand-600 font-medium hover:underline">
          ← بازگشت
        </button>
        <div className="text-xs text-slate-400">{formatDate(selected.date)}</div>
        {!selected.read && (
          <span className="inline-block text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">جدید</span>
        )}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 space-y-2">
          <p className="text-xs text-slate-500">از: <strong>{selected.email}</strong></p>
          <p className="text-xs text-slate-500">موضوع: {selected.subject}</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed pt-2">{selected.message}</p>
        </div>
        <div className="flex gap-2">
          {!selected.read && (
            <button type="button" onClick={() => handleMarkRead(selected.id)} className="btn-secondary text-xs flex-1">
              علامت خوانده‌شده
            </button>
          )}
          <button type="button" onClick={() => handleDelete(selected.id)} className="text-xs text-red-500 border border-red-200 px-4 py-2 rounded-xl flex-1">
            حذف
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">مدیر</span>
        <button type="button" onClick={handleLogout} className="text-xs text-red-500 hover:underline">خروج</button>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="کاربران" value={dashboard.totalUsers} />
          <StatBox label="پیام جدید" value={dashboard.unreadMessages} highlight={dashboard.unreadMessages > 0} />
          <StatBox label="کل سوالات" value={dashboard.stats?.totalQuestions ?? 0} />
          <StatBox label="رضایت" value={dashboard.stats?.satisfaction != null ? `${dashboard.stats.satisfaction}%` : '—'} />
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase mb-2">پیام‌های تماس ({messages.length})</p>
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">پیامی نیست</p>
        ) : (
          <ul className="space-y-2 max-h-[360px] overflow-y-auto">
            {messages.map((msg) => (
              <li
                key={msg.id}
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                  msg.read
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
                    : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
                }`}
                onClick={() => { setSelected(msg); if (!msg.read) handleMarkRead(msg.id); }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{msg.subject}</p>
                  {!msg.read && <span className="shrink-0 w-2 h-2 rounded-full bg-amber-500 mt-1.5" />}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{msg.email}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{msg.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{formatDate(msg.date)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${highlight ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
      <p className="text-lg font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}
