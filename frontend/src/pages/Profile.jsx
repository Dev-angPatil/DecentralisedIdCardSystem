import React from "react";
import { useAuth } from "../context/AuthContext";
import { IdCard } from "../components/IdCard";
import { ShieldCheck, Calendar, BookOpen, GraduationCap, Award, Compass } from "lucide-react";

export function Profile() {
  const { session } = useAuth();

  if (!session) return null;

  return (
    <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header section with Editorial Typography */}
      <div style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.05)", paddingBottom: "24px" }}>
        <h3 style={{ fontSize: "clamp(2rem, 3.5vw, 2.6rem)", fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", margin: 0, color: "var(--text)", lineHeight: 1.1 }}>
          Academic Identity Credentials
        </h3>
        <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "8px", maxWidth: "600px", lineHeight: 1.6 }}>
          Review your university student registration parameters and active Solana wallet address metadata. The card represents a secure digital ticket verifiably signed by VIT on-chain.
        </p>
      </div>

      {/* Main Responsive Grid Layout */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: "40px",
          alignItems: "start" 
        }}
      >
        {/* Left Column: Student Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div 
            className="glass-card" 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "20px",
              padding: "32px",
              borderRadius: "20px",
              background: "var(--surface)",
              border: "1px solid var(--stroke)"
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)" }}>
              Registered Student Metadata
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="info-row" style={{ padding: "14px 0" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-soft)", fontSize: "0.82rem" }}>
                  <ShieldCheck size={15} style={{ color: "#6366f1" }} /> 
                  <span>Student Full Name</span>
                </span>
                <strong style={{ fontSize: "0.85rem", color: "var(--text)" }}>{session.name}</strong>
              </div>
              
              <div className="info-row" style={{ padding: "14px 0" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-soft)", fontSize: "0.82rem" }}>
                  <GraduationCap size={15} style={{ color: "#6366f1" }} /> 
                  <span>Registered College Email</span>
                </span>
                <strong style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.78rem", color: "var(--text)" }}>{session.email}</strong>
              </div>

              <div className="info-row" style={{ padding: "14px 0" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-soft)", fontSize: "0.82rem" }}>
                  <BookOpen size={15} style={{ color: "#6366f1" }} /> 
                  <span>College / Institution</span>
                </span>
                <strong style={{ fontSize: "0.85rem", color: "var(--text)" }}>{session.college}</strong>
              </div>

              <div className="info-row" style={{ padding: "14px 0" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-soft)", fontSize: "0.82rem" }}>
                  <Calendar size={15} style={{ color: "#6366f1" }} /> 
                  <span>Academic Course</span>
                </span>
                <strong style={{ fontSize: "0.85rem", color: "var(--text)" }}>{session.program} ({session.year})</strong>
              </div>

              <div className="info-row" style={{ padding: "14px 0" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-soft)", fontSize: "0.82rem" }}>
                  <Compass size={15} style={{ color: "#6366f1" }} /> 
                  <span>Cryptographic Ledger ID</span>
                </span>
                <strong style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.74rem", color: "#6366f1" }}>{session.studentId}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Card Interactive Scene */}
        <div 
          className="glass-card" 
          style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "28px", 
            alignItems: "center",
            padding: "32px",
            borderRadius: "20px",
            background: "var(--glass)",
            border: "1px solid var(--glass-border)",
            backdropFilter: "blur(20px)"
          }}
        >
          <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)" }}>
              Interactive Card Scene
            </h4>
            <span 
              className="status-badge success" 
              style={{ 
                fontSize: "0.58rem", 
                padding: "3px 8px", 
                fontWeight: 700, 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "3px" 
              }}
            >
              <Award size={10} />
              <span>ACTIVE KEY</span>
            </span>
          </div>
          
          {/* Centers the 3D spring digital student ID card component */}
          <div style={{ display: "grid", placeItems: "center", width: "100%", padding: "10px 0" }}>
            <IdCard />
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center", maxWidth: "340px", lineHeight: 1.6, margin: 0 }}>
            Hover, tilt, or click your card above to rotate it, verifying the cryptographic barcode, signature parameters, and Devnet contract address metadata.
          </p>
        </div>
      </div>
    </div>
  );
}
export default Profile;
