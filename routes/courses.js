const express = require('express');
const router = express.Router();
const { getDB, SERIES_SEMESTER } = require('../db/database');
const { RUET_ECE_ALL_SEMESTERS, SERIES_SEMESTER_MAP, getRecommendations } = require('../data/curriculum');

// GET /api/courses/recommendations?series=...&semester=...
router.get('/recommendations', (req, res) => {
  const { series, semester } = req.query;
  const recs = getRecommendations(series, semester);
  return res.json({ ok: true, ...recs });
});

// GET /api/courses?series=...&teacherId=...
router.get('/', (req, res) => {
  const { series, teacherId } = req.query;
  const db = getDB();

  let query = `
    SELECT c.*, t.name as teacherName, t.initial as teacherInitial
    FROM courses c
    LEFT JOIN teachers t ON c.teacherId = t.id
    WHERE 1=1
  `;
  const params = [];

  if (series && series !== 'all') {
    query += ' AND c.series = ?';
    params.push(series);
  }
  if (teacherId) {
    query += ' AND c.teacherId = ?';
    params.push(teacherId);
  }

  query += ' ORDER BY c.series ASC, c.code ASC';

  const courses = db.prepare(query).all(...params);

  // Compute student count and avg attendance for each course
  const result = courses.map(c => {
    let studentCount = 0;
    if (c.enrolledStudentIds) {
      try {
        const ids = JSON.parse(c.enrolledStudentIds);
        studentCount = Array.isArray(ids) ? ids.length : 0;
      } catch (e) {}
    }
    if (!studentCount) {
      const row = db.prepare('SELECT COUNT(*) as cnt FROM students WHERE series = ?').get(c.series);
      studentCount = row ? row.cnt : 0;
    }

    const sessCount = db.prepare('SELECT COUNT(*) as cnt FROM sessions WHERE courseCode = ?').get(c.code).cnt;

    const attRow = db.prepare(`
      SELECT 
        COUNT(CASE WHEN a.status != 'absent' THEN 1 END) as attended,
        COUNT(*) as total
      FROM attendance a
      JOIN sessions s ON a.sessionId = s.id
      WHERE s.courseCode = ?
    `).get(c.code);

    const avgAttendance = attRow.total > 0 ? (attRow.attended / attRow.total) * 100 : 0;

    return {
      ...c,
      studentCount,
      sessionCount: sessCount,
      avgAttendance: parseFloat(avgAttendance.toFixed(1))
    };
  });

  return res.json({ ok: true, courses: result });
});

// GET /api/courses/:code
router.get('/:code', (req, res) => {
  const db = getDB();
  const course = db.prepare(`
    SELECT c.*, t.name as teacherName, t.initial as teacherInitial
    FROM courses c
    LEFT JOIN teachers t ON c.teacherId = t.id
    WHERE c.code = ?
  `).get(req.params.code);

  if (!course) {
    return res.status(404).json({ ok: false, msg: 'Course not found.' });
  }

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
    roster = db.prepare('SELECT * FROM students WHERE series = ? ORDER BY rollNo ASC').all(course.series);
  }

  // Calculate student-wise stats for this course
  const summary = roster.map(s => {
    const stats = db.prepare(`
      SELECT 
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
        COUNT(*) as total
      FROM attendance a
      JOIN sessions sess ON a.sessionId = sess.id
      WHERE sess.courseCode = ? AND a.studentId = ?
    `).get(course.code, s.id);

    const attended = stats.present + stats.late;
    const pct = stats.total > 0 ? (attended / stats.total) * 100 : 0;

    // Marks table 14.2
    let marks = 0;
    if (pct >= 90) marks = 10;
    else if (pct >= 85) marks = 9;
    else if (pct >= 80) marks = 8;
    else if (pct >= 75) marks = 7;
    else if (pct >= 70) marks = 6;
    else if (pct >= 65) marks = 5;
    else if (pct >= 60) marks = 4;

    return {
      student: s,
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      total: stats.total,
      pct: parseFloat(pct.toFixed(1)),
      marks
    };
  });

  return res.json({ ok: true, course, summary });
});

// POST /api/courses
router.post('/', (req, res) => {
  const { code, name, series, teacherId, creditHours, enrolledStudentIds, semester } = req.body;
  if (!code || !name || !series) {
    return res.status(400).json({ ok: false, msg: 'Code, name, and series are required.' });
  }

  const cleanCode = code.trim().toUpperCase();
  const db = getDB();

  const courseSemester = semester ? Number(semester) : (SERIES_SEMESTER[series] || 1);
  const enrolledJson = (Array.isArray(enrolledStudentIds) && enrolledStudentIds.length > 0)
    ? JSON.stringify(enrolledStudentIds)
    : null;

  const existing = db.prepare('SELECT * FROM courses WHERE code = ?').get(cleanCode);
  if (existing) {
    if (teacherId && !existing.teacherId) {
      db.prepare('UPDATE courses SET teacherId = ? WHERE code = ?').run(teacherId, cleanCode);
    }
    if (enrolledJson && !existing.enrolledStudentIds) {
      db.prepare('UPDATE courses SET enrolledStudentIds = ? WHERE code = ?').run(enrolledJson, cleanCode);
    }
    return res.json({ ok: true, msg: 'Course already exists.', code: cleanCode, existed: true });
  }

  db.prepare(`
    INSERT INTO courses (code, name, series, semester, teacherId, creditHours, enrolledStudentIds)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(cleanCode, name.trim(), series, courseSemester, teacherId || null, Number(creditHours) || 3, enrolledJson);

  return res.json({ ok: true, msg: 'Course created successfully.', code: cleanCode });
});

// PUT /api/courses/:code
router.put('/:code', (req, res) => {
  const { name, teacherId, creditHours } = req.body;
  const db = getDB();
  const course = db.prepare('SELECT * FROM courses WHERE code = ?').get(req.params.code);
  if (!course) {
    return res.status(404).json({ ok: false, msg: 'Course not found.' });
  }

  db.prepare(`
    UPDATE courses
    SET name = COALESCE(?, name),
        teacherId = ?,
        creditHours = COALESCE(?, creditHours)
    WHERE code = ?
  `).run(
    name !== undefined ? name.trim() : course.name,
    teacherId !== undefined ? teacherId : course.teacherId,
    creditHours !== undefined ? Number(creditHours) : course.creditHours,
    req.params.code
  );

  return res.json({ ok: true, msg: 'Course updated successfully.' });
});

// DELETE /api/courses/:code
router.delete('/:code', (req, res) => {
  const code = req.params.code;
  const db = getDB();
  const course = db.prepare('SELECT * FROM courses WHERE code = ?').get(code);
  if (!course) {
    return res.status(404).json({ ok: false, msg: 'Course not found.' });
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    const sessions = db.prepare('SELECT id FROM sessions WHERE courseCode = ?').all(code);
    for (const sess of sessions) {
      db.prepare('DELETE FROM attendance WHERE sessionId = ?').run(sess.id);
    }
    db.prepare('DELETE FROM sessions WHERE courseCode = ?').run(code);
    db.prepare('DELETE FROM courses WHERE code = ?').run(code);
    db.exec('COMMIT;');
  } catch (e) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ ok: false, msg: 'Failed to delete course.' });
  }

  return res.json({ ok: true, msg: 'Course and related sessions deleted.' });
});

// POST /api/courses/delete-all (Bulk delete all courses or by series)
router.post('/delete-all', (req, res) => {
  const { series } = req.body;
  const db = getDB();

  db.exec('BEGIN TRANSACTION;');
  try {
    let targetCourses = [];

    if (series && series !== 'all') {
      targetCourses = db.prepare('SELECT code FROM courses WHERE series = ?').all(series);
    } else {
      targetCourses = db.prepare('SELECT code FROM courses').all();
    }

    const deletedCount = targetCourses.length;

    for (const c of targetCourses) {
      const sessions = db.prepare('SELECT id FROM sessions WHERE courseCode = ?').all(c.code);
      for (const sess of sessions) {
        db.prepare('DELETE FROM attendance WHERE sessionId = ?').run(sess.id);
      }
      db.prepare('DELETE FROM sessions WHERE courseCode = ?').run(c.code);
      db.prepare('DELETE FROM courses WHERE code = ?').run(c.code);
    }

    db.exec('COMMIT;');
    return res.json({ ok: true, msg: `Successfully deleted ${deletedCount} courses.`, count: deletedCount });
  } catch (e) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ ok: false, msg: 'Failed to delete courses: ' + e.message });
  }
});

module.exports = router;
