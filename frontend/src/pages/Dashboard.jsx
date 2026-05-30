import React from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { IdCard } from "../components/IdCard";
import { Bell, Trophy, BookOpen, CalendarRange } from "lucide-react";

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
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "32px" }}>
      {/* Left Columns: Stats & Notices */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* Welcome Block */}
        <div style={{ textAlign: "left" }}>
          <h3 style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>
            Welcome back, {session?.name}!
          </h3>
          <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "4px" }}>
            Access your verifiable student ledger parameters, classes timetable, and scholarship claims.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>Events List</span>
              <CalendarRange size={16} style={{ color: "#6366f1" }} />
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>
              {eventCount}
            </h2>
          </div>
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>Attendances</span>
              <BookOpen size={16} style={{ color: "#14b8a6" }} />
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>
              {attendanceCount}
            </h2>
          </div>
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>Scholarships</span>
              <Trophy size={16} style={{ color: "#fbbf24" }} />
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>
              {scholarshipCount}
            </h2>
          </div>
        </div>

        {/* Notices Board */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: "8px" }}>
            <Bell size={16} style={{ color: "#6366f1" }} />
            Official Campus Announcements
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {state.notifications && state.notifications.length > 0 ? (
              state.notifications.map((n, idx) => (
                <div key={idx} className="notice-item" style={{ background: "var(--bg-alt)", border: "1px solid var(--stroke)", padding: "16px", borderRadius: "12px", textAlign: "left" }}>
                  <strong style={{ fontSize: "0.85rem", color: "var(--text)" }}>{n.title}</strong>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-soft)", margin: "4px 0 0" }}>{n.desc}</p>
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
        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", alignSelf: "flex-start" }}>
          Your On-Chain ID Card
        </h4>
        <IdCard />

        <div className="glass-card" style={{ width: "100%", textAlign: "left" }}>
          <h5 style={{ margin: "0 0 16px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 600 }}>
            Verifiable Ledger Parameters
          </h5>
          <div className="info-row">
            <span>Identity Wallet</span>
            <strong className="mono" style={{ fontSize: "0.7rem", color: "#6366f1" }}>
              {session?.walletAddress ? session.walletAddress.substring(0, 16) + "..." : "Unlinked"}
            </strong>
          </div>
          <div className="info-row">
            <span>Smart Contract Status</span>
            <strong style={{ color: "#10b981" }}>Active & Syncing</strong>
          </div>
          <div className="info-row">
            <span>Transaction Logs</span>
            <strong>{state.txLog ? state.txLog.length : 0} logs</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Dashboard;
