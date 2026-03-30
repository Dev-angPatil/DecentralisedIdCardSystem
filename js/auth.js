import { registerStudentOnChain } from "./blockchain.js";
import {
  connectWallet,
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
    authMessage.textContent = "Login UI submitted. Backend auth is intentionally not connected in this mock.";
    showToast("Login submitted", "Authentication is UI-only for this demo.", "pending");
  });

  googleButton.addEventListener("click", () => {
    authMessage.textContent = "Google login is a placeholder button in this demo.";
    showToast("Google login", "Third-party auth UI placeholder clicked.", "pending");
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
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    setButtonPending(submitButton, true, "Transaction Pending...", "Register (On-Chain)");
    setTransaction(
      "Pending",
      "Student registration",
      "Transaction submitted. Waiting for blockchain placeholder response.",
      ""
    );
    renderStatusPanel(
      "[data-register-status]",
      {
        title: "Transaction submitted",
        badge: "PENDING",
        message: "registerStudentOnChain() is simulating a blockchain confirmation."
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
        "Student identity has been registered through the mock on-chain flow.",
        result.txId
      );
      renderStatusPanel(
        "[data-register-status]",
        {
          title: "Registration successful",
          badge: "SUCCESS",
          message: "Student registration completed through js/blockchain.js.",
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
        "The blockchain placeholder returned an error.",
        ""
      );
      renderStatusPanel(
        "[data-register-status]",
        {
          title: "Registration failed",
          badge: "FAILED",
          message: "The mock blockchain registration flow was not completed."
        },
        "failed"
      );
      showToast("Registration failed", "Mock blockchain action failed.", "failed");
    } finally {
      setButtonPending(submitButton, false, "Transaction Pending...", "Register (On-Chain)");
    }
  });
}

initLoginPage();
initRegisterPage();
