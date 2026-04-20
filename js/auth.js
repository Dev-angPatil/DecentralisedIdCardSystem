import { registerStudentOnChain } from "./blockchain.js";
import {
  connectWallet,
  requireConnectedWallet,
  renderStatusPanel,
  setButtonPending,
  setTransaction,
  showToast,
  updateState,
  updateWalletCopy
} from "./main.js";

function initLoginPage() {
  const loginForm = document.querySelector("[data-login-form]");
  const authMessage = document.querySelector("[data-auth-message]");
  const googleButton = document.querySelector("[data-google-login]");
  if (!loginForm || !authMessage || !googleButton) {
    return;
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    authMessage.textContent = "Sign-in is captured. The next step is activating the student's wallet for blockchain actions.";
    showToast("Sign-in captured", "Connect the wallet to activate on-chain student actions.", "pending");
  });

  googleButton.addEventListener("click", () => {
    authMessage.textContent = "Google sign-in is shown as an optional campus login path before wallet activation.";
    showToast("Google sign-in", "Complete sign-in, then activate the wallet.", "pending");
  });

  updateWalletCopy();
  document.querySelectorAll("[data-connect-wallet]").forEach((button) => {
    button.onclick = () => connectWallet();
  });
}

function initRegisterPage() {
  const form = document.querySelector("[data-register-form]");
  const submitButton = document.querySelector("[data-register-submit]");
  if (!form || !submitButton) {
    return;
  }

  renderStatusPanel(
    "[data-register-status]",
    {
      title: "Ready for submission",
      badge: "ON-CHAIN",
      message: "Submitting the form will call registerStudentOnChain() from js/blockchain.js."
    },
    "pending"
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!(await requireConnectedWallet({
      message: "Connect your wallet before registering your student identity on-chain."
    }))) {
      return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    setButtonPending(submitButton, true, "Transaction Pending...", "Register (On-Chain)");
    setTransaction(
      "Pending",
      "Student registration",
      "Registration request submitted through the wallet-linked student flow.",
      ""
    );
    renderStatusPanel(
      "[data-register-status]",
      {
        title: "Transaction submitted",
        badge: "PENDING",
        message: "Your connected wallet is authorizing the student registration flow."
      },
      "pending"
    );

    try {
      const result = await registerStudentOnChain(payload);
      updateState((state) => {
        state.student = {
          ...state.student,
          ...payload
        };
        return state;
      });

      setTransaction(
        "Success",
        "Student registration confirmed",
        "Student identity has been linked to the connected wallet.",
        result.txId
      );
      renderStatusPanel(
        "[data-register-status]",
        {
          title: "Registration successful",
          badge: "SUCCESS",
          message: "Student registration completed through the wallet-linked blockchain flow.",
          txId: result.txId
        },
        "success"
      );
      showToast("Registration confirmed", result.txId, "success");
      form.reset();
    } catch (error) {
      setTransaction(
        "Failed",
        "Student registration failed",
        "The wallet-linked registration flow returned an error.",
        ""
      );
      renderStatusPanel(
        "[data-register-status]",
        {
          title: "Registration failed",
          badge: "FAILED",
          message: "The connected wallet could not complete student registration."
        },
        "failed"
      );
      showToast("Registration failed", "Check the connected wallet and try again.", "failed");
    } finally {
      setButtonPending(submitButton, false, "Transaction Pending...", "Register (On-Chain)");
    }
  });
}

initLoginPage();
initRegisterPage();
