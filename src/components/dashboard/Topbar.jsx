import React from 'react';
import { Search, Bell, MapPin } from 'lucide-react';
import { RealtimeIndicator } from '../../contexts/RealtimeContext';

export default function Topbar({ userName = 'Alex Smith', currentCity = 'San Francisco, CA', unreadCount = 3 }) {
  return (
    <header className="dashboard-topbar">
      
      {/* Welcome Left section */}
      <div className="topbar-welcome-section">
        <h2 className="topbar-welcome">
          Welcome back, <span>{userName}</span>
        </h2>
        <div className="topbar-location">
          <MapPin size={12} />
          <span>{currentCity}</span>
        </div>
      </div>

      {/* Actions Right section */}
      <div className="topbar-actions">
        
        {/* Real-time Health Socket status */}
        <RealtimeIndicator />

        {/* Search */}
        <div className="topbar-search-box">
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search booking, slot or receipt..."
          />
          <Search size={14} className="topbar-search-icon" />
        </div>

        {/* Notifications Icon button */}
        <button 
          type="button" 
          className="topbar-notification-btn"
          onClick={() => alert('View Notification Panel')}
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className="notification-badge-dot" />}
        </button>

        {/* Profile Avatar */}
        <div className="topbar-avatar" title="View Profile">
          {userName.split(' ').map(n => n[0]).join('')}
        </div>

      </div>

    </header>
  );
}
