import { loadDatabaseSnapshot, logoutOnServer } from "./db.js";

const STORAGE_KEY   = "chainCampusState";
const USERS_KEY     = "chainCampusUsers";
const SESSION_KEY   = "chainCampusSession";
const TOAST_MS      = 3200;

const PROTECTED = ['dashboard','register','events','attendance','profile','courses','timetable','scholarships'];

/* ─── Navigation ──────────────────────────────────────────── */
const NAV_ITEMS = [
  ["dashboard.html",  "Dashboard",  "dashboard"],
  ["courses.html",    "Courses",    "courses"],
  ["events.html",     "Events",     "events"],
  ["timetable.html",  "Timetable",  "timetable"],
  ["attendance.html", "Attendance", "attendance"],
  ["schol.html", "Scholarships", "scholarships"],
  ["profile.html", "Profile", "profile"],
  ["login.html", "Login", "login"]
];

const ADMIN_NAV_ITEMS = [
  ["admin_dashboard.html", "Admin Dashboard", "admin_dashboard"],
  ["admin_courses.html", "Manage Courses", "admin_courses"],
  ["admin_events.html", "Manage Events", "admin_events"],
  ["admin_scholarships.html", "Manage Scholarships", "admin_scholarships"]
];

/* ─── Sample Data (used for seeding) ─────────── */
const SEED_COURSES = [
  { id:'cs101', code:'CS101', name:'Data Structures & Algorithms',    credits:4, instructor:'Dr. Priya Sharma',   days:['Mon','Wed','Fri'], time:'9:00 AM',  room:'LH-201',    color:'blue'     },
  { id:'cs201', code:'CS201', name:'Database Management Systems',     credits:3, instructor:'Prof. Rahul Verma',  days:['Tue','Thu'],       time:'11:00 AM', room:'LH-102',    color:'pink'     },
  { id:'cs301', code:'CS301', name:'Computer Networks',               credits:4, instructor:'Dr. Anjali Nair',   days:['Mon','Wed','Fri'], time:'2:00 PM',  room:'LH-305',    color:'mint'     },
  { id:'cs401', code:'CS401', name:'Operating Systems',               credits:4, instructor:'Prof. Vikram Singh', days:['Tue','Thu'],      time:'9:00 AM',  room:'LH-203',    color:'peach'    },
  { id:'ma101', code:'MA101', name:'Engineering Mathematics IV',      credits:3, instructor:'Dr. Meena Krishnan', days:['Mon','Wed','Fri'], time:'11:00 AM', room:'LH-101',    color:'lavender' },
  { id:'cs501', code:'CS501', name:'Machine Learning',                credits:3, instructor:'Dr. Arjun Patel',   days:['Tue','Thu'],       time:'2:00 PM',  room:'ML-Lab-1',  color:'violet'   },
  { id:'cs601', code:'CS601', name:'Blockchain Technology',           credits:3, instructor:'Prof. Deepa Menon', days:['Wed','Fri'],        time:'4:00 PM',  room:'LH-404',    color:'rose'     },
  { id:'cs701', code:'CS701', name:'Web Development',                 credits:3, instructor:'Dr. Suresh Kumar',  days:['Mon','Thu'],        time:'4:00 PM',  room:'CS-Lab-2',  color:'amber'    },
];

const SEED_EVENTS = [
  { id:'evt1', title:'Blockchain Hackathon 2026',  date:'May 10, 2026',  venue:'Innovation Hub',    capacity: 100, description:'Build decentralised apps on Solana and compete for prizes.',           verified:false },
  { id:'evt2', title:'Web3 Summit',                date:'May 18, 2026',  venue:'Main Auditorium',   capacity: 500, description:'Industry leaders discuss Web3, DeFi, and decentralised identity.',     verified:false },
  { id:'evt3', title:'AI × Blockchain Workshop',   date:'June 2, 2026',  venue:'CS Lab 1',          capacity: 50,  description:'Hands-on workshop combining AI agents with blockchain-verified data.', verified:false },
  { id:'evt4', title:'Annual Tech Fest 2026',      date:'June 15, 2026', venue:'Campus Grounds',    capacity: 1000, description:'The biggest campus tech event with competitions, talks & networking.',  verified:false },
];
const SEED_NOTICES = [
  { id:'n1', title:'End-Semester Exam Schedule',        body:'Examinations begin May 5, 2026. Hall tickets available on portal.', type:'academic' },
  { id:'n2', title:'Blockchain Workshop Registration',  body:'Register by April 30 for the Solana developer workshop. Seats limited.', type:'event' },
  { id:'n3', title:'Minimum Attendance Reminder',       body:'75% attendance is mandatory in all courses to sit for examinations.', type:'notice' },
];
const SEED_ATTENDANCE = [
  { id:'a1', courseId:'cs101', courseName:'Data Structures & Algorithms', subject:'Lecture 22 — Graph Algorithms',       date:'Apr 20, 2026', status:'Verified', verifier:'Dr. Priya Sharma' },
  { id:'a2', courseId:'cs601', courseName:'Blockchain Technology',        subject:'Lecture 18 — Solana Architecture',    date:'Apr 19, 2026', status:'Verified', verifier:'Prof. Deepa Menon' },
  { id:'a3', courseId:'cs501', courseName:'Machine Learning',             subject:'Lecture 15 — Neural Networks',        date:'Apr 17, 2026', status:'Verified', verifier:'Dr. Arjun Patel' },
  { id:'a4', courseId:'ma101', courseName:'Engineering Mathematics IV',   subject:'Lecture 20 — Fourier Transforms',     date:'Apr 16, 2026', status:'Present',  verifier:'Student self-marked' },
  { id:'a5', courseId:'cs301', courseName:'Computer Networks',            subject:'Lecture 19 — TCP/IP Deep Dive',       date:'Apr 15, 2026', status:'Verified', verifier:'Dr. Anjali Nair' },
];
const SEED_ENROLLED = ['cs101','cs601','cs501','ma101','cs301'];

/* ─── Default state ──────────────────────────────────────── */
const defaultState = {
  walletAddress:'', student:{},
  lastTransaction:{ status:'Idle', label:'No transaction yet', message:'', txId:'' },
  notifications:[], attendanceRecords:[], events:[], courses:[], enrolledCourses:[], scholarshipApplications:[], txLog:[], seeded:false,
};

/* ═══════════════ STATE ════════════════════════════════════ */
function mergeState(s){ return { ...defaultState, ...s }; }

export function getState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? mergeState(JSON.parse(raw)) : { ...defaultState };
}
function saveState(s){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  return s;
}
export function updateState(fn){
  const cur = getState();
  const next = typeof fn === 'function' ? fn({ ...cur }) : fn;
  return saveState(next);
}

/* ═══════════════ USERS / SESSION ══════════════════════════ */
export function getUsers(){
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}
export function saveUser(user){
  const users = getUsers();
  const i = users.findIndex(u => u.email === user.email);
  if(i >= 0) users[i] = user; else users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
export function getUserByEmail(email){ return getUsers().find(u => u.email === email) || null; }

export function getSession(){ const r = localStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; }
export function setSession(user){
  const session = {
    email:user.email, name:user.name, studentId:user.studentId, college:user.college, 
    program:user.program, year:user.year, isAdmin:user.isAdmin, loggedIn:true 
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
export function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}
export function isLoggedIn(){ const s = getSession(); return !!(s && s.loggedIn); }

export function requireAuth(){
  const page = document.body.dataset.page || '';
  const session = getSession();
  
  if(page.startsWith('admin_')){
    if(!session || !session.isAdmin){
      window.location.href = 'login.html';
      return false;
    }
  } else if(PROTECTED.includes(page)){
    if(!session){
      window.location.href = 'login.html';
      return false;
    } else if (session.isAdmin) {
      window.location.href = 'admin_dashboard.html';
      return false;
    }
  }
  return true;
}

/* ═══════════════ SEED ══════════════════════════════════════ */
function seedData(){
  const s = getState();
  if(!getUserByEmail('admin@college.edu')){
    saveUser({ email:'admin@college.edu', password:'Admin()09', name:'System Admin', isAdmin:true });
  }
  // Seeding of default student has been removed to keep registrations clean and actual.

  if(s.seeded) return;
  updateState(st => {
    st.events = SEED_EVENTS;
    st.courses = SEED_COURSES;
    st.attendanceRecords = SEED_ATTENDANCE;
    st.notifications = SEED_NOTICES;
    st.enrolledCourses = SEED_ENROLLED;
    st.seeded = true;
    return st;
  });
}

/* ═══════════════ WALLET ════════════════════════════════════ */
export async function connectWallet(){
  try{
    if(!window.solana || !window.solana.isPhantom){
      showToast('Phantom not found','Install Phantom Wallet to continue.','failed');
      window.open('https://phantom.app/','_blank');
      return null;
    }
    const res = await window.solana.connect();
    const addr = res.publicKey.toString();
    updateState(s => { s.walletAddress = addr; return s; });
    renderHeader(); updateWalletCopy();
    showToast('Wallet connected', truncate(addr, 20), 'success');
    return addr;
  }catch(e){
    showToast('Connection failed','User rejected or an error occurred.','failed');
    return null;
  }
}

export async function requireConnectedWallet(opts={}){
  const { message = 'Connect your wallet to continue.' } = opts;
  const s = getState();
  if(s.walletAddress) return true;
  showToast('Wallet required', message, 'pending');
  const addr = await connectWallet();
  return !!addr;
}

/* ══════════════ TOAST ══════════════════════════════════════ */
export function showToast(title, message='', tone='success'){
  const stack = document.querySelector('[data-toast-stack]');
  if(!stack) return;
  const t = document.createElement('div');
  t.className = 'toast';
  // Left accent color based on tone
  const accentColors = { success:'#34d399', failed:'#f87171', pending:'#fbbf24', info:'#818cf8' };
  const accent = accentColors[tone] || accentColors.info;
  t.style.cssText = `border-left: 3px solid ${accent};`;
  t.innerHTML = `<div><strong style="font-size:0.88rem;font-weight:700;color:var(--text)">${title}</strong>${message?`<p style="font-size:0.78rem;color:var(--text-soft);margin-top:2px;line-height:1.4">${message}</p>`:''}</div>`;
  stack.prepend(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{
    t.classList.remove('show');
    t.classList.add('hide');
    setTimeout(()=>t.remove(), 250);
  }, 3200);
}

export function setButtonPending(btn, isPending, pendingLabel='Pending…', defaultLabel='Submit'){
  if(!btn) return;
  if(!btn.dataset.defaultLabel) btn.dataset.defaultLabel = btn.textContent.trim();
  btn.disabled = isPending;
  btn.textContent = isPending ? pendingLabel : (defaultLabel || btn.dataset.defaultLabel);
}

/* ═══════════════ TX LOG ════════════════════════════════════ */
export function addToTxLog(action, txId, status='success'){
  updateState(s => {
    s.txLog = [{ action, txId, status, ts: new Date().toLocaleString() }, ...(s.txLog||[])].slice(0,20);
    return s;
  });
}

/* ═══════════════ TRANSACTION ═══════════════════════════════ */
export function setTransaction(status, label, message, txId){
  updateState(s => { s.lastTransaction = { status, label, message, txId }; return s; });
  if(txId) addToTxLog(label, txId, status.toLowerCase());
}

/* ═══════════════ UI HELPERS ════════════════════════════════ */
function truncate(s, n){ return s && s.length > n ? s.slice(0,n)+'…' : s; }

function getInitials(name=''){
  return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'CC';
}

export function updateWalletCopy(){
  const s = getState();
  document.querySelectorAll('[data-wallet-copy]').forEach(el => {
    el.textContent = s.walletAddress ? truncate(s.walletAddress,20) : 'Not Connected';
  });
}

/* ─── SIDEBAR ─────────────────────────────────────────────── */
function renderHeader(){
  renderSidebar();
}

function renderSidebar(){
  const sidebarEl = document.querySelector('[data-sidebar]');
  const cur = document.body.dataset.page || '';
  const session = getSession();
  const state = getState();

  if(!sidebarEl) {
    // Fallback for pages without sidebar (login, index)
    return;
  }

  const navList = session?.isAdmin ? ADMIN_NAV_ITEMS : NAV_ITEMS;
  const NAV_ICONS = {
    dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
    courses: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    events: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    timetable: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    attendance: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    scholarships: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
    profile: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    login: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`,
    admin_dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
    admin_courses: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    admin_events: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    admin_scholarships: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`
  };

  const filteredNav = navList.filter(([,,page]) => !(page==='login' && session?.loggedIn));
  const navLinksHtml = filteredNav.map(([href,label,page]) =>
    `<a href="${href}" class="sidebar-link${page===cur?' active':''}">
      <span class="nav-icon" style="display:inline-flex; align-items:center; justify-content:center;">${NAV_ICONS[page]||'•'}</span>
      <span class="nav-label">${label}</span>
    </a>`
  ).join('');

  const showWalletHud = session && session.loggedIn;
  const vAddr = state.student?.walletAddress || state.walletAddress || session?.walletAddress || (session?.isAdmin ? 'CCvWAdmin' : '');
  const vBal = typeof session?.virtualBalance === 'number' ? session.virtualBalance : (typeof state.student?.virtualBalance === 'number' ? state.student.virtualBalance : (session?.isAdmin ? 100.0 : 5.00));

  const walletHudHtml = showWalletHud ? `
    <div class="sidebar-wallet" style="border: 1px solid var(--stroke); background: rgba(255,255,255,0.02); border-radius: 12px; padding: 12px; margin-bottom: 12px;">
      <div class="sidebar-wallet-addr" data-copy-hud-addr="${vAddr}" title="Click to copy" style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:0.7rem; color:var(--text-muted); font-family:'JetBrains Mono',monospace;">
        <span class="wallet-dot" style="width:6px; height:6px; background:var(--teal); border-radius:50%; display:inline-block;"></span>
        ${truncate(vAddr||'CCvW...virtual', 16)}
      </div>
      <div class="sidebar-wallet-bal" style="font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:1.1rem; color:var(--text); margin-top:4px;">
        ${Number(vBal).toFixed(3)} <small style="font-size:0.7rem; font-weight:500; color:var(--text-soft);">SOL</small>
      </div>
      <button class="airdrop-btn" id="airdrop-hud-btn" style="width:100%; margin-top:8px; display:flex; align-items:center; justify-content:center; gap:6px; padding:6px; font-size:0.75rem; font-weight:700; background:var(--accent-dim); border:1px solid var(--accent-border); color:var(--accent-bright); border-radius:8px; cursor:pointer; transition:all 0.2s;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        Airdrop +1 SOL
      </button>
    </div>` : '';

  const userHtml = session?.loggedIn ? `
    ${walletHudHtml}
    <div class="sidebar-user" style="display:flex; align-items:center; gap:10px; padding-top:10px; border-top:1px solid var(--stroke);">
      <div class="sidebar-avatar" style="width:36px; height:36px; border-radius:50%; background:var(--accent); color:#fff; display:grid; place-items:center; font-weight:700; font-size:0.85rem;">${getInitials(session.name)}</div>
      <div class="sidebar-user-info" style="display:flex; flex-direction:column; gap:1px;">
        <div class="sidebar-user-name" style="font-weight:700; font-size:0.85rem; color:var(--text);">${session.name||'Student'}</div>
        <div class="sidebar-user-role" style="font-size:0.7rem; display:flex; align-items:center; gap:4px;">
          ${session.isAdmin ? 
            `<span style="color:var(--amber); display:inline-flex; align-items:center; gap:3px; font-weight:600;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Admin</span>` : 
            `<span style="color:var(--teal); display:inline-flex; align-items:center; gap:3px; font-weight:600;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg> Student</span>`
          }
        </div>
      </div>
    </div>` : `
    <a href="login.html" class="sidebar-link">
      <span class="nav-icon" style="display:inline-flex; align-items:center; justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
      <span class="nav-label">Sign In</span>
    </a>`;

  sidebarEl.innerHTML = `
    <a class="sidebar-brand" href="${session?.loggedIn?(session.isAdmin?'admin_dashboard.html':'dashboard.html'):'index.html'}" style="display:flex; align-items:center; gap:10px; margin-bottom:28px;">
      <div class="sidebar-logo" style="width:32px; height:32px; border-radius:8px; background:linear-gradient(135deg,#6366f1,#14b8a6); display:grid; place-items:center; font-family:'Space Grotesk',sans-serif; font-weight:800; color:#fff; font-size:0.8rem;">CC</div>
      <div>
        <div class="sidebar-brand-name" style="font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:0.95rem; color:#fff; line-height:1.2;">ChainCampus</div>
        <div class="sidebar-brand-sub" style="font-size:0.65rem; color:var(--text-muted); font-weight:500;">${session?.isAdmin?'Administrative Portal':'Academic Hub'}</div>
      </div>
    </a>
    <nav class="sidebar-nav">
      <div class="sidebar-section-label" style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); font-weight:700; margin-bottom:12px;">Navigation</div>
      ${navLinksHtml}
    </nav>
    <div class="sidebar-footer" style="margin-top:auto; display:flex; flex-direction:column; gap:10px;">
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="theme-toggle" id="theme-toggle" title="Toggle theme" style="display:grid; place-items:center; width:32px; height:32px; border-radius:8px; border:1px solid var(--stroke); background:none; color:var(--text-soft); cursor:pointer;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </button>
        ${session?.loggedIn?`<button class="secondary-btn" id="logout-btn" style="flex:1;font-size:0.75rem;padding:6px 12px;font-weight:700; border-radius:8px;">Sign Out</button>`:''}
      </div>
      ${userHtml}
    </div>
  `;

  sidebarEl.querySelector('[data-copy-hud-addr]')?.addEventListener('click', ()=>{
    navigator.clipboard.writeText(vAddr);
    showToast('Copied','Wallet address copied to clipboard.','success');
  });

  const airdropBtnEl = sidebarEl.querySelector('#airdrop-hud-btn');
  if(airdropBtnEl) {
    airdropBtnEl.addEventListener('click', async()=>{
      airdropBtnEl.disabled=true; airdropBtnEl.textContent='\ud83c\udf00 ...';
      try {
        const {airdropSOLOnServer} = await import('./db.js');
        const res = await airdropSOLOnServer(1.0);
        if(res.ok) {
          updateState(s=>{if(s.student)s.student.virtualBalance=res.virtualBalance;return s;});
          const cs=getSession(); if(cs){cs.virtualBalance=res.virtualBalance;setSession(cs);}
          renderSidebar();
          showToast('Airdrop received!','1.00 SOL added to your virtual wallet.','success');
        }
      } catch(err){console.error('Airdrop failed:',err);}
      finally{if(airdropBtnEl){airdropBtnEl.disabled=false;airdropBtnEl.textContent='\u26a1 Airdrop +1 SOL';}}
    });
  }

  document.getElementById('logout-btn')?.addEventListener('click', async()=>{
    try{await logoutOnServer();}catch(e){}
    localStorage.removeItem("chainCampusVirtualAddress");
    localStorage.removeItem("chainCampusWalletType");
    clearSession(); updateState(s=>{s.walletAddress='';return s;});
    window.location.href='login.html';
  });

  document.getElementById('theme-toggle')?.addEventListener('click',(e)=>{
    e.currentTarget.style.transform='rotate(180deg) scale(0.9)';
    toggleTheme();
    setTimeout(()=>{const b=document.getElementById('theme-toggle');if(b)b.style.transform='';},350);
  });

  document.getElementById('hamburger-btn')?.addEventListener('click',()=>{
    sidebarEl.classList.toggle('open');
    document.querySelector('.sidebar-overlay')?.classList.toggle('visible');
  });
  document.querySelector('.sidebar-overlay')?.addEventListener('click',()=>{
    sidebarEl.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('visible');
  });
}


function renderFooter(){
  const footer = document.querySelector('[data-site-footer]');
  if(!footer) return;
  footer.innerHTML = `
    <div class="site-footer glass-card">
      <span>⛓️ ChainCampus — Decentralised Student Identity on Solana</span>
      <span>Built for presentation · Mock blockchain mode active</span>
    </div>`;
}

/* ─── STATUS PANEL ────────────────────────────────────────── */
export function renderStatusPanel(target, content, tone){
  const el = typeof target==='string' ? document.querySelector(target) : target;
  if(!el) return;
  el.innerHTML = `
    <div class="card-top">
      <strong>${content.title}</strong>
      <span class="status-badge ${tone}">${content.badge}</span>
    </div>
    <p>${content.message}</p>
    ${content.txId ? `<p class="small-copy tx-id">🔗 ${content.txId}</p>` : ''}`;
}

/* ─── DASHBOARD ───────────────────────────────────────────── */
export function renderDashboard(){
  const state = getState();
  const session = getSession();

  /* Welcome */
  const welcome = document.querySelector('[data-welcome]');
  if(welcome && session){
    welcome.innerHTML = `
      <span class="chain-tag">👋 Welcome back</span>
      <h1>${session.name || 'Student'}</h1>
      <p>${session.college || 'ChainCampus University'} · ${session.program || 'B.Tech'} · ${session.year || '3rd Year'}</p>`;
  }

  /* Stats */
  const statsEl = document.querySelector('[data-dashboard-stats]');
  if(statsEl){
    const enrolled = state.enrolledCourses?.length || 0;
    const total    = state.attendanceRecords?.length || 0;
    const verified = state.attendanceRecords?.filter(r=>r.status==='Verified').length || 0;
    const pct      = total ? Math.round(verified/total*100) : 0;
    const txCount  = state.txLog?.length || 0;
    const scholCount = state.scholarshipApplications?.length || 0;

    const vBal = typeof session?.virtualBalance === 'number' ? session.virtualBalance : (typeof state.student?.virtualBalance === 'number' ? state.student.virtualBalance : 5.00);

    statsEl.innerHTML = `
      <div class="metric-card stagger-item">
        <div class="metric-icon">📚</div>
        <div class="metric-label">Enrolled Courses</div>
        <div class="metric-value">${enrolled}</div>
      </div>
      <div class="metric-card stagger-item">
        <div class="metric-icon">✓</div>
        <div class="metric-label">Attendance Rate</div>
        <div class="metric-value">${pct}<span style="font-size:0.9rem">%</span></div>
      </div>
      <div class="metric-card stagger-item">
        <div class="metric-icon">🏆</div>
        <div class="metric-label">Scholarships</div>
        <div class="metric-value">${scholCount}</div>
      </div>
      <div class="metric-card stagger-item">
        <div class="metric-icon">⛓</div>
        <div class="metric-label">Blockchain Txns</div>
        <div class="metric-value">${txCount}</div>
      </div>
      <div class="metric-card stagger-item">
        <div class="metric-icon">💎</div>
        <div class="metric-label">Virtual Balance</div>
        <div class="metric-value" style="font-size:1.3rem;">${Number(vBal).toFixed(2)}<span style="font-size:0.75rem;opacity:0.7;"> SOL</span></div>
      </div>`;
  }

  /* Notices */
  const noticesEl = document.querySelector('[data-dashboard-notices]');
  if(noticesEl){
    const notices = state.notifications || [];
    noticesEl.innerHTML = notices.map(n => `
      <div class="notice-row info-row">
        <div><strong>${n.title}</strong><p class="small-copy">${n.body}</p></div>
        <span class="pill">${n.type}</span>
      </div>`).join('') || '<p class="small-copy">No notices.</p>';
  }

  /* TX Log */
  renderTxLog();
  renderScholarshipApplications();

  /* Last Transaction */
  const txBox = document.querySelector('[data-last-transaction]');
  if(txBox){
    const lt = state.lastTransaction;
    if(lt?.txId) {
      txBox.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div>
            <p class="eyebrow" style="margin-bottom:4px;">Last Transaction</p>
            <h3 style="font-size:1rem;font-weight:700;color:var(--text);">${lt.label}</h3>
          </div>
          <span class="status-badge ${lt.status==='Success'?'success':lt.status==='Failed'?'failed':'idle'}">${lt.status}</span>
        </div>
        <p class="small-copy tx-id" style="font-size:0.75rem;color:var(--text-muted);">🔗 ${lt.txId}</p>`;
    } else {
      txBox.style.display = 'none';
    }
  }
}

function renderTxLog(){
  const el = document.querySelector('[data-tx-log]');
  if(!el) return;
  const log = getState().txLog || [];
  if(!log.length){ el.innerHTML='<p class="small-copy" style="padding:16px;color:var(--text-muted);">No transactions yet. Perform a blockchain action to see logs here.</p>'; return; }
  el.innerHTML = log.map((t,i)=>`
    <div class="tx-row" style="animation-delay:${i*40}ms;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:7px;height:7px;border-radius:50%;background:${t.status==='success'?'#34d399':t.status==='failed'?'#f87171':'#fbbf24'};flex-shrink:0;"></div>
        <div>
          <strong style="font-size:0.83rem;color:var(--text);">${t.action}</strong>
          <p class="small-copy tx-id" style="font-size:0.7rem;">🔗 ${t.txId}</p>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <span class="status-badge ${t.status==='success'?'success':t.status==='failed'?'failed':'pending'}">${t.status}</span>
        <p class="small-copy" style="font-size:0.68rem;margin-top:2px;">${t.ts}</p>
      </div>
    </div>`).join('');
}

async function hydrateFromDatabase(){
  const snapshot = await loadDatabaseSnapshot();
  if(!snapshot) return;

  if(snapshot.chainCampusUsers){
    localStorage.setItem(USERS_KEY, JSON.stringify(snapshot.chainCampusUsers));
  }
  if(snapshot.chainCampusState){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergeState(snapshot.chainCampusState)));
  }
  // Session hydration has been commented out to keep sessions strictly isolated per client/browser.
  // if(snapshot.chainCampusSession){
  //   localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot.chainCampusSession));
  // }
}

function renderScholarshipApplications(){
  const el = document.querySelector('[data-scholarship-applications]');
  if(!el) return;

  const session = getSession();
  const applications = (getState().scholarshipApplications || [])
    .filter(app => !session?.studentId || app.studentId === session.studentId);

  if(!applications.length){
    el.innerHTML = '<p class="small-copy">No scholarship applications yet. Apply from the Scholarships page to see them here.</p>';
    return;
  }

  el.innerHTML = applications.map(app => `
    <div class="info-row">
      <div>
        <strong>${app.title}</strong>
        <p class="small-copy">${app.amount || ''} ${app.type ? '· ' + app.type : ''}</p>
        <p class="small-copy">Applied: ${app.appliedAt || 'Just now'}</p>
        ${app.txId ? `<p class="small-copy tx-id">🔗 ${app.txId}</p>` : ''}
      </div>
      <span class="status-badge ${app.status === 'Approved' ? 'success' : app.status === 'Rejected' ? 'failed' : 'pending'}">${app.status || 'Pending'}</span>
    </div>
  `).join('');
}

/* ─── PROFILE / ID CARD ───────────────────────────────────── */
export function renderProfile(){
  const session = getSession();
  const state   = getState();
  const cardEl  = document.querySelector('[data-id-card]');
  if(!cardEl || !session) return;

  const initials = getInitials(session.name);
  const wallet = state.student?.walletAddress || state.walletAddress || session?.walletAddress || 'Not Connected';
  const virtualBalance = typeof session?.virtualBalance === 'number' ? session.virtualBalance : (typeof state.student?.virtualBalance === 'number' ? state.student.virtualBalance : 5.00);
  const wShort   = wallet !== 'Not Connected' ? truncate(wallet,20) : wallet;
  const verified = wallet !== 'Not Connected';

  cardEl.innerHTML = `
    <div class="id-card-scene" id="student-flip-card">
      <div class="id-card-flipper">
        <!-- Front -->
        <div class="id-face id-front">
          <div class="id-top-row">
            <div class="id-chip"></div>
            <div class="id-brand">ChainCampus<span>Student Identity</span></div>
            <div class="id-nfc-icon">📶</div>
          </div>
          <div class="id-mid-row">
            <div class="id-card-number">${truncate(wallet,22)||'CCvW•••• •••• 4D2F'}</div>
          </div>
          <div class="id-bottom-row">
            <div class="id-name-block">
              <div class="id-label-xs">Cardholder</div>
              <div class="id-cardholder-name">${(session.name||'Student').toUpperCase()}</div>
            </div>
            <div class="id-verified-badge">${verified?'✓ Verified':'◎ Pending'}</div>
          </div>
        </div>
        <!-- Back -->
        <div class="id-face id-back">
          <div class="id-mag-strip"></div>
          <div class="id-back-content">
            <div class="id-back-row">
              <span class="id-back-key">STUDENT ID:</span>
              <span class="id-back-val">${session.studentId||'—'}</span>
            </div>
            <div class="id-back-row">
              <span class="id-back-key">PROGRAM:</span>
              <span class="id-back-val">${session.program||'—'}</span>
            </div>
            <div class="id-back-row">
              <span class="id-back-key">NETWORK:</span>
              <span class="id-back-val" style="color:#2dd4bf;">Solana Devnet</span>
            </div>
            <div class="id-back-row">
              <span class="id-back-key">BALANCE:</span>
              <span class="id-back-val" style="color:#34d399;font-weight:700;">${Number(virtualBalance).toFixed(3)} SOL</span>
            </div>
            <div class="id-back-row">
              <span class="id-back-key">STATUS:</span>
              <span class="id-back-val" style="color:#34d399;">${verified?'Active & Verified':'Pending Verification'}</span>
            </div>
          </div>
          <div class="id-back-footer">
            <span class="id-security-text">SECURITY CODE: ${session.studentId||'—'}•••</span>
            <span style="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:0.8rem;color:#fbbf24;">ChainCampus</span>
          </div>
        </div>
      </div>
    </div>`;



  // Attach flip click listener
  document.getElementById('student-flip-card')?.addEventListener('click', (e) => {
    const flipper = e.currentTarget.querySelector('.id-card-flipper');
    if(flipper) {
      flipper.classList.toggle('flipped');
      if(flipper.classList.contains('flipped')) {
        showToast('Credentials Revealed 🔐', 'Viewing secure on-chain parameters.', 'success');
      }
    }
  });

  /* On-chain details */
  const onChain = document.querySelector('[data-onchain-details]');
  if(onChain){
    const enrolled = state.enrolledCourses || [];
    const txCount  = state.txLog?.length || 0;
    onChain.innerHTML = `
      <div class="info-row"><span>Blockchain Network</span><strong style="color:#2dd4bf;">Solana Devnet</strong></div>
      <div class="info-row"><span>Wallet Address</span><strong class="mono small-copy" style="font-size:0.72rem;">${wShort}</strong></div>
      <div class="info-row"><span>Virtual Balance</span><strong style="color:#34d399;">${Number(virtualBalance).toFixed(3)} SOL</strong></div>
      <div class="info-row"><span>Courses On-Chain</span><strong>${enrolled.length}</strong></div>
      <div class="info-row"><span>Total Transactions</span><strong>${txCount}</strong></div>
      <div class="info-row"><span>Identity Status</span><strong>${verified?'<span class="status-badge success">Verified ✓</span>':'<span class="status-badge pending">Pending wallet link</span>'}</strong></div>`;
  }
}

/* ─── HOME SUMMARY ────────────────────────────────────────── */
function renderHomeSummary(){
  const el = document.querySelector('[data-home-summary]');
  if(!el) return;
    el.innerHTML = `
    <div class="info-row"><span>Blockchain Mode</span><strong>Mock (Devnet-ready)</strong></div>
    <div class="info-row"><span>Smart Contract Layer</span><strong>js/blockchain.js</strong></div>
    <div class="info-row"><span>Sandbox Wallet</span><strong>In-Browser (Solana)</strong></div>
    <div class="info-row"><span>Student Actions</span><strong>Register · Events · Attendance</strong></div>`;
}

/* ─── BIND GLOBAL ─────────────────────────────────────────── */
function bindGlobal(){
  document.querySelectorAll('[data-connect-wallet]').forEach(btn=>{
    btn.onclick = ()=>connectWallet();
  });
}

/* ─── INIT ────────────────────────────────────────────────── */
export function renderSharedElements(){
  renderHeader();
  renderFooter();
  updateWalletCopy();
  bindGlobal();
}

function populateDashboardStats() {
  const statsPanel = document.querySelector("[data-dashboard-stats]");
  const state = getState();
  
  if (statsPanel) {
    const eventCount = state.events ? state.events.length : 0;
    const attendanceCount = state.attendanceRecords ? state.attendanceRecords.length : 0;
    const scholarshipCount = state.scholarshipApplications ? state.scholarshipApplications.length : 0;

    statsPanel.innerHTML = `
      <div class="stat-card glass-card">
        <p>Total Registered Events</p>
        <h2>${eventCount}</h2>
      </div>
      <div class="stat-card glass-card">
        <p>Total Attendances</p>
        <h2>${attendanceCount}</h2>
      </div>
      <div class="stat-card glass-card">
        <p>Scholarship Applications</p>
        <h2>${scholarshipCount}</h2>
      </div>
    `;
  }

  const noticesPanel = document.querySelector("[data-dashboard-notices]");
  if (noticesPanel) {
    const list = state.notifications && state.notifications.length ? state.notifications : [
      {title: "Welcome to ChainCampus", desc: "Your blockchain portal is initialized."},
      {title: "Solana Connected", desc: "The platform is ready for on-chain transactions."}
    ];
    noticesPanel.innerHTML = list.map(n => `
      <div class="notice-item">
        <strong>${n.title}</strong>
        <p>${n.desc}</p>
      </div>
    `).join("");
  }
}

function populateHomeSummary() {
  const summaryPanel = document.querySelector("[data-home-summary]");
  if (!summaryPanel) return;
  const state = getState();
  
  summaryPanel.innerHTML = `
    <div class="summary-item notice-item">
      <span>Mock Web3 Status:</span>
      <strong>Active</strong>
    </div>
    <div class="summary-item notice-item">
      <span>Connected Wallet:</span>
      <strong>${state.walletAddress ? state.walletAddress.slice(0, 8) + '...' + state.walletAddress.slice(-8) : "None"}</strong>
    </div>
  `;
}

export function initTheme() {
  const saved = localStorage.getItem("chainCampusTheme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  document.body.className = `theme-${saved}`;
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  document.body.className = `theme-${next}`;
  localStorage.setItem("chainCampusTheme", next);
  showToast("Theme switched", `${next.charAt(0).toUpperCase() + next.slice(1)} mode active`, "success");
}

async function init() {
  initTheme();
  await hydrateFromDatabase();

  // Sync state.walletAddress from virtual session if needed
  const session = getSession();
  if (session && session.loggedIn) {
    const type = localStorage.getItem("chainCampusWalletType") || "virtual";
    if (type === "virtual") {
      const vAddr = session.walletAddress || (session.isAdmin ? 'CCvWAdmin' : localStorage.getItem("chainCampusVirtualAddress"));
      if (vAddr) {
        localStorage.setItem("chainCampusVirtualAddress", vAddr);
        localStorage.setItem("chainCampusWalletType", "virtual");
        updateState(s => { s.walletAddress = vAddr; return s; });
      }
    }
  }

  seedData();
  saveState(getState());
  if(!requireAuth()) return;
  renderSharedElements();
  
  populateDashboardStats();
  populateHomeSummary();
  renderDashboard();
  renderProfile();
}

initTheme();
init();
