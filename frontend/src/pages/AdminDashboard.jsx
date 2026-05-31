import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useApi } from "../hooks/useApi";
import { useBlockchain } from "../hooks/useBlockchain";
import { ShieldCheck, Award, Plus, Calendar, BookOpen, RefreshCw, CheckCircle2, GraduationCap } from "lucide-react";
import { REGISTERED_COLLEGES, REGISTERED_BRANCHES } from "./Login";

export function AdminDashboard() {
  const { state, refreshData, showToast } = useApp();
  const { reviewScholarship, createCourse, createEvent, gradeStudent, loading } = useApi();
  const { reviewScholarshipOnChain, gradeStudentOnChain } = useBlockchain();
  const location = useLocation();

  // Navigation state
  const [adminTab, setAdminTab] = useState("scholarships"); // "scholarships" | "courses" | "events" | "gradebook"

  // Grading form states
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [gradingCourseId, setGradingCourseId] = useState("");
  const [gradingGrade, setGradingGrade] = useState("A+");

  useEffect(() => {
    if (location.pathname === "/admin-courses") {
      setAdminTab("courses");
    } else if (location.pathname === "/admin-events") {
      setAdminTab("events");
    } else if (location.pathname === "/admin-scholarships") {
      setAdminTab("scholarships");
    } else if (location.pathname === "/admin-gradebook") {
      setAdminTab("gradebook");
    }
  }, [location.pathname]);

  // Student, Course, and Enrollment mapping for Gradebook Tab
  const students = React.useMemo(() => {
    return (state.users || []).filter(u => !u.isAdmin);
  }, [state.users]);

  const selectedStudent = React.useMemo(() => {
    return students.find(s => s.studentId === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  const enrollments = React.useMemo(() => {
    return (state.enrolledCourses || []).filter(e => e.studentId === (selectedStudent?.studentId || ""));
  }, [state.enrolledCourses, selectedStudent]);

  const courseMap = React.useMemo(() => {
    const map = {};
    (state.courses || []).forEach(c => {
      map[c.id || c.courseId] = c;
    });
    return map;
  }, [state.courses]);

  useEffect(() => {
    if (adminTab === "gradebook" && students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].studentId);
    }
  }, [adminTab, students, selectedStudentId]);

  // Create Course form states
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCredits, setCourseCredits] = useState(4);
  const [courseInstructor, setCourseInstructor] = useState("");
  const [courseDays, setCourseDays] = useState('["Mon", "Wed", "Fri"]');
  const [courseTime, setCourseTime] = useState("9:00 AM");
  const [courseRoom, setCourseRoom] = useState("LH-201");
  const [courseColor, setCourseColor] = useState("blue");
  
  // Eligibility Course states
  const [courseColleges, setCourseColleges] = useState(["all"]);
  const [courseBranches, setCourseBranches] = useState(["all"]);
  const [courseYears, setCourseYears] = useState(["all"]);

  // Create Event form states
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventCapacity, setEventCapacity] = useState(100);
  const [eventDesc, setEventDesc] = useState("");

  // Eligibility Event states
  const [eventColleges, setEventColleges] = useState(["all"]);
  const [eventBranches, setEventBranches] = useState(["all"]);
  const [eventYears, setEventYears] = useState(["all"]);

  // Helper toggle function for criteria check selections
  const handleToggle = (list, setList, val) => {
    if (val === "all") {
      setList(["all"]);
    } else {
      setList((prev) => {
        const filtered = prev.filter((item) => item !== "all");
        if (filtered.includes(val)) {
          const next = filtered.filter((item) => item !== val);
          return next.length === 0 ? ["all"] : next;
        } else {
          return [...filtered, val];
        }
      });
    }
  };

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
    
    // Auto-generate course ID
    const courseId = `crs-${Math.random().toString(36).substring(2, 10)}`;

    try {
      await createCourse({
        id: courseId,
        courseId,
        code: courseCode,
        name: courseName,
        credits: parseInt(courseCredits),
        instructor: courseInstructor,
        days: JSON.parse(courseDays),
        time: courseTime,
        room: courseRoom,
        color: courseColor,
        eligibleColleges: courseColleges,
        eligibleBranches: courseBranches,
        eligibleYears: courseYears
      });
      
      showToast("Course Created ✓", `${courseCode} course has been published.`, "success");
      
      setCourseCode("");
      setCourseName("");
      setCourseInstructor("");
      setCourseColleges(["all"]);
      setCourseBranches(["all"]);
      setCourseYears(["all"]);
      
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

    // Auto-generate event ID
    const eventId = `evt-${Math.random().toString(36).substring(2, 10)}`;

    try {
      await createEvent({
        id: eventId,
        eventId,
        title: eventTitle,
        date: eventDate,
        venue: eventVenue,
        capacity: parseInt(eventCapacity),
        description: eventDesc,
        verified: 1,
        eligibleColleges: eventColleges,
        eligibleBranches: eventBranches,
        eligibleYears: eventYears
      });
      
      showToast("Event Created ✓", `${eventTitle} has been published.`, "success");
      
      setEventTitle("");
      setEventDate("");
      setEventVenue("");
      setEventDesc("");
      setEventColleges(["all"]);
      setEventBranches(["all"]);
      setEventYears(["all"]);

      await refreshData();
    } catch (err) {
      showToast("Failed to create event", err.message, "failed");
    }
  };

  const handleGradeStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !gradingCourseId || !gradingGrade) {
      showToast("Grading Error", "Please select a student, course, and grade.", "failed");
      return;
    }

    const student = (state.users || []).find(u => u.studentId === selectedStudentId);
    if (!student) {
      showToast("Grading Error", "Selected student not found.", "failed");
      return;
    }

    try {
      showToast("Signing Grade...", "Issuing cryptographic grade signature on ledger...", "pending");

      // 1. Submit on-chain transaction progress
      const blockchainRes = await gradeStudentOnChain(selectedStudentId, gradingCourseId, gradingGrade);

      // 2. Submit database record update
      await gradeStudent({
        studentId: selectedStudentId,
        courseId: gradingCourseId,
        grade: gradingGrade,
        txId: blockchainRes.txId,
      });

      showToast("Grade Certified ✓", `Assigned ${gradingGrade} in ${gradingCourseId} for ${student.name || 'Student'}.`, "success");
      setGradingCourseId("");
      await refreshData();
    } catch (err) {
      showToast("Grading Failed", err.message, "failed");
    }
  };

  const renderActiveSelectionLabel = (list) => {
    if (list.includes("all")) return <span style={{ color: "#14b8a6", fontWeight: 600 }}>All (No Restriction)</span>;
    return <span style={{ color: "#6366f1", fontWeight: 600 }}>{list.length} selected</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", textAlign: "left" }}>
      
      {/* Header section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(15, 23, 42, 0.05)", paddingBottom: "20px" }}>
        <div>
          <h3 style={{ fontSize: "clamp(2rem, 3.5vw, 2.6rem)", fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", margin: 0, color: "var(--text)", lineHeight: 1.1 }}>
            Administrative Control Console
          </h3>
          <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "8px", maxWidth: "600px" }}>
            Decoupled operational command deck to authorize academic claims, manage course eligibility criteria, and schedule verified student events.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={refreshData} style={{ padding: "10px", borderRadius: "50%", display: "grid", placeItems: "center" }}>
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Tab Pill Sub-Navigation */}
      <div className="tab-pills" style={{ display: "flex", gap: "10px", paddingBottom: "4px" }}>
        <button 
          className={`tab-pill ${adminTab === "scholarships" ? "active" : ""}`}
          onClick={() => setAdminTab("scholarships")}
          style={{ padding: "10px 24px", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
        >
          🏆 Scholarship Claims
        </button>
        <button 
          className={`tab-pill ${adminTab === "courses" ? "active" : ""}`}
          onClick={() => setAdminTab("courses")}
          style={{ padding: "10px 24px", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
        >
          🏫 Academic Catalog
        </button>
        <button 
          className={`tab-pill ${adminTab === "events" ? "active" : ""}`}
          onClick={() => setAdminTab("events")}
          style={{ padding: "10px 24px", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
        >
          📅 Campus Events
        </button>
        <button 
          className={`tab-pill ${adminTab === "gradebook" ? "active" : ""}`}
          onClick={() => setAdminTab("gradebook")}
          style={{ padding: "10px 24px", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
        >
          🎓 Gradebook Manager
        </button>
      </div>

      {/* Tab Panels */}
      <div style={{ flex: 1 }}>
        
        {adminTab === "scholarships" && (
          /* TAB 1: SCHOLARSHIPS Claims Panel */
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: "8px", color: "var(--text)" }}>
              <Award size={18} style={{ color: "#fbbf24" }} />
              Pending Student Scholarship Claims Review List
            </h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {state.scholarshipApplications && state.scholarshipApplications.length > 0 ? (
                state.scholarshipApplications.map((app) => (
                  <div key={app.id || app.title} style={{ background: "var(--bg-alt)", border: "1px solid var(--stroke)", padding: "20px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "12px", transition: "transform var(--t-fast) var(--ease-spring)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <strong style={{ fontSize: "0.95rem", color: "var(--text)", fontFamily: "'Space Grotesk',sans-serif" }}>{app.title}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "3px" }}>
                          Applicant: <strong>{app.studentName || app.name || "Student"}</strong> ({app.studentEmail || app.email})
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#14b8a6", fontWeight: 700, marginTop: "4px" }}>
                          Claim Value: {Number(app.amount).toFixed(3)} SOL
                        </div>
                      </div>
                      <span className={`status-badge ${app.status === "Approved" ? "success" : app.status === "Rejected" ? "failed" : "pending"}`}>
                        {app.status || "Pending"}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.78rem", color: "var(--text-soft)", background: "#ffffff", padding: "14px", borderRadius: "10px", border: "1px solid var(--stroke-soft)", margin: 0, lineHeight: 1.5 }}>
                      {app.statement}
                    </p>

                    {(!app.status || app.status === "Pending") && (
                      <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleReview(app, true)}
                          disabled={loading}
                          style={{ padding: "8px 20px", background: "#10b981", fontSize: "0.72rem" }}
                        >
                          Approve Grant
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleReview(app, false)}
                          disabled={loading}
                          style={{ padding: "8px 20px", border: "1px solid rgba(239,68,68,0.2)", color: "var(--red)", background: "rgba(239,68,68,0.03)", fontSize: "0.72rem" }}
                        >
                          Reject Claim
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: "60px 40px", border: "1px dashed var(--stroke)", borderRadius: "18px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  No scholarship applications logged in the system.
                </div>
              )}
            </div>
          </div>
        )}

        {adminTab === "courses" && (
          /* TAB 2: ACADEMIC Catalog Builder Form */
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }}>
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: "8px", color: "var(--text)" }}>
              <BookOpen size={18} style={{ color: "#6366f1" }} />
              Curriculum Course Builder
            </h4>

            <form onSubmit={handleCreateCourse} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="course-code">Course Code</label>
                  <input type="text" id="course-code" placeholder="CS301" value={courseCode} onChange={e => setCourseCode(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="course-name">Course Name</label>
                  <input type="text" id="course-name" placeholder="Computer Networks" value={courseName} onChange={e => setCourseName(e.target.value)} required />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="course-instructor">Instructor Name</label>
                  <input type="text" id="course-instructor" placeholder="Dr. Anjali Nair" value={courseInstructor} onChange={e => setCourseInstructor(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="course-room">Room / Lab</label>
                  <input type="text" id="course-room" placeholder="CS-Lab-2" value={courseRoom} onChange={e => setCourseRoom(e.target.value)} required />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="course-credits">Credits Value</label>
                  <select id="course-credits" value={courseCredits} onChange={e => setCourseCredits(e.target.value)}>
                    <option value="1">1 Credit</option>
                    <option value="2">2 Credits</option>
                    <option value="3">3 Credits</option>
                    <option value="4">4 Credits</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="course-color">Card Accent Color</label>
                  <select id="course-color" value={courseColor} onChange={e => setCourseColor(e.target.value)}>
                    <option value="blue">Blue</option>
                    <option value="pink">Pink</option>
                    <option value="mint">Mint</option>
                    <option value="peach">Peach</option>
                    <option value="amber">Amber</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--stroke)", margin: "10px 0" }}></div>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "4px" }}>
                Target Student Eligibility Criteria
              </p>

              {/* Course Eligibility 1: Registered Colleges Checkboxes */}
              <div className="form-group">
                <label style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Eligible Colleges / Universities</span>
                  {renderActiveSelectionLabel(courseColleges)}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", background: "var(--bg-alt)", padding: "16px", borderRadius: "12px", border: "1px solid var(--stroke-soft)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", cursor: "pointer", textTransform: "none", color: "var(--text-soft)", fontWeight: 500, margin: 0 }}>
                    <input type="checkbox" checked={courseColleges.includes("all")} onChange={() => handleToggle(courseColleges, setCourseColleges, "all")} />
                    <strong>All Colleges (No Restriction)</strong>
                  </label>
                  {REGISTERED_COLLEGES.map((col) => (
                    <label key={col} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", cursor: "pointer", textTransform: "none", color: "var(--text-soft)", fontWeight: 500, margin: 0 }}>
                      <input type="checkbox" checked={courseColleges.includes(col)} onChange={() => handleToggle(courseColleges, setCourseColleges, col)} />
                      <span>{col.split(" (")[0]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Course Eligibility 2: Branches Checkboxes */}
              <div className="form-group">
                <label style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Eligible Branches / Programs</span>
                  {renderActiveSelectionLabel(courseBranches)}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", background: "var(--bg-alt)", padding: "16px", borderRadius: "12px", border: "1px solid var(--stroke-soft)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", cursor: "pointer", textTransform: "none", color: "var(--text-soft)", fontWeight: 500, margin: 0 }}>
                    <input type="checkbox" checked={courseBranches.includes("all")} onChange={() => handleToggle(courseBranches, setCourseBranches, "all")} />
                    <strong>All Branches</strong>
                  </label>
                  {REGISTERED_BRANCHES.map((br) => (
                    <label key={br} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", cursor: "pointer", textTransform: "none", color: "var(--text-soft)", fontWeight: 500, margin: 0 }}>
                      <input type="checkbox" checked={courseBranches.includes(br)} onChange={() => handleToggle(courseBranches, setCourseBranches, br)} />
                      <span>{br}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Course Eligibility 3: Academic Years Checkboxes */}
              <div className="form-group">
                <label style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Eligible Academic Years</span>
                  {renderActiveSelectionLabel(courseYears)}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px", background: "var(--bg-alt)", padding: "16px", borderRadius: "12px", border: "1px solid var(--stroke-soft)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", cursor: "pointer", textTransform: "none", color: "var(--text-soft)", fontWeight: 500, margin: 0 }}>
                    <input type="checkbox" checked={courseYears.includes("all")} onChange={() => handleToggle(courseYears, setCourseYears, "all")} />
                    <strong>All Years</strong>
                  </label>
                  {["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgrad"].map((yr) => (
                    <label key={yr} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", cursor: "pointer", textTransform: "none", color: "var(--text-soft)", fontWeight: 500, margin: 0 }}>
                      <input type="checkbox" checked={courseYears.includes(yr)} onChange={() => handleToggle(courseYears, setCourseYears, yr)} />
                      <span>{yr}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" style={{ padding: "12px", fontSize: "0.75rem", borderRadius: "10px", marginTop: "12px" }} disabled={loading}>
                <Plus size={14} />
                <span>Publish Course to Catalog</span>
              </button>
            </form>
          </div>
        )}

        {adminTab === "events" && (
          /* TAB 3: CAMPUS EVENTS Panel */
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }}>
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: "8px", color: "var(--text)" }}>
              <Calendar size={18} style={{ color: "#14b8a6" }} />
              Event Publisher Panel
            </h4>

            <form onSubmit={handleCreateEvent} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="form-group">
                <label htmlFor="evt-title">Event Title</label>
                <input type="text" id="evt-title" placeholder="Web3 & Solana Summit 2026" value={eventTitle} onChange={e => setEventTitle(e.target.value)} required />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="evt-date">Date Label</label>
                  <input type="text" id="evt-date" placeholder="June 18, 2026" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="evt-venue">Venue</label>
                  <input type="text" id="evt-venue" placeholder="Main Auditorium" value={eventVenue} onChange={e => setEventVenue(e.target.value)} required />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="evt-capacity">Participant Capacity</label>
                  <input type="number" id="evt-capacity" min="5" value={eventCapacity} onChange={e => setEventCapacity(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="evt-desc">Event Summary</label>
                <textarea id="evt-desc" rows={3} placeholder="Provide details on the event, hackathon guidelines, or agenda..." value={eventDesc} onChange={e => setEventDesc(e.target.value)} required />
              </div>

              <div style={{ borderTop: "1px solid var(--stroke)", margin: "10px 0" }}></div>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "4px" }}>
                Target Student Eligibility Criteria
              </p>

              {/* Event Eligibility 1: Registered Colleges Checkboxes */}
              <div className="form-group">
                <label style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Eligible Colleges / Universities</span>
                  {renderActiveSelectionLabel(eventColleges)}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", background: "var(--bg-alt)", padding: "16px", borderRadius: "12px", border: "1px solid var(--stroke-soft)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", cursor: "pointer", textTransform: "none", color: "var(--text-soft)", fontWeight: 500, margin: 0 }}>
                    <input type="checkbox" checked={eventColleges.includes("all")} onChange={() => handleToggle(eventColleges, setEventColleges, "all")} />
                    <strong>All Colleges (No Restriction)</strong>
                  </label>
                  {REGISTERED_COLLEGES.map((col) => (
                    <label key={col} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", cursor: "pointer", textTransform: "none", color: "var(--text-soft)", fontWeight: 500, margin: 0 }}>
                      <input type="checkbox" checked={eventColleges.includes(col)} onChange={() => handleToggle(eventColleges, setEventColleges, col)} />
                      <span>{col.split(" (")[0]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Event Eligibility 2: Branches Checkboxes */}
              <div className="form-group">
                <label style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Eligible Branches / Programs</span>
                  {renderActiveSelectionLabel(eventBranches)}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", background: "var(--bg-alt)", padding: "16px", borderRadius: "12px", border: "1px solid var(--stroke-soft)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", cursor: "pointer", textTransform: "none", color: "var(--text-soft)", fontWeight: 500, margin: 0 }}>
                    <input type="checkbox" checked={eventBranches.includes("all")} onChange={() => handleToggle(eventBranches, setEventBranches, "all")} />
                    <strong>All Branches</strong>
                  </label>
                  {REGISTERED_BRANCHES.map((br) => (
                    <label key={br} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", cursor: "pointer", textTransform: "none", color: "var(--text-soft)", fontWeight: 500, margin: 0 }}>
                      <input type="checkbox" checked={eventBranches.includes(br)} onChange={() => handleToggle(eventBranches, setEventBranches, br)} />
                      <span>{br}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Event Eligibility 3: Academic Years Checkboxes */}
              <div className="form-group">
                <label style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Eligible Academic Years</span>
                  {renderActiveSelectionLabel(eventYears)}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px", background: "var(--bg-alt)", padding: "16px", borderRadius: "12px", border: "1px solid var(--stroke-soft)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", cursor: "pointer", textTransform: "none", color: "var(--text-soft)", fontWeight: 500, margin: 0 }}>
                    <input type="checkbox" checked={eventYears.includes("all")} onChange={() => handleToggle(eventYears, setEventYears, "all")} />
                    <strong>All Years</strong>
                  </label>
                  {["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgrad"].map((yr) => (
                    <label key={yr} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", cursor: "pointer", textTransform: "none", color: "var(--text-soft)", fontWeight: 500, margin: 0 }}>
                      <input type="checkbox" checked={eventYears.includes(yr)} onChange={() => handleToggle(eventYears, setEventYears, yr)} />
                      <span>{yr}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" style={{ padding: "12px", fontSize: "0.75rem", borderRadius: "10px", marginTop: "12px" }} disabled={loading}>
                <Plus size={14} />
                <span>Publish Event & Sync Ledger</span>
              </button>
            </form>
          </div>
        )}

        {adminTab === "gradebook" && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 320px) 1fr", gap: "24px", alignItems: "start" }}>
            
            {/* Sidebar: Student list */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: "var(--text)" }}>
                Student Roster
              </h4>
              <p style={{ color: "var(--text-soft)", fontSize: "0.75rem", margin: 0 }}>
                Select a student to view academic records and sign grades.
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
                {students.length > 0 ? (
                  students.map((student) => {
                    const isSelected = selectedStudent?.studentId === student.studentId;
                    return (
                      <button
                        key={student.studentId}
                        onClick={() => {
                          setSelectedStudentId(student.studentId);
                          setGradingCourseId("");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          border: isSelected ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid var(--stroke-soft)",
                          background: isSelected ? "rgba(139, 92, 246, 0.08)" : "var(--bg-alt)",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all var(--t-fast)"
                        }}
                      >
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: isSelected ? "linear-gradient(135deg, #a78bfa, #8b5cf6)" : "linear-gradient(135deg, #cbd5e1, #94a3b8)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          fontSize: "0.85rem",
                          fontWeight: 700
                        }}>
                          {student.name ? student.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() : "ST"}
                        </div>
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {student.name || "Unknown Student"}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            ID: {student.studentId || "N/A"}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    No students registered yet.
                  </div>
                )}
              </div>
            </div>

            {/* Main Area: Selection Details & Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {selectedStudent ? (
                <>
                  {/* Selected Student profile info */}
                  <div className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", padding: "20px" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", fontFamily: "'Space Grotesk',sans-serif" }}>
                        {selectedStudent.name}
                      </h4>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "8px", fontSize: "0.76rem", color: "var(--text-soft)" }}>
                        <span>ID: <strong>{selectedStudent.studentId}</strong></span>
                        <span>College: <strong>{selectedStudent.college || "N/A"}</strong></span>
                        <span>Program: <strong>{selectedStudent.program || "N/A"}</strong></span>
                        <span>Year: <strong>{selectedStudent.year || "N/A"}</strong></span>
                      </div>
                    </div>
                    <div style={{ padding: "6px 14px", borderRadius: "20px", border: "1px solid rgba(16, 185, 129, 0.2)", background: "rgba(16, 185, 129, 0.05)", color: "#10b981", fontSize: "0.72rem", fontWeight: 700 }}>
                      Active Enrollment
                    </div>
                  </div>

                  {/* Grading / Certificate Form */}
                  <div className="glass-card" style={{ padding: "24px" }}>
                    <h5 style={{ margin: "0 0 16px 0", fontSize: "0.9rem", fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <GraduationCap size={16} style={{ color: "#8b5cf6" }} />
                      Issue Cryptographically Verified GPA Certificate Seal
                    </h5>

                    {enrollments.length > 0 ? (
                      <form onSubmit={handleGradeStudent} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div className="form-grid" style={{ gridTemplateColumns: "1fr 150px" }}>
                          <div className="form-group">
                            <label>Course Enrollment</label>
                            <select
                              value={gradingCourseId}
                              onChange={e => setGradingCourseId(e.target.value)}
                              required
                              style={{ width: "100%" }}
                            >
                              <option value="">-- Select Course --</option>
                              {enrollments.map(e => {
                                const info = courseMap[e.courseId] || { code: e.courseId, name: "Enrolled Course" };
                                return (
                                  <option key={e.courseId} value={e.courseId}>
                                    {info.code} - {info.name} {e.grade ? `(Grade: ${e.grade})` : "(Ungraded)"}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          
                          <div className="form-group">
                            <label>Grade</label>
                            <select
                              value={gradingGrade}
                              onChange={e => setGradingGrade(e.target.value)}
                              required
                              style={{ width: "100%" }}
                            >
                              <option value="A+">A+ (10.0)</option>
                              <option value="A">A (9.0)</option>
                              <option value="B+">B+ (8.0)</option>
                              <option value="B">B (7.0)</option>
                              <option value="C">C (6.0)</option>
                              <option value="F">F (0.0)</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={loading || !gradingCourseId}
                          style={{
                            alignSelf: "flex-start",
                            padding: "10px 24px",
                            fontSize: "0.78rem",
                            borderRadius: "8px",
                            background: "linear-gradient(135deg, #8b5cf6, #6366f1)"
                          }}
                        >
                          <CheckCircle2 size={14} />
                          <span>Issue Verified Grade Seal</span>
                        </button>
                      </form>
                    ) : (
                      <div style={{ padding: "12px", border: "1px solid var(--stroke-soft)", borderRadius: "10px", background: "var(--bg-alt)", color: "var(--text-soft)", fontSize: "0.78rem" }}>
                        This student is not currently enrolled in any courses. Students must self-enroll in academic courses before they can be graded.
                      </div>
                    )}
                  </div>

                  {/* Academic Transcript Records Table */}
                  <div className="glass-card" style={{ padding: "20px" }}>
                    <h5 style={{ margin: "0 0 16px 0", fontSize: "0.9rem", fontWeight: 700, color: "var(--text)" }}>
                      Certified Transcript Ledger & Academic History
                    </h5>

                    {enrollments.length > 0 ? (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.78rem" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid var(--stroke)" }}>
                              <th style={{ padding: "10px 8px", color: "var(--text-muted)" }}>Course</th>
                              <th style={{ padding: "10px 8px", color: "var(--text-muted)" }}>Instructor</th>
                              <th style={{ padding: "10px 8px", color: "var(--text-muted)", textAlign: "center" }}>Credits</th>
                              <th style={{ padding: "10px 8px", color: "var(--text-muted)", textAlign: "center" }}>Grade</th>
                              <th style={{ padding: "10px 8px", color: "var(--text-muted)" }}>Web3 Grade Signature</th>
                            </tr>
                          </thead>
                          <tbody>
                            {enrollments.map((e) => {
                              const info = courseMap[e.courseId] || { code: e.courseId, name: "Enrolled Course", instructor: "N/A", credits: 4 };
                              return (
                                <tr key={e.courseId} style={{ borderBottom: "1px solid var(--stroke-soft)" }}>
                                  <td style={{ padding: "12px 8px" }}>
                                    <strong style={{ color: "var(--text)" }}>{info.code}</strong>
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>{info.name}</div>
                                  </td>
                                  <td style={{ padding: "12px 8px", color: "var(--text-soft)" }}>{info.instructor}</td>
                                  <td style={{ padding: "12px 8px", textAlign: "center", color: "var(--text)" }}>{info.credits}</td>
                                  <td style={{ padding: "12px 8px", textAlign: "center" }}>
                                    {e.grade ? (
                                      <span style={{
                                        display: "inline-block",
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        fontWeight: 700,
                                        fontSize: "0.72rem",
                                        background: e.grade === "F" ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                        color: e.grade === "F" ? "var(--red)" : "var(--green)"
                                      }}>
                                        {e.grade}
                                      </span>
                                    ) : (
                                      <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.72rem" }}>Ungraded</span>
                                    )}
                                  </td>
                                  <td style={{ padding: "12px 8px", fontFamily: "monospace", fontSize: "0.68rem" }}>
                                    {e.gradeTxId ? (
                                      <span style={{ color: "#6366f1", wordBreak: "break-all" }}>
                                        {e.gradeTxId.substring(0, 16)}...
                                      </span>
                                    ) : (
                                      <span style={{ color: "var(--text-muted)" }}>Pending Admin Issue</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                        No records to display.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="glass-card" style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                  <GraduationCap size={48} style={{ strokeWidth: 1, margin: "0 auto 16px auto", color: "var(--text-muted)" }} />
                  <p style={{ fontSize: "0.85rem", margin: 0 }}>Please select a student from the left roster to view and manage academic grades.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
export default AdminDashboard;
