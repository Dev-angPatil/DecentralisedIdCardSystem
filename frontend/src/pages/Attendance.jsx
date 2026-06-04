import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useApi } from "../hooks/useApi";
import { useBlockchain } from "../hooks/useBlockchain";
import { ShieldCheck, MapPin, Fingerprint, RefreshCw, Link as LinkIcon, Radio } from "lucide-react";

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
          showToast("Signing Ledger...", `Approaching NFC device for student ${cardData.name}`, "pending");

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
    <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header section with Editorial Typography */}
      <div style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.05)", paddingBottom: "24px" }}>
        <h3 style={{ fontSize: "clamp(2rem, 3.5vw, 2.6rem)", fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", margin: 0, color: "var(--text)", lineHeight: 1.1 }}>
          Attendance Ledger
        </h3>
        <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "8px", maxWidth: "600px", lineHeight: 1.6 }}>
          Monitor your physical lecture attendance verifications. Every physical tag tap creates a cryptographically signed instruction recorded verifiably on the Solana network ledger.
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
        {/* Left panel: Verification check-in widgets */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div 
            className="glass-card" 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "20px", 
              border: "1px solid rgba(20, 184, 166, 0.15)", 
              background: "rgba(20, 184, 166, 0.01)",
              padding: "32px",
              borderRadius: "20px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div 
                style={{ 
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "10px", 
                  background: "rgba(20,184,166,0.08)", 
                  display: "grid", 
                  placeItems: "center", 
                  color: "#14b8a6" 
                }}
              >
                <Fingerprint size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)" }}>
                  NFC Card Simulator
                </h4>
                <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Active Network: Solana Sandbox · NFC Scanner HUD
                </p>
              </div>
            </div>

            <p style={{ fontSize: "0.82rem", color: "var(--text-soft)", lineHeight: 1.6, margin: 0 }}>
              Approaching your physical student card near the college NFC scanner signs a local ledger entry. Click the simulation trigger below to toggle our **NFC Diagnostics Sandbox** and simulate card verification.
            </p>

            <button 
              className="btn btn-primary"
              onClick={handleNfcTap}
              disabled={loading}
              style={{ 
                padding: "14px 28px", 
                background: "#0f172a", 
                color: "#ffffff",
                fontSize: "0.74rem", 
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%"
              }}
            >
              <Radio size={14} className="nfc-scan-icon" style={{ animation: "pulse 2s infinite" }} />
              <span>Simulate NFC Card Tap</span>
            </button>
          </div>
        </div>

        {/* Right panel: Verified ledger records list */}
        <div 
          className="glass-card" 
          style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "24px", 
            padding: "32px",
            borderRadius: "20px",
            background: "var(--surface)",
            border: "1px solid var(--stroke)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)" }}>
              Verifiable Attendance Ledger Book
            </h4>
            <button 
              className="btn btn-ghost"
              onClick={refreshData}
              style={{ padding: "8px", borderRadius: "50%", display: "grid", placeItems: "center" }}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "14px", 
              overflowY: "auto", 
              maxHeight: "420px",
              paddingRight: "4px" 
            }}
          >
            {state.attendanceRecords && state.attendanceRecords.length > 0 ? (
              state.attendanceRecords.map((r, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    background: "var(--bg-alt)", 
                    border: "1px solid var(--stroke-soft)", 
                    padding: "18px", 
                    borderRadius: "14px", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    gap: "12px"
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ fontSize: "0.85rem", color: "var(--text)", fontFamily: "'Space Grotesk', sans-serif" }}>
                      {r.studentName || r.name}
                    </strong>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>ID: {r.studentId}</span>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                        <MapPin size={10} style={{ color: "#6366f1" }} />
                        Room LH-201
                      </span>
                    </div>
                    {r.txId && (
                      <a 
                        href={`https://explorer.solana.com/tx/${r.txId}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mono" 
                        style={{ 
                          fontSize: "0.62rem", 
                          color: "#6366f1", 
                          marginTop: "6px", 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "4px",
                          textDecoration: "underline"
                        }}
                      >
                        <LinkIcon size={10} />
                        <span>Explorer: {r.txId.substring(0, 14)}...</span>
                      </a>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span 
                      className="status-badge success" 
                      style={{ 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "4px",
                        fontSize: "0.6rem",
                        padding: "4px 8px",
                        fontWeight: 800
                      }}
                    >
                      <ShieldCheck size={12} />
                      <span>VERIFIED</span>
                    </span>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "6px" }}>
                      {r.timestamp ? r.timestamp.substring(11, 16) : "Just Now"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div 
                style={{ 
                  padding: "40px 20px", 
                  border: "1px dashed var(--stroke)", 
                  borderRadius: "14px", 
                  textAlign: "center", 
                  color: "var(--text-muted)", 
                  fontSize: "0.8rem",
                  background: "rgba(255, 255, 255, 0.2)"
                }}
              >
                No attendance logs found in this session. Click the simulator check-in trigger on the left to sign your card cryptographically.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default Attendance;
