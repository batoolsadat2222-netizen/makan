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

function clipHandout(handoutText, max = 24000) {
  const t = (handoutText || '').trim();
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max)}\n…` : t;
}

export function getSystemPrompt(params = {}) {
  const ctx = buildPromptContext(params);
  const { contextLine, answerMode } = ctx;
  const hasHandout = Boolean(params.handoutText?.trim());
  const hasGrade = Boolean(params.grade && GRADE_LABELS[params.grade]);
  const hasSubject = Boolean(params.subject && SUBJECT_LABELS[params.subject]);

  let prompt = hasHandout
    ? `تو معلم فارسی‌زبان هستی. این یک امتحان «فقط طبق جزوه» است.

قوانین اجباری:
1. فقط و فقط از متن جزوه زیر پایین همین پیام / پیام کاربر جواب بده.
2. هیچ دانش بیرونی، حفظی، یا کتاب درسی اضافه نکن — حتی اگر مطمئنی درست است.
3. اگر جواب در جزوه نیست دقیقاً بنویس: «در جزوه اشاره‌ای به این موضوع نشده.»
4. به هر سوال جداگانه جواب بده (### سوال ۱، ### سوال ۲، ...).
5. پاسخ را کوتاه و قابل‌استفاده برای برگه بنویس.
6. نام کتاب/ناشر/فصل ننویس؛ بگو طبق جزوه.

متن جزوه (منبع اجباری):
---
${clipHandout(params.handoutText, 18000)}
---`
    : `تو معلم فارسی‌زبان نظام آموزشی ایران هستی. پاسخ باید **دقیق، درست و مطابق برنامه درسی همان پایه و درس** باشد.

قوانین مهم:
1. فقط جواب درست بنویس — هیچ حدس یا اطلاعات اشتباهی ننویس.
2. اگر پایه/درس مشخص شده، پاسخ را دقیقاً برای همان پایه و همان درس بده.
3. اگر پایه یا درس مشخص نیست، از روی خود سوال تشخیص بده؛ اگر مطمئن نیستی ادعای پایه غلط نکن.
4. به هر سوال جداگانه پاسخ بده (سوال ۱، ۲، ...). هیچ سوالی را جا نینداز.
5. از محتوای مرجع کتاب داخل پیام فقط برای دقت استفاده کن؛ **هرگز** نام کتاب، فصل یا ناشر ننویس.
6. اگر متن OCR با عکس فرق دارد، **عکس اولویت دارد**.
7. حرف اضافه نزن — فقط آنچه برای امتحان لازم است.
8. زبان ساده و مستقیم فارسی.`;

  if (!hasHandout) {
    const g = parseInt(params.grade, 10);
    if (hasGrade) {
      if (g <= 3) prompt += `\n9. سطح پایه ۱ تا ۳: جملات خیلی کوتاه و کودکانه.`;
      else if (g <= 6) prompt += `\n9. سطح دبستان: کوتاه و ساده.`;
      else if (g <= 9) prompt += `\n9. سطح متوسطه اول: مختصر و دقیق.`;
      else prompt += `\n9. سطح متوسطه دوم: علمی ولی بدون پرگویی.`;
    }

    if (hasSubject || hasGrade) {
      prompt += `\n\nالزام کاربر: ${[
        hasSubject ? `درس=${SUBJECT_LABELS[params.subject]}` : null,
        hasGrade ? `پایه=${GRADE_LABELS[params.grade]}` : null,
      ].filter(Boolean).join(' · ')}`;
    } else if (contextLine) {
      prompt += `\n${contextLine}`;
    }
  }

  if (answerMode === 'guide') {
    prompt += `\n\nحالت راهنما: فقط ۲–۳ قدم کوتاه. جواب نهایی را مستقیم ننویس.`;
  } else {
    prompt += `\n\nحالت پاسخ کامل: برای ریاضی چند قدم کوتاه + جواب نهایی؛ برای بقیه پاسخ مستقیم و کوتاه.`;
  }

  return prompt;
}

function textbookBlock(textbook) {
  if (!textbook?.sectionsText) return '';
  return `\n\n---\nمحتوای مرجع (فقط برای دقت پاسخ — در پاسخ ذکر نکن):\n\n${textbook.sectionsText}\n---\n`;
}

function handoutBlock(handoutText) {
  if (!handoutText?.trim()) return '';
  return `\n\n---\nمتن جزوه (تنها منبع مجاز پاسخ):\n\n${clipHandout(handoutText)}\n---\n`;
}

export function getImagePrompt(params = {}, extraText) {
  const hasHandout = Boolean(params.handoutText?.trim());
  let prompt = hasHandout
    ? `عکس برگه امتحان است. معلم گفته فقط از روی جزوه جواب بده.

وظیفه:
1. همه سوالات را از روی عکس بخوان.
2. فقط با متن جزوه به هر سوال جداگانه پاسخ بده.
3. فرمت:
### سوال ۱
...
### سوال ۲
...
4. اگر در جزوه نبود بگو: در جزوه اشاره‌ای به این موضوع نشده.`
    : `برگه امتحان در عکس است.

وظیفه:
1. همه سوالات برگه را از روی عکس بخوان.
2. اگر متن OCR هم هست فقط کمکی است — اولویت با عکس است.
3. به تک‌تک سوالات جداگانه پاسخ بده.
4. فرمت:
### سوال ۱
...
### سوال ۲
...
5. پاسخ‌ها مختصر، درست و مناسب پایه/درس باشد.`;

  if (hasHandout) prompt += handoutBlock(params.handoutText);
  else prompt += textbookBlock(params.textbook);

  if (extraText?.trim()) {
    prompt += `\n\nمتن کمکی OCR / توضیح کاربر:\n${extraText.trim()}`;
  }

  return prompt;
}

export function getTextPrompt(params = {}, text) {
  const hasHandout = Boolean(params.handoutText?.trim());
  const gradeHint = params.grade && GRADE_LABELS[params.grade]
    ? `پایه: ${GRADE_LABELS[params.grade]}`
    : '';
  const subjectHint = params.subject && SUBJECT_LABELS[params.subject]
    ? `درس: ${SUBJECT_LABELS[params.subject]}`
    : '';
  const scope = [gradeHint, subjectHint].filter(Boolean).join(' · ');

  if (hasHandout) {
    // اول جزوه، بعد سوال — مدل کمتر منحرف می‌شود
    let prompt = `متن جزوه (تنها منبع مجاز):\n${clipHandout(params.handoutText)}\n\n`;
    prompt += `سوالات امتحان (فقط طبق جزوه بالا جواب بده):\n${text}`;
    prompt += `\n\nقوانین: فقط از جزوه. اگر نبود بگو در جزوه اشاره‌ای نشده. به همه سوالات جداگانه با ### سوال ۱ و ... پاسخ بده.`;
    return prompt;
  }

  let prompt = `سوالات برگه${scope ? ` (${scope})` : ''}:\n${text}`;
  prompt += textbookBlock(params.textbook);
  prompt += `\n\nاگر چند سوال هست به همه جداگانه پاسخ بده (سوال ۱، ۲، ...). مختصر، درست، مطابق پایه/درس، بدون ذکر منبع.`;
  return prompt;
}
