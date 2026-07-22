import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync profile details from public.users table on active session
  const fetchUserProfile = async (userId) => {
    try {
      const profile = await authService.getUserProfile(userId);
      setUser(profile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setUser(null);
    }
  };

  useEffect(() => {
    // 1. Listen to active auth status triggers
    const subscription = authService.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      
      if (newSession?.user) {
        await fetchUserProfile(newSession.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.signIn(email, password);
      setSession(data.session);
      if (data.user) {
        await fetchUserProfile(data.user.id);
      }
      return data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, firstName, lastName, phone, role = 'user') => {
    setLoading(true);
    try {
      const data = await authService.signUp(email, password, firstName, lastName, phone, role);
      return data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setSession(null);
      setUser(null);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!session,
    isAdmin: user?.role === 'operator' || user?.role === 'admin',
    isOperator: user?.role === 'operator' || user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
