import jwt from 'jsonwebtoken';
import { findUserById, sanitizeUser } from '../store/users.js';

const JWT_SECRET = process.env.JWT_SECRET || 'makan-dev-secret-change-in-production';

export function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const payload = verifyToken(header.slice(7));
    if (payload?.sub) {
      const user = findUserById(payload.sub);
      if (user) req.user = sanitizeUser(user);
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'برای این عملیات باید وارد شوید.' });
    }
    next();
  });
}
