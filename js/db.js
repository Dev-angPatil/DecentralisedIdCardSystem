const API_ROOT = "";

async function postJson(path, payload) {
  try {
    const session = JSON.parse(localStorage.getItem("chainCampusSession") || "null");
    const headers = { "Content-Type": "application/json" };
    if (session) {
      headers["X-Session-Email"] = session.email || "";
      headers["X-Session-StudentId"] = session.studentId || "";
      headers["X-Session-IsAdmin"] = session.isAdmin ? "1" : "0";
    }
    const response = await fetch(`${API_ROOT}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Network response was not ok");
    }
    return await response.json();
  } catch (error) {
    console.error(`[db] API error for ${path}:`, error);
    throw error;
  }
}

export async function loadDatabaseSnapshot() {
  try {
    const session = JSON.parse(localStorage.getItem("chainCampusSession") || "null");
    const headers = { Accept: "application/json" };
    if (session) {
      headers["X-Session-Email"] = session.email || "";
      headers["X-Session-StudentId"] = session.studentId || "";
      headers["X-Session-IsAdmin"] = session.isAdmin ? "1" : "0";
    }
    const response = await fetch(`${API_ROOT}/api/bootstrap`, {
      headers
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn("[db] Running without SQLite backend:", error);
    return null;
  }
}

/* ─── NEW GRANULAR RELATIONAL API CLIENT CALLS ─── */

export async function loginWithWalletOnServer(walletAddress) {
  return postJson("/api/auth/wallet", { walletAddress });
}

export async function registerProfileOnServer(profileData) {
  return postJson("/api/auth/register-profile", profileData);
}

export async function loginWithCredentialsOnServer(email, password) {
  return postJson("/api/auth/credentials", { email, password });
}

export async function logoutOnServer() {
  return postJson("/api/auth/logout", {});
}

export async function enrollCourseOnServer(courseId) {
  return postJson("/api/courses/enroll", { courseId });
}

export async function registerEventOnServer(eventId) {
  return postJson("/api/events/register", { eventId });
}

export async function applyScholarshipOnServer(applicationData) {
  return postJson("/api/scholarships/apply", applicationData);
}

export async function reviewScholarshipOnServer(reviewData) {
  return postJson("/api/scholarships/review", reviewData);
}

export async function addTransactionOnServer(txData) {
  return postJson("/api/transactions/add", txData);
}

export async function createEventOnServer(eventData) {
  return postJson("/api/events/create", eventData);
}

export async function createCourseOnServer(courseData) {
  return postJson("/api/courses/create", courseData);
}

export async function markAttendanceOnServer(attendanceData) {
  return postJson("/api/attendance/mark", attendanceData);
}

export async function airdropSOLOnServer(amount = 1.0) {
  return postJson("/api/wallet/airdrop", { amount });
}

export async function transferSOLOnServer(recipientId, amount, action = "Scholarship Payout") {
  return postJson("/api/wallet/transfer", { recipientId, amount, action });
}

export async function deductGasOnServer(amount = 0.005, action = "Transaction Gas Fee") {
  return postJson("/api/wallet/deduct-gas", { amount, action });
}
