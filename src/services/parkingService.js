import { supabase, SUPABASE_AVAILABLE } from './supabase';

export const parkingService = {
  async fetchLots() {
    if (!SUPABASE_AVAILABLE || !supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('parking_facilities')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async fetchLotById(id) {
    if (!SUPABASE_AVAILABLE || !supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('parking_facilities')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async fetchSlotsForLot(facilityId) {
    if (!SUPABASE_AVAILABLE || !supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('parking_slots')
      .select('*')
      .eq('facility_id', facilityId)
      .order('slot_number', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createLot(facilityData) {
    if (!SUPABASE_AVAILABLE || !supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('parking_facilities')
      .insert([facilityData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateLot(id, facilityData) {
    if (!SUPABASE_AVAILABLE || !supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('parking_facilities')
      .update(facilityData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteLot(id) {
    if (!SUPABASE_AVAILABLE || !supabase) throw new Error('Supabase not configured');
    const { error } = await supabase
      .from('parking_facilities')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};