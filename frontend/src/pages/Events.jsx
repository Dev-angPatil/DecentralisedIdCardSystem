import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useApi } from "../hooks/useApi";
import { useBlockchain } from "../hooks/useBlockchain";
import { useAuth } from "../context/AuthContext";
import { Calendar, Users, Link as LinkIcon, Check, MapPin, Ticket } from "lucide-react";

// Curated high-fidelity accent palettes to match ChainCampus serene design system
const GLOW_COLORS = {
  indigo: {
    border: "rgba(99, 102, 241, 0.35)",
    glow: "rgba(99, 102, 241, 0.15)",
    glowHigh: "rgba(99, 102, 241, 0.25)",
    badgeBg: "rgba(99, 102, 241, 0.06)",
    badgeBorder: "rgba(99, 102, 241, 0.18)",
    badgeText: "#6366f1",
  },
  emerald: {
    border: "rgba(16, 185, 129, 0.35)",
    glow: "rgba(16, 185, 129, 0.15)",
    glowHigh: "rgba(16, 185, 129, 0.25)",
    badgeBg: "rgba(16, 185, 129, 0.06)",
    badgeBorder: "rgba(16, 185, 129, 0.18)",
    badgeText: "#10b981",
  },
  amber: {
    border: "rgba(245, 158, 11, 0.35)",
    glow: "rgba(245, 158, 11, 0.15)",
    glowHigh: "rgba(245, 158, 11, 0.25)",
    badgeBg: "rgba(245, 158, 11, 0.06)",
    badgeBorder: "rgba(245, 158, 11, 0.18)",
    badgeText: "#f59e0b",
  },
  teal: {
    border: "rgba(20, 184, 166, 0.35)",
    glow: "rgba(20, 184, 166, 0.15)",
    glowHigh: "rgba(20, 184, 166, 0.25)",
    badgeBg: "rgba(20, 184, 166, 0.06)",
    badgeBorder: "rgba(20, 184, 166, 0.18)",
    badgeText: "#14b8a6",
  },
};

const getEventTheme = (event, isRegistered) => {
  if (isRegistered) return GLOW_COLORS.emerald; // Verifiably registered events get distinctive emerald green glow accents
  
  const title = (event.title || "").toLowerCase();
  if (title.includes("hack") || title.includes("tech") || title.includes("ai") || title.includes("blockchain")) {
    return GLOW_COLORS.indigo;
  }
  if (title.includes("summit") || title.includes("alumni") || title.includes("guest") || title.includes("lecture")) {
    return GLOW_COLORS.amber;
  }
  return GLOW_COLORS.teal;
};

export function Events() {
  const { state, refreshData, showToast } = useApp();
  const { registerEvent, loading } = useApi();
  const { registerForEventOnChain } = useBlockchain();
  const { session } = useAuth();
  const [hoveredCardId, setHoveredCardId] = useState(null);

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
            const theme = getEventTheme(event, isRegistered);
            const isHovered = hoveredCardId === event.id;

            return (
              <div 
                key={event.id} 
                className="glass-card"
                onMouseEnter={() => setHoveredCardId(event.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  justifyContent: "space-between", 
                  gap: "24px", 
                  padding: "28px",
                  background: "var(--surface)",
                  borderRadius: "18px",
                  transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s ease, box-shadow 0.4s ease",
                  
                  // Steady glow border + breathing shadow if registered, or glow-lift on hover
                  border: isRegistered 
                    ? `1px solid ${theme.border}` 
                    : isHovered 
                      ? `1px solid ${theme.border}` 
                      : "1px solid var(--stroke)",
                      
                  boxShadow: isRegistered
                    ? isHovered
                      ? `0 20px 45px ${theme.glowHigh}, 0 4px 12px ${theme.glow}, inset 0 0 16px rgba(16, 185, 129, 0.08)`
                      : `0 8px 30px ${theme.glow}, inset 0 0 12px rgba(16, 185, 129, 0.04)`
                    : isHovered
                      ? `0 20px 40px ${theme.glow}, 0 4px 12px ${theme.glowHigh}`
                      : "var(--shadow-md)",
                      
                  transform: isHovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
                  
                  // Pulse ambient card shadow animation when verified and not hovered
                  animation: isRegistered && !isHovered 
                    ? "card-glow-breathing 4s infinite ease-in-out" 
                    : "none",
                  
                  // Inject custom variables for the keyframe animation
                  "--pulse-glow": theme.glow,
                  "--pulse-glow-high": theme.glowHigh
                }}
              >
                <div>
                  {/* Meta details header inside card */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span 
                      className="status-badge" 
                      style={{ 
                        background: theme.badgeBg, 
                        border: `1px solid ${theme.badgeBorder}`, 
                        color: theme.badgeText, 
                        textTransform: "uppercase", 
                        fontSize: "0.62rem", 
                        letterSpacing: "0.04em", 
                        fontWeight: 700, 
                        padding: "4px 10px" 
                      }}
                    >
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
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--teal)", fontSize: "0.78rem", fontWeight: 700 }}>
                        <span 
                          className="animate-pulse-led"
                          style={{ 
                            display: "inline-block", 
                            width: "6px", 
                            height: "6px", 
                            borderRadius: "50%", 
                            background: "var(--teal)" 
                          }} 
                        />
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

