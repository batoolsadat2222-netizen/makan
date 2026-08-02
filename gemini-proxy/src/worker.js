/**
 * OpenAI-compatible Gemini proxy for Cloudflare Workers
 * Client sends Gemini API key as Bearer token.
 */
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function mapModel(model) {
  const m = String(model || '').toLowerCase();
  if (m.includes('pro')) return 'gemini-2.0-flash';
  return 'gemini-2.0-flash';
}

function toGeminiContents(messages) {
  const systemParts = [];
  const contents = [];
  for (const msg of messages || []) {
    if (msg.role === 'system') {
      const t = typeof msg.content === 'string' ? msg.content : '';
      if (t) systemParts.push(t);
      continue;
    }
    const role = msg.role === 'assistant' ? 'model' : 'user';
    let text = '';
    if (typeof msg.content === 'string') text = msg.content;
    else if (Array.isArray(msg.content)) {
      text = msg.content.map((p) => (p?.type === 'text' ? p.text : '')).filter(Boolean).join('\n');
    }
    contents.push({ role, parts: [{ text }] });
  }
  return { systemParts, contents };
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const auth = request.headers.get('Authorization') || '';
    const apiKey = auth.replace(/^Bearer\s+/i, '').trim();
    if (!apiKey) return json({ error: { message: 'Missing API key' } }, 401);

    if (url.pathname.endsWith('/models') && request.method === 'GET') {
      return json({
        object: 'list',
        data: [{ id: 'gpt-4o-mini', object: 'model' }, { id: 'gemini-2.0-flash', object: 'model' }],
      });
    }

    if (!url.pathname.endsWith('/chat/completions') || request.method !== 'POST') {
      return json({ error: { message: 'Not found' } }, 404);
    }

    const body = await request.json();
    const model = mapModel(body.model);
    const { systemParts, contents } = toGeminiContents(body.messages);
    const payload = {
      contents,
      generationConfig: {
        temperature: body.temperature ?? 0.15,
        maxOutputTokens: body.max_tokens || 4096,
      },
    };
    if (systemParts.length) {
      payload.systemInstruction = { parts: [{ text: systemParts.join('\n') }] };
    }

    const geminiUrl = `${BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return json({ error: { message: data?.error?.message || 'Gemini error', raw: data } }, resp.status);
    }

    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    return json({
      id: 'chatcmpl-proxy',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
    });
  },
};
