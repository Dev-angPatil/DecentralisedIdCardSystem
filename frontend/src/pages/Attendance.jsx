import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useApi } from "../hooks/useApi";
import { useBlockchain } from "../hooks/useBlockchain";
import { ShieldCheck, CalendarCheck, MapPin, Fingerprint, RefreshCw } from "lucide-react";

export function Attendance() {
  const { state, refreshData, showToast, startNfcScan } = useApp();
  const { markAttendance, loading } = useApi();
  const { markAttendanceOnChain } = useBlockchain();

  const handleNfcTap = () => {
    startNfcScan(
      async (cardData, serialNumber) => {
        if (!cardData.studentId || !cardData.name) {
          showToast("NFC Read Failed", "Stale card payload or missing credentials.", "failed");
          return;
        }

        try {
          showToast("Signing Ledger...", `Simulating tap for student ${cardData.name}`, "pending");

          // 1. Mark transaction on blockchain
          const blockchainRes = await markAttendanceOnChain("attendance-evt", cardData.studentId);
          
          // 2. Mark attendance on backend SQLite database
          await markAttendance({
            eventId: "attendance-evt",
            studentId: cardData.studentId,
            name: cardData.name,
            txId: blockchainRes.txId,
          });

          showToast(
            "Check-In Successful ✓", 
            `${cardData.name} attendance recorded verifiably on-chain!`, 
            "success"
          );

          // 3. Refresh lists
          await refreshData();
        } catch (err) {
          showToast("Verification failed", err.message, "failed");
        }
      },
      (err) => {
        showToast("Scanner Error", err.message || "Failed to approach NFC card.", "failed");
      }
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
      {/* Left panel: Verification check-in widgets */}
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", textAlign: "left" }}>
        <div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>
            TAMPER-PROOF ATTENDANCE LEDGER
          </h3>
          <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "4px" }}>
            Every session attendance creates an immutable, cryptographically-signed ledger entry mapped on-chain.
          </p>
        </div>

        {/* Dynamic NFC hardware scanner widget wrapper */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px", border: "1px solid rgba(20, 184, 166, 0.15)", background: "rgba(20, 184, 166, 0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(20,184,166,0.08)", display: "grid", placeItems: "center", color: "#14b8a6" }}>
              <Fingerprint size={16} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)" }}>
                NFC Tap Integration Simulator
              </h4>
              <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Active Network: Solana Sandbox · NFC Diagnostics Mode
              </p>
            </div>
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--text-soft)", lineHeight: 1.5, margin: 0 }}>
            Click the tap simulation button below to slide up the **NFC Diagnostics Sandbox**. Select your registered student credentials profile to verify your physical card tap cryptographically.
          </p>

          <button 
            className="btn btn-primary"
            onClick={handleNfcTap}
            disabled={loading}
            style={{ padding: "12px 24px", background: "#0f172a", fontSize: "0.74rem", borderRadius: "12px" }}
          >
            📶 Simulate NFC Card Tap Check-In
          </button>
        </div>
      </div>

      {/* Right panel: Verified records list */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>
            Verifiable Attendance Log
          </h4>
          <button 
            className="btn btn-ghost"
            onClick={refreshData}
            style={{ padding: "6px" }}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "400px" }}>
          {state.attendanceRecords && state.attendanceRecords.length > 0 ? (
            state.attendanceRecords.map((r, idx) => (
              <div key={idx} style={{ background: "var(--bg-alt)", border: "1px solid var(--stroke)", padding: "16px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "0.8rem", color: "var(--text)" }}>{r.studentName || r.name}</strong>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>ID: {r.studentId}</span>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "2px" }}><MapPin size={9} />Room LH-201</span>
                  </div>
                  {r.txId && (
                    <div className="mono" style={{ fontSize: "0.6rem", color: "#6366f1", marginTop: "4px", display: "flex", gap: "4px", alignItems: "center" }}>
                      <span>🔗 {r.txId.substring(0, 16)}...</span>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="status-badge success" style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                    <ShieldCheck size={11} />
                    <span>VERIFIED</span>
                  </span>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    {r.timestamp ? r.timestamp.substring(11, 16) : "Just Now"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "30px", border: "1px dashed var(--stroke)", borderRadius: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem" }}>
              No attendance check-ins logged yet. Trigger the simulated card tap to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default Attendance;
