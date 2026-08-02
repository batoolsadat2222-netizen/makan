export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = req.headers.authorization || '';
  const apiKey = auth.replace(/^Bearer\s+/i, '').trim();
  if (!apiKey) return res.status(401).json({ error: { message: 'Missing API key' } });

  if (req.method === 'GET') {
    return res.status(200).json({
      object: 'list',
      data: [{ id: 'gpt-4o-mini', object: 'model' }, { id: 'gemini-2.0-flash', object: 'model' }],
    });
  }

  if (req.method !== 'POST') return res.status(404).json({ error: { message: 'Not found' } });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const systemParts = [];
  const contents = [];
  for (const msg of body.messages || []) {
    if (msg.role === 'system') {
      if (typeof msg.content === 'string') systemParts.push(msg.content);
      continue;
    }
    const role = msg.role === 'assistant' ? 'model' : 'user';
    let text = typeof msg.content === 'string'
      ? msg.content
      : (Array.isArray(msg.content) ? msg.content.map((p) => p?.text || '').join('\n') : '');
    contents.push({ role, parts: [{ text }] });
  }

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

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await resp.json();
  if (!resp.ok) {
    return res.status(resp.status).json({ error: { message: data?.error?.message || 'Gemini error', raw: data } });
  }
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  return res.status(200).json({
    id: 'chatcmpl-proxy',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gemini-2.0-flash',
    choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
  });
}
