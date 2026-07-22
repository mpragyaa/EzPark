import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarRange, 
  MapPin, 
  Star, 
  CreditCard, 
  Bell, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ 
  isCollapsed, 
  onToggleCollapse, 
  activeTab, 
  onTabChange 
}) {
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'My Bookings', icon: CalendarRange },
    { id: 'nearby', label: 'Nearby Facilities', icon: MapPin },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogoutClick = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      alert('Logging out of EZPARK...');
      navigate('/');
    }
  };

  return (
    <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand logo header */}
      <div className="sidebar-logo-area">
        {!isCollapsed && <span className="sidebar-logo-text">EZPARK</span>}
        <button 
          type="button" 
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav List */}
      <ul className="sidebar-nav-list">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => onTabChange(item.id)}
              >
                <IconComponent size={20} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer Logout */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-nav-link"
          style={{ width: '100%', color: 'var(--color-error)' }}
          onClick={handleLogoutClick}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
