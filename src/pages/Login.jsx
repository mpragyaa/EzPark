import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authService } from '../services/authService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

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

    try {
      const data = await login(email, password);
      showToast('Signed in successfully!', 'success');
      
      // Fetch user profile role to route appropriately
      const profile = await authService.getUserProfile(data.user.id);
      if (profile.role === 'operator' || profile.role === 'admin') {
        navigate('/operator');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Authentication failed. Please verify credentials.', 'error');
    }
  };

  return (
    <AuthLayout>
      {/* Header Info */}
      <div className="auth-header">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Access your premium parking suite</p>
      </div>

      {/* Login Form */}
      <form className="auth-form" onSubmit={handleLoginSubmit}>
        
        {/* Email Field */}
        <div className="auth-input-group">
          <label className="auth-input-label">Email Address</label>
          <input
            type="email"
            className={`auth-input-field ${errors.email ? 'invalid' : ''}`}
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
        <div className="auth-input-group">
          <label className="auth-input-label">Password</label>
          <input
            type="password"
            className={`auth-input-field ${errors.password ? 'invalid' : ''}`}
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
        <div className="auth-form-row">
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
        <button type="submit" className="btn-auth-submit">
          Sign In
        </button>

        {/* Divider */}
        <div className="auth-divider">or</div>

        {/* Google OAuth Login (UI Only) */}
        <button
          type="button"
          className="btn-oauth"
          onClick={() => alert('OAuth Google login initiated')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.8 10.2H12V14h3.9c-.3 1.3-1.4 2.2-2.9 2.2-2 0-3.6-1.6-3.6-3.6s1.6-3.6 3.6-3.6c.9 0 1.8.3 2.4.9l2.7-2.7C16.3 5.4 14.3 4.5 12 4.5 7.9 4.5 4.5 7.9 4.5 12s3.4 7.5 7.5 7.5c4.3 0 7.4-3 7.4-7.5 0-.6-.1-1.2-.2-1.8z" />
          </svg>
          <span>Continue with Google</span>
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
