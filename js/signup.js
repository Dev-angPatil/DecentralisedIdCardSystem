import { saveUser, getUserByEmail, showToast } from "./main.js";

function showError(el, msg){ if(el){ el.textContent=msg; el.classList.add('visible'); } }
function clearError(el)    { if(el){ el.textContent='';  el.classList.remove('visible'); } }
function markInvalid(input){ if(!input) return; input.classList.add('input-error'); input.addEventListener('input',()=>input.classList.remove('input-error'),{once:true}); }

function initSignup(){
  const form    = document.querySelector('[data-signup-form]');
  const errMsg  = document.querySelector('[data-signup-error]');
  const submitB = document.querySelector('[data-signup-submit]');
  if(!form) return;

  /* Auto-generate student ID */
  const idField = form.querySelector('[name="studentId"]');
  if(idField && !idField.value){
    idField.value = 'CC-' + new Date().getFullYear() + '-' + Math.floor(1000+Math.random()*9000);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearError(errMsg);

    const name     = form.name.value.trim();
    const email    = form.email.value.trim();
    const password = form.password.value;
    const confirm  = form.confirm.value;
    const studentId= form.studentId.value.trim();
    const college  = form.college.value.trim();
    const program  = form.program.value.trim();
    const year     = form.year.value;

    if(!name||!email||!password||!studentId||!college||!program||!year){
      showError(errMsg,'Please fill in all fields.');
      return;
    }
    if(!/\S+@\S+\.\S+/.test(email)){
      showError(errMsg,'Please enter a valid email address.');
      markInvalid(form.email); return;
    }
    if(password.length < 6){
      showError(errMsg,'Password must be at least 6 characters.');
      markInvalid(form.password); return;
    }
    if(password !== confirm){
      showError(errMsg,'Passwords do not match.');
      markInvalid(form.confirm); return;
    }
    if(getUserByEmail(email)){
      showError(errMsg,'An account with this email already exists. Please log in.');
      markInvalid(form.email); return;
    }

    saveUser({ name, email, password, studentId, college, program, year, walletAddress:'', createdAt: new Date().toISOString() });

    submitB.textContent = 'Account Created ✓';
    submitB.disabled    = true;

    /* small local toast */
    const stack = document.querySelector('[data-toast-stack]');
    if(stack){ const t=document.createElement('div'); t.className='toast glass-card'; t.innerHTML=`<strong>Account created 🎉</strong><p>Redirecting to login…</p>`; stack.prepend(t); setTimeout(()=>t.remove(),3000); }

    setTimeout(()=>{ window.location.href='login.html'; }, 1200);
  });

  /* Password strength meter */
  form.password?.addEventListener('input', e => {
    const bar = document.querySelector('[data-strength-bar]');
    const lbl = document.querySelector('[data-strength-label]');
    if(!bar||!lbl) return;
    const v = e.target.value;
    let score = 0;
    if(v.length >= 6)  score++;
    if(v.length >= 10) score++;
    if(/[A-Z]/.test(v)) score++;
    if(/[0-9]/.test(v)) score++;
    if(/[^a-zA-Z0-9]/.test(v)) score++;
    const labels = ['','Weak','Fair','Good','Strong','Very Strong'];
    const classes= ['','weak','fair','good','strong','strong'];
    bar.style.width = (score*20)+'%';
    bar.className = 'strength-fill '+(classes[score]||'');
    lbl.textContent = labels[score]||'';
  });
}

initSignup();
