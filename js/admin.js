import { 
  getState, updateState, requireConnectedWallet, setButtonPending, setTransaction, showToast, addToTxLog 
} from "./main.js";
import { createCourseOnChain, createEventOnChain } from "./blockchain.js";

/* ─── DASHBOARD ───────────────────────────────────────────── */
function renderAdminDashboard() {
  const statsEl = document.querySelector('[data-admin-stats]');
  if (!statsEl) return;

  const state = getState();
  const studentsCount = (JSON.parse(localStorage.getItem('chainCampusUsers') || '[]')).filter(u => !u.isAdmin).length;
  const coursesCount = (state.courses || []).length;
  const eventsCount = (state.events || []).length;
  const txCount = (state.txLog || []).length;

  statsEl.innerHTML = `
    <div class="metric-card"><span>Total Students</span><strong>${studentsCount}</strong></div>
    <div class="metric-card"><span>Active Courses</span><strong>${coursesCount}</strong></div>
    <div class="metric-card"><span>Total Events</span><strong>${eventsCount}</strong></div>
    <div class="metric-card"><span>Blockchain Txns</span><strong>${txCount}</strong></div>
  `;
}

/* ─── COURSES ─────────────────────────────────────────────── */
function initCourseManagement() {
  const form = document.querySelector('[data-add-course-form]');
  if (!form) return;

  renderAdminCoursesList();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!(await requireConnectedWallet({ message: 'Connect admin wallet to create course on-chain.' }))) return;

    const btn = form.querySelector('[data-submit-btn]');
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.credits = parseInt(payload.credits);
    payload.days = payload.days.split(',').map(d => d.trim());
    payload.id = 'c' + Date.now();

    setButtonPending(btn, true, 'Deploying...', 'Create Course (On-Chain)');
    setTransaction('Pending', `Create Course: ${payload.code}`, 'Deploying course contract data...', '');

    try {
      const result = await createCourseOnChain({
        courseId: payload.id,
        name: payload.name,
        credits: payload.credits,
        instructor: payload.instructor
      });

      updateState(s => {
        s.courses = [payload, ...(s.courses || [])];
        return s;
      });

      setTransaction('Success', `Course ${payload.code} Deployed`, 'Course metadata stored on-chain.', result.txId);
      showToast('Course Created', result.txId, 'success');
      form.reset();
      renderAdminCoursesList();
      renderAdminDashboard();
    } catch (err) {
      setTransaction('Failed', 'Course Creation Failed', err.message, '');
      showToast('Error', err.message, 'failed');
    } finally {
      setButtonPending(btn, false, 'Deploying...', 'Create Course (On-Chain)');
    }
  });
}

function renderAdminCoursesList() {
  const target = document.querySelector('[data-courses-list]');
  if (!target) return;

  const state = getState();
  target.innerHTML = (state.courses || []).map(c => `
    <div class="info-row" style="background:var(--bg-alt); border-radius:var(--r-md); margin-bottom:8px">
      <div>
        <strong style="color:var(--brand-primary)">${c.code}</strong>: ${c.name}
        <p class="small-copy">${c.instructor} · ${c.credits} Credits</p>
      </div>
      <span class="pill">${c.room}</span>
    </div>
  `).join('') || '<p class="small-copy">No courses created yet.</p>';
}

/* ─── EVENTS ──────────────────────────────────────────────── */
function initEventManagement() {
  const form = document.querySelector('[data-add-event-form]');
  if (!form) return;

  renderAdminEventsList();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!(await requireConnectedWallet({ message: 'Connect admin wallet to deploy event.' }))) return;

    const btn = form.querySelector('[data-submit-btn]');
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.capacity = parseInt(payload.capacity);
    payload.id = 'e' + Date.now();

    setButtonPending(btn, true, 'Deploying...', 'Deploy Event (On-Chain)');
    setTransaction('Pending', `Create Event: ${payload.title}`, 'Deploying event contract...', '');

    try {
      // Mock timestamps for the contract
      const start = Math.floor(Date.now() / 1000);
      const end = start + 86400 * 7; 

      const result = await createEventOnChain({
        eventId: payload.id,
        title: payload.title,
        venue: payload.venue,
        capacity: payload.capacity,
        start_time: start,
        end_time: end
      });

      updateState(s => {
        s.events = [{ ...payload, verified: true }, ...(s.events || [])];
        return s;
      });

      setTransaction('Success', `Event ${payload.title} Live`, 'Event state initialized on Solana.', result.txId);
      showToast('Event Created', result.txId, 'success');
      form.reset();
      renderAdminEventsList();
      renderAdminDashboard();
    } catch (err) {
      setTransaction('Failed', 'Event Creation Failed', err.message, '');
      showToast('Error', err.message, 'failed');
    } finally {
      setButtonPending(btn, false, 'Deploying...', 'Deploy Event (On-Chain)');
    }
  });
}

function renderAdminEventsList() {
  const target = document.querySelector('[data-events-list]');
  if (!target) return;

  const state = getState();
  target.innerHTML = (state.events || []).map(e => `
    <div class="info-row" style="background:var(--bg-alt); border-radius:var(--r-md); margin-bottom:8px">
      <div>
        <strong>${e.title}</strong>
        <p class="small-copy">${e.date} · ${e.venue}</p>
      </div>
      <span class="status-badge success">${e.capacity} Spots</span>
    </div>
  `).join('') || '<p class="small-copy">No events created yet.</p>';
}

/* ─── INIT ────────────────────────────────────────────────── */
renderAdminDashboard();
initCourseManagement();
initEventManagement();
