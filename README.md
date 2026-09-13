# RUET ECE Attendance Management System

A full-stack Attendance Management System built for the Department of Electrical & Computer Engineering, Rajshahi University of Engineering & Technology (RUET).

---

## ✨ Key Features

- **Portals for All Roles:**
  - **Department Admin:** Student management, bulk student deletion, course management, bulk course deletion, series manager, defaulter reports.
  - **Teacher:** Single-tap attendance taking, attendance history, official RUET Excel export, official RUET PDF export.
  - **Student:** Individual attendance overview, RUET mark calculation (RUET 14.2 Ordinance), attendance status breakdown.
- **Official RUET Reporting:**
  - **Excel (.xlsx) Export:** Exact official 42-column RUET attendance template with crest logo, department metadata, 39 date columns, `Atnd (%)`, and `Mark Obtained`.
  - **PDF Export:** Official 2-page portrait A4 format with institutional headers, vertical rotated dates, grid layout, and teacher signature lines.
- **SQLite Database:** Native `node:sqlite` database (`attendance.db`) pre-populated with 24 Series students (`2410001` - `2410060`).
- **RESTful API:** Clean backend architecture ready for future mobile apps (Flutter / React Native).

---

## 🚀 Setup & Running (For Groupmates)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [Git](https://git-scm.com/)

### 2. Clone and Install
```bash
git clone <YOUR-GITHUB-REPO-URL>
cd ece-attendance-system
npm install
```

### 3. Run the System
You can either:
- Double-click **`start_website.bat`** (on Windows)
- OR run in terminal:
  ```bash
  npm start
  ```

Open your browser at:
👉 **`http://localhost:3000`**

---

## 🔑 Login Credentials

| Role | Email | Password | Name / Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ece.ruet.ac.bd` | `admin123` | Department Administrator |
| **Teacher** | `faruk.ece@ruet.ac.bd` | `teacher123` | Dr. Md. Faruk Hossain |
| **Student** | `2410035@ece.ruet.ac.bd` | `student123` | Nabil Ahmed Arnob (Roll 35) |

---

## 📁 Project Structure

```
ece-attendance-system/
├── attendance.db           # SQLite database with 24 Series students
├── Excel.xlsx              # Official RUET Excel template
├── server.js               # Express server
├── package.json            # Dependencies & start scripts
├── start_website.bat       # 1-click Windows launcher
├── db/
│   └── database.js         # SQLite schema & initialization
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── attendance.js       # Mark & query attendance
│   ├── courses.js          # Course CRUD & bulk deletion
│   ├── students.js         # Student CRUD, import & bulk deletion
│   ├── reports.js          # Excel & PDF download endpoints
│   ├── teachers.js         # Teacher list & approval
│   └── series.js           # Series / cohorts
├── utils/
│   ├── excelGenerator.js   # OpenXML Excel generator with logo & styles
│   └── pdfGenerator.js     # jsPDF 2-page official RUET PDF generator
└── public/
    ├── index.html          # Frontend single-page app
    ├── styles.css          # Design system & dark theme
    ├── app.js              # Frontend client & interactions
    ├── ruet_logo.png       # RUET crest logo
    └── ruet_logo_sm.png    # Optimized PDF logo
```
