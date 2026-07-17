import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Simulate password reset interaction
    console.log('Sending password reset email to:', email);
    setIsSubmitted(true);

    /*
     * TODO: Integrate Supabase Authentication
     *
     * Example:
     * const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
     *   redirectTo: 'http://localhost:5173/reset-password',
     * });
     *
     * if (error) {
     *   setErrors({ form: error.message });
     *   setIsSubmitted(false);
     *   return;
     * }
     */
  };

  return (
    <AuthLayout>
      {/* Dynamic Render based on success state */}
      {!isSubmitted ? (
        <>
          {/* Header Info */}
          <div className="auth-header">
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">We will send you a recovery link</p>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleResetPasswordSubmit}>
            
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
              {errors.email && <span className="auth-error-msg">{errors.email}</span>}
            </div>

            {/* Submit Action */}
            <button type="submit" className="btn-auth-submit" style={{ marginTop: '1rem' }}>
              Send Reset Link
            </button>

          </form>
        </>
      ) : (
        <>
          {/* Success layout confirmation */}
          <div className="auth-header" style={{ marginBottom: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: 'var(--color-success-glow)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-success)',
              margin: '0 auto 1.5rem auto',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="auth-title">Email Dispatched</h2>
            <p className="auth-subtitle" style={{ maxWidth: '300px', margin: '0 auto' }}>
              A security verification link has been sent to <strong>{email}</strong>. Please check your inbox.
            </p>
          </div>
          
          <button 
            type="button" 
            className="btn-auth-submit" 
            style={{ width: '100%', marginTop: '1.5rem' }}
            onClick={() => setIsSubmitted(false)}
          >
            Resend Email
          </button>
        </>
      )}

      {/* Footer link to sign in page */}
      <div className="auth-footer">
        <span>Back to</span>
        <Link to="/login" className="auth-footer-link">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
