import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ToastStack } from "./components/Toast";
import { DevToolsWidget } from "./components/DevToolsWidget";
import { TxProgressOverlay } from "./components/TxProgressOverlay";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Events from "./pages/Events";
import Attendance from "./pages/Attendance";
import Scholarships from "./pages/Scholarships";
import Timetable from "./pages/Timetable";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="app-content">
        <Header setOpen={setSidebarOpen} />
        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

function PrivateRoute({ adminOnly = false }) {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !session.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!adminOnly && session.isAdmin) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return <Layout />;
}

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            {/* Student Protected Routes */}
            <Route element={<PrivateRoute adminOnly={false} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/events" element={<Events />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/scholarships" element={<Scholarships />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Admin Protected Routes */}
            <Route element={<PrivateRoute adminOnly={true} />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin-courses" element={<AdminDashboard />} />
              <Route path="/admin-events" element={<AdminDashboard />} />
              <Route path="/admin-scholarships" element={<AdminDashboard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global overlays */}
          <ToastStack />
          <DevToolsWidget />
          <TxProgressOverlay />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
export default App;
