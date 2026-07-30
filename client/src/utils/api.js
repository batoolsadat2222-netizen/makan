import { API } from '../config';

export function getAuthHeaders() {
  const token = localStorage.getItem('pasokh_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function isNetworkError(err) {
  return err instanceof TypeError || /failed to fetch|network|load failed/i.test(err.message || '');
}

export function friendlyOfflineMessage() {
  return 'اتصال به سرور برقرار نشد. لطفاً چند لحظه بعد دوباره تلاش کنید.';
}

function friendlyError(err) {
  if (isNetworkError(err)) {
    return friendlyOfflineMessage();
  }
  return err.message || 'خطا در دریافت پاسخ';
}

export async function apiRegister(data) {
  const res = await fetch(API.auth.register, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'خطا در ثبت‌نام');
  return json;
}

export async function apiLogin(data) {
  const res = await fetch(API.auth.login, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'خطا در ورود');
  return json;
}

export async function apiMe() {
  const res = await fetch(API.auth.me, { headers: getAuthHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.user;
}

export async function sendContact(data) {
  const res = await fetch(API.contact, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'خطا در ارسال پیام');
  return json;
}

export async function fetchStats() {
  const res = await fetch(API.analytics.stats);
  if (!res.ok) throw new Error('خطا در دریافت آمار');
  return res.json();
}

export async function sendFeedback({ helpful, subject, grade }) {
  const res = await fetch(API.analytics.feedback, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ helpful, subject, grade }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function askRegular(formData) {
  const res = await fetch(API.ask, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'خطا در دریافت پاسخ');
  return json;
}

async function askStreamInternal(formData, { onChunk, onDone, onError, onMeta }) {
  const res = await fetch(API.askStream, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'خطا در دریافت پاسخ');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullAnswer = '';
  let finished = false;
  let streamError = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data:')) continue;
      try {
        const data = JSON.parse(line.slice(5).trim());
        if (data.type === 'meta') {
          onMeta?.(data);
        } else if (data.type === 'chunk' && data.text) {
          fullAnswer += data.text;
          onChunk(fullAnswer);
        } else if (data.type === 'done') {
          finished = true;
          onDone({
            answer: fullAnswer,
            mode: data.mode,
            provider: data.provider,
            textbook: data.textbook,
            subject: data.subject,
            grade: data.grade,
            subjectLabel: data.subjectLabel,
            gradeLabel: data.gradeLabel,
          });
        } else if (data.type === 'error') {
          streamError = data.error || 'خطا در دریافت پاسخ';
          onError?.(streamError);
        }
      } catch {
        /* skip */
      }
    }
  }

  if (streamError) {
    throw new Error(streamError);
  }

  if (!finished) {
    throw new Error(
      fullAnswer
        ? 'پاسخ ناقص دریافت شد. لطفاً دوباره تلاش کنید.'
        : 'پاسخی از سرور دریافت نشد. لطفاً دوباره تلاش کنید.'
    );
  }

  return fullAnswer;
}

/** Stream first; on network/SSE failure fall back to regular POST */
export async function askStream(formData, callbacks) {
  const { onChunk, onDone, onError } = callbacks;

  try {
    return await askStreamInternal(formData, callbacks);
  } catch (streamErr) {
    if (!isNetworkError(streamErr) && !/stream|aborted/i.test(streamErr.message)) {
      throw new Error(friendlyError(streamErr));
    }

    try {
      const json = await askRegular(formData);
      onChunk(json.answer);
      onDone({
        answer: json.answer,
        mode: json.mode,
        provider: json.provider,
        textbook: json.textbook,
        subject: json.subject,
        grade: json.grade,
        subjectLabel: json.subjectLabel,
        gradeLabel: json.gradeLabel,
      });
      return json.answer;
    } catch (regularErr) {
      throw new Error(friendlyError(regularErr));
    }
  }
}
