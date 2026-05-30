import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useApi } from "../hooks/useApi";
import { useBlockchain } from "../hooks/useBlockchain";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Award, Plus, Calendar, BookOpen, Send, RefreshCw } from "lucide-react";

export function AdminDashboard() {
  const { state, refreshData, showToast } = useApp();
  const { reviewScholarship, createCourse, createEvent, loading } = useApi();
  const { reviewScholarshipOnChain } = useBlockchain();

  // Create Course form states
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCredits, setCourseCredits] = useState(4);
  const [courseInstructor, setCourseInstructor] = useState("");
  const [courseDays, setCourseDays] = useState('["Mon", "Wed", "Fri"]');
  const [courseTime, setCourseTime] = useState("9:00 AM");
  const [courseRoom, setCourseRoom] = useState("LH-201");
  const [courseColor, setCourseColor] = useState("blue");

  // Create Event form states
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventCapacity, setEventCapacity] = useState(100);
  const [eventDesc, setEventDesc] = useState("");

  const handleReview = async (app, approved) => {
    try {
      showToast("Submitting Review...", `Verifying claim on blockchain`, "pending");

      // 1. Submit on chain review
      const blockchainRes = await reviewScholarshipOnChain(app.id, app.title, approved);

      // 2. Submit database review
      await reviewScholarship({
        id: app.id,
        email: app.studentEmail || app.email,
        title: app.title,
        status: approved ? "Approved" : "Rejected",
        txId: blockchainRes.txId,
        amount: app.amount
      });

      showToast(
        approved ? "Claim Approved ✓" : "Claim Rejected", 
        `Successfully signed decision. Funds ${approved ? "released" : "cancelled"}.`, 
        approved ? "success" : "failed"
      );

      await refreshData();
    } catch (err) {
      showToast("Review failed", err.message, "failed");
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseCode || !courseName || !courseInstructor) {
      showToast("Form Error", "Please fill in all course parameters.", "failed");
      return;
    }
    try {
      await createCourse({
        code: courseCode,
        name: courseName,
        credits: parseInt(courseCredits),
        instructor: courseInstructor,
        days: courseDays,
        time: courseTime,
        room: courseRoom,
        color: courseColor
      });
      showToast("Course Created ✓", `${courseCode} course has been published.`, "success");
      
      setCourseCode("");
      setCourseName("");
      setCourseInstructor("");
      
      await refreshData();
    } catch (err) {
      showToast("Failed to create course", err.message, "failed");
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle || !eventDate || !eventVenue || !eventDesc) {
      showToast("Form Error", "Please fill in all event parameters.", "failed");
      return;
    }
    try {
      await createEvent({
        title: eventTitle,
        date: eventDate,
        venue: eventVenue,
        capacity: parseInt(eventCapacity),
        description: eventDesc
      });
      showToast("Event Created ✓", `${eventTitle} has been published.`, "success");
      
      setEventTitle("");
      setEventDate("");
      setEventVenue("");
      setEventDesc("");

      await refreshData();
    } catch (err) {
      showToast("Failed to create event", err.message, "failed");
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "32px" }}>
      
      {/* Left Column: Scholarship Claims Review List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>
              Administrative Control Hub
            </h3>
            <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "4px" }}>
              Review student academic scholarship claims, approve grants transfers, and manage curriculum additions.
            </p>
          </div>
          <button className="btn btn-ghost" onClick={refreshData} style={{ padding: "8px" }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* List of Applications */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: "8px" }}>
            <Award size={16} style={{ color: "#fbbf24" }} />
            Pending Student Scholarship Claims
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "500px" }}>
            {state.scholarshipApplications && state.scholarshipApplications.length > 0 ? (
              state.scholarshipApplications.map((app) => (
                <div key={app.id || app.title} style={{ background: "var(--bg-alt)", border: "1px solid var(--stroke)", padding: "18px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong style={{ fontSize: "0.86rem", color: "var(--text)" }}>{app.title}</strong>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        Applicant: <strong>{app.studentName || app.name || "Student"}</strong> ({app.studentEmail || app.email})
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "#14b8a6", fontWeight: 700, marginTop: "4px" }}>
                        Claim Value: {Number(app.amount).toFixed(3)} SOL
                      </div>
                    </div>
                    <span className={`status-badge ${app.status === "Approved" ? "success" : app.status === "Rejected" ? "failed" : "pending"}`}>
                      {app.status || "Pending"}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.72rem", color: "var(--text-soft)", background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid var(--stroke-soft)", margin: 0, lineHeight: 1.4 }}>
                    {app.statement}
                  </p>

                  {(!app.status || app.status === "Pending") && (
                    <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleReview(app, true)}
                        disabled={loading}
                        style={{ padding: "6px 16px", background: "#10b981", fontSize: "0.68rem" }}
                      >
                        Approve Grant
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleReview(app, false)}
                        disabled={loading}
                        style={{ padding: "6px 16px", border: "1px solid rgba(239,68,68,0.2)", color: "var(--red)", background: "rgba(239,68,68,0.03)", fontSize: "0.68rem" }}
                      >
                        Reject Claim
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: "40px", border: "1px dashed var(--stroke)", borderRadius: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                No scholarship applications logged in the system.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Create Course / Create Event Form Panels */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", textAlign: "left" }}>
        
        {/* Setup Course Form */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={16} style={{ color: "#6366f1" }} />
            Curriculum Course Builder
          </h4>

          <form onSubmit={handleCreateCourse}>
            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label htmlFor="course-code">Course Code</label>
              <input type="text" id="course-code" placeholder="CS301" value={courseCode} onChange={e => setCourseCode(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label htmlFor="course-name">Course Name</label>
              <input type="text" id="course-name" placeholder="Computer Networks" value={courseName} onChange={e => setCourseName(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label htmlFor="course-instructor">Instructor Name</label>
              <input type="text" id="course-instructor" placeholder="Dr. Anjali Nair" value={courseInstructor} onChange={e => setCourseInstructor(e.target.value)} required />
            </div>
            <div className="form-grid" style={{ marginBottom: "12px" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="course-credits">Credits</label>
                <select id="course-credits" value={courseCredits} onChange={e => setCourseCredits(e.target.value)}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="course-color">Card Color</label>
                <select id="course-color" value={courseColor} onChange={e => setCourseColor(e.target.value)}>
                  <option value="blue">Blue</option>
                  <option value="pink">Pink</option>
                  <option value="mint">Mint</option>
                  <option value="peach">Peach</option>
                  <option value="amber">Amber</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ padding: "10px", fontSize: "0.7rem", borderRadius: "8px" }} disabled={loading}>
              <Plus size={12} />
              <span>Add Course</span>
            </button>
          </form>
        </div>

        {/* Publish Event Form */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={16} style={{ color: "#14b8a6" }} />
            Event Publisher Panel
          </h4>

          <form onSubmit={handleCreateEvent}>
            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label htmlFor="evt-title">Event Title</label>
              <input type="text" id="evt-title" placeholder="Web3 & Solana Summit 2026" value={eventTitle} onChange={e => setEventTitle(e.target.value)} required />
            </div>
            <div className="form-grid" style={{ marginBottom: "12px" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="evt-date">Date Label</label>
                <input type="text" id="evt-date" placeholder="June 18, 2026" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="evt-venue">Venue</label>
                <input type="text" id="evt-venue" placeholder="Main Auditorium" value={eventVenue} onChange={e => setEventVenue(e.target.value)} required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label htmlFor="evt-desc">Event Summary</label>
              <textarea id="evt-desc" rows={3} placeholder="Provide details on the event, hackathon guidelines, or agenda..." value={eventDesc} onChange={e => setEventDesc(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ padding: "10px", fontSize: "0.7rem", borderRadius: "8px" }} disabled={loading}>
              <Plus size={12} />
              <span>Publish Event</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
export default AdminDashboard;
