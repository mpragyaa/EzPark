import React from 'react';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

const MOCK_NOTIFICATIONS = [
  {
    id: 'n-1',
    text: 'Booking confirmed at Aether Plaza (Spot A3)',
    time: '5 mins ago',
    type: 'success'
  },
  {
    id: 'n-2',
    text: 'Vortex Cyberport: Facility is almost full (3 slots left)',
    time: '25 mins ago',
    type: 'warning'
  },
  {
    id: 'n-3',
    text: 'Reservation for spot B12 expires in 15 minutes',
    time: '1 hour ago',
    type: 'danger'
  }
];

export default function Notifications() {
  return (
    <div className="dashboard-section-panel">
      <h3 className="panel-title">Recent Alerts</h3>
      <div className="notifications-widget-list">
        {MOCK_NOTIFICATIONS.map((notif) => {
          let typeClass = '';
          let Icon = Clock;
          
          if (notif.type === 'success') {
            typeClass = 'alert-success';
            Icon = CheckCircle2;
          } else if (notif.type === 'warning' || notif.type === 'danger') {
            typeClass = 'alert-danger';
            Icon = AlertTriangle;
          }

          return (
            <div key={notif.id} className={`notification-alert-item ${typeClass}`}>
              <Icon size={16} style={{ marginTop: '0.15rem' }} />
              <div className="notification-alert-details">
                <span className="notification-alert-text">{notif.text}</span>
                <span className="notification-alert-time">{notif.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
