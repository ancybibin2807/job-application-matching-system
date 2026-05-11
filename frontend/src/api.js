import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
});

// Attach JWT token to every request if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── User APIs ─────────────────────────────────────────────────────────────────
export const registerUser = (data) => API.post("/users/", data);
export const getUser = (userId) => API.get(`/users/${userId}`);
export const updateUser = (userId, data) => API.patch(`/users/${userId}`, data);

// ─── Job APIs ──────────────────────────────────────────────────────────────────
export const listJobs = (skip = 0, limit = 20) =>
  API.get(`/jobs/?skip=${skip}&limit=${limit}`);
export const getJob = (jobId) => API.get(`/jobs/${jobId}`);
export const createJob = (data) => API.post("/jobs/", data);
export const getMatchedJobs = (userId) => API.get(`/jobs/match/${userId}`);

// ─── Application APIs ──────────────────────────────────────────────────────────
export const applyForJob = (data) => API.post("/applications/", data);
export const getUserApplications = (userId) =>
  API.get(`/applications/user/${userId}`);
export const getJobApplications = (jobId) =>
  API.get(`/applications/job/${jobId}`);
export const updateApplicationStatus = (appId, status) =>
  API.patch(`/applications/${appId}/status?status=${status}`);

export default API;
