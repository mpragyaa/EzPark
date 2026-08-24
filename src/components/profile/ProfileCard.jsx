import React from 'react';
import { User, Phone, Edit2, Camera } from 'lucide-react';

export default function ProfileCard({ profile, onEdit }) {
  if (!profile) return null;

  return (
    <div className="dashboard-section-panel" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '2rem' }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-secondary)',
          border: '2px solid var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Profile Avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <User size={48} color="var(--text-secondary)" />
          )}
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
          {profile.full_name || 'Set your name'}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          <Phone size={16} />
          <span>{profile.phone || 'Add phone number'}</span>
        </div>
      </div>

      <button
        onClick={onEdit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'var(--color-primary)',
          color: '#ffffff',
          padding: '0.6rem 1.2rem',
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        <Edit2 size={16} />
        Edit Profile
      </button>
    </div>
  );
}
