import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useApi } from "../hooks/useApi";
import { useBlockchain } from "../hooks/useBlockchain";
import { useAuth } from "../context/AuthContext";
import { Trophy, HelpCircle, FileText, Send, Link as LinkIcon } from "lucide-react";

export function Scholarships() {
  const { state, refreshData, showToast } = useApp();
  const { session, setSession } = useAuth();
  const { applyScholarship, loading } = useApi();
  const { applyScholarshipOnChain } = useBlockchain();

  // Form states
  const [title, setTitle] = useState("ChainCampus Academic Merit Excellence");
  const [statement, setStatement] = useState("");
  const [amount, setAmount] = useState(1.5);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!statement.trim()) {
      setFormError("Please enter your academic statement of purpose.");
      return;
    }

    try {
      showToast("Signing Application...", "Submitting request on blockchain", "pending");

      // 1. Submit on-chain claim
      const blockchainRes = await applyScholarshipOnChain("scholarship-001", title);

      // 2. Submit database application
      await applyScholarship({
        title,
        amount,
        statement,
        txId: blockchainRes.txId,
      });

      showToast(
        "Application Submitted ✓", 
        "Your academic claim has been logged for administrator review.", 
        "success"
      );

      setStatement("");
      await refreshData();
    } catch (err) {
      showToast("Submission failed", err.message, "failed");
    }
  };

  // Filter student applications
  const myApplications = state.scholarshipApplications
    ? state.scholarshipApplications.filter(app => app.studentEmail === session?.email || app.email === session?.email)
    : [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "32px" }}>
      
      {/* Left Column: Scholarship Application Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", textAlign: "left" }}>
        <div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>
            Scholarship Portal
          </h3>
          <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "4px" }}>
            Submit verified claims for direct academic financial assistance. Approved grants deposit automatically in your wallet.
          </p>
        </div>

        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={16} style={{ color: "#6366f1" }} />
            New Scholarship Claim
          </h4>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="schol-title">Scholarship Program</label>
              <select 
                id="schol-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setAmount(e.target.value.includes("Merit") ? 1.5 : 0.8);
                }}
              >
                <option value="ChainCampus Academic Merit Excellence">ChainCampus Academic Merit Excellence (1.500 SOL)</option>
                <option value="Solana Web3 Developer Support Grant">Solana Web3 Developer Support Grant (0.800 SOL)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="schol-statement">Statement of Purpose / Justification</label>
              <textarea 
                id="schol-statement"
                rows={4}
                placeholder="Explain why you are eligible for this grant, detailing your academic accomplishments..."
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Grant Value Claim</label>
              <div style={{ fontStyle: "normal", fontSize: "1rem", fontWeight: 700, color: "#14b8a6", background: "var(--bg-alt)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--stroke)", display: "inline-block" }}>
                {Number(amount).toFixed(3)} SOL
              </div>
            </div>

            {formError && <div className="error-msg" style={{ marginBottom: "16px" }}>{formError}</div>}

            <button 
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ padding: "12px", fontSize: "0.75rem", borderRadius: "10px" }}
            >
              <Send size={12} />
              <span>{loading ? "Submitting..." : "Submit Scholarship Application"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Scholarship Application Log */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "left" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: "8px" }}>
          <Trophy size={16} style={{ color: "#fbbf24" }} />
          Your Submitted Applications
        </h4>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "450px" }}>
          {myApplications.length > 0 ? (
            myApplications.map((app, idx) => (
              <div key={idx} style={{ background: "var(--bg-alt)", border: "1px solid var(--stroke)", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "var(--text)" }}>{app.title}</strong>
                    <div style={{ fontSize: "0.74rem", color: "#14b8a6", fontWeight: 600, marginTop: "2px" }}>
                      Grant: {Number(app.amount).toFixed(3)} SOL
                    </div>
                  </div>
                  <span className={`status-badge ${app.status === "Approved" ? "success" : app.status === "Rejected" ? "failed" : "pending"}`}>
                    {app.status || "Pending"}
                  </span>
                </div>
                
                <p style={{ fontSize: "0.72rem", color: "var(--text-soft)", background: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid var(--stroke-soft)", margin: 0, lineHeight: 1.4 }}>
                  {app.statement}
                </p>

                {app.txId && (
                  <div className="mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "flex", gap: "4px", alignItems: "center" }}>
                    <LinkIcon size={10} />
                    <span>🔗 {app.txId.substring(0, 16)}...</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: "30px", border: "1px dashed var(--stroke)", borderRadius: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem" }}>
              No applications submitted yet. Use the claim form on the left to request a grant.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default Scholarships;
