import { wrapAnswer, finalAnswerLine, toPersianDigits } from './answerFormat.js';

/** حل‌کننده محلی برای سوالات ساده — وقتی API در دسترس نیست */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

const CONCEPT_WORDS =
  /فتوسنتز|سلول|یاخته|اتم|مولکول|نیرو|نیوتن|گرانش|انرژی|معادله|مساحت|محیط|حجم|تعریف|علت|چرا|چگونه|photosynthesis|physics|biology|science|cell|atom/i;

function toEnglishDigits(str) {
  return String(str)
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

function normalizeMathText(text) {
  return toEnglishDigits(text)
    .replace(/(\d)\s*[xX×∗]\s*(\d)/g, '$1*$2')
    .replace(/×|∗/g, '*')
    .replace(/÷/g, '/')
    .replace(/به\s*علاوه|جمع|اضافه/g, '+')
    .replace(/منهای|تفریق/g, '-')
    .replace(/ضرب(?:در)?/g, '*')
    .replace(/تقسیم(?:بر)?/g, '/')
    .replace(/چند\s*م[یي]\s*ش[و]?[د]?|مساوی\s*است\s*با|برابر\s*است\s*با|مساوی|برابر|=|\?/g, ' ')
    .replace(/فقط\s*عدد.*/g, ' ')
    .replace(/[^\d+\-*/().\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeEval(expr) {
  if (!/^[\d+\-*/().\s]+$/.test(expr)) return null;
  if (!/\d/.test(expr) || !/[+\-*/]/.test(expr)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${expr});`)();
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    return Number.isInteger(value) ? value : Math.round(value * 1000) / 1000;
  } catch {
    return null;
  }
}

/** فقط وقتی متن تقریباً یک عبارت ریاضی خالص است */
export function isPureMathQuestion(text) {
  if (!text?.trim()) return false;
  if (CONCEPT_WORDS.test(text)) return false;

  const original = text.trim();
  if ((original.match(/[؟?]/g) || []).length > 1) return false;
  if (/\n\s*\d+[.)\-]/.test(original)) return false;

  const normalized = normalizeMathText(original);
  if (!normalized || !/[+\-*/]/.test(normalized) || !/\d/.test(normalized)) return false;

  const stripped = toEnglishDigits(original)
    .replace(/[۰-۹0-9+\-*/().×÷∗xX=؟?\s]/g, '')
    .replace(/بهعلاوه|جمع|اضافه|منهای|تفریق|ضربدر|ضرب|تقسیمبر|تقسیم|چندمیشود|چندمی شود|مساویاستبا|برابراستبا|مساوی|برابر|فقطعدد|محاسبه|حساب|کن|بکن|چیست|چقدر/gi, '');

  if (stripped.replace(/\s+/g, '').length > 8) return false;

  return safeEval(normalized) !== null;
}

/** تلاش برای حل ریاضی ساده از متن فارسی/انگلیسی */
export function trySolveMath(text, { force = false } = {}) {
  if (!text?.trim()) return null;
  if (!force && !isPureMathQuestion(text)) return null;

  const normalized = normalizeMathText(text);
  if (!normalized) return null;

  const result = safeEval(normalized);
  if (result === null) return null;

  return {
    expression: normalized,
    result,
    answer: formatMathAnswer(text, normalized, result),
  };
}

function formatMathAnswer(original, expression, result) {
  const exprFa = toPersianDigits(expression.replace(/\*/g, ' × ').replace(/\//g, ' ÷ '));
  return wrapAnswer(
    original,
    `**راه‌حل:**
۱. عبارت: ${exprFa}
۲. اولویت عملگرها: پرانتز، بعد ضرب و تقسیم، بعد جمع و تفریق.`,
    finalAnswerLine(result)
  );
}
