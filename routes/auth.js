const express = require('express');
const router = express.Router();
const { getDB, uid } = require('../db/database');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ ok: false, msg: 'Email, password, and role are required.' });
  }

  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND role = ?').get(email.trim(), role);

  if (!user) {
    return res.status(401).json({ ok: false, msg: 'No account found for that email and role.' });
  }
  if (user.password !== password) {
    return res.status(401).json({ ok: false, msg: 'Incorrect password.' });
  }
  if (user.status === 'pending') {
    return res.status(403).json({ ok: false, msg: 'Your teacher account is awaiting Department Admin approval.' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ ok: false, msg: 'This account has been suspended. Contact the Department Admin.' });
  }

  // Get additional linked info if teacher or student
  let extra = {};
  if (user.role === 'teacher' && user.linkedId) {
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(user.linkedId);
    if (teacher) {
      extra.teacher = teacher;
    }
  } else if (user.role === 'student' && user.linkedId) {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(user.linkedId);
    if (student) {
      extra.student = student;
    }
  }

  return res.json({
    ok: true,
    user: {
      id: user.id,
      role: user.role,
      linkedId: user.linkedId,
      name: user.name,
      email: user.email,
      ...extra
    }
  });
});

// POST /api/auth/register (Student self-registration)
router.post('/register', (req, res) => {
  const { studentId, email, password } = req.body;
  if (!studentId || !email || !password) {
    return res.status(400).json({ ok: false, msg: 'All fields are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ ok: false, msg: 'Password must be at least 6 characters.' });
  }

  const db = getDB();
  const student = db.prepare('SELECT * FROM students WHERE LOWER(studentId) = LOWER(?)').get(studentId.trim());
  if (!student) {
    return res.status(404).json({ ok: false, msg: 'Student ID not recognized. Ask your Department Admin to add you to the roster first.' });
  }

  const existingAccount = db.prepare("SELECT * FROM users WHERE linkedId = ? AND role = 'student'").get(student.id);
  if (existingAccount) {
    return res.status(400).json({ ok: false, msg: 'An account already exists for this Student ID. Please sign in instead.' });
  }

  const emailTaken = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
  if (emailTaken) {
    return res.status(400).json({ ok: false, msg: 'This email is already registered.' });
  }

  const userId = uid('U');
  db.prepare('INSERT INTO users (id, role, email, password, linkedId, status, name) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(userId, 'student', email.trim().toLowerCase(), password, student.id, 'active', student.name);

  return res.json({
    ok: true,
    user: {
      id: userId,
      role: 'student',
      linkedId: student.id,
      name: student.name,
      email: email.trim().toLowerCase(),
      student
    }
  });
});

// POST /api/auth/change-password
router.post('/change-password', (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ ok: false, msg: 'New password must be at least 6 characters.' });
  }

  const db = getDB();
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, userId);
  return res.json({ ok: true, msg: 'Password updated successfully.' });
});

module.exports = router;
