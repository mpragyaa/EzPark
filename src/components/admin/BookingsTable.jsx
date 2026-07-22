import React from 'react';
import { Eye, Trash2 } from 'lucide-react';

export default function BookingsTable({ bookings, onView, onCancel }) {
  return (
    <div className="admin-table-container">
      <div className="table-panel-header" style={{ padding: '1.25rem' }}>
        <h3 className="panel-title" style={{ margin: 0 }}>Reservations Log</h3>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Parking Facility</th>
              <th>Vehicle</th>
              <th>Arrival Window</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--color-accent)' }}>
                  {booking.id}
                </td>
                <td style={{ fontWeight: 600 }}>{booking.customerName}</td>
                <td>{booking.parkingLot}</td>
                <td style={{ textTransform: 'capitalize' }}>{booking.vehicleType}</td>
                <td>{booking.date} ({booking.time})</td>
                <td>
                  <span className={`admin-badge ${booking.status === 'Confirmed' ? 'open' : 'closed'}`}>
                    {booking.status}
                  </span>
                </td>
                <td>
                  <span className={`admin-badge ${booking.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}`}>
                    {booking.paymentStatus} (${booking.amount.toFixed(2)})
                  </span>
                </td>
                <td>
                  <div className="table-actions-row">
                    <button
                      type="button"
                      className="btn-table-action"
                      title="View Receipt"
                      onClick={() => onView(booking)}
                    >
                      <Eye size={12} />
                    </button>
                    <button
                      type="button"
                      className="btn-table-action delete"
                      title="Cancel Booking"
                      onClick={() => onCancel(booking.id)}
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
