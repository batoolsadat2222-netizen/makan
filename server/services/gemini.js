import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemPrompt, getImagePrompt, getTextPrompt } from './prompts.js';

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

export function isValidGeminiKey(key) {
  const cleaned = (key || '').trim().replace(/^["']|["']$/g, '');
  return Boolean(cleaned && (cleaned.startsWith('AIza') || cleaned.startsWith('AQ.')));
}

function buildParts(params) {
  const { text, imageBase64, imageMimeType } = params;
  const parts = [];

  if (imageBase64) {
    parts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } });
    parts.push({ text: getImagePrompt(params, text) });
  } else {
    parts.push({ text: getTextPrompt(params, text.trim()) });
  }

  return parts;
}

function getModel(params) {
  const genAI = new GoogleGenerativeAI(cleanEnvKey(process.env.GEMINI_API_KEY));
  return genAI.getGenerativeModel({
    model: MODELS[0],
    systemInstruction: getSystemPrompt(params),
  });
}

function cleanEnvKey(key) {
  return (key || '').trim().replace(/^["']|["']$/g, '');
}

export async function askGemini(params) {
  const parts = buildParts(params);
  let lastError;

  for (const modelName of MODELS) {
    try {
      const genAI = new GoogleGenerativeAI(cleanEnvKey(process.env.GEMINI_API_KEY));
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: getSystemPrompt(params),
      });
      const result = await Promise.race([
        model.generateContent(parts),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini timeout')), 12000)
        ),
      ]);
      return result.response.text();
    } catch (error) {
      lastError = error;
      console.error(`Gemini ${modelName} failed:`, error.message);
      if (/403|Forbidden|timeout|blocked/i.test(error.message || '')) break;
    }
  }

  throw lastError;
}

export async function* streamGemini(params) {
  const parts = buildParts(params);
  let lastError;

  for (const modelName of MODELS) {
    try {
      const genAI = new GoogleGenerativeAI(cleanEnvKey(process.env.GEMINI_API_KEY));
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: getSystemPrompt(params),
      });
      const result = await model.generateContentStream(parts);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
      }
      return;
    } catch (error) {
      lastError = error;
      console.error(`Gemini stream ${modelName} failed:`, error.message);
    }
  }

  throw lastError;
}
