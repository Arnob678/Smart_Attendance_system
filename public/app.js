/* ============================================================
   ECE ATTENDANCE MANAGEMENT SYSTEM — FRONTEND CLIENT
   Communicates with the Node.js / Express REST API Backend
   ============================================================ */

const SESSION_KEY = 'ece_attendance_session_v2';
const THEME_KEY = 'ece_attendance_theme_v2';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/* ---------- Utility Functions ---------- */
function pad2(n){ return String(n).padStart(2,'0'); }
function isoDate(d){ return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
function fmtDate(iso){ if(!iso) return ''; const d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
function fmtDateShort(iso){ if(!iso) return ''; const d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function fmtTime(ts){ if(!ts) return '—'; return new Date(ts).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}); }
function dayName(iso){ return DAYS[new Date(iso+'T00:00:00').getDay()]; }
function todayISO(){ return isoDate(new Date()); }
function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function initials(name){ return (name||'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }

/* ---------- REST API Client ---------- */
const api = {
  async req(endpoint, method = 'GET', body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch('/api' + endpoint, opts);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('API Request Error:', err);
      return { ok: false, msg: 'Network error or server unreachable. Check connection.' };
    }
  },
  get(endpoint, params = {}) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') q.append(k, v);
    }
    const qs = q.toString();
    return this.req(endpoint + (qs ? '?' + qs : ''), 'GET');
  },
  post(endpoint, body) { return this.req(endpoint, 'POST', body); },
  put(endpoint, body) { return this.req(endpoint, 'PUT', body); },
  del(endpoint) { return this.req(endpoint, 'DELETE'); }
};

/* ============================================================
   AUTH & SESSION STATE
   ============================================================ */
let SESSION = null;
let SYSTEM_SETTINGS = {
  deptName: 'Electrical & Computer Engineering Department',
  threshold: 75,
  editWindowHours: 48,
  currentSemesterLabel: 'Fall 2026'
};

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    SESSION = raw ? JSON.parse(raw) : null;
  } catch (e) {
    SESSION = null;
  }
}
function saveSession(sess) {
  SESSION = sess;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
  localStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  SESSION = null;
}

async function loadSystemSettings() {
  const res = await api.get('/settings');
  if (res.ok && res.settings) {
    SYSTEM_SETTINGS = res.settings;
  }
}

/* ============================================================
   UI ICONS & CALENDAR
   ============================================================ */
const ICONS = {
  dashboard:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  attendance:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  history:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  reports:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5a1 1 0 0 1 1-1h9l6 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="M13 4v6h6"/><path d="M8 13h8M8 17h5"/></svg>',
  courses:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>',
  students:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  teachers:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5Z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></svg>',
  series:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
  settings:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>',
  percent:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
  profile:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  check:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  x:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  edit:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>',
  upload:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  plus:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  download:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  search:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
};

const CAL_ICON = `<svg class="date-wrap-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CAL_DOW = ['Su','Mo','Tu','We','Th','Fr','Sa'];
let _calState = null;

function _calOutsideHandler(e){
  const pop = document.getElementById('calPopover');
  if(pop && _calState && !pop.contains(e.target) && e.target !== _calState.inputEl){
    closeCalendarPicker();
  }
}
function closeCalendarPicker(){
  const el = document.getElementById('calPopover');
  if(el) el.remove();
  document.removeEventListener('mousedown', _calOutsideHandler, true);
  _calState = null;
}
function positionCalendarPopover(inputEl, pop){
  const r = inputEl.getBoundingClientRect();
  let top = r.bottom + window.scrollY + 6;
  let left = r.left + window.scrollX;
  const popW = 280;
  if(left + popW > window.innerWidth - 12) left = window.innerWidth - popW - 12;
  if(left < 12) left = 12;
  pop.style.top = top+'px';
  pop.style.left = left+'px';
}
function openCalendarPicker(inputEl, opts){
  opts = opts || {};
  closeCalendarPicker();
  const val = inputEl.value && /^\d{4}-\d{2}-\d{2}$/.test(inputEl.value) ? new Date(inputEl.value+'T00:00:00') : new Date();
  _calState = { inputEl, viewYear: val.getFullYear(), viewMonth: val.getMonth(),
    min: opts.min || null, max: opts.max || null, onSelect: opts.onSelect || null };
  const pop = document.createElement('div');
  pop.id = 'calPopover';
  pop.className = 'cal-popover';
  document.body.appendChild(pop);
  positionCalendarPopover(inputEl, pop);
  renderCalendarPopover();
  setTimeout(()=>document.addEventListener('mousedown', _calOutsideHandler, true), 0);
}
function renderCalendarPopover(){
  const pop = document.getElementById('calPopover');
  if(!pop || !_calState) return;
  const {viewYear, viewMonth, min, max, inputEl} = _calState;
  const first = new Date(viewYear, viewMonth, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();
  const selectedISO = inputEl.value;
  const todayIso = todayISO();

  let cells = '';
  for(let i=0;i<startDow;i++){
    cells += `<button type="button" class="cal-day outside" disabled>${daysInPrevMonth - startDow + 1 + i}</button>`;
  }
  for(let d=1; d<=daysInMonth; d++){
    const iso = `${viewYear}-${pad2(viewMonth+1)}-${pad2(d)}`;
    let disabled = (min && iso < min) || (max && iso > max);
    const cls = ['cal-day'];
    if(iso===selectedISO) cls.push('selected');
    if(iso===todayIso) cls.push('today');
    cells += `<button type="button" class="${cls.join(' ')}" ${disabled?'disabled':''} onclick="selectCalendarDate('${iso}')">${d}</button>`;
  }
  const trailing = (7 - ((startDow + daysInMonth) % 7)) % 7;
  for(let d=1; d<=trailing; d++){ cells += `<button type="button" class="cal-day outside" disabled>${d}</button>`; }

  pop.innerHTML = `
    <div class="cal-head">
      <button type="button" class="cal-nav" onclick="calNavMonth(-1)" aria-label="Previous month">&lsaquo;</button>
      <div class="cal-title">${CAL_MONTHS[viewMonth]} ${viewYear}</div>
      <button type="button" class="cal-nav" onclick="calNavMonth(1)" aria-label="Next month">&rsaquo;</button>
    </div>
    <div class="cal-dow">${CAL_DOW.map(d=>`<span>${d}</span>`).join('')}</div>
    <div class="cal-grid">${cells}</div>
    <div class="cal-foot">
      <button type="button" class="subtle-btn" onclick="selectCalendarDate('${todayIso}')" ${(min&&todayIso<min)||(max&&todayIso>max)?'disabled':''}>Today</button>
      <button type="button" class="subtle-btn" onclick="closeCalendarPicker()">Close</button>
    </div>`;
}
function calNavMonth(delta){
  if(!_calState) return;
  _calState.viewMonth += delta;
  if(_calState.viewMonth<0){ _calState.viewMonth=11; _calState.viewYear--; }
  if(_calState.viewMonth>11){ _calState.viewMonth=0; _calState.viewYear++; }
  renderCalendarPopover();
}
function selectCalendarDate(iso){
  if(!_calState) return;
  const {inputEl, onSelect} = _calState;
  inputEl.value = iso;
  inputEl.dispatchEvent(new Event('change', {bubbles:true}));
  if(onSelect) onSelect(iso);
  closeCalendarPicker();
}
function initDatePicker(inputId, opts){
  const el = document.getElementById(inputId);
  if(!el) return;
  el.readOnly = true;
  el.classList.add('cal-trigger');
  el.addEventListener('click', ()=>openCalendarPicker(el, opts||{}));
}

/* ============================================================
   SHELL: TOAST, MODAL, THEME, NAVIGATION
   ============================================================ */
let toastTimer;
function showToast(msg, type){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type?(' '+type):'');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ el.classList.remove('show'); }, 3200);
}

function openModal(html, wide){
  const box = document.getElementById('modalBox');
  box.className = 'modal-box' + (wide?' wide':'');
  box.innerHTML = html;
  document.getElementById('modalRoot').classList.add('show');
}
function closeModal(){ document.getElementById('modalRoot').classList.remove('show'); }
document.getElementById('modalRoot').addEventListener('click', e=>{ if(e.target.id==='modalRoot') closeModal(); });

let sidebarOpen = false;
function toggleSidebar(){ sidebarOpen=!sidebarOpen; document.getElementById('sidebar').classList.toggle('open',sidebarOpen); document.getElementById('scrim').classList.toggle('show',sidebarOpen); }
function closeSidebar(){ sidebarOpen=false; document.getElementById('sidebar').classList.remove('open'); document.getElementById('scrim').classList.remove('show'); }

function toggleTheme(){
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme')==='dark';
  setTheme(isDark ? 'light' : 'dark');
}
function setTheme(mode){
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem(THEME_KEY, mode);
  document.getElementById('themeIconSun').style.display = mode==='dark' ? 'none' : 'block';
  document.getElementById('themeIconMoon').style.display = mode==='dark' ? 'block' : 'none';
}
function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(saved || (prefersDark?'dark':'light'));
}

const NAV_CONFIG = {
  teacher: [
    {id:'dashboard', label:'Dashboard', icon:'dashboard'},
    {id:'attendance', label:'Attendance', icon:'attendance'},
    {id:'series', label:'By Series', icon:'series'},
    {id:'history', label:'Attendance History', icon:'history'},
    {id:'courses', label:'My Courses', icon:'courses'},
    {id:'reports', label:'Reports & Export', icon:'reports'},
    {id:'settings', label:'Account', icon:'settings'},
  ],
  student: [
    {id:'dashboard', label:'Dashboard', icon:'dashboard'},
    {id:'today', label:"Today's Attendance", icon:'attendance'},
    {id:'history', label:'Attendance History', icon:'history'},
    {id:'courses', label:'Course-wise', icon:'courses'},
    {id:'settings', label:'Profile', icon:'profile'},
  ],
  admin: [
    {id:'dashboard', label:'Dashboard', icon:'dashboard'},
    {id:'teachers', label:'Teachers', icon:'teachers'},
    {id:'students', label:'Students', icon:'students'},
    {id:'courses', label:'Courses', icon:'courses'},
    {id:'series', label:'Series & Semesters', icon:'series'},
    {id:'reports', label:'Department Reports', icon:'reports'},
    {id:'settings', label:'System Settings', icon:'settings'},
  ],
};

let currentPage = 'dashboard';

async function renderNav(){
  if (!SESSION) return;
  const items = NAV_CONFIG[SESSION.role] || [];
  const nav = document.getElementById('nav');
  document.getElementById('navTitle').textContent = SESSION.role==='admin' ? 'Administration' : 'Workspace';
  
  let pendingCount = 0;
  if (SESSION.role === 'admin') {
    const teachRes = await api.get('/teachers');
    if (teachRes.ok && teachRes.teachers) {
      pendingCount = teachRes.teachers.filter(t => t.status === 'pending').length;
    }
  }

  nav.innerHTML = items.map(it => {
    let badge = '';
    if (it.id === 'teachers' && pendingCount > 0) {
      badge = `<span class="nav-badge">${pendingCount}</span>`;
    }
    return `<button data-page="${it.id}" onclick="navigate('${it.id}')">${ICONS[it.icon]}<span>${it.label}</span>${badge}</button>`;
  }).join('');

  // profile mini
  let name = SESSION.name;
  let roleLabel = 'User';
  let av = initials(name);

  if (SESSION.role === 'teacher') {
    roleLabel = 'Teacher';
    if (SESSION.teacher) av = SESSION.teacher.initial || initials(name);
  } else if (SESSION.role === 'student') {
    if (SESSION.student) {
      roleLabel = `Series ${SESSION.student.series} · Roll ${pad2(SESSION.student.rollNo)}`;
    } else {
      roleLabel = 'Student';
    }
  } else {
    name = 'Department Admin';
    roleLabel = 'Administrator';
    av = 'DA';
  }

  document.getElementById('sbName').textContent = name;
  document.getElementById('sbRole').textContent = roleLabel;
  document.getElementById('sbAvatar').textContent = av;
}

async function navigate(page){
  currentPage = page;
  closeSidebar();
  await renderNav();
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  const titles = {
    dashboard:'Dashboard', attendance:'Attendance', history:'Attendance History', courses:'Courses',
    reports:'Reports & Export', settings: SESSION.role==='student' ? 'Profile' : 'Settings',
    today:"Today's Attendance", teachers:'Teachers', students:'Students',
    series: SESSION.role==='teacher' ? 'By Series' : 'Series & Semesters',
  };
  document.getElementById('topbarTitle').textContent = titles[page] || page;
  document.getElementById('topbarEyebrow').textContent = SYSTEM_SETTINGS.deptName;
  const content = document.getElementById('content');
  content.innerHTML = '<div class="page active" id="pageWrap"><div class="empty"><strong>Loading...</strong>Fetching latest data from server.</div></div>';
  const wrap = document.getElementById('pageWrap');

  if(SESSION.role==='teacher'){
    if(page==='dashboard') await renderTeacherDashboard(wrap);
    else if(page==='attendance') await renderAttendancePicker(wrap);
    else if(page==='series') await renderTeacherSeriesView(wrap);
    else if(page==='history') await renderTeacherHistory(wrap);
    else if(page==='courses') await renderTeacherCourses(wrap);
    else if(page==='reports') await renderReports(wrap);
    else if(page==='settings') await renderTeacherSettings(wrap);
  } else if(SESSION.role==='student'){
    if(page==='dashboard') await renderStudentDashboard(wrap);
    else if(page==='today') await renderStudentToday(wrap);
    else if(page==='history') await renderStudentHistory(wrap);
    else if(page==='courses') await renderStudentCourses(wrap);
    else if(page==='settings') await renderStudentSettings(wrap);
  } else if(SESSION.role==='admin'){
    if(page==='dashboard') await renderAdminDashboard(wrap);
    else if(page==='teachers') await renderAdminTeachers(wrap);
    else if(page==='students') await renderAdminStudents(wrap);
    else if(page==='courses') await renderAdminCourses(wrap);
    else if(page==='series') await renderAdminSeries(wrap);
    else if(page==='reports') await renderAdminReports(wrap);
    else if(page==='settings') await renderAdminSettings(wrap);
  }
  window.scrollTo(0,0);
}

async function openNotifications(){
  const res = await api.get('/notifications');
  const items = (res.ok && res.notifications) ? res.notifications : [];
  await api.post('/notifications/mark-read', {});
  document.getElementById('notifDot').classList.add('hide');

  openModal(`
    <div class="modal-head"><h3>Notifications</h3><button class="close" onclick="closeModal()">${ICONS.x}</button></div>
    <div class="form-grid">
      ${items.length ? items.map(n=>`
        <div style="padding:12px;border:1px solid var(--border);border-radius:11px">
          <div style="font-size:13px">${escapeHtml(n.text)}</div>
          <div class="muted" style="margin-top:5px">${new Date(n.time).toLocaleString()}</div>
        </div>`).join('') : `<div class="empty"><strong>All caught up</strong>No notifications yet.</div>`}
    </div>
  `);
}
async function refreshNotifDot(){
  const res = await api.get('/notifications');
  if (res.ok && res.notifications) {
    const unread = res.notifications.some(n => !n.read);
    document.getElementById('notifDot').classList.toggle('hide', !unread);
  }
}

/* ============================================================
   TEACHER: DASHBOARD & ATTENDANCE
   ============================================================ */
async function renderTeacherDashboard(wrap){
  const tid = SESSION.linkedId;
  const courseRes = await api.get('/courses', { teacherId: tid });
  const histRes = await api.get('/attendance/history', { teacherId: tid });
  const courses = (courseRes.ok && courseRes.courses) ? courseRes.courses : [];
  const sessions = (histRes.ok && histRes.sessions) ? histRes.sessions : [];

  const totalStudents = courses.reduce((acc, c) => acc + (c.studentCount || 0), 0);
  const totalConducted = sessions.length;
  let avgAtt = 0;
  if (courses.length > 0) {
    avgAtt = courses.reduce((acc, c) => acc + (c.avgAttendance || 0), 0) / courses.length;
  }
  const recent = sessions.slice(0, 6);

  wrap.innerHTML = `
    <div class="hero">
      <div><h1>Welcome back, ${escapeHtml(SESSION.name.split(' ').slice(-1)[0])}</h1>
      <p>You teach <b>${courses.length}</b> course${courses.length!==1?'s':''} across the ECE department. Here's where things stand.</p></div>
      <div class="hero-actions">
        <button class="ghost-btn" onclick="navigate('reports')">${ICONS.reports} Reports</button>
        <button class="accent-btn" onclick="navigate('attendance')">${ICONS.attendance} Take attendance</button>
      </div>
    </div>

    <div class="grid stats">
      <div class="card stat"><div class="stat-top"><span>Assigned courses</span><div class="icon-box copper">${ICONS.courses}</div></div>
        <div class="stat-value">${courses.length}</div><div class="stat-sub">Across ${new Set(courses.map(c=>c.series)).size} series</div></div>
      <div class="card stat"><div class="stat-top"><span>Total students</span><div class="icon-box teal">${ICONS.students}</div></div>
        <div class="stat-value">${totalStudents}</div><div class="stat-sub">Enrolled in your courses</div></div>
      <div class="card stat"><div class="stat-top"><span>Sessions conducted</span><div class="icon-box amber">${ICONS.history}</div></div>
        <div class="stat-value">${totalConducted}</div><div class="stat-sub">Recorded in SQLite database</div></div>
      <div class="card stat"><div class="stat-top"><span>Avg. attendance</span><div class="icon-box danger">${ICONS.percent}</div></div>
        <div class="stat-value">${avgAtt.toFixed(1)}%</div>
        <div class="stat-sub ${avgAtt >= SYSTEM_SETTINGS.threshold ? 'good' : 'bad'}">Threshold ${SYSTEM_SETTINGS.threshold}%</div></div>
    </div>

    <div class="grid two-col" style="margin-top:16px">
      <div class="card section">
        <div class="section-head"><h3>Recent attendance sessions</h3><span class="muted">Last ${recent.length}</span></div>
        ${recent.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Course</th><th>Series</th><th>Present</th><th>Absent</th><th>Late</th></tr></thead><tbody>
          ${recent.map(s=>`<tr><td>${fmtDateShort(s.date)}</td><td class="mono">${s.courseCode}</td><td>Series ${s.series}</td>
            <td><span class="badge present">${s.present}</span></td><td><span class="badge absent">${s.absent}</span></td><td><span class="badge late">${s.late}</span></td></tr>`).join('')}
        </tbody></table></div>` : `<div class="empty"><strong>No sessions yet</strong>Start your first attendance session.</div>`}
      </div>
      <div class="card section">
        <div class="section-head"><h3>Quick actions</h3></div>
        <div class="course-list">
          ${courses.map(c=>`<div class="course-item">
            <div><strong>${c.code}</strong><small>${escapeHtml(c.name)} · Series ${c.series}</small></div>
            <button class="ghost-btn" onclick="quickStart('${c.code}')">Start</button>
          </div>`).join('')}
          ${courses.length===0?`<div class="empty"><strong>No courses assigned</strong>Ask the Admin to assign you a course.</div>`:''}
        </div>
      </div>
    </div>
  `;
}

let pendingCourseCode = null;
let activeSessionData = null; // { session, course, roster, records }

async function renderAttendancePicker(wrap){
  const tid = SESSION.linkedId;
  const res = await api.get('/courses', { teacherId: tid });
  const courses = (res.ok && res.courses) ? res.courses : [];

  wrap.innerHTML = `
    <div class="hero"><div><h1>Take attendance</h1><p>Pick a course to start. Roll numbers are called in order — mark as you go.</p></div></div>
    <div class="card section">
      <div class="attendance-toolbar" style="grid-template-columns:1fr 1fr auto">
        <div class="field"><label>Course</label>
          <select class="select" id="pickCourse">
            ${courses.map(c=>`<option value="${c.code}" ${c.code===pendingCourseCode?'selected':''}>${c.code} — ${escapeHtml(c.name)} (Series ${c.series})</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Date</label>
          <div class="date-wrap">
            <input type="text" class="input" id="pickDate" value="${todayISO()}">
            ${CAL_ICON}
          </div>
        </div>
        <div class="field" style="align-self:end"><button class="accent-btn" style="width:100%;justify-content:center" onclick="startAttendanceSession()">${ICONS.attendance} Start session</button></div>
      </div>
      ${courses.length===0?`<div class="empty"><strong>No courses assigned</strong>Ask the Department Admin to assign you a course.</div>`:''}
    </div>
  `;
  initDatePicker('pickDate', {max: todayISO()});
}
function quickStart(code){ pendingCourseCode=code; navigate('attendance'); }

async function startAttendanceSession(){
  const code = document.getElementById('pickCourse').value;
  const date = document.getElementById('pickDate').value || todayISO();
  const res = await api.get('/attendance/session', { courseCode: code, date, teacherId: SESSION.linkedId });
  if (!res.ok) {
    showToast(res.msg || 'Failed to start session.', 'error');
    return;
  }
  activeSessionData = res;
  renderMarkingScreen();
}

function renderMarkingScreen(){
  const wrap = document.getElementById('pageWrap');
  const { session, course, roster } = activeSessionData;
  const editable = session.isEditable;

  wrap.innerHTML = `
    <button class="subtle-btn" onclick="navigate('attendance')" style="margin-bottom:10px">&larr; Back to course picker</button>
    <div class="session-banner">
      <div>
        <div class="label">${session.day}, ${fmtDate(session.date)}${!editable?' · Locked (edit window closed)':''}</div>
        <h3>${course.code} — ${escapeHtml(course.name)}</h3>
        <div class="meta">Series ${course.series} · Semester ${course.semester} · ${roster.length} students</div>
      </div>
      <div class="mark-all">
        <button class="ghost-btn" style="background:transparent;border-color:#3a4a70;color:#dfe5f2" onclick="markAllVisible('present')">${ICONS.check} Mark all present</button>
        <button class="ghost-btn" style="background:transparent;border-color:#3a4a70;color:#dfe5f2" onclick="markAllVisible('absent')">${ICONS.x} Mark all absent</button>
      </div>
    </div>

    <div class="attendance-toolbar" style="grid-template-columns:2fr 1fr auto">
      <div class="search-wrap">${ICONS.search}<input class="input" id="attSearch" placeholder="Jump to roll number or name..." oninput="renderAttendanceList()"></div>
      <select class="select" id="attFilter" onchange="renderAttendanceList()">
        <option value="all">All students</option>
        <option value="unmarked">Unmarked only</option>
        <option value="present">Present</option>
        <option value="absent">Absent</option>
        <option value="late">Late</option>
      </select>
      <button class="primary-btn" ${!editable?'disabled':''} onclick="finalizeAttendance()">${ICONS.check} Save & finish</button>
    </div>

    <div class="summary-bar" id="summaryBar"></div>
    <div class="attendance-list" id="attList"></div>
  `;
  renderSummaryBar();
  renderAttendanceList();
}

function renderSummaryBar(){
  const { roster, records } = activeSessionData;
  const p = records.filter(r => r.status==='present').length;
  const a = records.filter(r => r.status==='absent').length;
  const l = records.filter(r => r.status==='late').length;
  const unmarked = roster.length - records.length;
  document.getElementById('summaryBar').innerHTML = `
    <div class="summary-chip" style="color:var(--present);background:var(--present-soft);border-color:transparent">${ICONS.check} ${p} Present</div>
    <div class="summary-chip" style="color:var(--absent);background:var(--absent-soft);border-color:transparent">${ICONS.x} ${a} Absent</div>
    <div class="summary-chip" style="color:var(--late);background:var(--late-soft);border-color:transparent">${l} Late</div>
    <div class="summary-chip">${unmarked} Unmarked</div>
  `;
}

function renderAttendanceList(){
  const { session, roster, records } = activeSessionData;
  const q = (document.getElementById('attSearch').value||'').trim().toLowerCase();
  const filt = document.getElementById('attFilter').value;
  const listEl = document.getElementById('attList');

  const recMap = {};
  records.forEach(r => { recMap[r.studentId] = r; });

  const rows = roster.filter(s => {
    if(q && !(String(s.rollNo).includes(q) || s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q))) return false;
    const rec = recMap[s.id];
    if(filt==='unmarked') return !rec;
    if(filt!=='all') return rec && rec.status===filt;
    return true;
  });

  if(rows.length===0){ listEl.innerHTML = `<div class="empty"><strong>No matches</strong>Try a different search or filter.</div>`; return; }

  const editable = session.isEditable;
  listEl.innerHTML = rows.map(s => {
    const rec = recMap[s.id];
    const status = rec ? rec.status : null;
    return `<div class="student-row ${status?('marked-'+status):''}" id="row_${s.id}">
      <div class="roll">${pad2(s.rollNo)}</div>
      <div class="student-meta"><strong>${escapeHtml(s.name)}${rec&&rec.remarks?`<span class="remark-dot" title="${escapeHtml(rec.remarks)}"></span>`:''}</strong><small>${s.studentId}</small></div>
      <div class="status-buttons">
        <button class="${status==='present'?'selected present':''}" ${!editable?'disabled':''} onclick="markOne('${s.id}','present')" aria-label="Present">P</button>
        <button class="${status==='late'?'selected late':''}" ${!editable?'disabled':''} onclick="markOne('${s.id}','late')" aria-label="Late">L</button>
        <button class="${status==='absent'?'selected absent':''}" ${!editable?'disabled':''} onclick="markOne('${s.id}','absent')" aria-label="Absent">A</button>
      </div>
    </div>`;
  }).join('');
}

async function markOne(studentId, status){
  const { session } = activeSessionData;
  const res = await api.post('/attendance/mark', {
    sessionId: session.id,
    studentId,
    status,
    markedBy: SESSION.linkedId
  });

  if(!res.ok){
    showToast(res.msg || 'Failed to update attendance.', 'error');
    return;
  }

  // Update in-memory record array
  if(res.action === 'deleted'){
    activeSessionData.records = activeSessionData.records.filter(r => r.studentId !== studentId);
  } else if(res.action === 'updated'){
    const idx = activeSessionData.records.findIndex(r => r.studentId === studentId);
    if(idx >= 0) activeSessionData.records[idx] = res.record;
  } else if(res.action === 'created'){
    activeSessionData.records.push(res.record);
  }

  renderSummaryBar();
  renderAttendanceList();
}

async function markAllVisible(status){
  const { session } = activeSessionData;
  const res = await api.post('/attendance/mark-all', {
    sessionId: session.id,
    status,
    markedBy: SESSION.linkedId
  });

  if(!res.ok){
    showToast(res.msg || 'Failed to mark all.', 'error');
    return;
  }

  activeSessionData.records = res.records || [];
  renderSummaryBar();
  renderAttendanceList();
  showToast(`All students marked ${status}.`, 'success');
}

function finalizeAttendance(){
  const { course, roster, records } = activeSessionData;
  const unmarked = roster.length - records.length;
  if(unmarked > 0){
    openModal(`
      <div class="modal-head"><h3>${unmarked} student${unmarked!==1?'s':''} unmarked</h3><button class="close" onclick="closeModal()">${ICONS.x}</button></div>
      <p class="muted" style="margin-top:8px">You can mark the rest as absent in the database, or go back and finish manually.</p>
      <div class="modal-actions">
        <button class="ghost-btn" onclick="closeModal()">Go back</button>
        <button class="danger-btn" onclick="markRestAbsentAndFinish()">Mark rest absent & save</button>
      </div>
    `);
    return;
  }
  showToast('Attendance saved in database for ' + course.code + '.', 'success');
  navigate('history');
}

async function markRestAbsentAndFinish(){
  const { session, roster, records } = activeSessionData;
  const recMap = {}; records.forEach(r=>recMap[r.studentId]=true);
  for(const s of roster){
    if(!recMap[s.id]){
      await api.post('/attendance/mark', { sessionId: session.id, studentId: s.id, status: 'absent', markedBy: SESSION.linkedId });
    }
  }
  closeModal();
  showToast('Attendance saved for ' + activeSessionData.course.code + '.', 'success');
  navigate('history');
}

/* ============================================================
   TEACHER: HISTORY
   ============================================================ */
async function renderTeacherHistory(wrap){
  const tid = SESSION.linkedId;
  const courseRes = await api.get('/courses', { teacherId: tid });
  const courses = (courseRes.ok && courseRes.courses) ? courseRes.courses : [];

  wrap.innerHTML = `
    <div class="hero"><div><h1>Attendance history</h1><p>Every session you've conducted. Edits are allowed within ${SYSTEM_SETTINGS.editWindowHours}h of taking attendance.</p></div></div>
    <div class="card section">
      <div class="filters">
        <select class="select" id="histCourse" onchange="fetchHistoryTable()"><option value="all">All courses</option>${courses.map(c=>`<option value="${c.code}">${c.code}</option>`).join('')}</select>
        <input type="date" class="input" id="histFrom" onchange="fetchHistoryTable()">
        <input type="date" class="input" id="histTo" onchange="fetchHistoryTable()">
      </div>
      <div class="table-wrap" id="histTableWrap"></div>
    </div>
  `;
  await fetchHistoryTable();
}

async function fetchHistoryTable(){
  const tid = SESSION.linkedId;
  const c = document.getElementById('histCourse').value;
  const from = document.getElementById('histFrom').value;
  const to = document.getElementById('histTo').value;

  const res = await api.get('/attendance/history', { teacherId: tid, courseCode: c, from, to });
  const sessions = (res.ok && res.sessions) ? res.sessions : [];

  document.getElementById('histTableWrap').innerHTML = sessions.length ? `
    <table class="table"><thead><tr><th>Date</th><th>Day</th><th>Course</th><th>Series</th><th>Present</th><th>Absent</th><th>Late</th><th>Status</th><th></th></tr></thead><tbody>
    ${sessions.map(s=>`<tr><td>${fmtDateShort(s.date)}</td><td>${s.day}</td><td class="mono">${s.courseCode}</td><td>Series ${s.series}</td>
      <td><span class="badge present">${s.present}</span></td><td><span class="badge absent">${s.absent}</span></td><td><span class="badge late">${s.late}</span></td>
      <td>${s.isEditable ? '<span class="badge info">Editable</span>' : '<span class="badge neutral">Locked</span>'}</td>
      <td><button class="subtle-btn" onclick="openSessionEditor('${s.id}')">${s.isEditable ? 'Edit' : 'View'}</button></td></tr>`).join('')}
    </tbody></table>` : `<div class="empty"><strong>No sessions found</strong>Adjust filters or take your first attendance.</div>`;
}

async function openSessionEditor(sessionId){
  const res = await api.get('/attendance/session/' + sessionId);
  if (!res.ok) {
    showToast('Failed to load session details.', 'error');
    return;
  }
  const { session, course, roster, records } = res;
  const editable = session.isEditable;
  const recMap = {}; records.forEach(r=>recMap[r.studentId]=r);

  openModal(`
    <div class="modal-head"><h3>${course.code} · ${fmtDate(session.date)}</h3><button class="close" onclick="closeModal()">${ICONS.x}</button></div>
    <p class="muted">${editable ? 'You can adjust statuses below — changes save directly to SQLite.' : 'Edit window has closed. View only.'}</p>
    <div class="attendance-list" style="max-height:50vh;overflow:auto;margin-top:10px">
      ${roster.map(s=>{
        const rec = recMap[s.id];
        const status = rec ? rec.status : null;
        return `<div class="student-row">
          <div class="roll">${pad2(s.rollNo)}</div>
          <div class="student-meta"><strong>${escapeHtml(s.name)}</strong><small>${s.studentId}</small></div>
          <div class="status-buttons">
            <button class="${status==='present'?'selected present':''}" ${!editable?'disabled':''} onclick="editMark('${session.id}','${s.id}','present')">P</button>
            <button class="${status==='late'?'selected late':''}" ${!editable?'disabled':''} onclick="editMark('${session.id}','${s.id}','late')">L</button>
            <button class="${status==='absent'?'selected absent':''}" ${!editable?'disabled':''} onclick="editMark('${session.id}','${s.id}','absent')">A</button>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="modal-actions"><button class="ghost-btn" onclick="closeModal()">Close</button></div>
  `, true);
}

async function editMark(sessionId, studentId, status){
  const res = await api.post('/attendance/mark', { sessionId, studentId, status, markedBy: SESSION.linkedId });
  if(!res.ok){ showToast(res.msg || 'Failed to update.', 'error'); return; }
  await openSessionEditor(sessionId);
  await fetchHistoryTable();
  showToast('Attendance updated in database.', 'success');
}

/* ============================================================
   TEACHER: COURSES & BY SERIES
   ============================================================ */
async function renderTeacherCourses(wrap){
  const tid = SESSION.linkedId;
  const res = await api.get('/courses', { teacherId: tid });
  const courses = (res.ok && res.courses) ? res.courses : [];

  wrap.innerHTML = `
    <div class="hero"><div><h1>My courses</h1><p>Courses assigned to you, stored in the SQLite database.</p></div>
      <div class="hero-actions"><button class="accent-btn" onclick="openTeacherCreateCourseModal()">${ICONS.plus} Create course</button></div></div>
    <div class="grid stats">
      ${courses.map(c=>{
        const avg = c.avgAttendance || 0;
        return `<div class="card stat" style="cursor:pointer;position:relative" onclick="openCourseRosterModal('${c.code}')">
          <button class="subtle-btn" style="position:absolute;top:12px;right:12px;color:var(--danger)" title="Delete course" onclick="event.stopPropagation();teacherDeleteCourse('${c.code}')">${ICONS.trash}</button>
          <div class="stat-top"><span>${c.code}</span><div class="icon-box copper">${ICONS.courses}</div></div>
          <div style="font-weight:700;margin-top:6px;font-size:14.5px">${escapeHtml(c.name)}</div>
          <div class="muted" style="margin-top:3px">Series ${c.series} · Semester ${c.semester} · ${c.studentCount} students${c.enrolledStudentIds?' (custom roster)':''}</div>
          <div class="progress ${avg>=SYSTEM_SETTINGS.threshold?'good':avg>=60?'warn':'bad'}" style="margin-top:12px"><span style="width:${avg}%"></span></div>
          <div class="stat-sub" style="margin-top:6px">${avg.toFixed(1)}% avg attendance · ${c.sessionCount} sessions</div>
        </div>`;
      }).join('')}
      ${courses.length===0?`<div class="empty"><strong>No courses yet</strong>Create one, or ask the Admin to assign you an existing course.</div>`:''}
    </div>
  `;
}

async function openCourseRosterModal(code){
  const res = await api.get('/courses/' + code);
  if(!res.ok){ showToast('Failed to load course roster.', 'error'); return; }
  const { course, summary } = res;

  openModal(`
    <div class="modal-head"><h3>${course.code} — ${escapeHtml(course.name)}</h3><button class="close" onclick="closeModal()">${ICONS.x}</button></div>
    <p class="muted">Series ${course.series} · ${summary.length} student${summary.length!==1?'s':''} enrolled · per-student attendance %</p>
    <div class="table-wrap" style="margin-top:10px;max-height:56vh">
      <table class="table"><thead><tr><th>Roll</th><th>Name</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance %</th><th>Marks</th></tr></thead><tbody>
        ${summary.map(r=>`<tr><td><span class="rollcell">${pad2(r.student.rollNo)}</span></td><td>${escapeHtml(r.student.name)}</td>
          <td><span class="badge present">${r.present}</span></td><td><span class="badge absent">${r.absent}</span></td><td><span class="badge late">${r.late}</span></td>
          <td><span class="badge ${r.pct>=SYSTEM_SETTINGS.threshold?'present':'absent'}">${r.pct.toFixed(1)}%</span></td><td>${r.marks}/10</td></tr>`).join('')}
      </tbody></table>
    </div>
    <div class="modal-actions">
      <button class="danger-btn ghost" onclick="teacherDeleteCourse('${course.code}')">${ICONS.trash} Delete course</button>
      <button class="ghost-btn" onclick="closeModal()">Close</button>
    </div>
  `, true);
}

async function teacherDeleteCourse(code){
  if(!confirm(`Delete ${code}? All its sessions and attendance records in SQLite will also be deleted. This cannot be undone.`)) return;
  const res = await api.del('/courses/' + code);
  if(!res.ok){ showToast(res.msg || 'Failed to delete course.', 'error'); return; }
  closeModal();
  showToast('Course deleted from database.', 'success');
  navigate('courses');
}

async function openTeacherCreateCourseModal(){
  const seriesRes = await api.get('/series');
  const seriesList = (seriesRes.ok && seriesRes.series) ? seriesRes.series : [{code:'21'},{code:'22'},{code:'23'},{code:'24'},{code:'25'}];

  openModal(`
    <div class="modal-head"><h3>Create a course</h3><button class="close" onclick="closeModal()">${ICONS.x}</button></div>
    <p class="muted">Pick a series, then choose exactly which students to enroll.</p>
    <div class="form-grid">
      <div class="form-row">
        <div class="field"><label>Course code</label><input class="input" id="tcCode" placeholder="ECE-2405"></div>
        <div class="field"><label>Credit hours</label><input class="input" type="number" id="tcCredit" value="3"></div>
      </div>
      <div class="field"><label>Course title</label><input class="input" id="tcName" placeholder="Course title"></div>
      <div class="field"><label>Series</label>
        <select class="select" id="tcSeries" onchange="renderTeacherCourseStudentPicker()">
          ${seriesList.map(s=>`<option value="${s.code}">${s.code} Series (Sem ${s.semester||''})</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>Enroll students</label>
        <div class="filters" style="margin-bottom:8px">
          <button type="button" class="subtle-btn" onclick="toggleAllTcStudents(true)">Select all</button>
          <button type="button" class="subtle-btn" onclick="toggleAllTcStudents(false)">Clear</button>
        </div>
        <div class="checklist" id="tcStudentPicker" style="max-height:220px;overflow:auto"></div>
      </div>
    </div>
    <div class="modal-actions"><button class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" onclick="createTeacherCourse()">${ICONS.check} Create course</button></div>
  `, true);
  await renderTeacherCourseStudentPicker();
}

async function renderTeacherCourseStudentPicker(){
  const series = document.getElementById('tcSeries').value;
  const res = await api.get('/students', { series });
  const roster = (res.ok && res.students) ? res.students : [];
  document.getElementById('tcStudentPicker').innerHTML = roster.map(s=>
    `<label><input type="checkbox" value="${s.id}" class="tcStudentChk" checked> ${pad2(s.rollNo)} — ${escapeHtml(s.name)}</label>`
  ).join('') || `<p class="muted">No students in this series yet.</p>`;
}
function toggleAllTcStudents(state){
  document.querySelectorAll('.tcStudentChk').forEach(chk=>chk.checked=state);
}

async function createTeacherCourse(){
  const code = document.getElementById('tcCode').value.trim().toUpperCase();
  const name = document.getElementById('tcName').value.trim();
  const series = document.getElementById('tcSeries').value;
  const credit = Number(document.getElementById('tcCredit').value)||3;
  const enrolledStudentIds = [...document.querySelectorAll('.tcStudentChk:checked')].map(c=>c.value);

  if(!code || !name){ showToast('Course code and title are required.', 'error'); return; }
  if(enrolledStudentIds.length===0){ showToast('Select at least one student to enroll.', 'error'); return; }

  const res = await api.post('/courses', {
    code,
    name,
    series,
    creditHours: credit,
    teacherId: SESSION.linkedId,
    enrolledStudentIds
  });

  if(!res.ok){ showToast(res.msg || 'Failed to create course.', 'error'); return; }
  closeModal();
  showToast('Course created in database.', 'success');
  navigate('courses');
}

async function renderTeacherSeriesView(wrap){
  const tid = SESSION.linkedId;
  const res = await api.get('/courses', { teacherId: tid });
  const courses = (res.ok && res.courses) ? res.courses : [];
  const seriesList = [...new Set(courses.map(c=>c.series))].sort();

  if(seriesList.length===0){
    wrap.innerHTML = `<div class="hero"><div><h1>By series</h1><p>See your courses grouped by student series.</p></div></div>
      <div class="empty"><strong>No courses yet</strong>Create a course to see it grouped here by series.</div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="hero"><div><h1>By series</h1><p>Your courses grouped by series.</p></div></div>
    <div class="tabs" id="teacherSeriesTabs">
      ${seriesList.map((s,i)=>`<button class="${i===0?'active':''}" onclick="switchTeacherSeriesTab('${s}')">${s} Series</button>`).join('')}
    </div>
    <div id="teacherSeriesContent" style="margin-top:16px"></div>
  `;
  await renderTeacherSeriesTab(seriesList[0]);
}

async function switchTeacherSeriesTab(series){
  document.querySelectorAll('#teacherSeriesTabs button').forEach(b=>b.classList.toggle('active', b.textContent.startsWith(series)));
  await renderTeacherSeriesTab(series);
}

async function renderTeacherSeriesTab(series){
  const tid = SESSION.linkedId;
  const res = await api.get('/courses', { teacherId: tid, series });
  const courses = (res.ok && res.courses) ? res.courses : [];
  const el = document.getElementById('teacherSeriesContent');

  let html = '';
  for(const c of courses){
    const detail = await api.get('/courses/' + c.code);
    const summary = (detail.ok && detail.summary) ? detail.summary : [];
    html += `<div class="card section" style="margin-bottom:14px">
      <div class="section-head">
        <div><h3>${c.code} — ${escapeHtml(c.name)}</h3><span class="muted">${summary.length} students enrolled</span></div>
        <button class="ghost-btn" onclick="quickStart('${c.code}')">${ICONS.attendance} Take attendance</button>
      </div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Roll</th><th>Name</th><th>Attendance %</th><th>Marks</th></tr></thead><tbody>
        ${summary.map(r=>`<tr><td><span class="rollcell">${pad2(r.student.rollNo)}</span></td><td>${escapeHtml(r.student.name)}</td>
          <td><span class="badge ${r.pct>=SYSTEM_SETTINGS.threshold?'present':'absent'}">${r.pct.toFixed(1)}%</span></td><td>${r.marks}/10</td></tr>`).join('')}
      </tbody></table></div>
    </div>`;
  }
  el.innerHTML = html || `<div class="empty"><strong>No courses in this series</strong></div>`;
}

function renderTeacherSettings(wrap){
  wrap.innerHTML = `
    <div class="hero"><div><h1>Account</h1><p>Your teacher profile.</p></div></div>
    <div class="grid two-col">
      <div class="card section">
        <div class="section-head"><h3>Profile</h3></div>
        <div class="form-grid">
          <div class="field"><label>Full name</label><input class="input" value="${escapeHtml(SESSION.name)}" disabled></div>
          <div class="field"><label>University email</label><input class="input" value="${SESSION.email}" disabled></div>
          <div class="field"><label>Role</label><input class="input" value="Teacher" disabled></div>
        </div>
        <p class="muted" style="margin-top:12px">Profile fields are managed by the Department Admin.</p>
      </div>
      <div class="card section">
        <div class="section-head"><h3>Change password</h3></div>
        <div class="form-grid">
          <div class="field"><label>New password</label><input class="input" type="password" id="tpNewPass" placeholder="At least 6 characters"></div>
          <button class="primary-btn" onclick="changeOwnPassword('tpNewPass')">Update password</button>
        </div>
      </div>
    </div>
  `;
}

async function changeOwnPassword(inputId){
  const pass = document.getElementById(inputId).value;
  if(!pass || pass.length < 6){ showToast('Password must be at least 6 characters.', 'error'); return; }
  const res = await api.post('/auth/change-password', { userId: SESSION.id, newPassword: pass });
  if(!res.ok){ showToast(res.msg || 'Failed to update password.', 'error'); return; }
  document.getElementById(inputId).value = '';
  showToast('Password updated in database.', 'success');
}

/* ============================================================
   STUDENT: DASHBOARD, TODAY, HISTORY, COURSES, PROFILE
   ============================================================ */
async function renderStudentDashboard(wrap){
  const sid = SESSION.linkedId;
  const res = await api.get('/students/' + sid);
  if(!res.ok){ wrap.innerHTML = `<div class="empty"><strong>Error loading student data</strong></div>`; return; }
  const { student, overall, courses } = res;

  const todayIso = todayISO();
  const todaySessRes = await api.get('/attendance/history', { series: student.series, from: todayIso, to: todayIso });
  const todaySessions = (todaySessRes.ok && todaySessRes.sessions) ? todaySessRes.sessions : [];

  wrap.innerHTML = `
    <div class="hero">
      <div><h1>Hi, ${escapeHtml(student.name.split(' ')[0])}</h1>
      <p>Series ${student.series} · Semester ${student.semester} · Roll ${pad2(student.rollNo)}</p></div>
      <div class="hero-actions">
        <button class="ghost-btn" onclick="downloadStudentPdfReport('${student.id}')">${ICONS.download} Download PDF</button>
        <button class="ghost-btn" onclick="downloadStudentReport('${student.id}')">${ICONS.download} Download Excel</button>
      </div>
    </div>

    <div class="grid stats">
      <div class="card stat"><div class="stat-top"><span>Overall attendance</span><div class="icon-box copper">${ICONS.percent}</div></div>
        <div class="stat-value">${overall.pct.toFixed(1)}%</div>
        <div class="stat-sub ${overall.pct >= SYSTEM_SETTINGS.threshold ? 'good' : 'bad'}">${overall.pct >= SYSTEM_SETTINGS.threshold ? 'Above' : 'Below'} ${SYSTEM_SETTINGS.threshold}% threshold</div></div>
      <div class="card stat"><div class="stat-top"><span>Classes attended</span><div class="icon-box teal">${ICONS.check}</div></div>
        <div class="stat-value">${overall.present + overall.late}</div><div class="stat-sub">of ${overall.total} conducted</div></div>
      <div class="card stat"><div class="stat-top"><span>Absences</span><div class="icon-box danger">${ICONS.x}</div></div>
        <div class="stat-value">${overall.absent}</div><div class="stat-sub">Across all courses</div></div>
      <div class="card stat"><div class="stat-top"><span>Attendance marks</span><div class="icon-box amber">${ICONS.reports}</div></div>
        <div class="stat-value">${overall.marks}<span style="font-size:14px;color:var(--text-faint)">/10</span></div>
        <div class="stat-sub">Per department scheme</div></div>
    </div>

    <div class="grid two-col" style="margin-top:16px">
      <div class="card section">
        <div class="section-head"><h3>Course-wise attendance</h3></div>
        <div class="course-list">
          ${courses.map(c=>{
            const bunkLine = c.total===0 ? '' :
              c.bunk.type==='buffer'
                ? (c.bunk.count>0 ? `You can miss <b>${c.bunk.count}</b> more class${c.bunk.count!==1?'es':''} and keep full marks (10/10)` : `One more miss drops you below 90% — no buffer left`)
                : `Attend your next <b>${c.bunk.count}</b> class${c.bunk.count!==1?'es':''} in a row to reach 90% for full marks`;
            return `<div class="course-item" style="display:block">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <div><strong>${c.course.code}</strong><small style="display:block">${escapeHtml(c.course.name)} · ${escapeHtml(c.teacherName)}</small></div>
                <span class="badge ${c.pct>=SYSTEM_SETTINGS.threshold?'present':'absent'}">${c.pct.toFixed(0)}%</span>
              </div>
              <div class="progress ${c.pct>=SYSTEM_SETTINGS.threshold?'good':c.pct>=60?'warn':'bad'}"><span style="width:${c.pct}%"></span></div>
              <div class="stat-sub" style="margin-top:7px">${c.absent} missed of ${c.total} · Marks: ${c.marks}/10${bunkLine?` · ${bunkLine}`:''}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="card section">
        <div class="section-head"><h3>Today's Classes</h3></div>
        ${todaySessions.length ? todaySessions.map(s=>`
          <div style="padding:12px;border:1px solid var(--border);border-radius:12px;margin-bottom:8px">
            <strong style="font-size:13px">${s.courseCode}</strong><div class="muted" style="margin:3px 0 7px">${escapeHtml(s.courseName||'')}</div>
            <span class="badge info">Conducted Today</span>
          </div>`).join('') : `<div class="empty"><strong>No classes recorded today</strong>Your teacher hasn't taken attendance for today yet.</div>`}
      </div>
    </div>
  `;
}

async function renderStudentToday(wrap){
  const sid = SESSION.linkedId;
  const res = await api.get('/students/' + sid);
  if(!res.ok) return;
  const { student, courses } = res;

  const todayIso = todayISO();
  wrap.innerHTML = `
    <div class="hero"><div><h1>Today's attendance</h1><p>${fmtDate(todayIso)} · ${dayName(todayIso)}</p></div></div>
    <div class="card section">
      <div class="table-wrap"><table class="table"><thead><tr><th>Course</th><th>Teacher</th><th>Status</th></tr></thead><tbody>
      ${courses.map(c=>`
        <tr>
          <td><strong>${c.course.code}</strong><br><span class="muted">${escapeHtml(c.course.name)}</span></td>
          <td>${escapeHtml(c.teacherName)}</td>
          <td><span class="badge ${c.pct >= SYSTEM_SETTINGS.threshold ? 'present' : 'neutral'}">Active Semester</span></td>
        </tr>
      `).join('')}
      </tbody></table></div>
    </div>
  `;
}

async function renderStudentHistory(wrap){
  const sid = SESSION.linkedId;
  const studentRes = await api.get('/students/' + sid);
  if(!studentRes.ok) return;
  const { student, courses } = studentRes;

  wrap.innerHTML = `
    <div class="hero"><div><h1>Attendance history</h1><p>Full record across every course you're enrolled in.</p></div></div>
    <div class="card section">
      <div class="filters">
        <select class="select" id="stCourseFilter" onchange="fetchStudentHistoryTable('${sid}')"><option value="all">All courses</option>${courses.map(c=>`<option value="${c.course.code}">${c.course.code} — ${escapeHtml(c.course.name)}</option>`).join('')}</select>
        <select class="select" id="stStatusFilter" onchange="fetchStudentHistoryTable('${sid}')"><option value="all">Any status</option><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option></select>
      </div>
      <div class="table-wrap" id="stHistWrap"></div>
    </div>
  `;
  await fetchStudentHistoryTable(sid);
}

async function fetchStudentHistoryTable(sid){
  const cf = document.getElementById('stCourseFilter').value;
  const sf = document.getElementById('stStatusFilter').value;

  const res = await api.get('/attendance/history', { series: SESSION.student?.series, courseCode: cf });
  const sessions = (res.ok && res.sessions) ? res.sessions : [];

  let records = [];
  for (const s of sessions) {
    const sDetail = await api.get('/attendance/session/' + s.id);
    if (sDetail.ok && sDetail.records) {
      const myRec = sDetail.records.find(r => r.studentId === sid);
      if (myRec && (sf === 'all' || myRec.status === sf)) {
        records.push({ ...myRec, session: s });
      }
    }
  }

  document.getElementById('stHistWrap').innerHTML = records.length ? `
    <table class="table"><thead><tr><th>Date</th><th>Course</th><th>Status</th><th>Marked at</th><th>Remarks</th></tr></thead><tbody>
    ${records.map(r=>`<tr><td>${fmtDate(r.session.date)}</td><td class="mono">${r.session.courseCode}</td>
      <td><span class="badge ${r.status}">${r.status}</span></td><td>${fmtTime(r.timestamp)}</td><td class="muted">${escapeHtml(r.remarks||'—')}</td></tr>`).join('')}
    </tbody></table>` : `<div class="empty"><strong>No records</strong>Nothing matches these filters yet.</div>`;
}

async function renderStudentCourses(wrap){
  const sid = SESSION.linkedId;
  const res = await api.get('/students/' + sid);
  if(!res.ok) return;
  const { courses } = res;

  wrap.innerHTML = `<div class="hero"><div><h1>Course-wise attendance</h1><p>Breakdown per course this semester.</p></div></div>
    <div class="grid stats">
    ${courses.map(c=>{
      const bunkLine = c.total===0 ? 'No classes conducted yet' :
        c.bunk.type==='buffer'
          ? (c.bunk.count>0 ? `Can miss ${c.bunk.count} more for full marks` : `No buffer left for full marks`)
          : `Attend next ${c.bunk.count} in a row for full marks`;
      return `<div class="card stat">
        <div class="stat-top"><span>${c.course.code}</span><div class="icon-box ${c.pct>=SYSTEM_SETTINGS.threshold?'teal':'danger'}">${ICONS.percent}</div></div>
        <div style="font-weight:700;margin-top:4px;font-size:14px">${escapeHtml(c.course.name)}</div>
        <div class="muted" style="margin:3px 0 10px">${escapeHtml(c.teacherName)}</div>
        <div class="stat-value">${c.pct.toFixed(1)}%</div>
        <div class="progress ${c.pct>=SYSTEM_SETTINGS.threshold?'good':c.pct>=60?'warn':'bad'}" style="margin-top:8px"><span style="width:${c.pct}%"></span></div>
        <div class="stat-sub" style="margin-top:6px">${c.present} present · ${c.late} late · ${c.absent} missed of ${c.total}</div>
        <div class="stat-sub" style="margin-top:3px">Marks: <b>${c.marks}/10</b> · ${bunkLine}</div>
      </div>`;
    }).join('')}
    </div>`;
}

async function renderStudentSettings(wrap){
  const sid = SESSION.linkedId;
  const res = await api.get('/students/' + sid);
  if(!res.ok) return;
  const { student } = res;

  wrap.innerHTML = `
    <div class="hero"><div><h1>Profile</h1><p>Your student record in the database.</p></div></div>
    <div class="grid two-col">
      <div class="card section">
        <div class="section-head"><h3>Student details</h3></div>
        <div class="form-grid">
          <div class="form-row">
            <div class="field"><label>Full name</label><input class="input" value="${escapeHtml(student.name)}" disabled></div>
            <div class="field"><label>Roll number</label><input class="input mono" value="${pad2(student.rollNo)}" disabled></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Student ID</label><input class="input mono" value="${student.studentId}" disabled></div>
            <div class="field"><label>Series</label><input class="input" value="${student.series} Series" disabled></div>
          </div>
          <div class="field"><label>University email</label><input class="input" value="${student.email}" disabled></div>
          <div class="field"><label>Semester</label><input class="input" value="Semester ${student.semester}" disabled></div>
        </div>
        <p class="muted" style="margin-top:12px">To correct any details, contact the Department Admin.</p>
      </div>
      <div class="card section">
        <div class="section-head"><h3>Change password</h3></div>
        <div class="form-grid">
          <div class="field"><label>New password</label><input class="input" type="password" id="stNewPass" placeholder="At least 6 characters"></div>
          <button class="primary-btn" onclick="changeOwnPassword('stNewPass')">Update password</button>
        </div>
      </div>
    </div>
  `;
}

async function downloadStudentReport(studentId){
  const res = await api.get('/students/' + studentId);
  if(!res.ok){ showToast('Failed to generate report.', 'error'); return; }
  const { student, courses } = res;
  const rows = courses.map(c=>({
    Course: c.course.code,
    Title: c.course.name,
    Conducted: c.total,
    Present: c.present,
    Absent: c.absent,
    Late: c.late,
    'Attendance %': c.pct.toFixed(1),
    'Marks (/10)': c.marks
  }));
  exportRowsToExcel(rows, `${student.studentId}_attendance_report`, `${student.name} — Attendance Report`);
}

async function downloadStudentPdfReport(studentId){
  if (!window.jspdf) { showToast('PDF engine loading, please try again.', 'error'); return; }
  const res = await api.get('/students/' + studentId);
  if(!res.ok){ showToast('Failed to generate report.', 'error'); return; }
  const { student, overall, courses } = res;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // RUET Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Rajshahi University of Engineering & Technology', 105, 16, { align: 'center' });
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Department of Electrical & Computer Engineering', 105, 22, { align: 'center' });
  doc.setFontSize(12.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Attendance Report', 105, 29, { align: 'center' });

  // Divider
  doc.setLineWidth(0.4);
  doc.line(14, 32, 196, 32);

  // Student Info Box
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Name:', 14, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(student.name, 45, 38);

  doc.setFont('helvetica', 'bold');
  doc.text('Roll No.:', 14, 44);
  doc.setFont('helvetica', 'normal');
  doc.text(String(student.rollNo), 45, 44);

  doc.setFont('helvetica', 'bold');
  doc.text('Student ID:', 110, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(student.studentId, 138, 38);

  doc.setFont('helvetica', 'bold');
  doc.text('Series & Sem:', 110, 44);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.series} Series (Sem ${student.semester})`, 138, 44);

  // Summary statistics bar
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, 48, 182, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text(`Overall Attendance: ${overall.pct.toFixed(1)}%`, 20, 55.5);
  doc.text(`Classes Attended: ${overall.present + overall.late} / ${overall.total}`, 90, 55.5);
  doc.text(`Attendance Marks: ${overall.marks}/10`, 152, 55.5);

  // Table of courses
  const tableData = courses.map(c => [
    c.course.code,
    c.course.name,
    c.teacherName || 'Unassigned',
    c.total,
    c.present,
    c.absent,
    c.late,
    c.pct.toFixed(1) + '%',
    c.marks + '/10'
  ]);

  doc.autoTable({
    startY: 64,
    head: [['Code', 'Course Title', 'Teacher', 'Total', 'P', 'A', 'L', 'Attnd %', 'Marks']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 41], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 20 },
      1: { cellWidth: 50 },
      2: { cellWidth: 35 },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'center', cellWidth: 10 },
      5: { halign: 'center', cellWidth: 10 },
      6: { halign: 'center', cellWidth: 10 },
      7: { halign: 'center', cellWidth: 16 },
      8: { halign: 'center', cellWidth: 16, fontStyle: 'bold' }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 14;
  doc.setFontSize(8.5);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, finalY);
  doc.text('ECE Department Attendance System', 196, finalY, { align: 'right' });

  doc.save(`${student.studentId}_attendance_report.pdf`);
  showToast('PDF report downloaded!', 'success');
}

/* ============================================================
   ADMIN: DASHBOARD, TEACHERS, STUDENTS, COURSES, SERIES, SETTINGS
   ============================================================ */
async function renderAdminDashboard(wrap){
  const res = await api.get('/stats/department');
  if(!res.ok){ wrap.innerHTML = `<div class="empty"><strong>Error loading department stats</strong></div>`; return; }
  const stats = res;

  wrap.innerHTML = `
    <div class="hero"><div><h1>Department overview</h1><p>${SYSTEM_SETTINGS.deptName} · ${SYSTEM_SETTINGS.currentSemesterLabel}</p></div>
      <div class="hero-actions">
        <button class="ghost-btn" onclick="navigate('reports')">${ICONS.reports} Reports</button>
        <button class="accent-btn" onclick="openAddStudentModal()">${ICONS.plus} Add student</button>
      </div>
    </div>

    <div class="grid stats">
      <div class="card stat"><div class="stat-top"><span>Students</span><div class="icon-box copper">${ICONS.students}</div></div><div class="stat-value">${stats.totalStudents}</div><div class="stat-sub">Across 5 series</div></div>
      <div class="card stat"><div class="stat-top"><span>Active teachers</span><div class="icon-box teal">${ICONS.teachers}</div></div><div class="stat-value">${stats.totalTeachers}</div>
        <div class="stat-sub ${stats.pendingTeachers.length?'bad':''}">${stats.pendingTeachers.length} pending approval</div></div>
      <div class="card stat"><div class="stat-top"><span>Courses</span><div class="icon-box amber">${ICONS.courses}</div></div><div class="stat-value">${stats.totalCourses}</div><div class="stat-sub">All series combined</div></div>
      <div class="card stat"><div class="stat-top"><span>Dept. avg attendance</span><div class="icon-box danger">${ICONS.percent}</div></div><div class="stat-value">${stats.avgAttendance.toFixed(1)}%</div>
        <div class="stat-sub ${stats.avgAttendance>=SYSTEM_SETTINGS.threshold?'good':'bad'}">Threshold ${SYSTEM_SETTINGS.threshold}%</div></div>
    </div>

    <div class="grid two-col" style="margin-top:16px">
      <div class="card section">
        <div class="section-head"><h3>Attendance by series</h3></div>
        <div class="chart">
          ${stats.seriesOverview.map(s=>{ const h=Math.max(6, s.avgAttendance*1.9); return `
            <div class="bar-wrap"><div class="bar" style="height:${h}px"><small>${s.avgAttendance.toFixed(0)}%</small></div><span class="xlabel">${s.series} Series</span></div>`; }).join('')}
        </div>
      </div>
      <div class="card section">
        <div class="section-head"><h3>Pending approvals</h3></div>
        ${stats.pendingTeachers.length ? stats.pendingTeachers.map(t=>`
          <div class="course-item">
            <div><strong>${escapeHtml(t.name)}</strong><small>${t.email}</small></div>
            <div style="display:flex;gap:6px"><button class="ghost-btn" onclick="approveTeacher('${t.id}')">${ICONS.check} Approve</button></div>
          </div>`).join('') : `<div class="empty"><strong>Nothing pending</strong>All teacher accounts are approved.</div>`}
      </div>
    </div>

    <div class="card section" style="margin-top:16px">
      <div class="section-head"><h3>Series snapshot</h3></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Series</th><th>Semester</th><th>Students</th><th>Courses</th><th>Sessions run</th><th>Avg. attendance</th></tr></thead><tbody>
      ${stats.seriesOverview.map(s=>`<tr><td><strong>${s.series} Series</strong></td><td>Semester ${s.semester}</td><td>${s.studentCount}</td><td>${s.courseCount}</td><td>${s.totalSessions}</td>
        <td><span class="badge ${s.avgAttendance>=SYSTEM_SETTINGS.threshold?'present':'absent'}">${s.avgAttendance.toFixed(1)}%</span></td></tr>`).join('')}
      </tbody></table></div>
    </div>
  `;
}

async function approveTeacher(id){
  const res = await api.post('/teachers/' + id + '/approve', {});
  if(!res.ok){ showToast(res.msg || 'Approval failed.', 'error'); return; }
  showToast('Teacher approved in database.', 'success');
  navigate(currentPage);
}

/* ADMIN: TEACHERS */
async function renderAdminTeachers(wrap){
  wrap.innerHTML = `
    <div class="hero"><div><h1>Teachers</h1><p>Approve, add, or remove teacher accounts and manage course assignments.</p></div>
      <div class="hero-actions"><button class="accent-btn" onclick="openAddTeacherModal()">${ICONS.plus} Add teacher</button></div></div>
    <div class="card section">
      <div class="search-wrap" style="max-width:340px;margin-bottom:14px">${ICONS.search}<input class="input" id="teacherSearch" placeholder="Search teachers..." oninput="renderTeacherTable()"></div>
      <div class="table-wrap" id="teacherTableWrap"></div>
    </div>
  `;
  await renderTeacherTable();
}

async function renderTeacherTable(){
  const res = await api.get('/teachers');
  const teachers = (res.ok && res.teachers) ? res.teachers : [];
  const q = (document.getElementById('teacherSearch')?.value||'').toLowerCase();
  const filtered = teachers.filter(t => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q));

  document.getElementById('teacherTableWrap').innerHTML = `
    <table class="table"><thead><tr><th>Name</th><th>Email</th><th>Courses</th><th>Status</th><th></th></tr></thead><tbody>
    ${filtered.map(t=>`<tr><td><strong>${escapeHtml(t.name)}</strong> <span class="muted mono">(${t.initial})</span></td><td>${t.email}</td>
      <td>${t.assignedCourses.length? t.assignedCourses.map(c=>`<span class="chip" style="margin:2px">${c}</span>`).join(''):'<span class="muted">None</span>'}</td>
      <td>${t.status==='approved'?'<span class="badge present">Approved</span>':t.status==='pending'?'<span class="badge pending">Pending</span>':'<span class="badge absent">Suspended</span>'}</td>
      <td style="white-space:nowrap">
        ${t.status==='pending'?`<button class="subtle-btn" onclick="approveTeacher('${t.id}')">Approve</button>`:''}
        <button class="subtle-btn" onclick="openEditTeacherModal('${t.id}')">${ICONS.edit}</button>
        <button class="subtle-btn" onclick="removeTeacher('${t.id}')" style="color:var(--danger)">${ICONS.trash}</button>
      </td></tr>`).join('')}
    </tbody></table>
  `;
}

async function openAddTeacherModal(){
  const courseRes = await api.get('/courses');
  const courses = (courseRes.ok && courseRes.courses) ? courseRes.courses : [];

  openModal(`
    <div class="modal-head"><h3>Add teacher</h3><button class="close" onclick="closeModal()">${ICONS.x}</button></div>
    <div class="form-grid">
      <div class="field"><label>Full name</label><input class="input" id="ntName" placeholder="Dr. Jane Doe"></div>
      <div class="form-row">
        <div class="field"><label>Initials</label><input class="input" id="ntInitial" placeholder="JD" maxlength="4"></div>
        <div class="field"><label>University email</label><input class="input" id="ntEmail" placeholder="jd@ece.edu"></div>
      </div>
      <div class="field"><label>Temporary password</label><input class="input" id="ntPass" value="teacher123"></div>
      <div class="field"><label>Assign courses (optional)</label>
        <div class="checklist" style="max-height:160px;overflow:auto">
          ${courses.map(c=>`<label><input type="checkbox" value="${c.code}" class="ntCourseChk"> ${c.code} — ${escapeHtml(c.name)} (Series ${c.series})</label>`).join('')}
        </div>
      </div>
    </div>
    <div class="modal-actions"><button class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" onclick="createTeacher()">${ICONS.check} Create account</button></div>
  `, true);
}

async function createTeacher(){
  const name = document.getElementById('ntName').value.trim();
  const initial = document.getElementById('ntInitial').value.trim().toUpperCase() || initials(name);
  const email = document.getElementById('ntEmail').value.trim().toLowerCase();
  const pass = document.getElementById('ntPass').value || 'teacher123';
  if(!name || !email){ showToast('Name and email are required.', 'error'); return; }

  const assignedCourses = [...document.querySelectorAll('.ntCourseChk:checked')].map(c=>c.value);
  const res = await api.post('/teachers', { name, initial, email, password: pass, assignedCourses });
  if(!res.ok){ showToast(res.msg || 'Failed to create teacher.', 'error'); return; }
  closeModal();
  showToast('Teacher created in database.', 'success');
  navigate('teachers');
}

async function openEditTeacherModal(id){
  const teachRes = await api.get('/teachers');
  const t = (teachRes.ok && teachRes.teachers) ? teachRes.teachers.find(x=>x.id===id) : null;
  if(!t) return;
  const courseRes = await api.get('/courses');
  const courses = (courseRes.ok && courseRes.courses) ? courseRes.courses : [];

  openModal(`
    <div class="modal-head"><h3>Edit teacher</h3><button class="close" onclick="closeModal()">${ICONS.x}</button></div>
    <div class="form-grid">
      <div class="field"><label>Full name</label><input class="input" id="etName" value="${escapeHtml(t.name)}"></div>
      <div class="field"><label>Assigned courses</label>
        <div class="checklist" style="max-height:200px;overflow:auto">
          ${courses.map(c=>`<label><input type="checkbox" value="${c.code}" class="etCourseChk" ${t.assignedCourses.includes(c.code)?'checked':''}> ${c.code} — ${escapeHtml(c.name)} (Series ${c.series})</label>`).join('')}
        </div>
      </div>
      <div class="field"><label>Reset password to</label><input class="input" id="etPass" placeholder="Leave blank to keep current"></div>
      <div class="field"><label>Status</label>
        <select class="select" id="etStatus"><option value="approved" ${t.status==='approved'?'selected':''}>Approved</option><option value="suspended" ${t.status==='suspended'?'selected':''}>Suspended</option></select>
      </div>
    </div>
    <div class="modal-actions"><button class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" onclick="saveTeacherEdit('${id}')">Save changes</button></div>
  `, true);
}

async function saveTeacherEdit(id){
  const name = document.getElementById('etName').value.trim();
  const assignedCourses = [...document.querySelectorAll('.etCourseChk:checked')].map(c=>c.value);
  const status = document.getElementById('etStatus').value;
  const pass = document.getElementById('etPass').value;

  const res = await api.put('/teachers/' + id, { name, status, assignedCourses, password: pass });
  if(!res.ok){ showToast(res.msg || 'Update failed.', 'error'); return; }
  closeModal();
  showToast('Teacher updated.', 'success');
  navigate('teachers');
}

async function removeTeacher(id){
  if(!confirm('Remove this teacher account? Assigned courses will become unassigned.')) return;
  const res = await api.del('/teachers/' + id);
  if(!res.ok){ showToast(res.msg || 'Failed to remove.', 'error'); return; }
  showToast('Teacher removed.', 'success');
  navigate('teachers');
}

/* ADMIN: STUDENTS */
async function renderAdminStudents(wrap){
  const seriesRes = await api.get('/series');
  const seriesList = (seriesRes.ok && seriesRes.series) ? seriesRes.series : [];

  wrap.innerHTML = `
    <div class="hero"><div><h1>Students</h1><p>Manage the roster stored in SQLite database.</p></div>
      <div class="hero-actions">
        <button class="danger-btn ghost" onclick="openDeleteAllStudentsModal()">${ICONS.trash} Delete all students</button>
        <button class="ghost-btn" onclick="openImportModal()">${ICONS.upload} Import CSV</button>
        <button class="accent-btn" onclick="openAddStudentModal()">${ICONS.plus} Add student</button>
      </div></div>
    <div class="card section">
      <div class="filters">
        <div class="search-wrap">${ICONS.search}<input class="input" id="stuSearch" placeholder="Search by name, ID or roll..." oninput="renderStudentTable()"></div>
        <select class="select" id="stuSeriesFilter" onchange="renderStudentTable()"><option value="all">All series</option>${seriesList.map(s=>`<option value="${s.code}">${s.code} Series</option>`).join('')}</select>
      </div>
      <div class="table-wrap" id="studentTableWrap"></div>
    </div>
  `;
  await renderStudentTable();
}

async function renderStudentTable(){
  const sf = document.getElementById('stuSeriesFilter').value;
  const search = document.getElementById('stuSearch').value;
  const res = await api.get('/students', { series: sf, search, limit: 300 });
  const list = (res.ok && res.students) ? res.students : [];

  document.getElementById('studentTableWrap').innerHTML = list.length ? `
    <table class="table"><thead><tr><th>Roll</th><th>Student ID</th><th>Name</th><th>Series</th><th>Semester</th><th>Email</th><th>Attendance</th><th></th></tr></thead><tbody>
    ${list.map(s=>`<tr><td><span class="rollcell">${pad2(s.rollNo)}</span></td><td class="mono">${s.studentId}</td><td>${escapeHtml(s.name)}</td>
      <td>${s.series} Series</td><td>${s.semester}</td><td>${s.email}</td>
      <td><span class="badge ${s.attendancePct>=SYSTEM_SETTINGS.threshold?'present':'absent'}">${s.attendancePct.toFixed(0)}%</span></td>
      <td style="white-space:nowrap"><button class="subtle-btn" onclick="openEditStudentModal('${s.id}')">${ICONS.edit}</button><button class="subtle-btn" onclick="removeStudent('${s.id}')" style="color:var(--danger)">${ICONS.trash}</button></td></tr>`).join('')}
    </tbody></table>` : `<div class="empty"><strong>No students found</strong>Try a different search or add a new student.</div>`;
}

async function openAddStudentModal(){
  const seriesRes = await api.get('/series');
  const seriesList = (seriesRes.ok && seriesRes.series) ? seriesRes.series : [];
  const defaultSeries = seriesList[0]?.code || '25';

  openModal(`
    <div class="modal-head"><h3>Add student</h3><button class="close" onclick="closeModal()">${ICONS.x}</button></div>
    <div class="form-grid">
      <div class="field"><label>Full name</label><input class="input" id="nsName" placeholder="Student full name"></div>
      <div class="form-row">
        <div class="field"><label>Series</label><select class="select" id="nsSeries">${seriesList.map(s=>`<option value="${s.code}">${s.code} Series</option>`).join('')}</select></div>
        <div class="field"><label>Roll number</label><input class="input" type="number" id="nsRoll" value="61"></div>
      </div>
      <div class="field"><label>University email</label><input class="input" id="nsEmail" placeholder="2561@ece.edu"></div>
    </div>
    <div class="modal-actions"><button class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" onclick="createStudent()">${ICONS.check} Add student</button></div>
  `);
}

async function createStudent(){
  const name = document.getElementById('nsName').value.trim();
  const series = document.getElementById('nsSeries').value;
  const rollNo = Number(document.getElementById('nsRoll').value);
  const email = document.getElementById('nsEmail').value.trim();

  if(!name || !rollNo){ showToast('Name and roll number are required.', 'error'); return; }

  const res = await api.post('/students', { name, series, rollNo, email });
  if(!res.ok){ showToast(res.msg || 'Failed to add student.', 'error'); return; }
  closeModal();
  showToast('Student added to database.', 'success');
  navigate('students');
}

async function openEditStudentModal(id){
  const studentRes = await api.get('/students/' + id);
  if(!studentRes.ok) return;
  const { student } = studentRes;

  openModal(`
    <div class="modal-head"><h3>Edit student</h3><button class="close" onclick="closeModal()">${ICONS.x}</button></div>
    <div class="form-grid">
      <div class="field"><label>Full name</label><input class="input" id="esName" value="${escapeHtml(student.name)}"></div>
      <div class="form-row">
        <div class="field"><label>Series</label><input class="input" value="${student.series} Series" disabled></div>
        <div class="field"><label>Roll number</label><input class="input" value="${pad2(student.rollNo)}" disabled></div>
      </div>
      <div class="field"><label>Email</label><input class="input" id="esEmail" value="${student.email}"></div>
      <div class="field"><label>Reset password to (optional)</label><input class="input" id="esPass" placeholder="Leave blank to keep current"></div>
    </div>
    <div class="modal-actions"><button class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" onclick="saveStudentEdit('${id}')">Save changes</button></div>
  `);
}

async function saveStudentEdit(id){
  const name = document.getElementById('esName').value.trim();
  const email = document.getElementById('esEmail').value.trim();
  const password = document.getElementById('esPass').value;

  const res = await api.put('/students/' + id, { name, email, password });
  if(!res.ok){ showToast(res.msg || 'Update failed.', 'error'); return; }
  closeModal();
  showToast('Student updated in database.', 'success');
  navigate('students');
}

async function removeStudent(id){
  if(!confirm('Remove this student? Their attendance history will also be permanently deleted.')) return;
  const res = await api.del('/students/' + id);
  if(!res.ok){ showToast(res.msg || 'Delete failed.', 'error'); return; }
  showToast('Student removed.', 'success');
  navigate('students');
}

async function openDeleteAllStudentsModal(){
  const seriesRes = await api.get('/series');
  const seriesList = (seriesRes.ok && seriesRes.series) ? seriesRes.series : [];

  openModal(`
    <div class="modal-head"><h3>Delete students in bulk</h3><button class="close" onclick="closeModal()">${ICONS.x}</button></div>
    <p class="muted" style="margin-top:6px">Wipe student roster data to start fresh with your real department students.</p>
    <div class="form-grid" style="margin-top:14px">
      <div class="field">
        <label>Scope</label>
        <select class="select" id="bulkDeleteScope">
          <option value="all">Entire department (all series &amp; students)</option>
          ${seriesList.map(s => `<option value="${s.code}">${s.code} Series only (${s.studentCount || 0} students)</option>`).join('')}
        </select>
      </div>
      <div style="background:var(--danger-soft);color:var(--danger);padding:12px;border-radius:10px;font-size:12.5px;font-weight:600;line-height:1.5">
        ⚠️ Warning: This will permanently delete the selected students, their student login accounts, and all their attendance history from the SQLite database. This action cannot be undone.
      </div>
    </div>
    <div class="modal-actions">
      <button class="ghost-btn" onclick="closeModal()">Cancel</button>
      <button class="danger-btn" onclick="executeDeleteAllStudents()">${ICONS.trash} Confirm delete</button>
    </div>
  `);
}

async function executeDeleteAllStudents(){
  const scope = document.getElementById('bulkDeleteScope').value;
  const label = scope === 'all' ? 'ALL students across all series' : `${scope} Series students`;
  if(!confirm(`Are you absolutely sure you want to delete ${label}? This cannot be undone.`)) return;

  const res = await api.post('/students/delete-all', { series: scope });
  if(!res.ok){ showToast(res.msg || 'Bulk deletion failed.', 'error'); return; }
  closeModal();
  showToast(res.msg || 'Students deleted.', 'success');
  navigate('students');
}

function openImportModal(){
  openModal(`
    <div class="modal-head"><h3>Import students</h3><button class="close" onclick="closeModal()">${ICONS.x}</button></div>
    <p class="muted">CSV with header: <span class="mono">name,series,roll,email</span>.</p>
    <label class="upload-drop" for="csvFile" style="display:block;margin-top:10px">${ICONS.upload}<div style="margin-top:6px">Click to choose a .csv file</div></label>
    <input type="file" id="csvFile" accept=".csv" class="hide" onchange="handleCsvImport(event)">
    <div id="importResult" class="muted" style="margin-top:12px"></div>
    <div class="modal-actions"><button class="ghost-btn" onclick="closeModal()">Close</button></div>
  `);
}

async function handleCsvImport(e){
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = async ()=>{
    const text = reader.result;
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    if(!lines.length){ document.getElementById('importResult').textContent='Empty file.'; return; }
    const header = lines[0].toLowerCase().split(',').map(h=>h.trim());
    const rows = [];
    lines.slice(1).forEach(line=>{
      const parts = line.split(',').map(p=>p.trim());
      const row = {}; header.forEach((h,i)=>row[h]=parts[i]);
      rows.push(row);
    });

    const res = await api.post('/students/import', { rows });
    if(res.ok){
      document.getElementById('importResult').innerHTML = `<span style="color:var(--present);font-weight:700">${res.added} added to database</span> · ${res.skipped} skipped`;
      if(currentPage==='students') await renderStudentTable();
    } else {
      document.getElementById('importResult').textContent = res.msg || 'Import failed.';
    }
  };
  reader.readAsText(file);
}

/* ADMIN: COURSES */
async function renderAdminCourses(wrap){
  const seriesRes = await api.get('/series');
  const seriesList = (seriesRes.ok && seriesRes.series) ? seriesRes.series : [];

  wrap.innerHTML = `
    <div class="hero"><div><h1>Courses</h1><p>Create courses and assign teachers per series & semester.</p></div>
      <div class="hero-actions">
        <button class="danger-btn ghost" onclick="openDeleteAllCoursesModal()">${ICONS.trash} Delete all courses</button>
        <button class="accent-btn" onclick="openAddCourseModal()">${ICONS.plus} Add course</button>
      </div></div>
    <div class="card section">
      <div class="filters"><select class="select" id="crsSeriesFilter" onchange="renderCourseTable()"><option value="all">All series</option>${seriesList.map(s=>`<option value="${s.code}">${s.code} Series</option>`).join('')}</select></div>
      <div class="table-wrap" id="courseTableWrap"></div>
    </div>
  `;
  await renderCourseTable();
}

async function renderCourseTable(){
  const sf = document.getElementById('crsSeriesFilter').value;
  const res = await api.get('/courses', { series: sf });
  const list = (res.ok && res.courses) ? res.courses : [];

  document.getElementById('courseTableWrap').innerHTML = `
    <table class="table"><thead><tr><th>Code</th><th>Title</th><th>Series</th><th>Semester</th><th>Teacher</th><th>Credits</th><th></th></tr></thead><tbody>
    ${list.map(c=>`<tr><td class="mono">${c.code}</td><td>${escapeHtml(c.name)}</td><td>${c.series} Series</td><td>${c.semester}</td>
      <td>${c.teacherName ? escapeHtml(c.teacherName) : '<span class="badge pending">Unassigned</span>'}</td><td>${c.creditHours}</td>
      <td style="white-space:nowrap"><button class="subtle-btn" onclick="openEditCourseModal('${c.code}')">${ICONS.edit}</button><button class="subtle-btn" onclick="removeCourse('${c.code}')" style="color:var(--danger)">${ICONS.trash}</button></td></tr>`).join('')}
    </tbody></table>
  `;
}

const RUET_ECE_RECOMMENDATIONS = {
  '25': {
    defaultSem: 1,
    semesters: {
      1: {
        label: '1st Year 1st Sem (1-1)',
        courses: [
          { code: 'ECE-1101', title: 'Electrical Circuit Analysis I', credits: 3.0, type: 'Theory' },
          { code: 'ECE-1102', title: 'Electrical Circuit Analysis I Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'CSE-1103', title: 'Computer Programming', credits: 3.0, type: 'Theory' },
          { code: 'CSE-1104', title: 'Computer Programming Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'MATH-1105', title: 'Mathematics I (Calculus & Analytical Geometry)', credits: 3.0, type: 'Theory' },
          { code: 'PHY-1107', title: 'Physics (Electromagnetism & Waves)', credits: 3.0, type: 'Theory' },
          { code: 'PHY-1108', title: 'Physics Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'HUM-1109', title: 'Technical English', credits: 3.0, type: 'Theory' }
        ]
      },
      2: {
        label: '1st Year 2nd Sem (1-2)',
        courses: [
          { code: 'ECE-1201', title: 'Electrical Circuit Analysis II', credits: 3.0, type: 'Theory' },
          { code: 'ECE-1202', title: 'Electrical Circuit Analysis II Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-1203', title: 'Electronic Devices and Circuits', credits: 3.0, type: 'Theory' },
          { code: 'ECE-1204', title: 'Electronic Devices and Circuits Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'MATH-1205', title: 'Mathematics II (Differential Equations & Vectors)', credits: 3.0, type: 'Theory' },
          { code: 'CHEM-1207', title: 'Chemistry', credits: 3.0, type: 'Theory' },
          { code: 'CHEM-1208', title: 'Chemistry Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'HUM-1209', title: 'Sociology and Government', credits: 2.0, type: 'Theory' }
        ]
      }
    }
  },
  '24': {
    defaultSem: 3,
    semesters: {
      3: {
        label: '2nd Year 1st Sem (2-1)',
        courses: [
          { code: 'ECE-2101', title: 'Signals and Systems', credits: 3.0, type: 'Theory' },
          { code: 'ECE-2102', title: 'Signals and Systems Simulation Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-2103', title: 'Data structure and Algorithm', credits: 3.0, type: 'Theory' },
          { code: 'ECE-2104', title: 'Data structure and Algorithm Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-2105', title: 'Analog Electronics and Sessional-2', credits: 3.0, type: 'Theory' },
          { code: 'ECE-2106', title: 'Analog Electronics Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'MATH-2107', title: 'Mathematics III (Matrices & Complex Variables)', credits: 3.0, type: 'Theory' },
          { code: 'HUM-2109', title: 'Financial & Managerial Accounting', credits: 2.0, type: 'Theory' }
        ]
      },
      4: {
        label: '2nd Year 2nd Sem (2-2)',
        courses: [
          { code: 'ECE-2201', title: 'Digital Electronics and Logic Design', credits: 3.0, type: 'Theory' },
          { code: 'ECE-2202', title: 'Digital Electronics Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-2203', title: 'Electromagnetic Fields and Waves', credits: 3.0, type: 'Theory' },
          { code: 'ECE-2205', title: 'Numerical Methods and Programming', credits: 3.0, type: 'Theory' },
          { code: 'ECE-2206', title: 'Numerical Methods Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-2207', title: 'Electrical Machines and Power Systems', credits: 3.0, type: 'Theory' },
          { code: 'ECE-2208', title: 'Electrical Machines Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'MATH-2209', title: 'Mathematics IV (Fourier Series & Statistics)', credits: 3.0, type: 'Theory' }
        ]
      }
    }
  },
  '23': {
    defaultSem: 5,
    semesters: {
      5: {
        label: '3rd Year 1st Sem (3-1)',
        courses: [
          { code: 'ECE-3101', title: 'Analog and Digital Communication', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3102', title: 'Communication Engineering Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-3103', title: 'Microprocessors and Microcontrollers', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3104', title: 'Microprocessors and Microcontrollers Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-3105', title: 'Control Systems Engineering', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3106', title: 'Control Systems Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-3107', title: 'Database Management Systems', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3108', title: 'Database Management Systems Sessional', credits: 1.5, type: 'Sessional' }
        ]
      },
      6: {
        label: '3rd Year 2nd Sem (3-2)',
        courses: [
          { code: 'ECE-3201', title: 'Digital Signal Processing', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3202', title: 'Digital Signal Processing Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-3203', title: 'Computer Networks', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3204', title: 'Computer Networks Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-3205', title: 'VLSI Circuit Design', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3206', title: 'VLSI Design Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-3207', title: 'Antennas and Radio Wave Propagation', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3208', title: 'Electronic Project Design Sessional', credits: 1.5, type: 'Sessional' }
        ]
      }
    }
  },
  '22': {
    defaultSem: 7,
    semesters: {
      7: {
        label: '4th Year 1st Sem (4-1)',
        courses: [
          { code: 'ECE-4101', title: 'Wireless and Cellular Communication', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4102', title: 'Wireless Communication Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-4103', title: 'Optical Fiber Communication', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4104', title: 'Optical Fiber Communication Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-4105', title: 'Microwave and Radar Engineering', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4100', title: 'Project and Thesis I', credits: 3.0, type: 'Project' },
          { code: 'HUM-4107', title: 'Engineering Economics and Industrial Management', credits: 3.0, type: 'Theory' }
        ]
      },
      8: {
        label: '4th Year 2nd Sem (4-2)',
        courses: [
          { code: 'ECE-4201', title: 'Artificial Intelligence and Machine Learning', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4202', title: 'AI and Machine Learning Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-4203', title: 'Satellite Communication and Remote Sensing', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4205', title: 'Biomedical Engineering & Embedded Systems', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4200', title: 'Project and Thesis II', credits: 3.0, type: 'Project' }
        ]
      }
    }
  },
  '21': {
    defaultSem: 8,
    semesters: {
      8: {
        label: '4th Year 2nd Sem (4-2)',
        courses: [
          { code: 'ECE-4201', title: 'Artificial Intelligence and Machine Learning', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4202', title: 'AI and Machine Learning Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-4203', title: 'Satellite Communication and Remote Sensing', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4205', title: 'Biomedical Engineering & Embedded Systems', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4200', title: 'Project and Thesis II', credits: 3.0, type: 'Project' }
        ]
      }
    }
  }
};

async function openAddCourseModal(){
  const seriesRes = await api.get('/series');
  const seriesList = (seriesRes.ok && seriesRes.series) ? seriesRes.series : [];
  const teacherRes = await api.get('/teachers');
  const teachers = (teacherRes.ok && teacherRes.teachers) ? teacherRes.teachers.filter(t=>t.status==='approved') : [];

  openModal(`
    <div class="modal-head">
      <div>
        <h3>Add course</h3>
        <p class="muted" style="font-size:12px;margin:2px 0 0">Select series & semester to see course recommendations.</p>
      </div>
      <button class="close" onclick="closeModal()">${ICONS.x}</button>
    </div>
    <div class="form-grid">
      <div class="form-row">
        <div class="field">
          <label>Series</label>
          <select class="select" id="ncSeries" onchange="onAddCourseSeriesChange()">
            ${seriesList.map(s=>`<option value="${s.code}">${s.code} Series</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Semester</label>
          <select class="select" id="ncSemester" onchange="onAddCourseSemesterChange()"></select>
        </div>
      </div>

      <!-- Recommendation Section -->
      <div class="rec-box" id="ncRecBox">
        <div class="rec-header">
          <strong id="ncRecTitle">💡 Recommended Courses:</strong>
          <span>Click any card to auto-fill</span>
        </div>
        <div class="rec-grid" id="ncRecGrid"></div>
      </div>

      <div class="form-row">
        <div class="field">
          <label>Course code</label>
          <input class="input mono" id="ncCode" placeholder="e.g. ECE-2105" list="recCodeList">
          <datalist id="recCodeList"></datalist>
        </div>
        <div class="field">
          <label>Credit hours</label>
          <input class="input" type="number" id="ncCredit" value="3" step="0.5">
        </div>
      </div>

      <div class="field">
        <label>Course title</label>
        <input class="input" id="ncName" placeholder="e.g. Analog Electronics and Sessional-2" list="recNameList">
        <datalist id="recNameList"></datalist>
      </div>

      <div class="field">
        <label>Assigned teacher</label>
        <select class="select" id="ncTeacher">
          <option value="">Unassigned</option>
          ${teachers.map(t=>`<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="modal-actions">
      <button class="ghost-btn" onclick="closeModal()">Cancel</button>
      <button class="primary-btn" onclick="createCourse()">${ICONS.check} Create course</button>
    </div>
  `, true);

  onAddCourseSeriesChange();
}

function onAddCourseSeriesChange(){
  const s = document.getElementById('ncSeries').value;
  const sData = RUET_ECE_RECOMMENDATIONS[s];
  const semSelect = document.getElementById('ncSemester');
  
  if(sData && sData.semesters){
    const sems = Object.keys(sData.semesters);
    semSelect.innerHTML = sems.map(num => `<option value="${num}" ${Number(num)===sData.defaultSem ? 'selected' : ''}>${sData.semesters[num].label}</option>`).join('');
  } else {
    semSelect.innerHTML = `<option value="1">1st Year 1st Sem (1-1)</option><option value="3">2nd Year 1st Sem (2-1)</option>`;
  }
  onAddCourseSemesterChange();
}

function onAddCourseSemesterChange(){
  const s = document.getElementById('ncSeries').value;
  const sem = document.getElementById('ncSemester').value;
  const sData = RUET_ECE_RECOMMENDATIONS[s];
  const semObj = sData?.semesters?.[sem];
  const courses = semObj?.courses || [];

  const recBox = document.getElementById('ncRecBox');
  const recGrid = document.getElementById('ncRecGrid');
  const recTitle = document.getElementById('ncRecTitle');
  const codeList = document.getElementById('recCodeList');
  const nameList = document.getElementById('recNameList');

  if(courses.length > 0){
    recBox.style.display = 'block';
    recTitle.innerHTML = `💡 Recommended for ${s} Series — ${semObj.label}:`;
    recGrid.innerHTML = courses.map(c => `
      <div class="rec-card" onclick="selectRecommendedCourse('${c.code}', '${escapeHtml(c.title).replace(/'/g, "\\'")}', ${c.credits}, this)">
        <div class="rec-card-top">
          <span class="rec-card-code">${c.code}</span>
          <span class="rec-card-badge">${c.type}</span>
        </div>
        <div class="rec-card-title" title="${escapeHtml(c.title)}">${escapeHtml(c.title)}</div>
        <div class="rec-card-meta">${c.credits} Credits</div>
      </div>
    `).join('');

    codeList.innerHTML = courses.map(c => `<option value="${c.code}">${c.title}</option>`).join('');
    nameList.innerHTML = courses.map(c => `<option value="${c.title}">${c.code}</option>`).join('');
  } else {
    recBox.style.display = 'none';
    codeList.innerHTML = '';
    nameList.innerHTML = '';
  }
}

function selectRecommendedCourse(code, title, credits, el){
  document.getElementById('ncCode').value = code;
  document.getElementById('ncName').value = title;
  document.getElementById('ncCredit').value = credits;
  
  document.querySelectorAll('.rec-card').forEach(c => c.classList.remove('active'));
  if(el) el.classList.add('active');
  showToast(`Auto-filled ${code}!`, 'info');
}

async function createCourse(){
  const code = document.getElementById('ncCode').value.trim().toUpperCase();
  const name = document.getElementById('ncName').value.trim();
  const series = document.getElementById('ncSeries').value;
  const semester = Number(document.getElementById('ncSemester')?.value) || 1;
  const teacherId = document.getElementById('ncTeacher').value || null;
  const creditHours = Number(document.getElementById('ncCredit').value)||3;

  if(!code||!name){ showToast('Course code and title are required.', 'error'); return; }

  const res = await api.post('/courses', { code, name, series, semester, teacherId, creditHours });
  if(!res.ok){ showToast(res.msg || 'Failed to create course.', 'error'); return; }
  closeModal();
  showToast('Course created in database.', 'success');
  navigate('courses');
}

async function openEditCourseModal(code){
  const res = await api.get('/courses/' + code);
  if(!res.ok) return;
  const { course } = res;
  const teacherRes = await api.get('/teachers');
  const teachers = (teacherRes.ok && teacherRes.teachers) ? teacherRes.teachers.filter(t=>t.status==='approved') : [];

  openModal(`
    <div class="modal-head"><h3>Edit course</h3><button class="close" onclick="closeModal()">${ICONS.x}</button></div>
    <div class="form-grid">
      <div class="field"><label>Course code</label><input class="input" value="${course.code}" disabled></div>
      <div class="field"><label>Course title</label><input class="input" id="ecName" value="${escapeHtml(course.name)}"></div>
      <div class="field"><label>Teacher</label><select class="select" id="ecTeacher"><option value="">Unassigned</option>${teachers.map(t=>`<option value="${t.id}" ${t.id===course.teacherId?'selected':''}>${escapeHtml(t.name)}</option>`).join('')}</select></div>
    </div>
    <div class="modal-actions"><button class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" onclick="saveCourseEdit('${code}')">Save changes</button></div>
  `);
}

async function saveCourseEdit(code){
  const name = document.getElementById('ecName').value.trim();
  const teacherId = document.getElementById('ecTeacher').value || null;

  const res = await api.put('/courses/' + code, { name, teacherId });
  if(!res.ok){ showToast(res.msg || 'Failed to update.', 'error'); return; }
  closeModal();
  showToast('Course updated in database.', 'success');
  navigate('courses');
}

async function removeCourse(code){
  if(!confirm('Remove this course? All its sessions and attendance records will also be deleted.')) return;
  const res = await api.del('/courses/' + code);
  if(!res.ok){ showToast(res.msg || 'Failed to remove.', 'error'); return; }
  showToast('Course removed.', 'success');
  navigate('courses');
}

async function openDeleteAllCoursesModal(){
  const seriesRes = await api.get('/series');
  const seriesList = (seriesRes.ok && seriesRes.series) ? seriesRes.series : [];

  openModal(`
    <div class="modal-head"><h3>Delete courses in bulk</h3><button class="close" onclick="closeModal()">${ICONS.x}</button></div>
    <p class="muted" style="margin-top:6px">Wipe courses to configure real department curriculum.</p>
    <div class="form-grid" style="margin-top:14px">
      <div class="field">
        <label>Scope</label>
        <select class="select" id="bulkDeleteCourseScope">
          <option value="all">Entire department (all courses across all series)</option>
          ${seriesList.map(s => `<option value="${s.code}">${s.code} Series only (${s.courseCount || 0} courses)</option>`).join('')}
        </select>
      </div>
      <div style="background:var(--danger-soft);color:var(--danger);padding:12px;border-radius:10px;font-size:12.5px;font-weight:600;line-height:1.5">
        ⚠️ Warning: This will permanently delete the selected courses, all their class sessions, and all attendance records for these courses from the SQLite database.
      </div>
    </div>
    <div class="modal-actions">
      <button class="ghost-btn" onclick="closeModal()">Cancel</button>
      <button class="danger-btn" onclick="executeDeleteAllCourses()">${ICONS.trash} Confirm delete</button>
    </div>
  `);
}

async function executeDeleteAllCourses(){
  const scope = document.getElementById('bulkDeleteCourseScope').value;
  const label = scope === 'all' ? 'ALL courses across all series' : `${scope} Series courses`;
  if(!confirm(`Are you absolutely sure you want to delete ${label}? This cannot be undone.`)) return;

  const res = await api.post('/courses/delete-all', { series: scope });
  if(!res.ok){ showToast(res.msg || 'Bulk deletion failed.', 'error'); return; }
  closeModal();
  showToast(res.msg || 'Courses deleted.', 'success');
  navigate('courses');
}

/* ADMIN: SERIES */
async function renderAdminSeries(wrap){
  const res = await api.get('/series');
  const seriesList = (res.ok && res.series) ? res.series : [];

  wrap.innerHTML = `
    <div class="hero"><div><h1>Series & semesters</h1><p>The department is organized into student cohorts.</p></div>
      <div class="hero-actions"><button class="accent-btn" onclick="openAddSeriesModal()">${ICONS.plus} Add series</button></div></div>
    <div class="grid stats">
    ${seriesList.map(s=>`<div class="card stat">
      <div class="stat-top"><span>${s.code} Series</span><div class="icon-box copper">${ICONS.series}</div></div>
      <div class="stat-value">${s.studentCount}</div><div class="stat-sub">students · Semester ${s.semester}</div>
      <div class="muted" style="margin-top:10px">${s.courseCount} courses · ${s.avgAttendance.toFixed(1)}% avg attendance</div>
    </div>`).join('')}
    </div>
    <div class="card section" style="margin-top:16px">
      <div class="section-head"><h3>How series work</h3></div>
      <p class="muted">Each series (e.g. "22 Series") represents one admitted cohort. Students, courses, and attendance records are stored in the SQLite database scoped to a series + semester. Adding a series here makes it available across course creation, student roster, and reports.</p>
    </div>
  `;
}

function openAddSeriesModal(){
  openModal(`
    <div class="modal-head"><h3>Add a new series</h3><button class="close" onclick="closeModal()">${ICONS.x}</button></div>
    <div class="form-grid">
      <div class="field"><label>Series label (2 digits)</label><input class="input" id="nsvCode" placeholder="e.g. 26" maxlength="2"></div>
      <div class="field"><label>Starting semester</label><input class="input" type="number" id="nsvSem" value="1" min="1" max="8"></div>
    </div>
    <div class="modal-actions"><button class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" onclick="createSeries()">${ICONS.check} Add series</button></div>
  `);
}

async function createSeries(){
  const code = document.getElementById('nsvCode').value.trim();
  const semester = Number(document.getElementById('nsvSem').value)||1;
  const res = await api.post('/series', { code, semester });
  if(!res.ok){ showToast(res.msg || 'Failed to add series.', 'error'); return; }
  closeModal();
  showToast(`${code} Series added.`, 'success');
  navigate('series');
}

/* ============================================================
   REPORTS & EXPORTS (SheetJS)
   ============================================================ */
function exportRowsToExcel(rows, filename, titleLine){
  if(typeof XLSX==='undefined'){ showToast('Excel engine failed to load — check your connection.', 'error'); return; }
  const wb = XLSX.utils.book_new();
  const headerLines = [
    [SYSTEM_SETTINGS.deptName],
    [titleLine || 'Attendance Report'],
    ['Generated: ' + new Date().toLocaleString()],
    [],
  ];
  const cols = Object.keys(rows[0] || {Info:'No data'});
  const aoa = [...headerLines, cols, ...rows.map(r=>cols.map(c=>r[c]))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = cols.map(c=>({wch: Math.max(12, c.length+4)}));
  ws['!merges'] = [{s:{r:0,c:0}, e:{r:0,c:Math.max(cols.length-1,1)}}, {s:{r:1,c:0}, e:{r:1,c:Math.max(cols.length-1,1)}}];
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, filename.replace(/[^a-z0-9_\-]+/gi,'_') + '.xlsx');
  showToast('Excel file downloaded.', 'success');
}

function tableFromRows(rows){
  if(!rows.length) return `<div class="empty"><strong>No data</strong>Nothing to show yet.</div>`;
  const cols = Object.keys(rows[0]);
  return `<table class="table"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>
    ${rows.map(r=>`<tr>${cols.map(c=>`<td>${c==='Roll No'||c==='Roll'?`<span class="rollcell">${r[c]}</span>`:escapeHtml(String(r[c]))}</td>`).join('')}</tr>`).join('')}
  </tbody></table>`;
}

/* Reports for Teacher & Admin */
async function renderReports(wrap){
  const tid = SESSION.role === 'teacher' ? SESSION.linkedId : null;
  const courseRes = await api.get('/courses', tid ? { teacherId: tid } : {});
  const courses = (courseRes.ok && courseRes.courses) ? courseRes.courses : [];

  wrap.innerHTML = `
    <div class="hero"><div><h1>Reports & export</h1><p>Generate attendance reports by course, date range, or student — export straight to Excel.</p></div></div>
    <div class="tabs" id="reportTabs">
      <button class="active" onclick="switchReportTab('course')">By course</button>
      <button onclick="switchReportTab('defaulters')">Defaulter list</button>
    </div>
    <div id="reportTabContent" style="margin-top:16px"></div>
  `;
  await renderReportTab('course', courses);
}

async function switchReportTab(tab){
  document.querySelectorAll('#reportTabs button').forEach((b,i)=>b.classList.toggle('active', ['course','defaulters'][i]===tab));
  const tid = SESSION.role === 'teacher' ? SESSION.linkedId : null;
  const courseRes = await api.get('/courses', tid ? { teacherId: tid } : {});
  await renderReportTab(tab, (courseRes.ok && courseRes.courses) ? courseRes.courses : []);
}

async function renderReportTab(tab, courses){
  const el = document.getElementById('reportTabContent');
  if(tab==='course'){
    el.innerHTML = `
      <div class="card section">
        <div class="filters">
          <select class="select" id="repCourse">${courses.map(c=>`<option value="${c.code}">${c.code} — ${escapeHtml(c.name)}</option>`).join('')}</select>
          <button class="accent-btn" onclick="genCourseReport()">${ICONS.download} Export to Excel</button>
          <button class="ghost-btn" onclick="genCoursePdfReport()">${ICONS.download} Export to PDF</button>
        </div>
        <div class="table-wrap" id="courseReportTable"></div>
      </div>`;
    document.getElementById('repCourse').onchange = renderCourseReportPreview;
    await renderCourseReportPreview();
  } else if(tab==='defaulters'){
    el.innerHTML = `
      <div class="card section">
        <div class="filters">
          <select class="select" id="defCourse"><option value="all">All assigned courses</option>${courses.map(c=>`<option value="${c.code}">${c.code} — ${escapeHtml(c.name)}</option>`).join('')}</select>
          <input class="input" type="number" id="defThreshold" value="${SYSTEM_SETTINGS.threshold}" style="width:100px" title="Threshold %">
          <button class="accent-btn" onclick="genDefaulterReport()">${ICONS.download} Export defaulter list</button>
        </div>
        <div class="table-wrap" id="defaulterTable"></div>
      </div>`;
    document.getElementById('defCourse').onchange = renderDefaulterPreview;
    document.getElementById('defThreshold').oninput = renderDefaulterPreview;
    await renderDefaulterPreview();
  }
}

async function renderCourseReportPreview(){
  const code = document.getElementById('repCourse')?.value;
  if(!code) return;
  const res = await api.get('/reports/course/' + code);
  const rows = (res.ok && res.rows) ? res.rows : [];
  document.getElementById('courseReportTable').innerHTML = tableFromRows(rows);
}

function exportRuetAttendanceExcel(reportData, filename){
  if(typeof XLSX==='undefined'){ showToast('Excel engine failed to load — check your connection.', 'error'); return; }

  const { course, sessions, students, teacherName } = reportData;
  const numSessions = sessions ? sessions.length : 0;
  const totalDateCols = Math.max(38, numSessions + 2);
  const totalCols = 1 + totalDateCols + 2; // Roll (1) + Dates (totalDateCols) + Attnd% (1) + Mark (1)

  const aoa = [];

  // Row 0: Header
  const r0 = new Array(totalCols).fill('');
  r0[Math.floor(totalCols / 2) - 2] = "Heaven's light is our guide";
  aoa.push(r0);

  // Row 1: University
  const r1 = new Array(totalCols).fill('');
  r1[0] = 'RUET';
  r1[Math.floor(totalCols / 2) - 3] = 'Rajshahi University of Engineering & Technology';
  aoa.push(r1);

  // Row 2: Department
  const r2 = new Array(totalCols).fill('');
  r2[Math.floor(totalCols / 2) - 3] = 'Dept. of Electrical & Computer Engineering';
  aoa.push(r2);

  // Row 3: Report title
  const r3 = new Array(totalCols).fill('');
  r3[Math.floor(totalCols / 2) - 2] = 'Attendance Report';
  aoa.push(r3);

  // Row 4: Metadata
  const r4 = new Array(totalCols).fill('');
  r4[0] = 'Dept Name: ECE';
  r4[4] = 'Code: ' + (course ? (course.name + ' and Sesi') : '');
  r4[Math.floor(totalCols * 0.65)] = 'Course Title: ' + (course ? course.code : '');
  aoa.push(r4);

  // Row 5: Column Headers
  const r5 = new Array(totalCols).fill('');
  r5[0] = 'Roll No.';
  if (sessions && sessions.length) {
    sessions.forEach((sess, idx) => {
      r5[1 + idx] = sess.formattedDate || sess.date;
    });
  }
  r5[totalCols - 2] = 'Attnd (%)';
  r5[totalCols - 1] = 'Mark Obtained';
  aoa.push(r5);

  // Student Rows
  if (students && students.length) {
    students.forEach(st => {
      const row = new Array(totalCols).fill('');
      row[0] = st.studentId || pad2(st.rollNo);
      if (sessions && sessions.length) {
        sessions.forEach((sess, idx) => {
          row[1 + idx] = (st.sessionMarks && st.sessionMarks[sess.id]) ? st.sessionMarks[sess.id] : 'A';
        });
      }
      row[totalCols - 2] = st.attndPct !== undefined ? st.attndPct : 0;
      row[totalCols - 1] = st.markObtained !== undefined ? st.markObtained : 0;
      aoa.push(row);
    });
  }

  // 4 Blank spacing rows
  for(let i = 0; i < 4; i++) aoa.push(new Array(totalCols).fill(''));

  // Signature Block
  const sigRow1 = new Array(totalCols).fill('');
  sigRow1[2] = teacherName || 'Not Found';
  aoa.push(sigRow1);

  const sigRow2 = new Array(totalCols).fill('');
  sigRow2[1] = '_______________________________';
  sigRow2[Math.floor(totalCols * 0.45)] = '_______________________________';
  sigRow2[Math.floor(totalCols * 0.75)] = '_______________________________';
  aoa.push(sigRow2);

  const sigRow3 = new Array(totalCols).fill('');
  sigRow3[2] = 'Name of the Teacher';
  sigRow3[Math.floor(totalCols * 0.48)] = 'Signature';
  sigRow3[Math.floor(totalCols * 0.78)] = 'Date';
  aoa.push(sigRow3);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths
  const colWidths = [{ wch: 12 }];
  for(let i = 1; i <= totalDateCols; i++) {
    colWidths.push({ wch: 7 });
  }
  colWidths.push({ wch: 10 });
  colWidths.push({ wch: 14 });
  ws['!cols'] = colWidths;

  // Merges
  const merges = [
    { s: { r: 0, c: 2 }, e: { r: 0, c: totalCols - 3 } },
    { s: { r: 1, c: 2 }, e: { r: 1, c: totalCols - 3 } },
    { s: { r: 2, c: 2 }, e: { r: 2, c: totalCols - 3 } },
    { s: { r: 3, c: 2 }, e: { r: 3, c: totalCols - 3 } },
    { s: { r: 1, c: 0 }, e: { r: 3, c: 1 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
    { s: { r: 4, c: 4 }, e: { r: 4, c: Math.floor(totalCols * 0.64) } },
    { s: { r: 4, c: Math.floor(totalCols * 0.65) }, e: { r: 4, c: totalCols - 1 } }
  ];
  ws['!merges'] = merges;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
  XLSX.writeFile(wb, filename.replace(/[^a-z0-9_\-]+/gi, '_') + '.xlsx');
  showToast('Excel report downloaded in official RUET format!', 'success');
}

function downloadCourseReport(code, type){
  if (!code) { showToast('Please select a course.', 'error'); return; }
  const a = document.createElement('a');
  a.href = `/api/reports/course/${encodeURIComponent(code)}/${type}`;
  a.download = `${code}_attendance_report.${type === 'excel' ? 'xlsx' : 'pdf'}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`Downloading official RUET ${type.toUpperCase()} report...`, 'success');
}

async function genCourseReport(){
  const code = document.getElementById('repCourse').value;
  downloadCourseReport(code, 'excel');
}

async function genCoursePdfReport(){
  const code = document.getElementById('repCourse').value;
  downloadCourseReport(code, 'pdf');
}

async function genAdminCoursePdfReport(){
  const code = document.getElementById('admRepCourse').value;
  downloadCourseReport(code, 'pdf');
}

async function exportCoursePdf(code){
  if (!window.jspdf) { showToast('PDF engine loading, please try again.', 'error'); return; }
  const res = await api.get('/reports/course/' + code);
  if(!res.ok){ showToast('Failed to export PDF.', 'error'); return; }
  const { course, sessions, students, teacherName } = res;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.text("Heaven's light is our guide", 148, 12, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Rajshahi University of Engineering & Technology', 148, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Dept. of Electrical & Computer Engineering', 148, 24, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Attendance Report', 148, 30, { align: 'center' });

  // RUET corner mark
  doc.setFontSize(14);
  doc.text('RUET', 14, 22);

  // Metadata line
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Dept Name: ECE', 14, 36);
  doc.text(`Course: ${course.code} - ${course.name}`, 75, 36);
  doc.text(`Teacher: ${teacherName}`, 220, 36);

  // Headers: Roll No., dates..., Attnd (%), Mark Obtained
  const sessList = sessions || [];
  const headCols = ['Roll No.'];
  sessList.forEach(s => headCols.push(s.formattedDate || s.date));
  headCols.push('Attnd (%)', 'Mark Obtained');

  const tableBody = (students || []).map(st => {
    const row = [st.studentId || st.rollNo];
    sessList.forEach(s => {
      row.push(st.sessionMarks && st.sessionMarks[s.id] ? st.sessionMarks[s.id] : 'A');
    });
    row.push(st.attndPct !== undefined ? st.attndPct + '%' : '0%');
    row.push(st.markObtained !== undefined ? String(st.markObtained) : '0');
    return row;
  });

  doc.autoTable({
    startY: 40,
    head: [headCols],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 41], textColor: [255, 255, 255], fontSize: 8, halign: 'center' },
    styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center' },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left', cellWidth: 22 }
    },
    margin: { left: 10, right: 10 }
  });

  // Signature Block at bottom
  let sigY = doc.lastAutoTable.finalY + 16;
  if (sigY > 185) { doc.addPage(); sigY = 25; }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(teacherName, 35, sigY - 2, { align: 'center' });
  doc.line(15, sigY, 65, sigY);
  doc.text('Name of the Teacher', 35, sigY + 5, { align: 'center' });

  doc.line(125, sigY, 175, sigY);
  doc.text('Signature', 150, sigY + 5, { align: 'center' });

  doc.line(230, sigY, 280, sigY);
  doc.text('Date', 255, sigY + 5, { align: 'center' });

  doc.save(`${course.code}_attendance_report.pdf`);
  showToast('Course PDF report downloaded in official RUET format!', 'success');
}

async function renderDefaulterPreview(){
  const code = document.getElementById('defCourse')?.value;
  const th = Number(document.getElementById('defThreshold')?.value) || SYSTEM_SETTINGS.threshold;
  const res = await api.get('/reports/defaulters', { courseCode: code, threshold: th });
  const rows = (res.ok && res.rows) ? res.rows : [];
  document.getElementById('defaulterTable').innerHTML = tableFromRows(rows);
}

async function genDefaulterReport(){
  const code = document.getElementById('defCourse').value;
  const th = Number(document.getElementById('defThreshold').value) || SYSTEM_SETTINGS.threshold;
  const res = await api.get('/reports/defaulters', { courseCode: code, threshold: th });
  if(!res.ok){ showToast('Failed to export.', 'error'); return; }
  exportRowsToExcel(res.rows, `defaulters_below_${th}pct`, `Defaulter List (below ${th}%)`);
}

/* Admin Reports */
async function renderAdminReports(wrap){
  wrap.innerHTML = `
    <div class="hero"><div><h1>Department reports</h1><p>Full visibility across every series, course, and teacher.</p></div></div>
    <div class="tabs" id="adminReportTabs">
      <button class="active" onclick="switchAdminReportTab('course')">By course</button>
      <button onclick="switchAdminReportTab('series')">By series</button>
      <button onclick="switchAdminReportTab('defaulters')">Department defaulters</button>
    </div>
    <div id="adminReportTabContent" style="margin-top:16px"></div>
  `;
  await renderAdminReportTab('course');
}

async function switchAdminReportTab(tab){
  document.querySelectorAll('#adminReportTabs button').forEach((b,i)=>b.classList.toggle('active', ['course','series','defaulters'][i]===tab));
  await renderAdminReportTab(tab);
}

async function renderAdminReportTab(tab){
  const el = document.getElementById('adminReportTabContent');
  if(tab==='course'){
    const courseRes = await api.get('/courses');
    const courses = (courseRes.ok && courseRes.courses) ? courseRes.courses : [];
    el.innerHTML = `<div class="card section">
      <div class="filters"><select class="select" id="admRepCourse">${courses.map(c=>`<option value="${c.code}">${c.code} — ${escapeHtml(c.name)} (Series ${c.series})</option>`).join('')}</select>
      <button class="accent-btn" onclick="genAdminCourseReport()">${ICONS.download} Export to Excel</button>
      <button class="ghost-btn" onclick="genAdminCoursePdfReport()">${ICONS.download} Export to PDF</button></div>
      <div class="table-wrap" id="admCourseTable"></div></div>`;
    document.getElementById('admRepCourse').onchange = async ()=>{
      const cCode = document.getElementById('admRepCourse').value;
      const res = await api.get('/reports/course/' + cCode);
      document.getElementById('admCourseTable').innerHTML = tableFromRows(res.rows || []);
    };
    await document.getElementById('admRepCourse').onchange();
  } else if(tab==='series'){
    const seriesRes = await api.get('/series');
    const seriesList = (seriesRes.ok && seriesRes.series) ? seriesRes.series : [];
    el.innerHTML = `<div class="card section">
      <div class="filters"><select class="select" id="admRepSeries">${seriesList.map(s=>`<option value="${s.code}">${s.code} Series</option>`).join('')}</select>
      <button class="accent-btn" onclick="genAdminSeriesReport()">${ICONS.download} Export class summary</button></div>
      <div class="table-wrap" id="admSeriesTable"></div></div>`;
    const renderSeriesPreview = async ()=>{
      const s = document.getElementById('admRepSeries').value;
      const res = await api.get('/reports/series/' + s);
      document.getElementById('admSeriesTable').innerHTML = tableFromRows(res.rows || []);
    };
    document.getElementById('admRepSeries').onchange = renderSeriesPreview;
    await renderSeriesPreview();
  } else if(tab==='defaulters'){
    el.innerHTML = `<div class="card section">
      <div class="filters"><input class="input" type="number" id="admThreshold" value="${SYSTEM_SETTINGS.threshold}" style="width:100px">
      <button class="accent-btn" onclick="genDeptDefaulterReport()">${ICONS.download} Export department defaulters</button></div>
      <div class="table-wrap" id="admDefTable"></div></div>`;
    const renderDefPreview = async ()=>{
      const th = Number(document.getElementById('admThreshold').value) || SYSTEM_SETTINGS.threshold;
      const res = await api.get('/reports/defaulters', { threshold: th });
      document.getElementById('admDefTable').innerHTML = tableFromRows(res.rows || []);
    };
    document.getElementById('admThreshold').oninput = renderDefPreview;
    await renderDefPreview();
  }
}

async function genAdminCourseReport(){
  const code = document.getElementById('admRepCourse').value;
  downloadCourseReport(code, 'excel');
}

async function genAdminSeriesReport(){
  const s = document.getElementById('admRepSeries').value;
  const res = await api.get('/reports/series/' + s);
  if(!res.ok){ showToast('Export failed.', 'error'); return; }
  exportRowsToExcel(res.rows, `${s}_series_summary`, `${s} Series — Class Summary`);
}

async function genDeptDefaulterReport(){
  const th = Number(document.getElementById('admThreshold').value) || SYSTEM_SETTINGS.threshold;
  const res = await api.get('/reports/defaulters', { threshold: th });
  if(!res.ok){ showToast('Export failed.', 'error'); return; }
  exportRowsToExcel(res.rows, `department_defaulters_below_${th}pct`, `Department Defaulter List (below ${th}%)`);
}

/* ============================================================
   ADMIN: SYSTEM SETTINGS
   ============================================================ */
async function renderAdminSettings(wrap){
  await loadSystemSettings();
  const s = SYSTEM_SETTINGS;

  wrap.innerHTML = `
    <div class="hero"><div><h1>System settings</h1><p>Department-wide configuration stored in SQLite.</p></div></div>
    <div class="grid two-col">
      <div class="card section">
        <div class="section-head"><h3>Attendance policy</h3></div>
        <div class="form-grid">
          <div class="field"><label>Minimum attendance threshold (%)</label><input class="input" type="number" id="setThreshold" value="${s.threshold}"></div>
          <div class="field"><label>Edit window for teachers (hours)</label><input class="input" type="number" id="setEditWindow" value="${s.editWindowHours}"></div>
          <button class="primary-btn" onclick="saveSystemSettings()">Save settings</button>
        </div>
      </div>
      <div class="card section">
        <div class="section-head"><h3>Marks table (14.2)</h3></div>
        <p class="muted" style="margin-bottom:10px">Official department scheme:</p>
        <table class="table"><thead><tr><th>Attendance</th><th>Marks</th></tr></thead><tbody>
          <tr><td>90% and above</td><td><strong>10</strong></td></tr>
          <tr><td>85% to less than 90%</td><td><strong>9</strong></td></tr>
          <tr><td>80% to less than 85%</td><td><strong>8</strong></td></tr>
          <tr><td>75% to less than 80%</td><td><strong>7</strong></td></tr>
          <tr><td>70% to less than 75%</td><td><strong>6</strong></td></tr>
          <tr><td>65% to less than 70%</td><td><strong>5</strong></td></tr>
          <tr><td>60% to less than 65%</td><td><strong>4</strong></td></tr>
          <tr><td>Less than 60%</td><td><strong>0</strong></td></tr>
        </tbody></table>
      </div>
      <div class="card section">
        <div class="section-head"><h3>Department info</h3></div>
        <div class="form-grid">
          <div class="field"><label>Department name</label><input class="input" id="setDeptName" value="${escapeHtml(s.deptName)}"></div>
          <div class="field"><label>Current semester label</label><input class="input" id="setSemLabel" value="${escapeHtml(s.currentSemesterLabel)}"></div>
          <button class="primary-btn" onclick="saveSystemSettings()">Save</button>
        </div>
        <div class="section-head" style="margin-top:22px"><h3>Danger zone</h3></div>
        <p class="muted">Reset SQLite database back to original demo seed (300 students, 5 series, courses, users).</p>
        <button class="danger-btn ghost" onclick="confirmResetDemo()">Reset demo data</button>
      </div>
    </div>
  `;
}

async function saveSystemSettings(){
  const threshold = Number(document.getElementById('setThreshold').value)||75;
  const editWindowHours = Number(document.getElementById('setEditWindow').value)||48;
  const deptName = document.getElementById('setDeptName').value.trim()||SYSTEM_SETTINGS.deptName;
  const currentSemesterLabel = document.getElementById('setSemLabel').value.trim()||SYSTEM_SETTINGS.currentSemesterLabel;

  const res = await api.post('/settings', { threshold, editWindowHours, deptName, currentSemesterLabel });
  if(!res.ok){ showToast(res.msg || 'Save failed.', 'error'); return; }
  await loadSystemSettings();
  showToast('Settings saved to database.', 'success');
  navigate('settings');
}

async function confirmResetDemo(){
  if(confirm('This will wipe and re-seed the SQLite database with clean demo data. Continue?')){
    const res = await api.post('/settings/reset-demo', {});
    if(!res.ok){ showToast(res.msg || 'Reset failed.', 'error'); return; }
    clearSession();
    showToast('Database reset and re-seeded.', 'success');
    location.reload();
  }
}

/* ============================================================
   AUTH: LOGIN & REGISTER
   ============================================================ */
const DEMO_CREDS = {
  teacher: {email:'mr@ece.edu', pass:'teacher123'},
  student: {email:'2201@ece.edu', pass:'student123'},
  admin: {email:'admin@ece.edu', pass:'admin123'},
};

function renderDemoCreds(){
  const role = document.getElementById('loginRole').value;
  const c = DEMO_CREDS[role];
  document.getElementById('demoCreds').innerHTML = `Demo login — <b>${c.email}</b> / <b>${c.pass}</b>`;
}

function togglePasswordVisibility(inputId, btn){
  const input = document.getElementById(inputId);
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.innerHTML = showing
    ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>`
    : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.6 19.6 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a19.5 19.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
}

function switchAuthTab(which){
  document.getElementById('tabLoginBtn').classList.toggle('active', which==='login');
  document.getElementById('tabRegisterBtn').classList.toggle('active', which==='register');
  document.getElementById('loginView').classList.toggle('active', which==='login');
  document.getElementById('registerView').classList.toggle('active', which==='register');
}

async function handleLogin(){
  const role = document.getElementById('loginRole').value;
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  const res = await api.post('/auth/login', { email, password, role });
  btn.disabled = false;
  btn.textContent = 'Sign in';

  if(!res.ok){
    errEl.textContent = res.msg || 'Login failed.';
    errEl.classList.add('show');
    return;
  }

  errEl.classList.remove('show');
  saveSession(res.user);
  enterApp();
}

async function handleRegister(){
  const studentId = document.getElementById('regStudentId').value;
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errEl = document.getElementById('registerError');

  const btn = document.getElementById('registerBtn');
  btn.disabled = true;
  btn.textContent = 'Creating account...';

  const res = await api.post('/auth/register', { studentId, email, password });
  btn.disabled = false;
  btn.textContent = 'Create account';

  if(!res.ok){
    errEl.textContent = res.msg || 'Registration failed.';
    errEl.classList.add('show');
    return;
  }

  errEl.classList.remove('show');
  saveSession(res.user);
  enterApp();
}

function logout(){
  clearSession();
  document.getElementById('app').classList.add('hide');
  document.getElementById('loginScreen').style.display = 'grid';
  document.getElementById('loginEmail').value='';
  document.getElementById('loginPassword').value='';
}

async function enterApp(){
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').classList.remove('hide');
  await renderNav();
  await refreshNotifDot();
  navigate('dashboard');
}

/* decorative circuit background */
function renderCircuitBg(){
  const holder = document.getElementById('circuitSvgHolder');
  const W=520,H=760; let paths='';
  const rows = 7;
  for(let i=0;i<rows;i++){
    const y = 40 + i*(H-80)/rows;
    const x1 = 20 + Math.random()*80, x2 = W-120+Math.random()*100;
    const midx = x1 + (x2-x1)*(0.3+Math.random()*0.4);
    paths += `<path d="M${x1} ${y} H${midx} V${y+ (Math.random()>0.5?24:-24)} H${x2}" stroke="rgba(213,150,90,0.35)" stroke-width="1.4" fill="none"/>`;
    paths += `<circle cx="${x1}" cy="${y}" r="3" fill="rgba(213,150,90,0.55)"/><circle cx="${x2}" cy="${y}" r="3" fill="rgba(213,150,90,0.55)"/>`;
  }
  holder.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */
async function init(){
  initTheme();
  renderCircuitBg();
  renderDemoCreds();
  loadSession();
  await loadSystemSettings();

  if(SESSION){
    enterApp();
  }

  document.getElementById('loginPassword').addEventListener('keydown', e=>{ if(e.key==='Enter') handleLogin(); });
  document.getElementById('regPassword').addEventListener('keydown', e=>{ if(e.key==='Enter') handleRegister(); });
}

init();
