const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'attendance.db');

let db = null;

function getDB() {
  if (!db) {
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
  25: [
    { code: 'ECE-1101', name: 'Circuit Theory I' },
    { code: 'ECE-1102', name: 'Physics for Engineers' },
    { code: 'ECE-1103', name: 'Structured Programming' },
    { code: 'ECE-1104', name: 'Engineering Mathematics I' },
  ],
  24: [
    { code: 'ECE-1201', name: 'Circuit Theory II' },
    { code: 'ECE-1202', name: 'Electronics I' },
    { code: 'ECE-1203', name: 'Engineering Drawing & CAD' },
    { code: 'ECE-1204', name: 'Differential Equations' },
  ],
  23: [
    { code: 'ECE-2401', name: 'Electronic Devices & Circuits II' },
    { code: 'ECE-2402', name: 'Electromagnetic Fields' },
    { code: 'ECE-2403', name: 'Electrical Machines I' },
    { code: 'ECE-2404', name: 'Numerical Methods' },
  ],
  22: [
    { code: 'ECE-3601', name: 'Microprocessor & Interfacing' },
    { code: 'ECE-3602', name: 'Digital Signal Processing' },
    { code: 'ECE-3603', name: 'Control Systems' },
    { code: 'ECE-3604', name: 'Power Electronics' },
  ],
  21: [
    { code: 'ECE-4801', name: 'Power System Protection' },
    { code: 'ECE-4802', name: 'VLSI Design' },
    { code: 'ECE-4803', name: 'Wireless Communication' },
    { code: 'ECE-4809', name: 'Thesis / Capstone Project' },
  ],
};

const TEACHER_SEED = [
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
      const tid = uid('T');
      const email = t.initial.toLowerCase() + '@ece.edu';
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
  uid,
  pad2,
  isoDate,
  dayName,
  SERIES_SEMESTER
};
