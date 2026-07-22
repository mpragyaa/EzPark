import React from 'react';
import { Search, Bell, Calendar } from 'lucide-react';
import { RealtimeIndicator } from '../../contexts/RealtimeContext';

export default function Topbar({ adminName = 'Operator Console', unreadAlerts = 5 }) {
  // Get formatted current date
  const getFormattedDate = () => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <header className="admin-topbar">
      
      {/* Date Indicator Left */}
      <div className="admin-topbar-info">
        <h2 className="admin-topbar-title">{adminName}</h2>
        <span className="admin-topbar-date" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Calendar size={12} />
          {getFormattedDate()}
        </span>
      </div>

      {/* Actions Right */}
      <div className="admin-topbar-actions">
        
        {/* Real-time health indicator */}
        <RealtimeIndicator />

        {/* Search */}
        <div className="topbar-search-box">
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search logs, facilities, users..."
          />
          <Search size={14} className="topbar-search-icon" />
        </div>

        {/* Alerts Bell */}
        <button 
          type="button" 
          className="topbar-notification-btn"
          onClick={() => alert('View Operator Notification Center')}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadAlerts > 0 && <span className="notification-badge-dot" />}
        </button>

        {/* Profile Avatar indicator */}
        <div className="topbar-avatar" style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-primary) 100%)' }}>
          OP
        </div>

      </div>

    </header>
  );
}
