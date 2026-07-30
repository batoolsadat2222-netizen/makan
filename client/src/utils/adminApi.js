import { API_BASE } from '../config';

const ADMIN_TOKEN_KEY = 'makan_admin_token';

export function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

function adminHeaders() {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function adminFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...adminHeaders(), ...options.headers },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'خطا در درخواست');
  return json;
}

export async function adminLogin(password) {
  const json = await adminFetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  setAdminToken(json.token);
  return json;
}

export function fetchAdminDashboard() {
  return adminFetch(`${API_BASE}/api/admin/dashboard`);
}

export function fetchAdminMessages() {
  return adminFetch(`${API_BASE}/api/admin/messages`);
}

export function markMessageRead(id) {
  return adminFetch(`${API_BASE}/api/admin/messages/${id}/read`, { method: 'PATCH' });
}

export function deleteAdminMessage(id) {
  return adminFetch(`${API_BASE}/api/admin/messages/${id}`, { method: 'DELETE' });
}
