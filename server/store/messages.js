import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  ensureDataDir();
  if (!fs.existsSync(MESSAGES_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function save(messages) {
  ensureDataDir();
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

export function saveContactMessage({ email, subject, message, userId }) {
  const messages = load();
  const entry = {
    id: Date.now().toString(),
    email,
    subject: subject || 'پیام پشتیبانی',
    message,
    userId: userId || null,
    date: new Date().toISOString(),
    read: false,
  };
  messages.unshift(entry);
  save(messages.slice(0, 200));
  return entry;
}

export function listMessages() {
  return load();
}

export function getUnreadCount() {
  return load().filter((m) => !m.read).length;
}

export function markMessageRead(id) {
  const messages = load();
  const idx = messages.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  messages[idx].read = true;
  save(messages);
  return messages[idx];
}

export function deleteMessage(id) {
  const messages = load().filter((m) => m.id !== id);
  save(messages);
  return true;
}
