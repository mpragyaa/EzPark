import { supabase, SUPABASE_AVAILABLE } from './supabase';
import { getStoredLocalUsers, saveStoredLocalUsers } from './authService';

export const userService = {
  // ADMIN: Fetch all user profiles from public.users or local storage
  async fetchUsers() {
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const usersWithBookings = await Promise.all(
            data.map(async (user) => {
              const { count, error: countErr } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
                
              return {
                ...user,
                bookingsCount: countErr ? 0 : count,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User'
              };
            })
          );
          return usersWithBookings;
        }
      } catch (err) {
        console.warn('[userService] Supabase fetchUsers unreachable, using local users:', err.message);
      }
    }

    const localUsers = getStoredLocalUsers();
    return localUsers.map((u, idx) => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'User',
      email: u.email,
      phone_number: u.phone_number,
      role: u.role,
      bookingsCount: idx === 0 ? 3 : 1,
      status: u.role === 'admin' || u.role === 'operator' ? 'Admin' : 'Active'
    }));
  },

  // ADMIN: Toggle user role or status (represented by active/inactive states)
  async updateUserRole(userId, newRole) {
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .update({ role: newRole })
          .eq('id', userId)
          .select()
          .single();

        if (!error && data) return data;
      } catch (err) {
        console.warn('[userService] Supabase updateUserRole unreachable, updating locally:', err.message);
      }
    }

    const localUsers = getStoredLocalUsers();
    const idx = localUsers.findIndex(u => u.id === userId);
    if (idx !== -1) {
      localUsers[idx].role = newRole;
      saveStoredLocalUsers(localUsers);
      return localUsers[idx];
    }
    throw new Error('User not found');
  },

  // ADMIN: Remove user profile
  async deleteUser(userId) {
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (!error) return;
      } catch (err) {
        console.warn('[userService] Supabase deleteUser unreachable, deleting locally:', err.message);
      }
    }

    let localUsers = getStoredLocalUsers();
    localUsers = localUsers.filter(u => u.id !== userId);
    saveStoredLocalUsers(localUsers);
  }
};
