import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useApi } from "../hooks/useApi";
import { useBlockchain } from "../hooks/useBlockchain";
import { Calendar, Users, Link as LinkIcon, Check } from "lucide-react";

export function Events() {
  const { state, refreshData, showToast } = useApp();
  const { registerEvent, loading } = useApi();
  const { registerForEventOnChain } = useBlockchain();

  const handleRegister = async (event) => {
    setLocalLoading(prev => ({ ...prev, [event.id]: true }));
    try {
      // 1. Submit on chain transaction
      await registerForEventOnChain(event.id, event.title);

      // 2. Submit database event registration
      await registerEvent(event.id);

      showToast("Registered Successfully ✓", `You have successfully registered for ${event.title}.`, "success");
      await refreshData();
    } catch (err) {
      showToast("Registration failed", err.message, "failed");
    } finally {
      setLocalLoading(prev => ({ ...prev, [event.id]: false }));
    }
  };

  const [localLoading, setLocalLoading] = useState({});

  return (
    <div style={{ textAlign: "left" }}>
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>
          Campus Events Calendar
        </h3>
        <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "4px" }}>
          Explore campus technology workshops, summits, and hackathons. Registering maps your cryptographic address.
        </p>
      </div>

      <div className="feature-grid">
        {state.events && state.events.map((event) => {
          // Check if user is enrolled (we can store inside registered users or fallback)
          // In the database model, let's see if we have isRegistered or if we can track it
          const isRegistered = event.isRegistered || false;
          const isLoading = localLoading[event.id];

          return (
            <div key={event.id} className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "20px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <span className="status-badge" style={{ background: "rgba(20, 184, 166, 0.06)", border: "1px solid rgba(20, 184, 166, 0.18)", color: "#14b8a6", textTransform: "uppercase" }}>
                    {event.date}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    <Users size={12} />
                    <span>Capacity: {event.capacity}</span>
                  </div>
                </div>
                <h4 style={{ margin: "0 0 8px", fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
                  {event.title}
                </h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-soft)", margin: "0 0 12px", minHeight: "36px", lineHeights: 1.4 }}>
                  {event.description}
                </p>
                <div style={{ background: "var(--bg-alt)", borderRadius: "8px", padding: "10px", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Venue: <strong style={{ color: "var(--text-soft)" }}>{event.venue}</strong>
                </div>
              </div>

              <div>
                {isRegistered ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "0.78rem", fontWeight: 700 }}>
                      <Check size={14} />
                      <span>Verifiably Registered</span>
                    </div>
                    {event.txId && (
                      <div className="mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <LinkIcon size={10} />
                        <span>{event.txId.substring(0, 16)}...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    className="btn btn-primary btn-full"
                    onClick={() => handleRegister(event)}
                    disabled={isLoading || loading}
                    style={{ fontSize: "0.7rem", padding: "10px 14px", borderRadius: "10px" }}
                  >
                    {isLoading ? "Signing Ledger..." : "Register Ticket"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default Events;
