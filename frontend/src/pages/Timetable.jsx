import React from "react";
import { useApp } from "../context/AppContext";
import { Clock, MapPin, User, Bookmark, Flame } from "lucide-react";

export function Timetable() {
  const { state } = useApp();

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  // Find enrolled course IDs
  const enrolledIds = state.enrolledCourses ? state.enrolledCourses.map(e => e.courseId) : [];

  // Filter courses that are enrolled
  const myCourses = state.courses
    ? state.courses.filter(c => enrolledIds.includes(c.id))
    : [];

  const getCoursesForDay = (day) => {
    return myCourses.filter(c => {
      try {
        const daysArr = JSON.parse(c.days);
        return daysArr.includes(day);
      } catch {
        return false;
      }
    });
  };

  const getDayFullName = (day) => {
    switch (day) {
      case "Mon": return "Monday";
      case "Tue": return "Tuesday";
      case "Wed": return "Wednesday";
      case "Thu": return "Thursday";
      case "Fri": return "Friday";
      default: return day;
    }
  };

  const getDayIndex = (day) => {
    switch (day) {
      case "Mon": return 1;
      case "Tue": return 2;
      case "Wed": return 3;
      case "Thu": return 4;
      case "Fri": return 5;
      default: return 0;
    }
  };

  const currentDayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat

  // Color theme mapping for glowing cards
  const getColorStyles = (color) => {
    switch (color) {
      case "blue":
        return {
          border: "rgba(96, 165, 250, 0.15)",
          bg: "linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)",
          glow: "rgba(59, 130, 246, 0.2)",
          accent: "#60a5fa"
        };
      case "pink":
        return {
          border: "rgba(244, 114, 182, 0.15)",
          bg: "linear-gradient(135deg, rgba(136, 19, 55, 0.2) 0%, rgba(219, 39, 119, 0.1) 100%)",
          glow: "rgba(236, 72, 153, 0.2)",
          accent: "#f472b6"
        };
      case "mint":
        return {
          border: "rgba(52, 211, 153, 0.15)",
          bg: "linear-gradient(135deg, rgba(6, 78, 59, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)",
          glow: "rgba(16, 185, 129, 0.2)",
          accent: "#34d399"
        };
      case "peach":
        return {
          border: "rgba(251, 146, 60, 0.15)",
          bg: "linear-gradient(135deg, rgba(120, 53, 4, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)",
          glow: "rgba(245, 158, 11, 0.2)",
          accent: "#fb923c"
        };
      case "amber":
        return {
          border: "rgba(251, 191, 36, 0.15)",
          bg: "linear-gradient(135deg, rgba(120, 53, 4, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)",
          glow: "rgba(251, 191, 36, 0.2)",
          accent: "#fbbf24"
        };
      case "lavender":
      default:
        return {
          border: "rgba(167, 139, 250, 0.15)",
          bg: "linear-gradient(135deg, rgba(76, 29, 149, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)",
          glow: "rgba(139, 92, 246, 0.2)",
          accent: "#a78bfa"
        };
    }
  };

  return (
    <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header Section */}
      <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.07)", paddingBottom: "24px" }}>
        <h3 style={{ fontSize: "clamp(2rem, 3.5vw, 2.6rem)", fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", margin: 0, color: "var(--text)", lineHeight: 1.1 }}>
          On-Chain Study Schedule
        </h3>
        <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "8px", maxWidth: "600px", lineHeight: 1.6 }}>
          Review your verified weekly lectures catalog. Classes you enroll in are synchronized automatically from the decentralized catalog and render dynamically in your schedule grid.
        </p>
      </div>

      {/* Main Glass Schedule Grid */}
      <div 
        style={{ 
          padding: "24px", 
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          background: "rgba(17, 24, 39, 0.25)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.3)"
        }}
      >
        <div 
          className="timetable-grid" 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(5, 1fr)", 
            gap: "16px" 
          }}
        >
          {days.map((day) => {
            const dayCourses = getCoursesForDay(day);
            const isToday = getDayIndex(day) === currentDayIndex;

            return (
              <div 
                key={day} 
                className="timetable-day-col" 
                style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "16px",
                  background: isToday ? "rgba(99, 102, 241, 0.06)" : "rgba(255, 255, 255, 0.01)",
                  borderRadius: "20px",
                  padding: "16px",
                  border: isToday ? "1px solid rgba(99, 102, 241, 0.25)" : "1px solid rgba(255, 255, 255, 0.04)",
                  boxShadow: isToday ? "0 10px 30px -10px rgba(99, 102, 241, 0.15)" : "none",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                {/* Header for the specific Day */}
                <div 
                  className="timetable-day-header" 
                  style={{ 
                    fontFamily: "'Space Grotesk', sans-serif", 
                    fontSize: "0.76rem", 
                    fontWeight: 700, 
                    textTransform: "uppercase", 
                    letterSpacing: "0.06em", 
                    color: isToday ? "#818cf8" : "var(--text)", 
                    paddingBottom: "10px", 
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  {isToday && (
                    <span 
                      className="today-pulse-dot"
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#818cf8",
                        boxShadow: "0 0 8px #818cf8",
                        display: "inline-block"
                      }}
                    />
                  )}
                  <span>{getDayFullName(day)}</span>
                </div>
                
                {/* Course slot cards for the day */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {dayCourses.length > 0 ? (
                    dayCourses.map((c) => {
                      const colors = getColorStyles(c.color);
                      return (
                        <div 
                          key={c.id} 
                          className="class-slot-interactive"
                          style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            gap: "8px", 
                            padding: "16px",
                            borderRadius: "14px",
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`,
                            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                            cursor: "pointer",
                            position: "relative",
                            overflow: "hidden"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                            e.currentTarget.style.boxShadow = `0 12px 24px -6px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`;
                            e.currentTarget.style.borderColor = colors.accent;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "none";
                            e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.05)`;
                            e.currentTarget.style.borderColor = colors.border;
                          }}
                        >
                          {/* Time Row */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", fontWeight: 700, color: colors.accent }}>
                            <Clock size={12} style={{ opacity: 0.9 }} />
                            <span>{c.time}</span>
                          </div>
  
                          {/* Title */}
                          <div 
                            style={{ 
                              fontSize: "0.82rem", 
                              fontWeight: 700, 
                              color: "#ffffff", 
                              lineHeight: 1.35,
                              fontFamily: "'Space Grotesk', sans-serif"
                            }}
                          >
                            {c.code}: {c.name}
                          </div>
  
                          {/* Additional Meta (Instructor & Room) */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderTop: "1px dashed rgba(255, 255, 255, 0.06)", paddingTop: "8px", marginTop: "2px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.66rem", color: "var(--text-soft)" }}>
                              <User size={11} style={{ opacity: 0.6 }} />
                              <span>{c.instructor}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.66rem", color: "var(--text-soft)" }}>
                              <MapPin size={11} style={{ opacity: 0.6 }} />
                              <span style={{ fontWeight: 600 }}>{c.room}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div 
                      style={{ 
                        padding: "36px 12px", 
                        border: "1px dashed rgba(255, 255, 255, 0.08)", 
                        borderRadius: "14px", 
                        textAlign: "center", 
                        fontSize: "0.72rem", 
                        color: "var(--text-muted)",
                        background: "rgba(255, 255, 255, 0.01)"
                      }}
                    >
                      No lectures scheduled
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default Timetable;
