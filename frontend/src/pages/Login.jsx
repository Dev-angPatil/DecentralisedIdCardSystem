import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { Shield, Eye, EyeOff, Radio, Award } from "lucide-react";

export const REGISTERED_COLLEGES = [
  "Indian Institute of Technology (IIT), Bombay",
  "Indian Institute of Technology (IIT), Delhi",
  "Indian Institute of Technology (IIT), Madras",
  "Vellore Institute of Technology (VIT), Vellore",
  "Delhi Technological University (DTU), Delhi",
  "Manipal Academy of Higher Education (MAHE), Manipal",
  "BITS Pilani, Pilani",
  "National Institute of Technology (NIT), Trichy",
  "SRM Institute of Science and Technology, Chennai",
  "Vishwakarma Institute of Technology (VIT), Pune",
  "ChainCampus Virtual University (CCVU)"
];

export const REGISTERED_BRANCHES = [
  "B.Tech Computer Science Engineering",
  "B.Tech Electronics & Communication Engineering",
  "B.Tech Information Technology",
  "B.Tech Mechanical Engineering",
  "B.Tech Electrical & Electronics Engineering",
  "B.Tech Civil Engineering",
  "B.Sc Data Science & AI",
  "M.Tech Computer Science",
  "MBA Systems Management"
];

export const COLLEGE_EMAIL_DOMAINS = {
  "Indian Institute of Technology (IIT), Bombay": ["@iitb.ac.in"],
  "Indian Institute of Technology (IIT), Delhi": ["@iitd.ac.in"],
  "Indian Institute of Technology (IIT), Madras": ["@iitm.ac.in"],
  "Vellore Institute of Technology (VIT), Vellore": ["@vit.ac.in", "@vitstudent.ac.in"],
  "Delhi Technological University (DTU), Delhi": ["@dtu.ac.in", "@dtu.edu"],
  "Manipal Academy of Higher Education (MAHE), Manipal": ["@manipal.edu", "@learner.manipal.edu"],
  "BITS Pilani, Pilani": ["@bits-pilani.ac.in", "@pilani.bits-pilani.ac.in"],
  "National Institute of Technology (NIT), Trichy": ["@nitt.edu"],
  "SRM Institute of Science and Technology, Chennai": ["@srmist.edu.in"],
  "Vishwakarma Institute of Technology (VIT), Pune": ["@vit.edu"],
  "ChainCampus Virtual University (CCVU)": ["@college.edu", "@chaincampus.edu", "@personal.com", "@gmail.com"]
};

export function Login() {
  const { login, register, loginWithWallet, loading } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("student"); // "student" | "admin"
  const [authPhase, setAuthPhase] = useState("login"); // "login" | "register"
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup Form States
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupCollege, setSignupCollege] = useState(REGISTERED_COLLEGES[0]);
  const [signupProgram, setSignupProgram] = useState(REGISTERED_BRANCHES[0]);
  const [signupYear, setSignupYear] = useState("3rd Year");
  const [signupError, setSignupError] = useState("");
  
  // Registration success indicator (used to pre-fill sign in and show modal notice)
  const [registeredUser, setRegisteredUser] = useState(null);

  // Admin login states
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    
    if (!loginEmail || !loginPassword) {
      setLoginError("Email and password are required.");
      return;
    }

    try {
      const user = await login(loginEmail, loginPassword);
      if (user) {
        showToast("Sign In Successful 🎉", `Welcome back, ${user.name}!`, "success");
        navigate("/dashboard");
      }
    } catch (err) {
      setLoginError(err.message || "Invalid email or password.");
    }
  };

  const handleStudentSignup = async (e) => {
    e.preventDefault();
    setSignupError("");

    if (!signupName || !signupEmail || !signupPassword || !signupCollege || !signupProgram) {
      setSignupError("All fields are required.");
      return;
    }

    // Verify institutional email domain matching the selected college
    const allowedDomains = COLLEGE_EMAIL_DOMAINS[signupCollege];
    if (allowedDomains) {
      const emailLower = signupEmail.toLowerCase().trim();
      const isValid = allowedDomains.some(domain => emailLower.endsWith(domain));
      if (!isValid) {
        setSignupError(`Registration requires a valid institutional email domain for ${signupCollege}. Your email must end with: ${allowedDomains.join(" or ")}`);
        return;
      }
    }

    try {
      const user = await register({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        college: signupCollege,
        program: signupProgram,
        year: signupYear,
      });

      if (user) {
        // Registration success!
        // 1. Save user object to display the confirmation notice
        setRegisteredUser(user);
        
        // 2. Pre-fill the login email input with the newly registered email
        setLoginEmail(signupEmail);
        setLoginPassword("");
        
        // 3. Clear the registration form fields
        setSignupName("");
        setSignupEmail("");
        setSignupPassword("");
        setSignupCollege(REGISTERED_COLLEGES[0]);
        setSignupProgram(REGISTERED_BRANCHES[0]);
        
        // 4. Switch tab to login to force manual sign in!
        setAuthPhase("login");
        
        showToast(
          "Registration Successful ✓", 
          "Your profile and wallet have been created! Please log in to confirm credentials.", 
          "success"
        );
      }
    } catch (err) {
      setSignupError(err.message || "Registration failed. Email might already be registered.");
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError("");

    if (!adminEmail || !adminPassword) {
      setAdminError("Email and password are required.");
      return;
    }

    try {
      const user = await login(adminEmail, adminPassword);
      if (user && user.isAdmin) {
        showToast("Welcome Administrator 🛡️", user.name, "success");
        navigate("/admin-dashboard");
      } else {
        setAdminError("You do not have administrative access.");
      }
    } catch (err) {
      setAdminError(err.message || "Invalid admin credentials.");
    }
  };

  const handleNfcLogin = () => {
    const { startNfcScan, showToast } = useApp();
    
    startNfcScan(
      async (cardData) => {
        if (!cardData.walletAddress) {
          showToast("NFC Read Error", "Invalid card payload.", "failed");
          return;
        }
        try {
          const user = await loginWithWallet(cardData.walletAddress);
          if (user) {
            showToast("NFC Sign In Successful 🎉", `Welcome back, ${user.name}!`, "success");
            navigate(user.isAdmin ? "/admin-dashboard" : "/dashboard");
          }
        } catch (err) {
          showToast("NFC Login Failed", err.message, "failed");
        }
      },
      (err) => {
        showToast("NFC Error", err.message || "Failed to scan card.", "failed");
      }
    );
  };

  return (
    <div className="auth-page">
      {/* Left Brand Panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", marginBottom: "40px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: "linear-gradient(135deg,#6366f1,#14b8a6)", display: "grid", placeItems: "center", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, color: "#fff" }}>CC</div>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "var(--text)" }}>ChainCampus</span>
          </Link>

          <p className="eyebrow" style={{ color: "#6366f1", textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "12px" }}>Blockchain Identity</p>
          <h1 className="auth-headline">
            Your academic identity,<br />
            <span style={{ background: "linear-gradient(135deg,#6366f1,#14b8a6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 500 }}>verified on-chain.</span>
          </h1>
          <p className="auth-subline">
            ChainCampus uses cryptographic signatures to manage student records, attendance, and course registrations securely on Solana. Setup your virtual wallet natively and tap to check-in.
          </p>

          <div className="auth-network-box">
            <div className="auth-network-label">Active Sandbox Network</div>
            <div className="auth-network-value">Solana Devnet · Virtual Wallet Sandbox</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "28px" }}>
            <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.4)", border: "1px solid rgba(15,23,42,0.04)" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", color: "#6366f1" }}>100%</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-soft)", marginTop: "2px" }}>No wallet download</div>
            </div>
            <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.4)", border: "1px solid rgba(15,23,42,0.04)" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", color: "#14b8a6" }}>⚡</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-soft)", marginTop: "2px" }}>Instant NFC checks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="auth-right">
        <div className="auth-box">
          
          {/* Tab Selector */}
          <div className="tab-pills" style={{ marginBottom: "28px" }}>
            <button 
              className={`tab-pill ${activeTab === "student" ? "active" : ""}`}
              onClick={() => { setActiveTab("student"); setRegisteredUser(null); }}
            >
              🎓 Student
            </button>
            <button 
              className={`tab-pill ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => { setActiveTab("admin"); setRegisteredUser(null); }}
            >
              🔑 Admin
            </button>
          </div>

          {activeTab === "student" ? (
            <div>
              {authPhase === "login" ? (
                /* STUDENT LOGIN */
                <div>
                  <div className="auth-box-title">Student Sign In</div>
                  <p className="auth-box-sub">Enter your email and chosen password to launch your portal.</p>

                  {/* Registered success notification banner (forces credentials awareness) */}
                  {registeredUser && (
                    <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.18)", borderRadius: "10px", padding: "12px", marginBottom: "20px", fontSize: "0.76rem", color: "#10b981", textAlign: "left", lineHeight: 1.4 }}>
                      <strong>✓ Account Created Successfully!</strong><br />
                      Your student profile has been registered on-chain. Please **enter your chosen password** below to verify credentials and log in.
                    </div>
                  )}

                  <form onSubmit={handleStudentLogin}>
                    <div className="form-group">
                      <label htmlFor="login-email">Email Address</label>
                      <input 
                        type="email" 
                        id="login-email"
                        placeholder="student@college.edu"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="login-password">Password</label>
                      <div style={{ position: "relative" }}>
                        <input 
                          type={showLoginPassword ? "text" : "password"}
                          id="login-password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                          style={{ paddingRight: "44px" }}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "grid", placeItems: "center" }}
                        >
                          {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {loginError && <div className="error-msg" style={{ marginBottom: "16px" }}>{loginError}</div>}

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                      {loading ? "Authenticating..." : "Sign In →"}
                    </button>

                    <button 
                      type="button" 
                      className="btn btn-secondary btn-full" 
                      onClick={handleNfcLogin}
                      style={{ marginTop: "12px", background: "rgba(15,23,42,0.02)", display: "flex", gap: "8px", justifyContent: "center" }}
                    >
                      <Radio size={14} style={{ color: "#14b8a6" }} />
                      <span>Sign In with NFC Card</span>
                    </button>
                  </form>

                  <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    New student? <button onClick={() => { setAuthPhase("register"); setRegisteredUser(null); }} style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>Register Profile Here</button>
                  </p>
                </div>
              ) : (
                /* STUDENT SIGNUP */
                <div>
                  <div className="auth-box-title">Student Registration</div>
                  <p className="auth-box-sub">Complete your details to set up your profile and wallet.</p>

                  <form onSubmit={handleStudentSignup}>
                    <div className="form-group">
                      <label htmlFor="reg-name">Full Name</label>
                      <input 
                        type="text" 
                        id="reg-name"
                        placeholder="Aarav Mehta"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="reg-email">Email Address</label>
                      <input 
                        type="email" 
                        id="reg-email"
                        placeholder="aarav.m@college.edu"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="reg-password">Choose Password</label>
                      <input 
                        type="password" 
                        id="reg-password"
                        placeholder="Must be min 6 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>

                    <div style={{ borderTop: "1px solid var(--stroke)", margin: "18px 0" }}></div>
                    <p style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "12px", textAlign: "left" }}>Academic Parameters</p>

                    <div className="form-group">
                      <label htmlFor="reg-college">College / University</label>
                      <select
                        id="reg-college"
                        value={signupCollege}
                        onChange={(e) => setSignupCollege(e.target.value)}
                        required
                      >
                        {REGISTERED_COLLEGES.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-grid" style={{ marginBottom: 0 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="reg-program">Branch / Program</label>
                        <select
                          id="reg-program"
                          value={signupProgram}
                          onChange={(e) => setSignupProgram(e.target.value)}
                          required
                        >
                          {REGISTERED_BRANCHES.map((br) => (
                            <option key={br} value={br}>{br}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="reg-year">Academic Year</label>
                        <select 
                          id="reg-year"
                          value={signupYear}
                          onChange={(e) => setSignupYear(e.target.value)}
                          required
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="Postgrad">Postgraduate</option>
                        </select>
                      </div>
                    </div>

                    {signupError && <div className="error-msg" style={{ marginTop: "14px" }}>{signupError}</div>}

                    <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: "24px" }} disabled={loading}>
                      {loading ? "Registering..." : "Sign Up & Create Profile →"}
                    </button>
                  </form>

                  <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Already have credentials? <button onClick={() => setAuthPhase("login")} style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>Sign In Here</button>
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* ADMINISTRATOR LOGIN */
            <div>
              <div className="auth-box-title">Admin Sign In</div>
              <p className="auth-box-sub">Access the administration portal with your secure key.</p>

              <form onSubmit={handleAdminLogin}>
                <div className="form-group">
                  <label htmlFor="admin-email">Admin Email</label>
                  <input 
                    type="email" 
                    id="admin-email"
                    placeholder="admin@college.edu"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-password">Secure Password</label>
                  <input 
                    type="password" 
                    id="admin-password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                {adminError && <div className="error-msg" style={{ marginBottom: "16px" }}>{adminError}</div>}

                <button type="submit" className="btn btn-primary btn-full" style={{ background: "linear-gradient(135deg,#d97706,#f59e0b)" }} disabled={loading}>
                  {loading ? "Authenticating..." : "Authenticate Admin →"}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
export default Login;
