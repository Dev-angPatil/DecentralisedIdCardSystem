import { createEventOnChain, registerForEventOnChain } from "./blockchain.js";
import {
  getState,
  renderStatusPanel,
  setButtonPending,
  setTransaction,
  showToast,
  updateState
} from "./main.js";

function renderEvents() {
  const target = document.querySelector("[data-events-list]");
  if (!target) {
    return;
  }

  const state = getState();
  target.innerHTML = state.events
    .map(
      (event) => `
        <article class="event-card glass-card" data-event-card="${event.id}">
          <div class="card-top">
            <div>
              <span class="chain-tag">On-Chain Event</span>
              <h3>${event.title}</h3>
              <p class="event-meta">${event.date} | ${event.venue}</p>
            </div>
            ${event.verified ? '<span class="verified-badge">Verified</span>' : ""}
          </div>
          <p>${event.description}</p>
          <div class="event-actions">
            <span class="small-copy">Uses registerForEventOnChain()</span>
            <button type="button" class="primary-btn" data-register-event="${event.id}" ${
              event.verified ? "disabled" : ""
            }>
              ${event.verified ? "Registered (Verified)" : "Register (Blockchain Verified)"}
            </button>
          </div>
        </article>
      `
    )
    .join("");

  bindEventButtons();
}

function bindEventButtons() {
  document.querySelectorAll("[data-register-event]").forEach((button) => {
    button.onclick = async () => {
      const eventId = button.dataset.registerEvent;
      const state = getState();
      const eventItem = state.events.find((item) => item.id === eventId);

      if (!eventItem || eventItem.verified) {
        return;
      }

      setButtonPending(
        button,
        true,
        "Transaction Pending...",
        "Register (Blockchain Verified)"
      );
      setTransaction(
        "Pending",
        `Event registration: ${eventItem.title}`,
        "Transaction submitted for blockchain-verified event registration.",
        ""
      );

      try {
        const result = await registerForEventOnChain(eventItem);
        updateState((nextState) => {
          nextState.events = nextState.events.map((item) =>
            item.id === eventId ? { ...item, verified: true } : item
          );
          return nextState;
        });
        setTransaction(
          "Success",
          `Event registration confirmed`,
          `${eventItem.title} is now verified.`,
          result.txId
        );
        showToast("Event verified", result.txId, "success");
        renderEvents();
      } catch (error) {
        setTransaction(
          "Failed",
          `Event registration failed`,
          "The mock blockchain registration was not completed.",
          ""
        );
        showToast("Event registration failed", "Try the mock action again.", "failed");
        setButtonPending(
          button,
          false,
          "Transaction Pending...",
          "Register (Blockchain Verified)"
        );
      }
    };
  });
}

function initCreateEvent() {
  const form = document.querySelector("[data-create-event-form]");
  const submitButton = document.querySelector("[data-create-event-submit]");
  if (!form || !submitButton) {
    return;
  }

  renderStatusPanel(
    "[data-create-event-status]",
    {
      title: "Admin event creation ready",
      badge: "ON-CHAIN",
      message: "Submitting this form will call createEventOnChain() inside js/blockchain.js."
    },
    "pending"
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());

    setButtonPending(
      submitButton,
      true,
      "Transaction Pending...",
      "Create Event (Blockchain)"
    );
    setTransaction(
      "Pending",
      "Admin event creation",
      "Blockchain placeholder is creating the event.",
      ""
    );

    try {
      const result = await createEventOnChain(payload);
      updateState((state) => {
        state.events.unshift({
          id: "evt_" + Date.now(),
          title: payload.title,
          date: payload.date,
          venue: payload.venue,
          description: "Admin-created event routed through blockchain.js.",
          verified: false
        });
        return state;
      });
      setTransaction(
        "Success",
        "Admin event creation confirmed",
        "New event created through the mock blockchain layer.",
        result.txId
      );
      renderStatusPanel(
        "[data-create-event-status]",
        {
          title: "Event created",
          badge: "SUCCESS",
          message: "The admin event was created through createEventOnChain().",
          txId: result.txId
        },
        "success"
      );
      showToast("Event created", result.txId, "success");
      form.reset();
      renderEvents();
    } catch (error) {
      setTransaction(
        "Failed",
        "Admin event creation failed",
        "The blockchain placeholder could not create the event.",
        ""
      );
      renderStatusPanel(
        "[data-create-event-status]",
        {
          title: "Event creation failed",
          badge: "FAILED",
          message: "The mock blockchain event creation flow did not finish."
        },
        "failed"
      );
      showToast("Event creation failed", "Mock blockchain action failed.", "failed");
    } finally {
      setButtonPending(
        submitButton,
        false,
        "Transaction Pending...",
        "Create Event (Blockchain)"
      );
    }
  });
}

renderEvents();
initCreateEvent();
