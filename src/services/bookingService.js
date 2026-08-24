/**
 * bookingService.js
 *
 * Handles creation, cancellation, and retrieval of bookings.
 * Implements a hybrid architecture:
 *   - Uses Supabase client if VITE_SUPABASE_URL and key are valid.
 *   - Automatically falls back to LocalStorage when Supabase is offline/unconfigured.
 *
 * Updates available slots count on target facility upon booking/cancellation.
 */

import { supabase, SUPABASE_AVAILABLE } from './supabase';
import { notificationService } from './notificationService';

const LOCAL_BOOKINGS_KEY = 'ezpark_local_bookings';
const LOCAL_SLOTS_STATUS_KEY = 'ezpark_local_slots_status';
const LOCAL_FACILITIES_DELTA_KEY = 'ezpark_local_facilities_delta';

// ─── LocalStorage Helpers ─────────────────────────────────────────────────────

function getLocalBookings() {
  const data = localStorage.getItem(LOCAL_BOOKINGS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalBookings(bookings) {
  localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(bookings));
}

function getLocalSlotsStatus() {
  const data = localStorage.getItem(LOCAL_SLOTS_STATUS_KEY);
  return data ? JSON.parse(data) : {};
}

function saveLocalSlotStatus(slotId, status) {
  const current = getLocalSlotsStatus();
  current[slotId] = status;
  localStorage.setItem(LOCAL_SLOTS_STATUS_KEY, JSON.stringify(current));
}

function adjustLocalFacilityAvailableSlots(facilityId, change) {
  const data = localStorage.getItem(LOCAL_FACILITIES_DELTA_KEY);
  const deltas = data ? JSON.parse(data) : {};
  deltas[facilityId] = (deltas[facilityId] || 0) + change;
  localStorage.setItem(LOCAL_FACILITIES_DELTA_KEY, JSON.stringify(deltas));
}

// ─── Booking Service Implementation ───────────────────────────────────────────

export const bookingService = {
  /**
   * Create a new booking.
   *
   * @param {object} bookingData
   * @returns {Promise<object>} Created booking object
   */
  async createBooking(bookingData) {
    const {
      slot_id,
      user_id,
      facility_id,
      vehicle_type,
      booking_date,
      entry_time,
      exit_time,
      total_amount,
    } = bookingData;

    // ── Supabase Mode ─────────────────────────────────────────────────────────
    if (SUPABASE_AVAILABLE && supabase) {
      // 1. Confirm slot is available
      const { data: slot, error: slotErr } = await supabase
        .from('parking_slots')
        .select('status')
        .eq('id', slot_id)
        .single();

      if (slotErr) throw slotErr;
      if (slot.status !== 'available') {
        throw new Error('The selected parking slot is no longer available.');
      }

      // 2. Set slot to reserved
      const { error: slotUpdateErr } = await supabase
        .from('parking_slots')
        .update({ status: 'reserved' })
        .eq('id', slot_id);

      if (slotUpdateErr) throw slotUpdateErr;

      // 3. Decrement available slots on the facility
      const { data: facility, error: facErr } = await supabase
        .from('parking_facilities')
        .select('available_slots')
        .eq('id', facility_id)
        .single();

      if (!facErr && facility) {
        await supabase
          .from('parking_facilities')
          .update({ available_slots: Math.max(0, facility.available_slots - 1) })
          .eq('id', facility_id);
      }

      // 4. Insert booking row
      const { data: booking, error: bookingErr } = await supabase
        .from('bookings')
        .insert([{
          user_id,
          facility_id,
          slot_id,
          vehicle_type,
          booking_date,
          entry_time,
          exit_time,
          total_amount,
          status: 'Confirmed',
        }])
        .select()
        .single();

      if (bookingErr) {
        // Rollback slot and facility
        await supabase
          .from('parking_slots')
          .update({ status: 'available' })
          .eq('id', slot_id);
        if (!facErr && facility) {
          await supabase
            .from('parking_facilities')
            .update({ available_slots: facility.available_slots })
            .eq('id', facility_id);
        }
        throw bookingErr;
      }

      // 5. Insert paid payment record
      const { error: payErr } = await supabase
        .from('payments')
        .insert([{
          booking_id: booking.id,
          amount: total_amount,
          status: 'Paid',
        }]);

      if (payErr) console.error('Payment sync alert:', payErr);

      await notificationService.addNotification(user_id, 'Booking confirmed! Slot reserved successfully.', 'success');
      return booking;
    }

    // ── LocalStorage Fallback Mode ───────────────────────────────────────────
    const mockId = `bk-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const newBooking = {
      id: mockId,
      user_id: user_id || 'demo-user',
      facility_id,
      slot_id,
      vehicle_type,
      booking_date,
      entry_time,
      exit_time,
      total_amount: parseFloat(total_amount),
      status: 'Confirmed',
      created_at: new Date().toISOString(),
    };

    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Save slot reservation locally
    saveLocalSlotStatus(slot_id, 'reserved');

    // Decrement available slots locally
    adjustLocalFacilityAvailableSlots(facility_id, -1);

    // Save booking locally
    const bookings = getLocalBookings();
    bookings.unshift(newBooking);
    saveLocalBookings(bookings);

    await notificationService.addNotification(user_id || 'demo-user', 'Booking confirmed! Slot reserved successfully.', 'success');
    return newBooking;
  },

  /**
   * Cancel an active booking and release the slot.
   *
   * @param {string} bookingId
   * @param {string} slotId
   * @param {string} facilityId
   */
  async cancelBooking(bookingId, slotId, facilityId) {
    // ── Supabase Mode ─────────────────────────────────────────────────────────
    if (SUPABASE_AVAILABLE && supabase) {
      const { data: booking, error: cancelErr } = await supabase
        .from('bookings')
        .update({ status: 'Cancelled' })
        .eq('id', bookingId)
        .select()
        .single();

      if (cancelErr) throw cancelErr;

      // Release slot
      if (slotId) {
        await supabase
          .from('parking_slots')
          .update({ status: 'available' })
          .eq('id', slotId);
      }

      // Increment available slots on the facility
      const targetFacId = facilityId || booking?.facility_id;
      if (targetFacId) {
        const { data: facility } = await supabase
          .from('parking_facilities')
          .select('available_slots, total_slots')
          .eq('id', targetFacId)
          .single();

        if (facility) {
          const limit = facility.total_slots ?? 100;
          await supabase
            .from('parking_facilities')
            .update({ available_slots: Math.min(limit, (facility.available_slots || 0) + 1) })
            .eq('id', targetFacId);
        }
      }

      await supabase
        .from('payments')
        .update({ status: 'Refunded' })
        .eq('booking_id', bookingId);

      await notificationService.addNotification(booking?.user_id || 'demo-user', 'Booking has been cancelled and refunded.', 'warning');
      return booking;
    }

    // ── LocalStorage Fallback Mode ───────────────────────────────────────────
    await new Promise((resolve) => setTimeout(resolve, 600));

    const bookings = getLocalBookings();
    const idx = bookings.findIndex((b) => b.id === bookingId);
    if (idx === -1) throw new Error('Booking not found');

    const booking = bookings[idx];
    booking.status = 'Cancelled';
    saveLocalBookings(bookings);

    if (slotId) {
      saveLocalSlotStatus(slotId, 'available');
    }

    const targetFacId = facilityId || booking.facility_id;
    if (targetFacId) {
      adjustLocalFacilityAvailableSlots(targetFacId, 1);
    }

    await notificationService.addNotification(booking.user_id || 'demo-user', 'Booking has been cancelled and refunded.', 'warning');
    return booking;
  },

  /**
   * Fetch all bookings for a user.
   *
   * @param {string} [userId='demo-user']
   * @returns {Promise<object[]>}
   */
  async getBookings(userId = 'demo-user') {
    // ── Supabase Mode ─────────────────────────────────────────────────────────
    if (SUPABASE_AVAILABLE && supabase) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, parking_facilities(name, address)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }

    // ── LocalStorage Fallback Mode ───────────────────────────────────────────
    await new Promise((resolve) => setTimeout(resolve, 300));
    return getLocalBookings().filter((b) => b.user_id === userId);
  },

  // Aliases for compatibility
  async fetchUserBookings(userId) {
    return this.getBookings(userId);
  },

  // Retrieve local slot state overrides
  getLocalSlotStatusOverride(slotId) {
    return getLocalSlotsStatus()[slotId] || null;
  },

  // Retrieve local facility slots with deltas applied
  getLocalFacilityAvailableSlots(facilityId, baseCount) {
    const data = localStorage.getItem(LOCAL_FACILITIES_DELTA_KEY);
    const deltas = data ? JSON.parse(data) : {};
    const delta = deltas[facilityId] || 0;
    return Math.max(0, baseCount + delta);
  }
};
