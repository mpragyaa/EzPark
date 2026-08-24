import { supabase, SUPABASE_AVAILABLE } from './supabase';

const LOCAL_SEARCH_HISTORY_KEY = 'ezpark_recent_searches';

export const searchHistoryService = {
  getRecentSearches: async (userId) => {
    try {
      if (!SUPABASE_AVAILABLE) throw new Error('Supabase unavailable');
      const { data, error } = await supabase
        .from('recent_searches')
        .select('*')
        .eq('user_id', userId)
        .order('searched_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      localStorage.setItem(LOCAL_SEARCH_HISTORY_KEY, JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('[searchHistoryService] offline fallback getRecentSearches:', err.message);
      const cached = JSON.parse(localStorage.getItem(LOCAL_SEARCH_HISTORY_KEY) || '[]');
      return cached.filter(item => item.user_id === userId).slice(0, 5);
    }
  },

  saveSearch: async (userId, location_name, latitude, longitude) => {
    try {
      if (!SUPABASE_AVAILABLE) throw new Error('Supabase unavailable');
      const { data, error } = await supabase
        .from('recent_searches')
        .insert([{ user_id: userId, location_name, latitude, longitude }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[searchHistoryService] offline fallback saveSearch:', err.message);
      let cached = JSON.parse(localStorage.getItem(LOCAL_SEARCH_HISTORY_KEY) || '[]');
      const newSearch = { 
        id: `local-${Date.now()}`, 
        user_id: userId, 
        location_name, 
        latitude, 
        longitude, 
        searched_at: new Date().toISOString() 
      };
      // Keep unique locations only, removing older duplicates
      cached = cached.filter(s => s.location_name !== location_name);
      cached.unshift(newSearch);
      cached = cached.slice(0, 5); // Keep only 5
      localStorage.setItem(LOCAL_SEARCH_HISTORY_KEY, JSON.stringify(cached));
      return newSearch;
    }
  },

  deleteSearch: async (userId, searchId) => {
    try {
      if (!SUPABASE_AVAILABLE) throw new Error('Supabase unavailable');
      const { error } = await supabase
        .from('recent_searches')
        .delete()
        .eq('id', searchId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[searchHistoryService] offline fallback deleteSearch:', err.message);
      let cached = JSON.parse(localStorage.getItem(LOCAL_SEARCH_HISTORY_KEY) || '[]');
      cached = cached.filter(item => item.id !== searchId);
      localStorage.setItem(LOCAL_SEARCH_HISTORY_KEY, JSON.stringify(cached));
      return true;
    }
  },

  clearHistory: async (userId) => {
    try {
      if (!SUPABASE_AVAILABLE) throw new Error('Supabase unavailable');
      const { error } = await supabase
        .from('recent_searches')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[searchHistoryService] offline fallback clearHistory:', err.message);
      let cached = JSON.parse(localStorage.getItem(LOCAL_SEARCH_HISTORY_KEY) || '[]');
      cached = cached.filter(item => item.user_id !== userId);
      localStorage.setItem(LOCAL_SEARCH_HISTORY_KEY, JSON.stringify(cached));
      return true;
    }
  }
};
