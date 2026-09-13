const fs = require('fs');
const path = require('path');
const { getDB, uid } = require('../db/database');

const csvPath = path.join(__dirname, '..', '24_series_students.csv');
const raw = fs.readFileSync(csvPath, 'utf8');
const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

const db = getDB();

console.log(`Read ${lines.length - 1} student records from CSV.`);

db.exec('BEGIN TRANSACTION;');
try {
  // 1. Delete old demo students in 24 series
  const old24Students = db.prepare("SELECT id FROM students WHERE series = '24'").all();
  for (const s of old24Students) {
    db.prepare('DELETE FROM attendance WHERE studentId = ?').run(s.id);
    db.prepare("DELETE FROM users WHERE linkedId = ? AND role = 'student'").run(s.id);
  }
  db.prepare("DELETE FROM students WHERE series = '24'").run();

  // 2. Insert the 55 real 24 Series students
  const insStudent = db.prepare(`
    INSERT INTO students (id, studentId, rollNo, name, email, series, semester, photo)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
  `);
  const insUser = db.prepare(`
    INSERT INTO users (id, role, email, password, linkedId, status, name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (let i = 1; i < lines.length; i++) {
    const [studentId, name, series, roll, email] = lines[i].split(',').map(s => s.trim());
    const sid = uid('S');
    const rollNo = Number(roll);
    insStudent.run(sid, studentId, rollNo, name, email, '24', 3);

    // Create user login accounts for key demo students:
    // Roll 35 (Nabil Ahmed Arnob) and Roll 1 (Md. Ahnaf Azmain)
    if (studentId === '2410035' || studentId === '2410001') {
      insUser.run(uid('U'), 'student', email, 'student123', sid, 'active', name);
    }
    count++;
  }

  // 3. Populate sample attendance for these new students across existing 24 series sessions
  const sessions = db.prepare("SELECT id, createdAt, teacherId FROM sessions WHERE series = '24'").all();
  const newStudents = db.prepare("SELECT id FROM students WHERE series = '24'").all();
  const insAtt = db.prepare(`
    INSERT INTO attendance (id, sessionId, studentId, status, markedBy, timestamp, remarks, editedBy, editedTime)
    VALUES (?, ?, ?, ?, ?, ?, '', NULL, NULL)
  `);

  sessions.forEach(sess => {
    newStudents.forEach(st => {
      const r = Math.random();
      const status = r < 0.85 ? 'present' : (r < 0.94 ? 'absent' : 'late');
      insAtt.run(uid('A'), sess.id, st.id, status, sess.teacherId, sess.createdAt + 1000 * 60 * 30);
    });
  });

  db.exec('COMMIT;');
  console.log(`Successfully imported ${count} students for 24 Series into attendance.db!`);
} catch (err) {
  db.exec('ROLLBACK;');
  console.error('Error importing students:', err);
}
