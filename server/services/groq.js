import Groq from 'groq-sdk';
import { getSystemPrompt, getImagePrompt, getTextPrompt } from './prompts.js';

export function isValidGroqKey(key) {
  return key && key.startsWith('gsk_');
}

function buildMessages(params) {
  const system = getSystemPrompt(params);
  const { text, imageBase64, imageMimeType } = params;

  if (imageBase64) {
    return {
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: [
            { type: 'text', text: getImagePrompt(params, text) },
            {
              type: 'image_url',
              image_url: { url: `data:${imageMimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
    };
  }

  return {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: getTextPrompt(params, text.trim()) },
    ],
  };
}

export async function askGroq(params) {
  const apiKey = (process.env.GROQ_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const groq = new Groq({ apiKey });
  const { model, messages } = buildMessages(params);
  const completion = await groq.chat.completions.create({ model, messages, max_tokens: 4000 });
  return completion.choices[0].message.content;
}

export async function* streamGroq(params) {
  const apiKey = (process.env.GROQ_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const groq = new Groq({ apiKey });
  const { model, messages } = buildMessages(params);
  const stream = await groq.chat.completions.create({
    model,
    messages,
    max_tokens: 4000,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}
