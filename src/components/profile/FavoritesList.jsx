import React, { useEffect, useState } from 'react';
import { Star, MapPin, Navigation2, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { favoritesService } from '../../services/favoritesService';
import { parkingService } from '../../services/parkingService';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../contexts/BookingContext';
import { useToast } from '../../contexts/ToastContext';

export default function FavoritesList() {
  const { user } = useAuth();
  const { setSelectedFacility } = useBooking();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const favs = await favoritesService.getFavorites(user.id);
      
      // We need facility details for each favorite
      const allLots = await parkingService.fetchLots();
      const enrichedFavs = favs.map(f => {
        const lot = allLots.find(l => l.id === f.parking_id);
        return lot ? { ...lot, favId: f.id } : null;
      }).filter(Boolean);
      
      setFavorites(enrichedFavs);
    } catch (err) {
      console.error(err);
      showToast('Failed to load favorites', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const handleRemove = async (parkingId) => {
    try {
      await favoritesService.removeFavorite(user.id, parkingId);
      setFavorites(prev => prev.filter(f => f.id !== parkingId));
      showToast('Removed from favorites', 'success');
    } catch (err) {
      showToast('Failed to remove favorite', 'error');
    }
  };

  const handleOpenMap = (facility) => {
    setSelectedFacility(facility);
    navigate('/');
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading favorites...</div>;
  }

  if (favorites.length === 0) {
    return (
      <div className="dashboard-section-panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <Star size={32} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>You haven't added any favorite parking spots yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
      {favorites.map(fav => (
        <div key={fav.id} className="dashboard-section-panel" style={{ padding: '1.25rem', position: 'relative' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', paddingRight: '2rem' }}>{fav.name}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '0 0 1rem 0' }}>
            <MapPin size={12} /> {fav.address || fav.city || 'Unknown Location'}
          </p>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleOpenMap(fav)}
              style={{
                flex: 1, backgroundColor: 'var(--color-primary)', color: '#fff', 
                border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                fontSize: '0.8rem', fontWeight: 600
              }}
            >
              <Navigation2 size={14} /> Open Map
            </button>
            <button
              onClick={() => handleRemove(fav.id)}
              style={{
                backgroundColor: 'var(--color-error-glow)', color: 'var(--color-error)', 
                border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Remove from favorites"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
