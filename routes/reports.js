const express = require('express');
const router = express.Router();
const { getDB, pad2 } = require('../db/database');

function getSetting(key, defVal) {
  const db = getDB();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : defVal;
}

const { generateRuetExcel } = require('../utils/excelGenerator');
const { generateRuetPdf } = require('../utils/pdfGenerator');

function getCourseReportData(code) {
  const db = getDB();
  const course = db.prepare(`
    SELECT c.*, t.name as teacherName 
    FROM courses c 
    LEFT JOIN teachers t ON c.teacherId = t.id 
    WHERE c.code = ?
  `).get(code);

  if (!course) return null;

  const threshold = Number(getSetting('threshold', 75));
  const sessCount = db.prepare('SELECT COUNT(*) as cnt FROM sessions WHERE courseCode = ?').get(code).cnt;

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

  const sessions = db.prepare('SELECT id, date, day FROM sessions WHERE courseCode = ? ORDER BY date ASC, createdAt ASC').all(code);
  const formattedSessions = sessions.map(sess => {
    const parts = sess.date.split('-');
    const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}` : sess.date;
    return {
      id: sess.id,
      date: sess.date,
      formattedDate: formatted
    };
  });

  const matrixStudents = [];

  const rows = roster.map(s => {
    const allMarks = db.prepare('SELECT sessionId, status FROM attendance WHERE studentId = ?').all(s.id);
    const markMap = {};
    allMarks.forEach(m => {
      let code = 'A';
      if (m.status === 'present') code = 'P';
      else if (m.status === 'late') code = 'L';
      else if (m.status === 'absent') code = 'A';
      markMap[m.sessionId] = code;
    });

    const stats = db.prepare(`
      SELECT 
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
        COUNT(*) as total
      FROM attendance a
      JOIN sessions sess ON a.sessionId = sess.id
      WHERE sess.courseCode = ? AND a.studentId = ?
    `).get(code, s.id);

    const attended = stats.present + stats.late;
    const pct = stats.total > 0 ? (attended / stats.total) * 100 : 0;

    let marks = 0;
    if (pct >= 90) marks = 10;
    else if (pct >= 85) marks = 9;
    else if (pct >= 80) marks = 8;
    else if (pct >= 75) marks = 7;
    else if (pct >= 70) marks = 6;
    else if (pct >= 65) marks = 5;
    else if (pct >= 60) marks = 4;

    matrixStudents.push({
      rollNo: s.rollNo,
      studentId: s.studentId,
      name: s.name,
      sessionMarks: markMap,
      attndPct: Math.round(pct * 10) / 10,
      markObtained: marks
    });

    return {
      'Roll No': pad2(s.rollNo),
      'Student ID': s.studentId,
      'Name': s.name,
      'Conducted': sessCount,
      'Present': stats.present,
      'Absent': stats.absent,
      'Late': stats.late,
      'Attendance %': pct.toFixed(1),
      'Marks (/10)': marks,
      'Remarks': (stats.total > 0 && pct < threshold) ? 'Below threshold' : ''
    };
  });

  const deptName = getSetting('deptName', 'Dept. of Electrical & Computer Engineering');
  const teacherName = course.teacherName || 'Not Found';

  return {
    ok: true,
    course,
    threshold,
    deptName,
    teacherName,
    sessions: formattedSessions,
    students: matrixStudents,
    rows
  };
}

// GET /api/reports/course/:code
router.get('/course/:code', (req, res) => {
  const data = getCourseReportData(req.params.code);
  if (!data) {
    return res.status(404).json({ ok: false, msg: 'Course not found.' });
  }
  return res.json(data);
});

// GET /api/reports/course/:code/excel (Direct download matching Excel.xlsx exactly)
router.get('/course/:code/excel', async (req, res) => {
  try {
    const data = getCourseReportData(req.params.code);
    if (!data) return res.status(404).send('Course not found');
    const xlsxBuf = await generateRuetExcel(data);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.code}_attendance_report.xlsx"`);
    return res.send(xlsxBuf);
  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).send('Failed to generate Excel report');
  }
});

// GET /api/reports/course/:code/pdf (Direct download matching official RUET PDF exactly)
router.get('/course/:code/pdf', (req, res) => {
  try {
    const data = getCourseReportData(req.params.code);
    if (!data) return res.status(404).send('Course not found');
    const pdfBuf = generateRuetPdf(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.code}_attendance_report.pdf"`);
    return res.send(pdfBuf);
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).send('Failed to generate PDF report');
  }
});

// GET /api/reports/defaulters?courseCode=...&threshold=...
router.get('/defaulters', (req, res) => {
  const { courseCode, threshold } = req.query;
  const db = getDB();
  const th = Number(threshold) || Number(getSetting('threshold', 75));

  let courses = [];
  if (courseCode && courseCode !== 'all') {
    const c = db.prepare('SELECT * FROM courses WHERE code = ?').get(courseCode);
    if (c) courses.push(c);
  } else {
    courses = db.prepare('SELECT * FROM courses ORDER BY series ASC, code ASC').all();
  }

  const rows = [];
  courses.forEach(c => {
    let roster = [];
    if (c.enrolledStudentIds) {
      try {
        const ids = JSON.parse(c.enrolledStudentIds);
        if (Array.isArray(ids) && ids.length > 0) {
          const placeholders = ids.map(() => '?').join(',');
          roster = db.prepare(`SELECT * FROM students WHERE id IN (${placeholders}) ORDER BY rollNo ASC`).all(...ids);
        }
      } catch (e) {}
    }
    if (roster.length === 0) {
      roster = db.prepare('SELECT * FROM students WHERE series = ? ORDER BY rollNo ASC').all(c.series);
    }

    roster.forEach(s => {
      const stats = db.prepare(`
        SELECT 
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
          COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
          COUNT(*) as total
        FROM attendance a
        JOIN sessions sess ON a.sessionId = sess.id
        WHERE sess.courseCode = ? AND a.studentId = ?
      `).get(c.code, s.id);

      if (stats.total > 0) {
        const attended = stats.present + stats.late;
        const pct = (attended / stats.total) * 100;
        if (pct < th) {
          rows.push({
            'Roll No': pad2(s.rollNo),
            'Student ID': s.studentId,
            'Name': s.name,
            'Course': c.code,
            'Attendance %': pct.toFixed(1),
            'Present': stats.present,
            'Absent': stats.absent,
            'Late': stats.late
          });
        }
      }
    });
  });

  return res.json({ ok: true, threshold: th, rows });
});

// GET /api/reports/series/:series
router.get('/series/:series', (req, res) => {
  const series = req.params.series;
  const db = getDB();
  const courses = db.prepare('SELECT * FROM courses WHERE series = ? ORDER BY code ASC').all(series);

  const rows = courses.map(c => {
    const teacher = c.teacherId ? db.prepare('SELECT name FROM teachers WHERE id = ?').get(c.teacherId) : null;
    const sessCount = db.prepare('SELECT COUNT(*) as cnt FROM sessions WHERE courseCode = ?').get(c.code).cnt;

    const attRow = db.prepare(`
      SELECT 
        COUNT(CASE WHEN a.status != 'absent' THEN 1 END) as attended,
        COUNT(*) as total
      FROM attendance a
      JOIN sessions s ON a.sessionId = s.id
      WHERE s.courseCode = ?
    `).get(c.code);

    const avg = attRow.total > 0 ? (attRow.attended / attRow.total) * 100 : 0;

    return {
      'Course': c.code,
      'Title': c.name,
      'Teacher': teacher ? teacher.name : 'Unassigned',
      'Sessions': sessCount,
      'Avg Attendance %': avg.toFixed(1)
    };
  });

  return res.json({ ok: true, series, rows });
});

module.exports = router;
