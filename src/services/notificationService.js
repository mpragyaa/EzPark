/**
 * notificationService.js
 *
 * Handles creation, retrieval, and read status management of notification alerts.
 * Implements a hybrid architecture with a local storage fallback.
 */

import { supabase, SUPABASE_AVAILABLE } from './supabase';

const LOCAL_NOTIFS_KEY = 'ezpark_local_notifications';

function getLocalNotifications() {
  const data = localStorage.getItem(LOCAL_NOTIFS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalNotifications(notifs) {
  localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(notifs));
}

export const notificationService = {
  /**
   * Fetch all notifications for a user.
   *
   * @param {string} [userId='demo-user']
   * @returns {Promise<object[]>}
   */
  async getNotifications(userId = 'demo-user') {
    if (SUPABASE_AVAILABLE && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }

    // Local Storage Fallback
    return getLocalNotifications().filter(n => n.user_id === userId);
  },

  /**
   * Mark a single notification as read.
   *
   * @param {string} notificationId
   */
  async markAsRead(notificationId) {
    if (SUPABASE_AVAILABLE && supabase) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return;
    }

    // Local Storage Fallback
    const notifs = getLocalNotifications();
    const idx = notifs.findIndex(n => n.id === notificationId);
    if (idx !== -1) {
      notifs[idx].is_read = true;
      saveLocalNotifications(notifs);
    }
  },

  /**
   * Add a new notification.
   *
   * @param {string} userId
   * @param {string} message
   * @param {string} [type='info']
   */
  async addNotification(userId = 'demo-user', message, type = 'info') {
    if (SUPABASE_AVAILABLE && supabase) {
      const { error } = await supabase
        .from('notifications')
        .insert([{ user_id: userId, message, type }]);

      if (error) console.error('Add notification error:', error);
      return;
    }

    // Local Storage Fallback
    const notifs = getLocalNotifications();
    const newNotif = {
      id: `nt-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      user_id: userId,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString()
    };
    notifs.unshift(newNotif);
    saveLocalNotifications(notifs);
  }
};
