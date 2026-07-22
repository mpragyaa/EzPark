import React from 'react';
import { PlusCircle, Compass, History, ChevronRight } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      label: 'Reserve Parking',
      description: 'Book a new space',
      icon: PlusCircle,
      action: () => alert('Opening Reservation Flow...')
    },
    {
      label: 'Open Map Router',
      description: 'View real-time coordinates',
      icon: Compass,
      action: () => alert('Loading Smart Map...')
    },
    {
      label: 'Booking History',
      description: 'Review receipts & bookings',
      icon: History,
      action: () => alert('Loading History Archive...')
    }
  ];

  return (
    <div className="dashboard-section-panel">
      <h3 className="panel-title">Quick Actions</h3>
      <div className="quick-actions-box">
        {actions.map((act, index) => {
          const Icon = act.icon;
          return (
            <button
              key={index}
              type="button"
              className="btn-quick-shortcut"
              onClick={act.action}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)',
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '6px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--text-primary)'
                }}>
                  <Icon size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{act.label}</span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 500 }}>{act.description}</span>
                </div>
              </div>
              <ChevronRight size={16} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
