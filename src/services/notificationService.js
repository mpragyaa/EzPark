import { supabase } from './supabase';

export const notificationService = {
  // Fetch notifications for a specific user
  async fetchNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Mark specific notification alert as read
  async markAsRead(notificationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create system notification
  async createNotification(userId, message, type = 'info') {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        message,
        type,
        is_read: false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
