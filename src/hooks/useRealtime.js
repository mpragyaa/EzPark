import { useState, useEffect } from 'react';
import { realtimeService } from '../services/realtimeService';
import { useRealtimeStatus } from '../contexts/RealtimeContext';

/**
 * Custom React hook managing real-time slots subscriptions.
 * @param {string} facilityId - Parking facility ID to listen to
 * @param {Array} initialSlots - Initial loaded slots layout
 */
export default function useRealtimeSlots(facilityId, initialSlots = []) {
  const [slots, setSlots] = useState(initialSlots);
  const statusContext = useRealtimeStatus();

  // Sync initial slots
  useEffect(() => {
    setSlots(initialSlots);
  }, [initialSlots]);

  useEffect(() => {
    if (!facilityId) return;

    const onUpdate = (payload) => {
      const { eventType, new: newRow, old: oldRow } = payload;
      
      setSlots(prevSlots => {
        if (eventType === 'INSERT') {
          return [...prevSlots, newRow];
        }
        if (eventType === 'UPDATE') {
          // Performance Optimization: Only update the changed slot element
          return prevSlots.map(s => s.id === newRow.id ? { ...s, ...newRow } : s);
        }
        if (eventType === 'DELETE') {
          return prevSlots.filter(s => s.id !== oldRow.id);
        }
        return prevSlots;
      });

      // Spawn alert notifications on slot status transformations
      if (eventType === 'UPDATE' && newRow.status !== oldRow.status) {
        if (newRow.status === 'available') {
          console.log(`Notification trigger: Slot ${newRow.slot_number} has been released!`);
        }
      }
    };

    // Subscribe to Supabase channel broadcasts
    const channel = realtimeService.subscribeToSlots(
      facilityId,
      onUpdate,
      statusContext ? statusContext.handleStatusChange : undefined
    );

    return () => {
      realtimeService.unsubscribe(channel);
    };
  }, [facilityId, statusContext]);

  return slots;
}
