import React from "react";

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--stroke)", padding: "32px 0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 5, marginTop: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "linear-gradient(135deg,#6366f1,#14b8a6)", display: "grid", placeItems: "center", fontWeight: 800, color: "#fff", fontSize: "0.75rem" }}>CC</div>
        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: "var(--text)", fontSize: "0.85rem" }}>ChainCampus</span>
      </div>
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
        Decentralized Student Identity Platform · Solana Integration Sandbox
      </p>
    </footer>
  );
}
export default Footer;
