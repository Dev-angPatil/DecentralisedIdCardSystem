const STORAGE_KEY = "chainCampusState";
const MAX_NOTIFICATIONS = 5;
const TOAST_DURATION_MS = 2800;
const NAV_ITEMS = [
  ["index.html", "Home", "home"],
  ["dashboard.html", "Dashboard", "dashboard"],
  ["register.html", "Register", "register"],
  ["events.html", "Events", "events"],
  ["attendance.html", "Attendance", "attendance"],
  ["profile.html", "Profile", "profile"],
  ["login.html", "Login", "login"]
];

const defaultState = {
  walletAddress: "",
  student: {
    name: "Aarav Mehta",
    college: "Lumina College of Technology",
    program: "B.Tech Computer Science",
    year: "3rd Year",
    studentId: "LC-2026-0432",
    email: "aarav.mehta@luminacollege.edu"
  },
  lastTransaction: {
    status: "Idle",
    label: "No blockchain transaction yet",
    message: "Register, join an event, or mark attendance to create a mock transaction.",
    txId: ""
  },
  notifications: [
    {
      id: 1,
      title: "Transaction submitted",
      message: "Pending blockchain actions will appear here."
    },
    {
      id: 2,
      title: "Transaction confirmed",
      message: "Confirmed mock transactions show a fake transaction ID."
    },
    {
      id: 3,
      title: "Transaction failed",
      message: "Failure UI is supported even before real Solana integration."
    }
  ],
  attendancePercent: 88,
  attendanceRecords: [
    {
      id: "att_1",
      subject: "Distributed Systems",
      date: "March 20, 2026",
      status: "Present",
      verifier: "Admin Node 02"
    },
    {
      id: "att_2",
      subject: "Web Engineering",
      date: "March 24, 2026",
      status: "Verified",
      verifier: "Admin Node 01"
    },
    {
      id: "att_3",
      subject: "Applied Cryptography",
      date: "March 28, 2026",
      status: "Present",
      verifier: "Admin Node 05"
    }
  ],
  events: [
    {
      id: "evt_1",
      title: "Innovation Fest 2026",
      date: "April 15, 2026",
      venue: "Central Lawn",
      description: "Startup demos, project booths, and founder roundtables.",
      verified: false
    },
    {
      id: "evt_2",
      title: "Career Connect Drive",
      date: "April 18, 2026",
      venue: "Placement Hall",
      description: "Recruiter talks, resume reviews, and internship networking.",
      verified: false
    },
    {
      id: "evt_3",
      title: "Solana Builders Night",
      date: "April 22, 2026",
      venue: "Innovation Lab",
      description: "A guided student workshop focused on wallet UX and dApp ideas.",
      verified: false
    }
  ]
};

function mergeState(stored) {
  return {
    ...defaultState,
    ...stored,
    student: {
      ...defaultState.student,
      ...(stored.student || {})
    },
    lastTransaction: {
      ...defaultState.lastTransaction,
      ...(stored.lastTransaction || {})
    },
    notifications: stored.notifications || defaultState.notifications,
    attendanceRecords: stored.attendanceRecords || defaultState.attendanceRecords,
    events: stored.events || defaultState.events
  };
}

function getVerifiedEventCount(state) {
  return state.events.filter((event) => event.verified).length;
}

function getWalletLabel(state) {
  return state.walletAddress || "Wallet Offline";
}

export function getState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return mergeState({});
  }

  try {
    return mergeState(JSON.parse(raw));
  } catch (error) {
    return mergeState({});
  }
}

export function saveState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  return nextState;
}

export function updateState(updater) {
  const currentState = getState();
  const clonedState = JSON.parse(JSON.stringify(currentState));
  const nextState =
    typeof updater === "function" ? updater(clonedState) : updater;
  return saveState(nextState);
}

function createWalletAddress() {
  const start = Math.random().toString(36).slice(2, 6).toUpperCase();
  const end = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PHANTOM_${start}...${end}`;
}

function getToneFromStatus(status) {
  switch (status) {
    case "Failed":
      return "failed";
    case "Pending":
      return "pending";
    case "Idle":
      return "idle";
    default:
      return "success";
  }
}

export function setButtonPending(button, pending, pendingText, defaultText) {
  if (!button) {
    return;
  }

  button.disabled = pending;
  button.textContent = pending ? pendingText : defaultText;
}

export function renderStatusPanel(target, content, tone) {
  const panel =
    typeof target === "string" ? document.querySelector(target) : target;

  if (!panel) {
    return;
  }

  panel.classList.remove("empty");
  panel.innerHTML = `
    <div class="card-top">
      <strong>${content.title}</strong>
      <span class="status-badge ${tone}">${content.badge}</span>
    </div>
    <p>${content.message}</p>
    ${content.txId ? `<p class="small-copy">${content.txId}</p>` : ""}
  `;
}

export function connectWallet() {
  const nextState = updateState((state) => {
    state.walletAddress = state.walletAddress || createWalletAddress();
    return state;
  });

  addNotification("Wallet connected", "Mock Phantom wallet is ready for future signing.");
  renderSharedElements();
  showToast("Wallet connected", nextState.walletAddress, "success");
}

export function addNotification(title, message) {
  updateState((state) => {
    state.notifications.unshift({
      id: Date.now(),
      title,
      message
    });
    state.notifications = state.notifications.slice(0, MAX_NOTIFICATIONS);
    return state;
  });
}

export function setTransaction(status, label, message, txId) {
  updateState((state) => {
    state.lastTransaction = {
      status,
      label,
      message,
      txId: txId || ""
    };
    return state;
  });

  addNotification(`Transaction ${status.toLowerCase()}`, `${label}${txId ? " | " + txId : ""}`);
  renderSharedElements();
  showToast(label, message, getToneFromStatus(status));
}

export function updateWalletCopy() {
  const state = getState();
  document.querySelectorAll("[data-wallet-copy]").forEach((node) => {
    node.textContent = state.walletAddress || "Wallet not connected yet.";
  });
}

function renderHeader() {
  const state = getState();
  const currentPage = document.body.dataset.page;
  const header = document.querySelector("[data-site-header]");
  if (!header) {
    return;
  }

  header.innerHTML = `
    <nav class="site-nav glass-card">
      <div class="brand">
        <div class="brand-mark">CC</div>
        <div>
          <p>Student Portal</p>
          <h1>ChainCampus</h1>
        </div>
      </div>
      <div class="nav-links">
        ${NAV_ITEMS
          .map(
            ([href, label, page]) =>
              `<a href="${href}" class="${page === currentPage ? "active" : ""}">${label}</a>`
          )
          .join("")}
      </div>
      <div class="nav-actions">
        <span class="wallet-chip">${getWalletLabel(state)}</span>
        <button type="button" class="secondary-btn" data-connect-wallet>Connect Wallet</button>
      </div>
    </nav>
  `;
}

function renderFooter() {
  const footer = document.querySelector("[data-site-footer]");
  if (!footer) {
    return;
  }

  footer.innerHTML = `
    <div class="site-footer glass-card">
      <p>ChainCampus student platform</p>
      <p>All blockchain actions are isolated inside <code>js/blockchain.js</code>.</p>
    </div>
  `;
}

function renderHomeSummary() {
  const target = document.querySelector("[data-home-summary]");
  if (!target) {
    return;
  }

  const state = getState();
  const verifiedEventCount = getVerifiedEventCount(state);
  target.innerHTML = `
    <div class="info-row">
      <span>Attendance</span>
      <strong>${state.attendancePercent}%</strong>
    </div>
    <div class="info-row">
      <span>Enrolled Events</span>
      <strong>${verifiedEventCount}</strong>
    </div>
    <div class="info-row">
      <span>Wallet</span>
      <strong>${state.walletAddress || "Not Connected"}</strong>
    </div>
    <div class="info-row">
      <span>Last Tx</span>
      <strong>${state.lastTransaction.status}</strong>
    </div>
  `;
}

function renderDashboard() {
  const statsTarget = document.querySelector("[data-dashboard-stats]");
  const noticesTarget = document.querySelector("[data-dashboard-notices]");
  const transactionTarget = document.querySelector("[data-last-transaction]");
  if (!statsTarget || !noticesTarget || !transactionTarget) {
    return;
  }

  const state = getState();
  const enrolledEvents = getVerifiedEventCount(state);
  statsTarget.innerHTML = `
    <article class="metric-card glass-card">
      <span>Attendance %</span>
      <strong>${state.attendancePercent}%</strong>
    </article>
    <article class="metric-card glass-card">
      <span>Enrolled Events</span>
      <strong>${enrolledEvents}</strong>
    </article>
    <article class="metric-card glass-card">
      <span>Wallet Status</span>
      <strong>${state.walletAddress ? "Connected" : "Not Connected"}</strong>
    </article>
    <article class="metric-card glass-card">
      <span>Last Transaction</span>
      <strong>${state.lastTransaction.status}</strong>
    </article>
  `;

  noticesTarget.innerHTML = `
    <div class="info-row">
      <span>Registration Rail</span>
      <strong>Ready for Solana integration</strong>
    </div>
    <div class="info-row">
      <span>Attendance Rail</span>
      <strong>Admin verification flow prepared</strong>
    </div>
    <div class="info-row">
      <span>Event Rail</span>
      <strong>${enrolledEvents} verified registrations</strong>
    </div>
  `;

  transactionTarget.innerHTML = `
    <div class="card-top">
      <div>
        <p class="eyebrow">Last Transaction</p>
        <strong>${state.lastTransaction.label}</strong>
      </div>
      <span class="status-badge ${state.lastTransaction.status.toLowerCase()}">${state.lastTransaction.status}</span>
    </div>
    <p>${state.lastTransaction.message}</p>
    <p class="small-copy">${state.lastTransaction.txId || "No transaction ID available yet."}</p>
  `;
}

function renderProfile() {
  const detailTarget = document.querySelector("[data-profile-details]");
  const chainTarget = document.querySelector("[data-onchain-details]");
  if (!detailTarget || !chainTarget) {
    return;
  }

  const state = getState();
  const details = [
    ["Name", state.student.name],
    ["College", state.student.college],
    ["Program", state.student.program],
    ["Year", state.student.year],
    ["Student ID", state.student.studentId],
    ["Email", state.student.email]
  ];

  detailTarget.innerHTML = details
    .map(
      ([label, value]) => `
        <div class="detail-card">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");

  chainTarget.innerHTML = `
    <div class="info-row">
      <span>Wallet Address</span>
      <strong>${state.walletAddress || "Wallet not connected"}</strong>
    </div>
    <div class="info-row">
      <span>Registration State</span>
      <strong>Mock ready for smart contract call</strong>
    </div>
    <div class="info-row">
      <span>Attendance State</span>
      <strong>${state.attendanceRecords[0].status}</strong>
    </div>
    <div class="info-row">
      <span>Latest Tx ID</span>
      <strong>${state.lastTransaction.txId || "Pending first transaction"}</strong>
    </div>
  `;
}

export function showToast(title, message, tone) {
  const stack = document.querySelector("[data-toast-stack]");
  if (!stack) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast glass-card`;
  toast.innerHTML = `<strong>${title}</strong><span class="status-badge ${tone}">${tone.toUpperCase()}</span><p>${message}</p>`;
  stack.prepend(toast);

  setTimeout(() => {
    toast.remove();
  }, TOAST_DURATION_MS);
}

export function renderSharedElements() {
  renderHeader();
  renderFooter();
  updateWalletCopy();
  renderHomeSummary();
  renderDashboard();
  renderProfile();
  bindGlobalActions();
}

function bindGlobalActions() {
  document.querySelectorAll("[data-connect-wallet]").forEach((button) => {
    button.onclick = () => connectWallet();
  });
}

function init() {
  saveState(getState());
  renderSharedElements();
}

init();
