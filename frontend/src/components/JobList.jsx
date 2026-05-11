import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { listJobs } from "../api";

const JOB_TYPES = ["", "full-time", "part-time", "remote", "contract", "internship"];
const EXP_LEVELS = ["", "junior", "mid", "senior"];

export default function JobList() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [jobs, setJobs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState(params.get("q") || "");
  const [jobType, setJobType] = useState("");
  const [expLevel, setExpLevel] = useState("");

  useEffect(() => {
    listJobs(0, 100)
      .then(r => setJobs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      (j.required_skills || []).some(s => s.toLowerCase().includes(q));
    const matchesType  = !jobType  || j.job_type === jobType;
    const matchesLevel = !expLevel || j.experience_level === expLevel;
    return matchesSearch && matchesType && matchesLevel;
  });

  const clearFilters = () => { setSearch(""); setJobType(""); setExpLevel(""); };

  return (
    <div className="container page">
      <div className="page-header">
        <h1>Browse Jobs</h1>
        <p>{loading ? "Loading..." : `${filtered.length} job${filtered.length !== 1 ? "s" : ""} found`}</p>
      </div>

      <div className="jobs-layout">
        {/* ── Filters Panel ── */}
        <aside className="filters-panel">
          <h3>Filters</h3>

          <div className="filter-group">
            <label>Search</label>
            <input
              className="form-control"
              placeholder="Title, company, skill…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Job Type</label>
            <select className="form-control" value={jobType} onChange={e => setJobType(e.target.value)}>
              <option value="">All Types</option>
              {JOB_TYPES.filter(Boolean).map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Experience Level</label>
            <select className="form-control" value={expLevel} onChange={e => setExpLevel(e.target.value)}>
              <option value="">All Levels</option>
              {EXP_LEVELS.filter(Boolean).map(l => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </div>

          {(search || jobType || expLevel) && (
            <button onClick={clearFilters} className="btn btn-outline btn-sm btn-full">
              ✕ Clear Filters
            </button>
          )}
        </aside>

        {/* ── Job List ── */}
        <main>
          {loading && <div className="spinner" />}

          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <h3>No jobs found</h3>
              <p>Try adjusting your search or filters</p>
              <button onClick={clearFilters} className="btn btn-primary" style={{ marginTop: 16 }}>
                Clear Filters
              </button>
            </div>
          )}

          <div className="job-grid">
            {filtered.map(job => (
              <Link key={job.id} to={"/jobs/" + job.id} style={{ textDecoration: "none" }}>
                <div className="job-card">
                  <div className="job-card-logo">{job.company?.[0]?.toUpperCase() || "J"}</div>
                  <div className="job-card-body">
                    <div className="job-card-title">{job.title}</div>
                    <div className="job-card-company">{job.company}</div>
                    <div className="job-card-meta">
                      {job.location  && <span className="badge badge-gray">📍 {job.location}</span>}
                      {job.job_type  && <span className="badge badge-blue">{job.job_type}</span>}
                      {job.experience_level && <span className="badge badge-purple">{job.experience_level}</span>}
                      {job.salary_min && (
                        <span className="job-card-salary">
                          💰 {job.salary_min.toLocaleString()}–{(job.salary_max || 0).toLocaleString()}/yr
                        </span>
                      )}
                    </div>
                    <div className="job-card-tags">
                      {(job.required_skills || []).slice(0, 5).map(s => (
                        <span key={s} className="badge badge-blue">{s}</span>
                      ))}
                      {(job.required_skills || []).length > 5 && (
                        <span className="badge badge-gray">+{job.required_skills.length - 5} more</span>
                      )}
                    </div>
                  </div>
                  <div style={{ color: "var(--primary)", fontSize: "1.2rem", alignSelf: "center" }}>›</div>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
