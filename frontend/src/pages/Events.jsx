import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useApi } from "../hooks/useApi";
import { useBlockchain } from "../hooks/useBlockchain";
import { useAuth } from "../context/AuthContext";
import { Calendar, Users, Link as LinkIcon, Check, MapPin, Ticket } from "lucide-react";

export function Events() {
  const { state, refreshData, showToast } = useApp();
  const { registerEvent, loading } = useApi();
  const { registerForEventOnChain } = useBlockchain();
  const { session } = useAuth();

  const filteredEvents = (state.events || []).filter((event) => {
    // Admins see all events
    if (session?.isAdmin) return true;

    // Check college eligibility
    const hasCollege = !event.eligibleColleges || 
                       event.eligibleColleges.includes("all") || 
                       event.eligibleColleges.includes(session?.college);

    // Check branch eligibility
    const hasBranch = !event.eligibleBranches || 
                      event.eligibleBranches.includes("all") || 
                      event.eligibleBranches.includes(session?.program);

    // Check year eligibility
    const hasYear = !event.eligibleYears || 
                    event.eligibleYears.includes("all") || 
                    event.eligibleYears.includes(session?.year);

    return hasCollege && hasBranch && hasYear;
  });

  const handleRegister = async (event) => {
    setLocalLoading(prev => ({ ...prev, [event.id]: true }));
    try {
      // 1. Submit on chain transaction
      const blockchainRes = await registerForEventOnChain(event.id, event.title);

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
    <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header section with Editorial Typography */}
      <div style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.05)", paddingBottom: "24px" }}>
        <h3 style={{ fontSize: "clamp(2rem, 3.5vw, 2.6rem)", fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", margin: 0, color: "var(--text)", lineHeight: 1.1 }}>
          Campus Events Calendar
        </h3>
        <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "8px", maxWidth: "600px", lineHeight: 1.6 }}>
          Explore campus technology workshops, hackathons, and guest summits. Registering your ticket signs a cryptographic entry and logs your attendance verifiably on the blockchain ledger.
        </p>
      </div>

      {/* Grid containing the cards - fully responsive */}
      <div className="feature-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {filteredEvents && filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const isRegistered = event.isRegistered || false;
            const isLoading = localLoading[event.id];

            return (
              <div 
                key={event.id} 
                className="glass-card" 
                style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  justifyContent: "space-between", 
                  gap: "24px", 
                  padding: "28px",
                  background: "#ffffff",
                  border: "1px solid var(--stroke)",
                  borderRadius: "18px",
                  transition: "transform 0.2s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.2s ease-out"
                }}
              >
                <div>
                  {/* Meta details header inside card */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span className="status-badge" style={{ background: "rgba(15, 23, 42, 0.03)", border: "1px solid var(--stroke)", color: "var(--text-soft)", textTransform: "uppercase", fontSize: "0.62rem", letterSpacing: "0.04em", fontWeight: 700, padding: "4px 10px" }}>
                      {event.date}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      <Users size={12} style={{ color: "var(--text-soft)" }} />
                      <span>Capacity: {event.capacity}</span>
                    </div>
                  </div>

                  {/* Event Name */}
                  <h4 style={{ margin: "0 0 10px", fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
                    {event.title}
                  </h4>

                  {/* Description */}
                  <p style={{ fontSize: "0.82rem", color: "var(--text-soft)", margin: "0 0 16px", lineHeight: 1.5, minHeight: "36px" }}>
                    {event.description}
                  </p>

                  {/* Venue Details */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-alt)", border: "1px solid var(--stroke-soft)", borderRadius: "10px", padding: "10px 14px", fontSize: "0.72rem", color: "var(--text-soft)" }}>
                    <MapPin size={12} style={{ color: "#6366f1" }} />
                    <span>Venue: <strong>{event.venue}</strong></span>
                  </div>
                </div>

                {/* Action and Signatures */}
                <div style={{ borderTop: "1px solid var(--stroke-soft)", paddingTop: "16px", marginTop: "8px" }}>
                  {isRegistered ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--teal)", fontSize: "0.78rem", fontWeight: 700 }}>
                        <Check size={14} style={{ color: "var(--teal)" }} />
                        <span>Verifiably Mapped On-Chain</span>
                      </div>
                      {event.txId && (
                        <a 
                          href={`https://explorer.solana.com/tx/${event.txId}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mono" 
                          style={{ 
                            fontSize: "0.62rem", 
                            color: "#6366f1", 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "4px",
                            textDecoration: "underline",
                            transition: "color 0.15s ease"
                          }}
                        >
                          <LinkIcon size={10} />
                          <span>Explorer: {event.txId.substring(0, 14)}...</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <button 
                      className="btn btn-primary btn-full"
                      onClick={() => handleRegister(event)}
                      disabled={isLoading || loading}
                      style={{ 
                        fontSize: "0.7rem", 
                        padding: "12px 16px", 
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                      }}
                    >
                      <Ticket size={12} />
                      <span>{isLoading ? "Signing Ledger..." : "Register Ticket"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ gridColumn: "1/-1", padding: "60px 40px", border: "1px dashed var(--stroke)", borderRadius: "18px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
            No campus events currently scheduled matching your college, branch, or academic year criteria.
          </div>
        )}
      </div>
    </div>
  );
}
export default Events;
