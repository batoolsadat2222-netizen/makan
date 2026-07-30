/** قالب یکدست و خوانا برای پاسخ‌های محلی */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toPersianDigits(value) {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/** متن سوال را کوتاه و تمیز برای نمایش نگه می‌دارد */
export function cleanQuestionEcho(text, max = 90) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/[^\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9۰-۹٠-٩+\-*/×÷=().,?!؟،:;%٪\s]/g, '')
    .trim();
  if (!clean) return '';
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

export function wrapAnswer(question, body, finalLine = '') {
  const q = cleanQuestionEcho(question);
  const parts = [];
  if (q) parts.push(`**سوال:** ${q}`);
  parts.push(body.trim());
  if (finalLine) parts.push(finalLine.trim());
  return parts.join('\n\n');
}

export function finalAnswerLine(value, unit = '') {
  const shown = toPersianDigits(value);
  const u = unit ? ` ${unit}` : '';
  return `**پاسخ نهایی:** ${shown}${u}`;
}
