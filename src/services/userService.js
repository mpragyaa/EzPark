import { supabase } from './supabase';

export const userService = {
  // ADMIN: Fetch all user profiles from public.users
  async fetchUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Supplement with dummy counts since SQL triggers or joins count bookings
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
  },

  // ADMIN: Toggle user role or status (represented by active/inactive states)
  async updateUserRole(userId, newRole) {
    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ADMIN: Remove user profile
  async deleteUser(userId) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }
};
