import { applyScholarshipOnChain } from "./blockchain.js";
import {
  getSession,
  getState,
  requireConnectedWallet,
  setTransaction,
  showToast,
  updateState
} from "./main.js";

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

window.applyScholarship = async function applyScholarship(scholarshipId) {
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

  if (!(await requireConnectedWallet({
    message: "Connect your wallet before applying for scholarships."
  }))) {
    return;
  }

  const button = document.querySelector(`[data-apply-scholarship="${scholarshipId}"]`);
  const previousLabel = button?.textContent || "Apply On-Chain";
  if (button) {
    button.disabled = true;
    button.textContent = "Submitting...";
  }

  const statement = `${session.name || "Student"} applied for ${scholarship.title}`;

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
    if (button) {
      button.disabled = false;
      button.textContent = previousLabel;
    }
  }
};

updateApplyButtons();
