import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'makan-dev-secret-change-in-production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export function signAdminToken() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyAdminToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') return null;
    return payload;
  } catch {
    return null;
  }
}

export function checkAdminPassword(password) {
  if (!ADMIN_PASSWORD) return false;
  return password === ADMIN_PASSWORD;
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'دسترسی مدیر لازم است.' });
  }

  const payload = verifyAdminToken(header.slice(7));
  if (!payload) {
    return res.status(401).json({ error: 'توکن مدیر نامعتبر یا منقضی شده.' });
  }

  req.admin = true;
  next();
}
