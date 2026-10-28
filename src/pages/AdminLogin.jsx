import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authService } from '../services/authService';
import '../styles/auth.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
    if (!email) {
      newErrors.email = 'Email address is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
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
      
      const profile = data.profile || data.user;
      if (!profile) {
        throw new Error('Unable to load your account profile. Please try again.');
      }

      if (profile.role === 'admin' || profile.role === 'operator') {
        showToast('Admin authenticated successfully.', 'success');
        navigate('/operator');
      } else {
        // Normal user attempting admin login
        await authService.signOut();
        const error = new Error('You do not have permission to access the admin portal. Log in as an operator/admin.');
        error.code = 'UNAUTHORIZED';
        throw error;
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'PROFILE_MISSING' || err.code === 'UNAUTHORIZED') {
        showToast(err.message, 'error');
      } else {
        showToast(err.message || 'Authentication failed. Please verify credentials.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-header">
        <h2 className="auth-title">EzPark Admin Portal</h2>
        <p className="auth-subtitle">Sign in to manage EzPark parking operations.</p>
      </div>

      {/* Quick Demo Operator Pill */}
      <div style={{
        marginBottom: '1.25rem',
        padding: '0.85rem',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          One-Click Operator Credentials:
        </div>
        <button
          type="button"
          onClick={() => handleQuickFill('admin@ezpark.com', 'admin123')}
          style={{
            width: '100%',
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            color: '#c084fc',
            borderRadius: '6px',
            padding: '0.45rem 0.75rem',
            fontSize: '0.825rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <span>🛡️ Fill Demo Operator (admin@ezpark.com)</span>
        </button>
      </div>

      <form className="auth-form" onSubmit={handleLoginSubmit}>
        
        <div className="auth-form-group">
          <label className="auth-label">Email Address</label>
          <input
            type="email"
            className={`auth-input ${errors.email ? 'invalid' : ''}`}
            placeholder="admin@ezpark.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors(prev => ({ ...prev, email: null }));
            }}
          />
          {errors.email && (
            <span className="auth-error-msg">{errors.email}</span>
          )}
        </div>

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
            <span className="auth-error-msg">{errors.password}</span>
          )}
        </div>

        <button type="submit" className="btn-auth-submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1.2s linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Authenticating...
            </>
          ) : (
            'Admin Login'
          )}
        </button>

      </form>

      <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
        <button 
          onClick={() => navigate('/')} 
          className="auth-footer-link" 
          style={{ background: 'none', border: 'none', fontSize: '0.85rem' }}
        >
          &larr; Back to EzPark
        </button>
      </div>
    </AuthLayout>
  );
}
