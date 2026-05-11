import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import JobList from "./components/JobList";
import JobDetail from "./components/JobDetail";
import UserProfile from "./components/UserProfile";
import Register from "./components/Register";
import MyApplications from "./components/MyApplications";
import PostJob from "./components/PostJob";
import MatchedJobs from "./components/MatchedJobs";

function NavBar() {
  const userId = localStorage.getItem("user_id");
  return (
    <nav style={{ background: "#1a73e8", padding: "12px 24px", display: "flex", gap: "20px", alignItems: "center" }}>
      <span style={{ color: "white", fontWeight: "bold", fontSize: "1.2rem" }}>
        JobMatch
      </span>
      <Link to="/" style={navLinkStyle}>All Jobs</Link>
      {userId && <Link to={"/matched/" + userId} style={navLinkStyle}>Matched Jobs</Link>}
      {userId && <Link to={"/applications/" + userId} style={navLinkStyle}>My Applications</Link>}
      <Link to="/post-job" style={navLinkStyle}>Post a Job</Link>
      {userId
        ? <Link to={"/profile/" + userId} style={navLinkStyle}>My Profile</Link>
        : <Link to="/register" style={{ ...navLinkStyle, background: "white", color: "#1a73e8", borderRadius: 6, padding: "4px 12px" }}>Register</Link>
      }
    </nav>
  );
}

const navLinkStyle = { color: "white", textDecoration: "none", fontSize: "0.95rem" };

function App() {
  return (
    <Router>
      <NavBar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        <Routes>
          <Route path="/" element={<JobList />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
          <Route path="/matched/:userId" element={<MatchedJobs />} />
          <Route path="/applications/:userId" element={<MyApplications />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/post-job" element={<PostJob />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
