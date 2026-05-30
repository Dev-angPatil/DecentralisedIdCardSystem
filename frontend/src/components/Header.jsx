import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { useApp } from "../context/AppContext";
import { Menu, Zap, Wallet, ShieldAlert } from "lucide-react";

export function Header({ setOpen }) {
  const { session } = useAuth();
  const { airdropSOL, loading } = useApi();
  const { showToast } = useApp();

  const handleAirdrop = async () => {
    try {
      const res = await airdropSOL();
      if (res.ok) {
        showToast("Airdrop received! ⚡", "1.00 SOL added to your virtual wallet.", "success");
      }
    } catch (err) {
      showToast("Airdrop failed", err.message, "failed");
    }
  };

  const getPageTitle = () => {
    const path = window.location.pathname;
    if (path.includes("dashboard")) return "Portal summary";
    if (path.includes("courses")) return "Class enrollment";
    if (path.includes("events")) return "Campus events";
    if (path.includes("attendance")) return "Attendance ledger";
    if (path.includes("scholarships")) return "Scholarship claims";
    if (path.includes("timetable")) return "Weekly timetable";
    if (path.includes("profile")) return "Digital ID parameters";
    return "Campus portal";
  };

  if (!session) return null;

  const truncate = (str, len) => {
    if (!str) return "";
    if (str.length <= len) return str;
    return str.slice(0, 10) + "..." + str.slice(-8);
  };

  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => setOpen(true)}
          style={{ display: "none", padding: "8px 12px" }}
          className="hamburger-btn-style"
        >
          <Menu size={18} />
        </button>
        <div>
          <div className="dashboard-subheading" style={{ textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.1em", fontWeight: 600 }}>
            {session.college || "ChainCampus university"}
          </div>
          <h2 className="dashboard-heading" style={{ fontSize: "1.4rem", marginTop: "2px" }}>
            {getPageTitle()}
          </h2>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255, 255, 255, 0.4)", border: "1px solid rgba(15, 23, 42, 0.05)", padding: "6px 14px", borderRadius: "12px", boxShadow: "var(--shadow-sm)" }}>
          <Wallet size={15} style={{ color: "#6366f1" }} />
          <div>
            <div style={{ fontSize: "0.58rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>
              Virtual Wallet ({truncate(session.walletAddress, 16)})
            </div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#14b8a6", marginTop: "1px" }}>
              {Number(session.virtualBalance || 0.0).toFixed(3)} SOL
            </div>
          </div>
        </div>

        {!session.isAdmin && (
          <button 
            className="btn btn-primary" 
            onClick={handleAirdrop}
            disabled={loading}
            style={{ padding: "8px 16px", background: "#0f172a", fontSize: "0.7rem", borderRadius: "10px" }}
          >
            <Zap size={13} style={{ fill: "currentColor" }} />
            <span>{loading ? "Requesting..." : "Airdrop +1 SOL"}</span>
          </button>
        )}
      </div>

      <style>{`
        .hamburger-btn-style {
          display: none;
        }
        @media (max-width: 992px) {
          .hamburger-btn-style {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
}
