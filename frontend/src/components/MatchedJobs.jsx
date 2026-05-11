import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMatchedJobs, applyForJob } from "../api";

export default function MatchedJobs() {
  const { userId } = useParams();
  const [matched, setMatched]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [applyMsg, setApplyMsg] = useState({});
  const [filter, setFilter]     = useState("all"); // all | good | medium | low

  useEffect(() => {
    getMatchedJobs(userId)
      .then(r => setMatched(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleApply = async (jobId) => {
    try {
      await applyForJob({ user_id: parseInt(userId), job_id: jobId });
      setApplyMsg(p => ({ ...p, [jobId]: { type: "success", text: "Applied!" } }));
    } catch (err) {
      setApplyMsg(p => ({ ...p, [jobId]: { type: "error", text: err.response?.data?.detail || "Error" } }));
    }
  };

  const filtered = matched.filter(({ match_score }) => {
    if (filter === "good")   return match_score >= 70;
    if (filter === "medium") return match_score >= 40 && match_score < 70;
    if (filter === "low")    return match_score < 40;
    return true;
  });

  const scoreClass = s => s >= 70 ? "score-high" : s >= 40 ? "score-medium" : "score-low";
  const scoreLabel = s => s >= 70 ? "Excellent match" : s >= 40 ? "Good match" : "Skill gap";

  return (
    <div className="container page">
      <div className="page-header">
        <h1>✨ Jobs Matched to Your Skills</h1>
        <p>Jobs are ranked by how well your profile matches their requirements</p>
      </div>

      {/* ── Filter Tabs ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {[
          { key: "all",    label: "All Jobs", count: matched.length },
          { key: "good",   label: "🌟 Strong Match (70%+)", count: matched.filter(m => m.match_score >= 70).length },
          { key: "medium", label: "👍 Good Match (40-69%)", count: matched.filter(m => m.match_score >= 40 && m.match_score < 70).length },
          { key: "low",    label: "📚 Needs Work (<40%)",   count: matched.filter(m => m.match_score < 40).length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={"btn btn-sm " + (filter === t.key ? "btn-primary" : "btn-outline")}
          >
            {t.label} <span style={{ opacity: .7, marginLeft: 4 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {loading && <div className="spinner" />}

      {!loading && matched.length === 0 && (
        <div className="empty-state">
          <div className="icon">🎯</div>
          <h3>No matched jobs yet</h3>
          <p>Update your profile with more skills to see matches</p>
          <Link to={"/profile/" + userId} className="btn btn-primary" style={{ marginTop: 16 }}>
            Update My Skills
          </Link>
        </div>
      )}

      <div className="job-grid">
        {filtered.map(({ job, match_score }) => {
          const msg = applyMsg[job.id];
          return (
            <div key={job.id} className="job-card" style={{ flexDirection: "column", gap: 0 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", width: "100%" }}>
                <div className="job-card-logo">{job.company?.[0]?.toUpperCase() || "J"}</div>
                <div className="job-card-body">
                  <div className="job-card-title">
                    <Link to={"/jobs/" + job.id} style={{ color: "var(--text)", textDecoration: "none" }}>
                      {job.title}
                    </Link>
                  </div>
                  <div className="job-card-company">{job.company}</div>
                  <div className="job-card-meta">
                    {job.location && <span className="badge badge-gray">📍 {job.location}</span>}
                    {job.job_type && <span className="badge badge-blue">{job.job_type}</span>}
                  </div>
                  <div className="job-card-tags">
                    {(job.required_skills || []).slice(0, 4).map(s => (
                      <span key={s} className="badge badge-blue">{s}</span>
                    ))}
                  </div>
                </div>
                <div className={"score-ring " + scoreClass(match_score)} style={{ margin: "0 0 0 auto" }}>
                  {match_score}%<small>match</small>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ width: "100%", marginTop: 16 }}>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 999,
                    width: match_score + "%",
                    background: match_score >= 70 ? "var(--success)" : match_score >= 40 ? "var(--warning)" : "var(--danger)",
                    transition: "width .6s ease"
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, alignItems: "center" }}>
                  <span style={{ fontSize: ".8rem", color: "var(--text-muted)" }}>{scoreLabel(match_score)}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {msg && (
                      <span style={{ fontSize: ".82rem", color: msg.type === "success" ? "var(--success)" : "var(--danger)" }}>
                        {msg.text}
                      </span>
                    )}
                    {!msg?.type || msg.type !== "success" ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApply(job.id)}
                      >
                        Quick Apply
                      </button>
                    ) : (
                      <Link to={"/jobs/" + job.id} className="btn btn-outline btn-sm">View Job</Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
