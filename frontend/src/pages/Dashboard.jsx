import React from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { IdCard } from "../components/IdCard";
import { Bell, Trophy, BookOpen, CalendarRange, Wallet, Check } from "lucide-react";

export function Dashboard() {
  const { state } = useApp();
  const { session } = useAuth();

  const getStats = () => {
    const eventCount = state.events ? state.events.length : 0;
    const attendanceCount = state.attendanceRecords ? state.attendanceRecords.length : 0;
    const scholarshipCount = state.scholarshipApplications ? state.scholarshipApplications.length : 0;
    return { eventCount, attendanceCount, scholarshipCount };
  };

  const { eventCount, attendanceCount, scholarshipCount } = getStats();

  return (
    <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header section with Editorial Typography */}
      <div style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.05)", paddingBottom: "24px" }}>
        <h3 style={{ fontSize: "clamp(2rem, 3.5vw, 2.6rem)", fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", margin: 0, color: "var(--text)", lineHeight: 1.1 }}>
          Welcome back, {session?.name}!
        </h3>
        <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "8px", maxWidth: "600px", lineHeight: 1.6 }}>
          Access your verifiable student ledger parameters, enrolled courses timetable, and active scholarship claims synced securely on the network.
        </p>
      </div>

      {/* Main Grid Wrapper - fully responsive on mobile/tablet */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: "32px",
          alignItems: "start" 
        }}
      >
        {/* Left Columns: Stats & Notices */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px" }}>
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>Events List</span>
                <CalendarRange size={16} style={{ color: "#6366f1" }} />
              </div>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)" }}>
                {eventCount}
              </h2>
            </div>
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>Attendances</span>
                <BookOpen size={16} style={{ color: "#14b8a6" }} />
              </div>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)" }}>
                {attendanceCount}
              </h2>
            </div>
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>Scholarships</span>
                <Trophy size={16} style={{ color: "#fbbf24" }} />
              </div>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)" }}>
                {scholarshipCount}
              </h2>
            </div>
          </div>

          {/* Notices Board */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: "8px", color: "var(--text)" }}>
              <Bell size={16} style={{ color: "#6366f1" }} />
              Official Campus Announcements
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {state.notifications && state.notifications.length > 0 ? (
                state.notifications.map((n, idx) => (
                  <div key={idx} className="notice-item" style={{ background: "var(--bg-alt)", border: "1px solid var(--stroke-soft)", padding: "16px", borderRadius: "12px", textAlign: "left" }}>
                    <strong style={{ fontSize: "0.85rem", color: "var(--text)", fontFamily: "'Space Grotesk', sans-serif" }}>{n.title}</strong>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-soft)", margin: "4px 0 0", lineHeight: 1.5 }}>{n.desc}</p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", padding: "16px", border: "1px dashed var(--stroke)", borderRadius: "10px" }}>
                  No active announcements at the moment.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Digital ID Preview & Quick Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", alignItems: "center" }}>
          <div 
            className="glass-card" 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "28px", 
              alignItems: "center",
              padding: "32px",
              borderRadius: "20px",
              background: "rgba(255, 255, 255, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(20px)",
              width: "100%"
            }}
          >
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", alignSelf: "flex-start", color: "var(--text)" }}>
              Your On-Chain ID Card
            </h4>
            <IdCard />
          </div>

          <div className="glass-card" style={{ width: "100%", textAlign: "left", padding: "28px", borderRadius: "18px" }}>
            <h5 style={{ margin: "0 0 16px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 600 }}>
              Verifiable Ledger Parameters
            </h5>
            <div className="info-row">
              <span style={{ fontSize: "0.8rem" }}>Identity Wallet</span>
              <strong className="mono" style={{ fontSize: "0.7rem", color: "#6366f1" }}>
                {session?.walletAddress ? session.walletAddress.substring(0, 16) + "..." : "Unlinked"}
              </strong>
            </div>
            <div className="info-row">
              <span style={{ fontSize: "0.8rem" }}>Smart Contract Status</span>
              <strong style={{ color: "#10b981", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "3px" }}>
                <Check size={12} /> Active & Syncing
              </strong>
            </div>
            <div className="info-row">
              <span style={{ fontSize: "0.8rem" }}>Transaction Logs</span>
              <strong style={{ fontSize: "0.8rem" }}>{state.txLog ? state.txLog.length : 0} logs</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Dashboard;
