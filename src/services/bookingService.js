import { supabase } from './supabase';

export const bookingService = {
  // Create a new slot booking with status checks and mock-transaction logic
  async createBooking(bookingData) {
    const { slot_id, user_id, facility_id, vehicle_type, booking_date, entry_time, exit_time, total_amount } = bookingData;

    // 1. Confirm slot is still available
    const { data: slot, error: slotErr } = await supabase
      .from('parking_slots')
      .select('status')
      .eq('id', slot_id)
      .single();

    if (slotErr) throw slotErr;
    if (slot.status !== 'available') {
      throw new Error('The selected parking slot is no longer available.');
    }

    // 2. Set slot status to 'reserved'
    const { error: slotUpdateErr } = await supabase
      .from('parking_slots')
      .update({ status: 'reserved' })
      .eq('id', slot_id);

    if (slotUpdateErr) throw slotUpdateErr;

    // 3. Create the booking entry
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
        status: 'Confirmed'
      }])
      .select()
      .single();

    if (bookingErr) {
      // Rollback slot reservation if booking record fails
      await supabase
        .from('parking_slots')
        .update({ status: 'available' })
        .eq('id', slot_id);
      throw bookingErr;
    }

    // 4. Create a mock payment ledger item
    const { error: payErr } = await supabase
      .from('payments')
      .insert([{
        booking_id: booking.id,
        amount: total_amount,
        status: 'Paid'
      }]);

    if (payErr) console.error('Payment record sync warning:', payErr);

    return booking;
  },

  // Cancel an active booking and release the locked slot back to 'available'
  async cancelBooking(bookingId, slotId) {
    // 1. Cancel the booking record status
    const { data: booking, error: cancelErr } = await supabase
      .from('bookings')
      .update({ status: 'Cancelled' })
      .eq('id', bookingId)
      .select()
      .single();

    if (cancelErr) throw cancelErr;

    // 2. Unlock the corresponding slot
    if (slotId) {
      const { error: slotReleaseErr } = await supabase
        .from('parking_slots')
        .update({ status: 'available' })
        .eq('id', slotId);

      if (slotReleaseErr) throw slotReleaseErr;
    }

    // 3. Update payment status to Refunded
    const { error: payUpdateErr } = await supabase
      .from('payments')
      .update({ status: 'Refunded' })
      .eq('booking_id', bookingId);

    if (payUpdateErr) console.error('Payment refund sync warning:', payUpdateErr);

    return booking;
  },

  // Fetch bookings made by a specific user
  async fetchUserBookings(userId) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, parking_facilities(name, address)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Operator: Fetch all platform bookings
  async fetchAllBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, users(first_name, last_name), parking_facilities(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
