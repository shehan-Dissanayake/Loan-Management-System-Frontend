import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    loginApi(username, password)
      .then((data) => {
        login(data.access_token);
        navigate('/');
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Login failed');
        setLoading(false);
      });
  };

  return (
    <div className="login-shell">
      <div style={{ position: 'absolute', top: '1rem', right: '1.5rem' }}>
        <button className="theme-btn" onClick={toggle}>
          <i className={`ti ti-${dark ? 'sun' : 'moon'}`} aria-hidden="true" />
          {dark ? 'Light' : 'Dark'}
        </button>
      </div>
      <div className="login-card">
        <div className="login-logo">Rohana <span>Credit</span></div>
        <p className="login-sub">Sign in to continue</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <p className="error-msg mb-2">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}