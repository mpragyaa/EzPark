import React from 'react';
import { Power, Trash2 } from 'lucide-react';

export default function UsersTable({ users, onToggleStatus, onDelete }) {
  return (
    <div className="admin-table-container">
      <div className="table-panel-header" style={{ padding: '1.25rem' }}>
        <h3 className="panel-title" style={{ margin: 0 }}>Registered Customers</h3>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Total Bookings</th>
              <th>Account Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ fontWeight: 700 }}>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{user.bookingsCount} spaces booked</td>
                <td>
                  <span className={`admin-badge ${user.status === 'Active' ? 'open' : 'closed'}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions-row">
                    <button
                      type="button"
                      className="btn-table-action"
                      title={user.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                      onClick={() => onToggleStatus(user.id)}
                    >
                      <Power size={12} style={{ color: user.status === 'Active' ? 'var(--color-error)' : 'var(--color-success)' }} />
                    </button>
                    <button
                      type="button"
                      className="btn-table-action delete"
                      title="Delete User"
                      onClick={() => onDelete(user.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
