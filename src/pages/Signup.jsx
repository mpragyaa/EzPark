import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // First & Last Name
    if (!firstName) newErrors.firstName = 'First name is required';
    if (!lastName) newErrors.lastName = 'Last name is required';

    // Email
    if (!email) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Phone
    if (!phone) {
      newErrors.phone = 'Phone number is required';
    }

    // Password
    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      // Check for at least one number
      if (!/\d/.test(password)) {
        newErrors.password = 'Password must contain at least one number';
      }
    }

    // Confirm Password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Agree Terms
    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms & Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Simulate signup interaction
    console.log('Registering user:', { firstName, lastName, email, phone, password, agreeTerms });
    alert(`Account created successfully for: ${email}`);

    /*
     * TODO: Integrate Supabase Authentication
     *
     * Example:
     * const { data, error } = await supabase.auth.signUp({
     *   email: email,
     *   password: password,
     *   options: {
     *     data: {
     *       first_name: firstName,
     *       last_name: lastName,
     *       phone_number: phone
     *     }
     *   }
     * });
     *
     * if (error) {
     *   setErrors({ form: error.message });
     *   return;
     * }
     *
     * // Redirect user to check email or dashboard
     * navigate('/dashboard');
     */
  };

  return (
    <AuthLayout>
      {/* Header Info */}
      <div className="auth-header">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join the premium AI smart parking space</p>
      </div>

      {/* Signup Form */}
      <form className="auth-form" onSubmit={handleSignupSubmit}>
        
        {/* Double Name grid */}
        <div className="auth-grid-row">
          <div className="auth-input-group">
            <label className="auth-input-label">First Name</label>
            <input
              type="text"
              className={`auth-input-field ${errors.firstName ? 'invalid' : ''}`}
              placeholder="Alex"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) setErrors(prev => ({ ...prev, firstName: null }));
              }}
            />
            {errors.firstName && <span className="auth-error-msg">{errors.firstName}</span>}
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Last Name</label>
            <input
              type="text"
              className={`auth-input-field ${errors.lastName ? 'invalid' : ''}`}
              placeholder="Smith"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (errors.lastName) setErrors(prev => ({ ...prev, lastName: null }));
              }}
            />
            {errors.lastName && <span className="auth-error-msg">{errors.lastName}</span>}
          </div>
        </div>

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

        {/* Phone Field */}
        <div className="auth-input-group">
          <label className="auth-input-label">Phone Number</label>
          <input
            type="tel"
            className={`auth-input-field ${errors.phone ? 'invalid' : ''}`}
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
            }}
          />
          {errors.phone && <span className="auth-error-msg">{errors.phone}</span>}
        </div>

        {/* Password Fields */}
        <div className="auth-grid-row">
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
            {errors.password && <span className="auth-error-msg">{errors.password}</span>}
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Confirm Password</label>
            <input
              type="password"
              className={`auth-input-field ${errors.confirmPassword ? 'invalid' : ''}`}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }));
              }}
            />
            {errors.confirmPassword && <span className="auth-error-msg">{errors.confirmPassword}</span>}
          </div>
        </div>

        {/* Agree Terms Checkbox */}
        <div className="auth-form-row" style={{ justifyContent: 'flex-start' }}>
          <label className="auth-checkbox-container">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (errors.agreeTerms) setErrors(prev => ({ ...prev, agreeTerms: null }));
              }}
            />
            <span>I agree to the Terms & Privacy Policy</span>
          </label>
        </div>
        {errors.agreeTerms && <span className="auth-error-msg" style={{ marginTop: '-0.75rem' }}>{errors.agreeTerms}</span>}

        {/* Submit Register button */}
        <button type="submit" className="btn-auth-submit">
          Create Account
        </button>

        {/* Divider */}
        <div className="auth-divider">or</div>

        {/* Google Signup Button */}
        <button
          type="button"
          className="btn-oauth"
          onClick={() => alert('OAuth Google signup initiated')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.8 10.2H12V14h3.9c-.3 1.3-1.4 2.2-2.9 2.2-2 0-3.6-1.6-3.6-3.6s1.6-3.6 3.6-3.6c.9 0 1.8.3 2.4.9l2.7-2.7C16.3 5.4 14.3 4.5 12 4.5 7.9 4.5 4.5 7.9 4.5 12s3.4 7.5 7.5 7.5c4.3 0 7.4-3 7.4-7.5 0-.6-.1-1.2-.2-1.8z" />
          </svg>
          <span>Sign up with Google</span>
        </button>

      </form>

      {/* Footer login link */}
      <div className="auth-footer">
        <span>Already have an account?</span>
        <Link to="/login" className="auth-footer-link">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
