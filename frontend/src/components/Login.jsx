import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(email, password);
      navigate(search.get('next') || '/', { replace: true });
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 380,
        margin: '60px auto',
        padding: 24,
        border: '1px solid #e5e7eb',
        borderRadius: 12,
      }}
    >
      <h2 style={{ marginTop: 0 }}>Sign in</h2>
      <form onSubmit={onSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
        {err && (
          <div style={{ color: '#b91c1c', marginBottom: 12 }}>{err}</div>
        )}
        <button
          type="submit"
          disabled={busy}
          style={{ width: '100%', padding: 10, cursor: busy ? 'wait' : 'pointer' }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div style={{ marginTop: 12, fontSize: 14 }}>
        No account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
}
