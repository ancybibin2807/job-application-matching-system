import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserApplications } from "../api";

const PIPELINE = ["applied", "screening", "interview", "offer", "hired", "rejected"];
const PIPELINE_LABELS = {
  applied:   "Applied",
  screening: "Screening",
  interview: "Interview",
  offer:     "Offer",
  hired:     "Hired 🎉",
  rejected:  "Rejected",
};

export default function MyApplications() {
  const { userId } = useParams();
  const [apps, setApps]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");

  useEffect(() => {
    getUserApplications(userId)
      .then(r => setApps(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);

  const counts = PIPELINE.reduce((acc, s) => ({ ...acc, [s]: apps.filter(a => a.status === s).length }), {});

  return (
    <div className="container page">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>My Applications</h1>
          <p>{apps.length} total · {counts.hired || 0} hired</p>
        </div>
        <Link to="/jobs" className="btn btn-primary">Browse More Jobs</Link>
      </div>

      {/* ── Pipeline Summary ── */}
      {apps.length > 0 && (
        <div className="card card-body" style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
            {PIPELINE.map((status, i) => (
              <div key={status} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 90 }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", margin: "0 auto 6px",
                    background: counts[status] > 0 ? "var(--primary)" : "var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: counts[status] > 0 ? "#fff" : "var(--text-muted)",
                    fontWeight: 700, fontSize: ".9rem",
                  }}>
                    {counts[status] || "—"}
                  </div>
                  <div style={{ fontSize: ".72rem", fontWeight: 600, color: "var(--text-muted)", textAlign: "center" }}>
                    {PIPELINE_LABELS[status]}
                  </div>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div style={{ width: 24, height: 2, background: "var(--border)", flex: "0 0 24px" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <button className={"btn btn-sm " + (filter === "all" ? "btn-primary" : "btn-outline")} onClick={() => setFilter("all")}>
          All ({apps.length})
        </button>
        {PIPELINE.filter(s => counts[s] > 0).map(s => (
          <button key={s} className={"btn btn-sm " + (filter === s ? "btn-primary" : "btn-outline")} onClick={() => setFilter(s)}>
            {PIPELINE_LABELS[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {loading && <div className="spinner" />}

      {!loading && apps.length === 0 && (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>No applications yet</h3>
          <p>Start applying to jobs that match your skills</p>
          <Link to="/jobs" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Jobs</Link>
        </div>
      )}

      <div className="job-grid">
        {filtered.map(app => {
          const scoreClass = app.match_score >= 70 ? "score-high" : app.match_score >= 40 ? "score-medium" : "score-low";
          const pipelineIndex = PIPELINE.indexOf(app.status);
          return (
            <div key={app.id} className="card card-body">
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div className="job-card-logo">#{app.job_id}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Link to={"/jobs/" + app.job_id} style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>
                      Job #{app.job_id}
                    </Link>
                    <span className={"badge status-" + app.status}>{PIPELINE_LABELS[app.status]}</span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: ".85rem", margin: "4px 0 10px" }}>
                    Applied {new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>

                  {/* Progress Bar */}
                  {app.status !== "rejected" && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ height: 4, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 999,
                          width: ((pipelineIndex + 1) / 5 * 100) + "%",
                          background: app.status === "hired" ? "var(--success)" : "var(--primary)",
                          transition: "width .5s ease",
                        }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        {PIPELINE.slice(0, 5).map(s => (
                          <span key={s} style={{ fontSize: ".65rem", color: PIPELINE.indexOf(s) <= pipelineIndex ? "var(--primary)" : "var(--text-light)", fontWeight: 600 }}>
                            {PIPELINE_LABELS[s].split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Match Score */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div className={"score-ring " + scoreClass} style={{ width: 44, height: 44, fontSize: ".78rem" }}>
                      {app.match_score}%<small style={{ fontSize: ".55rem" }}>match</small>
                    </div>
                    {app.cover_letter && (
                      <p style={{ color: "var(--text-muted)", fontSize: ".82rem", margin: 0, flex: 1 }}>
                        "{app.cover_letter.slice(0, 80)}{app.cover_letter.length > 80 ? "..." : ""}"
                      </p>
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
