import { registerStudentOnChain } from "./blockchain.js";
import {
  connectWallet, requireConnectedWallet, renderStatusPanel,
  setButtonPending, setTransaction, showToast, updateState,
  updateWalletCopy, getSession, setSession, clearSession,
  getUserByEmail, saveUser, isLoggedIn, getState
} from "./main.js";

/* ══════════════ LOGIN PAGE ═══════════════════════════════ */
function initLoginPage(){
  const form       = document.querySelector('[data-login-form]');
  const step1      = document.querySelector('[data-step-1]');
  const step2      = document.querySelector('[data-step-2]');
  const errMsg     = document.querySelector('[data-login-error]');
  const walletBtn  = document.querySelector('[data-connect-wallet-login]');
  const skipBtn    = document.querySelector('[data-skip-wallet]');
  if(!form) return;

  /* If already logged in → go to correct dashboard */
  if(isLoggedIn()){
    const s = getSession();
    window.location.href = s.isAdmin ? 'admin_dashboard.html' : 'dashboard.html';
    return;
  }

  let pendingUser = null;

  /* Step 1 — credentials */
  form.addEventListener('submit', e => {
    e.preventDefault();
    clearError(errMsg);
    const email    = form.email.value.trim();
    const password = form.password.value;

    if(!email || !password){
      showError(errMsg, 'Please enter your email and password.');
      return;
    }

    const user = getUserByEmail(email);
    if(!user || user.password !== password){
      showError(errMsg, 'Invalid email or password.');
      markInvalid(form.email);
      markInvalid(form.password);
      return;
    }

    pendingUser = user;
    /* Advance to step 2 */
    step1.classList.add('step-hidden');
    step2.classList.remove('step-hidden');
    document.querySelector('[data-step-num]').textContent = '2';
    showToast('Credentials verified ✓', 'Now connect your Phantom wallet.', 'success');
  });

  /* Step 2 — Phantom wallet */
  walletBtn?.addEventListener('click', async () => {
    if(!pendingUser){ window.location.reload(); return; }
    const addr = await connectWallet();
    if(!addr){ return; }

    pendingUser.walletAddress = addr;
    saveUser(pendingUser);
    updateState(s => { s.walletAddress = addr; return s; });

    setSession(pendingUser);
    showToast('Login successful 🎉', `Welcome back, ${pendingUser.name}!`, 'success');
    const target = pendingUser.isAdmin ? 'admin_dashboard.html' : 'dashboard.html';
    setTimeout(()=>{ window.location.href = target; }, 900);
  });

  /* Step 2 — Skip wallet */
  skipBtn?.addEventListener('click', () => {
    if(!pendingUser){ window.location.reload(); return; }
    
    setSession(pendingUser);
    showToast('Login successful', `Welcome back, ${pendingUser.name}!`, 'success');
    const target = pendingUser.isAdmin ? 'admin_dashboard.html' : 'dashboard.html';
    setTimeout(()=>{ window.location.href = target; }, 600);
  });

  updateWalletCopy();
}

/* ══════════════ REGISTER PAGE ════════════════════════════ */
function initRegisterPage(){
  const form         = document.querySelector('[data-register-form]');
  const submitButton = document.querySelector('[data-register-submit]');
  if(!form || !submitButton) return;

  renderStatusPanel('[data-register-status]',{
    title:'Ready for submission', badge:'ON-CHAIN',
    message:'Submitting will call registerStudentOnChain() from js/blockchain.js.'
  },'pending');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if(!(await requireConnectedWallet({ message:'Connect your wallet before registering on-chain.' }))) return;

    const payload = Object.fromEntries(new FormData(form).entries());
    setButtonPending(submitButton, true, 'Transaction Pending…', 'Register (On-Chain)');
    setTransaction('Pending','Student registration','Registration submitted through wallet-linked flow.','');
    renderStatusPanel('[data-register-status]',{ title:'Transaction submitted', badge:'PENDING', message:'Your wallet is authorising the student registration.' },'pending');

    try{
      const result = await registerStudentOnChain(payload);
      updateState(s => { s.student = { ...s.student, ...payload }; return s; });
      setTransaction('Success','Student registration confirmed','Identity linked to connected wallet.',result.txId);
      renderStatusPanel('[data-register-status]',{ title:'Registration successful', badge:'SUCCESS', message:'Student registered on-chain successfully.', txId:result.txId },'success');
      showToast('Registration confirmed ✓', result.txId, 'success');
      form.reset();
    }catch(err){
      setTransaction('Failed','Student registration failed','Wallet could not complete registration.','');
      renderStatusPanel('[data-register-status]',{ title:'Registration failed', badge:'FAILED', message:'Check wallet connection and retry.' },'failed');
      showToast('Registration failed','Check your wallet and try again.','failed');
    }finally{
      setButtonPending(submitButton, false, 'Transaction Pending…', 'Register (On-Chain)');
    }
  });
}

/* ══════════════ HELPERS ══════════════════════════════════ */
function showError(el, msg){ if(el){ el.textContent = msg; el.classList.add('visible'); } }
function clearError(el)    { if(el){ el.textContent = ''; el.classList.remove('visible'); } }
function markInvalid(input){ if(input){ input.classList.add('input-error'); input.addEventListener('input',()=>input.classList.remove('input-error'),{once:true}); } }

initLoginPage();
initRegisterPage();
