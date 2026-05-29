import { markAttendanceOnChain } from "./blockchain.js";
import {
  getState, requireConnectedWallet, setButtonPending, setTransaction, showToast, updateState
} from "./main.js";
import { markAttendanceOnServer, addTransactionOnServer } from "./db.js";
import { NfcManager } from "./nfc.js";



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
        <div style="margin-top:12px; display:flex; flex-direction:column; gap:8px;">
          <button type="button" class="primary-btn" data-mark-btn="${course.id}" style="width:100%">Mark Attendance (On-Chain)</button>
          <button type="button" class="btn btn-secondary" data-nfc-mark-btn="${course.id}" style="width:100%; display:flex; justify-content:center; align-items:center; gap:6px;">📶 Tap NFC Card Check-In</button>
        </div>
      </article>
    `;
  }).join("");

  bindMarkButtons();
  bindNfcMarkButtons();
  renderAttendanceHistory();
}

function renderAttendanceHistory() {
  const target = document.querySelector('[data-attendance-history-list]');
  if (!target) return;

  const state = getState();
  const records = state.attendanceRecords || [];

  if (records.length === 0) {
    target.innerHTML = '<p class="small-copy">No attendance logs registered yet.</p>';
    return;
  }

  target.innerHTML = records.map(r => `
    <div class="info-row" style="padding: 12px 0;">
      <div>
        <strong style="color:var(--text); font-size:0.875rem;">${r.courseName}</strong>
        <p class="small-copy" style="margin-top:2px;">${r.subject} · Signed by ${r.verifier}</p>
        <p class="small-copy" style="font-size: 0.7rem; color: var(--text-muted); margin-top:2px;">${r.date}</p>
      </div>
      <span class="status-badge success" style="font-size:0.7rem;">${r.status}</span>
    </div>
  `).join('');
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
        const recordId = "att_" + Date.now();
        const dateStr = new Date().toLocaleDateString();

        // Sync to relational backend
        await markAttendanceOnServer({
          id: recordId,
          courseId: course.id,
          courseName: course.name,
          subject: "Daily Lecture",
          date: dateStr,
          status: "Verified",
          verifier: "Smart Contract"
        });

        await addTransactionOnServer({
          txId: result.txId,
          action: `Attendance: ${course.code}`,
          status: "success"
        });

        updateState((state) => {
          state.attendanceRecords.unshift({
            id: recordId,
            courseId: course.id,
            courseName: course.name,
            subject: "Daily Lecture",
            date: dateStr,
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

function bindNfcMarkButtons() {
  document.querySelectorAll('[data-nfc-mark-btn]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const courseId = btn.dataset.nfcMarkBtn;
      const state = getState();
      const course = (state.courses || []).find(c => c.id === courseId);

      setButtonPending(btn, true, "Scanning...", "Tap NFC Card Check-In");

      NfcManager.startScan(
        async (cardData) => {
          const session = JSON.parse(localStorage.getItem('chainCampusSession') || '{}');
          if (cardData.email !== session.email) {
            setButtonPending(btn, false, false, "Tap NFC Card Check-In");
            showToast("Verification Failed", "This NFC card does not match your active session.", "failed");
            return;
          }

          try {
            const result = await markAttendanceOnChain({ courseId: course.id, mode: 'nfc-tag' });
            const recordId = "att_nfc_" + Date.now();
            const dateStr = new Date().toLocaleDateString();

            await markAttendanceOnServer({
              id: recordId,
              courseId: course.id,
              courseName: course.name,
              subject: "NFC Checked-In",
              date: dateStr,
              status: "Verified",
              verifier: "NFC Secure Hardware"
            });

            await addTransactionOnServer({
              txId: result.txId,
              action: `NFC Attendance Check-in: ${course.code}`,
              status: "success"
            });

            updateState((state) => {
              state.attendanceRecords.unshift({
                id: recordId,
                courseId: course.id,
                courseName: course.name,
                subject: "NFC Checked-In",
                date: dateStr,
                status: "Verified",
                verifier: "NFC Secure Hardware"
              });
              return state;
            });

            setTransaction("Success", `NFC Attendance marked for ${course.code}`, "Attendance verified via physical NFC card.", result.txId);
            showToast("NFC Checked In ✓", `Successfully logged present via NFC tag!`, "success");
            renderAttendance();
          } catch(err) {
            showToast("Check-In Error", err.message || "Failed to submit attendance.", "failed");
            setButtonPending(btn, false, false, "Tap NFC Card Check-In");
          }
        },
        (err) => {
          setButtonPending(btn, false, false, "Tap NFC Card Check-In");
          showToast("NFC Read Error", err.message || "Could not read tag.", "failed");
        }
      );
    });
  });
}

renderAttendance();
