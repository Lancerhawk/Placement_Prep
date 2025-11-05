import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const { refresh, setUserInMemory } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    // Validate username length
    if (username.length < 3 || username.length > 32) {
      setError('Username must be between 3 and 32 characters');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, username, password, confirmPassword, remember }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(data.message || 'Registration failed');
      }
      const data = await res.json();
      if (data.remembered) {
        await refresh();
      } else {
        setUserInMemory(data.user);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-inner">
          <div className="auth-header">
            <h2 className="auth-title">Create your account</h2>
            <div className="auth-subtitle">Sign up to get started</div>
          </div>
          <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
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
            <ul className="pw-checklist">
              <li className={hasUpper ? 'ok' : 'bad'}>
                <span className="icon">{hasUpper ? '✓' : '•'}</span>
                At least 1 uppercase letter
              </li>
              <li className={hasNumber ? 'ok' : 'bad'}>
                <span className="icon">{hasNumber ? '✓' : '•'}</span>
                At least 1 number
              </li>
              <li className={hasSpecial ? 'ok' : 'bad'}>
                <span className="icon">{hasSpecial ? '✓' : '•'}</span>
                At least 1 special character
              </li>
            </ul>
            <div className="field password-wrap">
              <label htmlFor="confirm">Confirm Password</label>
              <input id="confirm" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <button
                type="button"
                className="toggle-eye"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? (
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
                {loading ? 'Creating...' : 'Sign up'}
              </button>
              <Link className="link" to="/login">Already have an account?</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


