const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

// GET /api/series
router.get('/', (req, res) => {
  const db = getDB();
  const seriesList = db.prepare('SELECT * FROM series ORDER BY code ASC').all();

  const result = seriesList.map(s => {
    const studentCount = db.prepare('SELECT COUNT(*) as cnt FROM students WHERE series = ?').get(s.code).cnt;
    const courseCount = db.prepare('SELECT COUNT(*) as cnt FROM courses WHERE series = ?').get(s.code).cnt;
    const sessionCount = db.prepare('SELECT COUNT(*) as cnt FROM sessions WHERE series = ?').get(s.code).cnt;

    const attRow = db.prepare(`
      SELECT 
        COUNT(CASE WHEN a.status != 'absent' THEN 1 END) as attended,
        COUNT(*) as total
      FROM attendance a
      JOIN sessions sess ON a.sessionId = sess.id
      WHERE sess.series = ?
    `).get(s.code);

    const avgAttendance = attRow.total > 0 ? (attRow.attended / attRow.total) * 100 : 0;

    return {
      code: s.code,
      semester: s.semester,
      studentCount,
      courseCount,
      totalSessions: sessionCount,
      avgAttendance: parseFloat(avgAttendance.toFixed(1))
    };
  });

  return res.json({ ok: true, series: result });
});

// POST /api/series
router.post('/', (req, res) => {
  const { code, semester } = req.body;
  if (!code || !/^\d{2}$/.test(code.trim())) {
    return res.status(400).json({ ok: false, msg: 'Enter a valid 2-digit series code (e.g. 26).' });
  }

  const cleanCode = code.trim();
  const sem = Number(semester) || 1;
  const db = getDB();

  const existing = db.prepare('SELECT * FROM series WHERE code = ?').get(cleanCode);
  if (existing) {
    return res.status(400).json({ ok: false, msg: 'That series already exists.' });
  }

  db.prepare('INSERT INTO series (code, semester) VALUES (?, ?)').run(cleanCode, sem);

  return res.json({ ok: true, msg: `${cleanCode} Series added successfully.` });
});

module.exports = router;
