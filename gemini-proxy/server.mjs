import http from 'http';

const PORT = Number(process.env.PORT || 8787);
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

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
  const apiKey = auth.replace(/^Bearer\s+/i, '').trim();

  if (url.pathname === '/health') {
    return send(res, 200, { ok: true });
  }

  if (url.pathname === '/v1/models' && req.method === 'GET') {
    return send(res, 200, {
      object: 'list',
      data: [{ id: 'gpt-4o-mini', object: 'model' }, { id: 'gemini-2.0-flash', object: 'model' }],
    });
  }

  if (url.pathname !== '/v1/chat/completions' || req.method !== 'POST') {
    return send(res, 404, { error: { message: 'Not found' } });
  }

  if (!apiKey) return send(res, 401, { error: { message: 'Missing API key' } });

  try {
    const body = await readBody(req);
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

    let data = null;
    let okModel = models[0];
    let lastStatus = 500;
    for (const model of models) {
      const geminiUrl = `${BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      lastStatus = resp.status;
      data = await resp.json();
      if (resp.ok) {
        okModel = model;
        break;
      }
      const msg = data?.error?.message || '';
      if (!/429|quota|rate|not found|404|NOT_FOUND/i.test(msg) && resp.status !== 429 && resp.status !== 404) {
        return send(res, resp.status, { error: { message: msg || 'Gemini error', raw: data } });
      }
    }

    if (!data?.candidates?.[0]?.content?.parts) {
      return send(res, lastStatus, { error: { message: data?.error?.message || 'Gemini error', raw: data } });
    }

    const text = data.candidates[0].content.parts.map((p) => p.text || '').join('') || '';
    return send(res, 200, {
      id: 'chatcmpl-proxy',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: okModel,
      choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
    });
  } catch (error) {
    return send(res, 500, { error: { message: error.message || 'proxy error' } });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`gemini-proxy listening on ${PORT}`);
});
