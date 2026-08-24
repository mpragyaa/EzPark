import { supabase, SUPABASE_AVAILABLE } from './supabase';

export const realtimeService = {
  subscribeToSlots(facilityId, onUpdate, onStatusChange) {
    if (!SUPABASE_AVAILABLE || !supabase) {
      if (onStatusChange) onStatusChange('CLOSED', new Error('Supabase not configured'));
      return null;
    }
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

  subscribeToBookings(userId, onUpdate, onStatusChange) {
    if (!SUPABASE_AVAILABLE || !supabase) {
      if (onStatusChange) onStatusChange('CLOSED', new Error('Supabase not configured'));
      return null;
    }
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

  subscribeToNotifications(userId, onUpdate, onStatusChange) {
    if (!SUPABASE_AVAILABLE || !supabase) {
      if (onStatusChange) onStatusChange('CLOSED', new Error('Supabase not configured'));
      return null;
    }
    const channel = supabase
      .channel(`live-notifs-${userId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        onUpdate
      );

    channel.subscribe((status, err) => {
      if (onStatusChange) onStatusChange(status, err);
    });

    return channel;
  },

  // Gracefully unsubscribe from any active channel
  unsubscribe(channel) {
    if (channel && SUPABASE_AVAILABLE && supabase) {
      supabase.removeChannel(channel);
    }
  }
};
