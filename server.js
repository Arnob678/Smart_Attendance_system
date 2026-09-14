const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDB } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files with no-cache headers for instantaneous browser updates
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Ensure DB is initialized
getDB();

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/series', require('./routes/series'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/notifications', require('./routes/notifications'));

// Dashboard Stats endpoint
app.get('/api/stats/department', (req, res) => {
  const db = getDB();
  const totalStudents = db.prepare('SELECT COUNT(*) as cnt FROM students').get().cnt;
  const totalTeachers = db.prepare("SELECT COUNT(*) as cnt FROM teachers WHERE status = 'approved'").get().cnt;
  const pendingTeachers = db.prepare("SELECT * FROM teachers WHERE status = 'pending'").all();
  const totalCourses = db.prepare('SELECT COUNT(*) as cnt FROM courses').get().cnt;

  const attRow = db.prepare(`
    SELECT 
      COUNT(CASE WHEN status != 'absent' THEN 1 END) as attended,
      COUNT(*) as total
    FROM attendance
  `).get();

  const avgAttendance = attRow.total > 0 ? (attRow.attended / attRow.total) * 100 : 0;

  // Series overview
  const seriesList = db.prepare('SELECT * FROM series ORDER BY code ASC').all();
  const seriesOverview = seriesList.map(s => {
    const sCount = db.prepare('SELECT COUNT(*) as cnt FROM students WHERE series = ?').get(s.code).cnt;
    const cCount = db.prepare('SELECT COUNT(*) as cnt FROM courses WHERE series = ?').get(s.code).cnt;
    const sessCount = db.prepare('SELECT COUNT(*) as cnt FROM sessions WHERE series = ?').get(s.code).cnt;

    const sAtt = db.prepare(`
      SELECT 
        COUNT(CASE WHEN a.status != 'absent' THEN 1 END) as attended,
        COUNT(*) as total
      FROM attendance a
      JOIN sessions sess ON a.sessionId = sess.id
      WHERE sess.series = ?
    `).get(s.code);

    const sAvg = sAtt.total > 0 ? (sAtt.attended / sAtt.total) * 100 : 0;

    return {
      series: s.code,
      semester: s.semester,
      studentCount: sCount,
      courseCount: cCount,
      totalSessions: sessCount,
      avgAttendance: parseFloat(sAvg.toFixed(1))
    };
  });

  return res.json({
    ok: true,
    totalStudents,
    totalTeachers,
    pendingTeachers,
    totalCourses,
    avgAttendance: parseFloat(avgAttendance.toFixed(1)),
    seriesOverview
  });
});

// Fallback to index.html for single page client
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server when run directly (local development or persistent server)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(` ECE Attendance Server running at:`);
    console.log(` Local:   http://localhost:${PORT}`);
    console.log(` Network: http://0.0.0.0:${PORT} (accessible from mobile)`);
    console.log(`===================================================`);
  });
}

module.exports = app;
