import React, { useEffect, useState } from 'react';
import { Search, Clock, Trash2, Navigation2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { searchHistoryService } from '../../services/searchHistoryService';
import { useBooking } from '../../contexts/BookingContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

export default function RecentSearches() {
  const { user } = useAuth();
  const { setSelectedLocation } = useBooking();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSearches = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await searchHistoryService.getRecentSearches(user.id);
      setSearches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSearches();
  }, [user]);

  const handleOpenSearch = (search) => {
    setSelectedLocation({ lat: search.latitude, lng: search.longitude, label: search.location_name });
    navigate('/');
  };

  const handleDelete = async (searchId, e) => {
    e.stopPropagation();
    try {
      await searchHistoryService.deleteSearch(user.id, searchId);
      setSearches(prev => prev.filter(s => s.id !== searchId));
    } catch (err) {
      showToast('Failed to delete search', 'error');
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your search history?')) return;
    try {
      await searchHistoryService.clearHistory(user.id);
      setSearches([]);
      showToast('Search history cleared', 'success');
    } catch (err) {
      showToast('Failed to clear history', 'error');
    }
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading recent searches...</div>;
  }

  if (searches.length === 0) {
    return (
      <div className="dashboard-section-panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <Search size={32} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Your recent searches will appear here.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-section-panel" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Search History</h4>
        <button 
          onClick={handleClearHistory}
          style={{ 
            background: 'none', border: 'none', color: 'var(--text-muted)', 
            fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' 
          }}
        >
          Clear All
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {searches.map(search => (
          <div 
            key={search.id}
            onClick={() => handleOpenSearch(search)}
            style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', 
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
              cursor: 'pointer', transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Clock size={16} color="var(--text-muted)" />
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{search.location_name}</p>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatTime(search.searched_at)}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Navigation2 size={16} color="var(--color-primary)" />
              <button 
                onClick={(e) => handleDelete(search.id, e)}
                style={{ 
                  background: 'none', border: 'none', color: 'var(--text-muted)', 
                  cursor: 'pointer', padding: '0.2rem' 
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-error)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
