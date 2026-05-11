import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listJobs } from "../api";

const cardStyle = {
  border: "1px solid #e0e0e0",
  borderRadius: 10,
  padding: "20px",
  marginBottom: 16,
  background: "white",
  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  transition: "box-shadow 0.2s",
};

const tagStyle = {
  display: "inline-block",
  background: "#e3f2fd",
  color: "#1565c0",
  borderRadius: 20,
  padding: "2px 10px",
  fontSize: "0.8rem",
  marginRight: 6,
  marginTop: 4,
};

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listJobs()
      .then((res) => setJobs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      (j.required_skills || []).some((s) =>
        s.toLowerCase().includes(search.toLowerCase())
      )
  );

  if (loading) return <p>Loading jobs...</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>Browse Jobs</h1>
      <input
        type="text"
        placeholder="Search by title, company, or skill..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ccc", marginBottom: 20, fontSize: "1rem" }}
      />
      {filtered.length === 0 && <p>No jobs found.</p>}
      {filtered.map((job) => (
        <div key={job.id} style={cardStyle}>
          <h2 style={{ margin: 0 }}>
            <Link to={"/jobs/" + job.id} style={{ color: "#1a73e8", textDecoration: "none" }}>
              {job.title}
            </Link>
          </h2>
          <p style={{ margin: "6px 0", color: "#555" }}>
            {job.company} {job.location ? "· " + job.location : ""}
            {job.job_type ? " · " + job.job_type : ""}
          </p>
          <div>
            {(job.required_skills || []).map((s) => (
              <span key={s} style={tagStyle}>{s}</span>
            ))}
          </div>
          {job.salary_min && (
            <p style={{ margin: "8px 0 0", color: "#388e3c", fontSize: "0.9rem" }}>
              Salary: {job.salary_min.toLocaleString()} – {job.salary_max?.toLocaleString() || "?"} /year
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
