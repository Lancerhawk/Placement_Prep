import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { refresh, setUserInMemory } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Login failed:', res.status, errorText);
        let data;
        try {
          data = JSON.parse(errorText);
        } catch {
          data = { message: `Login failed: ${res.status} ${res.statusText}` };
        }
        throw new Error(data.message || 'Login failed');
      }
      const data = await res.json();
      if (data.remembered) {
        await refresh();
      } else {
        setUserInMemory(data.user);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-inner">
          <div className="auth-header">
            <h2 className="auth-title">Welcome back</h2>
            <div className="auth-subtitle">Log in to access your dashboard</div>
          </div>
          <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
            <div className="field password-wrap">
              <label htmlFor="password">Password</label>
              <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button
                type="button"
                className="toggle-eye"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 10.94 7.5a11.05 11.05 0 01-3 4.5M6.06 6.06A11.02 11.02 0 001.06 12.5C2.73 16.89 7 20 12 20c1.29 0 2.52-.2 3.65-.57" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.05 12.5C2.72 8.11 7 5 12 5s9.27 3.11 10.94 7.5C21.27 16.89 17 20 12 20S2.73 16.89 1.05 12.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </button>
            </div>
            <div className="row" style={{ justifyContent: 'space-between', margin: '8px 0 6px' }}>
              <label className="checkbox">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
            </div>
          {error && <div className="error">{error}</div>}
            <div className="actions">
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <Link className="link" to="/register">Create an account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


