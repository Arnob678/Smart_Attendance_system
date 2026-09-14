const { DatabaseSync } = require('node:sqlite');
const os = require('os');
const path = require('path');
const fs = require('fs');

const SEED_DB_PATH = path.join(__dirname, '..', 'attendance.db');
const DB_PATH = process.env.VERCEL
  ? path.join(os.tmpdir(), 'attendance.db')
  : SEED_DB_PATH;

let db = null;

function getDB() {
  if (!db) {
    if (process.env.VERCEL) {
      const tmpDir = path.dirname(DB_PATH);
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      if (!fs.existsSync(DB_PATH) && fs.existsSync(SEED_DB_PATH)) {
        try {
          fs.copyFileSync(SEED_DB_PATH, DB_PATH);
        } catch (e) {
          console.error('Failed to copy seed database to tmpdir:', e);
        }
      }
    }
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA synchronous = NORMAL;');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS series (
      code TEXT PRIMARY KEY,
      semester INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      initial TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      studentId TEXT UNIQUE NOT NULL,
      rollNo INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      series TEXT NOT NULL,
      semester INTEGER NOT NULL,
      photo TEXT
    );

    CREATE TABLE IF NOT EXISTS courses (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      series TEXT NOT NULL,
      semester INTEGER NOT NULL,
      teacherId TEXT,
      creditHours INTEGER DEFAULT 3,
      enrolledStudentIds TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      day TEXT NOT NULL,
      courseCode TEXT NOT NULL,
      series TEXT NOT NULL,
      semester INTEGER NOT NULL,
      teacherId TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      status TEXT NOT NULL,
      markedBy TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      remarks TEXT DEFAULT '',
      editedBy TEXT,
      editedTime INTEGER,
      UNIQUE(sessionId, studentId)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      linkedId TEXT,
      status TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      time INTEGER NOT NULL,
      read INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(sessionId);
    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(studentId);
    CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(courseCode);
    CREATE INDEX IF NOT EXISTS idx_students_series ON students(series);
  `);

  // Check if seeding is needed
  const userCountStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const userCount = userCountStmt.get().count;
  if (userCount === 0) {
    seedDatabase();
  }
  ensureEssentialRecords(db);
}

function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function isoDate(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function dayName(iso) {
  return DAYS[new Date(iso + 'T00:00:00').getDay()];
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const FIRST_NAMES = [
  'Aarav','Ayesha','Rakib','Farhana','Tanvir','Nusrat','Imran','Sadia','Fahim','Nabila',
  'Shafiq','Mahmuda','Rafi','Jannatul','Sabbir','Tahmina','Arif','Rummana','Naeem','Shirin',
  'Kamrul','Afsana','Rasel','Mim','Shakil','Priya','Anik','Tania','Hasan','Ruma',
  'Zubair','Kanta','Emon','Lubna','Sohel','Marufa','Rifat','Sumaiya','Wasim','Rehnuma',
  'Asif','Farzana','Nayeem','Poly','Shuvo','Shathi','Riaz','Momo','Al Amin','Rima',
  'Tamim','Kona','Habib','Mukta','Zahid','Sathi','Rony','Liza','Sazzad','Jui'
];

const LAST_NAMES = [
  'Rahman','Islam','Ahmed','Hossain','Chowdhury','Khan','Akter','Alam','Uddin','Sarker',
  'Karim','Haque','Siddique','Mia','Talukder','Bhuiyan','Molla','Sheikh','Reza','Nabi'
];

function genFullName() {
  return pick(FIRST_NAMES) + ' ' + pick(LAST_NAMES);
}

const SERIES_LIST = ['21', '22', '23', '24', '25'];
const SERIES_SEMESTER = { 25: 1, 24: 3, 23: 4, 22: 6, 21: 8 };

const COURSE_CATALOG = {
  25: [],
  24: [
    { code: 'ECE-2103', name: 'Data structure and Algorithm' },
    { code: 'ECE-2105', name: 'Analog Electronics and Sessional' },
  ],
  23: [],
  22: [],
  21: []
};

const TEACHER_SEED = [
  { name: 'Moloy Kumer Ghosh', initial: 'MKG', email: 'moloy@gmail.com', id: 'T_eaprx35xta9' },
  { name: 'Md Faisal Ahmed', initial: 'MFA', email: 'faisal@gmail.com', id: 'T_bzhhe4abq6j' },
  { name: 'Dr. Mahbubur Rahman', initial: 'MR' },
  { name: 'Prof. Ayesha Siddika', initial: 'AS' },
  { name: 'Dr. Faruk Hossain', initial: 'FH' },
  { name: 'Dr. Nusrat Jahan', initial: 'NJ' },
  { name: 'Prof. Kamal Uddin', initial: 'KU' },
  { name: 'Dr. Shamima Akter', initial: 'SA' },
  { name: 'Dr. Rashedul Islam', initial: 'RI' },
  { name: 'Prof. Tania Ferdous', initial: 'TF' },
];

function seedDatabase() {
  console.log('Seeding SQLite database inside transaction...');
  db.exec('BEGIN TRANSACTION;');

  try {
    // 1. Series
    const insSeries = db.prepare('INSERT INTO series (code, semester) VALUES (?, ?)');
    for (const s of SERIES_LIST) {
      insSeries.run(s, SERIES_SEMESTER[s]);
    }

    // 2. Settings
    const insSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insSetting.run('deptName', 'Electrical & Computer Engineering Department');
    insSetting.run('threshold', '75');
    insSetting.run('editWindowHours', '48');
    insSetting.run('currentSemesterLabel', 'Fall 2026');

    // 3. Teachers
    const insTeacher = db.prepare('INSERT INTO teachers (id, name, initial, email, status) VALUES (?, ?, ?, ?, ?)');
    const insUser = db.prepare('INSERT INTO users (id, role, email, password, linkedId, status, name) VALUES (?, ?, ?, ?, ?, ?, ?)');

    const createdTeachers = [];
    TEACHER_SEED.forEach(t => {
      const tid = t.id || uid('T');
      const email = t.email || (t.initial.toLowerCase() + '@ece.edu');
      insTeacher.run(tid, t.name, t.initial, email, 'approved');
      createdTeachers.push({ id: tid, name: t.name, initial: t.initial, email });
    });

    // 4. Courses
    const insCourse = db.prepare('INSERT INTO courses (code, name, series, semester, teacherId, creditHours, enrolledStudentIds) VALUES (?, ?, ?, ?, ?, ?, ?)');
    let tIdx = 0;
    const createdCourses = [];
    SERIES_LIST.forEach(series => {
      COURSE_CATALOG[series].forEach(c => {
        const teacher = createdTeachers[tIdx % createdTeachers.length];
        tIdx++;
        const credits = c.code.endsWith('09') ? 6 : 3;
        insCourse.run(c.code, c.name, series, SERIES_SEMESTER[series], teacher.id, credits, null);
        createdCourses.push({ code: c.code, name: c.name, series, semester: SERIES_SEMESTER[series], teacherId: teacher.id });
      });
    });

    // 5. Students (60 per series = 300 students)
    const insStudent = db.prepare('INSERT INTO students (id, studentId, rollNo, name, email, series, semester, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const createdStudents = [];
    SERIES_LIST.forEach(series => {
      for (let roll = 1; roll <= 60; roll++) {
        const sid = uid('S');
        const studentId = `ECE-${series}-${pad2(roll)}`;
        const name = genFullName();
        const email = `${series}${pad2(roll)}@ece.edu`;
        insStudent.run(sid, studentId, roll, name, email, series, SERIES_SEMESTER[series], null);
        createdStudents.push({ id: sid, studentId, rollNo: roll, name, email, series });
      }
    });

    // 6. Past Class Sessions & Attendance History
    const insSession = db.prepare('INSERT INTO sessions (id, date, day, courseCode, series, semester, teacherId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const insAtt = db.prepare('INSERT INTO attendance (id, sessionId, studentId, status, markedBy, timestamp, remarks, editedBy, editedTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

    const today = new Date();
    createdCourses.forEach(course => {
      const roster = createdStudents.filter(s => s.series === course.series);
      const sessionsCount = 8;
      let cursor = new Date(today);
      const dates = [];
      while (dates.length < sessionsCount) {
        cursor = new Date(cursor.getTime() - 1000 * 60 * 60 * 24 * (3 + Math.floor(Math.random() * 2)));
        if (cursor.getDay() !== 5) dates.push(new Date(cursor)); // Skip Friday
      }
      dates.reverse();

      dates.forEach(d => {
        const iso = isoDate(d);
        const sessId = uid('SS');
        const createdAt = d.getTime();
        insSession.run(sessId, iso, dayName(iso), course.code, course.series, course.semester, course.teacherId, createdAt);

        roster.forEach(student => {
          const r = Math.random();
          const status = r < 0.83 ? 'present' : (r < 0.93 ? 'absent' : 'late');
          insAtt.run(uid('A'), sessId, student.id, status, course.teacherId, createdAt + 1000 * 60 * 35, '', null, null);
        });
      });
    });

    // 7. Users / Logins
    insUser.run(uid('U'), 'admin', 'admin@ece.edu', 'admin123', null, 'active', 'Department Admin');

    createdTeachers.slice(0, 4).forEach(t => {
      insUser.run(uid('U'), 'teacher', t.email, 'teacher123', t.id, 'active', t.name);
    });

    const pendingTid = uid('T');
    insTeacher.run(pendingTid, 'Eng. Rifat Kabir', 'RK', 'rk@ece.edu', 'pending');
    insUser.run(uid('U'), 'teacher', 'rk@ece.edu', 'teacher123', pendingTid, 'pending', 'Eng. Rifat Kabir');

    const demoStudent = createdStudents.find(s => s.series === '22' && s.rollNo === 1);
    if (demoStudent) {
      insUser.run(uid('U'), 'student', demoStudent.email, 'student123', demoStudent.id, 'active', demoStudent.name);
    }

    // 8. Notifications
    const insNotif = db.prepare('INSERT INTO notifications (id, text, time, read) VALUES (?, ?, ?, ?)');
    insNotif.run(uid('N'), 'Attendance marking scheme updated by Department Admin.', Date.now() - 1000 * 60 * 60 * 20, 0);
    insNotif.run(uid('N'), 'New teacher account pending approval: Eng. Rifat Kabir.', Date.now() - 1000 * 60 * 60 * 5, 0);

    db.exec('COMMIT;');
    console.log('Database seeded successfully in transaction!');
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Error during seeding, rolled back:', err);
    throw err;
  }
}

function ensureEssentialRecords(database) {
  const d = database || db;
  if (!d) return;

  try {
    // 1. Ensure Teachers
    const teacherStmt = d.prepare('SELECT id FROM teachers WHERE LOWER(email) = LOWER(?)');
    const insTeacher = d.prepare('INSERT INTO teachers (id, name, initial, email, status) VALUES (?, ?, ?, ?, ?)');
    const updTeacherStatus = d.prepare('UPDATE teachers SET status = ?, name = ?, initial = ? WHERE id = ?');

    let moloyT = teacherStmt.get('moloy@gmail.com');
    let moloyTid = moloyT ? moloyT.id : 'T_eaprx35xta9';
    if (!moloyT) {
      insTeacher.run(moloyTid, 'Moloy Kumer Ghosh', 'MKG', 'moloy@gmail.com', 'approved');
    } else {
      updTeacherStatus.run('approved', 'Moloy Kumer Ghosh', 'MKG', moloyT.id);
    }

    let faisalT = teacherStmt.get('faisal@gmail.com');
    let faisalTid = faisalT ? faisalT.id : 'T_bzhhe4abq6j';
    if (!faisalT) {
      insTeacher.run(faisalTid, 'Md Faisal Ahmed', 'MFA', 'faisal@gmail.com', 'approved');
    } else {
      updTeacherStatus.run('approved', 'Md Faisal Ahmed', 'MFA', faisalT.id);
    }

    // 2. Ensure Students (Ahnaf & Arnob)
    const studentStmt = d.prepare('SELECT id FROM students WHERE LOWER(studentId) = LOWER(?)');
    const insStudent = d.prepare('INSERT INTO students (id, studentId, rollNo, name, email, series, semester, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

    let ahnafS = studentStmt.get('2410001');
    let ahnafSid = ahnafS ? ahnafS.id : 'S_0yksmkxl2md';
    if (!ahnafS) {
      insStudent.run(ahnafSid, '2410001', 1, 'Md. Ahnaf Azmain', '2410001@ece.ruet.ac.bd', '24', 3, null);
    }

    let arnobS = studentStmt.get('2410035');
    let arnobSid = arnobS ? arnobS.id : 'S_z71k9h7l2md';
    if (!arnobS) {
      insStudent.run(arnobSid, '2410035', 35, 'Nabil Ahmed Arnob', '2410035@ece.ruet.ac.bd', '24', 3, null);
    }

    // 3. Ensure Users
    const userStmt = d.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)');
    const insUser = d.prepare('INSERT INTO users (id, role, email, password, linkedId, status, name) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const updUser = d.prepare('UPDATE users SET role = ?, password = ?, linkedId = ?, status = ?, name = ? WHERE id = ?');

    // Admin
    const adminU = userStmt.get('admin@ece.edu');
    if (!adminU) {
      insUser.run('U_r3zv1rgn1mq', 'admin', 'admin@ece.edu', 'admin123', null, 'active', 'Department Admin');
    } else {
      updUser.run('admin', 'admin123', null, 'active', 'Department Admin', adminU.id);
    }

    // Teacher Moloy
    const moloyU = userStmt.get('moloy@gmail.com');
    if (!moloyU) {
      insUser.run('U_0yslcyfxtat', 'teacher', 'moloy@gmail.com', 'teacher123', moloyTid, 'active', 'Moloy Kumer Ghosh');
    } else {
      updUser.run('teacher', 'teacher123', moloyTid, 'active', 'Moloy Kumer Ghosh', moloyU.id);
    }

    // Teacher Faisal
    const faisalU = userStmt.get('faisal@gmail.com');
    if (!faisalU) {
      insUser.run('U_85ah0ndbq6j', 'teacher', 'faisal@gmail.com', 'teacher123', faisalTid, 'active', 'Md Faisal Ahmed');
    } else {
      updUser.run('teacher', 'teacher123', faisalTid, 'active', 'Md Faisal Ahmed', faisalU.id);
    }

    // Student Ahnaf
    const ahnafU = userStmt.get('2410001@ece.ruet.ac.bd');
    if (!ahnafU) {
      insUser.run('U_qycd2k4l2md', 'student', '2410001@ece.ruet.ac.bd', 'student123', ahnafSid, 'active', 'Md. Ahnaf Azmain');
    } else {
      updUser.run('student', 'student123', ahnafSid, 'active', 'Md. Ahnaf Azmain', ahnafU.id);
    }

    // Student Arnob
    const arnobU = userStmt.get('2410035@ece.ruet.ac.bd');
    if (!arnobU) {
      insUser.run('U_2lr1jowl2md', 'student', '2410035@ece.ruet.ac.bd', '01130261', arnobSid, 'active', 'Nabil Ahmed Arnob');
    } else {
      updUser.run('student', '01130261', arnobSid, 'active', 'Nabil Ahmed Arnob', arnobU.id);
    }

    // 4. Ensure Courses (ECE-2105 & ECE-2103)
    const courseStmt = d.prepare('SELECT code, teacherId, enrolledStudentIds FROM courses WHERE code = ?');
    const insCourse = d.prepare('INSERT INTO courses (code, name, series, semester, teacherId, creditHours, enrolledStudentIds) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const updCourseTeacher = d.prepare('UPDATE courses SET teacherId = ?, enrolledStudentIds = COALESCE(?, enrolledStudentIds) WHERE code = ?');

    // Fetch Series 24 students for enrollment list
    const s24Rows = d.prepare("SELECT id FROM students WHERE series = '24' ORDER BY rollNo ASC").all();
    const s24Ids = s24Rows.map(r => r.id);
    const enrolledJson = s24Ids.length > 0 ? JSON.stringify(s24Ids) : null;

    const c2105 = courseStmt.get('ECE-2105');
    if (!c2105) {
      insCourse.run('ECE-2105', 'Analog Electronics and Sessional', '24', 3, moloyTid, 3, enrolledJson);
    } else if (!c2105.teacherId || !c2105.enrolledStudentIds) {
      updCourseTeacher.run(moloyTid, enrolledJson, 'ECE-2105');
    }

    const c2103 = courseStmt.get('ECE-2103');
    if (!c2103) {
      insCourse.run('ECE-2103', 'Data structure and Algorithm', '24', 3, faisalTid, 3, enrolledJson);
    } else if (!c2103.teacherId || !c2103.enrolledStudentIds) {
      updCourseTeacher.run(faisalTid, enrolledJson, 'ECE-2103');
    }
  } catch (err) {
    console.error('Error in ensureEssentialRecords:', err);
  }
}

function resetDatabase() {
  db.exec(`
    DROP TABLE IF EXISTS attendance;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS courses;
    DROP TABLE IF EXISTS students;
    DROP TABLE IF EXISTS teachers;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS series;
    DROP TABLE IF EXISTS notifications;
  `);
  initSchema();
}

module.exports = {
  getDB,
  resetDatabase,
  ensureEssentialRecords,
  uid,
  pad2,
  isoDate,
  dayName,
  SERIES_SEMESTER
};
