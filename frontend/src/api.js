import axios from 'axios';

// Backend issues an httpOnly cookie on /auth/login. We MUST send credentials
// on every request so the cookie travels. Do NOT read tokens from localStorage.
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  withCredentials: true,
  timeout: 15000,
});

// Global 401 handler — bounce to /login (preserving the destination).
API.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      const here = window.location.pathname + window.location.search;
      const open = ['/login', '/register'];
      if (!open.includes(window.location.pathname)) {
        window.location.assign('/login?next=' + encodeURIComponent(here));
      }
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const logout = () => API.post('/auth/logout');
export const fetchMe = () => API.get('/auth/me');

// ─── Users ───────────────────────────────────────────────────────────────────
export const getUser = (userId) => API.get(`/users/${userId}`);
export const updateUser = (userId, data) => API.patch(`/users/${userId}`, data);

// ─── Jobs ────────────────────────────────────────────────────────────────────
export const listJobs = (params) => API.get('/jobs/', { params });
export const getJob = (id) => API.get(`/jobs/${id}`);
export const matchJobs = (userId, params) =>
  API.get(`/jobs/match/${userId}`, { params });
// employer_id is NEVER sent — backend uses session
export const createJob = (data) => API.post('/jobs/', data);

// ─── Applications ────────────────────────────────────────────────────────────
// user_id is NEVER sent — backend uses session
export const applyToJob = (data) => API.post('/applications/', data);
export const listMyApplications = (userId) =>
  API.get(`/applications/user/${userId}`);
export const updateApplicationStatus = (applicationId, status) =>
  API.patch(`/applications/${applicationId}/status`, { status });

export default API;
