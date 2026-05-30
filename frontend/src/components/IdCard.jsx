import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { ShieldCheck, RefreshCw } from "lucide-react";

export function IdCard() {
  const { session } = useAuth();
  const { showToast } = useApp();
  const [flipped, setFlipped] = useState(false);

  if (!session) return null;

  const truncate = (str, len = 20) => {
    if (!str) return "Not Connected";
    if (str.length <= len) return str;
    return str.slice(0, 10) + "..." + str.slice(-8);
  };

  const handleFlip = () => {
    setFlipped(!flipped);
    showToast(
      flipped ? "Card Flipped 🪪" : "Credentials Revealed 🔐",
      flipped ? "Viewing digital cardholder face." : "Viewing secure on-chain parameters.",
      "success"
    );
  };

  return (
    <div className="id-card-scene" onClick={handleFlip}>
      <div className={`id-card-flipper ${flipped ? "flipped" : ""}`}>
        {/* Front Face */}
        <div className="id-face id-front">
          <div className="id-top-row">
            <div className="id-chip"></div>
            <div className="id-brand">
              ChainCampus
              <span>Student Identity</span>
            </div>
            <div className="id-nfc-icon" style={{ fontSize: "1.1rem", opacity: 0.85 }}>📶</div>
          </div>
          <div className="id-mid-row">
            <div className="id-card-number">
              {truncate(session.walletAddress, 24)}
            </div>
          </div>
          <div className="id-bottom-row">
            <div className="id-name-block">
              <div className="id-label-xs">Cardholder</div>
              <div className="id-cardholder-name">
                {session.name.toUpperCase()}
              </div>
            </div>
            <div className="id-verified-badge" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <ShieldCheck size={12} />
              <span>✓ Verified</span>
            </div>
          </div>
        </div>

        {/* Back Face */}
        <div className="id-face id-back">
          <div className="id-mag-strip"></div>
          <div className="id-back-content">
            <div className="id-back-row">
              <span className="id-back-key">STUDENT ID:</span>
              <span className="id-back-val">{session.studentId || "CC-STUDENT-ID"}</span>
            </div>
            <div className="id-back-row">
              <span className="id-back-key">PROGRAM:</span>
              <span className="id-back-val">{session.program || "CS"}</span>
            </div>
            <div className="id-back-row">
              <span className="id-back-key">NETWORK:</span>
              <span className="id-back-val" style={{ color: "#6366f1" }}>Solana Devnet</span>
            </div>
            <div className="id-back-row">
              <span className="id-back-key">BALANCE:</span>
              <span className="id-back-val" style={{ color: "#10b981", fontWeight: 700 }}>
                {Number(session.virtualBalance || 0.0).toFixed(3)} SOL
              </span>
            </div>
            <div className="id-back-row">
              <span className="id-Mag-strip id-back-key">STATUS:</span>
              <span className="id-back-val" style={{ color: "#10b981" }}>Active & Verified</span>
            </div>
          </div>
          <div className="id-back-footer">
            <span className="id-security-text">
              SECURITY CODE: {session.studentId || "CC-STUDENT-ID"}•••
            </span>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: "0.7rem", color: "#6366f1" }}>
              ChainCampus
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
