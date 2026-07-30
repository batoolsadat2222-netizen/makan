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

export const GRADE_GROUPS = [
  {
    label: '── دبستان ──',
    grades: [
      { id: '1', label: 'اول ابتدایی' },
      { id: '2', label: 'دوم ابتدایی' },
      { id: '3', label: 'سوم ابتدایی' },
      { id: '4', label: 'چهارم ابتدایی' },
      { id: '5', label: 'پنجم ابتدایی' },
      { id: '6', label: 'ششم ابتدایی' },
    ],
  },
  {
    label: '── متوسطه اول ──',
    grades: [
      { id: '7', label: 'هفتم' },
      { id: '8', label: 'هشتم' },
      { id: '9', label: 'نهم' },
    ],
  },
  {
    label: '── متوسطه دوم ──',
    grades: [
      { id: '10', label: 'دهم' },
      { id: '11', label: 'یازدهم' },
      { id: '12', label: 'دوازدهم' },
    ],
  },
];

export const GRADES = GRADE_GROUPS.flatMap((g) => g.grades);

const SUBJECTS_BY_LEVEL = {
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
  const ids = SUBJECTS_BY_LEVEL[getGradeLevel(grade)] || SUBJECTS_BY_LEVEL.high;
  return ids.map((id) => ({ id, label: SUBJECT_LABELS[id] }));
}

export const SUBJECTS = Object.entries(SUBJECT_LABELS).map(([id, label]) => ({ id, label }));

export const ANSWER_MODES = [
  { id: 'full', label: 'پاسخ کامل', desc: 'توضیح + جواب نهایی' },
  { id: 'guide', label: 'راهنمای حل', desc: 'فقط مراحل، بدون جواب مستقیم' },
];

export const PHOTO_TIPS = [
  'نور کافی داشته باش — سایه روی برگه نباشد',
  'برگه صاف و واضح در کادر باشد',
  'کل سوالات در عکس دیده شوند',
];
