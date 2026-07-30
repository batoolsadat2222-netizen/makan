import { Router } from 'express';
import { createUser, verifyUser, findUserById, sanitizeUser } from '../store/users.js';

import { signToken, verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'نام، ایمیل و رمز عبور الزامی است.' });
    }
    const user = await createUser({ name, email, password });
    const token = signToken(user);
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'ایمیل و رمز عبور الزامی است.' });
    }
    const user = await verifyUser({ email, password });
    const token = signToken(user);
    res.json({ user, token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'توکن یافت نشد.' });
  }

  const payload = verifyToken(header.slice(7));
  if (!payload?.sub) return res.status(401).json({ error: 'توکن نامعتبر.' });

  const user = findUserById(payload.sub);
  if (!user) return res.status(401).json({ error: 'کاربر یافت نشد.' });

  res.json({ user: sanitizeUser(user) });
});

export default router;
