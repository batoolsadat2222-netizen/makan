import { buildPromptContext as baseContext, SUBJECT_LABELS, GRADE_LABELS } from '../data/curriculum/labels.js';

export { SUBJECT_LABELS, GRADE_LABELS };

export function buildPromptContext(params = {}) {
  const ctx = baseContext(params);
  return {
    ...ctx,
    subject: params.subject,
    grade: params.grade,
    answerMode: params.answerMode || 'full',
    textbook: params.textbook || null,
  };
}

export function getSystemPrompt(params = {}) {
  const ctx = buildPromptContext(params);
  const { contextLine, answerMode } = ctx;

  let prompt = `تو معلم فارسی‌زبان هستی. به سوالات درسی دانش‌آموز پاسخ می‌دهی.

قوانین مهم:
1. فقط جواب درست و مختصر بنویس — مناسب سطح همان پایه.
2. به هر سوال جداگانه پاسخ بده (سوال ۱، ۲، ...).
3. از محتوای کتاب درسی داخل پیام برای دقت استفاده کن، اما **هرگز منبع، فصل، نام کتاب، ناشر یا عبارت‌هایی مثل «پاسخ تکمیلی» ننویس**.
4. حرف اضافه نزن — فقط آنچه دانش‌آموز برای حل و امتحان نیاز دارد.
5. زبان ساده و مستقیم.
6. اگر درس یا پایه مشخص شده همان را رعایت کن؛ وگرنه از روی سوال تشخیص بده و بهترین پاسخ را بده.`;

  const g = parseInt(params.grade, 10);
  if (g <= 3) {
    prompt += `\n7. پایه ۱ تا ۳: جملات خیلی کوتاه.`;
  } else if (g <= 6) {
    prompt += `\n7. دبستان: کوتاه و ساده.`;
  } else if (g <= 9) {
    prompt += `\n7. متوسطه اول: مختصر و دقیق.`;
  } else {
    prompt += `\n7. متوسطه دوم: علمی ولی بدون پرگویی.`;
  }

  if (contextLine) {
    prompt += `\n${contextLine}`;
  }

  if (answerMode === 'guide') {
    prompt += `\n\nحالت راهنما: فقط ۲–۳ قدم کوتاه برای حل. جواب نهایی را مستقیم ننویس.`;
  } else {
    prompt += `\n\nحالت پاسخ کامل: برای ریاضی چند قدم کوتاه + جواب نهایی؛ برای بقیه دروس پاسخ مستقیم و کوتاه.`;
  }

  return prompt;
}

function textbookBlock(textbook) {
  if (!textbook?.sectionsText) return '';
  return `\n\n---\nمحتوای مرجع (فقط برای دقت پاسخ — در پاسخ به دانش‌آموز ذکر نکن):\n\n${textbook.sectionsText}\n---\n`;
}

export function getImagePrompt(params = {}, extraText) {
  let prompt = `برگه امتحان در عکس است.

وظیفه:
1. همه سوالات برگه را بخوان (از روی عکس و در صورت وجود از متن OCR).
2. به تک‌تک سوالات جداگانه پاسخ بده — هیچ سوالی را جا نینداز.
3. فرمت پاسخ:
### سوال ۱
...
### سوال ۲
...
4. پاسخ‌ها مختصر، درست و مناسب پایه دانش‌آموز باشد.`;
  prompt += textbookBlock(params.textbook);

  if (extraText?.trim()) {
    prompt += `\n\nمتن کمکی OCR (ممکن است ناقص باشد؛ با عکس تطبیق بده):\n${extraText.trim()}`;
  }

  return prompt;
}

export function getTextPrompt(params = {}, text) {
  let prompt = `سوالات برگه:\n${text}`;
  prompt += textbookBlock(params.textbook);
  prompt += `\n\nاگر چند سوال هست، به همه جداگانه پاسخ بده (سوال ۱، ۲، ...). هیچ سوالی را جا نینداز. مختصر، درست، بدون ذکر منبع.`;
  return prompt;
}
