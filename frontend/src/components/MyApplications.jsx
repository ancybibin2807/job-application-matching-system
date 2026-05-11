import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserApplications, updateApplicationStatus } from "../api";

const STATUS_COLORS = {
  applied:    { bg: "#e3f2fd", color: "#1565c0" },
  screening:  { bg: "#fff3e0", color: "#e65100" },
  interview:  { bg: "#f3e5f5", color: "#6a1b9a" },
  offer:      { bg: "#e8f5e9", color: "#1b5e20" },
  hired:      { bg: "#c8e6c9", color: "#1b5e20" },
  rejected:   { bg: "#ffebee", color: "#b71c1c" },
};

export default function MyApplications() {
  const { userId } = useParams();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserApplications(userId)
      .then((res) => setApps(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <p>Loading your applications...</p>;

  return (
    <div>
      <h1>My Applications</h1>
      {apps.length === 0 && (
        <p>You haven't applied to any jobs yet. <Link to="/">Browse Jobs</Link></p>
      )}
      {apps.map((app) => {
        const sc = STATUS_COLORS[app.status] || STATUS_COLORS.applied;
        return (
          <div key={app.id} style={{ border: "1px solid #e0e0e0", borderRadius: 10, padding: 20, marginBottom: 14, background: "white", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: 0 }}>
                <Link to={"/jobs/" + app.job_id} style={{ color: "#1a73e8", textDecoration: "none" }}>
                  Job #{app.job_id}
                </Link>
              </h3>
              <p style={{ margin: "6px 0", color: "#777", fontSize: "0.9rem" }}>
                Applied: {new Date(app.applied_at).toLocaleDateString()}
              </p>
              {app.cover_letter && (
                <p style={{ margin: "6px 0", color: "#555", fontSize: "0.9rem" }}>
                  {app.cover_letter.slice(0, 100)}{app.cover_letter.length > 100 ? "..." : ""}
                </p>
              )}
            </div>
            <div style={{ textAlign: "right", minWidth: 120 }}>
              <span style={{ ...sc, borderRadius: 20, padding: "4px 14px", fontSize: "0.85rem", fontWeight: 500 }}>
                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
              </span>
              <p style={{ margin: "8px 0 0", color: "#888", fontSize: "0.85rem" }}>
                Match: {app.match_score}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
