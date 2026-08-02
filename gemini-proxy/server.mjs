import http from 'http';

const PORT = Number(process.env.PORT || 8787);
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function toGemini(messages) {
  const systemParts = [];
  const contents = [];
  for (const msg of messages || []) {
    if (msg.role === 'system') {
      if (typeof msg.content === 'string' && msg.content.trim()) systemParts.push(msg.content);
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

async function askGemini(apiKey, body) {
  const { systemParts, contents } = toGemini(body.messages);
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

  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-flash-latest',
  ];

  let last = null;
  for (const model of models) {
    const geminiUrl = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    last = { status: resp.status, data, model };
    if (resp.ok && data?.candidates?.[0]?.content?.parts) {
      const text = data.candidates[0].content.parts.map((p) => p.text || '').join('') || '';
      return { ok: true, text, model };
    }
  }
  return { ok: false, ...last };
}

async function askGroq(apiKey, body) {
  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: body.messages || [],
      temperature: body.temperature ?? 0.15,
      max_tokens: body.max_tokens || 4096,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) return { ok: false, status: resp.status, data };
  const text = data?.choices?.[0]?.message?.content || '';
  return { ok: true, text, model: 'llama-3.3-70b-versatile' };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    });
    return res.end();
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const auth = req.headers.authorization || '';
  const clientKey = auth.replace(/^Bearer\s+/i, '').trim();

  if (url.pathname === '/health') {
    return send(res, 200, { ok: true });
  }

  if (url.pathname === '/v1/models' && req.method === 'GET') {
    return send(res, 200, {
      object: 'list',
      data: [{ id: 'gpt-4o-mini', object: 'model' }, { id: 'gemini-2.5-flash', object: 'model' }],
    });
  }

  if (url.pathname !== '/v1/chat/completions' || req.method !== 'POST') {
    return send(res, 404, { error: { message: 'Not found' } });
  }

  try {
    const body = await readBody(req);
    const geminiKey = process.env.GEMINI_API_KEY || clientKey;
    const groqKey = process.env.GROQ_API_KEY || '';

    if (geminiKey) {
      const g = await askGemini(geminiKey, body);
      if (g.ok) {
        return send(res, 200, {
          id: 'chatcmpl-proxy',
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: g.model,
          choices: [{ index: 0, message: { role: 'assistant', content: g.text }, finish_reason: 'stop' }],
        });
      }
    }

    if (groqKey) {
      const q = await askGroq(groqKey, body);
      if (q.ok) {
        return send(res, 200, {
          id: 'chatcmpl-proxy',
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: q.model,
          choices: [{ index: 0, message: { role: 'assistant', content: q.text }, finish_reason: 'stop' }],
        });
      }
      return send(res, q.status || 502, { error: { message: q.data?.error?.message || 'Groq error', raw: q.data } });
    }

    return send(res, 429, { error: { message: 'No upstream AI available (quota/key)' } });
  } catch (error) {
    return send(res, 500, { error: { message: error.message || 'proxy error' } });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`gemini-proxy listening on ${PORT}`);
});
