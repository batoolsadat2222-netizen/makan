import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

const DEFAULT = {
  totalQuestions: 0,
  totalFeedback: 0,
  helpfulYes: 0,
  helpfulNo: 0,
  bySubject: {},
  byGrade: {},
  daily: {},
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load() {
  ensureDataDir();
  if (!fs.existsSync(ANALYTICS_FILE)) return { ...DEFAULT };
  try {
    return { ...DEFAULT, ...JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf8')) };
  } catch {
    return { ...DEFAULT };
  }
}

function save(data) {
  ensureDataDir();
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function recordQuestion({ subject, grade }) {
  const data = load();
  data.totalQuestions += 1;

  if (subject) {
    data.bySubject[subject] = (data.bySubject[subject] || 0) + 1;
  }
  if (grade) {
    data.byGrade[grade] = (data.byGrade[grade] || 0) + 1;
  }

  const day = todayKey();
  data.daily[day] = (data.daily[day] || 0) + 1;

  save(data);
  return getPublicStats();
}

export function recordFeedback({ helpful, subject, grade }) {
  const data = load();
  data.totalFeedback += 1;
  if (helpful) data.helpfulYes += 1;
  else data.helpfulNo += 1;
  save(data);
  return getPublicStats();
}

export function getPublicStats() {
  const data = load();
  const satisfaction =
    data.totalFeedback > 0
      ? Math.round((data.helpfulYes / data.totalFeedback) * 100)
      : null;

  return {
    totalQuestions: data.totalQuestions,
    totalFeedback: data.totalFeedback,
    satisfaction,
    topSubjects: Object.entries(data.bySubject)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })),
  };
}
