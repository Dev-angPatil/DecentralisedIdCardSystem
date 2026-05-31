import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export function useApi() {
  const { getHeaders, setSession, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(
    async (path, method = "GET", body = null) => {
      setLoading(true);
      setError(null);
      try {
        const headers = getHeaders();
        const options = { method, headers };
        if (body) {
          options.body = JSON.stringify(body);
        }

        const response = await fetch(path, options);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Something went wrong.");
        }
        return data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getHeaders]
  );

  const bootstrap = useCallback(() => request("/api/bootstrap"), [request]);
  
  const enrollCourse = useCallback(
    (courseId) => request("/api/courses/enroll", "POST", { courseId }),
    [request]
  );

  const registerEvent = useCallback(
    (eventId) => request("/api/events/register", "POST", { eventId }),
    [request]
  );

  const applyScholarship = useCallback(
    (applicationData) => request("/api/scholarships/apply", "POST", applicationData),
    [request]
  );

  const reviewScholarship = useCallback(
    (reviewData) => request("/api/scholarships/review", "POST", reviewData),
    [request]
  );

  const addTransaction = useCallback(
    (txData) => request("/api/transactions/add", "POST", txData),
    [request]
  );

  const createEvent = useCallback(
    (eventData) => request("/api/events/create", "POST", eventData),
    [request]
  );

  const createCourse = useCallback(
    (courseData) => request("/api/courses/create", "POST", courseData),
    [request]
  );

  const markAttendance = useCallback(
    (attendanceData) => request("/api/attendance/mark", "POST", attendanceData),
    [request]
  );

  const airdropSOL = useCallback(async () => {
    const res = await request("/api/wallet/airdrop", "POST", { amount: 1.0 });
    if (res.ok && session) {
      // Sync balance to our active session
      setSession({
        ...session,
        virtualBalance: res.virtualBalance,
      });
    }
    return res;
  }, [request, session, setSession]);

  const gradeStudent = useCallback(
    (gradeData) => request("/api/admin/grade-student", "POST", gradeData),
    [request]
  );

  return {
    loading,
    error,
    bootstrap,
    enrollCourse,
    registerEvent,
    applyScholarship,
    reviewScholarship,
    addTransaction,
    createEvent,
    createCourse,
    markAttendance,
    airdropSOL,
    gradeStudent,
  };
}
