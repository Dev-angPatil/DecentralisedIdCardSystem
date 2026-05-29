import { registerStudentOnChain } from "./blockchain.js";
import {
  connectWallet, renderStatusPanel,
  setButtonPending, setTransaction, showToast, updateState,
  updateWalletCopy, getSession, setSession, clearSession,
  isLoggedIn
} from "./main.js";
import {
  loginWithWalletOnServer, registerProfileOnServer,
  loginWithCredentialsOnServer, addTransactionOnServer
} from "./db.js";

/* ══════════════ UNIFIED AUTH PORTAL ═══════════════════════ */
function initLoginPage() {
  const tabStudent    = document.getElementById('tab-student');
  const tabAdmin      = document.getElementById('tab-admin');
  const studentTab    = document.getElementById('student-tab-content');
  const adminTab      = document.getElementById('admin-tab-content');
  const authTitle     = document.getElementById('auth-title');
  const authPill      = document.getElementById('auth-pill');

  const btnAccessVirtual = document.getElementById('btn-access-virtual');
  const btnConnectPhantom = document.getElementById('btn-connect-phantom');
  const phaseConnect  = document.getElementById('wallet-connect-phase');
  const phaseOnboard  = document.getElementById('wallet-onboard-phase');
  const onboardForm   = document.getElementById('onboard-form');
  const onboardError  = document.getElementById('onboard-error');
  const btnOnboard    = document.getElementById('btn-submit-onboard');

  const adminForm     = document.getElementById('admin-login-form');
  const adminError    = document.getElementById('admin-login-error');
  const btnAdmin      = document.getElementById('btn-submit-admin');

  if (!studentTab) return; // Only run on login.html

  /* If already logged in → redirect to dashboard */
  if (isLoggedIn()) {
    const session = getSession();
    window.location.href = session.isAdmin ? 'admin_dashboard.html' : 'dashboard.html';
    return;
  }

  let connectedWalletAddress = "";

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

  /* ── Student Phase 1: Connect Wallet ── */
  
  // Access instantly via Virtual Wallet (Frictionless Sandbox)
  btnAccessVirtual?.addEventListener('click', async () => {
    setButtonPending(btnAccessVirtual, true, 'Generating Wallet…', 'Access instantly via Virtual Wallet');
    
    try {
      const { getOrCreateVirtualWallet } = await import("./blockchain.js");
      const addr = getOrCreateVirtualWallet();
      localStorage.setItem("chainCampusWalletType", "virtual");
      
      connectedWalletAddress = addr;
      showToast('Virtual Wallet Generated ✓', addr.slice(0, 10) + '...' + addr.slice(-10), 'success');

      // Query database for this virtual wallet address
      const res = await loginWithWalletOnServer(addr);
      
      if (res.ok && res.user) {
        setSession(res.user);
        updateState(s => { s.walletAddress = addr; return s; });
        showToast('Access Granted 🎉', `Welcome back, ${res.user.name}!`, 'success');
        
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
      } else {
        showToast('Onboarding Required', 'Please complete your academic profile.', 'pending');
        
        const idField = onboardForm.querySelector('[name="studentId"]');
        if (idField) {
          idField.value = 'CC-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        }

        phaseConnect.classList.add('step-hidden');
        phaseOnboard.classList.remove('step-hidden');
      }
    } catch (err) {
      showToast('Connection Failed', err.message || 'Verification failed.', 'failed');
    } finally {
      setButtonPending(btnAccessVirtual, false, '', 'Access instantly via Virtual Wallet');
    }
  });

  // Link Phantom Extension (Advanced Option)
  btnConnectPhantom?.addEventListener('click', async () => {
    setButtonPending(btnConnectPhantom, true, 'Connecting Phantom…', 'Link Phantom Extension (Advanced)');
    
    try {
      localStorage.setItem("chainCampusWalletType", "phantom");
      const addr = await connectWallet();
      if (!addr) {
        setButtonPending(btnConnectPhantom, false, '', 'Link Phantom Extension (Advanced)');
        return;
      }
      
      connectedWalletAddress = addr;
      showToast('Phantom Wallet Connected ✓', addr.slice(0, 10) + '...' + addr.slice(-10), 'success');

      const res = await loginWithWalletOnServer(addr);
      
      if (res.ok && res.user) {
        setSession(res.user);
        updateState(s => { s.walletAddress = addr; return s; });
        showToast('Access Granted 🎉', `Welcome back, ${res.user.name}!`, 'success');
        
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
      } else {
        showToast('Onboarding Required', 'Please complete your academic profile.', 'pending');
        
        const idField = onboardForm.querySelector('[name="studentId"]');
        if (idField) {
          idField.value = 'CC-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        }

        phaseConnect.classList.add('step-hidden');
        phaseOnboard.classList.remove('step-hidden');
      }
    } catch (err) {
      showToast('Phantom Connection Failed', err.message || 'Verification failed. Make sure Phantom is installed.', 'failed');
    } finally {
      setButtonPending(btnConnectPhantom, false, '', 'Link Phantom Extension (Advanced)');
    }
  });

  /* ── Student Phase 2: Complete Onboarding ── */
  onboardForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (onboardError) {
      onboardError.style.display = 'none';
      onboardError.textContent = '';
    }

    const name = onboardForm.name.value.trim();
    const email = onboardForm.email.value.trim();
    const studentId = onboardForm.studentId.value.trim();
    const college = onboardForm.college.value.trim();
    const program = onboardForm.program.value.trim();
    const year = onboardForm.year.value;

    if (!name || !email || !college || !program) {
      showOnboardError('All fields marked required are mandatory.');
      return;
    }

    setButtonPending(btnOnboard, true, 'Marking On-Chain…', 'Complete Onboarding (On-Chain)');
    
    try {
      // 1. Submit mock/real on-chain student registration transaction
      const txResult = await registerStudentOnChain({ studentId, name });
      
      // 2. Post registration metadata to relational backend
      const res = await registerProfileOnServer({
        email,
        name,
        studentId,
        college,
        program,
        year,
        walletAddress: connectedWalletAddress
      });

      if (res.ok && res.user) {
        setSession(res.user);
        updateState(s => {
          s.walletAddress = connectedWalletAddress;
          s.student = { name, studentId, college, program, year };
          return s;
        });

        // Add to transaction log
        await addTransactionOnServer({
          txId: txResult.txId,
          action: "Student Web3 Registration",
          status: "success"
        });

        showToast('Identity Secured! 🚀', 'Your profile is registered on-chain.', 'success');
        
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } else {
        throw new Error(res.error || "Server profile creation failed.");
      }
    } catch (err) {
      console.error("[auth] Onboarding error:", err);
      showOnboardError(err.message || 'On-chain registration failed. Try again.');
      setButtonPending(btnOnboard, false, '', 'Complete Onboarding (On-Chain)');
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
  const form         = document.querySelector('[data-register-form]');
  const submitButton = document.querySelector('[data-register-submit]');
  if (!form || !submitButton) return;

  renderStatusPanel('[data-register-status]', {
    title: 'Ready for submission', badge: 'ON-CHAIN',
    message: 'Submitting will call registerStudentOnChain() from js/blockchain.js.'
  }, 'pending');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    setButtonPending(submitButton, true, 'Transaction Pending…', 'Register (On-Chain)');
    setTransaction('Pending', 'Student registration', 'Registration submitted through wallet-linked flow.', '');
    renderStatusPanel('[data-register-status]', { title: 'Transaction submitted', badge: 'PENDING', message: 'Your wallet is authorising the student registration.' }, 'pending');

    try {
      const result = await registerStudentOnChain(payload);
      
      // Update locally and notify server
      await registerProfileOnServer({
        email: payload.email || 'legacy@lumina.edu',
        name: payload.name,
        studentId: payload.studentId,
        college: payload.college,
        program: payload.program,
        year: payload.year || '3rd Year',
        walletAddress: getState().walletAddress || 'mock_addr'
      });

      await addTransactionOnServer({
        txId: result.txId,
        action: "Student registration (legacy page)",
        status: "success"
      });

      updateState(s => { s.student = { ...s.student, ...payload }; return s; });
      setTransaction('Success', 'Student registration confirmed', 'Identity linked to connected wallet.', result.txId);
      renderStatusPanel('[data-register-status]', { title: 'Registration successful', badge: 'SUCCESS', message: 'Student registered on-chain successfully.', txId: result.txId }, 'success');
      showToast('Registration confirmed ✓', result.txId, 'success');
      form.reset();
    } catch (err) {
      setTransaction('Failed', 'Student registration failed', 'Wallet could not complete registration.', '');
      renderStatusPanel('[data-register-status]', { title: 'Registration failed', badge: 'FAILED', message: 'Check wallet connection and retry.' }, 'failed');
      showToast('Registration failed', 'Check your wallet and try again.', 'failed');
    } finally {
      setButtonPending(submitButton, false, 'Transaction Pending…', 'Register (On-Chain)');
    }
  });
}

initLoginPage();
initRegisterPage();
