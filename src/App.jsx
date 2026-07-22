const ParkingMap = lazy(() => import('./components/map/ParkingMap'));
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import ProtectedRoute from './contexts/ProtectedRoute';

// Lazy loading pages for Code Splitting and Performance Optimization
const Landing = lazy(() => import('./pages/Landing'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Premium Loading Spinner overlay panel for route suspense fallbacks
const LoadingScreen = () => (
  <main className="auth-page-container">
    <div className="auth-spotlight" />
    <div className="auth-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
      <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="3" style={{ animation: 'spin 1.2s linear infinite', margin: '0 auto 1rem auto' }}>
        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.05)" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 300 }}>
        Loading EZPARK view...
      </p>
    </div>
  </main>
);

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RealtimeProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/map" element={<ParkingMap />} />

                {/* Secure Customer Portal */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<UserDashboard />} />
                </Route>

                {/* Secure Admin Console */}
                <Route element={<ProtectedRoute adminOnly={true} />}>
                  <Route path="/operator" element={<AdminDashboard />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </RealtimeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
