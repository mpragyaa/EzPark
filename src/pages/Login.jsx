import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import '../styles/auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email Validation
    if (!email) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Password Validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    setIsLoading(true);
    
    try {
      const data = await login(email, password);
      showToast('Signed in successfully!', 'success');
      
      const profile = data.profile || data.user;
      if (profile?.role === 'operator' || profile?.role === 'admin') {
        navigate('/operator');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Authentication failed. Please verify credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Header Info */}
      <div className="auth-header">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Access your premium parking suite</p>
      </div>

      {/* Quick Demo Credentials Helpers */}
      <div style={{
        marginBottom: '1.25rem',
        padding: '0.85rem',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          One-Click Demo Accounts:
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleQuickFill('demo@ezpark.com', 'password123')}
            style={{
              flex: '1 1 auto',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              borderRadius: '6px',
              padding: '0.4rem 0.65rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🚗 Demo User
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('admin@ezpark.com', 'admin123')}
            style={{
              flex: '1 1 auto',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#c084fc',
              borderRadius: '6px',
              padding: '0.4rem 0.65rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🛡️ Demo Operator
          </button>
        </div>
      </div>

      {/* Login Form */}
      <form className="auth-form" onSubmit={handleLoginSubmit}>
        
        {/* Email Field */}
        <div className="auth-form-group">
          <label className="auth-label">Email Address</label>
          <input
            type="email"
            className={`auth-input ${errors.email ? 'invalid' : ''}`}
            placeholder="name@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors(prev => ({ ...prev, email: null }));
            }}
          />
          {errors.email && (
            <span className="auth-error-msg">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errors.email}
            </span>
          )}
        </div>

        {/* Password Field */}
        <div className="auth-form-group">
          <label className="auth-label">Password</label>
          <input
            type="password"
            className={`auth-input ${errors.password ? 'invalid' : ''}`}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors(prev => ({ ...prev, password: null }));
            }}
          />
          {errors.password && (
            <span className="auth-error-msg">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errors.password}
            </span>
          )}
        </div>

        {/* Remember Me & Forgot Password Row */}
        <div className="auth-row-helper">
          <label className="auth-checkbox-container">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember Me</span>
          </label>
          <Link to="/forgot-password" className="auth-forgot-link">
            Forgot Password?
          </Link>
        </div>

        {/* Login Button */}
        <button type="submit" className="btn-auth-submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1.2s linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>

        {/* Divider */}
        <div className="auth-divider">or</div>

        {/* Google OAuth Login (UI Only) */}
        <button
          type="button"
          className="btn-oauth"
          onClick={() => {
            setEmail('demo@ezpark.com');
            setPassword('password123');
            showToast('Loaded demo credentials. Click Sign In to continue.', 'info');
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.8 10.2H12V14h3.9c-.3 1.3-1.4 2.2-2.9 2.2-2 0-3.6-1.6-3.6-3.6s1.6-3.6 3.6-3.6c.9 0 1.8.3 2.4.9l2.7-2.7C16.3 5.4 14.3 4.5 12 4.5 7.9 4.5 4.5 7.9 4.5 12s3.4 7.5 7.5 7.5c4.3 0 7.4-3 7.4-7.5 0-.6-.1-1.2-.2-1.8z" />
          </svg>
          <span>Continue with Google / Quick Demo</span>
        </button>

      </form>

      {/* Footer link to Register page */}
      <div className="auth-footer">
        <span>Don't have an account?</span>
        <Link to="/signup" className="auth-footer-link">
          Create Account
        </Link>
      </div>
    </AuthLayout>
  );
}
