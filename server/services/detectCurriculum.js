import { SUBJECT_LABELS, GRADE_LABELS, getSubjectsForGrade } from '../data/curriculum/labels.js';

/** الگوهای تشخیص درس با امتیاز */
const SUBJECT_PATTERNS = [
  ['math', /ریاضی|معادله|کسر|مساحت|محیط|جذر|توان|فیثاغورث|دلتا|احتمال|میانگین|ب م م|ک م م|[\d۰-۹]+\s*[+\-×÷*/=]|درصد\s*از/, 3],
  ['physics', /فیزیک|نیوتن|شتاب|ولتاژ|مقاومت|گرانش|لختی|ژول|وات|آمپر|قانون\s*اهم|F\s*=\s*m/, 4],
  ['chemistry', /شیمی|جدول\s*تناوبی|اسید|قلیا|یون|واکنش\s*شیمیایی|مول|پی\s*اچ|pH/, 4],
  ['biology', /زیست|فتوسنتز|سلول|یاخته|DNA|ژن|قلب|تنفس\s*سلولی|میتوکندری|کلروپلاست|وراثت/, 4],
  ['persian', /فارسی|املا|انشا|شعر|آرایه|فاعل|مفعول|مسند|نهاد|تشبیه|استعاره|کنایه|قید|صفت/, 4],
  ['english', /english|انگلیسی|grammar|vocabulary|present\s*simple|past\s*simple|to be|ترجمه\s*انگلیسی/i, 4],
  ['arabic', /عربی|فعل\s*ماضی|فعل\s*مضارع|اعراب|صرف\s*فعل|جمع\s*مکسر/, 4],
  ['social', /مطالعات|جغرافیا|تاریخ|نقشه|تمدن|هخامنشی|قاره|آب\s*و\s*هوا|قانون\s*اساسی/, 3],
  ['quran', /قرآن|سوره|آیه|تجوید|قرائت/, 4],
  ['heaven', /هدیه|پیامبر|نماز|روزه|امامت|اخلاق\s*اسلامی/, 3],
  ['writing', /نگارش|انشا|خلاصه‌نویسی|نامه‌نگاری/, 3],
  ['science', /علوم|انرژی|مغناطیس|گیاه|جانور|آزمایش|حالت\s*ماده|جامد|مایع|گاز|چرخه\s*آب/, 2],
  ['art', /هنر|رنگ|طراحی|نقاشی/, 2],
  ['philosophy', /فلسفه|منطق/, 3],
  ['economics', /اقتصاد|بازار|تورم|بودجه/, 3],
];

export function scoreSubjects(text) {
  const t = String(text || '');
  const scores = {};
  for (const [id, re, weight] of SUBJECT_PATTERNS) {
    const m = t.match(re);
    if (!m) continue;
    scores[id] = (scores[id] || 0) + weight + Math.min((m[0] || '').length / 4, 3);
  }
  return scores;
}

export function detectSubjectFromText(text) {
  const scores = scoreSubjects(text);
  let best = null;
  let bestScore = 0;
  for (const [id, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}

export function detectCurriculum({ text = '', subject = '', grade = '' } = {}) {
  const t = String(text || '');
  let detectedSubject = subject;
  let detectedGrade = grade ? String(grade) : '';
  const autoSubject = !detectedSubject;
  const autoGrade = !detectedGrade;

  if (!detectedSubject) {
    detectedSubject = detectSubjectFromText(t) || 'science';
  }

  if (!detectedGrade) {
    const gradeMap = [
      [12, /دوازدهم|پیش‌دانشگاهی/], [11, /یازدهم/], [10, /دهم/],
      [9, /نهم/], [8, /هشتم/], [7, /هفتم/],
      [6, /ششم/], [5, /پنجم/], [4, /چهارم/], [3, /سوم/], [2, /دوم/], [1, /اول/],
    ];
    for (const [g, re] of gradeMap) {
      if (re.test(t) && /پایه|کلاس|سال/.test(t)) {
        detectedGrade = String(g);
        break;
      }
    }
    if (!detectedGrade) {
      if (/مشتق|انتگرال|ماتریس|مثلثات/.test(t)) detectedGrade = '11';
      else if (['physics', 'chemistry', 'biology'].includes(detectedSubject)) detectedGrade = '10';
      else if (/کسر|مساحت|محیط|جدول ضرب/.test(t)) detectedGrade = '5';
      else if (/[\d۰-۹]+\s*[+\-×÷*/]\s*[\d۰-۹]+/.test(t) && t.length < 80) detectedGrade = '3';
      else if (detectedSubject === 'math') detectedGrade = '7';
      else if (detectedSubject === 'persian') detectedGrade = '7';
      else if (detectedSubject === 'arabic' || detectedSubject === 'english') detectedGrade = '8';
      else detectedGrade = '6';
    }
  }

  if (!GRADE_LABELS[detectedGrade]) detectedGrade = '6';
  const allowed = getSubjectsForGrade(detectedGrade);
  if (!allowed.includes(detectedSubject)) {
    detectedSubject = (['physics', 'chemistry', 'biology'].includes(detectedSubject) && allowed.includes('science'))
      ? 'science'
      : (allowed.includes('math') ? 'math' : allowed[0]);
  }

  return {
    subject: detectedSubject,
    grade: detectedGrade,
    subjectLabel: SUBJECT_LABELS[detectedSubject] || detectedSubject,
    gradeLabel: GRADE_LABELS[detectedGrade] || detectedGrade,
    autoSubject,
    autoGrade,
  };
}
