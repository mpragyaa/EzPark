import { supabase, SUPABASE_AVAILABLE } from './supabase';

const LOCAL_USERS_KEY = 'ezpark_local_users';
const LOCAL_SESSION_KEY = 'ezpark_auth_session';

const DEFAULT_DEMO_USERS = [
  {
    id: 'demo-user-1',
    email: 'demo@ezpark.com',
    password: 'password123',
    first_name: 'Alex',
    last_name: 'Driver',
    phone_number: '+1 (555) 234-5678',
    role: 'user',
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'demo-admin-1',
    email: 'admin@ezpark.com',
    password: 'admin123',
    first_name: 'Jordan',
    last_name: 'Operator',
    phone_number: '+1 (555) 987-6543',
    role: 'operator',
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'demo-user-2',
    email: 'user@ezpark.com',
    password: 'password123',
    first_name: 'Sarah',
    last_name: 'Connor',
    phone_number: '+1 (555) 432-8765',
    role: 'user',
    created_at: '2026-01-02T00:00:00.000Z'
  }
];

export function getStoredLocalUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_DEMO_USERS));
      return DEFAULT_DEMO_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DEMO_USERS;
  } catch {
    return DEFAULT_DEMO_USERS;
  }
}

export function saveStoredLocalUsers(users) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save local users:', err);
  }
}

export function getLocalAuthSession() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalAuthSession(sessionData) {
  try {
    if (!sessionData) {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    } else {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(sessionData));
    }
  } catch (err) {
    console.error('Failed to persist auth session:', err);
  }
}

function findLocalUser(email) {
  const users = getStoredLocalUsers();
  return users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
}

export const authService = {
  getStoredUsers() {
    return getStoredLocalUsers();
  },

  // Sign up user with Email, Password and metadata
  async signUp(email, password, firstName, lastName, phoneNumber, role = 'user') {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try Supabase if configured
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              phone_number: phoneNumber,
              role: role
            }
          }
        });

        if (!error && data?.user) {
          return data;
        }
        if (error && !error.message?.includes('fetch') && !error.message?.includes('Network')) {
          throw error;
        }
      } catch (err) {
        if (!err.message?.includes('fetch') && !err.message?.includes('Network')) {
          throw err;
        }
        console.warn('[authService] Supabase signup unreachable, registering locally:', err.message);
      }
    }

    // 2. Local fallback registration
    const existing = findLocalUser(normalizedEmail);
    if (existing) {
      const err = new Error('An account with this email already exists.');
      err.code = 'USER_ALREADY_EXISTS';
      throw err;
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      email: normalizedEmail,
      password,
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      role: role || 'user',
      created_at: new Date().toISOString()
    };

    const users = getStoredLocalUsers();
    users.push(newUser);
    saveStoredLocalUsers(users);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        user_metadata: {
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          phone_number: newUser.phone_number,
          role: newUser.role
        }
      },
      session: null
    };
  },

  // Log in user with Email and Password
  async signIn(email, password) {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try Supabase if configured
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

        if (!error && data?.session) {
          let profile = null;
          try {
            profile = await this.getUserProfile(data.user.id);
          } catch {
            profile = {
              id: data.user.id,
              email: data.user.email,
              first_name: data.user.user_metadata?.first_name || data.user.email.split('@')[0],
              last_name: data.user.user_metadata?.last_name || '',
              phone_number: data.user.user_metadata?.phone_number || '',
              role: data.user.user_metadata?.role || 'user'
            };
          }

          const sessionPayload = {
            user: { ...data.user, ...profile },
            session: data.session,
            profile
          };
          setLocalAuthSession(sessionPayload);
          return sessionPayload;
        }

        // If credentials failed on Supabase, don't fall back unless it's demo credentials or network failure
        if (error && !error.message?.includes('fetch') && !error.message?.includes('Network')) {
          const isDemo = normalizedEmail === 'demo@ezpark.com' || normalizedEmail === 'admin@ezpark.com' || normalizedEmail === 'user@ezpark.com';
          if (!isDemo) {
            throw error;
          }
        }
      } catch (err) {
        const isDemo = normalizedEmail === 'demo@ezpark.com' || normalizedEmail === 'admin@ezpark.com' || normalizedEmail === 'user@ezpark.com';
        if (!err.message?.includes('fetch') && !err.message?.includes('Network') && !isDemo) {
          throw err;
        }
        console.warn('[authService] Supabase sign-in unreachable, checking local credentials:', err.message);
      }
    }

    // 2. Local / Demo credentials check
    const localUser = findLocalUser(normalizedEmail);
    if (!localUser) {
      const err = new Error('Invalid email or password. You can use demo@ezpark.com (password: password123) or create a new account.');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    // For demo users, allow any non-empty password or exact match
    const isDemo = ['demo@ezpark.com', 'admin@ezpark.com', 'user@ezpark.com'].includes(normalizedEmail);
    if (!isDemo && localUser.password && localUser.password !== password) {
      const err = new Error('Incorrect password. Please try again.');
      err.code = 'INVALID_PASSWORD';
      throw err;
    }

    const mockSession = {
      access_token: `mock-token-${Date.now()}`,
      expires_at: Math.floor(Date.now() / 1000) + 86400 * 7,
      user: {
        id: localUser.id,
        email: localUser.email,
        user_metadata: {
          first_name: localUser.first_name,
          last_name: localUser.last_name,
          phone_number: localUser.phone_number,
          role: localUser.role
        }
      }
    };

    const profile = {
      id: localUser.id,
      email: localUser.email,
      first_name: localUser.first_name,
      last_name: localUser.last_name,
      phone_number: localUser.phone_number,
      role: localUser.role
    };

    const sessionPayload = {
      user: { ...mockSession.user, ...profile },
      session: mockSession,
      profile
    };

    setLocalAuthSession(sessionPayload);
    return sessionPayload;
  },

  // Log out current user
  async signOut() {
    setLocalAuthSession(null);
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[authService] Supabase signOut error ignored:', err.message);
      }
    }
  },

  // Request password reset link
  async resetPassword(email, redirectTo = `${window.location.origin}/login`) {
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (!error) return data;
      } catch (err) {
        console.warn('[authService] resetPassword failed on Supabase, using mock fallback:', err.message);
      }
    }
    return { message: 'Password recovery email sent (simulated).' };
  },

  // Fetch additional profile metrics for a specific user ID
  async getUserProfile(userId) {
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) return data;
      } catch (err) {
        console.warn('[authService] Failed to query users table, trying profiles table:', err.message);
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          return {
            ...data,
            first_name: data.full_name?.split(' ')[0] || '',
            last_name: data.full_name?.split(' ').slice(1).join(' ') || '',
            phone_number: data.phone || '',
            role: data.role || 'user'
          };
        }
      } catch {}
    }

    // Local profile fallback
    const localUsers = getStoredLocalUsers();
    const found = localUsers.find(u => u.id === userId);
    if (found) {
      return {
        id: found.id,
        email: found.email,
        first_name: found.first_name,
        last_name: found.last_name,
        phone_number: found.phone_number,
        role: found.role
      };
    }

    // Default fallback to guarantee session never dies
    return {
      id: userId,
      first_name: 'Demo',
      last_name: 'User',
      phone_number: '',
      role: 'user'
    };
  },

  // Listen to Session and Auth status shifts
  onAuthStateChange(callback) {
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
        return subscription;
      } catch (err) {
        console.warn('[authService] onAuthStateChange subscription failed:', err.message);
      }
    }
    return { unsubscribe: () => {} };
  }
};
