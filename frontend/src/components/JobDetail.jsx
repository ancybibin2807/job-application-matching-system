import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getJob, applyForJob, getUser } from "../api";

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [coverLetter, setCover] = useState("");
  const [applying, setApplying] = useState(false);
  const [message, setMessage]   = useState(null);
  const [userSkills, setUserSkills] = useState([]);

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    getJob(jobId).then(r => setJob(r.data)).catch(console.error).finally(() => setLoading(false));
    if (userId) {
      getUser(userId).then(r => setUserSkills(r.data.skills || [])).catch(() => {});
    }
  }, [jobId, userId]);

  const handleApply = async () => {
    if (!userId) { navigate("/register"); return; }
    setApplying(true); setMessage(null);
    try {
      await applyForJob({ user_id: parseInt(userId), job_id: parseInt(jobId), cover_letter: coverLetter });
      setMessage({ type: "success", text: "🎉 Application submitted successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Error submitting application." });
    } finally {
      setApplying(false);
    }
  };

  const normalizeSkill = s => s.toLowerCase().trim();
  const userSkillsNorm = new Set(userSkills.map(normalizeSkill));

  const matchedRequired  = (job?.required_skills || []).filter(s => userSkillsNorm.has(normalizeSkill(s)));
  const missingRequired  = (job?.required_skills || []).filter(s => !userSkillsNorm.has(normalizeSkill(s)));
  const matchedPreferred = (job?.preferred_skills || []).filter(s => userSkillsNorm.has(normalizeSkill(s)));

  const matchScore = job && job.required_skills?.length
    ? Math.round(
        (matchedRequired.length / job.required_skills.length * 0.7 +
         (job.preferred_skills?.length ? matchedPreferred.length / job.preferred_skills.length * 0.3 : 0)) * 100
      )
    : null;

  const scoreClass = matchScore >= 70 ? "score-high" : matchScore >= 40 ? "score-medium" : "score-low";

  if (loading) return <div className="spinner" />;
  if (!job) return <div className="container page"><div className="alert alert-error">Job not found.</div></div>;

  return (
    <div className="container page">
      {/* ── Breadcrumb ── */}
      <div style={{ marginBottom: 24, color: "var(--text-muted)", fontSize: ".875rem" }}>
        <Link to="/jobs" style={{ color: "var(--text-muted)" }}>← Back to Jobs</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" }}>
        {/* ── Main Content ── */}
        <div>
          <div className="card card-body" style={{ marginBottom: 24 }}>
            {/* Header */}
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start", marginBottom: 20 }}>
              <div className="job-card-logo" style={{ width: 64, height: 64, fontSize: "1.8rem" }}>
                {job.company?.[0]?.toUpperCase() || "J"}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>{job.title}</h1>
                <div style={{ color: "var(--text-muted)", fontWeight: 500, marginBottom: 12 }}>{job.company}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {job.location        && <span className="badge badge-gray">📍 {job.location}</span>}
                  {job.job_type        && <span className="badge badge-blue">{job.job_type}</span>}
                  {job.experience_level && <span className="badge badge-purple">{job.experience_level}</span>}
                  {job.salary_min      && (
                    <span className="badge badge-green">
                      💰 {job.salary_min.toLocaleString()} – {(job.salary_max || 0).toLocaleString()}/yr
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="divider" />

            {/* Description */}
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>About This Role</h3>
            <p style={{ lineHeight: 1.8, color: "var(--text-muted)" }}>
              {job.description || "No description provided."}
            </p>

            <div className="divider" />

            {/* Required Skills */}
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Required Skills</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {(job.required_skills || []).map(s => {
                const has = userSkillsNorm.has(normalizeSkill(s));
                return (
                  <span key={s} className={"badge " + (userId ? (has ? "badge-green" : "badge-red") : "badge-blue")}>
                    {userId ? (has ? "✓ " : "✗ ") : ""}{s}
                  </span>
                );
              })}
            </div>

            {/* Preferred Skills */}
            {(job.preferred_skills || []).length > 0 && (
              <>
                <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Preferred Skills</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {job.preferred_skills.map(s => {
                    const has = userSkillsNorm.has(normalizeSkill(s));
                    return (
                      <span key={s} className={"badge " + (userId ? (has ? "badge-green" : "badge-orange") : "badge-purple")}>
                        {userId ? (has ? "✓ " : "○ ") : ""}{s}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* ── Cover Letter & Apply ── */}
          <div className="card card-body">
            <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: "1.1rem" }}>
              {userId ? "Submit Your Application" : "Apply for This Job"}
            </h2>
            {!userId && (
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                Please <Link to="/register">create a profile</Link> to apply for this job.
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Cover Letter <span style={{ color: "var(--text-light)", fontWeight: 400 }}>(optional)</span></label>
              <textarea
                className="form-control"
                rows={5}
                placeholder="Introduce yourself and explain why you're a great fit for this role..."
                value={coverLetter}
                onChange={e => setCover(e.target.value)}
                disabled={!userId}
              />
            </div>
            {message && (
              <div className={"alert " + (message.type === "success" ? "alert-success" : "alert-error")}>
                {message.text}
              </div>
            )}
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleApply}
              disabled={applying || !userId}
            >
              {applying ? "Submitting..." : userId ? "🚀 Submit Application" : "Login to Apply"}
            </button>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Match Score */}
          {userId && matchScore !== null && (
            <div className="card card-body" style={{ textAlign: "center" }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: ".9rem" }}>Your Match Score</h3>
              <div className={"score-ring " + scoreClass} style={{ width: 90, height: 90, fontSize: "1.4rem", margin: "0 auto 12px" }}>
                {matchScore}%<small>match</small>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: ".85rem" }}>
                {matchScore >= 70 ? "🌟 Excellent match!" : matchScore >= 40 ? "👍 Good match" : "📚 Skill gap exists"}
              </p>
              {missingRequired.length > 0 && (
                <div style={{ marginTop: 16, textAlign: "left" }}>
                  <div style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
                    SKILLS TO DEVELOP
                  </div>
                  {missingRequired.map(s => (
                    <span key={s} className="badge badge-red" style={{ marginRight: 6, marginBottom: 6 }}>✗ {s}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Job Summary */}
          <div className="card card-body">
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: ".9rem" }}>Job Summary</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Company", value: job.company },
                { label: "Location", value: job.location || "Not specified" },
                { label: "Type", value: job.job_type || "Not specified" },
                { label: "Level", value: job.experience_level || "Not specified" },
                { label: "Salary", value: job.salary_min ? job.salary_min.toLocaleString() + " – " + (job.salary_max || 0).toLocaleString() + "/yr" : "Not disclosed" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: ".875rem" }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA for non-logged-in */}
          {!userId && (
            <div className="card card-body" style={{ textAlign: "center", background: "var(--primary-light)" }}>
              <p style={{ color: "var(--primary)", fontWeight: 600, marginBottom: 12 }}>
                Create a profile to see your match score
              </p>
              <Link to="/register" className="btn btn-primary btn-full">Get Started Free</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
