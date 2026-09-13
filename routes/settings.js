const express = require('express');
const router = express.Router();
const { getDB, resetDatabase } = require('../db/database');

// GET /api/settings
router.get('/', (req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(r => {
    settings[r.key] = r.value;
  });

  return res.json({
    ok: true,
    settings: {
      deptName: settings.deptName || 'Electrical & Computer Engineering Department',
      threshold: Number(settings.threshold) || 75,
      editWindowHours: Number(settings.editWindowHours) || 48,
      currentSemesterLabel: settings.currentSemesterLabel || 'Fall 2026'
    }
  });
});

// POST /api/settings
router.post('/', (req, res) => {
  const { deptName, threshold, editWindowHours, currentSemesterLabel } = req.body;
  const db = getDB();

  db.exec('BEGIN TRANSACTION;');
  try {
    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    if (deptName !== undefined) upsert.run('deptName', String(deptName).trim());
    if (threshold !== undefined) upsert.run('threshold', String(Number(threshold) || 75));
    if (editWindowHours !== undefined) upsert.run('editWindowHours', String(Number(editWindowHours) || 48));
    if (currentSemesterLabel !== undefined) upsert.run('currentSemesterLabel', String(currentSemesterLabel).trim());

    db.exec('COMMIT;');
  } catch (e) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ ok: false, msg: 'Failed to save settings.' });
  }

  return res.json({ ok: true, msg: 'Settings saved successfully.' });
});

// POST /api/settings/reset-demo
router.post('/reset-demo', (req, res) => {
  try {
    resetDatabase();
    return res.json({ ok: true, msg: 'Demo data reset successfully.' });
  } catch (e) {
    return res.status(500).json({ ok: false, msg: 'Failed to reset demo data: ' + e.message });
  }
});

module.exports = router;
