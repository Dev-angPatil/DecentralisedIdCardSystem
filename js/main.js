const STORAGE_KEY = "chainCampusState";
const MAX_NOTIFICATIONS = 5;
const TOAST_DURATION_MS = 2800;

const NAV_ITEMS = [
  ["index.html", "Home", "home"],
  ["dashboard.html", "Dashboard", "dashboard"],
  ["register.html", "Register", "register"],
  ["events.html", "Events", "events"],
  ["attendance.html", "Attendance", "attendance"],
  ["schol.html", "Scholarships", "scholarships"],
  ["profile.html", "Profile", "profile"],
  ["login.html", "Login", "login"]
];

const defaultState = {
  walletAddress: "",
  student: {},
  lastTransaction: {
    status: "Idle",
    label: "No transaction yet",
    message: "",
    txId: ""
  },
  notifications: [],
  attendanceRecords: [],
  events: []
};

/* ================= STATE ================= */

function mergeState(stored) {
  return { ...defaultState, ...stored };
}

export function getState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? mergeState(JSON.parse(raw)) : defaultState;
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function updateState(updater) {
  const current = getState();
  const next =
    typeof updater === "function" ? updater({ ...current }) : updater;
  return saveState(next);
}

/* ================= WALLET ================= */

export async function connectWallet() {
  try {
    if (!window.solana || !window.solana.isPhantom) {
      alert("Please install Phantom Wallet.");
      window.open("https://phantom.app/", "_blank");
      return;
    }

    const res = await window.solana.connect();
    const walletAddress = res.publicKey.toString();

    updateState((state) => {
      state.walletAddress = walletAddress;
      return state;
    });

    renderHeader();
    bindGlobalActions();
    updateWalletCopy();

    showToast("Wallet connected", walletAddress, "success");

  } catch (err) {
    console.error(err);
    showToast("Connection failed", "User rejected or error", "failed");
  }
}

export async function requireConnectedWallet(options = {}) {
  const { message = "Connect your wallet to continue." } = options;
  const state = getState();

  if (state.walletAddress) {
    return true;
  }

  showToast("Wallet required", message, "pending");
  await connectWallet();

  return Boolean(getState().walletAddress);
}

export function setButtonPending(
  button,
  isPending,
  pendingLabel = "Pending...",
  defaultLabel = "Submit"
) {
  if (!button) return;

  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent.trim();
  }

  button.disabled = isPending;
  button.textContent = isPending
    ? pendingLabel
    : defaultLabel || button.dataset.defaultLabel;
}

/* ================= UI ================= */

function renderHeader() {
  const state = getState();
  const currentPage = document.body.dataset.page;
  const header = document.querySelector("[data-site-header]");
  if (!header) return;

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
        ${NAV_ITEMS.map(
          ([href, label, page]) =>
            `<a href="${href}" class="${page === currentPage ? "active" : ""}">
              ${label}
            </a>`
        ).join("")}
      </div>

      <div class="nav-actions">
        <span class="wallet-chip">
          ${state.walletAddress || "Wallet Not Connected"}
        </span>
        <button class="secondary-btn" data-connect-wallet>
          Connect Wallet
        </button>
      </div>
    </nav>
  `;
}

function renderFooter() {
  const footer = document.querySelector("[data-site-footer]");
  if (!footer) return;

  footer.innerHTML = `
    <div class="site-footer glass-card">
      <p>ChainCampus student platform</p>
    </div>
  `;
}

export function updateWalletCopy() {
  const state = getState();
  document.querySelectorAll("[data-wallet-copy]").forEach((el) => {
    el.textContent = state.walletAddress || "Not Connected";
  });
}

/* ================= STATUS ================= */

export function renderStatusPanel(target, content, tone) {
  const panel =
    typeof target === "string" ? document.querySelector(target) : target;
  if (!panel) return;

  panel.innerHTML = `
    <div class="card-top">
      <strong>${content.title}</strong>
      <span class="status-badge ${tone}">${content.badge}</span>
    </div>
    <p>${content.message}</p>
    ${content.txId ? `<p class="small-copy">${content.txId}</p>` : ""}
  `;
}

/* ================= TRANSACTION ================= */

export function setTransaction(status, label, message, txId) {
  updateState((state) => {
    state.lastTransaction = { status, label, message, txId };
    return state;
  });
}

/* ================= EVENTS ================= */

function bindGlobalActions() {
  const btn = document.querySelector("[data-connect-wallet]");
  if (!btn) return;

  btn.onclick = null;
  btn.addEventListener("click", connectWallet);
}

/* ================= TOAST ================= */

export function showToast(title, message = "", tone = "success") {
  const stack = document.querySelector("[data-toast-stack]");
  if (!stack) return;

  const toast = document.createElement("div");
  toast.className = "toast glass-card";

  toast.innerHTML = `
    <strong>${title}</strong>
    <p>${message}</p>
  `;

  stack.prepend(toast);

  setTimeout(() => toast.remove(), TOAST_DURATION_MS);
}

/* ================= INIT ================= */

export function renderSharedElements() {
  renderHeader();
  bindGlobalActions();
  renderFooter();
  updateWalletCopy();
}

function populateDashboardStats() {
  const statsPanel = document.querySelector("[data-dashboard-stats]");
  const state = getState();
  
  if (statsPanel) {
    const eventCount = state.events ? state.events.length : 12;
    const attendanceCount = state.attendanceRecords ? state.attendanceRecords.length : 3;

    statsPanel.innerHTML = `
      <div class="stat-card glass-card">
        <p>Total Registered Events</p>
        <h2>${eventCount}</h2>
      </div>
      <div class="stat-card glass-card">
        <p>Total Attendances</p>
        <h2>${attendanceCount}</h2>
      </div>
      <div class="stat-card glass-card">
        <p>Wallet Status</p>
        <h2>${state.walletAddress ? 'Active' : 'Missing'}</h2>
      </div>
    `;
  }

  const noticesPanel = document.querySelector("[data-dashboard-notices]");
  if (noticesPanel) {
    const list = state.notifications && state.notifications.length ? state.notifications : [
      {title: "Welcome to ChainCampus", desc: "Your blockchain portal is initialized."},
      {title: "Solana Connected", desc: "The platform is ready for on-chain transactions."}
    ];
    noticesPanel.innerHTML = list.map(n => `
      <div class="notice-item">
        <strong>${n.title}</strong>
        <p>${n.desc}</p>
      </div>
    `).join("");
  }
}

function populateHomeSummary() {
  const summaryPanel = document.querySelector("[data-home-summary]");
  if (!summaryPanel) return;
  const state = getState();
  
  summaryPanel.innerHTML = `
    <div class="summary-item notice-item">
      <span>Mock Web3 Status:</span>
      <strong>Active</strong>
    </div>
    <div class="summary-item notice-item">
      <span>Connected Wallet:</span>
      <strong>${state.walletAddress ? state.walletAddress.slice(0, 8) + '...' + state.walletAddress.slice(-8) : "None"}</strong>
    </div>
  `;
}

async function init() {
  saveState(getState());
  renderSharedElements();
  
  populateDashboardStats();
  populateHomeSummary();

  if (window.solana && window.solana.isPhantom) {
    try {
      const res = await window.solana.connect({ onlyIfTrusted: true });
      updateState((state) => {
        state.walletAddress = res.publicKey.toString();
        return state;
      });
      renderSharedElements();
      populateDashboardStats();
      populateHomeSummary();
    } catch(err) {
      // Not yet authorized
    }
  }
}

init();
