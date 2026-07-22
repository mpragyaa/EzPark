import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Check, Trash2, Filter, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { notificationService } from '../../services/notificationService';
import { supabase } from '../../services/supabase';

// Default mock notification feed if database is empty on start
const DUMMY_NOTIFICATIONS = (userId) => [
  {
    id: 'n-1',
    user_id: userId,
    message: 'Your booking at Aether Premium Plaza is Confirmed! (Spot A3)',
    type: 'booking_confirmed',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 mins ago
  },
  {
    id: 'n-2',
    user_id: userId,
    message: 'Payment Successful: $22.50 charged for Spot A3.',
    type: 'payment_successful',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString() // 12 mins ago
  },
  {
    id: 'n-3',
    user_id: userId,
    message: 'Warning: Vortex Cyberport Garage is 94% full.',
    type: 'parking_almost_full',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
  },
  {
    id: 'n-4',
    user_id: userId,
    message: 'Reservation Expiring Soon: Your booking at Vortex expires in 15 mins.',
    type: 'reservation_expiring_soon',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hr ago
  },
  {
    id: 'n-5',
    user_id: userId,
    message: 'AI recommendations updated based on your budget limit.',
    type: 'recommendation_updated',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hrs ago
  }
];

export default function NotificationCenter() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('all'); // all, unread, system, bookings
  const [loading, setLoading] = useState(true);

  // Sync notifications from database or default mock entries
  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await notificationService.fetchNotifications(user.id);
      
      if (data.length === 0) {
        // Hydrate with defaults if database table is empty for mock representation
        const defaults = DUMMY_NOTIFICATIONS(user.id);
        setNotifications(defaults);
        // Sync defaults to Supabase silently
        defaults.forEach(async (n) => {
          try {
            await notificationService.createNotification(n.user_id, n.message, n.type);
          } catch(e){}
        });
      } else {
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setNotifications(DUMMY_NOTIFICATIONS(user?.id || 'sys'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      // Optimistic state update
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      await notificationService.markAsRead(id);
      showToast('Notification marked as read.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      await Promise.all(unread.map(n => notificationService.markAsRead(n.id)));
      showToast('All notifications marked as read.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Delete from DB (simulate or delete row)
      await supabase.from('notifications').delete().eq('id', id);
      showToast('Notification cleared.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  // Filter conditions
  const getFilteredNotifications = () => {
    return notifications.filter(n => {
      if (filterType === 'unread') return !n.is_read;
      if (filterType === 'bookings') return n.type?.startsWith('booking_') || n.type?.startsWith('reservation_');
      if (filterType === 'system') return n.type === 'parking_almost_full' || n.type === 'recommendation_updated';
      return true;
    });
  };

  const getUnreadCount = () => notifications.filter(n => !n.is_read).length;

  return (
    <div className="dashboard-section-panel">
      
      {/* Header and Read All actions */}
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', textAlign: 'left' }}>
          <Bell size={20} style={{ color: 'var(--color-primary)' }} />
          <h3 className="panel-title" style={{ margin: 0 }}>Notification Center</h3>
          {getUnreadCount() > 0 && (
            <span style={{
              backgroundColor: 'var(--color-error)',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '0.15rem 0.45rem',
              borderRadius: '10px'
            }}>
              {getUnreadCount()} unread
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            type="button" 
            className="btn-table-action"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
            onClick={handleMarkAllAsRead}
            disabled={getUnreadCount() === 0}
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        paddingBottom: '0.85rem',
        flexWrap: 'wrap'
      }}>
        {['all', 'unread', 'bookings', 'system'].map((type) => (
          <button
            key={type}
            type="button"
            className={`btn-table-action ${filterType === type ? 'active' : ''}`}
            onClick={() => setFilterType(type)}
            style={{
              textTransform: 'capitalize',
              fontSize: '0.775rem',
              padding: '0.35rem 0.75rem',
              backgroundColor: filterType === type ? 'var(--color-primary-glow)' : 'transparent',
              borderColor: filterType === type ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="bookings-list-flow" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading notification feed...</div>
        ) : (
          <AnimatePresence mode="popLayout">
            {getFilteredNotifications().length > 0 ? (
              getFilteredNotifications().map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                  className="booking-card-item"
                  style={{
                    borderLeft: `3px solid ${notif.is_read ? 'rgba(255,255,255,0.05)' : 'var(--color-primary)'}`,
                    opacity: notif.is_read ? 0.65 : 1,
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flexGrow: 1 }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: notif.is_read ? 500 : 700 }}>
                      {notif.message}
                    </span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="table-actions-row">
                    {!notif.is_read && (
                      <button
                        type="button"
                        className="btn-table-action"
                        title="Mark as Read"
                        onClick={() => handleMarkAsRead(notif.id)}
                        style={{ padding: '0.35rem' }}
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-table-action delete"
                      title="Clear Notification"
                      onClick={() => handleDeleteNotification(notif.id)}
                      style={{ padding: '0.35rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div style={{ padding: '3rem 2rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                <BellOff size={32} style={{ opacity: 0.15, marginBottom: '0.75rem' }} />
                <p style={{ margin: 0, fontSize: '0.875rem' }}>No alerts match your filter criteria.</p>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

    </div>
  );
}
