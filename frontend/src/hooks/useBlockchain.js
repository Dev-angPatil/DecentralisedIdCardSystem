import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "./useApi";
import { useApp } from "../context/AppContext";

export function useBlockchain() {
  const { session, setSession } = useAuth();
  const { addTransaction } = useApi();
  const { setTxProgress } = useApp();

  const getActiveWallet = useCallback(() => {
    return session?.walletAddress || "CCvWmock_addr";
  }, [session]);

  const executeOnChain = useCallback(
    async (actionLabel, payload = {}) => {
      // 1. Generate authentic simulated Solana 88-character transaction signature (base58)
      const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      let txId = "";
      for (let i = 0; i < 88; i++) {
        txId += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Trigger On-Chain Transaction Progress Overlay States
      try {
        setTxProgress({ active: true, label: actionLabel, status: "signature", txId: "" });
        await new Promise(r => setTimeout(r, 800));
        
        setTxProgress({ active: true, label: actionLabel, status: "broadcasting", txId: "" });
        await new Promise(r => setTimeout(r, 1000));
        
        setTxProgress({ active: true, label: actionLabel, status: "consensus", txId: "" });
        await new Promise(r => setTimeout(r, 1000));
        
        setTxProgress({ active: true, label: actionLabel, status: "confirmed", txId: txId });
        await new Promise(r => setTimeout(r, 800));
      } finally {
        setTxProgress({ active: false, label: "", status: "", txId: "" });
      }

      // 2. Deduct tiny simulated transaction GAS fee (e.g. 0.005 SOL)
      if (session && !session.isAdmin) {
        const gasCost = 0.005;
        const nextBalance = Math.max(0, (session.virtualBalance || 5.00) - gasCost);
        
        // Save locally
        setSession({
          ...session,
          virtualBalance: nextBalance,
        });

        // Save on server
        try {
          await fetch("/api/wallet/deduct-gas", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Session-Email": session.email,
            },
            body: JSON.stringify({ amount: gasCost }),
          });
        } catch (err) {
          console.warn("[blockchain] Failed to deduct gas fee on server:", err);
        }
      }

      // 3. Log transaction in SQLite sandbox ledger
      try {
        await addTransaction({
          txId,
          action: actionLabel,
          status: "success",
        });
      } catch (err) {
        console.warn("[blockchain] Failed to log transaction in SQLite:", err);
      }

      return {
        success: true,
        txId,
        action: actionLabel,
      };
    },
    [session, setSession, addTransaction, setTxProgress]
  );

  const registerStudentOnChain = useCallback(
    (studentId, name) => executeOnChain("Student Web3 Registration", { studentId, name }),
    [executeOnChain]
  );

  const enrollCourseOnChain = useCallback(
    (courseId) => executeOnChain(`Course Enrollment: ${courseId}`, { courseId }),
    [executeOnChain]
  );

  const registerForEventOnChain = useCallback(
    (eventId, title) => executeOnChain(`Event Registration: ${title}`, { eventId, title }),
    [executeOnChain]
  );

  const markAttendanceOnChain = useCallback(
    (eventId, studentId) => executeOnChain("Attendance Ledger Sign", { eventId, studentId }),
    [executeOnChain]
  );

  const applyScholarshipOnChain = useCallback(
    (scholarshipId, title) => executeOnChain(`Scholarship Claim: ${title}`, { scholarshipId, title }),
    [executeOnChain]
  );

  const reviewScholarshipOnChain = useCallback(
    (applicationId, title, approved) => 
      executeOnChain(`Scholarship Review: ${title} (${approved ? "Approved" : "Rejected"})`, { applicationId, approved }),
    [executeOnChain]
  );

  const gradeStudentOnChain = useCallback(
    (studentId, courseId, grade) => 
      executeOnChain(`Issue Academic Grade: ${courseId} (${grade})`, { studentId, courseId, grade }),
    [executeOnChain]
  );

  return {
    getActiveWallet,
    registerStudentOnChain,
    enrollCourseOnChain,
    registerForEventOnChain,
    markAttendanceOnChain,
    applyScholarshipOnChain,
    reviewScholarshipOnChain,
    gradeStudentOnChain,
  };
}
