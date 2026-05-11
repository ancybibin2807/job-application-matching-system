import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createJob } from "../api";

export default function PostJob() {
  const navigate = useNavigate();
  const employerId = localStorage.getItem("user_id");
  const [form, setForm] = useState({
    title: "", company: "", location: "", job_type: "full-time",
    experience_level: "mid", description: "",
    required_skills: "", preferred_skills: "",
    salary_min: "", salary_max: "",
  });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employerId) return setError("You must be logged in to post a job.");
    setLoading(true); setError("");
    try {
      const payload = {
        ...form,
        employer_id: parseInt(employerId),
        required_skills: form.required_skills.split(",").map(s => s.trim()).filter(Boolean),
        preferred_skills: form.preferred_skills.split(",").map(s => s.trim()).filter(Boolean),
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      };
      const res = await createJob(payload);
      navigate("/jobs/" + res.data.id);
    } catch (err) {
      setError(err.response?.data?.detail || "Error posting job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page">
      <div className="page-header">
        <h1>Post a Job</h1>
        <p>Connect with skilled candidates who match your requirements</p>
      </div>

      {!employerId && (
        <div className="alert alert-info" style={{ marginBottom: 24 }}>
          Please <Link to="/register">create an employer account</Link> to post jobs.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 28, alignItems: "start" }}>
        <form onSubmit={handleSubmit}>
          {/* ── Basic Info ── */}
          <div className="card card-body" style={{ marginBottom: 20 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: "1rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
              Basic Information
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Job Title *</label>
                <input className="form-control" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Senior React Developer" required />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input className="form-control" value={form.company} onChange={e => set("company", e.target.value)} placeholder="Acme Corp" required />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-control" value={form.location} onChange={e => set("location", e.target.value)} placeholder="Remote / New York, NY" />
              </div>
              <div className="form-group">
                <label className="form-label">Job Type</label>
                <select className="form-control" value={form.job_type} onChange={e => set("job_type", e.target.value)}>
                  {["full-time","part-time","remote","contract","internship"].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select className="form-control" value={form.experience_level} onChange={e => set("experience_level", e.target.value)}>
                  {[["junior","Junior (0–2 yrs)"],["mid","Mid-Level (2–5 yrs)"],["senior","Senior (5+ yrs)"]].map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Description ── */}
          <div className="card card-body" style={{ marginBottom: 20 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: "1rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
              Job Description
            </h2>
            <div className="form-group" style={{ margin: 0 }}>
              <textarea
                className="form-control"
                rows={6}
                value={form.description}
                onChange={e => set("description", e.target.value)}
                placeholder="Describe the role, responsibilities, team culture, and what success looks like..."
              />
            </div>
          </div>

          {/* ── Skills ── */}
          <div className="card card-body" style={{ marginBottom: 20 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: "1rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
              Skills & Requirements
            </h2>
            <div className="form-group">
              <label className="form-label">Required Skills * <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(comma-separated – must-have)</span></label>
              <input className="form-control" value={form.required_skills} onChange={e => set("required_skills", e.target.value)} placeholder="React, TypeScript, Node.js, PostgreSQL" required />
              {form.required_skills && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {form.required_skills.split(",").filter(s => s.trim()).map((s, i) => (
                    <span key={i} className="badge badge-blue">{s.trim()}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Preferred Skills <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(nice-to-have)</span></label>
              <input className="form-control" value={form.preferred_skills} onChange={e => set("preferred_skills", e.target.value)} placeholder="Docker, AWS, GraphQL" />
              {form.preferred_skills && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {form.preferred_skills.split(",").filter(s => s.trim()).map((s, i) => (
                    <span key={i} className="badge badge-purple">{s.trim()}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Salary ── */}
          <div className="card card-body" style={{ marginBottom: 24 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: "1rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
              Compensation <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Min Salary (annual)</label>
                <input className="form-control" type="number" value={form.salary_min} onChange={e => set("salary_min", e.target.value)} placeholder="e.g. 80000" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Max Salary (annual)</label>
                <input className="form-control" type="number" value={form.salary_max} onChange={e => set("salary_max", e.target.value)} placeholder="e.g. 120000" />
              </div>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" disabled={loading || !employerId} className="btn btn-primary btn-full btn-lg">
            {loading ? "Publishing Job…" : "🚀 Publish Job"}
          </button>
        </form>

        {/* ── Sidebar Preview ── */}
        <div className="card card-body" style={{ position: "sticky", top: 80 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: ".9rem" }}>Preview</h3>
          <div style={{ padding: "16px", background: "var(--bg)", borderRadius: "var(--radius-sm)" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{form.title || "Job Title"}</div>
            <div style={{ color: "var(--text-muted)", fontSize: ".85rem", marginBottom: 10 }}>{form.company || "Company"}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {form.location && <span className="badge badge-gray">📍 {form.location}</span>}
              {form.job_type && <span className="badge badge-blue">{form.job_type}</span>}
              {form.experience_level && <span className="badge badge-purple">{form.experience_level}</span>}
            </div>
            {form.required_skills && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {form.required_skills.split(",").filter(s => s.trim()).slice(0, 4).map((s, i) => (
                  <span key={i} className="badge badge-blue">{s.trim()}</span>
                ))}
              </div>
            )}
            {form.salary_min && (
              <div style={{ marginTop: 10, fontSize: ".85rem", color: "var(--success)", fontWeight: 600 }}>
                💰 {parseInt(form.salary_min).toLocaleString()} – {parseInt(form.salary_max || 0).toLocaleString()}/yr
              </div>
            )}
          </div>
          <div style={{ marginTop: 16, padding: 12, background: "#ede9fe", borderRadius: "var(--radius-sm)", fontSize: ".82rem", color: "#5b21b6" }}>
            💡 <strong>Tip:</strong> Adding clear required skills helps the matching algorithm find the best candidates for you.
          </div>
        </div>
      </div>
    </div>
  );
}
