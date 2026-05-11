import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { listJobs } from "../api";

const FEATURES = [
  { icon: "🎯", title: "Smart Skill Matching", desc: "Our algorithm scores every job 0-100% based on how well your skills match what employers need." },
  { icon: "⚡", title: "Instant Applications", desc: "One-click apply with your saved profile. Add a personal cover letter in seconds." },
  { icon: "📊", title: "Application Tracker", desc: "Follow your applications through every stage — from Applied all the way to Hired." },
  { icon: "🔍", title: "Skill Gap Analysis", desc: "See exactly which skills you're missing for any job and plan your learning path." },
  { icon: "🏢", title: "Easy Job Posting", desc: "Employers can post jobs and instantly see ranked, skill-matched applicants." },
  { icon: "🌐", title: "Smart Synonyms", desc: "We normalize skill names so 'JS' matches 'JavaScript' and 'Postgres' matches 'PostgreSQL'." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Create Your Profile", desc: "Register with your skills, experience, and education. The more detail you add, the better your matches." },
  { step: "02", title: "Discover Matched Jobs", desc: "Our algorithm instantly ranks all open jobs by how well they match your skillset." },
  { step: "03", title: "Apply with One Click", desc: "Submit applications in seconds with your pre-filled profile and an optional cover letter." },
  { step: "04", title: "Track Your Progress", desc: "Watch your applications move from Screening → Interview → Offer → Hired in real-time." },
];

export default function Home() {
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState("");
  const [recentJobs, setRecentJobs] = useState([]);
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    listJobs(0, 6).then(r => setRecentJobs(r.data)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate("/jobs" + (searchQ ? "?q=" + encodeURIComponent(searchQ) : ""));
  };

  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero">
        <h1>Find Jobs That Match<br />Your Expertise</h1>
        <p>Our AI-powered matching engine scores every job against your skills and shows you exactly where you stand.</p>
        <form className="hero-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search job title, skill, or company..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search Jobs</button>
        </form>
        {!userId && (
          <p style={{ marginTop: 20, opacity: .75, fontSize: ".9rem" }}>
            Already have a profile?{" "}
            <Link to="/register" style={{ color: "#c7d2fe", fontWeight: 600 }}>Get started free →</Link>
          </p>
        )}
      </section>

      {/* ── Stats ── */}
      <div className="stats-bar">
        <div className="stats-bar-inner">
          <div className="stat-item"><div className="num">500+</div><div className="lbl">Jobs Listed</div></div>
          <div className="stat-item"><div className="num">10K+</div><div className="lbl">Applicants</div></div>
          <div className="stat-item"><div className="num">94%</div><div className="lbl">Match Accuracy</div></div>
          <div className="stat-item"><div className="num">200+</div><div className="lbl">Companies Hiring</div></div>
        </div>
      </div>

      {/* ── How it Works ── */}
      <section style={{ padding: "64px 0", background: "#fff" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 12 }}>How It Works</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: 480, margin: "0 auto" }}>
              From profile to hired in four simple steps
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {HOW_IT_WORKS.map(item => (
              <div key={item.step} style={{ textAlign: "center", padding: "0 16px" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "var(--primary-light)", color: "var(--primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", fontWeight: 800, fontSize: "1.1rem"
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: "1rem" }}>{item.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link to="/register" className="btn btn-primary btn-lg">Create Your Free Profile →</Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "64px 0", background: "var(--bg)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 12 }}>Everything You Need</h2>
            <p style={{ color: "var(--text-muted)" }}>Built for both job seekers and employers</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card card-body" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{f.icon}</span>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: ".95rem" }}>{f.title}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: ".88rem", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent Jobs ── */}
      {recentJobs.length > 0 && (
        <section style={{ padding: "64px 0", background: "#fff" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Latest Opportunities</h2>
              <Link to="/jobs" className="btn btn-outline btn-sm">View All Jobs →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {recentJobs.map(job => (
                <Link key={job.id} to={"/jobs/" + job.id} style={{ textDecoration: "none" }}>
                  <div className="card card-body" style={{ height: "100%" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 12 }}>
                      <div className="job-card-logo">{job.company?.[0] || "J"}</div>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{job.title}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: ".85rem" }}>{job.company}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(job.required_skills || []).slice(0, 4).map(s => (
                        <span key={s} className="badge badge-blue">{s}</span>
                      ))}
                    </div>
                    {job.job_type && (
                      <div style={{ marginTop: 12 }}>
                        <span className="badge badge-gray">{job.job_type}</span>
                        {job.location && <span className="badge badge-gray" style={{ marginLeft: 6 }}>📍 {job.location}</span>}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Banner ── */}
      <section style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        padding: "64px 24px", textAlign: "center", color: "#fff"
      }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 16 }}>
          Ready to Find Your Perfect Job?
        </h2>
        <p style={{ opacity: .85, marginBottom: 32, fontSize: "1.05rem" }}>
          Join thousands of professionals who found their dream job through skill-based matching
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/register" className="btn btn-lg" style={{ background: "#fff", color: "var(--primary)", fontWeight: 700 }}>
            Create Free Profile
          </Link>
          <Link to="/jobs" className="btn btn-lg btn-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,.5)" }}>
            Browse Jobs
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#1e293b", color: "#94a3b8", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontWeight: 800, color: "#fff", fontSize: "1.2rem", marginBottom: 8 }}>💼 JobMatch</div>
        <p style={{ fontSize: ".85rem", marginBottom: 16 }}>Smart job matching powered by skill intelligence</p>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", fontSize: ".85rem" }}>
          <Link to="/jobs" style={{ color: "#94a3b8" }}>Browse Jobs</Link>
          <Link to="/post-job" style={{ color: "#94a3b8" }}>Post a Job</Link>
          <Link to="/register" style={{ color: "#94a3b8" }}>Sign Up</Link>
        </div>
        <p style={{ marginTop: 24, fontSize: ".8rem", opacity: .5 }}>© 2026 JobMatch. Built with FastAPI + React.</p>
      </footer>
    </div>
  );
}
