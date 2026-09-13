const express = require('express');
const router = express.Router();
const { getDB, uid, dayName } = require('../db/database');

function getSetting(key, defVal) {
  const db = getDB();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : defVal;
}

function isSessionEditable(session) {
  const editHours = Number(getSetting('editWindowHours', 48));
  const hrs = (Date.now() - session.createdAt) / (1000 * 60 * 60);
  return hrs <= editHours;
}

// GET /api/attendance/session?courseCode=...&date=...&teacherId=...
router.get('/session', (req, res) => {
  const { courseCode, date, teacherId } = req.query;
  if (!courseCode || !date) {
    return res.status(400).json({ ok: false, msg: 'courseCode and date are required.' });
  }

  const db = getDB();
  const course = db.prepare('SELECT * FROM courses WHERE code = ?').get(courseCode);
  if (!course) {
    return res.status(404).json({ ok: false, msg: 'Course not found.' });
  }

  let session = db.prepare('SELECT * FROM sessions WHERE courseCode = ? AND date = ?').get(courseCode, date);
  if (!session) {
    const sessId = uid('SS');
    const now = Date.now();
    const tId = teacherId || course.teacherId || 'T_SYSTEM';
    db.prepare('INSERT INTO sessions (id, date, day, courseCode, series, semester, teacherId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(sessId, date, dayName(date), courseCode, course.series, course.semester, tId, now);
    session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessId);
  }

  // Determine roster
  let roster = [];
  if (course.enrolledStudentIds) {
    try {
      const ids = JSON.parse(course.enrolledStudentIds);
      if (Array.isArray(ids) && ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        roster = db.prepare(`SELECT * FROM students WHERE id IN (${placeholders}) ORDER BY rollNo ASC`).all(...ids);
      }
    } catch (e) {
      console.error('Error parsing enrolledStudentIds:', e);
    }
  }
  if (roster.length === 0) {
    roster = db.prepare('SELECT * FROM students WHERE series = ? ORDER BY rollNo ASC').all(course.series);
  }

  const records = db.prepare('SELECT * FROM attendance WHERE sessionId = ?').all(session.id);

  return res.json({
    ok: true,
    session: {
      ...session,
      isEditable: isSessionEditable(session)
    },
    course,
    roster,
    records
  });
});

// POST /api/attendance/mark
router.post('/mark', (req, res) => {
  const { sessionId, studentId, status, markedBy, remarks } = req.body;
  if (!sessionId || !studentId || !status) {
    return res.status(400).json({ ok: false, msg: 'sessionId, studentId, and status are required.' });
  }

  const db = getDB();
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) {
    return res.status(404).json({ ok: false, msg: 'Session not found.' });
  }

  if (!isSessionEditable(session)) {
    return res.status(403).json({ ok: false, msg: 'Edit window for this session has closed.' });
  }

  const now = Date.now();
  const existing = db.prepare('SELECT * FROM attendance WHERE sessionId = ? AND studentId = ?').get(sessionId, studentId);

  if (existing) {
    if (existing.status === status) {
      // Toggle unmark if same status tapped
      db.prepare('DELETE FROM attendance WHERE id = ?').run(existing.id);
      return res.json({ ok: true, action: 'deleted', record: null });
    } else {
      db.prepare(`
        UPDATE attendance 
        SET status = ?, remarks = COALESCE(?, remarks), editedBy = ?, editedTime = ?, timestamp = COALESCE(timestamp, ?)
        WHERE id = ?
      `).run(status, remarks !== undefined ? remarks : existing.remarks, markedBy, now, now, existing.id);
      const updated = db.prepare('SELECT * FROM attendance WHERE id = ?').get(existing.id);
      return res.json({ ok: true, action: 'updated', record: updated });
    }
  } else {
    const aid = uid('A');
    db.prepare(`
      INSERT INTO attendance (id, sessionId, studentId, status, markedBy, timestamp, remarks, editedBy, editedTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)
    `).run(aid, sessionId, studentId, status, markedBy || session.teacherId, now, remarks || '');
    const created = db.prepare('SELECT * FROM attendance WHERE id = ?').get(aid);
    return res.json({ ok: true, action: 'created', record: created });
  }
});

// POST /api/attendance/mark-all
router.post('/mark-all', (req, res) => {
  const { sessionId, status, markedBy } = req.body;
  if (!sessionId || !status) {
    return res.status(400).json({ ok: false, msg: 'sessionId and status are required.' });
  }

  const db = getDB();
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) {
    return res.status(404).json({ ok: false, msg: 'Session not found.' });
  }

  if (!isSessionEditable(session)) {
    return res.status(403).json({ ok: false, msg: 'Edit window for this session has closed.' });
  }

  const course = db.prepare('SELECT * FROM courses WHERE code = ?').get(session.courseCode);
  let roster = [];
  if (course.enrolledStudentIds) {
    try {
      const ids = JSON.parse(course.enrolledStudentIds);
      if (Array.isArray(ids) && ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        roster = db.prepare(`SELECT * FROM students WHERE id IN (${placeholders})`).all(...ids);
      }
    } catch (e) {}
  }
  if (roster.length === 0) {
    roster = db.prepare('SELECT * FROM students WHERE series = ?').all(session.series);
  }

  const now = Date.now();
  db.exec('BEGIN TRANSACTION;');
  try {
    const upsertStmt = db.prepare(`
      INSERT INTO attendance (id, sessionId, studentId, status, markedBy, timestamp, remarks, editedBy, editedTime)
      VALUES (?, ?, ?, ?, ?, ?, '', NULL, NULL)
      ON CONFLICT(sessionId, studentId) DO UPDATE SET
        status = excluded.status,
        editedBy = excluded.markedBy,
        editedTime = excluded.timestamp
    `);

    roster.forEach(s => {
      upsertStmt.run(uid('A'), sessionId, s.id, status, markedBy || session.teacherId, now);
    });

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ ok: false, msg: 'Failed to mark all.' });
  }

  const records = db.prepare('SELECT * FROM attendance WHERE sessionId = ?').all(sessionId);
  return res.json({ ok: true, count: roster.length, records });
});

// GET /api/attendance/history
router.get('/history', (req, res) => {
  const { teacherId, courseCode, from, to, series } = req.query;
  const db = getDB();

  let query = 'SELECT s.*, c.name as courseName FROM sessions s JOIN courses c ON s.courseCode = c.code WHERE 1=1';
  const params = [];

  if (teacherId) {
    query += ' AND s.teacherId = ?';
    params.push(teacherId);
  }
  if (courseCode && courseCode !== 'all') {
    query += ' AND s.courseCode = ?';
    params.push(courseCode);
  }
  if (from) {
    query += ' AND s.date >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND s.date <= ?';
    params.push(to);
  }
  if (series && series !== 'all') {
    query += ' AND s.series = ?';
    params.push(series);
  }

  query += ' ORDER BY s.date DESC, s.createdAt DESC';

  const sessions = db.prepare(query).all(...params);

  // Attach counts and edit status to each session
  const result = sessions.map(s => {
    const counts = db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
        COUNT(*) as total
      FROM attendance WHERE sessionId = ?
    `).get(s.id);

    return {
      ...s,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      total: counts.total,
      isEditable: isSessionEditable(s)
    };
  });

  return res.json({ ok: true, sessions: result });
});

// GET /api/attendance/session/:id
router.get('/session/:id', (req, res) => {
  const db = getDB();
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) {
    return res.status(404).json({ ok: false, msg: 'Session not found.' });
  }

  const course = db.prepare('SELECT * FROM courses WHERE code = ?').get(session.courseCode);
  let roster = [];
  if (course.enrolledStudentIds) {
    try {
      const ids = JSON.parse(course.enrolledStudentIds);
      if (Array.isArray(ids) && ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        roster = db.prepare(`SELECT * FROM students WHERE id IN (${placeholders}) ORDER BY rollNo ASC`).all(...ids);
      }
    } catch (e) {}
  }
  if (roster.length === 0) {
    roster = db.prepare('SELECT * FROM students WHERE series = ? ORDER BY rollNo ASC').all(session.series);
  }

  const records = db.prepare('SELECT * FROM attendance WHERE sessionId = ?').all(session.id);

  return res.json({
    ok: true,
    session: {
      ...session,
      isEditable: isSessionEditable(session)
    },
    course,
    roster,
    records
  });
});

module.exports = router;
