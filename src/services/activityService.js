// Operator audit logs service tracking platform actions
const DEFAULT_LOGS = [
  {
    id: 'log-1',
    timestamp: '2026-07-17T18:45:00Z',
    admin: 'Alex Smith (Operator)',
    action: 'Created Parking Facility',
    affectedResource: 'Aether Premium Plaza',
    oldValue: null,
    newValue: 'Capacity: 50 slots, Price: $4.50/hr',
    ip: '192.168.1.102',
    status: 'Success'
  },
  {
    id: 'log-2',
    timestamp: '2026-07-17T19:12:00Z',
    admin: 'Alex Smith (Operator)',
    action: 'Updated Pricing',
    affectedResource: 'Vortex Cyberport Garage',
    oldValue: '$5.50/hr',
    newValue: '$6.00/hr',
    ip: '192.168.1.102',
    status: 'Success'
  },
  {
    id: 'log-3',
    timestamp: '2026-07-17T19:30:00Z',
    admin: 'System Operator',
    action: 'Deleted Booking',
    affectedResource: 'Booking Ref: EZ-8762',
    oldValue: 'Confirmed',
    newValue: 'Cancelled',
    ip: '10.0.0.12',
    status: 'Success'
  },
  {
    id: 'log-4',
    timestamp: '2026-07-17T19:42:00Z',
    admin: 'Alex Smith (Operator)',
    action: 'Added Operator Privilege',
    affectedResource: 'User ID: Sarah Connor',
    oldValue: 'Role: user',
    newValue: 'Role: operator',
    ip: '192.168.1.102',
    status: 'Success'
  }
];

export const activityService = {
  // Fetch activity logs lists
  async fetchLogs() {
    const stored = localStorage.getItem('ezpark_admin_audit_logs');
    if (!stored) {
      localStorage.setItem('ezpark_admin_audit_logs', JSON.stringify(DEFAULT_LOGS));
      return DEFAULT_LOGS;
    }
    return JSON.parse(stored);
  },

  // Record a new action into audit logs
  async logActivity(operatorName, action, affectedResource, oldValue = null, newValue = null) {
    const logs = await this.fetchLogs();
    const newEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      admin: operatorName || 'System Operator',
      action,
      affectedResource,
      oldValue: oldValue ? String(oldValue) : null,
      newValue: newValue ? String(newValue) : null,
      ip: '192.168.1.102', // Simulated Client IP address
      status: 'Success'
    };

    const updated = [newEntry, ...logs];
    localStorage.setItem('ezpark_admin_audit_logs', JSON.stringify(updated));
    return newEntry;
  }
};
