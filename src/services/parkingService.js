import { supabase, SUPABASE_AVAILABLE } from './supabase';
import { parkingLocations } from '../data/parkingData';

const LOCAL_FACILITIES_KEY = 'ezpark_local_facilities';

function getFallbackLots() {
  try {
    const stored = localStorage.getItem(LOCAL_FACILITIES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  const defaults = parkingLocations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    address: `${loc.name}, Central District`,
    city: 'San Francisco',
    latitude: loc.latitude,
    longitude: loc.longitude,
    total_slots: loc.totalSlots,
    available_slots: loc.availableSlots,
    price_per_hour: loc.pricePerHour,
    rating: loc.rating,
    has_ev_charging: loc.hasEVCharging,
    has_cctv: true,
    is_covered: true,
    open_time: '00:00',
    close_time: '23:59',
    is_open: loc.isOpen,
    is_active: true,
    is_verified: true,
    google_maps_url: `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`,
    created_at: '2026-01-01T00:00:00.000Z'
  }));

  try {
    localStorage.setItem(LOCAL_FACILITIES_KEY, JSON.stringify(defaults));
  } catch {}

  return defaults;
}

function saveFallbackLots(lots) {
  try {
    localStorage.setItem(LOCAL_FACILITIES_KEY, JSON.stringify(lots));
  } catch {}
}

export const parkingService = {
  async fetchLots() {
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { data, error } = await supabase
          .from('parking_facilities')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('[parkingService] Supabase fetchLots unreachable, using local fallback:', err.message);
      }
    }
    return getFallbackLots();
  },

  async fetchActiveVerifiedLots() {
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { data, error } = await supabase
          .from('parking_facilities')
          .select('*')
          .eq('is_active', true)
          .eq('is_verified', true)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('[parkingService] Supabase fetchActiveVerifiedLots unreachable, using local fallback:', err.message);
      }
    }
    const lots = getFallbackLots();
    return lots.filter(l => l.is_active && l.is_verified);
  },

  async fetchLotById(id) {
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { data, error } = await supabase
          .from('parking_facilities')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('[parkingService] Supabase fetchLotById unreachable, using local fallback:', err.message);
      }
    }
    const lots = getFallbackLots();
    const found = lots.find(l => l.id === id);
    if (!found) throw new Error('Parking facility not found');
    return found;
  },

  async fetchSlotsForLot(facilityId) {
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { data, error } = await supabase
          .from('parking_slots')
          .select('*')
          .eq('facility_id', facilityId)
          .order('slot_number', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('[parkingService] Supabase fetchSlotsForLot unreachable, generating fallback slots');
      }
    }

    // Generate responsive interactive parking slots
    return Array.from({ length: 16 }, (_, i) => ({
      id: `slot-${facilityId}-${i + 1}`,
      facility_id: facilityId,
      slot_number: `A-${String(i + 1).padStart(2, '0')}`,
      floor: 'L1',
      is_accessible: i === 0,
      type: i < 4 ? 'ev' : (i < 8 ? 'bike' : 'car'),
      status: i === 2 || i === 6 ? 'occupied' : 'available'
    }));
  },

  async createLot(facilityData) {
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { data, error } = await supabase
          .from('parking_facilities')
          .insert([facilityData])
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('[parkingService] Supabase createLot unreachable, saving locally:', err.message);
      }
    }

    const lots = getFallbackLots();
    const newLot = {
      ...facilityData,
      id: `local-fac-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    lots.unshift(newLot);
    saveFallbackLots(lots);
    return newLot;
  },

  async updateLot(id, facilityData) {
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { data, error } = await supabase
          .from('parking_facilities')
          .update(facilityData)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('[parkingService] Supabase updateLot unreachable, updating locally:', err.message);
      }
    }

    const lots = getFallbackLots();
    const idx = lots.findIndex(l => l.id === id);
    if (idx !== -1) {
      lots[idx] = { ...lots[idx], ...facilityData };
      saveFallbackLots(lots);
      return lots[idx];
    }
    throw new Error('Facility not found');
  },

  async deleteLot(id) {
    if (SUPABASE_AVAILABLE && supabase) {
      try {
        const { error } = await supabase
          .from('parking_facilities')
          .delete()
          .eq('id', id);
        if (!error) return;
      } catch (err) {
        console.warn('[parkingService] Supabase deleteLot unreachable, deleting locally:', err.message);
      }
    }

    let lots = getFallbackLots();
    lots = lots.filter(l => l.id !== id);
    saveFallbackLots(lots);
  }
};