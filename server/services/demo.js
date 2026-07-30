import { trySolveMath, isPureMathQuestion } from './localSolver.js';
import { askLocalTutor } from './localTutor.js';
import { matchKnowledge } from '../data/knowledge/curriculum.js';

const DEMO_DELAY_MS = 0;

function hasGeminiKey() {
  const key = (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  return Boolean(key && (key.startsWith('AIza') || key.startsWith('AQ.')));
}

export function isDemoMode() {
  return !hasGeminiKey();
}

function detectCategory(text) {
  const q = text.toLowerCase();
  if (/نیرو|فشار|سرعت|شتاب|جرم|وزن|نیوتن|physics|گرانش|ولتاژ|مقاومت/.test(q)) return 'physics';
  if (/[\d۰-۹]+[\s]*[+\-×÷*/=]|محاسبه|معادله|ریاضی|مساحت|محیط|درصد/.test(q)) return 'math';
  if (/علوم|فیزیک|شیمی|زیست|اتم|مولکول|انرژی|گیاه|فتوسنتز|سلول/.test(q)) return 'science';
  if (/فارسی|فاعل|مفعول|آرایه|انشا/.test(q)) return 'persian';
  if (/english|grammar|vocabulary/i.test(q)) return 'english';
  if (/عربی|فعل ماضی|فعل مضارع/.test(q)) return 'arabic';
  return 'general';
}

function guideResponse(text, kind) {
  const tips = {
    physics: 'داده‌ها، فرمول (مثل F=ma)، واحدها و محاسبه را جدا بنویس.',
    math: 'عددها و عملیات را مشخص کن؛ اولویت: پرانتز → ضرب/تقسیم → جمع/تفریق.',
    science: 'مفهوم (تعریف/علت/مثال) را مشخص کن و مرحله‌به‌مرحله بنویس.',
    persian: 'نقش واژه‌ها یا آرایه را در همان جمله مثال بزن.',
    english: 'قانون گرامر را با یک مثال کوتاه بنویس.',
    arabic: 'صرف یا ترجمه را با یک مثال کوتاه نشان بده.',
    general: 'سوال را دقیق‌تر بنویس (درس + صورت کامل سوال).',
  };
  return `**سوال:** «${text}»

الان پاسخ کامل ابری در دسترس نیست. ${tips[kind] || tips.general}

اگر VPN روشن کنی، پاسخ هوش مصنوعی برای همه دروس فعال می‌شود.`;
}

function imageDemoMessage() {
  return `📷 متن عکس خوانده نشد یا خوانا نبود.

لطفاً:
1. عکس واضح‌تر و با نور بهتر بگیر
2. یا سوال را در تب «نوشتن سوال» تایپ کن`;
}

export async function askDemo({ text, imageBase64, subject, grade, usedOcr }) {
  await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));

  if (imageBase64 && !(text || '').trim()) {
    return imageDemoMessage();
  }

  const trimmed = text?.trim() || '';
  const local = askLocalTutor({ text: trimmed, subject, grade, usedOcr });
  if (local) return local.answer;

  // سازگاری: دانش مستقیم
  const known = matchKnowledge(trimmed);
  if (known && !isPureMathQuestion(trimmed)) return known;

  if (isPureMathQuestion(trimmed)) {
    const solved = trySolveMath(trimmed);
    if (solved) return solved.answer;
  }

  return guideResponse(trimmed || 'سوال درسی', detectCategory(trimmed));
}
