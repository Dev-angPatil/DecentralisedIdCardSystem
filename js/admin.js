import { 
  getState, updateState, requireConnectedWallet, setButtonPending, setTransaction, showToast, addToTxLog 
} from "./main.js";
import { createCourseOnChain, createEventOnChain, reviewScholarshipApplicationOnChain } from "./blockchain.js";
import { 
  reviewScholarshipOnServer, createCourseOnServer, createEventOnServer, addTransactionOnServer, transferSOLOnServer
} from "./db.js";

/* ─── DASHBOARD ───────────────────────────────────────────── */
function renderAdminDashboard() {
  const statsEl = document.querySelector('[data-admin-stats]');
  if (!statsEl) return;

  const state = getState();
  const studentsCount = (JSON.parse(localStorage.getItem('chainCampusUsers') || '[]')).filter(u => !u.isAdmin).length;
  const coursesCount = (state.courses || []).length;
  const eventsCount = (state.events || []).length;
  const scholarshipApplicationsCount = (state.scholarshipApplications || []).length;
  const txCount = (state.txLog || []).length;

  statsEl.innerHTML = `
    <div class="metric-card"><span>Total Students</span><strong>${studentsCount}</strong></div>
    <div class="metric-card"><span>Active Courses</span><strong>${coursesCount}</strong></div>
    <div class="metric-card"><span>Total Events</span><strong>${eventsCount}</strong></div>
    <div class="metric-card"><span>Scholarship Apps</span><strong>${scholarshipApplicationsCount}</strong></div>
    <div class="metric-card"><span>Blockchain Txns</span><strong>${txCount}</strong></div>
  `;
}

function renderScholarshipReviewQueue() {
  const target = document.querySelector('[data-admin-scholarship-applications]');
  renderScholarshipStats();
  if (!target) return;

  const applications = getState().scholarshipApplications || [];
  if (!applications.length) {
    target.innerHTML = '<p class="small-copy">No scholarship applications submitted yet.</p>';
    return;
  }

  target.innerHTML = applications.map(app => {
    const reviewed = app.status === 'Approved' || app.status === 'Rejected';
    const badgeClass = app.status === 'Approved' ? 'success' : app.status === 'Rejected' ? 'failed' : 'pending';

    return `
      <div class="info-row" style="align-items:flex-start; gap:14px">
        <div>
          <strong>${app.title}</strong>
          <p class="small-copy">Student ID: ${app.studentId || 'Unknown'} · ${app.amount || ''} ${app.type ? '· ' + app.type : ''}</p>
          <p class="small-copy">Applied: ${app.appliedAt || 'Recently'}</p>
          ${app.reviewedAt ? `<p class="small-copy">Reviewed: ${app.reviewedAt}</p>` : ''}
          ${app.txId ? `<p class="small-copy tx-id">🔗 ${app.txId}</p>` : ''}
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end">
          <span class="status-badge ${badgeClass}">${app.status || 'Pending'}</span>
          <button type="button" class="secondary-btn" data-review-scholarship="${app.id}" data-review-status="Approved" ${reviewed ? 'disabled' : ''}>Approve</button>
          <button type="button" class="secondary-btn" data-review-scholarship="${app.id}" data-review-status="Rejected" ${reviewed ? 'disabled' : ''}>Reject</button>
        </div>
      </div>
    `;
  }).join('');

  bindScholarshipReviewButtons();
}

function bindScholarshipReviewButtons() {
  document.querySelectorAll('[data-review-scholarship]').forEach(btn => {
    btn.onclick = async () => {
      if (!(await requireConnectedWallet({ message: 'Connect admin wallet to review scholarship applications.' }))) return;

      const applicationId = btn.dataset.reviewScholarship;
      const nextStatus = btn.dataset.reviewStatus;
      const application = (getState().scholarshipApplications || []).find(app => app.id === applicationId);
      if (!application || application.status === 'Approved' || application.status === 'Rejected') return;

      setButtonPending(btn, true, 'Reviewing...', nextStatus);
      setTransaction('Pending', `${nextStatus} Scholarship: ${application.title}`, 'Submitting scholarship review transaction.', '');

      try {
        const result = await reviewScholarshipApplicationOnChain({
          applicationId,
          scholarshipId: application.scholarshipId,
          approved: nextStatus === 'Approved'
        });

        // 1. If approved, execute closed-loop SOL transfer from University Treasury
        if (nextStatus === 'Approved') {
          const amtStr = application.amount || "5.00";
          const amount = parseFloat(amtStr.replace(/[^0-9.]/g, '')) || 5.0;
          showToast('Triggering Payout', `Transferring ${amount} SOL to student wallet...`, 'pending');
          await transferSOLOnServer(application.studentId, amount, `Scholarship Payout: ${application.title}`);
        }

        // 2. Sync to relational backend review queue
        await reviewScholarshipOnServer({
          id: applicationId,
          status: nextStatus,
          reviewTxId: result.txId
        });

        await addTransactionOnServer({
          txId: result.txId,
          action: `${nextStatus} Scholarship: ${application.title}`,
          status: "success"
        });

        updateState(state => {
          state.scholarshipApplications = (state.scholarshipApplications || []).map(app =>
            app.id === applicationId
              ? { ...app, status: nextStatus, reviewTxId: result.txId, reviewedAt: new Date().toLocaleString() }
              : app
          );
          return state;
        });

        setTransaction('Success', `${nextStatus}: ${application.title}`, 'Scholarship application review completed.', result.txId);
        showToast(`Application ${nextStatus}`, result.txId, 'success');
        renderAdminDashboard();
        renderScholarshipReviewQueue();
      } catch (err) {
        setTransaction('Failed', 'Scholarship Review Failed', err.message || 'Could not review application.', '');
        showToast('Review failed', 'Check wallet and try again.', 'failed');
        setButtonPending(btn, false, 'Reviewing...', nextStatus);
      }
    };
  });
}

function renderScholarshipStats() {
  const applications = getState().scholarshipApplications || [];
  const totalEl = document.querySelector('[data-scholarship-total]');
  const pendingEl = document.querySelector('[data-scholarship-pending]');

  if (totalEl) totalEl.textContent = applications.length;
  if (pendingEl) {
    pendingEl.textContent = applications.filter(app => !app.status || app.status === 'Pending').length;
  }
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

      // Sync to relational backend
      await createCourseOnServer(payload);

      await addTransactionOnServer({
        txId: result.txId,
        action: `Create Course: ${payload.code}`,
        status: "success"
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

      // Sync to relational backend
      await createEventOnServer({
        ...payload,
        verified: true
      });

      await addTransactionOnServer({
        txId: result.txId,
        action: `Create Event: ${payload.title}`,
        status: "success"
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
renderScholarshipReviewQueue();
initCourseManagement();
initEventManagement();
