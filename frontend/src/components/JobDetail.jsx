import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getJob, applyForJob } from "../api";

const tagStyle = {
  display: "inline-block",
  borderRadius: 20,
  padding: "3px 12px",
  fontSize: "0.85rem",
  marginRight: 6,
  marginTop: 6,
};

export default function JobDetail() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    getJob(jobId)
      .then((res) => setJob(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleApply = async () => {
    if (!userId) return setMessage("Please register/login to apply.");
    setApplying(true);
    try {
      await applyForJob({ user_id: parseInt(userId), job_id: parseInt(jobId), cover_letter: coverLetter });
      setMessage("Applied successfully!");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Error applying.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!job) return <p>Job not found.</p>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 4 }}>{job.title}</h1>
      <p style={{ color: "#555", fontSize: "1.05rem" }}>
        {job.company} {job.location ? "· " + job.location : ""} {job.job_type ? "· " + job.job_type : ""}
      </p>
      {job.salary_min && (
        <p style={{ color: "#388e3c" }}>
          Salary: {job.salary_min.toLocaleString()} – {job.salary_max?.toLocaleString() || "?"}
        </p>
      )}

      <h3>Description</h3>
      <p style={{ lineHeight: 1.7 }}>{job.description || "No description provided."}</p>

      <h3>Required Skills</h3>
      <div>
        {(job.required_skills || []).map((s) => (
          <span key={s} style={{ ...tagStyle, background: "#e3f2fd", color: "#1565c0" }}>{s}</span>
        ))}
      </div>

      {(job.preferred_skills || []).length > 0 && (
        <>
          <h3>Preferred Skills</h3>
          <div>
            {job.preferred_skills.map((s) => (
              <span key={s} style={{ ...tagStyle, background: "#f3e5f5", color: "#6a1b9a" }}>{s}</span>
            ))}
          </div>
        </>
      )}

      <h3 style={{ marginTop: 28 }}>Apply for this Job</h3>
      <textarea
        placeholder="Write a cover letter (optional)..."
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        rows={5}
        style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: "0.95rem", resize: "vertical" }}
      />
      <br />
      <button
        onClick={handleApply}
        disabled={applying}
        style={{ marginTop: 12, padding: "10px 28px", background: "#1a73e8", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "1rem" }}
      >
        {applying ? "Applying..." : "Submit Application"}
      </button>
      {message && <p style={{ marginTop: 12, color: message.includes("success") ? "green" : "red" }}>{message}</p>}
    </div>
  );
}
