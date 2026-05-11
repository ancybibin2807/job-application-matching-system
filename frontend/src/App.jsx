import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate, useNavigate } from "react-router-dom";
import JobList from "./components/JobList";
import JobDetail from "./components/JobDetail";
import UserProfile from "./components/UserProfile";
import Register from "./components/Register";
import MyApplications from "./components/MyApplications";
import PostJob from "./components/PostJob";
import MatchedJobs from "./components/MatchedJobs";
import Home from "./components/Home";

function Navbar() {
  const userId = localStorage.getItem("user_id");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    window.location.href = "/";
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span style={{ fontSize: "1.4rem" }}>💼</span>
          <span>JobMatch</span>
        </Link>

        <div className="navbar-links">
          <NavLink to="/jobs" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            Browse Jobs
          </NavLink>
          {userId && (
            <>
              <NavLink to={"/matched/" + userId} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
                ✨ Matched Jobs
              </NavLink>
              <NavLink to={"/applications/" + userId} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
                My Applications
              </NavLink>
            </>
          )}
          <NavLink to="/post-job" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            Post a Job
          </NavLink>
        </div>

        <div className="navbar-actions">
          {userId ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link to={"/profile/" + userId} className="btn btn-outline btn-sm">
                👤 My Profile
              </Link>
              <button onClick={handleLogout} className="btn btn-sm" style={{ background: "#f1f5f9", color: "#475569" }}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<JobList />} />
        <Route path="/jobs/:jobId" element={<JobDetail />} />
        <Route path="/matched/:userId" element={<MatchedJobs />} />
        <Route path="/applications/:userId" element={<MyApplications />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
