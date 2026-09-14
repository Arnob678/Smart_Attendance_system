const express = require('express');
const router = express.Router();
const { getDB, uid } = require('../db/database');

// GET /api/teachers
router.get('/', (req, res) => {
  const db = getDB();
  const teachers = db.prepare('SELECT * FROM teachers ORDER BY name ASC').all();

  const result = teachers.map(t => {
    const assignedCourses = db.prepare('SELECT code FROM courses WHERE teacherId = ?').all(t.id).map(c => c.code);
    return {
      ...t,
      assignedCourses
    };
  });

  return res.json({ ok: true, teachers: result });
});

// POST /api/teachers
router.post('/', (req, res) => {
  const { name, initial, email, password, assignedCourses } = req.body;
  if (!name || !email) {
    return res.status(400).json({ ok: false, msg: 'Name and email are required.' });
  }

  const db = getDB();
  const cleanEmail = email.trim().toLowerCase();

  const existing = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail);
  if (existing) {
    return res.json({ ok: true, msg: 'Teacher already exists.', id: existing.linkedId, existed: true });
  }

  const tid = uid('T');
  const userInit = initial ? initial.trim().toUpperCase() : name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  const pass = password || 'teacher123';

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('INSERT INTO teachers (id, name, initial, email, status) VALUES (?, ?, ?, ?, ?)')
      .run(tid, name.trim(), userInit, cleanEmail, 'approved');

    db.prepare('INSERT INTO users (id, role, email, password, linkedId, status, name) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uid('U'), 'teacher', cleanEmail, pass, tid, 'active', name.trim());

    if (Array.isArray(assignedCourses) && assignedCourses.length > 0) {
      for (const code of assignedCourses) {
        db.prepare('UPDATE courses SET teacherId = ? WHERE code = ?').run(tid, code);
      }
    }

    db.exec('COMMIT;');
  } catch (e) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ ok: false, msg: 'Failed to create teacher: ' + e.message });
  }

  return res.json({ ok: true, msg: 'Teacher created successfully.', id: tid });
});

// POST /api/teachers/:id/approve
router.post('/:id/approve', (req, res) => {
  const db = getDB();
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
  if (!teacher) {
    return res.status(404).json({ ok: false, msg: 'Teacher not found.' });
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare("UPDATE teachers SET status = 'approved' WHERE id = ?").run(teacher.id);
    db.prepare("UPDATE users SET status = 'active' WHERE linkedId = ?").run(teacher.id);

    db.prepare('INSERT INTO notifications (id, text, time, read) VALUES (?, ?, ?, ?)')
      .run(uid('N'), `Teacher account approved: ${teacher.name}.`, Date.now(), 1);

    db.exec('COMMIT;');
  } catch (e) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ ok: false, msg: 'Failed to approve teacher.' });
  }

  return res.json({ ok: true, msg: 'Teacher approved successfully.' });
});

// PUT /api/teachers/:id
router.put('/:id', (req, res) => {
  const { name, status, assignedCourses, password } = req.body;
  const db = getDB();
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
  if (!teacher) {
    return res.status(404).json({ ok: false, msg: 'Teacher not found.' });
  }

  const newName = name !== undefined ? name.trim() : teacher.name;
  const newStatus = status !== undefined ? status : teacher.status;

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('UPDATE teachers SET name = ?, status = ? WHERE id = ?').run(newName, newStatus, teacher.id);

    const userStatus = newStatus === 'approved' ? 'active' : (newStatus === 'suspended' ? 'suspended' : 'pending');
    if (password && password.length >= 6) {
      db.prepare('UPDATE users SET name = ?, status = ?, password = ? WHERE linkedId = ?').run(newName, userStatus, password, teacher.id);
    } else {
      db.prepare('UPDATE users SET name = ?, status = ? WHERE linkedId = ?').run(newName, userStatus, teacher.id);
    }

    if (Array.isArray(assignedCourses)) {
      // Unassign courses previously assigned to this teacher that are not in assignedCourses
      db.prepare('UPDATE courses SET teacherId = NULL WHERE teacherId = ?').run(teacher.id);
      // Assign new list
      for (const code of assignedCourses) {
        db.prepare('UPDATE courses SET teacherId = ? WHERE code = ?').run(teacher.id, code);
      }
    }

    db.exec('COMMIT;');
  } catch (e) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ ok: false, msg: 'Failed to update teacher: ' + e.message });
  }

  return res.json({ ok: true, msg: 'Teacher updated successfully.' });
});

// DELETE /api/teachers/:id
router.delete('/:id', (req, res) => {
  const db = getDB();
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
  if (!teacher) {
    return res.status(404).json({ ok: false, msg: 'Teacher not found.' });
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('UPDATE courses SET teacherId = NULL WHERE teacherId = ?').run(teacher.id);
    db.prepare('DELETE FROM users WHERE linkedId = ?').run(teacher.id);
    db.prepare('DELETE FROM teachers WHERE id = ?').run(teacher.id);
    db.exec('COMMIT;');
  } catch (e) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ ok: false, msg: 'Failed to remove teacher.' });
  }

  return res.json({ ok: true, msg: 'Teacher removed successfully.' });
});

module.exports = router;
