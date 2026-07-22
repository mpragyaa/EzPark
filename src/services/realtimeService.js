import { supabase } from './supabase';

export const realtimeService = {
  /**
   * Subscribes to Postgres alterations on parking_slots table.
   * @param {string} facilityId - ID of parking facility
   * @param {Function} onUpdate - callback triggered on insert/update/delete events
   * @param {Function} onStatusChange - callback triggered on socket state changes
   */
  subscribeToSlots(facilityId, onUpdate, onStatusChange) {
    const channel = supabase
      .channel(`live-slots-${facilityId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'parking_slots', 
          filter: `facility_id=eq.${facilityId}` 
        },
        (payload) => {
          console.log('Realtime slot update received:', payload);
          onUpdate(payload);
        }
      );

    channel.subscribe((status, err) => {
      if (onStatusChange) {
        onStatusChange(status, err);
      }
    });

    return channel;
  },

  /**
   * Subscribes to active booking logs.
   * @param {string} userId - Optional user ID to filter bookings
   * @param {Function} onUpdate - callback on booking shifts
   * @param {Function} onStatusChange - connection status callback
   */
  subscribeToBookings(userId, onUpdate, onStatusChange) {
    const filterStr = userId ? `user_id=eq.${userId}` : undefined;
    
    const channel = supabase
      .channel(`live-bookings-${userId || 'all'}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings',
          filter: filterStr
        },
        (payload) => {
          console.log('Realtime booking update received:', payload);
          onUpdate(payload);
        }
      );

    channel.subscribe((status, err) => {
      if (onStatusChange) {
        onStatusChange(status, err);
      }
    });

    return channel;
  },

  // Gracefully unsubscribe from any active channel
  unsubscribe(channel) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
};
