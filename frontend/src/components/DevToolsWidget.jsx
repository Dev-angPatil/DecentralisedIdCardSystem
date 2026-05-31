import React from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { Cpu, X, BookOpen, AlertTriangle } from "lucide-react";

export function DevToolsWidget() {
  const { nfcScanState, cancelNfcScan, triggerNfcScan, showToast, state } = useApp();
  const { session } = useAuth();

  if (!nfcScanState.active) return null;

  // Compile a list of registered students for the NFC scan simulator
  // 1. Always include the active student session if logged in
  // 2. Include any students registered in database (we get this from state or can fallback)
  const studentsMap = new Map();
  
  if (session && !session.isAdmin) {
    studentsMap.set(session.email, {
      name: session.name,
      studentId: session.studentId,
      email: session.email,
      walletAddress: session.walletAddress,
      college: session.college,
      program: session.program,
      year: session.year
    });
  }

  // Find other students registered from database metadata
  // We can query this from state or users list if available, or fallback to default
  const defaultStudents = [
    {
      name: "Aarav Mehta",
      studentId: "CC-2026-1874",
      email: "aaravmehta@personal.com",
      walletAddress: "CCvWa6fb0ef4316d92349ccf97e4b926878d345d",
      college: "Vellore Institute of Technology (VIT), Vellore",
      program: "B.Tech Computer Science Engineering",
      year: "3rd Year"
    },
    {
      name: "Devang Patil",
      studentId: "CC-2026-9901",
      email: "officialdevangpatil@gmail.com",
      walletAddress: "CCvWDevang",
      college: "Vellore Institute of Technology (VIT), Vellore",
      program: "B.Tech Computer Science Engineering",
      year: "4th Year"
    }
  ];

  defaultStudents.forEach(st => {
    studentsMap.set(st.email, st);
  });

  const studentsList = Array.from(studentsMap.values());

  const handleSimulateTap = (st) => {
    const cardData = {
      type: "chaincampus-card",
      studentId: st.studentId,
      email: st.email,
      name: st.name,
      walletAddress: st.walletAddress,
      college: st.college,
      program: st.program,
      year: st.year,
      signature: `verified_academic_sig_${Math.random().toString(36).substring(2, 12)}`
    };
    
    showToast("Card Scanned 📶", `Simulated tap for ${st.name}`, "success");
    triggerNfcScan(cardData);
  };

  const handleSimulateWrite = () => {
    if (!nfcScanState.payloadData) return;
    const writtenTag = {
      type: "chaincampus-card",
      ...nfcScanState.payloadData,
      signature: `verified_academic_sig_${Math.random().toString(36).substring(2, 12)}`
    };
    
    // Save to simulated memory
    localStorage.setItem("chainCampusSimulatedNfc", JSON.stringify(writtenTag));
    showToast("NFC Write Complete ✓", `Verifiable tag created for ${writtenTag.name}`, "success");
    
    if (nfcScanState.onRead) {
      nfcScanState.onRead(writtenTag, "SIM-NFC-SERIAL-WRITTEN");
    }
  };

  const handleSimulateInvalidTap = () => {
    showToast("Invalid Tag ⚠️", "Simulating raw non-verifiable card scan.", "failed");
    cancelNfcScan();
  };

  return (
    <div className="dev-drawer">
      <div className="dev-drawer-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Cpu size={14} style={{ color: "#38bdf8" }} />
          <span className="dev-drawer-title">NFC Sandbox diagnostics</span>
        </div>
        <button 
          onClick={cancelNfcScan}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "grid", placeItems: "center" }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="dev-drawer-body">
        {nfcScanState.mode === "scan" ? (
          <>
            <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.4 }}>
              Select a registered student card profile to simulate an NFC hardware card check-in scan:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {studentsList.map((st) => (
                <button 
                  key={st.email}
                  className="dev-option-btn" 
                  onClick={() => handleSimulateTap(st)}
                >
                  <strong>{st.name}</strong>
                  <span style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6rem", opacity: 0.7 }}>
                    <span>ID: {st.studentId}</span>
                    <span>{st.program}</span>
                  </span>
                </button>
              ))}

              <button 
                className="dev-option-btn" 
                onClick={handleSimulateInvalidTap}
                style={{ border: "1px dashed #ef4444", background: "rgba(239, 68, 68, 0.05)", color: "#f87171", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <AlertTriangle size={12} />
                <span>Tap Broken/Unregistered NFC Tag</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.4 }}>
              Approach a blank card to write the following student on-chain profile:
            </p>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "12px", fontSize: "0.72rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ opacity: 0.6 }}>Name:</span>
                <strong>{nfcScanState.payloadData?.name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ opacity: 0.6 }}>ID:</span>
                <strong>{nfcScanState.payloadData?.studentId}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ opacity: 0.6 }}>Program:</span>
                <strong>{nfcScanState.payloadData?.program}</strong>
              </div>
            </div>
            <button 
              className="btn btn-primary btn-full"
              onClick={handleSimulateWrite}
              style={{ background: "#38bdf8", color: "#0f172a", fontSize: "0.7rem", fontWeight: 700, borderRadius: "8px" }}
            >
              Simulate Writing Tag credentials →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
export default DevToolsWidget;
