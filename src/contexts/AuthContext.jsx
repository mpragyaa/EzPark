import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, getLocalAuthSession } from '../services/authService';
import { supabase, SUPABASE_AVAILABLE } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync profile details from DB or fallback safely
  const fetchUserProfile = async (userId) => {
    try {
      const profile = await authService.getUserProfile(userId);
      setUser(profile);
      return profile;
    } catch (err) {
      console.warn('Error fetching user profile, using safe fallback:', err);
      const fallback = { id: userId, role: 'user', first_name: 'User' };
      setUser(fallback);
      return fallback;
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        if (SUPABASE_AVAILABLE && supabase) {
          const { data, error } = await supabase.auth.getSession();
          if (mounted && data?.session && !error) {
            setSession(data.session);
            if (data.session.user) {
              try {
                await fetchUserProfile(data.session.user.id);
              } catch {
                // Ignore initial fetch errors
              }
            }
            if (mounted) setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Initial session fetch error:', err.message);
      }

      // Check stored local session
      if (mounted) {
        const localSession = getLocalAuthSession();
        if (localSession?.session) {
          setSession(localSession.session);
          setUser(localSession.profile || localSession.user);
        }
        setLoading(false);
      }
    }
    
    initializeAuth();

    // Listen to active auth status triggers
    let subscription = null;
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const res = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (!mounted) return;
          if (newSession) {
            setSession(newSession);
            if (newSession.user) {
              try {
                await fetchUserProfile(newSession.user.id);
              } catch {}
            }
          }
          setLoading(false);
        });
        subscription = res?.data?.subscription;
      } catch (err) {
        console.warn('Failed to listen to auth state changes:', err);
      }
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.signIn(email, password);
      setSession(data.session);
      setUser(data.profile || data.user);
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
      console.warn('Logout error:', err);
      setSession(null);
      setUser(null);
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
