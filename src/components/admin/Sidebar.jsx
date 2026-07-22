import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Grid3X3, 
  CalendarClock, 
  Users, 
  DollarSign, 
  LineChart, 
  Bell, 
  Settings, 
  LogOut,
  ShieldAlert,
  HeartPulse
} from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange }) {
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
    { id: 'parking-lots', label: 'Parking Facilities', icon: Building2 },
    { id: 'parking-slots', label: 'Parking Slots', icon: Grid3X3 },
    { id: 'bookings', label: 'Bookings', icon: CalendarClock },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'activity-logs', label: 'Activity Logs', icon: ShieldAlert },
    { id: 'system-health', label: 'System Health', icon: HeartPulse },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of Operator Portal?')) {
      alert('Logging out...');
      navigate('/');
    }
  };

  return (
    <aside className="admin-sidebar">
      
      {/* Brand logo area */}
      <div className="admin-sidebar-header">
        <span className="sidebar-logo-text" style={{ fontSize: '1.15rem' }}>EZPARK</span>
        <span className="admin-logo-badge">Operator</span>
      </div>

      {/* Admin navigation items */}
      <ul className="admin-nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`admin-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => onTabChange(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer logout */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <button
          type="button"
          className="admin-nav-link"
          style={{ width: '100%', color: 'var(--color-error)' }}
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
}
