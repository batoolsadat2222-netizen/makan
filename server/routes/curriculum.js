import { Router } from 'express';
import { listAvailableTextbooks, loadTextbook } from '../services/textbook.js';
import {
  SUBJECT_LABELS,
  GRADE_LABELS,
  GRADE_GROUPS,
  getSubjectsForGrade,
} from '../data/curriculum/labels.js';

const router = Router();

router.get('/subjects', (req, res) => {
  const { grade } = req.query;
  if (grade) {
    const subjects = getSubjectsForGrade(grade).map((id) => ({
      id,
      label: SUBJECT_LABELS[id],
    }));
    return res.json({ subjects, grade, gradeLabel: GRADE_LABELS[grade] });
  }
  res.json({
    subjects: Object.entries(SUBJECT_LABELS).map(([id, label]) => ({ id, label })),
    grades: Object.entries(GRADE_LABELS).map(([id, label]) => ({ id, label })),
    gradeGroups: GRADE_GROUPS.map((g) => ({
      label: g.label,
      grades: g.grades.map((id) => ({ id, label: GRADE_LABELS[id] })),
    })),
  });
});

router.get('/textbook', (req, res) => {
  const { grade, subject } = req.query;
  if (!grade || !subject) {
    return res.status(400).json({ error: 'پارامتر grade و subject لازم است.' });
  }
  if (!GRADE_LABELS[grade]) {
    return res.status(400).json({ error: 'پایه تحصیلی نامعتبر است.' });
  }
  if (!SUBJECT_LABELS[subject]) {
    return res.status(400).json({ error: 'درس نامعتبر است.' });
  }
  const allowed = getSubjectsForGrade(grade);
  if (!allowed.includes(subject)) {
    return res.status(400).json({ error: 'این درس برای این پایه تعریف نشده است.' });
  }
  const book = loadTextbook(grade, subject);
  if (!book) return res.status(404).json({ error: 'کتاب یافت نشد.' });
  res.json({
    title: book.title,
    publisher: book.publisher,
    year: book.year,
    grade,
    subject,
    chapterCount: book.chapters?.length || 0,
    hasDetailedContent: !book.fallback,
  });
});

router.get('/textbooks', (_req, res) => {
  res.json({ textbooks: listAvailableTextbooks() });
});

export default router;
