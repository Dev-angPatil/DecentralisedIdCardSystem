import { enrollCourseOnChain } from "./blockchain.js";
import {
  getState, requireConnectedWallet, setButtonPending, setTransaction, showToast, updateState, SAMPLE_COURSES
} from "./main.js";

function renderCourses() {
  const target = document.querySelector('[data-courses-list]');
  if (!target) return;

  const state = getState();
  const enrolledIds = state.enrolledCourses || [];

  target.innerHTML = SAMPLE_COURSES.map(course => {
    const isEnrolled = enrolledIds.includes(course.id);
    
    return `
      <div class="course-card">
        <div class="course-head">
          <span class="course-code">${course.code}</span>
          ${isEnrolled ? '<span class="status-badge success">Enrolled</span>' : ''}
        </div>
        <h3 class="course-title">${course.name}</h3>
        <div class="course-meta">
          <span>👨‍🏫 ${course.instructor}</span>
          <span>📅 ${course.days.join(', ')} @ ${course.time}</span>
          <span>📍 ${course.room}</span>
          <span>📚 ${course.credits} Credits</span>
        </div>
        <div style="margin-top:auto; padding-top:10px">
          <button type="button" class="${isEnrolled ? 'secondary-btn' : 'primary-btn'}" style="width:100%" data-enroll-btn="${course.id}" ${isEnrolled ? 'disabled' : ''}>
            ${isEnrolled ? 'Enrolled ✓' : 'Enroll (On-Chain)'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  bindEnrollButtons();
}

function bindEnrollButtons() {
  document.querySelectorAll('[data-enroll-btn]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!(await requireConnectedWallet({ message: 'Connect wallet to enroll in courses.' }))) return;

      const courseId = btn.dataset.enrollBtn;
      const course = SAMPLE_COURSES.find(c => c.id === courseId);
      if (!course) return;

      setButtonPending(btn, true, 'Processing...', 'Enroll (On-Chain)');
      setTransaction('Pending', `Enrollment: ${course.code}`, 'Transaction submitted for course enrollment.', '');

      try {
        const result = await enrollCourseOnChain({ courseId: course.id });
        
        updateState(s => {
          if (!s.enrolledCourses) s.enrolledCourses = [];
          if (!s.enrolledCourses.includes(courseId)) {
            s.enrolledCourses.push(courseId);
          }
          return s;
        });

        setTransaction('Success', `Enrolled in ${course.code}`, 'Course enrollment logged on-chain.', result.txId);
        showToast('Enrollment Verified', result.txId, 'success');
        renderCourses();
      } catch (e) {
        setTransaction('Failed', `Enrollment failed`, 'Could not complete course enrollment.', '');
        showToast('Enrollment failed', 'Check wallet and try again.', 'failed');
        setButtonPending(btn, false, 'Processing...', 'Enroll (On-Chain)');
      }
    });
  });
}

renderCourses();
