import { registerStudentOnChain } from "./blockchain.js";
import {
  setButtonPending, showToast, updateState,
  getSession, setSession, clearSession,
  isLoggedIn
} from "./main.js";
import {
  registerProfileOnServer,
  loginWithCredentialsOnServer, addTransactionOnServer
} from "./db.js";
import { NfcManager } from "./nfc.js";

/* ══════════════ UNIFIED AUTH PORTAL ═══════════════════════ */
function initLoginPage() {
  const tabStudent    = document.getElementById('tab-student');
  const tabAdmin      = document.getElementById('tab-admin');
  const studentTab    = document.getElementById('student-tab-content');
  const adminTab      = document.getElementById('admin-tab-content');

  // Student Authentication Phases
  const phaseLogin     = document.getElementById('student-login-phase');
  const studentForm    = document.getElementById('student-credentials-form');
  const studentError   = document.getElementById('student-login-error');
  const btnSubmitStudent = document.getElementById('btn-submit-student');
  const linkShowRegister = document.getElementById('link-show-register');

  const phaseOnboard   = document.getElementById('wallet-onboard-phase');
  const onboardForm    = document.getElementById('onboard-form');
  const onboardError   = document.getElementById('onboard-error');
  const btnOnboard     = document.getElementById('btn-submit-onboard');
  const linkShowLogin  = document.getElementById('link-show-login');

  const phaseSuccess   = document.getElementById('credentials-success-phase');
  const genUsernameDisplay = document.getElementById('generated-username-display');
  const genPasswordDisplay = document.getElementById('generated-password-display');
  const btnProceedLogin    = document.getElementById('btn-proceed-login');

  // Admin Authentication
  const adminForm      = document.getElementById('admin-login-form');
  const adminError     = document.getElementById('admin-login-error');
  const btnAdmin       = document.getElementById('btn-submit-admin');

  if (!studentTab) return; // Only run on login.html

  /* If already logged in → redirect to dashboard */
  if (isLoggedIn()) {
    const session = getSession();
    window.location.href = session.isAdmin ? 'admin_dashboard.html' : 'dashboard.html';
    return;
  }

  let generatedUser = null;
  let generatedPass = "";

  /* ── Tab Switcher Logic (new HTML uses inline switchTab fn) ── */
  tabStudent?.addEventListener('click', () => {
    tabStudent.classList.add('active');
    tabAdmin?.classList.remove('active');
    studentTab.classList.remove('step-hidden');
    adminTab?.classList.add('step-hidden');
  });

  tabAdmin?.addEventListener('click', () => {
    tabAdmin.classList.add('active');
    tabStudent?.classList.remove('active');
    adminTab?.classList.remove('step-hidden');
    studentTab.classList.add('step-hidden');
  });

  /* ── Switch between Student Sign-In / Register ── */
  linkShowRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    if (onboardError) onboardError.style.display = 'none';
    phaseLogin?.classList.add('step-hidden');
    phaseOnboard?.classList.remove('step-hidden');
  });

  linkShowLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    if (studentError) studentError.style.display = 'none';
    phaseOnboard?.classList.add('step-hidden');
    phaseLogin?.classList.remove('step-hidden');
  });

  /* ── Student Sign In Flow ── */
  studentForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (studentError) {
      studentError.style.display = 'none';
      studentError.textContent = '';
    }

    const username = studentForm.username.value.trim();
    const password = studentForm.password.value;

    if (!username || !password) {
      showStudentError('Username or email and password are required.');
      return;
    }

    setButtonPending(btnSubmitStudent, true, 'Signing In…', 'Sign In →');

    try {
      const res = await loginWithCredentialsOnServer(username, password);

      if (res.ok && res.user) {
        // Hydrate virtual wallet address locally
        const walletAddress = res.user.walletAddress || 'CCvWmock_addr';
        localStorage.setItem("chainCampusWalletType", "virtual");
        localStorage.setItem("chainCampusVirtualAddress", walletAddress);

        setSession(res.user);
        updateState(s => {
          s.walletAddress = walletAddress;
          s.student = res.user;
          return s;
        });

        showToast('Sign In Successful 🎉', `Welcome back, ${res.user.name}!`, 'success');
        
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
      } else {
        showStudentError('Invalid student username/email or password.');
        setButtonPending(btnSubmitStudent, false, '', 'Sign In →');
      }
    } catch (err) {
      showStudentError(err.message || 'Authentication error. Please retry.');
      setButtonPending(btnSubmitStudent, false, '', 'Sign In →');
    }
  });

  /* ── Student Registration & Credentials Generation ── */
  onboardForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (onboardError) {
      onboardError.style.display = 'none';
      onboardError.textContent = '';
    }

    const name = onboardForm.name.value.trim();
    const email = onboardForm.email.value.trim();
    const college = onboardForm.college.value.trim();
    const program = onboardForm.program.value.trim(); // Branch
    const year = onboardForm.year.value;

    if (!name || !email || !college || !program) {
      showOnboardError('All profile details are required.');
      return;
    }

    setButtonPending(btnOnboard, true, 'Generating Credentials…', 'Register & Generate Credentials →');

    try {
      // 1. Pre-generate virtual Solana address for the local Sandbox in background
      const { getOrCreateVirtualWallet } = await import("./blockchain.js");
      const localWallet = getOrCreateVirtualWallet();

      // 2. Submit student metadata to relational server to generate secure credentials
      const res = await registerProfileOnServer({
        email,
        name,
        college,
        program,
        year,
        walletAddress: localWallet
      });

      if (res.ok && res.username && res.password) {
        generatedUser = res.user;
        generatedPass = res.password;

        // 3. Complete simulated student registration on-chain with generated academic ID
        const studentId = res.user.studentId || 'CC-TEMP-ID';
        const txResult = await registerStudentOnChain({ studentId, name });

        // Log transaction to Sandbox ledger
        await addTransactionOnServer({
          txId: txResult.txId,
          action: "Student Web3 Registration",
          status: "success"
        });

        // 4. Update the UI to display the generated username and password
        if (genUsernameDisplay) genUsernameDisplay.value = res.username;
        if (genPasswordDisplay) genPasswordDisplay.value = res.password;

        phaseOnboard.classList.add('step-hidden');
        phaseSuccess?.classList.remove('step-hidden');

        showToast('Registration Successful ✓', 'Generated credentials displayed.', 'success');
      } else {
        throw new Error(res.error || "Profile registration failed.");
      }
    } catch (err) {
      console.error("[auth] Onboarding registration error:", err);
      showOnboardError(err.message || 'Registration failed. Check details or email conflicts.');
      setButtonPending(btnOnboard, false, '', 'Register & Generate Credentials →');
    }
  });

  /* ── Proceed Auto Sign In ── */
  btnProceedLogin?.addEventListener('click', async () => {
    if (!generatedUser || !generatedPass) {
      phaseSuccess?.classList.add('step-hidden');
      phaseLogin?.classList.remove('step-hidden');
      return;
    }

    setButtonPending(btnProceedLogin, true, 'Auto Signing In…', 'Auto Sign In & Launch Portal →');

    try {
      const res = await loginWithCredentialsOnServer(generatedUser.username, generatedPass);
      if (res.ok && res.user) {
        const walletAddress = res.user.walletAddress || 'CCvWmock_addr';
        localStorage.setItem("chainCampusWalletType", "virtual");
        localStorage.setItem("chainCampusVirtualAddress", walletAddress);

        setSession(res.user);
        updateState(s => {
          s.walletAddress = walletAddress;
          s.student = res.user;
          return s;
        });

        showToast('Portal Activated! 🎓', `Signed in as ${res.user.name}`, 'success');
        
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
      } else {
        throw new Error("Auto login failed.");
      }
    } catch (err) {
      showToast('Manual Sign In Required', 'Auto sign-in failed. Please enter your credentials manually.', 'pending');
      phaseSuccess?.classList.add('step-hidden');
      phaseLogin?.classList.remove('step-hidden');

      // Pre-fill
      const userField = studentForm.querySelector('[name="username"]');
      const passField = studentForm.querySelector('[name="password"]');
      if (userField) userField.value = generatedUser.username;
      if (passField) passField.value = generatedPass;
    } finally {
      setButtonPending(btnProceedLogin, false, '', 'Auto Sign In & Launch Portal →');
    }
  });

  /* ── Admin: Credential Login ── */
  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (adminError) {
      adminError.style.display = 'none';
      adminError.textContent = '';
    }

    const email = adminForm.email.value.trim();
    const password = adminForm.password.value;

    if (!email || !password) {
      showAdminError('Email and password are required.');
      return;
    }

    setButtonPending(btnAdmin, true, 'Verifying Credentials…', 'Authenticate Admin');

    try {
      const res = await loginWithCredentialsOnServer(email, password);

      if (res.ok && res.user) {
        localStorage.setItem("chainCampusWalletType", "virtual");
        localStorage.setItem("chainCampusVirtualAddress", res.user.walletAddress || "CCvWAdmin");
        setSession(res.user);
        showToast('Welcome Administrator 🛡️', res.user.name, 'success');
        
        setTimeout(() => {
          window.location.href = 'admin_dashboard.html';
        }, 1200);
      } else {
        showAdminError('Invalid administrator email or password.');
        setButtonPending(btnAdmin, false, '', 'Authenticate Admin');
      }
    } catch (err) {
      showAdminError(err.message || 'Authentication error. Please retry.');
      setButtonPending(btnAdmin, false, '', 'Authenticate Admin');
    }
  });

  // Demo Credentials Quick-Fill Listeners
  const btnQuickStudent = document.getElementById('quick-fill-student');
  const btnQuickAdmin   = document.getElementById('quick-fill-admin');

  btnQuickStudent?.addEventListener('click', () => {
    if (typeof window.switchTab === 'function') {
      window.switchTab('student');
    }
    tabStudent?.click();

    const userField = studentForm.querySelector('[name="username"]');
    const passField = studentForm.querySelector('[name="password"]');
    if (userField && passField) {
      userField.value = 'test.student@vit.edu';
      passField.value = 'password';

      showToast('Student credentials filled', 'Signing in...', 'success');
      setTimeout(() => {
        studentForm.dispatchEvent(new Event('submit'));
      }, 500);
    }
  });

  btnQuickAdmin?.addEventListener('click', () => {
    if (typeof window.switchTab === 'function') {
      window.switchTab('admin');
    }
    tabAdmin?.click();

    const emailField = adminForm.querySelector('[name="email"]');
    const passField = adminForm.querySelector('[name="password"]');
    if (emailField && passField) {
      emailField.value = 'admin@college.edu';
      passField.value = 'Admin()09';

      showToast('Admin credentials filled', 'Signing in...', 'success');
      setTimeout(() => {
        adminForm.dispatchEvent(new Event('submit'));
      }, 500);
    }
  });

  const btnNfcLogin = document.getElementById('btn-nfc-login');
  btnNfcLogin?.addEventListener('click', async () => {
    setButtonPending(btnNfcLogin, true, 'Approaching Card...', '📶 Sign In with NFC Card');

    NfcManager.startScan(
      async (cardData) => {
        const walletAddress = cardData.walletAddress;
        if (!walletAddress) {
          setButtonPending(btnNfcLogin, false, '', '📶 Sign In with NFC Card');
          showToast("NFC Read Error", "Invalid card payload: wallet address missing.", "failed");
          return;
        }

        try {
          const { loginWithWalletOnServer } = await import("./db.js");
          const res = await loginWithWalletOnServer(walletAddress);

          if (res.ok && res.user) {
            localStorage.setItem("chainCampusWalletType", "virtual");
            localStorage.setItem("chainCampusVirtualAddress", walletAddress);

            setSession(res.user);
            updateState(s => {
              s.walletAddress = walletAddress;
              if (!res.user.isAdmin) {
                s.student = res.user;
              }
              return s;
            });

            showToast('NFC Sign In Successful 🎉', `Welcome back, ${res.user.name}!`, 'success');
            
            setTimeout(() => {
              window.location.href = res.user.isAdmin ? 'admin_dashboard.html' : 'dashboard.html';
            }, 1200);
          } else {
            showToast('NFC Login Failed', 'No registered profile matches this card.', 'failed');
            setButtonPending(btnNfcLogin, false, '', '📶 Sign In with NFC Card');
          }
        } catch (err) {
          showToast('NFC Login Error', err.message || 'Error authenticating card.', 'failed');
          setButtonPending(btnNfcLogin, false, '', '📶 Sign In with NFC Card');
        }
      },
      (err) => {
        setButtonPending(btnNfcLogin, false, '', '📶 Sign In with NFC Card');
        showToast('NFC Error', err.message || 'Failed to read card.', 'failed');
      }
    );
  });

  function showStudentError(msg) {
    if (studentError) {
      studentError.textContent = msg;
      studentError.style.display = 'block';
    }
  }

  function showOnboardError(msg) {
    if (onboardError) {
      onboardError.textContent = msg;
      onboardError.style.display = 'block';
    }
  }

  function showAdminError(msg) {
    if (adminError) {
      adminError.textContent = msg;
      adminError.style.display = 'block';
    }
  }
}

/* ══════════════ LEGACY REGISTER PAGE (FALLBACK) ════════════ */
function initRegisterPage() {
  // Legacy stub, page not actively used in modern overhauled flow
}

initLoginPage();
initRegisterPage();
