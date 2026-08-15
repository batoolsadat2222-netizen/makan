import { trySolveMath } from './localSolver.js';
import { matchKnowledge } from '../data/knowledge/curriculum.js';
import { searchRelevantChapters } from './textbook.js';
import { wrapAnswer, finalAnswerLine, toPersianDigits, cleanQuestionEcho } from './answerFormat.js';
import { detectCurriculum, detectSubjectFromText } from './detectCurriculum.js';
import { SUBJECT_LABELS } from '../data/curriculum/labels.js';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function toEnglishDigits(str) {
  return String(str)
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

function roundNice(n) {
  if (!Number.isFinite(n)) return null;
  return Number.isInteger(n) ? n : Math.round(n * 1000) / 1000;
}

function tokenizeFa(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/** پیدا کردن مرتبط‌ترین بخش جزوه برای یک سوال و ساخت پاسخ */
export function answerFromHandout(question, handoutText) {
  const handout = (handoutText || '').trim();
  const q = (question || '').trim();
  if (!handout || !q) return null;

  const stop = new Set([
    'این', 'آن', 'که', 'را', 'به', 'از', 'در', 'با', 'برای', 'یک', 'یا', 'تا',
    'چه', 'چی', 'است', 'هست', 'شود', 'کنید', 'کن', 'شرح', 'توضیح', 'تعریف',
    'سوال', 'پرسش', 'چیست', 'چرا', 'چگونه', 'کدام', 'نام', 'بنویس', 'بنویسید',
  ]);

  const chunks = handout
    .split(/\n{2,}|(?==== صفحه)|(?<=[.!؟?؛;])\s+(?=[^\n]{20,})/)
    .map((c) => c.replace(/^=== صفحه[^\n]*===\s*/i, '').trim())
    .filter((c) => c.replace(/\s+/g, '').length >= 18);

  const pool = chunks.length ? chunks : [handout.slice(0, 2500)];
  const qTokens = tokenizeFa(q).filter((t) => t.length > 2 && !stop.has(t));
  if (!qTokens.length) {
    const preview = handout.slice(0, 700).trim();
    return preview ? `طبق جزوه:\n${preview}` : null;
  }

  const scored = pool.map((chunk) => {
    const lower = chunk.toLowerCase();
    const set = new Set(tokenizeFa(chunk));
    let score = 0;
    for (const t of qTokens) {
      if (set.has(t)) score += t.length > 3 ? 3 : 2;
      else if (lower.includes(t)) score += 1;
    }
    if (/یعنی|عبارت است از|عبارتند از|تعریف|به معنای/.test(chunk)) score += 1;
    return { chunk, score };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score < 1) return null;

  const parts = [best.chunk];
  if (scored[1] && scored[1].score >= Math.max(2, best.score - 1) && scored[1].chunk !== best.chunk) {
    parts.push(scored[1].chunk);
  }
  let body = parts.join('\n\n').trim();
  if (body.length > 1400) body = `${body.slice(0, 1400).trim()}…`;
  return `طبق جزوه:\n${body}`;
}

/** پاسخ چندسوالی فقط از روی جزوه */
export function answerExamFromHandout(text, handoutText) {
  const handout = (handoutText || '').trim();
  const trimmed = (text || '').trim();
  if (!handout || !trimmed) return null;

  const questions = splitExamQuestions(trimmed);
  if (questions.length <= 1) {
    const one = answerFromHandout(trimmed, handout);
    if (!one) {
      return {
        answer: 'در جزوه بخش مرتبطی برای این سوال پیدا نشد. عکس واضح‌تری از جزوه بفرستید یا سوال را دقیق‌تر بنویسید.',
        provider: 'local-handout',
        answered: 0,
        total: 1,
      };
    }
    return { answer: one, provider: 'local-handout', answered: 1, total: 1 };
  }

  const blocks = [];
  let answered = 0;
  questions.forEach((q, i) => {
    const found = answerFromHandout(q, handout);
    if (found) {
      answered += 1;
      blocks.push(`### سوال ${toPersianDigits(i + 1)}\n${found}`);
    } else {
      blocks.push(`### سوال ${toPersianDigits(i + 1)}\nدر جزوه اشاره‌ای به این موضوع نشده.`);
    }
  });

  return {
    answer: `پاسخ طبق جزوه (${toPersianDigits(questions.length)} سوال):\n\n${blocks.join('\n\n---\n\n')}`,
    provider: 'local-handout',
    answered,
    total: questions.length,
  };
}

/** معادله خطی ساده: 2x+3=7 یا x-4=10 */
export function trySolveLinearEquation(text) {
  const compact = toEnglishDigits(text)
    .replace(/×/g, 'x')
    .replace(/\s+/g, '');

  const m = compact.match(/^([+-]?\d*)x([+-]\d+)=([+-]?\d+)$/i);
  if (!m) return null;
  return solveLinear(m[1], m[2], m[3], text);
}

function solveLinear(aRaw, bRaw, cRaw, original) {
  const a = aRaw === '' || aRaw === '+' ? 1 : aRaw === '-' ? -1 : Number(aRaw);
  const b = Number(String(bRaw).replace(/\s+/g, ''));
  const c = Number(cRaw);
  if (![a, b, c].every(Number.isFinite) || a === 0) return null;
  const x = roundNice((c - b) / a);
  if (x === null) return null;
  return {
    answer: wrapAnswer(
      original,
      `**راه‌حل معادله:**
۱. ${toPersianDigits(`${formatCoeff(a)}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}`)}
۲. عدد ثابت را به طرف دیگر می‌بریم: ${toPersianDigits(`${formatCoeff(a)}x = ${c - b}`)}
۳. دو طرف را بر ${toPersianDigits(a)} تقسیم می‌کنیم.`,
      finalAnswerLine(`x = ${x}`)
    ),
  };
}

function formatCoeff(a) {
  if (a === 1) return '';
  if (a === -1) return '-';
  return String(a);
}

/** درصد: ۲۰ درصد از ۵۰ */
export function trySolvePercent(text) {
  const t = toEnglishDigits(text);
  const m = t.match(/(\d+(?:\.\d+)?)\s*(?:در\s*صد|٪|%)\s*(?:از)?\s*(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const p = Number(m[1]);
  const n = Number(m[2]);
  const result = roundNice((p / 100) * n);
  if (result === null) return null;
  return {
    answer: wrapAnswer(
      text,
      `**راه‌حل:**
${toPersianDigits(p)} درصد از ${toPersianDigits(n)} = (${toPersianDigits(p)} ÷ ۱۰۰) × ${toPersianDigits(n)} = ${toPersianDigits(result)}`,
      finalAnswerLine(result)
    ),
  };
}

/** مساحت/محیط با دو عدد در متن */
export function trySolveGeometry(text) {
  const t = toEnglishDigits(text);
  const nums = [...t.matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
  if (nums.length < 1) return null;

  if (/مساحت\s*مستطیل|مستطیل.*مساحت/.test(t) && nums.length >= 2) {
    const [a, b] = nums;
    return geomAnswer(text, `مساحت مستطیل = ${a} × ${b}`, a * b);
  }
  if (/محیط\s*مستطیل|مستطیل.*محیط/.test(t) && nums.length >= 2) {
    const [a, b] = nums;
    return geomAnswer(text, `محیط مستطیل = ۲ × (${a} + ${b})`, 2 * (a + b));
  }
  if (/مساحت\s*مربع|مربع.*مساحت/.test(t) && nums.length >= 1) {
    const [a] = nums;
    return geomAnswer(text, `مساحت مربع = ${a} × ${a}`, a * a);
  }
  if (/محیط\s*مربع|مربع.*محیط/.test(t) && nums.length >= 1) {
    const [a] = nums;
    return geomAnswer(text, `محیط مربع = ۴ × ${a}`, 4 * a);
  }
  if (/مساحت\s*مثلث|مثلث.*مساحت/.test(t) && nums.length >= 2) {
    const [a, b] = nums;
    return geomAnswer(text, `مساحت مثلث = (${a} × ${b}) ÷ ۲`, (a * b) / 2);
  }
  if (/(?:طول|عرض).*(?:طول|عرض)|در\s+اندازه|به\s*ابعاد/.test(t) && /مساحت/.test(t) && nums.length >= 2) {
    const [a, b] = nums;
    return geomAnswer(text, `مساحت = ${a} × ${b}`, a * b);
  }
  return null;
}

function geomAnswer(original, expression, result) {
  const r = roundNice(result);
  if (r === null) return null;
  return {
    answer: wrapAnswer(
      original,
      `**راه‌حل:**
${toPersianDigits(expression)} = ${toPersianDigits(r)}`,
      finalAnswerLine(r)
    ),
  };
}

/** فیزیک عددی ساده F=ma و V=IR و W=mg */
export function trySolvePhysicsFormula(text) {
  const t = toEnglishDigits(text);
  const nums = [...t.matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));

  if (/نیرو|F\s*=|اف\s*=/.test(t) && /جرم|شتاب|m\s*=|a\s*=/i.test(t) && nums.length >= 2) {
    const [m, a] = nums;
    const result = roundNice(m * a);
    return {
      answer: wrapAnswer(
        text,
        `**فرمول:** F = m × a
**محاسبه:** ${toPersianDigits(m)} × ${toPersianDigits(a)} = ${toPersianDigits(result)}`,
        finalAnswerLine(result, 'نیوتن')
      ),
    };
  }

  if (/ولتاژ|مقاومت|جریان|قانون\s*اهم|V\s*=|I\s*=|R\s*=/i.test(t) && nums.length >= 2) {
    if (/ولتاژ|V\s*=/i.test(t) && /جریان|مقاومت/.test(t)) {
      const [i, r] = nums;
      const result = roundNice(i * r);
      return {
        answer: wrapAnswer(
          text,
          `**فرمول:** V = I × R
**محاسبه:** ${toPersianDigits(i)} × ${toPersianDigits(r)} = ${toPersianDigits(result)}`,
          finalAnswerLine(result, 'ولت')
        ),
      };
    }
  }

  if (/وزن/.test(t) && /جرم/.test(t) && nums.length >= 1) {
    const m = nums[0];
    const g = nums[1] && nums[1] > 5 && nums[1] < 15 ? nums[1] : 10;
    const result = roundNice(m * g);
    return {
      answer: wrapAnswer(
        text,
        `**فرمول:** W = m × g
**محاسبه:** ${toPersianDigits(m)} × ${toPersianDigits(g)} = ${toPersianDigits(result)}`,
        finalAnswerLine(result, 'نیوتن')
      ),
    };
  }

  return null;
}

function textbookAnswerFromChapters(text, chapters, book) {
  if (!chapters?.length) return null;
  const best = chapters[0];
  if (!best?.content || best.content.length < 40) return null;
  // محتوای ساختگی/fallback را به‌عنوان جواب برنگردان
  if (/فقط مطالب همین پایه|پاسخ را مطابق کتاب|این بخش:/.test(best.content)) return null;
  if (book?.fallback) return null;
  if (!best?.score || best.score < 6) return null;

  // فقط همان فصل مرتبط — چند فصل قاطی جواب غلط می‌دهد
  const body = best.content.length > 900 ? `${best.content.slice(0, 900).trim()}…` : best.content;

  return wrapAnswer(text, body);
}

export function answerFromTextbook(text, grade, subject) {
  if (!text?.trim()) return null;

  // فقط همان پایه و درس — جستجوی بین‌کتابی باعث جواب غلط می‌شود
  if (!grade || !subject) return null;

  const { book, chapters } = searchRelevantChapters(grade, subject, text, 3);
  if (!book || !chapters.length) return null;

  // فصل باید واقعاً مرتبط باشد
  const best = chapters[0];
  if (!best?.score || best.score < 6) return null;

  return textbookAnswerFromChapters(text, chapters, book);
}

/** جدا کردن سوالات یک برگه از روی متن OCR یا تایپ‌شده */
export function splitExamQuestions(text) {
  const cleaned = String(text || '').replace(/\r/g, '').trim();
  if (!cleaned) return [];

  const numbered = cleaned
    .split(/(?=^[\t ]*(?:\d{1,2}|[۰-۹]{1,2})[\t ]*[.)\-–:،]\s*)/m)
    .map((s) => s.trim())
    .filter((s) => s.replace(/\s+/g, '').length >= 3);

  if (numbered.length >= 2) return numbered.slice(0, 25);

  const byBlank = cleaned
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter((s) => s.replace(/\s+/g, '').length >= 5);
  if (byBlank.length >= 2) return byBlank.slice(0, 25);

  const lines = cleaned.split('\n').map((s) => s.trim()).filter(Boolean);
  const useful = lines.filter((line) =>
    /[\d۰-۹].*[+\-×÷*/=]|[+\-×÷*/=].*[\d۰-۹]/.test(line)
    || /چیست|کنید|حساب|محاسبه|تعریف|توضیح|چرا|چگونه|مساحت|محیط|درصد|معادله/.test(line)
    || line.length >= 12
  );
  if (useful.length >= 2) return useful.slice(0, 25);

  return [cleaned];
}

function stripOuterQuestionLabel(answer) {
  return String(answer || '')
    .replace(/^\*\*سوال:\*\*\s*[^\n]*\n+/i, '')
    .trim();
}

/**
 * پاسخ به همه سوالات برگه (یکی‌یکی) — فقط اگر همه را مطمئن جواب داد
 * اگر حتی یک سوال بدون جواب محلی ماند → null تا AI کل برگه را جواب دهد
 */
export function answerExamSheet({ text = '', subject = '', grade = '' } = {}) {
  const questions = splitExamQuestions(text);
  if (!questions.length) return null;

  const blocks = [];
  let answered = 0;
  const subjectsUsed = new Set();

  for (let index = 0; index < questions.length; index += 1) {
    const q = questions[index];
    const n = toPersianDigits(index + 1);
    const perQ = detectCurriculum({ text: q, subject: '', grade: grade || '' });
    const qSubject = detectSubjectFromText(q) || perQ.subject || subject;
    const qGrade = perQ.grade || grade;
    if (qSubject) subjectsUsed.add(qSubject);

    const result = askLocalTutor({
      text: q,
      subject: qSubject,
      grade: qGrade,
      usedOcr: false,
      single: true,
    });

    if (!result?.answer?.trim()) {
      // ناقص = AI باید کل برگه را جواب بدهد
      return null;
    }

    answered += 1;
    const subjectTag = qSubject && SUBJECT_LABELS[qSubject]
      ? ` · ${SUBJECT_LABELS[qSubject]}`
      : '';
    blocks.push(`### سوال ${n}${subjectTag}\n\n${stripOuterQuestionLabel(result.answer)}`);
  }

  if (answered === 0 || answered < questions.length) return null;

  const subjectList = [...subjectsUsed]
    .map((id) => SUBJECT_LABELS[id] || id)
    .filter(Boolean);
  const subjectLine = subjectList.length
    ? `دروس تشخیص‌داده‌شده: ${subjectList.join('، ')}\n\n`
    : '';

  const header = questions.length > 1
    ? `پاسخ به **${toPersianDigits(questions.length)}** سوال برگه:\n\n${subjectLine}`
    : subjectLine;

  return {
    answer: `${header}${blocks.join('\n\n---\n\n')}`,
    provider: 'local-exam',
    answered,
    total: questions.length,
  };
}

/**
 * پاسخ محلی مطمئن برای یک سوال — اولویت با دقت
 */
export function askLocalTutor({
  text = '',
  subject = '',
  grade = '',
  usedOcr = false,
  single = false,
  handoutText = '',
} = {}) {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;

  const handout = (handoutText || '').trim();

  // حالت جزوه: فقط از متن جزوه — هرگز دانش/کتاب عمومی
  if (handout) {
    return answerExamFromHandout(trimmed, handout);
  }

  // برگه چندسوالی/OCR: فقط اگر همه سوالات محلی و کامل جواب شدند
  if (!single && (usedOcr || splitExamQuestions(trimmed).length > 1)) {
    const sheet = answerExamSheet({ text: trimmed, subject, grade });
    if (sheet && sheet.answered === sheet.total && sheet.answered > 0) {
      return sheet;
    }
    // ناقص → null تا مسیر AI جواب واقعی بدهد
  }

  // حذف شماره سوال مثل «۲.» یا «3)»
  const cleaned = trimmed
    .replace(/^[\t ]*(?:\d{1,2}|[۰-۹]{1,2})[\t ]*[.)\-–:،]\s*/, '')
    .trim() || trimmed;

  // اگر کاربر درس/پایه داده همان اولویت دارد؛ در غیر این صورت از سوال حدس بزن
  const detected = detectCurriculum({
    text: cleaned,
    subject: subject || detectSubjectFromText(cleaned) || '',
    grade,
  });
  const useSubject = detected.subject || subject;
  const useGrade = detected.grade || grade;

  const math = trySolveMath(cleaned);
  if (math) return { answer: math.answer, provider: 'local-math' };

  const eq = trySolveLinearEquation(cleaned);
  if (eq) return { answer: eq.answer, provider: 'local-math' };

  const percent = trySolvePercent(cleaned);
  if (percent) return { answer: percent.answer, provider: 'local-math' };

  const geo = trySolveGeometry(cleaned);
  if (geo) return { answer: geo.answer, provider: 'local-math' };

  const phys = trySolvePhysicsFormula(cleaned);
  if (phys) return { answer: phys.answer, provider: 'local-physics' };

  const known = matchKnowledge(cleaned);
  if (known) return { answer: known, provider: 'local-knowledge' };

  if (/^[\d۰-۹\s+\-×÷*/()=.xX]+$/.test(cleaned)) {
    return null;
  }

  const fromBook = answerFromTextbook(cleaned, useGrade, useSubject);
  if (fromBook) return { answer: fromBook, provider: 'local-textbook' };

  return null;
}
