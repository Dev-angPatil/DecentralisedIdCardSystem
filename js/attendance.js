import { markAttendanceOnChain } from "./blockchain.js";
import {
  getState,
  setButtonPending,
  setTransaction,
  showToast,
  updateState
} from "./main.js";

function renderAttendance() {
  const target = document.querySelector("[data-attendance-list]");
  if (!target) {
    return;
  }

  const state = getState();
  target.innerHTML = state.attendanceRecords
    .map(
      (record) => `
        <article class="attendance-card">
          <div class="card-top">
            <div>
              <span class="chain-tag">Attendance Record</span>
              <h3>${record.subject}</h3>
              <p>${record.date}</p>
            </div>
            <span class="status-badge ${record.status === "Verified" ? "success" : "pending"}">${record.status}</span>
          </div>
          <p class="small-copy">Verifier: ${record.verifier}</p>
        </article>
      `
    )
    .join("");
}

function initAttendanceActions() {
  const markButton = document.querySelector("[data-mark-attendance]");
  const verifyButton = document.querySelector("[data-verify-attendance]");
  if (!markButton || !verifyButton) {
    return;
  }

  markButton.addEventListener("click", async () => {
    setButtonPending(
      markButton,
      true,
      "Transaction Pending...",
      "Mark Attendance (On-Chain)"
    );
    setTransaction(
      "Pending",
      "Attendance marking",
      "Student attendance transaction submitted.",
      ""
    );

    try {
      const result = await markAttendanceOnChain({ mode: "student" });
      updateState((state) => {
        state.attendanceRecords.unshift({
          id: "att_" + Date.now(),
          subject: "Realtime Attendance Checkpoint",
          date: "Today",
          status: "Present",
          verifier: "Student self-marked"
        });
        return state;
      });
      setTransaction(
        "Success",
        "Attendance marked",
        "Attendance recorded through the mock blockchain layer.",
        result.txId
      );
      showToast("Attendance marked", result.txId, "success");
      renderAttendance();
    } catch (error) {
      setTransaction(
        "Failed",
        "Attendance marking failed",
        "The mock attendance transaction was not completed.",
        ""
      );
      showToast("Attendance failed", "Try the mock action again.", "failed");
    } finally {
      setButtonPending(
        markButton,
        false,
        "Transaction Pending...",
        "Mark Attendance (On-Chain)"
      );
    }
  });

  verifyButton.addEventListener("click", async () => {
    setButtonPending(
      verifyButton,
      true,
      "Transaction Pending...",
      "Verify Attendance (Blockchain)"
    );
    setTransaction(
      "Pending",
      "Attendance verification",
      "Admin verification transaction submitted.",
      ""
    );

    try {
      const result = await markAttendanceOnChain({ mode: "admin-verify" });
      updateState((state) => {
        if (state.attendanceRecords.length > 0) {
          state.attendanceRecords[0].status = "Verified";
          state.attendanceRecords[0].verifier = "Admin Node 09";
        }
        return state;
      });
      setTransaction(
        "Success",
        "Attendance verified",
        "Attendance verified through the mock blockchain layer.",
        result.txId
      );
      showToast("Attendance verified", result.txId, "success");
      renderAttendance();
    } catch (error) {
      setTransaction(
        "Failed",
        "Attendance verification failed",
        "The admin blockchain placeholder could not verify attendance.",
        ""
      );
      showToast("Verification failed", "Try the mock admin action again.", "failed");
    } finally {
      setButtonPending(
        verifyButton,
        false,
        "Transaction Pending...",
        "Verify Attendance (Blockchain)"
      );
    }
  });
}

renderAttendance();
initAttendanceActions();
