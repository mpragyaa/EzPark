import { supabase, SUPABASE_AVAILABLE } from './supabase';

const OFFLINE_PROFILE_KEY = 'ezpark_offline_profile';
const OFFLINE_VEHICLES_KEY = 'ezpark_offline_vehicles';

export const profileService = {
  getProfile: async (userId) => {
    try {
      if (!SUPABASE_AVAILABLE) throw new Error('Supabase unavailable');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, maybe trigger hasn't fired or user is old
          return { id: userId, full_name: '', phone: '', avatar_url: '', default_vehicle_id: null };
        }
        throw error;
      }
      
      // Cache for offline
      if (data) {
        localStorage.setItem(OFFLINE_PROFILE_KEY, JSON.stringify(data));
      }
      return data;
    } catch (err) {
      console.warn('[profileService] using offline profile due to:', err.message);
      const cached = localStorage.getItem(OFFLINE_PROFILE_KEY);
      return cached ? JSON.parse(cached) : { id: userId, full_name: '', phone: '', avatar_url: '', default_vehicle_id: null };
    }
  },

  updateProfile: async (userId, updates) => {
    try {
      if (!SUPABASE_AVAILABLE) throw new Error('Supabase unavailable');
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();
      
      if (error) throw error;
      
      localStorage.setItem(OFFLINE_PROFILE_KEY, JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('[profileService] using offline update due to:', err.message);
      const cached = JSON.parse(localStorage.getItem(OFFLINE_PROFILE_KEY) || '{}');
      const updated = { ...cached, id: userId, ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(OFFLINE_PROFILE_KEY, JSON.stringify(updated));
      return updated;
    }
  },

  getVehicles: async (userId) => {
    try {
      if (!SUPABASE_AVAILABLE) throw new Error('Supabase unavailable');
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      localStorage.setItem(OFFLINE_VEHICLES_KEY, JSON.stringify(data));
      return data || [];
    } catch (err) {
      console.warn('[profileService] using offline vehicles due to:', err.message);
      const cached = localStorage.getItem(OFFLINE_VEHICLES_KEY);
      return cached ? JSON.parse(cached) : [];
    }
  },

  addVehicle: async (userId, vehicle) => {
    try {
      if (!SUPABASE_AVAILABLE) throw new Error('Supabase unavailable');
      const { data, error } = await supabase
        .from('vehicles')
        .insert([{ user_id: userId, ...vehicle }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[profileService] using offline add vehicle due to:', err.message);
      if (err.code === '23505') throw new Error('Duplicate registration number'); // Postgres unique violation

      // Offline simulation
      const newVehicle = { id: `local-${Date.now()}`, user_id: userId, ...vehicle, created_at: new Date().toISOString() };
      const cached = JSON.parse(localStorage.getItem(OFFLINE_VEHICLES_KEY) || '[]');
      
      if (cached.some(v => v.registration_number === vehicle.registration_number)) {
        throw new Error('Duplicate registration number');
      }

      cached.unshift(newVehicle);
      localStorage.setItem(OFFLINE_VEHICLES_KEY, JSON.stringify(cached));
      return newVehicle;
    }
  },

  updateVehicle: async (vehicleId, updates) => {
    try {
      if (!SUPABASE_AVAILABLE) throw new Error('Supabase unavailable');
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', vehicleId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[profileService] using offline update vehicle due to:', err.message);
      if (err.code === '23505') throw new Error('Duplicate registration number');
      
      const cached = JSON.parse(localStorage.getItem(OFFLINE_VEHICLES_KEY) || '[]');
      const index = cached.findIndex(v => v.id === vehicleId);
      if (index !== -1) {
        if (updates.registration_number && cached.some(v => v.id !== vehicleId && v.registration_number === updates.registration_number)) {
          throw new Error('Duplicate registration number');
        }
        cached[index] = { ...cached[index], ...updates };
        localStorage.setItem(OFFLINE_VEHICLES_KEY, JSON.stringify(cached));
        return cached[index];
      }
      throw new Error('Vehicle not found offline');
    }
  },

  deleteVehicle: async (vehicleId) => {
    try {
      if (!SUPABASE_AVAILABLE) throw new Error('Supabase unavailable');
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[profileService] using offline delete vehicle due to:', err.message);
      let cached = JSON.parse(localStorage.getItem(OFFLINE_VEHICLES_KEY) || '[]');
      cached = cached.filter(v => v.id !== vehicleId);
      localStorage.setItem(OFFLINE_VEHICLES_KEY, JSON.stringify(cached));
      return true;
    }
  },

  setDefaultVehicle: async (userId, vehicleId) => {
    try {
      if (!SUPABASE_AVAILABLE) throw new Error('Supabase unavailable');
      
      // Update the profile default_vehicle_id
      await profileService.updateProfile(userId, { default_vehicle_id: vehicleId });
      
      // Reset is_default on all vehicles
      await supabase
        .from('vehicles')
        .update({ is_default: false })
        .eq('user_id', userId);
        
      // Set the specific vehicle to is_default = true
      const { data, error } = await supabase
        .from('vehicles')
        .update({ is_default: true })
        .eq('id', vehicleId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[profileService] using offline set default due to:', err.message);
      let cachedVehicles = JSON.parse(localStorage.getItem(OFFLINE_VEHICLES_KEY) || '[]');
      cachedVehicles = cachedVehicles.map(v => ({ ...v, is_default: v.id === vehicleId }));
      localStorage.setItem(OFFLINE_VEHICLES_KEY, JSON.stringify(cachedVehicles));
      
      await profileService.updateProfile(userId, { default_vehicle_id: vehicleId });
      return cachedVehicles.find(v => v.id === vehicleId);
    }
  }
};
