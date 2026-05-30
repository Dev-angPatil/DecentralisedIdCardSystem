import React from "react";
import { useApp } from "../context/AppContext";
import { Clock } from "lucide-react";

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

  return (
    <div style={{ textAlign: "left" }}>
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>
          Weekly Lecture Schedule
        </h3>
        <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "4px" }}>
          Explore your registered class courses. Enrolled subjects automatically populate your weekly schedule.
        </p>
      </div>

      <div className="glass-card" style={{ padding: "32px" }}>
        <div className="timetable-grid">
          {days.map((day) => {
            const dayCourses = getCoursesForDay(day);

            return (
              <div key={day} className="timetable-day-col">
                <div className="timetable-day-header">{day === "Mon" ? "Monday" : day === "Tue" ? "Tuesday" : day === "Wed" ? "Wednesday" : day === "Thu" ? "Thursday" : "Friday"}</div>
                
                {dayCourses.length > 0 ? (
                  dayCourses.map((c) => (
                    <div key={c.id} className={`class-slot ${c.color || "blue"}`} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div className="class-time" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={10} />
                        <span>{c.time}</span>
                      </div>
                      <div className="class-name">{c.code}: {c.name}</div>
                      <div className="class-instructor">Prof. {c.instructor}</div>
                      <div className="class-room">{c.room}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "20px 10px", border: "1px dashed var(--stroke)", borderRadius: "10px", textAlign: "center", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                    No Lectures
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default Timetable;
