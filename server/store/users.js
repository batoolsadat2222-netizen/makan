import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadUsers() {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveUsers(users) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email) {
  return loadUsers().find((u) => u.email === email.trim().toLowerCase());
}

export function findUserById(id) {
  return loadUsers().find((u) => u.id === id);
}

export async function createUser({ name, email, password }) {
  const trimmedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new Error('فرمت ایمیل صحیح نیست.');
  }
  if (password.length < 6) {
    throw new Error('رمز عبور باید حداقل ۶ کاراکتر باشد.');
  }
  if (findUserByEmail(trimmedEmail)) {
    throw new Error('این ایمیل قبلاً ثبت شده است.');
  }

  const users = loadUsers();
  const user = {
    id: Date.now().toString(),
    name: name.trim(),
    email: trimmedEmail,
    passwordHash: await bcrypt.hash(password, 10),
    totalQuestions: 0,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  return sanitizeUser(user);
}

export async function verifyUser({ email, password }) {
  const user = findUserByEmail(email);
  if (!user) throw new Error('ایمیل یا رمز عبور اشتباه است.');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('ایمیل یا رمز عبور اشتباه است.');

  return sanitizeUser(user);
}

export function incrementUserQuestions(userId) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  users[idx].totalQuestions = (users[idx].totalQuestions || 0) + 1;
  saveUsers(users);
}

export function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    totalQuestions: user.totalQuestions || 0,
    createdAt: user.createdAt,
  };
}
