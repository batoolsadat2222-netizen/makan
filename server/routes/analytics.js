import { Router } from 'express';
import { recordFeedback, getPublicStats } from '../store/analytics.js';

const router = Router();

router.post('/feedback', (req, res) => {
  const { helpful, subject, grade } = req.body || {};
  if (typeof helpful !== 'boolean') {
    return res.status(400).json({ error: 'فیلد helpful الزامی است.' });
  }
  const stats = recordFeedback({ helpful, subject, grade });
  res.json({ ok: true, stats });
});

router.get('/stats', (_req, res) => {
  res.json(getPublicStats());
});

export default router;
