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
  t.innerHTML = `<strong>${title}</strong><p>${message}</p>`;
  stack.prepend(t);
  setTimeout(()=>t.remove(), 3200);
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

/* ─── HEADER ──────────────────────────────────────────────── */
function renderHeader(){
  const header = document.querySelector('[data-site-header]');
  if(!header) return;
  const cur = document.body.dataset.page || '';
  const session = getSession();
  const state = getState();

  const navList = session?.isAdmin ? ADMIN_NAV_ITEMS : NAV_ITEMS;
  const navLinks = navList.map(([href,label,page]) =>
    `<a href="${href}" class="${page===cur?'active':''}">${label}</a>`
  ).join('');

  const themeToggleHtml = `
    <button class="theme-toggle-btn" id="theme-toggle" title="Toggle Theme" style="background:transparent; border:none; cursor:pointer; font-size:1.15rem; padding:6px; margin-right:5px; border-radius:50%; display:grid; place-items:center; transition:transform 0.4s var(--ease-spring); color:var(--text-on-teal-soft);">
      🌓
    </button>
  `;

  const isStudent = session && session.loggedIn && !session.isAdmin;
  const virtualAddress = state.student?.walletAddress || state.walletAddress || session?.walletAddress || 'CCvW...';
  const virtualBalance = typeof session?.virtualBalance === 'number' ? session.virtualBalance : (typeof state.student?.virtualBalance === 'number' ? state.student.virtualBalance : 5.00);

  const authArea = session && session.loggedIn ? `
    ${themeToggleHtml}
    <span class="user-chip" style="${session.isAdmin?'background:var(--warning)':''}">${getInitials(session.name)}</span>
    ${isStudent ? `
      <div class="virtual-wallet-hud glass-card" style="display:flex; align-items:center; gap:8px; padding:4px 8px; border-radius:12px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03);">
        <span class="wallet-addr-hud" data-copy-hud-addr="${virtualAddress}" style="cursor:pointer; font-family:monospace; font-size:0.8rem; color:var(--text-on-teal-soft); display:flex; align-items:center; gap:4px;" title="Click to copy Address">
          🟢 ${truncate(virtualAddress, 10)}
        </span>
        <span class="wallet-bal-hud" style="font-weight:600; font-size:0.85rem; color:#4ade80;">
          💎 ${Number(virtualBalance).toFixed(3)} SOL
        </span>
        <button class="airdrop-hud-btn" id="airdrop-hud-btn" style="border:none; background:rgba(74, 222, 128, 0.15); color:#4ade80; cursor:pointer; font-weight:bold; font-size:0.75rem; padding:4px 8px; border-radius:8px; transition:transform 0.15s var(--ease-spring), background 0.15s; display:flex; align-items:center; gap:2px;" title="Request free virtual airdrop">
          ⚡ +1 SOL
        </button>
      </div>
    ` : `
      <span class="wallet-chip">${state.walletAddress ? '🟢 '+truncate(state.walletAddress,12) : '⚪ No Wallet'}</span>
    `}
    <button class="secondary-btn" id="logout-btn" style="margin-left:5px;">Sign Out</button>
  ` : `
    ${themeToggleHtml}
    <a href="login.html" class="secondary-btn">Login</a>
  `;

  header.innerHTML = `
    <nav class="site-nav glass-card">
      <a class="brand" href="${session?.loggedIn ? (session.isAdmin ? 'admin_dashboard.html' : 'dashboard.html') : 'index.html'}">
        <div class="brand-mark">CC</div>
        <span class="brand-name">ChainCampus ${session?.isAdmin ? '<span style="color:var(--warning);font-size:0.8rem">ADMIN</span>' : ''}</span>
      </a>
      <div class="nav-links">${navLinks}</div>
      <div class="nav-actions">${authArea}</div>
    </nav>`;

  // Copy address listener
  const addrHud = header.querySelector('[data-copy-hud-addr]');
  if(addrHud) {
    addrHud.addEventListener('click', () => {
      const fullAddr = addrHud.dataset.copyHudAddr;
      navigator.clipboard.writeText(fullAddr);
      
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: rgba(74, 222, 128, 0.95);
        color: #0b1f15;
        font-weight: 600;
        font-size: 0.9rem;
        padding: 12px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        z-index: 99999;
        transform: translateY(100px);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s;
      `;
      toast.textContent = "📋 Address copied to clipboard!";
      document.body.appendChild(toast);
      
      requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
      });
      
      setTimeout(() => {
        toast.style.transform = 'translateY(-20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 2500);
    });
  }

  // Airdrop listener
  const airdropBtn = header.querySelector('#airdrop-hud-btn');
  if(airdropBtn) {
    airdropBtn.addEventListener('click', async () => {
      airdropBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { if(airdropBtn) airdropBtn.style.transform = 'none'; }, 150);
      
      airdropBtn.disabled = true;
      airdropBtn.innerHTML = `🌀 ...`;
      
      try {
        const { airdropSOLOnServer } = await import("./db.js");
        const res = await airdropSOLOnServer(1.0);
        if(res.ok) {
          updateState(s => {
            if(s.student) s.student.virtualBalance = res.virtualBalance;
            return s;
          });
          const currentSession = getSession();
          if(currentSession) {
            currentSession.virtualBalance = res.virtualBalance;
            setSession(currentSession);
          }
          
          renderHeader();
          
          // Re-render profile if active to sync card flip details
          if(typeof renderProfile === 'function') {
            try {
              renderProfile();
            } catch(e) {}
          }
          
          const toast = document.createElement('div');
          toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: rgba(15, 23, 42, 0.95);
            color: #4ade80;
            font-weight: 600;
            font-size: 0.9rem;
            padding: 12px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(74, 222, 128, 0.2);
            z-index: 99999;
            transform: translateY(100px);
            opacity: 0;
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s;
          `;
          toast.innerHTML = `💸 Received Airdrop of <span style="font-weight:800; text-decoration: underline;">1.00 SOL</span>!`;
          document.body.appendChild(toast);
          
          requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
          });
          
          setTimeout(() => {
            toast.style.transform = 'translateY(-20px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
          }, 3000);
        }
      } catch(err) {
        console.error("Airdrop failed:", err);
      } finally {
        if(airdropBtn) {
          airdropBtn.disabled = false;
          airdropBtn.innerHTML = `⚡ +1 SOL`;
        }
      }
    });
  }

  document.getElementById('logout-btn')?.addEventListener('click', async ()=>{
    try {
      await logoutOnServer();
    } catch(e) {
      console.warn("[main] Server logout failed:", e);
    }
    clearSession();
    updateState(s => { s.walletAddress=''; return s; });
    window.location.href = 'login.html';
  });

  document.getElementById('theme-toggle')?.addEventListener('click', (e)=>{
    const btn = e.currentTarget;
    btn.style.transform = 'rotate(180deg)';
    toggleTheme();
    setTimeout(() => { btn.style.transform = 'none'; }, 400);
  });
}

/* ─── FOOTER ──────────────────────────────────────────────── */
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
    const wallet   = state.walletAddress ? '🟢 Connected' : '⚪ Not Connected';

    statsEl.innerHTML = `
      <div class="metric-card"><span>Courses Enrolled</span><strong>${enrolled}</strong></div>
      <div class="metric-card"><span>Attendance Rate</span><strong>${pct}%</strong></div>
      <div class="metric-card"><span>Blockchain Txns</span><strong>${txCount}</strong></div>
      <div class="metric-card"><span>Wallet Status</span><strong style="font-size:1rem">${wallet}</strong></div>`;
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
    txBox.innerHTML = `
      <p class="eyebrow">Last Transaction</p>
      <div class="card-top">
        <strong>${lt.label}</strong>
        <span class="status-badge ${lt.status==='Success'?'success':lt.status==='Failed'?'failed':'idle'}">${lt.status}</span>
      </div>
      ${lt.txId ? `<p class="small-copy tx-id">🔗 ${lt.txId}</p>` : '<p class="small-copy">No transaction yet.</p>'}`;
  }
}

function renderTxLog(){
  const el = document.querySelector('[data-tx-log]');
  if(!el) return;
  const log = getState().txLog || [];
  if(!log.length){ el.innerHTML='<p class="small-copy">No transactions yet. Perform a blockchain action to see logs here.</p>'; return; }
  el.innerHTML = log.map(t=>`
    <div class="tx-row">
      <div>
        <strong class="small-copy">${t.action}</strong>
        <p class="small-copy tx-id">🔗 ${t.txId}</p>
      </div>
      <div style="text-align:right">
        <span class="status-badge ${t.status==='success'?'success':t.status==='failed'?'failed':'pending'}">${t.status}</span>
        <p class="small-copy">${t.ts}</p>
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
  if(snapshot.chainCampusSession){
    localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot.chainCampusSession));
  }
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
    <div class="flip-card-container" id="student-flip-card">
      <div class="flip-card-inner">
        <!-- Front Side -->
        <div class="id-card flip-card-front">
          <div class="id-card-header">
            <div class="id-avatar">${initials}</div>
            <div>
              <p class="eyebrow">Student Identity Card</p>
              <h2 class="id-name">${session.name || '—'}</h2>
              <span class="id-badge ${verified?'success':'pending'}">${verified?'⛓ Blockchain Verified':'⚠ Wallet Not Linked'}</span>
            </div>
            <div class="id-logo">CC</div>
          </div>
          <div class="id-body">
            <div class="id-field"><span>Student ID</span><strong>${session.studentId || '—'}</strong></div>
            <div class="id-field"><span>College</span><strong>${session.college || '—'}</strong></div>
            <div class="id-field"><span>Program</span><strong>${session.program || '—'}</strong></div>
            <div class="id-field"><span>Year</span><strong>${session.year || '—'}</strong></div>
            <div class="id-field wide"><span>Wallet Address</span><strong class="mono">${wShort}</strong></div>
          </div>
          <div class="id-footer">
            <span class="small-copy">🔒 ChainCampus · Click to Flip Card</span>
            <div class="qr-placeholder">QR</div>
          </div>
        </div>

        <!-- Back Side -->
        <div class="flip-card-back">
          <div class="card-magnetic-strip"></div>
          <div class="chip-placeholder"></div>
          
          <div style="margin-top: 50px; text-align: left; padding: 0 10px;">
            <p class="eyebrow" style="color:var(--amber); letter-spacing: 0.1em; font-size: 0.65rem;">On-Chain Cryptographic Proof</p>
            <h3 style="font-size: 1rem; font-weight: 700; margin: 4px 0 10px; color:#fff;">Solana Academic Record</h3>
            
            <div style="font-family:'JetBrains Mono', monospace; font-size:0.7rem; display:grid; gap:6px; opacity:0.85; color:#e2e8f0;">
              <div><span style="opacity:0.6">PROGRAM: </span>${truncate('Fg6Pa4H2X4CWdU3EajNf8C8ViPyMskGuFA6shVe6icMd', 22)}</div>
              <div><span style="opacity:0.6">OWNER PDA: </span>${truncate(wallet, 22)}</div>
              <div><span style="opacity:0.6">STUDENT SEED: </span>${session.studentId || '—'}</div>
              <div><span style="opacity:0.6">VIRTUAL BALANCE: </span><span style="color:#4ade80; font-weight:bold;">💎 ${Number(virtualBalance).toFixed(3)} SOL</span></div>
              <div><span style="opacity:0.6">SYSTEM STATUS: </span>Verified & Signed</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px; color:#fff;">
            <span style="font-size: 0.62rem; font-family: 'JetBrains Mono', monospace; opacity: 0.7;">SECURITY VERIFIED ✓</span>
            <span style="font-size: 0.75rem; font-family: 'Syne', sans-serif; font-weight: 800; color:var(--amber)">ChainCampus</span>
          </div>
        </div>
      </div>
    </div>`;

  // Attach flip click listener
  document.getElementById('student-flip-card')?.addEventListener('click', (e) => {
    const inner = e.currentTarget.querySelector('.flip-card-inner');
    inner?.classList.toggle('is-flipped');
    showToast('Identity Verified 🔐', 'Viewing secure smart contract parameters.', 'success');
  });

  /* On-chain details */
  const onChain = document.querySelector('[data-onchain-details]');
  if(onChain){
    const enrolled = state.enrolledCourses || [];
    const txCount  = state.txLog?.length || 0;
    onChain.innerHTML = `
      <div class="info-row"><span>Blockchain Network</span><strong>Solana Devnet</strong></div>
      <div class="info-row"><span>Wallet Address</span><strong class="mono small-copy">${wShort}</strong></div>
      <div class="info-row"><span>Courses On-Chain</span><strong>${enrolled.length}</strong></div>
      <div class="info-row"><span>Total Transactions</span><strong>${txCount}</strong></div>
      <div class="info-row"><span>Identity Status</span><strong>${verified?'Verified ✓':'Pending wallet link'}</strong></div>`;
  }
}

/* ─── HOME SUMMARY ────────────────────────────────────────── */
function renderHomeSummary(){
  const el = document.querySelector('[data-home-summary]');
  if(!el) return;
  el.innerHTML = `
    <div class="info-row"><span>Blockchain Mode</span><strong>Mock (Devnet-ready)</strong></div>
    <div class="info-row"><span>Smart Contract Layer</span><strong>js/blockchain.js</strong></div>
    <div class="info-row"><span>Wallet Integration</span><strong>Phantom (Solana)</strong></div>
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
    const eventCount = state.events ? state.events.length : 12;
    const attendanceCount = state.attendanceRecords ? state.attendanceRecords.length : 3;

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
        <p>Wallet Status</p>
        <h2>${state.walletAddress ? 'Active' : 'Missing'}</h2>
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
  const saved = localStorage.getItem("chainCampusTheme") || "light";
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
  seedData();
  saveState(getState());
  if(!requireAuth()) return;
  renderSharedElements();
  
  populateDashboardStats();
  populateHomeSummary();
  renderDashboard();
  renderProfile();

  if (window.solana && window.solana.isPhantom) {
    try {
      const res = await window.solana.connect({ onlyIfTrusted: true });
      updateState((state) => {
        state.walletAddress = res.publicKey.toString();
        return state;
      });
      renderSharedElements();
      populateDashboardStats();
      populateHomeSummary();
    } catch(err) {
      // Not yet authorized
    }
  }
}

initTheme();
init();
