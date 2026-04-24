import { createEventOnChain, registerForEventOnChain } from "./blockchain.js";
import {
  getState,
  requireConnectedWallet,
  renderStatusPanel,
  setButtonPending,
  setTransaction,
  showToast,
  updateState,
  fetchEvents
} from "./main.js";

async function renderEvents() {
  const target = document.querySelector("[data-events-list]");
  if (!target) {
    return;
  }

  target.innerHTML = '<p class="small-copy">Loading events from database...</p>';
  const events = await fetchEvents();

  target.innerHTML = events
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
    .join("") || '<p class="small-copy">No events found.</p>';

  bindEventButtons(events);
}

function bindEventButtons(events) {
  document.querySelectorAll("[data-register-event]").forEach((button) => {
    button.onclick = async () => {
      if (!(await requireConnectedWallet({
        message: "Connect your wallet before registering for events."
      }))) {
        return;
      }

      const eventId = button.dataset.registerEvent;
      const eventItem = events.find((item) => item.id === eventId);

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
          "The connected wallet could not complete event registration.",
          ""
        );
        showToast("Event registration failed", "Check the connected wallet and try again.", "failed");
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

renderEvents();
