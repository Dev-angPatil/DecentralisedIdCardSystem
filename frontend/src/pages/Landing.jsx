import React from "react";
import { Link } from "react-router-dom";
import { 
  Shield, BookOpen, Calendar, GraduationCap, 
  Wallet, Cpu, ArrowRight, CheckCircle2 
} from "lucide-react";

export function Landing() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "var(--bg)", color: "var(--text)", overflow: "hidden" }}>
      {/* Mesh and ambient grids */}
      <div className="mesh-bg">
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(167, 186, 157, 0.35) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }}></div>
        <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: "50vw", height: "50vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(230, 222, 195, 0.40) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }}></div>
      </div>

      {/* Swooping delicate path vector */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }} viewBox="0 0 1000 600" fill="none" preserveAspectRatio="none">
        <path d="M-50,420 C250,480 400,120 620,100 C840,80 880,310 760,400 C660,480 540,300 850,200" stroke="rgba(15, 23, 42, 0.04)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>

      {/* Header Container */}
      <header style={{ margin: "32px auto", width: "92%", maxWidth: "1300px", padding: 0, boxSizing: "border-box", position: "relative", zIndex: 5 }}>
        <div style={{ borderRadius: "28px", border: "1px solid rgba(255, 255, 255, 0.6)", background: "rgba(255, 255, 255, 0.32)", backdropFilter: "blur(32px)", position: "relative", padding: "48px", boxSizing: "border-box", overflow: "hidden", minHeight: "82vh", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 40px 100px rgba(15, 23, 42, 0.06)" }}>
          
          {/* Double Exposure Student Masked Background */}
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "50%", background: "url('images/hero_background.png') no-repeat center right", backgroundSize: "cover", zIndex: 0, opacity: 0.58, maskImage: "linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)", WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)", mixBlendMode: "multiply", pointerEvents: "none" }}></div>

          {/* Top navigation */}
          <div style={{ display: "flex", alignSelf: "stretch", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10, width: "100%", borderBottom: "1px solid rgba(15, 23, 42, 0.05)", paddingBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 700, transform: "translateY(-1px)" }}>•</span>
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, fontSize: "0.85rem", color: "var(--text)", letterSpacing: "0.15em", textTransform: "lowercase" }}>chain—campus</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "32px", marginInline: "auto" }}>
              <a href="#features" style={{ color: "rgba(15, 23, 42, 0.55)", textDecoration: "none", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "lowercase" }}>features</a>
              <a href="#overview" style={{ color: "rgba(15, 23, 42, 0.55)", textDecoration: "none", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "lowercase" }}>overview</a>
              <Link to="/login" style={{ color: "rgba(15, 23, 42, 0.55)", textDecoration: "none", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "lowercase" }}>sign in</Link>
            </div>
            <Link to="/login" className="btn" style={{ borderRadius: "99px", background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: "0.7rem", padding: "8px 22px", border: "none", letterSpacing: "0.08em", textTransform: "uppercase", boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)", textDecoration: "none" }}>launch portal</Link>
          </div>

          {/* Main Hero content row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: "48px", alignItems: "end", position: "relative", zIndex: 5, paddingTop: "80px", paddingBottom: "24px", width: "100%", boxSizing: "border-box" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ background: "rgba(99, 102, 241, 0.07)", border: "1px solid rgba(99, 102, 241, 0.15)", color: "#4f46e5", padding: "5px 12px", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <Shield size={12} />
                Solana Blockchain
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(3rem, 5.2vw, 4.8rem)", fontWeight: 300, lineHeight: 1.08, color: "var(--text)", margin: 0, letterSpacing: "-0.015em" }}>
                A Path That<br />Shapes Your<br />Academic Future.
              </h1>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "24px", maxWidth: "440px", marginLeft: "auto" }}>
              <p style={{ fontFamily: "'Inter',sans-serif", color: "var(--text-soft)", fontSize: "0.9rem", lineHeight: 1.7, margin: 0, fontWeight: 400 }}>
                We offer verified cryptographic onboarding to help students navigate credentials on-chain. Secure your attendance ledger, enroll in courses natively, and trigger automatic scholarship payouts — at your own pace.
              </p>
              <Link to="/login" className="btn" style={{ borderRadius: "99px", background: "rgba(15, 23, 42, 0.05)", border: "1px solid rgba(15, 23, 42, 0.12)", color: "var(--text)", fontWeight: 600, fontSize: "0.72rem", padding: "10px 24px", letterSpacing: "0.08em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                start your journey
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

        </div>
      </header>

      {/* Features grid */}
      <section id="features" style={{ background: "#f4f6f4", padding: "100px 0", position: "relative", zIndex: 5, borderTop: "1px solid var(--stroke)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 48px" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <p className="eyebrow" style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "8px", color: "var(--text-muted)" }}>Platform Capabilities</p>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "2.2rem", letterSpacing: "-0.03em", color: "var(--text)" }}>Verifiable Student Environment</h2>
            <p style={{ color: "var(--text-soft)", marginTop: "12px", fontSize: "0.95rem", maxWidth: "540px", marginInline: "auto", lineHeight: 1.6 }}>
              A production-ready environment designed for campuses prioritizing transparency, speed, and modern Web3 operations.
            </p>
          </div>

          <div className="feature-grid">
            <div className="glass-card" style={{ background: "#fff", border: "1px solid var(--stroke)", padding: "32px", borderRadius: "18px" }}>
              <div style={{ marginBottom: "20px", display: "inline-block", padding: "10px", background: "rgba(15,23,42,0.02)", borderRadius: "12px" }}>
                <Shield size={24} style={{ color: "#4f46e5" }} />
              </div>
              <h4 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1.15rem", color: "var(--text)", marginBottom: "10px" }}>Digital ID Card</h4>
              <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>A premium cryptographic student identity card synced with your Solana wallet address. Tap to authenticate instantly.</p>
            </div>

            <div className="glass-card" style={{ background: "#fff", border: "1px solid var(--stroke)", padding: "32px", borderRadius: "18px" }}>
              <div style={{ marginBottom: "20px", display: "inline-block", padding: "10px", background: "rgba(15,23,42,0.02)", borderRadius: "12px" }}>
                <CheckCircle2 size={24} style={{ color: "#4f46e5" }} />
              </div>
              <h4 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1.15rem", color: "var(--text)", marginBottom: "10px" }}>Attendance Ledger</h4>
              <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>Each attended session is recorded as a cryptographically-signed entry. Records are fully tamper-proof and verified.</p>
            </div>

            <div className="glass-card" style={{ background: "#fff", border: "1px solid var(--stroke)", padding: "32px", borderRadius: "18px" }}>
              <div style={{ marginBottom: "20px", display: "inline-block", padding: "10px", background: "rgba(15,23,42,0.02)", borderRadius: "12px" }}>
                <GraduationCap size={24} style={{ color: "#4f46e5" }} />
              </div>
              <h4 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1.15rem", color: "var(--text)", marginBottom: "10px" }}>Scholarship Portal</h4>
              <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>Submit academic claims for direct review. Approved scholarship funds deposit directly into your virtual wallet address.</p>
            </div>

            <div className="glass-card" style={{ background: "#fff", border: "1px solid var(--stroke)", padding: "32px", borderRadius: "18px" }}>
              <div style={{ marginBottom: "20px", display: "inline-block", padding: "10px", background: "rgba(15,23,42,0.02)", borderRadius: "12px" }}>
                <BookOpen size={24} style={{ color: "#4f46e5" }} />
              </div>
              <h4 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1.15rem", color: "var(--text)", marginBottom: "10px" }}>Course Enrollment</h4>
              <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>Enroll securely in courses. All academic registrations, requirements, and class rosters maintain exact integrity.</p>
            </div>

            <div className="glass-card" style={{ background: "#fff", border: "1px solid var(--stroke)", padding: "32px", borderRadius: "18px" }}>
              <div style={{ marginBottom: "20px", display: "inline-block", padding: "10px", background: "rgba(15,23,42,0.02)", borderRadius: "12px" }}>
                <Wallet size={24} style={{ color: "#4f46e5" }} />
              </div>
              <h4 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1.15rem", color: "var(--text)", marginBottom: "10px" }}>Virtual Solana Wallet</h4>
              <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>No external browser extensions required. Every student profile registers a verified virtual sandbox wallet natively.</p>
            </div>

            <div className="glass-card" style={{ background: "#fff", border: "1px solid var(--stroke)", padding: "32px", borderRadius: "18px" }}>
              <div style={{ marginBottom: "20px", display: "inline-block", padding: "10px", background: "rgba(15,23,42,0.02)", borderRadius: "12px" }}>
                <Cpu size={24} style={{ color: "#4f46e5" }} />
              </div>
              <h4 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1.15rem", color: "var(--text)", marginBottom: "10px" }}>Admin Operations</h4>
              <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>Administrators can review and approve scholarship requests, schedule events, list classes, and manage student assets.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Join the Future CTA */}
      <section id="overview" style={{ padding: "100px 48px", textAlign: "center", maxWidth: "700px", margin: "0 auto", position: "relative", zIndex: 5 }}>
        <p className="eyebrow" style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "12px", color: "var(--text-muted)" }}>Immediate Deployment</p>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "2.4rem", letterSpacing: "-0.03em", color: "var(--text)", marginBottom: "16px" }}>
          Join the <span style={{ background: "linear-gradient(135deg, #4f46e5, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>future of academic identity</span>
        </h2>
        <p style={{ color: "var(--text-soft)", marginBottom: "32px", lineHeight: 1.7, fontSize: "0.95rem" }}>
          Integrate secure, cryptographic student profiles into your campus with absolute ease. Verify credentials instantly, eliminate fraud, and elevate your tech stack.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/login" className="btn btn-lg" style={{ borderRadius: "99px", background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: "0.8rem", padding: "12px 32px", border: "none", letterSpacing: "0.08em", textTransform: "uppercase", boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)", textDecoration: "none" }}>Launch Portal Now →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--stroke)", padding: "32px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f4f6f4", position: "relative", zIndex: 5, boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "linear-gradient(135deg,#6366f1,#14b8a6)", display: "grid", placeItems: "center", fontWeight: 800, color: "#fff", fontSize: "0.75rem" }}>CC</div>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: "var(--text)", fontSize: "0.85rem" }}>ChainCampus</span>
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>Decentralized Student Identity Platform · Solana Integration Sandbox</p>
      </footer>
    </div>
  );
}
export default Landing;
