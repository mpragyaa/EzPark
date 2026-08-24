import { supabase, SUPABASE_AVAILABLE } from './supabase';

const LOCAL_FAVORITES_KEY = 'ezpark_local_favorites';

export const favoritesService = {
  getFavorites: async (userId) => {
    try {
      if (!SUPABASE_AVAILABLE) throw new Error('Supabase unavailable');
      const { data, error } = await supabase
        .from('favorites')
        .select('id, user_id, facility_id, created_at')
        .eq('user_id', userId);
        
      if (error) throw error;
      
      const mapped = data.map(d => ({ ...d, parking_id: d.facility_id }));
      localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(mapped));
      return mapped;
    } catch (err) {
      console.warn('[favoritesService] offline fallback for getFavorites:', err.message);
      const cached = JSON.parse(localStorage.getItem(LOCAL_FAVORITES_KEY) || '[]');
      return cached.filter(item => item.user_id === userId);
    }
  },

  addFavorite: async (userId, parkingId) => {
    try {
      if (!SUPABASE_AVAILABLE) throw new Error('Supabase unavailable');
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, facility_id: parkingId }]);
        
      if (error && error.code !== '23505') throw error; // Ignore duplicate
      return true;
    } catch (err) {
      console.warn('[favoritesService] offline fallback for addFavorite:', err.message);
      let cached = JSON.parse(localStorage.getItem(LOCAL_FAVORITES_KEY) || '[]');
      if (!cached.some(item => item.user_id === userId && item.parking_id === parkingId)) {
        cached.push({ id: `local-${Date.now()}`, user_id: userId, parking_id: parkingId, facility_id: parkingId, created_at: new Date().toISOString() });
        localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(cached));
      }
      return true;
    }
  },

  removeFavorite: async (userId, parkingId) => {
    try {
      if (!SUPABASE_AVAILABLE) throw new Error('Supabase unavailable');
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('facility_id', parkingId);
        
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[favoritesService] offline fallback for removeFavorite:', err.message);
      let cached = JSON.parse(localStorage.getItem(LOCAL_FAVORITES_KEY) || '[]');
      cached = cached.filter(item => !(item.user_id === userId && item.parking_id === parkingId));
      localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(cached));
      return true;
    }
  },

  isFavorite: async (userId, parkingId) => {
    const favs = await favoritesService.getFavorites(userId);
    return favs.some(f => f.parking_id === parkingId);
  }
};
