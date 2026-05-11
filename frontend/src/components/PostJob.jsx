import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJob } from "../api";

const inputStyle = {
  display: "block", width: "100%", padding: "10px 12px",
  borderRadius: 8, border: "1px solid #ccc", fontSize: "1rem",
  marginBottom: 14, boxSizing: "border-box",
};

export default function PostJob() {
  const navigate = useNavigate();
  const employerId = localStorage.getItem("user_id");
  const [form, setForm] = useState({
    title: "", company: "", location: "", job_type: "full-time",
    experience_level: "mid", description: "", required_skills: "",
    preferred_skills: "", salary_min: "", salary_max: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employerId) return setError("You must be logged in as an employer to post a job.");
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        employer_id: parseInt(employerId),
        required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
        preferred_skills: form.preferred_skills.split(",").map((s) => s.trim()).filter(Boolean),
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      };
      const res = await createJob(payload);
      navigate("/jobs/" + res.data.id);
    } catch (err) {
      setError(err.response?.data?.detail || "Error posting job.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h1>Post a Job</h1>
      <form onSubmit={handleSubmit}>
        <label>Job Title *</label>
        <input name="title" value={form.title} onChange={handleChange} required style={inputStyle} />

        <label>Company Name *</label>
        <input name="company" value={form.company} onChange={handleChange} required style={inputStyle} />

        <label>Location</label>
        <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Remote, New York, NY" style={inputStyle} />

        <label>Job Type</label>
        <select name="job_type" value={form.job_type} onChange={handleChange} style={inputStyle}>
          <option value="full-time">Full-Time</option>
          <option value="part-time">Part-Time</option>
          <option value="remote">Remote</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
        </select>

        <label>Experience Level</label>
        <select name="experience_level" value={form.experience_level} onChange={handleChange} style={inputStyle}>
          <option value="junior">Junior (0-2 years)</option>
          <option value="mid">Mid-Level (2-5 years)</option>
          <option value="senior">Senior (5+ years)</option>
        </select>

        <label>Job Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={5} style={{ ...inputStyle, resize: "vertical" }} />

        <label>Required Skills * (comma-separated)</label>
        <input name="required_skills" value={form.required_skills} onChange={handleChange} placeholder="e.g. Python, FastAPI, PostgreSQL" required style={inputStyle} />

        <label>Preferred Skills (comma-separated)</label>
        <input name="preferred_skills" value={form.preferred_skills} onChange={handleChange} placeholder="e.g. Docker, React, Redis" style={inputStyle} />

        <label>Salary Range (annual, optional)</label>
        <div style={{ display: "flex", gap: 12 }}>
          <input name="salary_min" type="number" value={form.salary_min} onChange={handleChange} placeholder="Min" style={{ ...inputStyle, flex: 1 }} />
          <input name="salary_max" type="number" value={form.salary_max} onChange={handleChange} placeholder="Max" style={{ ...inputStyle, flex: 1 }} />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: "#1a73e8", color: "white", border: "none", borderRadius: 8, fontSize: "1rem", cursor: "pointer" }}>
          {loading ? "Posting..." : "Post Job"}
        </button>
      </form>
    </div>
  );
}
