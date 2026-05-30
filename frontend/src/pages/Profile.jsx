import React from "react";
import { useAuth } from "../context/AuthContext";
import { IdCard } from "../components/IdCard";
import { ShieldCheck, Calendar, BookOpen, GraduationCap } from "lucide-react";

export function Profile() {
  const { session } = useAuth();

  if (!session) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "32px" }}>
      {/* Left Column: Student Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", textAlign: "left" }}>
        <div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>
            Verifiable Digital Profile
          </h3>
          <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "4px" }}>
            Review your blockchain-registered credentials and virtual wallet ledger parameters below.
          </p>
        </div>

        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h4 style={{ margin: "0 0 10px", fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>
            Registered Metadata Parameters
          </h4>

          <div className="info-row">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><ShieldCheck size={14} /> Full Name</span>
            <strong>{session.name}</strong>
          </div>
          <div className="info-row">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><GraduationCap size={14} /> Registered Email</span>
            <strong style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.76rem" }}>{session.email}</strong>
          </div>
          <div className="info-row">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><BookOpen size={14} /> Academic College</span>
            <strong>{session.college}</strong>
          </div>
          <div className="info-row">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Calendar size={14} /> Branch & Program</span>
            <strong>{session.program} ({session.year})</strong>
          </div>
          <div className="info-row">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><ShieldCheck size={14} /> Student Ledger ID</span>
            <strong style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.76rem", color: "#6366f1" }}>{session.studentId}</strong>
          </div>
        </div>
      </div>

      {/* Right Column: Card Interactive Scene */}
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", alignItems: "center" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", alignSelf: "flex-start" }}>
          Interactive ID Card Face
        </h4>
        
        <IdCard />

        <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", textAlign: "center", maxWidth: "340px", lineHeight: 1.5, margin: 0 }}>
          Click the card above to rotate it and inspect secure parameters, barcodes, and on-chain security signatures.
        </p>
      </div>
    </div>
  );
}
export default Profile;
