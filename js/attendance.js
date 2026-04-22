import { markAttendanceOnChain } from "./blockchain.js";
import {
  getState, requireConnectedWallet, setButtonPending, setTransaction, showToast, updateState
} from "./main.js";



function renderAttendance() {
  const target = document.querySelector("[data-attendance-list]");
  if (!target) return;

  const state = getState();
  const records = state.attendanceRecords || [];
  const enrolledIds = state.enrolledCourses || [];
  const allCourses = state.courses || [];
  
  const enrolledCourses = allCourses.filter(c => enrolledIds.includes(c.id));

  if (enrolledCourses.length === 0) {
    target.innerHTML = '<p class="small-copy">No courses enrolled. Enroll in courses first to see attendance.</p>';
    return;
  }

  target.innerHTML = enrolledCourses.map(course => {
    const courseRecords = records.filter(r => r.courseId === course.id);
    const total = 30; // mock total classes
    const attended = courseRecords.length;
    const pct = Math.round((attended / total) * 100) || 0;
    
    return `
      <article class="attendance-card">
        <div class="card-top">
          <div>
            <span class="chain-tag">${course.code}</span>
            <h3>${course.name}</h3>
            <p>${attended} / ${total} classes attended</p>
          </div>
          <span class="status-badge ${pct >= 75 ? 'success' : 'pending'}">${pct}%</span>
        </div>
        <div style="margin-top:12px">
          <button type="button" class="primary-btn" data-mark-btn="${course.id}" style="width:100%">Mark Attendance (On-Chain)</button>
        </div>
      </article>
    `;
  }).join("");

  bindMarkButtons();
}

function bindMarkButtons() {
  document.querySelectorAll('[data-mark-btn]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!(await requireConnectedWallet({ message: "Connect your wallet before marking attendance." }))) return;

      const courseId = btn.dataset.markBtn;
      const state = getState();
      const course = (state.courses || []).find(c => c.id === courseId);
      
      setButtonPending(btn, true, "Verifying...", "Mark Attendance");
      setTransaction("Pending", `Attendance: ${course.code}`, "Student attendance transaction submitted.", "");

      try {
        const result = await markAttendanceOnChain({ courseId: course.id, mode: 'student' });
        updateState((state) => {
          state.attendanceRecords.unshift({
            id: "att_" + Date.now(),
            courseId: course.id,
            courseName: course.name,
            subject: "Daily Lecture",
            date: new Date().toLocaleDateString(),
            status: "Verified",
            verifier: "Smart Contract"
          });
          return state;
        });
        
        setTransaction("Success", `Attendance marked for ${course.code}`, "Attendance recorded through connected wallet.", result.txId);
        showToast("Attendance marked", result.txId, "success");
        renderAttendance();
      } catch (error) {
        setTransaction("Failed", "Attendance failed", "Could not complete attendance marking.", "");
        showToast("Attendance failed", "Check wallet and try again.", "failed");
        setButtonPending(btn, false, "Verifying...", "Mark Attendance");
      }
    });
  });
}

renderAttendance();
