export const API_BASE =
  import.meta.env.VITE_API_URL ?? '';

export const API = {
  health: `${API_BASE}/api/health`,
  ask: `${API_BASE}/api/ask`,
  askStream: `${API_BASE}/api/ask/stream`,
  auth: {
    register: `${API_BASE}/api/auth/register`,
    login: `${API_BASE}/api/auth/login`,
    me: `${API_BASE}/api/auth/me`,
  },
  analytics: {
    stats: `${API_BASE}/api/analytics/stats`,
    feedback: `${API_BASE}/api/analytics/feedback`,
  },
  contact: `${API_BASE}/api/contact`,
  setupStatus: `${API_BASE}/api/setup/ai-status`,
  setupAiKey: `${API_BASE}/api/setup/ai-key`,
  curriculum: {
    textbook: `${API_BASE}/api/curriculum/textbook`,
    textbooks: `${API_BASE}/api/curriculum/textbooks`,
  },
};
