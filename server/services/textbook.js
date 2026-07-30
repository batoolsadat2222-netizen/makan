import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getGradeLabel, getSubjectLabel } from '../data/curriculum/labels.js';
import { getTopicsForGrade, buildFallbackChapterContent, getTextbookTitle } from '../data/curriculum/topics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEXTBOOKS_DIR = path.join(__dirname, '..', 'data', 'textbooks');

const cache = new Map();

function textbookPath(grade, subject) {
  return path.join(TEXTBOOKS_DIR, String(grade), `${subject}.json`);
}

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function scoreChapter(chapter, queryTokens) {
  const blob = `${chapter.title} ${chapter.keywords?.join(' ') || ''} ${chapter.content}`.toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (blob.includes(token)) score += 2;
    if (chapter.keywords?.some((k) => k.includes(token) || token.includes(k))) score += 3;
  }
  return score;
}

function buildFallbackTextbook(grade, subject) {
  const topics = getTopicsForGrade(grade, subject);

  return {
    title: getTextbookTitle(grade, subject),
    publisher: 'سازمان پژوهش و برنامه‌ریزی آموزشی (برنامه درسی ملی)',
    year: '1403-1404',
    grade: String(grade),
    subject,
    fallback: true,
    chapters: topics.map((topic, i) => ({
      id: i + 1,
      title: topic,
      keywords: topic.split(/\s+/).filter((w) => w.length > 1),
      content: buildFallbackChapterContent(grade, subject, topic),
    })),
  };
}

export function loadTextbook(grade, subject) {
  if (!grade || !subject) return null;

  const key = `${grade}-${subject}`;
  if (cache.has(key)) return cache.get(key);

  const filePath = textbookPath(grade, subject);
  let book;

  if (fs.existsSync(filePath)) {
    try {
      book = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      book = buildFallbackTextbook(grade, subject);
    }
  } else {
    book = buildFallbackTextbook(grade, subject);
  }

  cache.set(key, book);
  return book;
}

export function searchRelevantChapters(grade, subject, queryText, limit = 4) {
  const book = loadTextbook(grade, subject);
  if (!book?.chapters?.length) return { book, chapters: [] };

  const tokens = tokenize(queryText);
  const scored = book.chapters
    .map((ch) => ({ chapter: ch, score: scoreChapter(ch, tokens) }))
    .sort((a, b) => b.score - a.score);

  const top = scored.filter((s) => s.score > 0).slice(0, limit);
  const chapters = top.length > 0
    ? top.map((s) => s.chapter)
    : book.chapters.slice(0, Math.min(limit, book.chapters.length));

  return { book, chapters };
}

export function buildTextbookContext(grade, subject, queryText) {
  const { book, chapters } = searchRelevantChapters(grade, subject, queryText);

  if (!book) return null;

  const gradeLabel = getGradeLabel(grade);
  const subjectLabel = getSubjectLabel(subject);

  const sections = chapters
    .map((ch) => `### فصل ${ch.id}: ${ch.title}\n${ch.content}`)
    .join('\n\n');

  return {
    bookTitle: book.title,
    publisher: book.publisher,
    year: book.year,
    gradeLabel,
    subjectLabel,
    fallback: !!book.fallback,
    sectionsText: sections,
    citationHint: `${book.title} — ${subjectLabel} · ${gradeLabel}`,
  };
}

export function listAvailableTextbooks() {
  const result = [];
  if (!fs.existsSync(TEXTBOOKS_DIR)) return result;

  for (const grade of fs.readdirSync(TEXTBOOKS_DIR)) {
    const gradeDir = path.join(TEXTBOOKS_DIR, grade);
    if (!fs.statSync(gradeDir).isDirectory()) continue;
    for (const file of fs.readdirSync(gradeDir)) {
      if (!file.endsWith('.json')) continue;
      const subject = file.replace('.json', '');
      const book = loadTextbook(grade, subject);
      result.push({
        grade,
        subject,
        title: book.title,
        gradeLabel: getGradeLabel(grade),
        subjectLabel: getSubjectLabel(subject),
        hasDetailedContent: !book.fallback,
      });
    }
  }
  return result;
}
