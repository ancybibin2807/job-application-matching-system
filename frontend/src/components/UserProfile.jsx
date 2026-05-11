import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getUser, updateUser } from "../api";

export default function UserProfile() {
  const { userId } = useParams();
  const [user, setUser]     = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getUser(userId).then(r => {
      setUser(r.data);
      setForm({ ...r.data, skills: (r.data.skills || []).join(", ") });
    }).catch(console.error);
  }, [userId]);

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSave = async () => {
    setSaving(true); setMessage(null);
    try {
      const payload = {
        ...form,
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
        experience_years: parseInt(form.experience_years) || 0,
      };
      const res = await updateUser(userId, payload);
      setUser(res.data);
      setForm({ ...res.data, skills: (res.data.skills || []).join(", ") });
      setEditing(false);
      setMessage({ type: "success", text: "✅ Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: "Error saving profile. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div className="spinner" />;

  const initials = user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="container page">
      {/* ── Header ── */}
      <div className="card card-body" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary), #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: "1.6rem", flex: "0 0 80px",
          }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 4 }}>{user.name}</h1>
            <p style={{ color: "var(--text-muted)", marginBottom: 10 }}>
              {user.role === "employer" ? "🏢 Employer" : "🔍 Job Seeker"} · {user.email}
              {user.location && " · 📍 " + user.location}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {user.experience_years > 0 && (
                <span className="badge badge-blue">⏱ {user.experience_years} yrs experience</span>
              )}
              {user.education && <span className="badge badge-purple">🎓 {user.education}</span>}
              {user.linkedin_url && (
                <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="badge badge-blue">LinkedIn ↗</a>
              )}
              {user.github_url && (
                <a href={user.github_url} target="_blank" rel="noreferrer" className="badge badge-gray">GitHub ↗</a>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to={"/matched/" + userId} className="btn btn-primary btn-sm">✨ Matched Jobs</Link>
            <Link to={"/applications/" + userId} className="btn btn-outline btn-sm">📋 Applications</Link>
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(e => !e)}>
              {editing ? "✕ Cancel" : "✏️ Edit Profile"}
            </button>
          </div>
        </div>

        {user.bio && (
          <p style={{ marginTop: 16, padding: "14px", background: "var(--bg)", borderRadius: "var(--radius-sm)", color: "var(--text-muted)", fontStyle: "italic" }}>
            "{user.bio}"
          </p>
        )}
      </div>

      {message && (
        <div className={"alert " + (message.type === "success" ? "alert-success" : "alert-error")} style={{ marginBottom: 20 }}>
          {message.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: editing ? "1fr" : "1fr 320px", gap: 24 }}>
        {editing ? (
          /* ── Edit Form ── */
          <div className="card card-body">
            <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: "1.05rem" }}>Edit Your Profile</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" value={form.name || ""} onChange={e => set("name", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-control" value={form.location || ""} onChange={e => set("location", e.target.value)} placeholder="City, Country" />
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Bio</label>
                <textarea className="form-control" rows={3} value={form.bio || ""} onChange={e => set("bio", e.target.value)} placeholder="Write a short summary about yourself..." />
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Skills (comma-separated)</label>
                <input className="form-control" value={form.skills || ""} onChange={e => set("skills", e.target.value)} placeholder="Python, React, SQL, Docker" />
                {form.skills && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {form.skills.split(",").filter(s => s.trim()).map((s, i) => (
                      <span key={i} className="badge badge-blue">{s.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input className="form-control" type="number" min="0" value={form.experience_years || 0} onChange={e => set("experience_years", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Education</label>
                <input className="form-control" value={form.education || ""} onChange={e => set("education", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input className="form-control" value={form.linkedin_url || ""} onChange={e => set("linkedin_url", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">GitHub URL</label>
                <input className="form-control" value={form.github_url || ""} onChange={e => set("github_url", e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                {saving ? "Saving…" : "💾 Save Changes"}
              </button>
              <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          /* ── View Mode ── */
          <>
            <div>
              <div className="card card-body" style={{ marginBottom: 20 }}>
                <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: "1rem" }}>🛠 Skills</h2>
                {(user.skills || []).length === 0 ? (
                  <p style={{ color: "var(--text-muted)" }}>
                    No skills added yet.{" "}
                    <button onClick={() => setEditing(true)} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Add skills →</button>
                  </p>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {user.skills.map(s => <span key={s} className="badge badge-blue" style={{ fontSize: ".9rem", padding: "5px 14px" }}>{s}</span>)}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="card card-body">
                <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: ".9rem" }}>Quick Stats</h3>
                {[
                  { label: "Skills",      val: (user.skills || []).length + " skills" },
                  { label: "Experience",  val: user.experience_years + " years" },
                  { label: "Education",   val: user.education || "—" },
                  { label: "Phone",       val: user.phone || "—" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: ".875rem", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{row.label}</span>
                    <span style={{ fontWeight: 600 }}>{row.val}</span>
                  </div>
                ))}
                <button onClick={() => setEditing(true)} className="btn btn-outline btn-full btn-sm" style={{ marginTop: 16 }}>
                  ✏️ Edit Profile
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
