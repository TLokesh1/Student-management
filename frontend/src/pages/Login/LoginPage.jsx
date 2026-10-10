import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, LogIn } from 'lucide-react';
import AlertMessage from '../../components/AlertMessage';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const expired = queryParams.get('expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const result = await login({ username: username.trim(), password });
    setIsSubmitting(false);

    if (result.success) {
      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath, { replace: true });
    } else {
      setError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickFill = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <GraduationCap size={28} />
          </div>
          <h1 className="auth-title">Academic Portal</h1>
          <p className="auth-subtitle">Sign in to your university account</p>
        </div>

        {expired && (
          <AlertMessage
            type="warning"
            message="Your session has expired. Please sign in again."
            onClose={() => {}}
          />
        )}

        {error && (
          <AlertMessage
            type="danger"
            message={error}
            onClose={() => setError('')}
          />
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username <span className="required">*</span>
            </label>
            <input
              id="username"
              type="text"
              className={`form-control ${error ? 'is-invalid' : ''}`}
              placeholder="e.g. admin, faculty, or student"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              id="password"
              type="password"
              className={`form-control ${error ? 'is-invalid' : ''}`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px 16px', fontSize: '0.95rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              'Authenticating...'
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-test-credentials">
          <strong>Demo Login Accounts:</strong>
          <div className="credential-row">
            <span>Admin: <code>admin</code> / <code>admin123</code></span>
            <button
              type="button"
              className="credential-btn"
              onClick={() => handleQuickFill('admin', 'admin123')}
            >
              Fill
            </button>
          </div>
          <div className="credential-row">
            <span>Faculty: <code>faculty</code> / <code>faculty123</code></span>
            <button
              type="button"
              className="credential-btn"
              onClick={() => handleQuickFill('faculty', 'faculty123')}
            >
              Fill
            </button>
          </div>
          <div className="credential-row">
            <span>Student: <code>student</code> / <code>student123</code></span>
            <button
              type="button"
              className="credential-btn"
              onClick={() => handleQuickFill('student', 'student123')}
            >
              Fill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
