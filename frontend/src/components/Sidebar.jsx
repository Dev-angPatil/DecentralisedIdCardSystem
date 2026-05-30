import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, BookOpen, Calendar, ShieldCheck, 
  Award, Clock, User, LogOut 
} from "lucide-react";

export function Sidebar({ open, setOpen }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!session) return null;

  const links = session.isAdmin
    ? [
        { to: "/admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/admin-courses", label: "Course Setup", icon: BookOpen },
        { to: "/admin-events", label: "Event Publisher", icon: Calendar },
        { to: "/admin-scholarships", label: "Scholarship Claims", icon: Award },
      ]
    : [
        { to: "/dashboard", label: "Portal Summary", icon: LayoutDashboard },
        { to: "/courses", label: "Class Courses", icon: BookOpen },
        { to: "/events", label: "Campus Events", icon: Calendar },
        { to: "/attendance", label: "On-Chain Attendance", icon: ShieldCheck },
        { to: "/scholarships", label: "Scholarship Claims", icon: Award },
        { to: "/timetable", label: "Weekly Timetable", icon: Clock },
        { to: "/profile", label: "Digital ID Card", icon: User },
      ];

  const getInitials = (name) => {
    if (!name) return "S";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <>
      <div className={`sidebar ${open ? "open" : ""}`}>
        <a href="/" className="sidebar-brand">
          <div className="sidebar-logo">CC</div>
          <span className="sidebar-brand-name">chain—campus</span>
        </a>

        <div className="sidebar-nav">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => 
                  `sidebar-link ${isActive ? "active" : ""}`
                }
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-avatar">
              {getInitials(session.name)}
            </div>
            <div className="sidebar-user-meta">
              <div className="sidebar-user-name" title={session.name}>
                {session.name}
              </div>
              <div className="sidebar-user-role">
                {session.isAdmin ? "🛡️ Administrator" : "🎓 Student"}
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-full" onClick={handleLogout} style={{ justifyContent: "flex-start", padding: "10px 14px" }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      <div 
        className={`sidebar-overlay ${open ? "visible" : ""}`}
        onClick={() => setOpen(false)}
      />
    </>
  );
}
