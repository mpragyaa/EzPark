import React from 'react';
import { Edit, Trash2, Eye, Plus } from 'lucide-react';

export default function ParkingTable({ lots, onAddClick, onEdit, onDelete, onView }) {
  return (
    <div className="admin-table-container">
      {/* Table controls row */}
      <div className="table-panel-header" style={{ padding: '1.25rem' }}>
        <h3 className="panel-title" style={{ margin: 0 }}>Facilities Directory</h3>
        <button 
          type="button" 
          className="btn-add-entity"
          onClick={onAddClick}
        >
          <Plus size={14} />
          <span>Add Facility</span>
        </button>
      </div>

      {/* Table responsive viewport wrapper */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Parking Name</th>
              <th>City</th>
              <th>Capacity</th>
              <th>Occupied</th>
              <th>Available</th>
              <th>Price/Hour</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot) => (
              <tr key={lot.id}>
                <td style={{ fontWeight: 700 }}>{lot.name}</td>
                <td>{lot.city}</td>
                <td>{lot.totalSlots} spaces</td>
                <td style={{ color: 'var(--text-muted)' }}>{lot.totalSlots - lot.availableSlots}</td>
                <td style={{ color: lot.availableSlots === 0 ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 600 }}>
                  {lot.availableSlots}
                </td>
                <td style={{ fontWeight: 600 }}>${lot.pricePerHour.toFixed(2)}</td>
                <td>
                  <span className={`admin-badge ${lot.isOpen ? 'open' : 'closed'}`}>
                    {lot.isOpen ? 'Open' : 'Closed'}
                  </span>
                </td>
                <td>
                  <div className="table-actions-row">
                    <button
                      type="button"
                      className="btn-table-action"
                      title="View Details"
                      onClick={() => onView(lot)}
                    >
                      <Eye size={12} />
                    </button>
                    <button
                      type="button"
                      className="btn-table-action"
                      title="Edit Facility"
                      onClick={() => onEdit(lot)}
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      type="button"
                      className="btn-table-action delete"
                      title="Delete Facility"
                      onClick={() => onDelete(lot.id)}
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
