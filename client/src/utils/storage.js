import { GUEST_DAILY_LIMIT, GUEST_HISTORY_LIMIT, MEMBER_HISTORY_LIMIT } from './plans';

const USERS_KEY = 'pasokh_users';
const SESSION_KEY = 'pasokh_session';
const TOKEN_KEY = 'pasokh_token';
const HISTORY_KEY = 'pasokh_history';
const SETTINGS_KEY = 'pasokh_settings';
const MESSAGES_KEY = 'pasokh_messages';
const GUEST_USAGE_KEY = 'pasokh_guest_usage';

const DEFAULT_SETTINGS = {
  notifications: true,
  darkMode: false,
  themeMode: 'system',
  saveHistory: true,
};

function resolveDarkMode(settings) {
  if (settings.themeMode === 'dark') return true;
  if (settings.themeMode === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function historyKey(userId) {
  return userId ? `${HISTORY_KEY}_${userId}` : HISTORY_KEY;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const merged = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    merged.darkMode = resolveDarkMode(merged);
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export { resolveDarkMode };

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function loadToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveSession(user) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email }));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function loadHistory(userId = null) {
  try {
    return JSON.parse(localStorage.getItem(historyKey(userId)) || '[]');
  } catch {
    return [];
  }
}

export function saveHistory(items, userId = null) {
  localStorage.setItem(historyKey(userId), JSON.stringify(items));
}

export function addHistoryItem(item, userId = null) {
  const limit = userId ? MEMBER_HISTORY_LIMIT : GUEST_HISTORY_LIMIT;
  const history = loadHistory(userId);
  const next = [{ id: Date.now().toString(), ...item, date: new Date().toISOString() }, ...history].slice(0, limit);
  saveHistory(next, userId);
  return next;
}

export function deleteHistoryItem(id, userId = null) {
  const history = loadHistory(userId).filter((h) => h.id !== id);
  saveHistory(history, userId);
  return history;
}

export function clearHistory(userId = null) {
  saveHistory([], userId);
}

export function saveMessage(msg) {
  const messages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
  messages.unshift({ id: Date.now().toString(), ...msg, date: new Date().toISOString() });
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages.slice(0, 20)));
}

export function loadGuestUsage() {
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_USAGE_KEY) || '{}');
    if (raw.date !== todayKey()) return { date: todayKey(), count: 0 };
    return raw;
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

export function getGuestRemaining() {
  const usage = loadGuestUsage();
  return Math.max(0, GUEST_DAILY_LIMIT - (usage.count || 0));
}

export function incrementGuestUsage() {
  const usage = loadGuestUsage();
  const next = { date: todayKey(), count: usage.count + 1 };
  localStorage.setItem(GUEST_USAGE_KEY, JSON.stringify(next));
  return next;
}

export function incrementUserQuestions(userId) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  users[idx].totalQuestions = (users[idx].totalQuestions || 0) + 1;
  saveUsers(users);
}

export function getUserStats(userId) {
  const user = loadUsers().find((u) => u.id === userId);
  return { totalQuestions: user?.totalQuestions || 0 };
}

export function registerUser({ name, email, password }) {
  const trimmedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new Error('فرمت ایمیل صحیح نیست.');
  }

  const users = loadUsers();
  if (users.some((u) => u.email === trimmedEmail)) {
    throw new Error('این ایمیل قبلاً ثبت شده است.');
  }
  if (password.length < 6) {
    throw new Error('رمز عبور باید حداقل ۶ کاراکتر باشد.');
  }

  const user = {
    id: Date.now().toString(),
    name: name.trim(),
    email: trimmedEmail,
    password,
    totalQuestions: 0,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  saveSession({ id: user.id, name: user.name, email: user.email });
  return user;
}

export function loginUser({ email, password }) {
  const trimmedEmail = email.trim().toLowerCase();
  const users = loadUsers();
  const user = users.find((u) => u.email === trimmedEmail && u.password === password);
  if (!user) throw new Error('ایمیل یا رمز عبور اشتباه است.');
  saveSession({ id: user.id, name: user.name, email: user.email });
  return user;
}

export function logoutUser() {
  saveSession(null);
  saveToken(null);
}
