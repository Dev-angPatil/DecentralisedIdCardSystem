
import { enrollCourseOnChain } from "./blockchain.js";
import {
  getState,
  requireConnectedWallet,
  setButtonPending,
  setTransaction,
  showToast,
  updateState
} from "./main.js";

/* --------------------------
   CORE RENDER FUNCTION
--------------------------- */
function renderCourses(list = null) {
  const target = document.querySelector('[data-courses-list]');
  if (!target) return;

  const state = getState();
  const courses = list || state.courses || [];
  const enrolledIds = state.enrolledCourses || [];

  target.innerHTML = courses.map(course => {
    const isEnrolled = enrolledIds.includes(course.id);
    const isPending = state.pendingCourses?.includes(course.id);
    const txId = state.transactions?.[course.id];

    return createCourseHTML(course, isEnrolled, isPending, txId);
  }).join('');

  bindEnrollButtons();
  bindExpandCards();
}

/* --------------------------
   COURSE CARD COMPONENT

--------------------------- */
function getCourseProgress(courseId, state) {
  const records = (state.attendanceRecords || []).filter(
    r => r.courseId === courseId
  );

  if (!records.length) return 0;

  const completed = records.filter(
    r => r.status === 'Verified' || r.status === 'Present'
  ).length;

  return Math.round((completed / records.length) * 100);
}

function createCourseHTML(course, isEnrolled, isPending, txId) {const state = getState();
const progress = getCourseProgress(course.id, state);

  const seatsLeft = course.seats - course.enrolled;

  return `
    <div class="course-card" data-expand="${course.id}">
      <div class="course-head">
        <span class="course-code">${course.code}</span>
        ${isEnrolled ? '<span class="status-badge success">Enrolled</span>' : ''}
      </div>

      <h3 class="course-title">${course.name}</h3>
  
      <div class="course-meta">

  <div class="meta-row">
    <span>👨‍🏫 ${course.instructor}</span>
    <span>📚 ${course.credits} Credits</span>
  </div>

  <div class="meta-row">
    <span>📅 ${course.days.join(', ')}</span>
    <span>⏰ ${course.time}</span>
  </div>

  <div class="meta-row">
    <span>📍 ${course.room}</span>
    <span class="${seatsLeft < 10 ? 'text-danger' : ''}">
      🪑 ${seatsLeft} seats left
    </span>
  </div>

</div>
<div class="progress-container">
  <div class="progress-bar">
    <div class="progress-fill ${progress < 40 ? 'low' : progress < 75 ? 'medium' : 'high'}" style="width:${progress}%"></div>
  </div>
  <span class="progress-text">${progress}% completed</span>
</div>

      ${txId ? `<div class="chain-meta">Tx: ${txId.slice(0, 12)}...</div>` : ''}

      <div class="course-extra">
        <p><strong>Syllabus:</strong></p>
<ul>
  ${
    course.syllabus
      ? course.syllabus.map(item => `<li>${item}</li>`).join('')
      : '<li>N/A</li>'
  }
</ul>
        <p><strong>Prerequisites:</strong> ${course.prereq || 'None'}</p>
      </div>

      <div style="margin-top:auto; padding-top:10px">
        <button 
          type="button"
          class="${isEnrolled ? 'secondary-btn' : 'primary-btn'}"
          style="width:100%"
          data-enroll-btn="${course.id}"
          ${isEnrolled || isPending ? 'disabled' : ''}
        >
          ${
            isPending
              ? 'Processing...'
              : isEnrolled
              ? 'Enrolled ✓'
              : 'Enroll (On-Chain)'
          }
        </button>
      </div>
    </div>
  `;
}

/* --------------------------
   ENROLL BUTTON LOGIC
--------------------------- */
function bindEnrollButtons() {
  document.querySelectorAll('[data-enroll-btn]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const state = getState();
      const courseId = btn.dataset.enrollBtn;
      const course = (state.courses || []).find(c => c.id === courseId);

      if (!course) return;

      /* ---- VALIDATIONS ---- */

      // Already enrolled
      if (state.enrolledCourses?.includes(courseId)) {
        showToast('Already enrolled', course.code, 'info');
        return;
      }

      // Credit limit
      if ((state.totalCredits || 0) + course.credits > state.maxCredits) {
        showToast(
          'Credit limit exceeded',
          `${state.totalCredits}/${state.maxCredits}`,
          'failed'
        );
        return;
      }

      // Schedule conflict
      const enrolledCourses = (state.courses || []).filter(c =>
        state.enrolledCourses?.includes(c.id)
      );

      const conflict = enrolledCourses.find(c =>
        c.time === course.time &&
        c.days.some(day => course.days.includes(day))
      );

      if (conflict) {
        showToast(
          'Schedule conflict',
          `${course.code} clashes with ${conflict.code}`,
          'failed'
        );
        return;
      }

      // Wallet check
      if (!(await requireConnectedWallet({
        message: 'Connect wallet to enroll in courses.'
      }))) return;

      /* ---- PENDING STATE ---- */
      updateState(s => {
        if (!s.pendingCourses) s.pendingCourses = [];
        s.pendingCourses.push(courseId);
        return s;
      });

      setButtonPending(btn, true, 'Processing...', 'Enroll (On-Chain)');
      setTransaction(
        'Pending',
        `Enrollment: ${course.code}`,
        'Transaction submitted for course enrollment.',
        ''
      );

      try {
        /* ---- BLOCKCHAIN CALL ---- */
        const result = await enrollCourseOnChain({ courseId });

        /* ---- UPDATE STATE ---- */
        updateState(s => {
          if (!s.enrolledCourses) s.enrolledCourses = [];
          if (!s.transactions) s.transactions = {};
          if (!s.pendingCourses) s.pendingCourses = [];

          if (!s.enrolledCourses.includes(courseId)) {
            s.enrolledCourses.push(courseId);
            s.totalCredits = (s.totalCredits || 0) + course.credits;
          }

          s.transactions[courseId] = result.txId;
          s.pendingCourses = s.pendingCourses.filter(id => id !== courseId);

          return s;
        });

        /* ---- UI FEEDBACK ---- */
        setTransaction(
          'Success',
          `Enrolled in ${course.code}`,
          'Course enrollment logged on-chain.',
          result.txId
        );

        showToast('Enrollment Verified', result.txId, 'success');

        renderCourses();

      } catch (e) {
        console.error(e);

        updateState(s => {
          s.pendingCourses = (s.pendingCourses || []).filter(id => id !== courseId);
          return s;
        });

        setTransaction(
          'Failed',
          `Enrollment failed`,
          e?.message || 'Blockchain transaction failed',
          ''
        );

        showToast('Enrollment failed', 'Check wallet and try again.', 'failed');

        setButtonPending(btn, false, 'Processing...', 'Enroll (On-Chain)');
      }
    });
  });
}

/* --------------------------
   EXPAND CARD FEATURE
--------------------------- */
function bindExpandCards() {
  document.querySelectorAll('[data-expand]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      card.classList.toggle('expanded');
    });
  });
}

/* --------------------------
   SEARCH FEATURE
--------------------------- */
function setupSearch() {
  const input = document.getElementById('course-search');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase();
    const state = getState();

    const filtered = (state.courses || []).filter(c =>
      c.name.toLowerCase().includes(value) ||
      c.code.toLowerCase().includes(value)
    );

    renderCourses(filtered);
  });
}

/* --------------------------
   INIT
--------------------------- */
setupSearch();
renderCourses();