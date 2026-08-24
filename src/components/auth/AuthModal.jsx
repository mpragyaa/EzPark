/**
 * AuthModal.jsx
 *
 * Premium inline modal for logging in or signing up without leaving the page.
 * Seamlessly continues the booking flow after successful authentication.
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  const { login, signup } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
        showToast('Logged in successfully!', 'success');
        onSuccess?.();
      } else {
        await signup(email, password, firstName, lastName, phone);
        showToast('Sign up successful! Please log in.', 'success');
        setActiveTab('login');
        setPassword('');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Authentication failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pd-backdrop pd-backdrop--visible" style={{ zIndex: 2000 }} onClick={onClose}>
      <div
        className="auth-modal-card"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(400px, 90vw)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          padding: '2rem 1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing
      >
        {/* Header Close button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '1.1rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab triggers */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.2rem',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            style={{
              flex: 1,
              background: activeTab === 'login' ? 'var(--bg-tertiary)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: activeTab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '0.45rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            style={{
              flex: 1,
              background: activeTab === 'signup' ? 'var(--bg-tertiary)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: activeTab === 'signup' ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '0.45rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeTab === 'signup' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Submit action */}
          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <>
                <div className="pd-spinner-mini" style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  animation: 'modal-spin 0.7s linear infinite'
                }} />
                Authenticating...
              </>
            ) : (
              activeTab === 'login' ? 'Sign In & Book Now' : 'Create Account'
            )}
          </button>
        </form>

        <style>{`
          @keyframes modal-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
