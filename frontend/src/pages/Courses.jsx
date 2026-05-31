import React from "react";
import { useApp } from "../context/AppContext";
import { useApi } from "../hooks/useApi";
import { useBlockchain } from "../hooks/useBlockchain";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Check, Link as LinkIcon, Lock } from "lucide-react";

// Curated high-fidelity accent palettes to match ChainCampus serene design system
const GLOW_COLORS = {
  indigo: {
    border: "rgba(99, 102, 241, 0.35)",
    glow: "rgba(99, 102, 241, 0.15)",
    glowHigh: "rgba(99, 102, 241, 0.25)",
    badgeBg: "rgba(99, 102, 241, 0.06)",
    badgeBorder: "rgba(99, 102, 241, 0.18)",
    badgeText: "#6366f1",
  },
  emerald: {
    border: "rgba(16, 185, 129, 0.35)",
    glow: "rgba(16, 185, 129, 0.15)",
    glowHigh: "rgba(16, 185, 129, 0.25)",
    badgeBg: "rgba(16, 185, 129, 0.06)",
    badgeBorder: "rgba(16, 185, 129, 0.18)",
    badgeText: "#10b981",
  },
  amber: {
    border: "rgba(245, 158, 11, 0.35)",
    glow: "rgba(245, 158, 11, 0.15)",
    glowHigh: "rgba(245, 158, 11, 0.25)",
    badgeBg: "rgba(245, 158, 11, 0.06)",
    badgeBorder: "rgba(245, 158, 11, 0.18)",
    badgeText: "#f59e0b",
  },
  teal: {
    border: "rgba(20, 184, 166, 0.35)",
    glow: "rgba(20, 184, 166, 0.15)",
    glowHigh: "rgba(20, 184, 166, 0.25)",
    badgeBg: "rgba(20, 184, 166, 0.06)",
    badgeBorder: "rgba(20, 184, 166, 0.18)",
    badgeText: "#14b8a6",
  },
  rose: {
    border: "rgba(239, 68, 68, 0.35)",
    glow: "rgba(239, 68, 68, 0.15)",
    glowHigh: "rgba(239, 68, 68, 0.25)",
    badgeBg: "rgba(239, 68, 68, 0.06)",
    badgeBorder: "rgba(239, 68, 68, 0.18)",
    badgeText: "#ef4444",
  },
};

const getGlowTheme = (course, isEnrolled) => {
  if (isEnrolled) return GLOW_COLORS.emerald; // Verifiably enrolled gets emerald green glow
  const code = course.code || "";
  if (code.startsWith("CS")) return GLOW_COLORS.indigo;
  if (code.startsWith("EE")) return GLOW_COLORS.amber;
  if (code.startsWith("MA")) return GLOW_COLORS.rose;
  return GLOW_COLORS.teal;
};

export function Courses() {
  const { state, refreshData, showToast } = useApp();
  const { enrollCourse, loading } = useApi();
  const { enrollCourseOnChain } = useBlockchain();
  const { session } = useAuth();
  const [hoveredCardId, setHoveredCardId] = React.useState(null);

  // Find enrolled course IDs
  const enrolledIds = state.enrolledCourses ? state.enrolledCourses.map(e => e.courseId) : [];

  const filteredCourses = (state.courses || []).filter((course) => {
    // Admins see all courses
    if (session?.isAdmin) return true;

    // Check college eligibility
    const hasCollege = !course.eligibleColleges || 
                       course.eligibleColleges.includes("all") || 
                       course.eligibleColleges.includes(session?.college);

    // Check branch eligibility
    const hasBranch = !course.eligibleBranches || 
                      course.eligibleBranches.includes("all") || 
                      course.eligibleBranches.includes(session?.program);

    // Check year eligibility
    const hasYear = !course.eligibleYears || 
                    course.eligibleYears.includes("all") || 
                    course.eligibleYears.includes(session?.year);

    return hasCollege && hasBranch && hasYear;
  });

  const handleEnroll = async (course) => {
    setLoadingLocal(course.id, true);
    try {
      // 1. Log transaction on-chain
      const blockchainRes = await enrollCourseOnChain(course.id);
      
      // 2. Register course enrollment in local SQLite database
      await enrollCourse(course.id);

      showToast(
        "Enrolled Successfully ✓", 
        `Class ${course.code} has been successfully added to your ledger.`, 
        "success"
      );
      
      // 3. Refresh app state data
      await refreshData();
    } catch (err) {
      showToast("Enrollment failed", err.message, "failed");
    } finally {
      setLoadingLocal(course.id, false);
    }
  };

  // Keep separate loading indicator per course card
  const [localLoading, setLocalLoading] = React.useState({});
  const setLoadingLocal = (id, val) => {
    setLocalLoading(prev => ({ ...prev, [id]: val }));
  };

  return (
    <div style={{ textAlign: "left" }}>
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>
          Verifiable Class Courses
        </h3>
        <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "4px" }}>
          Natively register for academic semesters. Enrolling logs a cryptographic entry in your student profile connection.
        </p>
      </div>

      <div className="feature-grid">
        {filteredCourses && filteredCourses.length > 0 ? (
          filteredCourses.map((course) => {
            const isEnrolled = enrolledIds.includes(course.id);
            const courseEnrolledObj = state.enrolledCourses ? state.enrolledCourses.find(e => e.courseId === course.id) : null;
            const isLoading = localLoading[course.id];
            const theme = getGlowTheme(course, isEnrolled);
            const isHovered = hoveredCardId === course.id;

            return (
              <div 
                key={course.id} 
                className="glass-card"
                onMouseEnter={() => setHoveredCardId(course.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  justifyContent: "space-between", 
                  gap: "20px",
                  background: "#ffffff",
                  borderRadius: "18px",
                  padding: "28px",
                  transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s ease, box-shadow 0.4s ease",
                  
                  // Steady glow border + breathing shadow if enrolled, or glow-lift on hover
                  border: isEnrolled 
                    ? `1px solid ${theme.border}` 
                    : isHovered 
                      ? `1px solid ${theme.border}` 
                      : "1px solid var(--stroke)",
                      
                  boxShadow: isEnrolled
                    ? isHovered
                      ? `0 20px 45px ${theme.glowHigh}, 0 4px 12px ${theme.glow}, inset 0 0 16px rgba(16, 185, 129, 0.08)`
                      : `0 8px 30px ${theme.glow}, inset 0 0 12px rgba(16, 185, 129, 0.04)`
                    : isHovered
                      ? `0 20px 40px ${theme.glow}, 0 4px 12px ${theme.glowHigh}`
                      : "var(--shadow-md)",
                      
                  transform: isHovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
                  
                  // Pulse ambient card shadow animation when verified and not hovered
                  animation: isEnrolled && !isHovered 
                    ? "card-glow-breathing 4s infinite ease-in-out" 
                    : "none",
                  
                  // Inject custom variables for the keyframe animation
                  "--pulse-glow": theme.glow,
                  "--pulse-glow-high": theme.glowHigh
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <span 
                      className="status-badge" 
                      style={{ 
                        background: theme.badgeBg, 
                        border: `1px solid ${theme.badgeBorder}`, 
                        color: theme.badgeText, 
                        textTransform: "uppercase",
                        fontWeight: 700,
                        fontSize: "0.68rem",
                        letterSpacing: "0.04em"
                      }}
                    >
                      {course.code}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      {course.credits} Credits
                    </span>
                  </div>
                  <h4 style={{ margin: "0 0 8px", fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
                    {course.name}
                  </h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-soft)", margin: "0 0 12px" }}>
                    Instructor: <strong>{course.instructor}</strong>
                  </p>
                  <div style={{ background: "var(--bg-alt)", borderRadius: "8px", padding: "10px", fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div>Schedule: <strong style={{ color: "var(--text-soft)" }}>{course.days ? (typeof course.days === 'string' ? JSON.parse(course.days).join(", ") : course.days.join(", ")) : ""} at {course.time}</strong></div>
                    <div>Room: <strong style={{ color: "var(--text-soft)" }}>{course.room}</strong></div>
                  </div>
                </div>

                <div>
                  {isEnrolled ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontSize: "0.78rem", fontWeight: 700 }}>
                        <span 
                          className="animate-pulse-led"
                          style={{ 
                            display: "inline-block", 
                            width: "6px", 
                            height: "6px", 
                            borderRadius: "50%", 
                            background: "#10b981" 
                          }} 
                        />
                        <Check size={14} />
                        <span>Verifiably Enrolled</span>
                      </div>
                      {courseEnrolledObj?.txId && (
                        <div className="mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <LinkIcon size={10} />
                          <span>{courseEnrolledObj.txId.substring(0, 16)}...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button 
                      className="btn btn-primary btn-full"
                      onClick={() => handleEnroll(course)}
                      disabled={isLoading || loading}
                      style={{ fontSize: "0.7rem", padding: "10px 14px", borderRadius: "10px" }}
                    >
                      {isLoading ? "Signing Ledger..." : "Enroll In Course"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ gridColumn: "1/-1", padding: "60px 40px", border: "1px dashed var(--stroke)", borderRadius: "18px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
            No academic courses currently available matching your college, branch, or year criteria.
          </div>
        )}
      </div>
    </div>
  );
}
export default Courses;

