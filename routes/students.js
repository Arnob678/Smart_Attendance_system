const express = require('express');
const router = express.Router();
const { getDB, uid, pad2, SERIES_SEMESTER } = require('../db/database');

// GET /api/students?series=...&search=...&limit=...
router.get('/', (req, res) => {
  const { series, search, limit } = req.query;
  const db = getDB();

  let query = 'SELECT * FROM students WHERE 1=1';
  const params = [];

  if (series && series !== 'all') {
    query += ' AND series = ?';
    params.push(series);
  }
  if (search) {
    const term = `%${search.trim().toLowerCase()}%`;
    query += ' AND (LOWER(name) LIKE ? OR LOWER(studentId) LIKE ? OR CAST(rollNo AS TEXT) LIKE ?)';
    params.push(term, term, term);
  }

  query += ' ORDER BY series ASC, rollNo ASC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(Number(limit));
  }

  const students = db.prepare(query).all(...params);

  // Compute attendance stats for each student
  const result = students.map(s => {
    const stats = db.prepare(`
      SELECT 
        COUNT(CASE WHEN status != 'absent' THEN 1 END) as attended,
        COUNT(*) as total
      FROM attendance
      WHERE studentId = ?
    `).get(s.id);

    const pct = stats.total > 0 ? (stats.attended / stats.total) * 100 : 0;

    return {
      ...s,
      conducted: stats.total,
      attended: stats.attended,
      attendancePct: parseFloat(pct.toFixed(1))
    };
  });

  return res.json({ ok: true, students: result });
});

// GET /api/students/:id
router.get('/:id', (req, res) => {
  const db = getDB();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) {
    return res.status(404).json({ ok: false, msg: 'Student not found.' });
  }

  // Get enrolled courses
  const allCourses = db.prepare('SELECT * FROM courses WHERE series = ?').all(student.series);
  const courses = allCourses.filter(c => {
    if (!c.enrolledStudentIds) return true;
    try {
      const ids = JSON.parse(c.enrolledStudentIds);
      return Array.isArray(ids) && ids.includes(student.id);
    } catch (e) {
      return true;
    }
  });

  const courseBreakdown = courses.map(c => {
    const teacher = c.teacherId ? db.prepare('SELECT name FROM teachers WHERE id = ?').get(c.teacherId) : null;
    const stats = db.prepare(`
      SELECT 
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
        COUNT(*) as total
      FROM attendance a
      JOIN sessions s ON a.sessionId = s.id
      WHERE s.courseCode = ? AND a.studentId = ?
    `).get(c.code, student.id);

    const attended = stats.present + stats.late;
    const pct = stats.total > 0 ? (attended / stats.total) * 100 : 0;

    // 14.2 marks
    let marks = 0;
    if (pct >= 90) marks = 10;
    else if (pct >= 85) marks = 9;
    else if (pct >= 80) marks = 8;
    else if (pct >= 75) marks = 7;
    else if (pct >= 70) marks = 6;
    else if (pct >= 65) marks = 5;
    else if (pct >= 60) marks = 4;

    // Bunk calculator
    let bunk = { type: 'none', count: 0 };
    if (stats.total > 0) {
      if (pct >= 90) {
        const maxMiss = Math.floor(attended / 0.9 - stats.total);
        bunk = { type: 'buffer', count: Math.max(0, maxMiss) };
      } else {
        const need = Math.ceil((0.9 * stats.total - attended) / (1 - 0.9));
        bunk = { type: 'needed', count: Math.max(0, need) };
      }
    }

    return {
      course: c,
      teacherName: teacher ? teacher.name : 'Unassigned',
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      total: stats.total,
      pct: parseFloat(pct.toFixed(1)),
      marks,
      bunk
    };
  });

  // Overall attendance
  const overall = db.prepare(`
    SELECT 
      COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
      COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
      COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
      COUNT(*) as total
    FROM attendance
    WHERE studentId = ?
  `).get(student.id);

  const attendedAll = overall.present + overall.late;
  const overallPct = overall.total > 0 ? (attendedAll / overall.total) * 100 : 0;

  let overallMarks = 0;
  if (overallPct >= 90) overallMarks = 10;
  else if (overallPct >= 85) overallMarks = 9;
  else if (overallPct >= 80) overallMarks = 8;
  else if (overallPct >= 75) overallMarks = 7;
  else if (overallPct >= 70) overallMarks = 6;
  else if (overallPct >= 65) overallMarks = 5;
  else if (overallPct >= 60) overallMarks = 4;

  return res.json({
    ok: true,
    student,
    overall: {
      present: overall.present,
      absent: overall.absent,
      late: overall.late,
      total: overall.total,
      pct: parseFloat(overallPct.toFixed(1)),
      marks: overallMarks
    },
    courses: courseBreakdown
  });
});

// POST /api/students
router.post('/', (req, res) => {
  const { name, series, rollNo, email } = req.body;
  if (!name || !series || !rollNo) {
    return res.status(400).json({ ok: false, msg: 'Name, series, and roll number are required.' });
  }

  const roll = Number(rollNo);
  const db = getDB();

  const existingRoll = db.prepare('SELECT * FROM students WHERE series = ? AND rollNo = ?').get(series, roll);
  if (existingRoll) {
    return res.status(400).json({ ok: false, msg: 'That roll number already exists in this series.' });
  }

  const sid = uid('S');
  const studentId = `ECE-${series}-${pad2(roll)}`;
  const studentEmail = email ? email.trim().toLowerCase() : `${series}${pad2(roll)}@ece.edu`;
  const semester = SERIES_SEMESTER[series] || 1;

  db.prepare(`
    INSERT INTO students (id, studentId, rollNo, name, email, series, semester, photo)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
  `).run(sid, studentId, roll, name.trim(), studentEmail, series, semester);

  return res.json({ ok: true, msg: 'Student added successfully.', id: sid, studentId });
});

// PUT /api/students/:id
router.put('/:id', (req, res) => {
  const { name, email, password } = req.body;
  const db = getDB();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) {
    return res.status(404).json({ ok: false, msg: 'Student not found.' });
  }

  const newName = name !== undefined ? name.trim() : student.name;
  const newEmail = email !== undefined ? email.trim().toLowerCase() : student.email;

  db.prepare('UPDATE students SET name = ?, email = ? WHERE id = ?').run(newName, newEmail, student.id);

  // Sync user table
  const user = db.prepare("SELECT * FROM users WHERE linkedId = ? AND role = 'student'").get(student.id);
  if (user) {
    if (password && password.length >= 6) {
      db.prepare('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?').run(newName, newEmail, password, user.id);
    } else {
      db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(newName, newEmail, user.id);
    }
  }

  return res.json({ ok: true, msg: 'Student updated successfully.' });
});

// DELETE /api/students/:id
router.delete('/:id', (req, res) => {
  const db = getDB();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) {
    return res.status(404).json({ ok: false, msg: 'Student not found.' });
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('DELETE FROM attendance WHERE studentId = ?').run(student.id);
    db.prepare('DELETE FROM users WHERE linkedId = ?').run(student.id);
    db.prepare('DELETE FROM students WHERE id = ?').run(student.id);
    db.exec('COMMIT;');
  } catch (e) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ ok: false, msg: 'Failed to delete student.' });
  }

  return res.json({ ok: true, msg: 'Student removed successfully.' });
});

// POST /api/students/delete-all (Bulk delete all students or by series)
router.post('/delete-all', (req, res) => {
  const { series } = req.body;
  const db = getDB();

  db.exec('BEGIN TRANSACTION;');
  try {
    let deletedCount = 0;
    if (series && series !== 'all') {
      const students = db.prepare('SELECT id FROM students WHERE series = ?').all(series);
      deletedCount = students.length;
      for (const s of students) {
        db.prepare('DELETE FROM attendance WHERE studentId = ?').run(s.id);
        db.prepare("DELETE FROM users WHERE linkedId = ? AND role = 'student'").run(s.id);
      }
      db.prepare('DELETE FROM students WHERE series = ?').run(series);
    } else {
      const countRow = db.prepare('SELECT COUNT(*) as count FROM students').get();
      deletedCount = countRow.count;
      db.prepare('DELETE FROM attendance').run();
      db.prepare("DELETE FROM users WHERE role = 'student'").run();
      db.prepare('DELETE FROM students').run();
    }
    db.exec('COMMIT;');
    return res.json({ ok: true, msg: `Successfully deleted ${deletedCount} students.`, count: deletedCount });
  } catch (e) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ ok: false, msg: 'Failed to delete students: ' + e.message });
  }
});

// POST /api/students/import (Bulk CSV import)
router.post('/import', (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ ok: false, msg: 'Array of student rows is required.' });
  }

  const db = getDB();
  let added = 0;
  let skipped = 0;

  db.exec('BEGIN TRANSACTION;');
  try {
    const insStudent = db.prepare(`
      INSERT INTO students (id, studentId, rollNo, name, email, series, semester, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
    `);

    rows.forEach(r => {
      const name = r.name ? r.name.trim() : '';
      const series = String(r.series || '').trim();
      const roll = Number(r.roll);
      const email = r.email ? r.email.trim().toLowerCase() : `${series}${pad2(roll)}@ece.edu`;

      if (!name || !series || !roll) {
        skipped++;
        return;
      }

      const exists = db.prepare('SELECT id FROM students WHERE series = ? AND rollNo = ?').get(series, roll);
      if (exists) {
        skipped++;
        return;
      }

      const sid = uid('S');
      const customId = r.studentid || r.studentId || r['student id'] || r.id;
      const studentId = customId ? customId.trim() : (series === '24' ? `2410${String(roll).padStart(3, '0')}` : `ECE-${series}-${pad2(roll)}`);
      const semester = SERIES_SEMESTER[series] || 1;
      insStudent.run(sid, studentId, roll, name, email, series, semester);
      added++;
    });

    db.exec('COMMIT;');
  } catch (e) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ ok: false, msg: 'Import transaction failed: ' + e.message });
  }

  return res.json({ ok: true, added, skipped });
});

module.exports = router;
