import React from "react";
import { useApp } from "../context/AppContext";
import { Loader2, Key, Cpu, Layers, ShieldCheck } from "lucide-react";

export function TxProgressOverlay() {
  const { txProgress } = useApp();

  if (!txProgress || !txProgress.active) return null;

  const { status, label, txId } = txProgress;

  // Determine current step index and glowing accent color
  let stepIndex = 0;
  let activeColor = "#3b82f6"; // default blue
  let glowShadow = "rgba(59, 130, 246, 0.25)";
  
  if (status === "signature") {
    stepIndex = 1;
    activeColor = "#60a5fa"; // blue-400
    glowShadow = "rgba(96, 165, 250, 0.4)";
  } else if (status === "broadcasting") {
    stepIndex = 2;
    activeColor = "#c084fc"; // purple-400
    glowShadow = "rgba(192, 132, 252, 0.4)";
  } else if (status === "consensus") {
    stepIndex = 3;
    activeColor = "#fb923c"; // orange-400
    glowShadow = "rgba(251, 146, 60, 0.4)";
  } else if (status === "confirmed") {
    stepIndex = 4;
    activeColor = "#4ade80"; // green-400
    glowShadow = "rgba(74, 222, 128, 0.4)";
  }

  // Active status details
  const getStatusDetails = () => {
    switch (status) {
      case "signature":
        return {
          title: "Signing On-Chain Ledger",
          desc: "Drafting cryptographic Ed25519 signature payload...",
          icon: <Key size={26} className="spin-slow" style={{ color: activeColor }} />
        };
      case "broadcasting":
        return {
          title: "Broadcasting Transaction",
          desc: "Transmitting virtual base58 ledger data to Solana Devnet...",
          icon: <Cpu size={26} className="pulse-fast" style={{ color: activeColor }} />
        };
      case "consensus":
        return {
          title: "Awaiting Validator Consensus",
          desc: "Validating transactions across 32 sandboxed Solana validators...",
          icon: <Layers size={26} style={{ color: activeColor }} />
        };
      case "confirmed":
        return {
          title: "Transaction Confirmed!",
          desc: "Consensus finalized. Appending block to decentralized catalog...",
          icon: <ShieldCheck size={26} style={{ color: activeColor }} />
        };
      default:
        return {
          title: "Processing Block",
          desc: "Communicating with on-chain database...",
          icon: <Loader2 size={26} className="animate-spin" style={{ color: activeColor }} />
        };
    }
  };

  const details = getStatusDetails();

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(10, 15, 30, 0.72)",
      backdropFilter: "blur(14px)",
      zIndex: 99999,
      display: "grid",
      placeItems: "center",
      padding: "20px",
      boxSizing: "border-box"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "460px",
        background: "rgba(17, 24, 39, 0.45)",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        borderRadius: "24px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.05)",
        padding: "36px 30px",
        textAlign: "center",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Glowing Pulse Halo Background */}
        <div style={{
          position: "absolute",
          top: "-50px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          background: activeColor,
          opacity: 0.05,
          filter: "blur(60px)",
          transition: "background-color 0.4s ease",
          pointerEvents: "none"
        }} />

        {/* Central Icon Container */}
        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.02)",
          border: `1px solid rgba(255, 255, 255, 0.06)`,
          display: "grid",
          placeItems: "center",
          margin: "0 auto 28px auto",
          boxShadow: `0 8px 30px ${glowShadow}`,
          transition: "all 0.4s ease",
          position: "relative"
        }}>
          {details.icon}
        </div>

        {/* Action Label */}
        <div style={{
          fontSize: "0.68rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: activeColor,
          marginBottom: "8px",
          fontFamily: "'Space Grotesk', sans-serif",
          transition: "color 0.4s ease"
        }}>
          {label || "SOLANA BLOCKCHAIN TX"}
        </div>

        {/* Main Status Title */}
        <h4 style={{
          margin: "0 0 10px 0",
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "#ffffff",
          fontFamily: "'Space Grotesk', sans-serif"
        }}>
          {details.title}
        </h4>

        {/* Status Description */}
        <p style={{
          margin: "0 0 32px 0",
          fontSize: "0.82rem",
          color: "rgba(255, 255, 255, 0.55)",
          lineHeight: 1.5
        }}>
          {details.desc}
        </p>

        {/* 4-Step Visual Progress Bars */}
        <div style={{
          display: "flex",
          gap: "8px",
          marginBottom: "28px",
        }}>
          {[1, 2, 3, 4].map((step) => {
            const isFilled = step <= stepIndex;
            const isCurrent = step === stepIndex;
            return (
              <div 
                key={step}
                style={{
                  flex: 1,
                  height: "5px",
                  borderRadius: "3px",
                  background: isFilled 
                    ? activeColor 
                    : "rgba(255, 255, 255, 0.05)",
                  boxShadow: isCurrent 
                    ? `0 0 10px ${activeColor}` 
                    : "none",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              />
            );
          })}
        </div>

        {/* Base58 Signature Details Box */}
        <div style={{
          background: "rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.04)",
          borderRadius: "14px",
          padding: "16px",
          textAlign: "left"
        }}>
          <div style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.35)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "6px"
          }}>
            ON-CHAIN TRANSACTION RECEIPT
          </div>
          <div style={{
            fontFamily: "monospace",
            fontSize: "0.68rem",
            color: txId ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.2)",
            wordBreak: "break-all",
            lineHeight: 1.4
          }}>
            {txId 
              ? txId 
              : "Generating signature hash (base58)..."
            }
          </div>
          {txId && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "8px",
              borderTop: "1px solid rgba(255, 255, 255, 0.05)",
              paddingTop: "8px",
              fontSize: "0.64rem",
              color: "rgba(255, 255, 255, 0.4)"
            }}>
              <span>Network Fee:</span>
              <span style={{ color: "#34d399", fontWeight: 700 }}>0.005 SOL (Gas)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default TxProgressOverlay;
