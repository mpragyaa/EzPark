/**
 * Topbar.jsx
 *
 * User dashboard top toolbar.
 * Displays user welcome card, real-time indicator, and interactive notification alerts.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, MapPin, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { RealtimeIndicator } from '../../contexts/RealtimeContext';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { realtimeService } from '../../services/realtimeService';

export default function Topbar({ currentCity = 'New Delhi, India' }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  const userId = user?.id || 'demo-user';
  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Alex Smith' : 'Alex Smith';

  // 1. Fetch alerts & subscribe to live postgres broadcasts
  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        const list = await notificationService.getNotifications(userId);
        if (!cancelled) setNotifications(list);
      } catch (err) {
        console.error('Error fetching dashboard alerts:', err);
      }
    }

    loadAlerts();

    // Subscribe to realtime database changes for notifications
    const onRealtimeUpdate = (payload) => {
      const { eventType, new: newRow } = payload;
      setNotifications((prev) => {
        if (eventType === 'INSERT') {
          // Check if already in list
          if (prev.some((n) => n.id === newRow.id)) return prev;
          return [newRow, ...prev];
        }
        if (eventType === 'UPDATE') {
          return prev.map((n) => (n.id === newRow.id ? newRow : n));
        }
        return prev;
      });
    };

    const channel = realtimeService.subscribeToNotifications(userId, onRealtimeUpdate);

    return () => {
      cancelled = true;
      if (channel) realtimeService.unsubscribe(channel);
    };
  }, [userId]);

  // 2. Click outside dropdown handler
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadList = notifications.filter((n) => !n.is_read);
  const unreadCount = unreadList.length;

  const handleMarkAsRead = async (e, notifId) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />;
      case 'warning':
        return <AlertTriangle size={14} style={{ color: 'var(--color-warning, #f59e0b)' }} />;
      default:
        return <Info size={14} style={{ color: 'var(--color-primary)' }} />;
    }
  };

  return (
    <header className="dashboard-topbar" style={{ position: 'relative' }}>
      
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

        {/* Notifications Icon button */}
        <div ref={panelRef} style={{ position: 'relative' }}>
          <button 
            type="button" 
            className="topbar-notification-btn"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span 
                className="notification-badge-dot" 
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: 'var(--color-error)',
                  borderRadius: '50%',
                  border: '1.5px solid var(--bg-secondary)'
                }}
              />
            )}
          </button>

          {/* Interactive Notifications dropdown panel */}
          {isOpen && (
            <div className="notif-dropdown-card" style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '320px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1000,
              overflow: 'hidden',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'rgba(255,255,255,0.01)'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Click to mark read
                  </span>
                )}
              </div>

              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    No alerts at this time.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={(e) => !n.is_read && handleMarkAsRead(e, n.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                        display: 'flex',
                        gap: '0.65rem',
                        alignItems: 'flex-start',
                        backgroundColor: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.03)',
                        cursor: n.is_read ? 'default' : 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <div style={{ marginTop: '0.15rem' }}>{getAlertIcon(n.type)}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0, flex: 1 }}>
                        <p style={{
                          margin: 0,
                          fontSize: '0.78rem',
                          color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)',
                          fontWeight: n.is_read ? 400 : 600,
                          lineHeight: 1.35,
                          wordWrap: 'break-word'
                        }}>
                          {n.message}
                        </p>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="topbar-avatar" title="View Profile">
          {userName.split(' ').map((n) => n[0]).join('')}
        </div>

      </div>

    </header>
  );
}
