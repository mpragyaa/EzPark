import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Premium loading state during authentication lookup
  if (loading) {
    return (
      <main className="auth-page-container">
        <div className="auth-spotlight" />
        <div className="auth-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="3" style={{ animation: 'spin 1.2s linear infinite', margin: '0 auto 1rem auto' }}>
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.05)" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 300 }}>
            Verifying secure credentials...
          </p>
        </div>
      </main>
    );
  }

  // Redirect to sign in if unauthenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to regular dashboard if admin page is accessed by normal user
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render child matching endpoints
  return <Outlet />;
}
