import React from "react";
import { useApp } from "../context/AppContext";
import { Clock, MapPin, User, Bookmark } from "lucide-react";

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

  return (
    <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header Section */}
      <div style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.05)", paddingBottom: "24px" }}>
        <h3 style={{ fontSize: "clamp(2rem, 3.5vw, 2.6rem)", fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", margin: 0, color: "var(--text)", lineHeight: 1.1 }}>
          Weekly Lecture Schedule
        </h3>
        <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "8px", maxWidth: "600px", lineHeight: 1.6 }}>
          Review your upcoming weekly lectures and subject hours. Subjects you enroll in from the academic catalog automatically synchronize and populate into your timetable slots on-chain.
        </p>
      </div>

      {/* Main Glass Schedule Grid */}
      <div 
        className="glass-container" 
        style={{ 
          padding: "32px", 
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.6)",
          background: "rgba(255,255,255,0.32)",
          boxShadow: "var(--shadow-xl)"
        }}
      >
        <div 
          className="timetable-grid" 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "20px" 
          }}
        >
          {days.map((day) => {
            const dayCourses = getCoursesForDay(day);

            return (
              <div 
                key={day} 
                className="timetable-day-col" 
                style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "16px",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "16px",
                  padding: "16px",
                  border: "1px solid rgba(15, 23, 42, 0.02)"
                }}
              >
                {/* Header for the specific Day */}
                <div 
                  className="timetable-day-header" 
                  style={{ 
                    fontFamily: "'Space Grotesk', sans-serif", 
                    fontSize: "0.78rem", 
                    fontWeight: 700, 
                    textTransform: "uppercase", 
                    letterSpacing: "0.06em", 
                    color: "var(--text)", 
                    paddingBottom: "10px", 
                    borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
                    textAlign: "center"
                  }}
                >
                  {getDayFullName(day)}
                </div>
                
                {/* Course slot cards for the day */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {dayCourses.length > 0 ? (
                    dayCourses.map((c) => (
                      <div 
                        key={c.id} 
                        className={`class-slot ${c.color || "blue"}`} 
                        style={{ 
                          display: "flex", 
                          flexDirection: "column", 
                          gap: "8px", 
                          padding: "14px",
                          borderRadius: "12px",
                          transition: "transform 0.2s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.2s ease"
                        }}
                      >
                        {/* Time Row */}
                        <div className="class-time" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.65rem", fontWeight: 700 }}>
                          <Clock size={11} style={{ opacity: 0.8 }} />
                          <span>{c.time}</span>
                        </div>

                        {/* Title */}
                        <div 
                          className="class-name" 
                          style={{ 
                            fontSize: "0.8rem", 
                            fontWeight: 700, 
                            color: "var(--text)", 
                            lineHeight: 1.3,
                            fontFamily: "'Space Grotesk', sans-serif"
                          }}
                        >
                          {c.code}: {c.name}
                        </div>

                        {/* Additional Meta (Instructor & Room) */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px", borderTop: "1px dashed rgba(15, 23, 42, 0.04)", paddingTop: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.64rem", color: "var(--text-soft)" }}>
                            <User size={10} style={{ opacity: 0.7 }} />
                            <span>Prof. {c.instructor}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.64rem", color: "var(--text-soft)" }}>
                            <MapPin size={10} style={{ opacity: 0.7 }} />
                            <span>Room {c.room}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div 
                      style={{ 
                        padding: "24px 12px", 
                        border: "1px dashed var(--stroke)", 
                        borderRadius: "12px", 
                        textAlign: "center", 
                        fontSize: "0.7rem", 
                        color: "var(--text-muted)",
                        background: "rgba(255, 255, 255, 0.2)"
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
