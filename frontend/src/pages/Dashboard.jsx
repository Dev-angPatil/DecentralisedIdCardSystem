import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { IdCard } from "../components/IdCard";
import { Bell, Trophy, BookOpen, CalendarRange, Wallet, Check, GraduationCap } from "lucide-react";

export function Dashboard() {
  const { state } = useApp();
  const { session } = useAuth();
  const [ledgerOpen, setLedgerOpen] = useState(false);

  const getStats = () => {
    const eventCount = state.events ? state.events.length : 0;
    const attendanceCount = state.attendanceRecords ? state.attendanceRecords.length : 0;
    const scholarshipCount = state.scholarshipApplications ? state.scholarshipApplications.length : 0;
    return { eventCount, attendanceCount, scholarshipCount };
  };

  const { eventCount, attendanceCount, scholarshipCount } = getStats();

  const gpaData = React.useMemo(() => {
    const courseMap = {};
    (state.courses || []).forEach(c => {
      courseMap[c.id || c.courseId] = c;
    });

    let totalWeightedPoints = 0;
    let totalCreditsForGpa = 0;
    let totalCompletedCredits = 0;
    
    const gradePoints = {
      "A+": 10.0,
      "A": 9.0,
      "B+": 8.0,
      "B": 7.0,
      "C": 6.0,
      "F": 0.0
    };

    const gradedItems = (state.enrolledCourses || []).filter(e => e.grade);

    gradedItems.forEach(e => {
      const info = courseMap[e.courseId];
      const credits = info ? Number(info.credits || 4) : 4;
      const points = gradePoints[e.grade] !== undefined ? gradePoints[e.grade] : 0.0;
      
      totalWeightedPoints += (points * credits);
      totalCreditsForGpa += credits;
      if (e.grade !== "F") {
        totalCompletedCredits += credits;
      }
    });

    const cgpa = totalCreditsForGpa > 0 ? (totalWeightedPoints / totalCreditsForGpa).toFixed(2) : "0.00";
    
    return {
      cgpa,
      totalCompletedCredits,
      hasGrades: gradedItems.length > 0,
      gradedCount: gradedItems.length
    };
  }, [state.enrolledCourses, state.courses]);

  return (
    <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header section with Editorial Typography */}
      <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.07)", paddingBottom: "24px" }}>
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
            
            {/* Events Card */}
            <div 
              className="glass-card" 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "14px", 
                padding: "20px",
                borderTop: "3px solid #6366f1",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 20px -8px rgba(99, 102, 241, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>Events List</span>
                <CalendarRange size={16} style={{ color: "#6366f1" }} />
              </div>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk',sans-serif", color: "#ffffff" }}>
                {eventCount}
              </h2>
            </div>

            {/* Attendances Card */}
            <div 
              className="glass-card" 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "14px", 
                padding: "20px",
                borderTop: "3px solid #14b8a6",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 20px -8px rgba(20, 184, 166, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>Attendances</span>
                <BookOpen size={16} style={{ color: "#14b8a6" }} />
              </div>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk',sans-serif", color: "#ffffff" }}>
                {attendanceCount}
              </h2>
            </div>

            {/* Scholarships Card */}
            <div 
              className="glass-card" 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "14px", 
                padding: "20px",
                borderTop: "3px solid #fbbf24",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 20px -8px rgba(251, 191, 36, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>Scholarships</span>
                <Trophy size={16} style={{ color: "#fbbf24" }} />
              </div>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk',sans-serif", color: "#ffffff" }}>
                {scholarshipCount}
              </h2>
            </div>

            {/* CGPA Stats Card */}
            <div 
              className="glass-card" 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "14px", 
                padding: "20px",
                borderTop: "3px solid #8b5cf6",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 20px -8px rgba(139, 92, 246, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>Cumulative GPA</span>
                <GraduationCap size={16} style={{ color: "#8b5cf6" }} />
              </div>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk',sans-serif", color: "#ffffff" }}>
                {gpaData.cgpa} <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-soft)" }}>/ 10.0</span>
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
                  <div key={idx} className="notice-item" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", padding: "16px", borderRadius: "12px", textAlign: "left" }}>
                    <strong style={{ fontSize: "0.85rem", color: "#ffffff", fontFamily: "'Space Grotesk', sans-serif" }}>{n.title}</strong>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-soft)", margin: "4px 0 0", lineHeight: 1.5 }}>{n.desc}</p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", padding: "16px", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "10px" }}>
                  No active announcements at the moment.
                </p>
              )}
            </div>
          </div>

          {/* Verifiable Academic Transcript Table */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: "8px", color: "var(--text)" }}>
              <GraduationCap size={16} style={{ color: "#8b5cf6" }} />
              Verifiable Academic Transcript Ledger
            </h4>
            
            {(state.enrolledCourses || []).length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--stroke)" }}>
                      <th style={{ padding: "10px 8px", color: "var(--text-muted)" }}>Course</th>
                      <th style={{ padding: "10px 8px", color: "var(--text-muted)", textAlign: "center" }}>Credits</th>
                      <th style={{ padding: "10px 8px", color: "var(--text-muted)", textAlign: "center" }}>Grade</th>
                      <th style={{ padding: "10px 8px", color: "var(--text-muted)" }}>Ledger Authentication</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(state.enrolledCourses || []).map((e) => {
                      // Resolve course info
                      const courseMap = {};
                      (state.courses || []).forEach(c => {
                        courseMap[c.id || c.courseId] = c;
                      });
                      const info = courseMap[e.courseId] || { code: e.courseId, name: "Enrolled Course", credits: 4 };
                      
                      return (
                        <tr key={e.courseId} style={{ borderBottom: "1px solid var(--stroke-soft)" }}>
                          <td style={{ padding: "12px 8px" }}>
                            <strong style={{ color: "var(--text)" }}>{info.code}</strong>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>{info.name}</div>
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "center", color: "var(--text)" }}>{info.credits}</td>
                          <td style={{ padding: "12px 8px", textAlign: "center" }}>
                            {e.grade ? (
                              <span style={{
                                display: "inline-block",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontWeight: 700,
                                fontSize: "0.72rem",
                                background: e.grade === "F" ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                color: e.grade === "F" ? "var(--red)" : "var(--green)"
                              }}>
                                {e.grade}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.72rem" }}>Enrolled / Ungraded</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 8px", fontFamily: "monospace", fontSize: "0.65rem" }}>
                            {e.gradeTxId ? (
                              <span style={{ color: "#fbbf24", wordBreak: "break-all" }} title={e.gradeTxId}>
                                {e.gradeTxId.substring(0, 14)}...
                              </span>
                            ) : e.txId ? (
                              <span style={{ color: "#6366f1", wordBreak: "break-all" }} title={e.txId}>
                                {e.txId.substring(0, 14)}...
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>Processing</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", padding: "16px", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "10px", textAlign: "center", margin: 0 }}>
                You are not currently enrolled in any academic courses. Enroll from the Course Catalog.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Digital ID Preview & Quick Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", alignItems: "center", width: "100%" }}>
          <div 
            className="glass-card" 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "24px", 
              alignItems: "center",
              padding: "24px",
              borderRadius: "20px",
              background: "rgba(17, 24, 39, 0.22)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(20px)",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", alignSelf: "flex-start", color: "var(--text)" }}>
              Your On-Chain ID Card
            </h4>
            <IdCard />
          </div>

          <div className="glass-card" style={{ width: "100%", textAlign: "left", padding: "28px", borderRadius: "18px", boxSizing: "border-box" }}>
            <h5 style={{ margin: "0 0 16px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 600 }}>
              Verifiable Ledger Parameters
            </h5>
            <div className="info-row" style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-soft)" }}>Identity Wallet</span>
              <strong className="mono" style={{ fontSize: "0.7rem", color: "#6366f1" }}>
                {session?.walletAddress ? session.walletAddress.substring(0, 16) + "..." : "Unlinked"}
              </strong>
            </div>
            <div className="info-row" style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-soft)" }}>Smart Contract Status</span>
              <strong style={{ color: "#10b981", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "3px" }}>
                <Check size={12} /> Active & Syncing
              </strong>
            </div>
            
            {/* Interactive Collapsible Transaction Logs Row */}
            <div 
              className="info-row" 
              onClick={() => setLedgerOpen(!ledgerOpen)}
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                padding: "10px 0", 
                cursor: "pointer", 
                userSelect: "none"
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "var(--text-soft)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>Transaction Logs</span>
                <span style={{ fontSize: "0.62rem", background: "rgba(99, 102, 241, 0.12)", color: "#818cf8", padding: "1px 6px", borderRadius: "10px", fontWeight: 700 }}>
                  {state.txLog ? state.txLog.length : 0} logs
                </span>
              </span>
              <strong style={{ fontSize: "0.74rem", color: "#6366f1", display: "flex", alignItems: "center", gap: "2px", textDecoration: "underline" }}>
                {ledgerOpen ? "Hide Ledger ▲" : "View Ledger ▼"}
              </strong>
            </div>

            {/* Collapsible Ledger Drawer Details */}
            {ledgerOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "12px" }}>
                {state.txLog && state.txLog.length > 0 ? (
                  state.txLog.slice(0, 3).map((tx, idx) => (
                    <div 
                      key={tx.txId || idx} 
                      style={{ 
                        background: "rgba(0,0,0,0.2)", 
                        border: "1px solid rgba(255,255,255,0.04)", 
                        borderRadius: "8px", 
                        padding: "10px", 
                        fontSize: "0.68rem" 
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 700, color: "#ffffff" }}>{tx.action}</span>
                        <span style={{ color: "#34d399", fontWeight: 700, fontSize: "0.6rem" }}>✓ SUCCESS</span>
                      </div>
                      <div style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.4)", fontSize: "0.6rem", wordBreak: "break-all" }}>
                        SIG: {tx.txId ? tx.txId.substring(0, 38) + "..." : "N/A"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", padding: "12px 10px", textAlign: "center", fontStyle: "italic", border: "1px dashed rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                    No sandbox transactions logged yet.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* METAPLEX VERIFIED GPA CERTIFICATE CARD */}
          {gpaData.hasGrades && (
            <div 
              className="glass-card" 
              style={{ 
                width: "100%", 
                boxSizing: "border-box",
                padding: "28px", 
                borderRadius: "20px",
                background: "linear-gradient(135deg, rgba(30, 27, 75, 0.45) 0%, rgba(15, 23, 42, 0.6) 100%)",
                border: "1px solid rgba(251, 191, 36, 0.28)",
                animation: "card-glow-breathing 4s infinite ease-in-out",
                "--pulse-glow": "rgba(251, 191, 36, 0.15)",
                "--pulse-glow-high": "rgba(251, 191, 36, 0.32)",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Gold watermark ribbon / emblem */}
              <div style={{
                position: "absolute",
                top: "-15px",
                right: "-15px",
                width: "90px",
                height: "90px",
                background: "radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)",
                borderRadius: "50%"
              }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ 
                    fontSize: "0.62rem", 
                    textTransform: "uppercase", 
                    color: "#fbbf24", 
                    fontWeight: 800, 
                    letterSpacing: "0.15em",
                    background: "rgba(251, 191, 36, 0.1)",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    border: "1px solid rgba(251, 191, 36, 0.2)",
                    display: "inline-block"
                  }}>
                    Metaplex Non-Transferable Credential
                  </span>
                  <h4 style={{ margin: "12px 0 4px", fontSize: "1.25rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: "#ffffff", letterSpacing: "-0.01em" }}>
                    Verified GPA Certificate
                  </h4>
                  <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.72rem", margin: 0 }}>
                    Cryptographically certified academic status
                  </p>
                </div>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 16px rgba(251, 191, 36, 0.35)",
                  color: "#1e1b4b"
                }}>
                  <Trophy size={24} style={{ strokeWidth: 2 }} />
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", margin: "4px 0" }}></div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>Certified CGPA</span>
                  <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fbbf24", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {gpaData.cgpa} <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>/ 10.0</span>
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>Credits Completed</span>
                  <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {gpaData.totalCompletedCredits} <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>CR</span>
                  </span>
                </div>
              </div>

              <div style={{ 
                background: "rgba(255, 255, 255, 0.02)", 
                border: "1px solid rgba(255, 255, 255, 0.04)", 
                borderRadius: "10px", 
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem" }}>
                  <span style={{ color: "var(--text-soft)" }}>Verifiable Recipient</span>
                  <strong className="mono" style={{ color: "#ffffff" }}>{session?.name}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem" }}>
                  <span style={{ color: "var(--text-soft)" }}>Solana Metadata URI</span>
                  <strong className="mono" style={{ color: "#fbbf24" }}>metaplex.chaincampus.edu/{session?.studentId?.toLowerCase()}</strong>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.65rem", marginTop: "4px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "6px" }}>
                  <span style={{ color: "var(--text-muted)" }}>On-Chain Verification Signature</span>
                  <span className="mono" style={{ color: "#a78bfa", wordBreak: "break-all", fontSize: "0.58rem", lineHeight: 1.3 }}>
                    {(state.enrolledCourses || []).find(e => e.grade)?.gradeTxId || "Solana Ledger Sign Pending"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.68rem", color: "#10b981", fontWeight: 600 }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} className="animate-pulse-led" />
                <span>Metaplex Certificate Ledger Sync Complete</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default Dashboard;
