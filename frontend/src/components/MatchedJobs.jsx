import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMatchedJobs, applyForJob } from "../api";

export default function MatchedJobs() {
  const { userId } = useParams();
  const [matched, setMatched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyMsg, setApplyMsg] = useState({});

  useEffect(() => {
    getMatchedJobs(userId)
      .then((res) => setMatched(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleApply = async (jobId) => {
    try {
      await applyForJob({ user_id: parseInt(userId), job_id: jobId });
      setApplyMsg((prev) => ({ ...prev, [jobId]: "Applied!" }));
    } catch (err) {
      setApplyMsg((prev) => ({ ...prev, [jobId]: err.response?.data?.detail || "Error" }));
    }
  };

  if (loading) return <p>Finding matches...</p>;

  return (
    <div>
      <h1>Jobs Matched to Your Skills</h1>
      {matched.length === 0 && <p>No matches found. Update your profile skills!</p>}
      {matched.map(({ job, match_score }) => (
        <div key={job.id} style={{ border: "1px solid #e0e0e0", borderRadius: 10, padding: 20, marginBottom: 16, background: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: 0 }}>
                <Link to={"/jobs/" + job.id} style={{ color: "#1a73e8", textDecoration: "none" }}>{job.title}</Link>
              </h2>
              <p style={{ color: "#555", margin: "4px 0" }}>{job.company} {job.location ? "· " + job.location : ""}</p>
            </div>
            <div style={{ textAlign: "center", minWidth: 70 }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%", margin: "0 auto",
                background: match_score >= 70 ? "#4caf50" : match_score >= 40 ? "#ff9800" : "#f44336",
                display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "1.1rem"
              }}>
                {match_score}%
              </div>
              <small style={{ color: "#888" }}>match</small>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            {(job.required_skills || []).map((s) => (
              <span key={s} style={{ display: "inline-block", background: "#e3f2fd", color: "#1565c0", borderRadius: 20, padding: "2px 10px", fontSize: "0.8rem", marginRight: 6, marginTop: 4 }}>{s}</span>
            ))}
          </div>
          <button
            onClick={() => handleApply(job.id)}
            style={{ marginTop: 14, padding: "8px 22px", background: "#1a73e8", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}
          >
            Quick Apply
          </button>
          {applyMsg[job.id] && (
            <span style={{ marginLeft: 12, color: applyMsg[job.id] === "Applied!" ? "green" : "red" }}>
              {applyMsg[job.id]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
