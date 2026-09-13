const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

// GET /api/notifications
router.get('/', (req, res) => {
  const db = getDB();
  const notifications = db.prepare('SELECT * FROM notifications ORDER BY time DESC').all();
  return res.json({ ok: true, notifications });
});

// POST /api/notifications/mark-read
router.post('/mark-read', (req, res) => {
  const db = getDB();
  db.prepare('UPDATE notifications SET read = 1').run();
  return res.json({ ok: true, msg: 'All notifications marked as read.' });
});

module.exports = router;
