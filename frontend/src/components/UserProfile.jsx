import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getUser, updateUser } from "../api";

const inputStyle = {
  display: "block", width: "100%", padding: "10px 12px",
  borderRadius: 8, border: "1px solid #ccc", fontSize: "1rem",
  marginBottom: 12, boxSizing: "border-box",
};

const tagStyle = {
  display: "inline-block",
  background: "#e3f2fd", color: "#1565c0",
  borderRadius: 20, padding: "3px 12px", fontSize: "0.85rem",
  marginRight: 6, marginTop: 6,
};

export default function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getUser(userId).then((res) => {
      setUser(res.data);
      setForm({ ...res.data, skills: (res.data.skills || []).join(", ") });
    }).catch(console.error);
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        experience_years: parseInt(form.experience_years) || 0,
      };
      const res = await updateUser(userId, payload);
      setUser(res.data);
      setEditing(false);
      setMessage("Profile updated!");
    } catch (err) {
      setMessage("Error updating profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <p>Loading profile...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>{user.name}</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to={"/matched/" + userId} style={{ padding: "8px 18px", background: "#1a73e8", color: "white", borderRadius: 8, textDecoration: "none" }}>
            Find Matched Jobs
          </Link>
          <Link to={"/applications/" + userId} style={{ padding: "8px 18px", background: "#f5f5f5", color: "#333", borderRadius: 8, textDecoration: "none" }}>
            My Applications
          </Link>
        </div>
      </div>

      <p style={{ color: "#777" }}>{user.role === "employer" ? "Employer" : "Job Seeker"} · {user.email}</p>

      {!editing ? (
        <>
          <div style={{ background: "#f9f9f9", borderRadius: 10, padding: 20, marginTop: 16 }}>
            <p><strong>Location:</strong> {user.location || "—"}</p>
            <p><strong>Experience:</strong> {user.experience_years} years</p>
            <p><strong>Education:</strong> {user.education || "—"}</p>
            <p><strong>Bio:</strong> {user.bio || "—"}</p>
            {user.linkedin_url && <p><strong>LinkedIn:</strong> <a href={user.linkedin_url} target="_blank" rel="noreferrer">{user.linkedin_url}</a></p>}
            {user.github_url && <p><strong>GitHub:</strong> <a href={user.github_url} target="_blank" rel="noreferrer">{user.github_url}</a></p>}
          </div>
          <h3 style={{ marginTop: 20 }}>Skills</h3>
          <div>
            {(user.skills || []).length === 0 && <p style={{ color: "#999" }}>No skills added yet.</p>}
            {(user.skills || []).map((s) => <span key={s} style={tagStyle}>{s}</span>)}
          </div>
          <button onClick={() => setEditing(true)} style={{ marginTop: 20, padding: "10px 24px", background: "#1a73e8", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
            Edit Profile
          </button>
        </>
      ) : (
        <>
          <label>Bio</label>
          <textarea name="bio" value={form.bio || ""} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          <label>Location</label>
          <input name="location" value={form.location || ""} onChange={handleChange} style={inputStyle} />
          <label>Skills (comma-separated)</label>
          <input name="skills" value={form.skills || ""} onChange={handleChange} placeholder="Python, React, SQL" style={inputStyle} />
          <label>Years of Experience</label>
          <input name="experience_years" type="number" value={form.experience_years || 0} onChange={handleChange} style={inputStyle} />
          <label>Education</label>
          <input name="education" value={form.education || ""} onChange={handleChange} style={inputStyle} />
          <label>LinkedIn URL</label>
          <input name="linkedin_url" value={form.linkedin_url || ""} onChange={handleChange} style={inputStyle} />
          <label>GitHub URL</label>
          <input name="github_url" value={form.github_url || ""} onChange={handleChange} style={inputStyle} />
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button onClick={handleSave} disabled={saving} style={{ padding: "10px 24px", background: "#1a73e8", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={() => setEditing(false)} style={{ padding: "10px 24px", background: "#f5f5f5", color: "#333", border: "none", borderRadius: 8, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </>
      )}
      {message && <p style={{ marginTop: 12, color: "green" }}>{message}</p>}
    </div>
  );
}
