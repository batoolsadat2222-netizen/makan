export const SUBJECT_LABELS = {
  math: 'ریاضی',
  persian: 'فارسی',
  science: 'علوم',
  social: 'مطالعات اجتماعی',
  quran: 'قرآن',
  writing: 'نگارش',
  heaven: 'هدیه‌های آسمان',
  english: 'انگلیسی',
  arabic: 'عربی',
  art: 'هنر',
  thinking: 'تفکر و پژوهش',
  physics: 'فیزیک',
  chemistry: 'شیمی',
  biology: 'زیست‌شناسی',
  philosophy: 'فلسفه',
  economics: 'اقتصاد',
  other: 'سایر',
};

export const GRADE_LABELS = {
  1: 'اول ابتدایی',
  2: 'دوم ابتدایی',
  3: 'سوم ابتدایی',
  4: 'چهارم ابتدایی',
  5: 'پنجم ابتدایی',
  6: 'ششم ابتدایی',
  7: 'هفتم',
  8: 'هشتم',
  9: 'نهم',
  10: 'دهم',
  11: 'یازدهم',
  12: 'دوازدهم',
};

export const GRADE_GROUPS = [
  {
    id: 'elementary',
    label: 'دبستان (اول تا ششم)',
    grades: ['1', '2', '3', '4', '5', '6'],
  },
  {
    id: 'middle',
    label: 'متوسطه اول (هفتم تا نهم)',
    grades: ['7', '8', '9'],
  },
  {
    id: 'high',
    label: 'متوسطه دوم (دهم تا دوازدهم)',
    grades: ['10', '11', '12'],
  },
];

/** دروس مجاز هر مقطع */
export const SUBJECTS_BY_LEVEL = {
  elementary: ['math', 'persian', 'science', 'social', 'quran', 'writing', 'heaven', 'english', 'art', 'thinking'],
  middle: ['math', 'persian', 'science', 'social', 'english', 'arabic', 'quran', 'writing', 'heaven', 'art', 'thinking'],
  high: ['math', 'persian', 'science', 'social', 'english', 'arabic', 'physics', 'chemistry', 'biology', 'philosophy', 'economics', 'quran', 'writing', 'heaven', 'art', 'thinking', 'other'],
};

export function getGradeLevel(grade) {
  const g = parseInt(grade, 10);
  if (g <= 6) return 'elementary';
  if (g <= 9) return 'middle';
  return 'high';
}

export function getSubjectsForGrade(grade) {
  const level = getGradeLevel(grade);
  return SUBJECTS_BY_LEVEL[level] || SUBJECTS_BY_LEVEL.high;
}

export function getSubjectLabel(subject) {
  return SUBJECT_LABELS[subject] || subject;
}

export function getGradeLabel(grade) {
  return GRADE_LABELS[grade] || grade;
}

export function isElementary(grade) {
  return parseInt(grade, 10) <= 6;
}

export function buildPromptContext({ subject, grade, answerMode } = {}) {
  const parts = [];
  if (subject && SUBJECT_LABELS[subject]) {
    parts.push(`درس: ${SUBJECT_LABELS[subject]}`);
  }
  if (grade && GRADE_LABELS[grade]) {
    parts.push(`پایه تحصیلی: ${GRADE_LABELS[grade]}`);
  }
  return {
    subject,
    grade,
    answerMode: answerMode || 'full',
    contextLine: parts.length ? parts.join(' · ') : '',
    gradeLevel: grade ? getGradeLevel(grade) : null,
  };
}
