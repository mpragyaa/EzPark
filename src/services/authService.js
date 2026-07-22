import { supabase } from './supabase';

export const authService = {
  // Sign up user with Email, Password and metadata
  async signUp(email, password, firstName, lastName, phoneNumber, role = 'user') {
    const { data, error } = await supabase.auth.signUp({
      email,
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

    if (error) throw error;
    return data;
  },

  // Log in user with Email and Password
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  // Log out current user
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Request password reset link
  async resetPassword(email, redirectTo = `${window.location.origin}/login`) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (error) throw error;
    return data;
  },

  // Fetch additional profile metrics for a specific user ID
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Listen to Session and Auth status shifts
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  }
};
