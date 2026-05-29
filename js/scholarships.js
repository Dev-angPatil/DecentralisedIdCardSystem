import { applyScholarshipOnChain } from "./blockchain.js";
import {
  getSession,
  getState,
  requireConnectedWallet,
  setTransaction,
  showToast,
  updateState,
  setButtonPending
} from "./main.js";
import { applyScholarshipOnServer } from "./db.js";

const SCHOLARSHIP_CATALOG = {
  merit: {
    title: "Prime Merit Scholarship",
    amount: "Rs. 50,000",
    type: "Merit-Based"
  },
  need: {
    title: "Student Welfare Fund",
    amount: "Rs. 25,000",
    type: "Need-Based"
  },
  tech: {
    title: "CodeCraft Scholarship",
    amount: "Rs. 75,000 + Internship",
    type: "Tech Excellence"
  },
  sports: {
    title: "Athlete Excellence Award",
    amount: "Rs. 30,000 + Gear Support",
    type: "Sports Achievement"
  },
  women: {
    title: "STEM Sisters Scholarship",
    amount: "Rs. 60,000",
    type: "Women Empowerment"
  },
  rural: {
    title: "Village Scholar Program",
    amount: "Rs. 40,000 + Mentorship",
    type: "Rural Excellence"
  }
};

function getApplications() {
  return getState().scholarshipApplications || [];
}

function isAlreadyApplied(scholarshipId) {
  const session = getSession();
  return getApplications().some(
    (application) =>
      application.scholarshipId === scholarshipId &&
      application.studentId === session?.studentId
  );
}

function updateApplyButtons() {
  document.querySelectorAll("[data-apply-scholarship]").forEach((button) => {
    const applied = isAlreadyApplied(button.dataset.applyScholarship);
    button.disabled = applied;
    button.textContent = applied ? "Application Submitted" : "Apply On-Chain";
  });
}

window.applyScholarship = function applyScholarship(scholarshipId) {
  const scholarship = SCHOLARSHIP_CATALOG[scholarshipId] || SCHOLARSHIP_CATALOG.merit;
  const session = getSession();

  if (!session) {
    showToast("Login required", "Sign in before applying for scholarships.", "failed");
    window.location.href = "login.html";
    return;
  }

  if (isAlreadyApplied(scholarshipId)) {
    showToast("Already applied", `${scholarship.title} is already in your applications.`, "pending");
    return;
  }

  const container = document.getElementById('scholarship-content');
  if (!container) return;

  // Render a beautiful interactive application form inside details panel
  container.innerHTML = `
    <div class="card card-p" style="margin-bottom:16px; border-radius:var(--r-md); background:rgba(255,255,255,0.01); border:1px solid var(--stroke-soft);">
      <h3 style="font-size:0.95rem; font-weight:700; margin-bottom:8px; color:var(--text);">Apply for ${scholarship.title}</h3>
      <p class="small-copy" style="margin-bottom:16px; color:var(--text-soft);">Please provide your current academic and financial details. Applications will be cryptographically signed and stored in the ledger.</p>
      
      <form id="scholarship-apply-form" style="display:flex; flex-direction:column; gap:14px;">
        <div class="form-group" style="margin-bottom:0;">
          <label>Cumulative GPA (CGPA)</label>
          <input type="number" step="0.01" min="0" max="10" name="cgpa" placeholder="e.g. 9.15" required style="width:100%; border:1px solid var(--stroke); padding:10px; border-radius:6px; background:rgba(0,0,0,0.3); color:#fff;" />
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label>Annual Family Income (INR)</label>
          <input type="number" name="income" placeholder="e.g. 450000" required style="width:100%; border:1px solid var(--stroke); padding:10px; border-radius:6px; background:rgba(0,0,0,0.3); color:#fff;" />
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label>Statement of Purpose (SOP)</label>
          <textarea name="sop" placeholder="State why you are qualified for this scholarship support..." required style="width:100%; min-height:100px; font-family:inherit; font-size:0.85rem; padding:10px; border-radius:6px; background:rgba(0,0,0,0.3); border:1px solid var(--stroke); color:#fff; resize:vertical;"></textarea>
        </div>
        <div style="display:flex; gap:12px; margin-top:8px;">
          <button type="submit" class="btn btn-primary" id="btn-submit-application">Submit On-Chain Application →</button>
          <button type="button" class="btn btn-ghost" onclick="showScholarshipDetail('${scholarshipId}')">Cancel</button>
        </div>
      </form>
    </div>
  `;

  // Bind submit event handler
  const form = document.getElementById('scholarship-apply-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!(await requireConnectedWallet({
      message: "Connect your wallet before applying for scholarships."
    }))) {
      return;
    }

    const submitBtn = document.getElementById('btn-submit-application');
    const cgpa = form.cgpa.value.trim();
    const income = form.income.value.trim();
    const sop = form.sop.value.trim();

    setButtonPending(submitBtn, true, 'Submitting Application...', 'Submit On-Chain Application →');

    const statement = `${session.name || "Student"} (CGPA: ${cgpa}) applied for ${scholarship.title}`;

    setTransaction(
      "Pending",
      `Scholarship application: ${scholarship.title}`,
      "Submitting scholarship application through blockchain.js.",
      ""
    );

    try {
      const result = await applyScholarshipOnChain({
        scholarshipId,
        title: scholarship.title,
        statement
      });

      // Sync to relational backend
      await applyScholarshipOnServer({
        scholarshipId,
        title: scholarship.title,
        amount: scholarship.amount,
        type: scholarship.type,
        txId: result.txId
      });

      updateState((state) => {
        state.scholarshipApplications = [
          {
            id: `${scholarshipId}-${Date.now()}`,
            scholarshipId,
            title: scholarship.title,
            amount: scholarship.amount,
            type: scholarship.type,
            studentId: session.studentId,
            status: "Pending",
            txId: result.txId,
            appliedAt: new Date().toLocaleString()
          },
          ...(state.scholarshipApplications || [])
        ];
        return state;
      });

      setTransaction(
        "Success",
        `Scholarship application submitted`,
        `${scholarship.title} application is recorded.`,
        result.txId
      );
      showToast("Application submitted", result.txId, "success");
      updateApplyButtons();
      setTimeout(() => {
        window.location.href = "dashboard.html#applications";
      }, 900);
    } catch (error) {
      setTransaction(
        "Failed",
        "Scholarship application failed",
        error.message || "Could not submit scholarship application.",
        ""
      );
      showToast("Application failed", "Check wallet and try again.", "failed");
      setButtonPending(submitBtn, false, 'Submit On-Chain Application →');
    }
  });
};

function initScholarshipStats() {
  const activePill = document.getElementById('schol-active-pill');
  const availableVal = document.getElementById('schol-available-val');
  const appliedVal = document.getElementById('schol-applied-val');
  const verifiedPct = document.getElementById('schol-verified-pct');
  const totalVal = document.getElementById('schol-total-val');

  const catalogKeys = Object.keys(SCHOLARSHIP_CATALOG);
  const catalogCount = catalogKeys.length;
  const applications = getApplications();
  const appliedCount = applications.length;

  if (activePill) activePill.textContent = `${catalogCount} Active`;
  if (availableVal) availableVal.textContent = catalogCount;
  if (appliedVal) appliedVal.textContent = appliedCount;

  if (totalVal) {
    totalVal.textContent = `₹280,000`;
  }

  if (verifiedPct) {
    const approvedCount = applications.filter(app => app.status === 'Approved').length;
    const pct = appliedCount ? Math.round((approvedCount / appliedCount) * 100) : 100;
    verifiedPct.textContent = `${pct}%`;
  }
}

updateApplyButtons();
initScholarshipStats();
