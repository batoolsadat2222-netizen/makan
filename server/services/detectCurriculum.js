import { SUBJECT_LABELS, GRADE_LABELS, getSubjectsForGrade } from '../data/curriculum/labels.js';

/** الگوهای تشخیص درس با امتیاز — الگوهای پهن وزن کم دارند */
const SUBJECT_PATTERNS = [
  ['math', /ریاضی|معادله|کسر|مساحت|محیط|جذر|توان|فیثاغورث|دلتا|احتمال|میانگین|ب م م|ک م م|درصد\s*از/, 4],
  ['math', /(?:^|[^\d])[\d۰-۹]+\s*[+\-×÷*/=]\s*[\d۰-۹]+/, 2],
  ['physics', /فیزیک|نیوتن|شتاب|ولتاژ|مقاومت|گرانش|لختی|ژول|وات|آمپر|قانون\s*اهم|F\s*=\s*m/, 5],
  ['chemistry', /شیمی|جدول\s*تناوبی|اسید|قلیا|یون|واکنش\s*شیمیایی|مول|پی\s*اچ|pH/, 5],
  ['biology', /زیست|فتوسنتز|یاخته|DNA|ژن|قلب|تنفس\s*سلولی|میتوکندری|کلروپلاست|وراثت/, 5],
  ['biology', /(?<![ا-ی])سلول(?![ا-ی])/, 3],
  ['persian', /فارسی|املا|شعر|آرایه|فاعل|مفعول|مسند|نهاد|تشبیه|استعاره|کنایه|قید|صفت/, 4],
  ['english', /english|انگلیسی|grammar|vocabulary|present\s*simple|past\s*simple|to be|ترجمه\s*انگلیسی/i, 5],
  ['arabic', /عربی|فعل\s*ماضی|فعل\s*مضارع|اعراب|صرف\s*فعل|جمع\s*مکسر/, 5],
  ['social', /مطالعات|جغرافیا|تاریخ|نقشه|تمدن|هخامنشی|قاره|آب\s*و\s*هوا|قانون\s*اساسی/, 4],
  ['quran', /قرآن|سوره|آیه|تجوید|قرائت/, 5],
  ['heaven', /هدیه‌های\s*آسمان|پیامبر|امامت|اخلاق\s*اسلامی/, 4],
  ['writing', /نگارش|خلاصه‌نویسی|نامه‌نگاری/, 4],
  ['writing', /(?<!کلمه\s)انشا(?![ا-ی])/, 3],
  ['science', /علوم\s*تجربی|مغناطیس|چرخه\s*آب|حالت\s*ماده/, 3],
  ['science', /گیاه|جانور|آزمایش|جامد|مایع|گاز|انرژی/, 2],
  ['art', /هنر|رنگ‌آمیزی|طراحی|نقاشی/, 2],
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
  // آستانه: حدس ضعیف را نادیده بگیر
  if (bestScore < 3) return null;
  return best;
}

export function detectCurriculum({ text = '', subject = '', grade = '' } = {}) {
  const t = String(text || '');
  let detectedSubject = subject ? String(subject) : '';
  let detectedGrade = grade ? String(grade) : '';
  const autoSubject = !detectedSubject;
  const autoGrade = !detectedGrade;

  if (!detectedSubject) {
    detectedSubject = detectSubjectFromText(t) || '';
  }

  if (!detectedGrade) {
    // فقط وقتی پایه صریح در متن آمده
    const explicit = [
      [12, /پایه\s*دوازدهم|کلاس\s*دوازدهم|سال\s*دوازدهم|دوازدهم\s*متوسطه/],
      [11, /پایه\s*یازدهم|کلاس\s*یازدهم|سال\s*یازدهم/],
      [10, /پایه\s*دهم|کلاس\s*دهم|سال\s*دهم/],
      [9, /پایه\s*نهم|کلاس\s*نهم|سال\s*نهم/],
      [8, /پایه\s*هشتم|کلاس\s*هشتم|سال\s*هشتم/],
      [7, /پایه\s*هفتم|کلاس\s*هفتم|سال\s*هفتم|سال\s*اول\s*متوسطه/],
      [6, /پایه\s*ششم|کلاس\s*ششم/],
      [5, /پایه\s*پنجم|کلاس\s*پنجم/],
      [4, /پایه\s*چهارم|کلاس\s*چهارم/],
      [3, /پایه\s*سوم|کلاس\s*سوم/],
      [2, /پایه\s*دوم|کلاس\s*دوم/],
      [1, /پایه\s*اول(?!\s*متوسطه)|کلاس\s*اول(?!\s*متوسطه)/],
    ];
    for (const [g, re] of explicit) {
      if (re.test(t)) {
        detectedGrade = String(g);
        break;
      }
    }
    // فقط نشانه‌های خیلی قوی دبیرستان
    if (!detectedGrade) {
      if (/مشتق|انتگرال|ماتریس|مثلثات\s* پیشرفته/.test(t)) detectedGrade = '11';
    }
  }

  // اگر کاربر پایه نداده و حدس قوی نیست، خالی بگذار — AI از روی سوال تشخیص دهد
  if (detectedGrade && !GRADE_LABELS[detectedGrade]) detectedGrade = '';

  if (detectedGrade && detectedSubject) {
    const allowed = getSubjectsForGrade(detectedGrade);
    if (!allowed.includes(detectedSubject)) {
      // فقط اگر کاربر خودش درس را انتخاب نکرده، remap کن
      if (autoSubject) {
        detectedSubject = (['physics', 'chemistry', 'biology'].includes(detectedSubject) && allowed.includes('science'))
          ? 'science'
          : (allowed.includes(detectedSubject) ? detectedSubject : '');
      }
    }
  }

  return {
    subject: detectedSubject || '',
    grade: detectedGrade || '',
    subjectLabel: detectedSubject ? (SUBJECT_LABELS[detectedSubject] || detectedSubject) : '',
    gradeLabel: detectedGrade ? (GRADE_LABELS[detectedGrade] || detectedGrade) : '',
    autoSubject,
    autoGrade,
  };
}
