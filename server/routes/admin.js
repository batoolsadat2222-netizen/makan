import { Router } from 'express';
import { checkAdminPassword, signAdminToken, requireAdmin } from '../middleware/admin.js';
import {
  listMessages,
  getUnreadCount,
  markMessageRead,
  deleteMessage,
} from '../store/messages.js';
import { getPublicStats } from '../store/analytics.js';
import { loadUsers } from '../store/users.js';

const router = Router();

router.post('/login', (req, res) => {
  const { password } = req.body || {};

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({
      error: 'ADMIN_PASSWORD در سرور تنظیم نشده است.',
    });
  }

  if (!password || !checkAdminPassword(password)) {
    return res.status(401).json({ error: 'رمز مدیر اشتباه است.' });
  }

  res.json({ token: signAdminToken(), ok: true });
});

router.get('/dashboard', requireAdmin, (_req, res) => {
  const stats = getPublicStats();
  const messages = listMessages();
  const users = loadUsers();

  res.json({
    stats,
    unreadMessages: getUnreadCount(),
    totalMessages: messages.length,
    totalUsers: users.length,
    recentMessages: messages.slice(0, 5),
  });
});

router.get('/messages', requireAdmin, (_req, res) => {
  res.json({ messages: listMessages(), unread: getUnreadCount() });
});

router.patch('/messages/:id/read', requireAdmin, (req, res) => {
  const msg = markMessageRead(req.params.id);
  if (!msg) return res.status(404).json({ error: 'پیام یافت نشد.' });
  res.json({ message: msg });
});

router.delete('/messages/:id', requireAdmin, (req, res) => {
  deleteMessage(req.params.id);
  res.json({ ok: true });
});

export default router;
