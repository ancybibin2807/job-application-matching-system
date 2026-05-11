import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api";

const inputStyle = {
  display: "block", width: "100%", padding: "10px 12px",
  borderRadius: 8, border: "1px solid #ccc", fontSize: "1rem",
  marginBottom: 14, boxSizing: "border-box",
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", location: "",
    skills: "", experience_years: 0, education: "",
    linkedin_url: "", github_url: "", role: "applicant",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        experience_years: parseInt(form.experience_years) || 0,
      };
      const res = await registerUser(payload);
      localStorage.setItem("user_id", res.data.id);
      navigate("/profile/" + res.data.id);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1>Create Your Profile</h1>
      <form onSubmit={handleSubmit}>
        <label>Full Name *</label>
        <input name="name" value={form.name} onChange={handleChange} required style={inputStyle} />

        <label>Email *</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} required style={inputStyle} />

        <label>Password *</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} required style={inputStyle} />

        <label>Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} style={inputStyle} />

        <label>Location</label>
        <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. New York, NY" style={inputStyle} />

        <label>Skills (comma-separated) *</label>
        <input name="skills" value={form.skills} onChange={handleChange} placeholder="e.g. Python, React, SQL" style={inputStyle} />

        <label>Years of Experience</label>
        <input name="experience_years" type="number" min="0" value={form.experience_years} onChange={handleChange} style={inputStyle} />

        <label>Education</label>
        <input name="education" value={form.education} onChange={handleChange} placeholder="e.g. B.Sc. Computer Science" style={inputStyle} />

        <label>LinkedIn URL</label>
        <input name="linkedin_url" value={form.linkedin_url} onChange={handleChange} style={inputStyle} />

        <label>GitHub URL</label>
        <input name="github_url" value={form.github_url} onChange={handleChange} style={inputStyle} />

        <label>I am an:</label>
        <select name="role" value={form.role} onChange={handleChange} style={inputStyle}>
          <option value="applicant">Job Seeker (Applicant)</option>
          <option value="employer">Employer / Recruiter</option>
        </select>

        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: "#1a73e8", color: "white", border: "none", borderRadius: 8, fontSize: "1rem", cursor: "pointer" }}>
          {loading ? "Creating..." : "Create Profile"}
        </button>
      </form>
    </div>
  );
}
