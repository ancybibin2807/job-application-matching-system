import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api";

const STEPS = [
  { id: 1, label: "Account", icon: "👤" },
  { id: 2, label: "Skills",  icon: "🛠" },
  { id: 3, label: "Details", icon: "📝" },
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep]   = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "applicant",
    skills: "", experience_years: 0, education: "",
    phone: "", location: "", bio: "",
    linkedin_url: "", github_url: "",
  });

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const nextStep = () => { setError(""); setStep(s => Math.min(s + 1, 3)); };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const payload = {
        ...form,
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
        experience_years: parseInt(form.experience_years) || 0,
      };
      const res = await registerUser(payload);
      localStorage.setItem("user_id", res.data.id);
      navigate("/matched/" + res.data.id);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>💼</div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 4 }}>Create Your Profile</h1>
          <p style={{ color: "var(--text-muted)" }}>Already registered? <Link to="/">Go home</Link></p>
        </div>

        {/* Stepper */}
        <div style={{ display: "flex", gap: 0, marginBottom: 32, background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{
              flex: 1, padding: "14px 8px", textAlign: "center", fontSize: ".82rem", fontWeight: 600,
              background: step === s.id ? "var(--primary)" : step > s.id ? "var(--primary-light)" : "var(--surface)",
              color: step === s.id ? "#fff" : step > s.id ? "var(--primary)" : "var(--text-muted)",
              borderRight: i < STEPS.length - 1 ? "1px solid var(--border)" : "none",
              cursor: step > s.id ? "pointer" : "default", transition: "var(--transition)",
            }} onClick={() => step > s.id && setStep(s.id)}>
              {s.icon} {s.label} {step > s.id && "✓"}
            </div>
          ))}
        </div>

        <div className="card card-body">
          {/* Step 1 – Account */}
          {step === 1 && (
            <>
              <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: "1.05rem" }}>Account Information</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Jane Smith" required />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Email Address *</label>
                  <input className="form-control" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jane@example.com" required />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Password *</label>
                  <input className="form-control" type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min. 8 characters" required />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">I am a…</label>
                  <div style={{ display: "flex", gap: 12 }}>
                    {[{ val: "applicant", icon: "🔍", label: "Job Seeker" }, { val: "employer", icon: "🏢", label: "Employer" }].map(r => (
                      <div key={r.val} onClick={() => set("role", r.val)} style={{
                        flex: 1, padding: "14px", border: "2px solid " + (form.role === r.val ? "var(--primary)" : "var(--border)"),
                        borderRadius: "var(--radius-sm)", cursor: "pointer", textAlign: "center",
                        background: form.role === r.val ? "var(--primary-light)" : "var(--surface)",
                        transition: "var(--transition)",
                      }}>
                        <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{r.icon}</div>
                        <div style={{ fontWeight: 600, fontSize: ".9rem", color: form.role === r.val ? "var(--primary)" : "var(--text)" }}>{r.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2 – Skills */}
          {step === 2 && (
            <>
              <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: "1.05rem" }}>Skills & Experience</h2>
              <div className="form-group">
                <label className="form-label">Your Skills * <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(comma-separated)</span></label>
                <input className="form-control" value={form.skills} onChange={e => set("skills", e.target.value)} placeholder="Python, React, SQL, Docker, Kubernetes" />
                {form.skills && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {form.skills.split(",").filter(s => s.trim()).map((s, i) => (
                      <span key={i} className="badge badge-blue">{s.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input className="form-control" type="number" min="0" max="50" value={form.experience_years} onChange={e => set("experience_years", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Education</label>
                <input className="form-control" value={form.education} onChange={e => set("education", e.target.value)} placeholder="B.Sc. Computer Science, MIT" />
              </div>
            </>
          )}

          {/* Step 3 – Details */}
          {step === 3 && (
            <>
              <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: "1.05rem" }}>Profile Details <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: ".85rem" }}>(optional)</span></h2>
              <div className="form-group">
                <label className="form-label">Bio / Summary</label>
                <textarea className="form-control" rows={3} value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="A short intro about yourself and your career goals..." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 234 567 8900" />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-control" value={form.location} onChange={e => set("location", e.target.value)} placeholder="San Francisco, CA" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input className="form-control" value={form.linkedin_url} onChange={e => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/yourname" />
              </div>
              <div className="form-group">
                <label className="form-label">GitHub URL</label>
                <input className="form-control" value={form.github_url} onChange={e => set("github_url", e.target.value)} placeholder="https://github.com/yourname" />
              </div>
            </>
          )}

          {/* Error */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {step > 1 && (
              <button className="btn btn-outline" onClick={prevStep} style={{ flex: 1 }}>← Back</button>
            )}
            {step < 3 ? (
              <button className="btn btn-primary" onClick={nextStep} style={{ flex: 1 }}>
                Continue →
              </button>
            ) : (
              <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
                {loading ? "Creating Profile…" : "🚀 Create My Profile"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
