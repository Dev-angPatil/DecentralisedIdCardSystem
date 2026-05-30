import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const SESSION_KEY = "chainCampusSession";

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Auto-clear legacy demo student sessions upon initialization
  useEffect(() => {
    if (
      session &&
      (session.email === "test.student@vit.edu" ||
        session.email === "teststudent@college.edu" ||
        session.name === "Test Student")
    ) {
      logout();
    }
  }, [session]);

  const setSession = (user) => {
    if (user) {
      const sessionData = {
        email: user.email,
        name: user.name,
        studentId: user.studentId,
        college: user.college,
        program: user.program,
        year: user.year,
        isAdmin: !!user.isAdmin,
        walletAddress: user.walletAddress,
        virtualBalance: user.virtualBalance ?? 5.0,
        loggedIn: true,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setSessionState(sessionData);
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem("chainCampusVirtualAddress");
      localStorage.removeItem("chainCampusWalletType");
      setSessionState(null);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const res = await response.json();
      if (!response.ok || !res.ok) {
        throw new Error(res.error || "Invalid username/email or password.");
      }

      const walletAddress = res.user.walletAddress || "CCvWmock_addr";
      localStorage.setItem("chainCampusWalletType", "virtual");
      localStorage.setItem("chainCampusVirtualAddress", walletAddress);
      
      setSession(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const loginWithWallet = async (walletAddress) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      
      const res = await response.json();
      if (!response.ok || !res.ok) {
        throw new Error(res.error || "NFC/Wallet Sign In failed.");
      }

      localStorage.setItem("chainCampusWalletType", "virtual");
      localStorage.setItem("chainCampusVirtualAddress", walletAddress);

      setSession(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password, college, program, year }) => {
    setLoading(true);
    try {
      // 1. Pre-generate virtual Solana address locally in background
      const seed = `${email}-${Date.now()}`;
      let h = 0;
      for (let i = 0; i < seed.length; i++) {
        h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
      }
      const localWallet = `CCvWa${Math.abs(h).toString(16).padEnd(35, "0")}`;

      // 2. Submit student metadata to server to create profile (Server returns 400 if email exists)
      const response = await fetch("/api/auth/register-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          password,
          college,
          program,
          year,
          walletAddress: localWallet,
          virtualBalance: 5.0,
        }),
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.error || "Registration failed. Check details.");
      }

      // Complete on-chain register mock simulation call
      try {
        await fetch("/api/transactions/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Session-Email": email,
          },
          body: JSON.stringify({
            txId: `tx-${Math.random().toString(36).substring(2, 10)}`,
            action: "Student Web3 Registration",
            status: "success",
          }),
        });
      } catch (err) {
        console.warn("Failed to log on-chain registration tx:", err);
      }

      // We DO NOT perform auto-login so the student is forced to learn and verify their credentials!
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setSession(null);
  };

  const getHeaders = () => {
    const headers = { "Content-Type": "application/json" };
    if (session) {
      headers["X-Session-Email"] = session.email || "";
      headers["X-Session-StudentId"] = session.studentId || "";
      headers["X-Session-IsAdmin"] = session.isAdmin ? "1" : "0";
    }
    return headers;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        login,
        loginWithWallet,
        register,
        logout,
        getHeaders,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
